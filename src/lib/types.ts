/**
 * Type definitions untuk semua tabel Supabase WEB-MPK
 * Digunakan di seluruh komponen untuk type safety
 */

export interface Member {
  id: string;
  name: string;
  position: string;
  commission: string;
  class: string;
  gender: 'Laki-laki' | 'Perempuan';
  avatar_url: string | null;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  name: string;
  order_index: number;
  parent_id: string | null;
  created_at?: string;
}

export interface ClassEntry {
  id: string;
  name: string;
  grade: number;
  order_index: number;
  created_at?: string;
}

export interface Aspiration {
  id: string;
  name: string;
  class: string;
  content: string;
  status: AspirationStatus;
  response: string | null;
  ip_hash: string;
  created_at: string;
  updated_at?: string;
}

export type AspirationStatus =
  | 'Belum Diproses'
  | 'Sedang Ditinjau'
  | 'Selesai'
  | 'Anomali'
  | 'Pending'
  | 'Birokrasi';

export interface Alumni {
  id: string;
  name: string;
  position: string;
  commission: string;
  generation_id: string | null;
  class: string;
  gender: 'Laki-laki' | 'Perempuan';
  avatar_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at?: string;
}

export interface Generation {
  id: string;
  name: string;
  period_start: string | null;
  period_end: string | null;
  order_index: number;
  created_at?: string;
}

export interface Memo {
  id: string;
  content: string;
  color: 'sticky-note-straw' | 'sticky-note-rose' | 'sticky-note-sage';
  created_at: string;
}

/** Stats dari RPC get_aspirations_stats() */
export interface AspirationStats {
  total_count: number;
  pending_count: number;
  resolved_count: number;
}
