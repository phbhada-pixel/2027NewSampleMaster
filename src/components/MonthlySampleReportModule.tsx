import React, { useState, useMemo, useEffect } from 'react';
import { clientStore } from '../services/clientStore';
import { SampleRecord, User, SubcenterMaster, VillageMaster, SampleTypeMaster } from '../types';
import {
  Calendar,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  Building2,
  Droplets,
  TestTube,
  Sparkles,
  FlaskConical,
  HeartPulse,
  Bug,
  RefreshCw,
  Eye,
  X,
  Layers,
  BarChart3,
  TrendingUp,
  Award,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { WaterBiologicalOverdueReportView } from './WaterBiologicalOverdueReportView';
import { MonthlySubcenterWaterPlanView } from './MonthlySubcenterWaterPlanView';
import { OfficialReportPdfModal, PdfTableColumn } from './OfficialReportPdfModal';

interface MonthlySampleReportModuleProps {
  currentUser: User;
  initialTab?: 'monthly' | 'progressive' | 'sample-type' | 'consolidated' | 'subcenter' | 'village' | 'trend' | 'water-overdue-3m' | 'monthly-water-subcenter';
  onNavigateToSampleEntry?: (sourceInfo: {
    sampleTypeId: string;
    subcenterId: string;
    villageId: string;
    sourceId: string;
    sourceName: string;
  }) => void;
}

// Result classification types per User Request Section C
export type ResultCategory = 'PENDING' | 'CERTIFIED' | 'UNCERTIFIED' | 'REQUIRES_CLASSIFICATION';

export interface DrillDownContext {
  title: string;
  subtitle: string;
  samples: SampleRecord[];
}

// Helper to classify samples into the 3 authoritative categories (plus safety guard)
export function classifySampleResult(sample: SampleRecord): ResultCategory {
  const res = (sample.result || '').trim();

  // 1. अप्राप्त: Laboratory report not yet received
  if (
    !res ||
    sample.status === 'Draft' ||
    sample.status === 'Collected' ||
    sample.status === 'Ready for Dispatch' ||
    sample.status === 'Dispatched' ||
    sample.status === 'Report Pending'
  ) {
    return 'PENDING';
  }

  // 2. अप्रमाणित: Unacceptable / Unfit / Substandard / Positive (Checked before CERTIFIED to prevent substring match on योग्य/प्रमाणित)
  if (
    res.includes('अयोग्य') ||
    res.includes('अप्रमाणित') ||
    res === 'पॉझिटिव्ह' ||
    res.toLowerCase().includes('positive') ||
    res.toLowerCase().includes('unfit') ||
    res.toLowerCase().includes('fail')
  ) {
    return 'UNCERTIFIED';
  }

  // 3. प्रमाणित: Acceptable / Certified / Fit / Negative
  if (
    res.includes('योग्य') ||
    res.includes('प्रमाणित') ||
    res === 'निगेटिव्ह' ||
    res.toLowerCase().includes('negative') ||
    res.toLowerCase().includes('fit') ||
    res.toLowerCase().includes('pass')
  ) {
    return 'CERTIFIED';
  }

  // 4. निकाल वर्गीकरण आवश्यक: Any unmapped status
  return 'REQUIRES_CLASSIFICATION';
}

export function getResultCategoryLabel(cat: ResultCategory): string {
  switch (cat) {
    case 'PENDING':
      return 'अप्राप्त';
    case 'CERTIFIED':
      return 'प्रमाणित';
    case 'UNCERTIFIED':
      return 'अप्रमाणित';
    case 'REQUIRES_CLASSIFICATION':
      return 'निकाल वर्गीकरण आवश्यक';
  }
}

const MONTHS_MARATHI = [
  { value: 1, label: 'जानेवारी (Jan)', name: 'जानेवारी' },
  { value: 2, label: 'फेब्रुवारी (Feb)', name: 'फेब्रुवारी' },
  { value: 3, label: 'मार्च (Mar)', name: 'मार्च' },
  { value: 4, label: 'एप्रिल (Apr)', name: 'एप्रिल' },
  { value: 5, label: 'मे (May)', name: 'मे' },
  { value: 6, label: 'जून (Jun)', name: 'जून' },
  { value: 7, label: 'जुलै (Jul)', name: 'जुलै' },
  { value: 8, label: 'ऑगस्ट (Aug)', name: 'ऑगस्ट' },
  { value: 9, label: 'सप्टेंबर (Sep)', name: 'सप्टेंबर' },
  { value: 10, label: 'ऑक्टोबर (Oct)', name: 'ऑक्टोबर' },
  { value: 11, label: 'नोव्हेंबर (Nov)', name: 'नोव्हेंबर' },
  { value: 12, label: 'डिसेंबर (Dec)', name: 'डिसेंबर' },
];

export const MonthlySampleReportModule: React.FC<MonthlySampleReportModuleProps> = ({
  currentUser,
  initialTab = 'monthly',
  onNavigateToSampleEntry,
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return clientStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  // Authoritative master data from clientStore
  const allSamples = clientStore.getSamples();
  const subcenters = clientStore.getSubcenters();
  const villages = clientStore.getVillages();
  const sampleTypes = clientStore.getSampleTypes();

  // Primary Filters
  const currentYear = 2026;
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September by default
  const [progressiveStartMonth, setProgressiveStartMonth] = useState<number>(4); // April by default
  const [selectedTypeId, setSelectedTypeId] = useState<string>('ALL');
  const [selectedSubcenterId, setSelectedSubcenterId] = useState<string>('ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  // Active View Tab
  // 1: मासिक अहवाल, 2: प्रोग्रेसिव्ह अहवाल, 3: Sample Type-wise, 4: एकत्रित अहवाल, 5: उपकेंद्रनिहाय, 6: गावनिहाय, 7: मासिक ट्रेंड, 8: ३ महिने प्रलंबित पाणी स्त्रोत, 9: उपकेंद्रनिहाय मासिक पाणी यादी
  const [activeTab, setActiveTab] = useState<
    | 'monthly'
    | 'progressive'
    | 'sample-type'
    | 'consolidated'
    | 'subcenter'
    | 'village'
    | 'trend'
    | 'water-overdue-3m'
    | 'monthly-water-subcenter'
  >(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Consolidated Timeframe Toggle ('monthly' or 'progressive')
  const [consolidatedTimeframe, setConsolidatedTimeframe] = useState<'monthly' | 'progressive'>('monthly');

  // Expanded Subcenters for Accordion
  const [expandedSubcenters, setExpandedSubcenters] = useState<Record<string, boolean>>({
    'SC-LKH-01': true,
    'SC-BHD-01': true,
  });

  // Drill-down Modal State
  const [drillDown, setDrillDown] = useState<DrillDownContext | null>(null);
  const [drillSearchQuery, setDrillSearchQuery] = useState<string>('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Cascading Filter: Subcenter -> Village
  const availableVillages = useMemo(() => {
    if (selectedSubcenterId === 'ALL') return villages;
    return villages.filter((v) => v.subcenterId === selectedSubcenterId);
  }, [villages, selectedSubcenterId]);

  const handleSubcenterChange = (newScId: string) => {
    setSelectedSubcenterId(newScId);
    if (newScId !== 'ALL') {
      const vils = villages.filter((v) => v.subcenterId === newScId);
      if (selectedVillageId !== 'ALL' && !vils.some((v) => v.id === selectedVillageId)) {
        setSelectedVillageId('ALL');
      }
    }
  };

  const handleVillageChange = (newVilId: string) => {
    setSelectedVillageId(newVilId);
    if (newVilId !== 'ALL') {
      const v = villages.find((item) => item.id === newVilId);
      if (v && v.subcenterId && selectedSubcenterId === 'ALL') {
        setSelectedSubcenterId(v.subcenterId);
      }
    }
  };

  // Helper date calculators
  const monthName = MONTHS_MARATHI.find((m) => m.value === selectedMonth)?.name || `महिना ${selectedMonth}`;
  const progressiveStartName =
    MONTHS_MARATHI.find((m) => m.value === progressiveStartMonth)?.name || 'एप्रिल';

  // 1. Authoritative Samples Filtered by Subcenter and Village hierarchy
  const hierarchyFilteredSamples = useMemo(() => {
    return allSamples.filter((sample) => {
      // Must belong to village / subcenter if filtered
      if (selectedSubcenterId !== 'ALL') {
        // Resolve subcenter via sample.subcenterId or via village's subcenterId
        let sampleScId = sample.subcenterId;
        if (!sampleScId) {
          const vil = villages.find((v) => v.id === sample.villageId);
          sampleScId = vil?.subcenterId;
        }
        if (sampleScId !== selectedSubcenterId) return false;
      }

      if (selectedVillageId !== 'ALL' && sample.villageId !== selectedVillageId) {
        return false;
      }

      if (selectedTypeId !== 'ALL' && sample.sampleTypeId !== selectedTypeId) {
        return false;
      }

      if (resultFilter !== 'ALL') {
        const cat = classifySampleResult(sample);
        if (cat !== resultFilter) return false;
      }

      return true;
    });
  }, [allSamples, selectedSubcenterId, selectedVillageId, selectedTypeId, resultFilter, villages]);

  // 2. Monthly Dataset (Selected Year & Selected Month)
  const monthlySamples = useMemo(() => {
    return hierarchyFilteredSamples.filter((s) => {
      if (!s.collectionDate) return false;
      const sYear = parseInt(s.collectionDate.substring(0, 4), 10);
      const sMonth = parseInt(s.collectionDate.substring(5, 7), 10);
      return sYear === selectedYear && sMonth === selectedMonth;
    });
  }, [hierarchyFilteredSamples, selectedYear, selectedMonth]);

  // 3. Progressive Dataset (From Progressive Start Month to Selected Month in Financial Year)
  const progressiveSamples = useMemo(() => {
    return hierarchyFilteredSamples.filter((s) => {
      if (!s.collectionDate) return false;
      const sYear = parseInt(s.collectionDate.substring(0, 4), 10);
      const sMonth = parseInt(s.collectionDate.substring(5, 7), 10);

      // Financial year logic:
      // If progressive start is April (month 4) and selected month is >= 4:
      // belongs to [selectedYear-04 to selectedYear-selectedMonth]
      if (progressiveStartMonth <= selectedMonth) {
        return sYear === selectedYear && sMonth >= progressiveStartMonth && sMonth <= selectedMonth;
      } else {
        // Cross calendar year boundary (e.g. April 2026 to January 2027)
        if (sMonth >= progressiveStartMonth && sYear === selectedYear - 1) {
          return true;
        }
        if (sMonth <= selectedMonth && sYear === selectedYear) {
          return true;
        }
        return false;
      }
    });
  }, [hierarchyFilteredSamples, selectedYear, selectedMonth, progressiveStartMonth]);

  // Helper aggregation function for any sample list
  const aggregateCounts = (list: SampleRecord[]) => {
    let pending = 0;
    let certified = 0;
    let uncertified = 0;
    let unclassified = 0;

    for (const s of list) {
      const cat = classifySampleResult(s);
      if (cat === 'PENDING') pending++;
      else if (cat === 'CERTIFIED') certified++;
      else if (cat === 'UNCERTIFIED') uncertified++;
      else unclassified++;
    }

    return {
      total: list.length,
      pending,
      certified,
      uncertified,
      unclassified,
    };
  };

  const monthlyAggregates = useMemo(() => aggregateCounts(monthlySamples), [monthlySamples]);
  const progressiveAggregates = useMemo(() => aggregateCounts(progressiveSamples), [progressiveSamples]);

  // 4. Subcenter-Wise Aggregations
  const subcenterReportData = useMemo(() => {
    const list = activeTab === 'progressive' ? progressiveSamples : monthlySamples;

    return subcenters.map((sc) => {
      const scVillages = villages.filter((v) => v.subcenterId === sc.id);
      const scSamples = list.filter((s) => {
        if (s.subcenterId) return s.subcenterId === sc.id;
        const v = villages.find((item) => item.id === s.villageId);
        return v?.subcenterId === sc.id;
      });

      const villageDetails = scVillages.map((v) => {
        const vSamples = scSamples.filter((s) => s.villageId === v.id);
        return {
          village: v,
          samples: vSamples,
          counts: aggregateCounts(vSamples),
        };
      });

      return {
        subcenter: sc,
        villagesCount: scVillages.length,
        samples: scSamples,
        counts: aggregateCounts(scSamples),
        villages: villageDetails,
      };
    });
  }, [subcenters, villages, monthlySamples, progressiveSamples, activeTab]);

  // 5. Village-Wise Flat Aggregations (under respective Subcenter)
  const villageReportData = useMemo(() => {
    const list = activeTab === 'progressive' ? progressiveSamples : monthlySamples;

    return villages
      .map((v) => {
        const sc = subcenters.find((s) => s.id === v.subcenterId) || {
          id: 'SC-UNKNOWN',
          subcenterName: v.subcenterName || v.subcenter || 'अनिर्दिष्ट',
        };
        const vSamples = list.filter((s) => s.villageId === v.id);
        return {
          village: v,
          subcenter: sc,
          samples: vSamples,
          counts: aggregateCounts(vSamples),
        };
      })
      .filter((item) => {
        if (selectedSubcenterId !== 'ALL' && item.subcenter.id !== selectedSubcenterId) {
          return false;
        }
        if (selectedVillageId !== 'ALL' && item.village.id !== selectedVillageId) {
          return false;
        }
        return true;
      });
  }, [villages, subcenters, monthlySamples, progressiveSamples, activeTab, selectedSubcenterId, selectedVillageId]);

  // 6. Consolidated All-Sample Matrix (Consolidated Monthly / Progressive)
  const consolidatedMatrix = useMemo(() => {
    const list =
      activeTab === 'progressive' ||
      (activeTab === 'consolidated' && consolidatedTimeframe === 'progressive')
        ? progressiveSamples
        : monthlySamples;

    return villages
      .map((v) => {
        const sc = subcenters.find((s) => s.id === v.subcenterId) || {
          id: 'SC-UNKNOWN',
          subcenterName: v.subcenterName || v.subcenter || 'अनिर्दिष्ट',
        };

        const vSamples = list.filter((s) => s.villageId === v.id);

        // Individual Sample Types
        const waterBio = vSamples.filter((s) => s.sampleTypeId === 'ST-001');
        const waterChem = vSamples.filter((s) => s.sampleTypeId === 'ST-002');
        const salt = vSamples.filter((s) => s.sampleTypeId === 'ST-003');
        const tcl = vSamples.filter((s) => s.sampleTypeId === 'ST-004');
        const measles = vSamples.filter((s) => s.sampleTypeId === 'ST-005');
        const dengue = vSamples.filter((s) => s.sampleTypeId === 'ST-006');

        return {
          village: v,
          subcenter: sc,
          waterBioCount: waterBio.length,
          waterChemCount: waterChem.length,
          saltCount: salt.length,
          tclCount: tcl.length,
          measlesCount: measles.length,
          dengueCount: dengue.length,
          counts: aggregateCounts(vSamples),
          samples: vSamples,
        };
      })
      .filter((row) => {
        if (selectedSubcenterId !== 'ALL' && row.subcenter.id !== selectedSubcenterId) {
          return false;
        }
        if (selectedVillageId !== 'ALL' && row.village.id !== selectedVillageId) {
          return false;
        }
        return true;
      });
  }, [
    villages,
    subcenters,
    monthlySamples,
    progressiveSamples,
    activeTab,
    consolidatedTimeframe,
    selectedSubcenterId,
    selectedVillageId,
  ]);

  // 7. Sample-Type Breakdown Data
  const sampleTypeBreakdown = useMemo(() => {
    const list = activeTab === 'progressive' ? progressiveSamples : monthlySamples;

    return sampleTypes.map((st) => {
      const typeSamples = list.filter((s) => s.sampleTypeId === st.id);
      return {
        sampleType: st,
        counts: aggregateCounts(typeSamples),
        samples: typeSamples,
      };
    });
  }, [sampleTypes, monthlySamples, progressiveSamples, activeTab]);

  // 8. Monthly Financial Year Trend (April to March)
  const monthlyTrendData = useMemo(() => {
    const monthsOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    let runningCumulative = 0;

    return monthsOrder.map((mNum) => {
      const mYear = mNum >= 4 ? selectedYear : selectedYear + 1;
      const mInfo = MONTHS_MARATHI.find((m) => m.value === mNum)!;

      const mSamples = hierarchyFilteredSamples.filter((s) => {
        if (!s.collectionDate) return false;
        const sYear = parseInt(s.collectionDate.substring(0, 4), 10);
        const sMonth = parseInt(s.collectionDate.substring(5, 7), 10);
        return sYear === mYear && sMonth === mNum;
      });

      const counts = aggregateCounts(mSamples);
      runningCumulative += counts.total;

      return {
        monthNumber: mNum,
        year: mYear,
        monthName: mInfo.name,
        counts,
        cumulativeTotal: runningCumulative,
        samples: mSamples,
        isCurrentSelected: mNum === selectedMonth && mYear === selectedYear,
      };
    });
  }, [hierarchyFilteredSamples, selectedYear, selectedMonth]);

  // 9. Reconciliation Mathematical Verification Check
  const reconciliationCheck = useMemo(() => {
    const activeDataset = activeTab === 'progressive' ? progressiveSamples : monthlySamples;
    const totalActive = activeDataset.length;

    // Check 1: Sample Type breakdown sum == Total
    const sampleTypeSum = sampleTypeBreakdown.reduce((acc, st) => acc + st.counts.total, 0);

    // Check 2: Subcenter sum == Total
    const subcenterSum = subcenterReportData.reduce((acc, sc) => acc + sc.counts.total, 0);

    // Check 3: Village sum == Total
    const villageSum = villageReportData.reduce((acc, v) => acc + v.counts.total, 0);

    // Check 4: Result sum == Total
    const resultSum =
      monthlyAggregates.pending +
      monthlyAggregates.certified +
      monthlyAggregates.uncertified +
      monthlyAggregates.unclassified;
    const progressiveResultSum =
      progressiveAggregates.pending +
      progressiveAggregates.certified +
      progressiveAggregates.uncertified +
      progressiveAggregates.unclassified;

    const currentResultSum = activeTab === 'progressive' ? progressiveResultSum : resultSum;

    const isMatch =
      totalActive === sampleTypeSum &&
      totalActive === subcenterSum &&
      totalActive === villageSum &&
      totalActive === currentResultSum;

    return {
      isMatch,
      totalActive,
      sampleTypeSum,
      subcenterSum,
      villageSum,
      currentResultSum,
      unclassifiedCount: activeTab === 'progressive' ? progressiveAggregates.unclassified : monthlyAggregates.unclassified,
    };
  }, [
    activeTab,
    progressiveSamples,
    monthlySamples,
    sampleTypeBreakdown,
    subcenterReportData,
    villageReportData,
    monthlyAggregates,
    progressiveAggregates,
  ]);

  // PDF Configuration Builder for Official Government Health Report
  const pdfDataConfig = useMemo(() => {
    const isProgressivePeriod =
      activeTab === 'progressive' ||
      (activeTab === 'consolidated' && consolidatedTimeframe === 'progressive');
    const activeDataset = isProgressivePeriod ? progressiveSamples : monthlySamples;
    const totals = aggregateCounts(activeDataset);
    const periodLabel = isProgressivePeriod
      ? `${progressiveStartName} ते ${monthName} ${selectedYear}`
      : `${monthName} ${selectedYear}`;

    let title = 'मासिक नमुना अहवाल व प्रयोगशाळा निकाल विवरण';
    const subtitle = 'प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर — सार्वजनिक आरोग्य विभाग';
    let columns: PdfTableColumn[] = [];
    let rows: any[] = [];
    const orientation: 'portrait' | 'landscape' = 'landscape';

    const filterDetails = [
      { label: 'कालावधी', value: periodLabel },
      { label: 'वर्ष', value: `${selectedYear}` },
      {
        label: 'उपकेंद्र',
        value:
          selectedSubcenterId === 'ALL'
            ? 'सर्व उपकेंद्रे'
            : subcenters.find((s) => s.id === selectedSubcenterId)?.subcenterName || selectedSubcenterId,
      },
      {
        label: 'गाव',
        value:
          selectedVillageId === 'ALL'
            ? 'सर्व गावे'
            : villages.find((v) => v.id === selectedVillageId)?.name || selectedVillageId,
      },
      {
        label: 'नमुना प्रकार',
        value:
          selectedTypeId === 'ALL'
            ? 'सर्व प्रकार'
            : sampleTypes.find((t) => t.id === selectedTypeId)?.marathiName || selectedTypeId,
      },
      {
        label: 'निकाल वर्गवारी',
        value:
          resultFilter === 'ALL'
            ? 'सर्व'
            : getResultCategoryLabel(resultFilter as ResultCategory),
      },
    ];

    const passPercent =
      totals.total > 0 && totals.certified + totals.uncertified > 0
        ? Math.round((totals.certified / (totals.certified + totals.uncertified)) * 100)
        : 0;

    const summaryStats = [
      { label: 'एकूण नमुने', value: totals.total, colorClass: 'text-slate-900' },
      { label: 'निकाल अप्राप्त (Pending)', value: totals.pending, colorClass: 'text-amber-700' },
      { label: 'प्रमाणित / योग्य (Fit)', value: totals.certified, colorClass: 'text-emerald-700' },
      { label: 'अप्रमाणित / अयोग्य (Unfit)', value: totals.uncertified, colorClass: 'text-rose-700' },
      { label: 'गुणवत्ता / पास %', value: `${passPercent}%`, colorClass: 'text-blue-700' },
    ];

    if (activeTab === 'subcenter') {
      title = `उपकेंद्रनिहाय नमुना संकलन व गुणवत्ता अहवाल (${periodLabel})`;
      columns = [
        { header: 'उपकेंद्र नाव', accessor: 'subcenterName', width: '160px' },
        { header: 'गावे संख्या', accessor: 'villagesCount', align: 'center', width: '90px' },
        { header: 'एकूण नमुने', accessor: 'total', align: 'center', width: '90px' },
        { header: 'अप्राप्त (Pending)', accessor: 'pending', align: 'center', width: '110px' },
        { header: 'प्रमाणित (Fit)', accessor: 'certified', align: 'center', width: '100px' },
        { header: 'अप्रमाणित (Unfit)', accessor: 'uncertified', align: 'center', width: '110px' },
        { header: 'प्रमाणित टक्केवारी (%)', accessor: 'percentage', align: 'center', width: '130px' },
      ];
      rows = subcenterReportData.map((d) => {
        const tested = d.counts.certified + d.counts.uncertified;
        const pct = tested > 0 ? `${Math.round((d.counts.certified / tested) * 100)}%` : '—';
        return {
          subcenterName: d.subcenter.subcenterName,
          villagesCount: d.villagesCount,
          total: d.counts.total,
          pending: d.counts.pending,
          certified: d.counts.certified,
          uncertified: d.counts.uncertified,
          percentage: pct,
        };
      });
    } else if (activeTab === 'village') {
      title = `गावनिहाय नमुना संकलन व तपासणी अहवाल (${periodLabel})`;
      columns = [
        { header: 'गाव नाव', accessor: 'villageName', width: '150px' },
        { header: 'उपकेंद्र', accessor: 'subcenterName', width: '130px' },
        { header: 'एकूण नमुने', accessor: 'total', align: 'center', width: '80px' },
        { header: 'अप्राप्त (Pending)', accessor: 'pending', align: 'center', width: '100px' },
        { header: 'प्रमाणित (Fit)', accessor: 'certified', align: 'center', width: '90px' },
        { header: 'अप्रमाणित (Unfit)', accessor: 'uncertified', align: 'center', width: '100px' },
        { header: 'गुणवत्ता %', accessor: 'percentage', align: 'center', width: '90px' },
      ];
      rows = villageReportData.map((d) => {
        const tested = d.counts.certified + d.counts.uncertified;
        const pct = tested > 0 ? `${Math.round((d.counts.certified / tested) * 100)}%` : '—';
        return {
          villageName: d.village.name,
          subcenterName: d.subcenter.subcenterName,
          total: d.counts.total,
          pending: d.counts.pending,
          certified: d.counts.certified,
          uncertified: d.counts.uncertified,
          percentage: pct,
        };
      });
    } else if (activeTab === 'consolidated') {
      title = `एकत्रित सर्व नमुना प्रकार मॅट्रिक्स अहवाल (${periodLabel})`;
      columns = [
        { header: 'गाव', accessor: 'villageName', width: '120px' },
        { header: 'उपकेंद्र', accessor: 'subcenterName', width: '100px' },
        { header: 'पाणी (जैविक)', accessor: 'waterBioCount', align: 'center', width: '75px' },
        { header: 'पाणी (रसायन)', accessor: 'waterChemCount', align: 'center', width: '75px' },
        { header: 'मीठ (SLT)', accessor: 'saltCount', align: 'center', width: '65px' },
        { header: 'टीसीएल (TCL)', accessor: 'tclCount', align: 'center', width: '65px' },
        { header: 'गोवर (MSL)', accessor: 'measlesCount', align: 'center', width: '65px' },
        { header: 'डेंग्यू (DNG)', accessor: 'dengueCount', align: 'center', width: '65px' },
        { header: 'एकूण', accessor: 'total', align: 'center', width: '60px' },
        { header: 'प्रमाणित', accessor: 'certified', align: 'center', width: '65px' },
        { header: 'अप्रमाणित', accessor: 'uncertified', align: 'center', width: '65px' },
        { header: 'अप्राप्त', accessor: 'pending', align: 'center', width: '65px' },
      ];
      rows = consolidatedMatrix.map((d) => ({
        villageName: d.village.name,
        subcenterName: d.subcenter.subcenterName,
        waterBioCount: d.waterBioCount,
        waterChemCount: d.waterChemCount,
        saltCount: d.saltCount,
        tclCount: d.tclCount,
        measlesCount: d.measlesCount,
        dengueCount: d.dengueCount,
        total: d.counts.total,
        certified: d.counts.certified,
        uncertified: d.counts.uncertified,
        pending: d.counts.pending,
      }));
    } else if (activeTab === 'trend') {
      title = `वार्षिक नमुना कल व तुलनात्मक प्रगती अहवाल (एप्रिल ते मार्च ${selectedYear})`;
      columns = [
        { header: 'महिना', accessor: 'monthName', width: '130px' },
        { header: 'संकलित नमुने', accessor: 'monthlyTotal', align: 'center', width: '90px' },
        { header: 'अप्राप्त (Pending)', accessor: 'pending', align: 'center', width: '100px' },
        { header: 'प्रमाणित (Fit)', accessor: 'certified', align: 'center', width: '90px' },
        { header: 'अप्रमाणित (Unfit)', accessor: 'uncertified', align: 'center', width: '100px' },
        { header: 'प्रोग्रेसिव्ह एकूण', accessor: 'cumulativeTotal', align: 'center', width: '110px' },
        { header: 'गुणवत्ता %', accessor: 'percentage', align: 'center', width: '90px' },
      ];
      rows = monthlyTrendData.map((d) => {
        const tested = d.counts.certified + d.counts.uncertified;
        const pct = tested > 0 ? `${Math.round((d.counts.certified / tested) * 100)}%` : '—';
        return {
          monthName: d.monthName,
          monthlyTotal: d.counts.total,
          pending: d.counts.pending,
          certified: d.counts.certified,
          uncertified: d.counts.uncertified,
          cumulativeTotal: d.cumulativeTotal,
          percentage: pct,
        };
      });
    } else {
      // Default: monthly or progressive or sample-type
      title = isProgressivePeriod
        ? `प्रोग्रेसिव्ह नमुना संकलन व तपासणी अहवाल (${periodLabel})`
        : `मासिक नमुना संकलन व प्रयोगशाळा निकाल अहवाल (${periodLabel})`;
      columns = [
        { header: 'नमुना प्रकार', accessor: 'typeName', width: '180px' },
        { header: 'नमुना कोड', accessor: 'codePrefix', align: 'center', width: '90px' },
        { header: 'एकूण संकलित', accessor: 'total', align: 'center', width: '100px' },
        { header: 'अप्राप्त (Pending)', accessor: 'pending', align: 'center', width: '110px' },
        { header: 'प्रमाणित (Fit / योग्य)', accessor: 'certified', align: 'center', width: '120px' },
        { header: 'अप्रमाणित (Unfit / अयोग्य)', accessor: 'uncertified', align: 'center', width: '130px' },
        { header: 'प्रमाणित टक्केवारी (%)', accessor: 'percentage', align: 'center', width: '130px' },
      ];
      rows = sampleTypeBreakdown.map((d) => {
        const tested = d.counts.certified + d.counts.uncertified;
        const pct = tested > 0 ? `${Math.round((d.counts.certified / tested) * 100)}%` : '—';
        return {
          typeName: d.sampleType.marathiName,
          codePrefix: d.sampleType.codePrefix,
          total: d.counts.total,
          pending: d.counts.pending,
          certified: d.counts.certified,
          uncertified: d.counts.uncertified,
          percentage: pct,
        };
      });
    }

    return {
      title,
      subtitle,
      periodText: periodLabel,
      filterDetails,
      summaryStats,
      columns,
      rows,
      orientation,
    };
  }, [
    activeTab,
    consolidatedTimeframe,
    progressiveSamples,
    monthlySamples,
    subcenterReportData,
    villageReportData,
    consolidatedMatrix,
    sampleTypeBreakdown,
    monthlyTrendData,
    progressiveStartName,
    monthName,
    selectedYear,
    selectedSubcenterId,
    selectedVillageId,
    selectedTypeId,
    resultFilter,
    subcenters,
    villages,
    sampleTypes,
  ]);

  // Handle Drill-Down Modal
  const openDrillDown = (title: string, subtitle: string, samples: SampleRecord[]) => {
    setDrillDown({
      title,
      subtitle,
      samples,
    });
    setDrillSearchQuery('');
  };

  const closeDrillDown = () => {
    setDrillDown(null);
  };

  // Filtered Drill-down list for search
  const filteredDrillSamples = useMemo(() => {
    if (!drillDown) return [];
    if (!drillSearchQuery.trim()) return drillDown.samples;
    const q = drillSearchQuery.toLowerCase().trim();
    return drillDown.samples.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        (s.villageName && s.villageName.toLowerCase().includes(q)) ||
        (s.sourceName && s.sourceName.toLowerCase().includes(q)) ||
        (s.sampleTypeName && s.sampleTypeName.toLowerCase().includes(q)) ||
        (s.patientName && s.patientName.toLowerCase().includes(q)) ||
        (s.shopOrInstitutionName && s.shopOrInstitutionName.toLowerCase().includes(q)) ||
        (s.result && s.result.toLowerCase().includes(q))
    );
  }, [drillDown, drillSearchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const isProgressivePeriod =
      activeTab === 'progressive' ||
      (activeTab === 'consolidated' && consolidatedTimeframe === 'progressive');
    const activeDataset = isProgressivePeriod ? progressiveSamples : monthlySamples;
    const totals = aggregateCounts(activeDataset);

    const periodLabel = isProgressivePeriod
      ? `प्रोग्रेसिव्ह_${progressiveStartName}_ते_${monthName}_${selectedYear}`
      : `मासिक_${monthName}_${selectedYear}`;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `महाराष्ट्र शासन,सार्वजनिक आरोग्य विभाग\n`;
    csvContent += `प्राथमिक आरोग्य केंद्र भादा,ता. औसा,जि. लातूर\n`;
    csvContent += `अहवाल प्रकार,${isProgressivePeriod ? 'प्रोग्रेसिव्ह प्रगती अहवाल' : 'मासिक नमुना अहवाल'}\n`;
    csvContent += `कालावधी,${periodLabel}\n`;
    csvContent += `दिनांक,${new Date().toLocaleDateString('mr-IN')}\n\n`;

    if (activeTab === 'consolidated') {
      csvContent += `अ.क्र.,उपकेंद्र,गाव,पाणी BIO,पाणी Chemical,मीठ,TCL,गोवर,डेंग्यू,एकूण नमुने,अप्राप्त,प्रमाणित,अप्रमाणित\n`;
      consolidatedMatrix.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.subcenter.subcenterName}","${r.village.name}",${r.waterBioCount},${r.waterChemCount},${r.saltCount},${r.tclCount},${r.measlesCount},${r.dengueCount},${r.counts.total},${r.counts.pending},${r.counts.certified},${r.counts.uncertified}\n`;
      });
      csvContent += `,,एकूण बेरीज,,,,,${totals.total},${totals.pending},${totals.certified},${totals.uncertified}\n`;
    } else {
      csvContent += `अ.क्र.,उपकेंद्र,गाव,एकूण नमुने,अप्राप्त,प्रमाणित,अप्रमाणित\n`;
      villageReportData.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.subcenter.subcenterName}","${r.village.name}",${r.counts.total},${r.counts.pending},${r.counts.certified},${r.counts.uncertified}\n`;
      });
      csvContent += `,,एकूण बेरीज,${totals.total},${totals.pending},${totals.certified},${totals.uncertified}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHC_Bhada_Monthly_Report_${periodLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel (.xls)
  const handleExportExcel = () => {
    const isProgressivePeriod =
      activeTab === 'progressive' ||
      (activeTab === 'consolidated' && consolidatedTimeframe === 'progressive');
    const totals = aggregateCounts(isProgressivePeriod ? progressiveSamples : monthlySamples);

    const periodLabel = isProgressivePeriod
      ? `प्रोग्रेसिव्ह_${progressiveStartName}_ते_${monthName}_${selectedYear}`
      : `मासिक_${monthName}_${selectedYear}`;

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
          th { background-color: #065f46; color: white; border: 1px solid #999; padding: 6px; text-align: center; }
          td { border: 1px solid #ccc; padding: 5px; text-align: center; }
          .left { text-align: left; }
          .bold { font-weight: bold; }
          .header { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          महाराष्ट्र शासन - सार्वजनिक आरोग्य विभाग<br/>
          प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर<br/>
          नमुना मासिक व प्रोग्रेसिव्ह प्रगती अहवाल (${periodLabel})
        </div>
        <table>
          <thead>
            <tr>
              <th>अ.क्र.</th>
              <th>उपकेंद्र</th>
              <th>गाव</th>
              <th>पाणी BIO</th>
              <th>पाणी Chemical</th>
              <th>मीठ</th>
              <th>TCL</th>
              <th>गोवर</th>
              <th>डेंग्यू</th>
              <th>एकूण नमुने</th>
              <th>अप्राप्त</th>
              <th>प्रमाणित</th>
              <th>अप्रमाणित</th>
            </tr>
          </thead>
          <tbody>
    `;

    consolidatedMatrix.forEach((r, idx) => {
      tableHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td class="left">${r.subcenter.subcenterName}</td>
          <td class="left">${r.village.name}</td>
          <td>${r.waterBioCount}</td>
          <td>${r.waterChemCount}</td>
          <td>${r.saltCount}</td>
          <td>${r.tclCount}</td>
          <td>${r.measlesCount}</td>
          <td>${r.dengueCount}</td>
          <td class="bold">${r.counts.total}</td>
          <td>${r.counts.pending}</td>
          <td>${r.counts.certified}</td>
          <td>${r.counts.uncertified}</td>
        </tr>
      `;
    });

    tableHtml += `
        <tr style="background-color: #e2e8f0; font-weight: bold;">
          <td colspan="3">एकूण बेरीज</td>
          <td colspan="6">-</td>
          <td>${totals.total}</td>
          <td>${totals.pending}</td>
          <td>${totals.certified}</td>
          <td>${totals.uncertified}</td>
        </tr>
      </tbody>
      </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHC_Bhada_Report_${periodLabel}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeAggregates = activeTab === 'progressive' ? progressiveAggregates : monthlyAggregates;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Official Government Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>महाराष्ट्र शासन • सार्वजनिक आरोग्य विभाग • जि.प. लातूर</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर
            </h1>
            <p className="text-sm font-semibold text-emerald-900 mt-0.5">
              नमुना मासिक व प्रोग्रेसिव्ह प्रगती अहवाल (Monthly &amp; Progressive Cumulative Sample Report)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              उपकेंद्रनिहाय • गावनिहाय • नमुना प्रकारनिहाय • प्रयोगशाळा निकाल गुणवत्ता वर्गवारी
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow transition-all active:scale-95 cursor-pointer"
              title="अधिकृत शासकीय नमुना अहवाल PDF स्वरूपात जनरेट व डाऊनलोड करा"
            >
              <FileText className="w-3.5 h-3.5 text-rose-200" />
              <span>शासकीय अहवाल PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-sm transition-all cursor-pointer"
              title="CSV स्वरूपात निर्यात करा"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV निर्यात</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 shadow-sm transition-all cursor-pointer"
              title="Excel स्वरूपात निर्यात करा"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel निर्यात</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
              title="अहवाल मुद्रित करा / Print Register"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट करा</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Sticky Friendly) */}
        <div className="mt-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 print:hidden">
          {/* 1. Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">१. वर्ष (Year)</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value={2025}>२०२५ (2025)</option>
              <option value={2026}>२०२६ (2026)</option>
              <option value={2027}>२०२७ (2027)</option>
            </select>
          </div>

          {/* 2. Month */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">२. महिना (Month)</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {MONTHS_MARATHI.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sample Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">३. नमुना प्रकार</label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">सर्व नमुने (एकत्रित)</option>
              {sampleTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.marathiName}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Subcenter (Cascading) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">४. उपकेंद्र (Subcenter)</label>
            <select
              value={selectedSubcenterId}
              onChange={(e) => handleSubcenterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">सर्व उपकेंद्रे</option>
              {subcenters.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.subcenterName}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Village (Cascaded) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">५. गाव (Village)</label>
            <select
              value={selectedVillageId}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">
                {selectedSubcenterId === 'ALL' ? 'सर्व गावे' : 'उपकेंद्रातील सर्व गावे'}
              </option>
              {availableVillages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Result Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">६. निकाल स्थिती</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">सर्व स्थिती (All)</option>
              <option value="CERTIFIED">प्रमाणित (Certified / Fit)</option>
              <option value="PENDING">अप्राप्त (Pending Report)</option>
              <option value="UNCERTIFIED">अप्रमाणित (Unfit / Substandard)</option>
              <option value="REQUIRES_CLASSIFICATION">निकाल वर्गीकरण आवश्यक</option>
            </select>
          </div>
        </div>

        {/* Period Details Ribbon */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-bold text-[11px] border border-emerald-200">
              <Calendar className="w-3.5 h-3.5" />
              मासिक कालावधी: {monthName} {selectedYear}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-800 px-2.5 py-1 rounded-md font-bold text-[11px] border border-cyan-200">
              <TrendingUp className="w-3.5 h-3.5" />
              प्रोग्रेसिव्ह कालावधी: {progressiveStartName} {selectedYear} ते {monthName} {selectedYear}
            </span>
          </div>

          {/* Progressive Start Configurator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 print:hidden">
            <span>प्रोग्रेसिव्ह प्रारंभ महिना:</span>
            <select
              value={progressiveStartMonth}
              onChange={(e) => setProgressiveStartMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800"
            >
              <option value={4}>एप्रिल (Financial Year Start)</option>
              <option value={1}>जानेवारी (Calendar Year Start)</option>
              <option value={selectedMonth}>केवळ चालू महिना</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mathematical Reconciliation Live Verification Widget */}
      <div
        className={`rounded-xl p-3 border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          reconciliationCheck.isMatch
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {reconciliationCheck.isMatch ? (
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {reconciliationCheck.isMatch
                ? 'माहिती सुसंगतता पडताळणी: १००% अचूक जुळणी (Data Reconciled)'
                : 'माहिती सुसंगतता पडताळणी चेतावणी (Reconciliation Warning)'}
            </span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              नमुना प्रकार बेरीज ({reconciliationCheck.sampleTypeSum}) = उपकेंद्र बेरीज ({reconciliationCheck.subcenterSum}) = गाव बेरीज ({reconciliationCheck.villageSum}) = एकूण प्रत्यक्ष नमुने ({reconciliationCheck.totalActive})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="px-2 py-0.5 bg-white rounded border border-slate-200 shadow-2xs">
            एकूण नमुने: {reconciliationCheck.totalActive}
          </span>
          {reconciliationCheck.unclassifiedCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300">
              वर्गीकरण आवश्यक: {reconciliationCheck.unclassifiedCount}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards (Section J - Sample-Type Breakdown & Totals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Samples */}
        <div
          onClick={() =>
            openDrillDown(
              `${activeTab === 'progressive' ? 'प्रोग्रेसिव्ह' : 'मासिक'} - एकूण नमुने`,
              `कालावधी: ${activeTab === 'progressive' ? `${progressiveStartName} ते ${monthName}` : monthName} ${selectedYear}`,
              activeTab === 'progressive' ? progressiveSamples : monthlySamples
            )
          }
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>एकूण नमुने</span>
            <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeAggregates.total}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{activeTab === 'progressive' ? 'Progressive Total' : 'Monthly Total'}</span>
            <span className="text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
              तपासा <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Pending Samples */}
        <div
          onClick={() => {
            const list = (activeTab === 'progressive' ? progressiveSamples : monthlySamples).filter(
              (s) => classifySampleResult(s) === 'PENDING'
            );
            openDrillDown(
              `अप्राप्त अहवाल नमुने (${list.length})`,
              `कालावधी: ${activeTab === 'progressive' ? `${progressiveStartName} ते ${monthName}` : monthName} ${selectedYear}`,
              list
            );
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1">
            <span>अप्राप्त (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-800">{activeAggregates.pending}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>
              {activeAggregates.total > 0
                ? `${Math.round((activeAggregates.pending / activeAggregates.total) * 100)}% नमुने बाकी`
                : 'अहवाल बाकी'}
            </span>
            <span className="text-amber-700 font-bold group-hover:underline flex items-center gap-0.5">
              यादी <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Certified Samples */}
        <div
          onClick={() => {
            const list = (activeTab === 'progressive' ? progressiveSamples : monthlySamples).filter(
              (s) => classifySampleResult(s) === 'CERTIFIED'
            );
            openDrillDown(
              `प्रमाणित नमुने (${list.length})`,
              `पिण्यास योग्य / मानक आयोडिन / TCL मानक / निगेटिव्ह सेरॉलॉजी`,
              list
            );
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
            <span>प्रमाणित (Certified / Fit)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{activeAggregates.certified}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>
              {activeAggregates.total > 0
                ? `${Math.round((activeAggregates.certified / activeAggregates.total) * 100)}% समाधानकारक`
                : 'प्रमाणित दर्जा'}
            </span>
            <span className="text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
              यादी <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Uncertified Samples */}
        <div
          onClick={() => {
            const list = (activeTab === 'progressive' ? progressiveSamples : monthlySamples).filter(
              (s) => classifySampleResult(s) === 'UNCERTIFIED'
            );
            openDrillDown(
              `अप्रमाणित नमुने (${list.length})`,
              `पिण्यास अयोग्य / निकृष्ट / पॉझिटिव्ह सेरॉलॉजी`,
              list
            );
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-1">
            <span>अप्रमाणित (Unfit / Positive)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800">{activeAggregates.uncertified}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>
              {activeAggregates.total > 0
                ? `${Math.round((activeAggregates.uncertified / activeAggregates.total) * 100)}% अयोग्य`
                : 'कारवाई आवश्यक'}
            </span>
            <span className="text-rose-700 font-bold group-hover:underline flex items-center gap-0.5">
              यादी <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Header (Section R - Suggested tabs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/80 p-1 text-xs font-bold text-slate-600 scrollbar-none">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'monthly'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            १. मासिक अहवाल ({monthName})
          </button>
          <button
            onClick={() => setActiveTab('progressive')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'progressive'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            २. प्रोग्रेसिव्ह प्रगती अहवाल ({progressiveStartName} ते {monthName})
          </button>
          <button
            onClick={() => setActiveTab('sample-type')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'sample-type'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            ३. Sample Type-wise
          </button>
          <button
            onClick={() => setActiveTab('consolidated')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'consolidated'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            ४. एकत्रित अहवाल (Consolidated)
          </button>
          <button
            onClick={() => setActiveTab('subcenter')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'subcenter'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            ५. उपकेंद्रनिहाय
          </button>
          <button
            onClick={() => setActiveTab('village')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'village'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            ६. गावनिहाय
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'trend'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            ७. मासिक ट्रेंड व प्रगती
          </button>
          <button
            onClick={() => setActiveTab('water-overdue-3m')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'water-overdue-3m'
                ? 'bg-rose-800 text-white shadow-sm font-black'
                : 'hover:bg-rose-50 text-rose-800 font-bold'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>८. पाणी स्रोत - ३ महिने प्रलंबित</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly-water-subcenter')}
            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'monthly-water-subcenter'
                ? 'bg-teal-800 text-white shadow-sm font-black'
                : 'hover:bg-teal-50 text-teal-800 font-bold'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            <span>९. उपकेंद्रनिहाय मासिक पाणी यादी</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1 & TAB 2: MONTHLY & PROGRESSIVE CORE VIEWS */}
      {/* ========================================================================= */}
      {(activeTab === 'monthly' || activeTab === 'progressive') && (
        <div className="space-y-6">
          {/* Subcenter Summary Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    उपकेंद्रनिहाय {activeTab === 'progressive' ? 'प्रोग्रेसिव्ह' : 'मासिक'} सारांश (Subcenter-Wise Summary)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  प्रत्येक उपकेंद्रावर क्लिक करून अंतर्गत गावांची आकडेवारी पहा (Expandable Drill-down)
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                कालावधी: {activeTab === 'progressive' ? `${progressiveStartName} ते ${monthName}` : monthName} {selectedYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center">अ.क्र.</th>
                    <th className="py-2.5 px-3">उपकेंद्र (Subcenter)</th>
                    <th className="py-2.5 px-3 text-center">गावांची संख्या</th>
                    <th className="py-2.5 px-3 text-center bg-slate-200/50">एकूण नमुने</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">अप्राप्त (Pending)</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">प्रमाणित (Certified)</th>
                    <th className="py-2.5 px-3 text-center text-rose-700">अप्रमाणित (Uncertified)</th>
                    <th className="py-2.5 px-3 text-center">तपशील</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {subcenterReportData.map((scItem, idx) => {
                    const isExpanded = !!expandedSubcenters[scItem.subcenter.id];
                    return (
                      <React.Fragment key={scItem.subcenter.id}>
                        <tr
                          onClick={() =>
                            setExpandedSubcenters((prev) => ({
                              ...prev,
                              [scItem.subcenter.id]: !prev[scItem.subcenter.id],
                            }))
                          }
                          className="hover:bg-slate-50 cursor-pointer font-medium transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{scItem.subcenter.subcenterName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({scItem.subcenter.subcenterCode})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-semibold">
                            {scItem.villagesCount} गावे
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDrillDown(
                                  `उपकेंद्र: ${scItem.subcenter.subcenterName} • एकूण नमुने`,
                                  `${activeTab === 'progressive' ? 'प्रोग्रेसिव्ह' : 'मासिक'} कालावधी`,
                                  scItem.samples
                                );
                              }}
                              className="px-2 py-0.5 rounded hover:bg-slate-200 underline decoration-slate-400"
                            >
                              {scItem.counts.total}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const list = scItem.samples.filter(
                                  (s) => classifySampleResult(s) === 'PENDING'
                                );
                                openDrillDown(
                                  `उपकेंद्र: ${scItem.subcenter.subcenterName} • अप्राप्त अहवाल`,
                                  `अहवाल बाकी असलेले नमुने`,
                                  list
                                );
                              }}
                              className="px-2 py-0.5 rounded hover:bg-amber-100"
                            >
                              {scItem.counts.pending}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const list = scItem.samples.filter(
                                  (s) => classifySampleResult(s) === 'CERTIFIED'
                                );
                                openDrillDown(
                                  `उपकेंद्र: ${scItem.subcenter.subcenterName} • प्रमाणित नमुने`,
                                  `पिण्यास योग्य / मानक आयोडीन / प्रमाणित TCL`,
                                  list
                                );
                              }}
                              className="px-2 py-0.5 rounded hover:bg-emerald-100"
                            >
                              {scItem.counts.certified}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-rose-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const list = scItem.samples.filter(
                                  (s) => classifySampleResult(s) === 'UNCERTIFIED'
                                );
                                openDrillDown(
                                  `उपकेंद्र: ${scItem.subcenter.subcenterName} • अप्रमाणित नमुने`,
                                  `पिण्यास अयोग्य / निकृष्ट दर्जा`,
                                  list
                                );
                              }}
                              className="px-2 py-0.5 rounded hover:bg-rose-100"
                            >
                              {scItem.counts.uncertified}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] text-emerald-700 font-semibold hover:underline">
                              {isExpanded ? 'बंद करा' : 'गावे पहा'}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Child Villages */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={8} className="p-0">
                              <div className="py-2 px-6 border-y border-slate-200/80 bg-emerald-50/20">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[11px] text-slate-500 font-bold border-b border-slate-200">
                                      <th className="py-1.5 px-3 text-left">गाव (Village)</th>
                                      <th className="py-1.5 px-3 text-center">एकूण नमुने</th>
                                      <th className="py-1.5 px-3 text-center text-amber-700">अप्राप्त</th>
                                      <th className="py-1.5 px-3 text-center text-emerald-700">प्रमाणित</th>
                                      <th className="py-1.5 px-3 text-center text-rose-700">अप्रमाणित</th>
                                      <th className="py-1.5 px-3 text-right">कृती</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200/60">
                                    {scItem.villages.map((vItem) => (
                                      <tr key={vItem.village.id} className="hover:bg-emerald-50/40">
                                        <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          {vItem.village.name}
                                        </td>
                                        <td className="py-2 px-3 text-center font-bold text-slate-900">
                                          <button
                                            onClick={() =>
                                              openDrillDown(
                                                `गाव: ${vItem.village.name} (उपकेंद्र: ${scItem.subcenter.subcenterName})`,
                                                `एकूण नमुने`,
                                                vItem.samples
                                              )
                                            }
                                            className="px-2 py-0.5 rounded hover:bg-slate-200"
                                          >
                                            {vItem.counts.total}
                                          </button>
                                        </td>
                                        <td className="py-2 px-3 text-center text-amber-800 font-semibold">
                                          {vItem.counts.pending}
                                        </td>
                                        <td className="py-2 px-3 text-center text-emerald-800 font-semibold">
                                          {vItem.counts.certified}
                                        </td>
                                        <td className="py-2 px-3 text-center text-rose-800 font-semibold">
                                          {vItem.counts.uncertified}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <button
                                            onClick={() =>
                                              openDrillDown(
                                                `गाव: ${vItem.village.name} • नमुने तपशील`,
                                                `उपकेंद्र: ${scItem.subcenter.subcenterName}`,
                                                vItem.samples
                                              )
                                            }
                                            className="text-[11px] text-emerald-700 font-bold hover:underline"
                                          >
                                            नमुने पहा →
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {/* Total Summary Row */}
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3 px-3 text-right">
                      एकूण बेरीज (Total):
                    </td>
                    <td className="py-3 px-3 text-center">{villages.length} गावे</td>
                    <td className="py-3 px-3 text-center text-sm font-black text-slate-950 bg-slate-200/50">
                      {activeAggregates.total}
                    </td>
                    <td className="py-3 px-3 text-center text-amber-800 font-bold">
                      {activeAggregates.pending}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-800 font-bold">
                      {activeAggregates.certified}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-800 font-bold">
                      {activeAggregates.uncertified}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Sample Type Breakdown Matrix (Section J) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>नमुना प्रकारनिहाय सारांश (Sample Type Breakdown)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                प्रत्येक नमुना प्रकारानुसार एकूण संकलन व प्रयोगशाळा निकाल स्थिती
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center">अ.क्र.</th>
                    <th className="py-2.5 px-3">नमुना प्रकार (Sample Type)</th>
                    <th className="py-2.5 px-3 text-center">विभाग</th>
                    <th className="py-2.5 px-3 text-center bg-slate-200/50 font-bold">एकूण नमुने</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">अप्राप्त (Pending)</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">प्रमाणित (Certified)</th>
                    <th className="py-2.5 px-3 text-center text-rose-700">अप्रमाणित (Uncertified)</th>
                    <th className="py-2.5 px-3 text-center">प्रमाणित %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {sampleTypeBreakdown.map((item, idx) => {
                    const tested = item.counts.certified + item.counts.uncertified;
                    const passRate = tested > 0 ? `${Math.round((item.counts.certified / tested) * 100)}%` : '-';

                    return (
                      <tr key={item.sampleType.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <span className="p-1 rounded bg-slate-100 text-emerald-700">
                            <Droplets className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div>{item.sampleType.marathiName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.sampleType.name} ({item.sampleType.codePrefix})
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.sampleType.department}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                          <button
                            onClick={() =>
                              openDrillDown(
                                `नमुना प्रकार: ${item.sampleType.marathiName}`,
                                `एकूण नमुने`,
                                item.samples
                              )
                            }
                            className="px-2 py-0.5 rounded hover:bg-slate-200 underline"
                          >
                            {item.counts.total}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-800">
                          {item.counts.pending}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                          {item.counts.certified}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-800">
                          {item.counts.uncertified}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-emerald-900">
                          {passRate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAMPLE TYPE-WISE SEPARATE INDEPENDENT REPORTS (Section H) */}
      {/* ========================================================================= */}
      {activeTab === 'sample-type' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-700" />
                  <span>स्वतंत्र नमुना प्रकार अहवाल (Sample-Type-Wise Independent Reports)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  खालीलपैकी कोणत्याही नमुना प्रकाराचा स्वतंत्र उपकेंद्र व गावनिहाय अहवाल निवडा
                </p>
              </div>

              {/* Sample Type Quick Switcher */}
              <div className="flex flex-wrap gap-1.5">
                {sampleTypes.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedTypeId(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedTypeId === st.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st.codePrefix}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTypeId('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTypeId === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  सर्व नमुने
                </button>
              </div>
            </div>
          </div>

          {/* Active Sample Type Report Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-sm text-slate-900">
                {selectedTypeId === 'ALL'
                  ? 'सर्व नमुना प्रकार एकत्रित अहवाल'
                  : sampleTypes.find((s) => s.id === selectedTypeId)?.marathiName}
              </div>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                कालावधी: {monthName} {selectedYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center">अ.क्र.</th>
                    <th className="py-2.5 px-3">उपकेंद्र (Subcenter)</th>
                    <th className="py-2.5 px-3">गाव (Village)</th>
                    <th className="py-2.5 px-3 text-center bg-slate-200/50 font-bold">एकूण नमुने</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">अप्राप्त (Pending)</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">प्रमाणित (Certified)</th>
                    <th className="py-2.5 px-3 text-center text-rose-700">अप्रमाणित (Uncertified)</th>
                    <th className="py-2.5 px-3 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {villageReportData.map((item, idx) => (
                    <tr key={item.village.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.subcenter.subcenterName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.village.name}</td>
                      <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                        {item.counts.total}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-800">
                        {item.counts.pending}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                        {item.counts.certified}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-800">
                        {item.counts.uncertified}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() =>
                            openDrillDown(
                              `गाव: ${item.village.name} • ${
                                selectedTypeId === 'ALL'
                                  ? 'सर्व नमुने'
                                  : sampleTypes.find((s) => s.id === selectedTypeId)?.marathiName
                              }`,
                              `उपकेंद्र: ${item.subcenter.subcenterName}`,
                              item.samples
                            )
                          }
                          className="text-[11px] text-emerald-700 font-bold hover:underline"
                        >
                          नमुने पहा →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONSOLIDATED ALL-SAMPLE REPORT (Section I) */}
      {/* ========================================================================= */}
      {activeTab === 'consolidated' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>
                  {consolidatedTimeframe === 'progressive'
                    ? 'एकत्रित प्रोग्रेसिव्ह अहवाल (Consolidated Progressive Report)'
                    : 'एकत्रित नमुना मासिक अहवाल (Consolidated Monthly Report)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                सर्व ६ नमुना प्रकार (पाणी Bio, पाणी Chemical, मीठ, TCL, गोवर, डेंग्यू) एकत्रित सारणी
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white shadow-xs">
                <button
                  onClick={() => setConsolidatedTimeframe('monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    consolidatedTimeframe === 'monthly'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  मासिक एकत्रित ({monthName})
                </button>
                <button
                  onClick={() => setConsolidatedTimeframe('progressive')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    consolidatedTimeframe === 'progressive'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  प्रोग्रेसिव्ह एकत्रित ({progressiveStartName} ते {monthName})
                </button>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded hidden md:inline-block">
                {consolidatedTimeframe === 'progressive'
                  ? `${progressiveStartName} ते ${monthName} ${selectedYear}`
                  : `${monthName} ${selectedYear}`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10 text-center">अ.क्र.</th>
                  <th className="py-2.5 px-3">उपकेंद्र</th>
                  <th className="py-2.5 px-3">गाव</th>
                  <th className="py-2.5 px-2 text-center text-cyan-800">पाणी BIO</th>
                  <th className="py-2.5 px-2 text-center text-emerald-800">पाणी Chemical</th>
                  <th className="py-2.5 px-2 text-center text-indigo-800">मीठ</th>
                  <th className="py-2.5 px-2 text-center text-amber-800">TCL</th>
                  <th className="py-2.5 px-2 text-center text-purple-800">गोवर</th>
                  <th className="py-2.5 px-2 text-center text-rose-800">डेंग्यू</th>
                  <th className="py-2.5 px-3 text-center bg-slate-200 font-black">एकूण नमुने</th>
                  <th className="py-2.5 px-2 text-center text-amber-700">अप्राप्त</th>
                  <th className="py-2.5 px-2 text-center text-emerald-700">प्रमाणित</th>
                  <th className="py-2.5 px-2 text-center text-rose-700">अप्रमाणित</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {consolidatedMatrix.map((r, idx) => (
                  <tr key={r.village.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {r.subcenter.subcenterName}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.village.name}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.waterBioCount}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.waterChemCount}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.saltCount}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.tclCount}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.measlesCount}</td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.dengueCount}</td>
                    <td className="py-2.5 px-3 text-center font-black bg-slate-50 text-slate-950">
                      <button
                        onClick={() =>
                          openDrillDown(
                            `गाव: ${r.village.name} • सर्व एकत्रित नमुने`,
                            `उपकेंद्र: ${r.subcenter.subcenterName}`,
                            r.samples
                          )
                        }
                        className="px-2 py-0.5 rounded hover:bg-slate-200 underline font-black"
                      >
                        {r.counts.total}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-amber-800">
                      {r.counts.pending}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-800">
                      {r.counts.certified}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-rose-800">
                      {r.counts.uncertified}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-3 px-3 text-right">
                    एकूण बेरीज (Consolidated Total):
                  </td>
                  <td className="py-3 px-2 text-center">
                    {consolidatedMatrix.reduce((a, b) => a + b.waterBioCount, 0)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {consolidatedMatrix.reduce((a, b) => a + b.waterChemCount, 0)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {consolidatedMatrix.reduce((a, b) => a + b.saltCount, 0)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {consolidatedMatrix.reduce((a, b) => a + b.tclCount, 0)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {consolidatedMatrix.reduce((a, b) => a + b.measlesCount, 0)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {consolidatedMatrix.reduce((a, b) => a + b.dengueCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-center bg-slate-200 text-sm font-black">
                    {activeAggregates.total}
                  </td>
                  <td className="py-3 px-2 text-center text-amber-800 font-bold">
                    {activeAggregates.pending}
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-800 font-bold">
                    {activeAggregates.certified}
                  </td>
                  <td className="py-3 px-2 text-center text-rose-800 font-bold">
                    {activeAggregates.uncertified}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SUBCENTER-WISE REPORT (Section E) */}
      {/* ========================================================================= */}
      {activeTab === 'subcenter' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>उपकेंद्रनिहाय अहवाल व गाव सूची</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              प्राथमिक आरोग्य केंद्र भादा अंतर्गत सर्व ६ उपकेंद्रांची आकडेवारी
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {subcenterReportData.map((scItem) => (
              <div key={scItem.subcenter.id} className="p-4 hover:bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                      <span>उपकेंद्र {scItem.subcenter.subcenterName}</span>
                      <span className="text-xs font-normal text-slate-500">
                        (कोड: {scItem.subcenter.subcenterCode})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ता. {scItem.subcenter.taluka}, जि. {scItem.subcenter.district} • समाविष्ट गावे: {scItem.villagesCount}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">एकूण नमुने</div>
                      <div className="text-lg font-black text-slate-900">{scItem.counts.total}</div>
                    </div>
                    <button
                      onClick={() =>
                        openDrillDown(
                          `उपकेंद्र: ${scItem.subcenter.subcenterName}`,
                          `एकूण नमुने`,
                          scItem.samples
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200"
                    >
                      सर्व नमुने पहा
                    </button>
                  </div>
                </div>

                {/* Subcenter Village Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {scItem.villages.map((vItem) => (
                    <div
                      key={vItem.village.id}
                      className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800">{vItem.village.name}</div>
                        <div className="text-[10px] text-slate-500">
                          प्रमाणित: {vItem.counts.certified} | अप्राप्त: {vItem.counts.pending}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          openDrillDown(
                            `गाव: ${vItem.village.name}`,
                            `उपकेंद्र: ${scItem.subcenter.subcenterName}`,
                            vItem.samples
                          )
                        }
                        className="text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs hover:bg-emerald-50"
                      >
                        {vItem.counts.total} नमुने
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: VILLAGE-WISE MASTER REPORT (Section F) */}
      {/* ========================================================================= */}
      {activeTab === 'village' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">गावनिहाय सविस्तर अहवाल (Village-Wise Report)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                प्रत्येक गाव त्याच्या अधिकृत उपकेंद्राखालीच दर्शविले आहे (No cross-subcenter mixing)
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              एकूण गावे: {villageReportData.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">अ.क्र.</th>
                  <th className="py-2.5 px-3">उपकेंद्र (Subcenter)</th>
                  <th className="py-2.5 px-3">गाव (Village)</th>
                  <th className="py-2.5 px-3 text-center bg-slate-200/50 font-bold">एकूण नमुने</th>
                  <th className="py-2.5 px-3 text-center text-amber-700">अप्राप्त (Pending)</th>
                  <th className="py-2.5 px-3 text-center text-emerald-700">प्रमाणित (Certified)</th>
                  <th className="py-2.5 px-3 text-center text-rose-700">अप्रमाणित (Uncertified)</th>
                  <th className="py-2.5 px-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {villageReportData.map((item, idx) => (
                  <tr key={item.village.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.subcenter.subcenterName}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.village.name}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                      <button
                        onClick={() =>
                          openDrillDown(
                            `गाव: ${item.village.name} (उपकेंद्र: ${item.subcenter.subcenterName})`,
                            `एकूण नमुने`,
                            item.samples
                          )
                        }
                        className="px-2 py-0.5 rounded hover:bg-slate-200 underline"
                      >
                        {item.counts.total}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-800">
                      {item.counts.pending}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                      {item.counts.certified}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-800">
                      {item.counts.uncertified}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() =>
                          openDrillDown(
                            `गाव: ${item.village.name} • नमुने तपशील`,
                            `उपकेंद्र: ${item.subcenter.subcenterName}`,
                            item.samples
                          )
                        }
                        className="text-[11px] text-emerald-700 font-bold hover:underline"
                      >
                        तपशील पहा →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: MONTHLY TREND & PROGRESS (Section K) */}
      {/* ========================================================================= */}
      {activeTab === 'trend' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>मासिक प्रगती व प्रोग्रेसिव्ह ट्रेंड (Financial Year Monthly Trend)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              आर्थिक वर्ष एप्रिल {selectedYear} ते मार्च {selectedYear + 1} पर्यंतची महिनानिहाय व प्रोग्रेसिव्ह प्रगती
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">अ.क्र.</th>
                  <th className="py-2.5 px-3">महिना (Month)</th>
                  <th className="py-2.5 px-3 text-center">वर्ष</th>
                  <th className="py-2.5 px-3 text-center bg-slate-200/50 font-bold">मासिक नमुने</th>
                  <th className="py-2.5 px-3 text-center text-amber-700">अप्राप्त</th>
                  <th className="py-2.5 px-3 text-center text-emerald-700">प्रमाणित</th>
                  <th className="py-2.5 px-3 text-center text-rose-700">अप्रमाणित</th>
                  <th className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-950 font-black">
                    प्रोग्रेसिव्ह बेरीज (Cumulative)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {monthlyTrendData.map((row, idx) => (
                  <tr
                    key={`${row.year}-${row.monthNumber}`}
                    className={`hover:bg-slate-50 ${
                      row.isCurrentSelected ? 'bg-emerald-50/50 font-bold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span>{row.monthName}</span>
                      {row.isCurrentSelected && (
                        <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded">
                          चालू निवड
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{row.year}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                      <button
                        onClick={() =>
                          openDrillDown(
                            `${row.monthName} ${row.year} • मासिक नमुने`,
                            `एकूण मासिक नमुने`,
                            row.samples
                          )
                        }
                        className="px-2 py-0.5 rounded hover:bg-slate-200 underline"
                      >
                        {row.counts.total}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-800">
                      {row.counts.pending}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                      {row.counts.certified}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-800">
                      {row.counts.uncertified}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black bg-emerald-50 text-emerald-950 text-sm">
                      {row.cumulativeTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: WATER SOURCES 3-MONTHS OVERDUE BIOLOGICAL REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'water-overdue-3m' && (
        <WaterBiologicalOverdueReportView
          currentUser={currentUser}
          onNavigateToSampleEntry={onNavigateToSampleEntry}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 9: MONTHLY SUBCENTER-WISE WATER SAMPLE PLAN & LIST */}
      {/* ========================================================================= */}
      {activeTab === 'monthly-water-subcenter' && (
        <MonthlySubcenterWaterPlanView
          currentUser={currentUser}
          onNavigateToSampleEntry={onNavigateToSampleEntry}
        />
      )}

      {/* ========================================================================= */}
      {/* MANDATORY DRILL-DOWN MODAL (Section M) */}
      {/* ========================================================================= */}
      {drillDown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px]">
                    नमुना तपशील (Audit Trail)
                  </span>
                  <h3 className="font-bold text-base text-white">{drillDown.title}</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{drillDown.subtitle}</p>
              </div>

              <button
                onClick={closeDrillDown}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Count Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="शोध नमुना क्र. / गाव / स्त्रोत / निकाल..."
                  value={drillSearchQuery}
                  onChange={(e) => setDrillSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold">
                  दर्शविलेले नमुने: {filteredDrillSamples.length} / {drillDown.samples.length}
                </span>
              </div>
            </div>

            {/* Modal Sample Records Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredDrillSamples.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  कोणतेही नमुने आढळले नाहीत.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <th className="py-2 px-2.5 text-center">अ.क्र.</th>
                      <th className="py-2 px-2.5">नमुना क्र. (ID)</th>
                      <th className="py-2 px-2.5">संकलन दिनांक</th>
                      <th className="py-2 px-2.5">उपकेंद्र व गाव</th>
                      <th className="py-2 px-2.5">स्त्रोत / आस्थापना</th>
                      <th className="py-2 px-2.5">नमुना प्रकार</th>
                      <th className="py-2 px-2.5">अहवाल दिनांक</th>
                      <th className="py-2 px-2.5 text-center">निकाल वर्गवारी</th>
                      <th className="py-2 px-2.5">प्रयोगशाळा निकाल</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredDrillSamples.map((s, index) => {
                      const cat = classifySampleResult(s);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2.5 text-center text-slate-500">{index + 1}</td>
                          <td className="py-2.5 px-2.5 font-bold text-slate-900 font-mono">
                            {s.id}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600">{s.collectionDate}</td>
                          <td className="py-2.5 px-2.5">
                            <div className="font-bold text-slate-900">{s.villageName}</div>
                            <div className="text-[10px] text-slate-500">
                              उपकेंद्र: {s.subcenterName || s.subcenter}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5">
                            {s.sourceName || s.shopOrInstitutionName || s.patientName || '-'}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-700">{s.sampleTypeName}</td>
                          <td className="py-2.5 px-2.5 text-slate-600">
                            {s.reportReceivedDate || 'प्रलंबित'}
                          </td>
                          <td className="py-2.5 px-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cat === 'CERTIFIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cat === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : cat === 'UNCERTIFIED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {getResultCategoryLabel(cat)}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                            {s.result || s.status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeDrillDown}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Government Formatted PDF Modal */}
      <OfficialReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportTitle={pdfDataConfig.title}
        reportSubtitle={pdfDataConfig.subtitle}
        periodText={pdfDataConfig.periodText}
        filterDetails={pdfDataConfig.filterDetails}
        summaryStats={pdfDataConfig.summaryStats}
        columns={pdfDataConfig.columns}
        data={pdfDataConfig.rows}
        orientationDefault={pdfDataConfig.orientation}
        currentUser={currentUser}
      />
    </div>
  );
};
