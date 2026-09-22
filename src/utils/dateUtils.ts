/**
 * Central Date Utility for PHC Bhada Health Reporting Dashboard
 * Eliminates timezone shifts and parsing ambiguities.
 * Standards:
 * - HTML Input format: 'yyyy-MM-dd'
 * - Official Govt / Report format: 'dd-MM-yyyy'
 * - Storage format: 'yyyy-MM-dd'
 */

/**
 * Returns today's date in 'yyyy-MM-dd' format using local Indian system time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts 'yyyy-MM-dd' to 'dd-MM-yyyy' safely without Date object timezone shifts
 */
export function formatToIndianDate(isoDateString?: string | null): string {
  if (!isoDateString) return '';
  const str = String(isoDateString).trim();
  
  // If already in dd-MM-yyyy format
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str;
  }

  // If in yyyy-MM-dd format
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, yyyy, mm, dd] = ymdMatch;
    return `${dd}-${mm}-${yyyy}`;
  }

  // If in ISO timestamp format (e.g. 2026-09-20T11:59:00Z)
  if (str.includes('T')) {
    const datePart = str.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
  }

  return str;
}

/**
 * Converts 'dd-MM-yyyy' to 'yyyy-MM-dd' for HTML date inputs
 */
export function formatToInputDate(indianDateString?: string | null): string {
  if (!indianDateString) return '';
  const str = String(indianDateString).trim();

  // If already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // If in dd-MM-yyyy format
  const dmyMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  return str;
}

/**
 * Parse a date string (either yyyy-MM-dd or dd-MM-yyyy) into numeric { year, month, day }
 */
export function parseDateParts(dateStr?: string | null): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10),
      day: parseInt(ymdMatch[3], 10),
    };
  }

  const dmyMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmyMatch) {
    return {
      year: parseInt(dmyMatch[3], 10),
      month: parseInt(dmyMatch[2], 10),
      day: parseInt(dmyMatch[1], 10),
    };
  }

  return null;
}

/**
 * Generates an Indian batch display string like: 'Batch-11:30 AM'
 */
export function generateBatchIdentifier(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `Batch-${displayHours}:${minutes} ${ampm}`;
}

export const MARATHI_MONTHS = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

export function getMonthNameMarathi(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  return MARATHI_MONTHS[monthNumber - 1];
}
