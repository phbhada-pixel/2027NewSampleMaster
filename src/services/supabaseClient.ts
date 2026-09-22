/**
 * Supabase Client Configuration for PHC Bhada Sample Master & Reporting System
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const checkSupabaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase URL किंवा Anon Key कॉन्फिगर केलेले नाही (स्थानिक सुरक्षित डेटाबेस कार्यरत आहे)',
    };
  }

  try {
    const { error } = await supabase.from('villages').select('id').limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Supabase क्लाउड डेटाबेस यशस्वीरित्या जोडले आहे' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection error';
    return { connected: false, message: msg };
  }
};
