import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder-mpk.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── withTimeout ──────────────────────────────────────────────────────────────
// Membungkus Supabase query promise dengan batas waktu (default 10 detik).
// Jika koneksi mobile lambat / carrier throttle, error dilempar agar komponen
// bisa menampilkan tombol "Coba Lagi" alih-alih spinner tak terbatas.
export async function withTimeout<T>(
  promise: Promise<T>,
  ms = 10000,
  label = 'fetch'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Koneksi timeout (${label}). Periksa jaringan dan coba lagi.`));
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timeoutId!);
    return result;
  } catch (err) {
    clearTimeout(timeoutId!);
    throw err;
  }
}

// ─── getDeviceId ──────────────────────────────────────────────────────────────
// Membuat Device ID stabil dari fingerprint browser sederhana.
// Disimpan di localStorage agar konsisten antar session.
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'mpk_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    // Fingerprint dari sinyal browser yang stabil
    const raw = [
      navigator.userAgent,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    // Hash sederhana → 8-char hex
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0;
    }
    id = Math.abs(hash).toString(16).padStart(8, '0') + '-' + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── logActivity ──────────────────────────────────────────────────────────────
// Mencatat aktivitas admin ke tabel `activity_logs`.
// Dipanggil setelah setiap operasi CRUD berhasil.
// IP address diambil dari ipify.org (cache 5 menit di memory).
let cachedIp: string | null = null;
let ipFetchedAt = 0;

export async function logActivity(params: {
  action: string;       // e.g. 'CREATE_MEMBER', 'DELETE_CLASS'
  entity_type?: string; // e.g. 'member', 'class'
  entity_id?: string;
  detail?: string;      // e.g. nama anggota yang diubah
}) {
  if (typeof window === 'undefined') return; // skip SSR

  try {
    // Ambil email admin yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmail = user?.email ?? 'unknown';

    // Ambil IP (cached 5 menit)
    const now = Date.now();
    if (!cachedIp || now - ipFetchedAt > 5 * 60 * 1000) {
      try {
        const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
        const json = await res.json();
        cachedIp = json.ip ?? null;
        ipFetchedAt = now;
      } catch {
        cachedIp = null;
      }
    }

    await supabase.from('activity_logs').insert([{
      admin_email: adminEmail,
      action: params.action,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      detail: params.detail ?? null,
      ip_address: cachedIp,
      device_info: navigator.userAgent.substring(0, 250),
      device_id: getDeviceId(),
    }]);
  } catch (err) {
    // Jangan crash UI jika logging gagal
    console.warn('[logActivity] Gagal mencatat log:', err);
  }
}
