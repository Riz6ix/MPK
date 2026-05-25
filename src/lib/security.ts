import { createHash } from 'crypto';

// Sanitization to prevent XSS (Cross-Site Scripting)
export function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// IP-based Rate Limiter (Sliding Window in serverless memory)
// Diubah menjadi 1 jam (3600000 ms) dengan batas maksimal 5 submissions per IP
// PENTING: Batas 5 submissions per IP per jam diterapkan untuk mengakomodasi skenario
// "Shared Public IP" (Satu Wi-Fi Sekolah SMAN 1 Malingping digunakan oleh banyak murid).
// Jika dikunci ke 1 IP per jam secara mutlak, murid pertama yang mengirim akan memblokir seluruh sekolah!
const ipTracker = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 1 jam window (3600000 ms)
const MAX_LIMIT = 5;             // Maksimal 5 kiriman per IP per jam (toleransi Wi-Fi Sekolah)

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || 'mpk-sman1malingping-default-salt';
  return createHash('sha256').update(ip + salt).digest('hex');
}

export function checkRateLimit(hashedIp: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const track = ipTracker.get(hashedIp);

  if (!track) {
    ipTracker.set(hashedIp, { count: 1, lastReset: now });
    return { allowed: true, remaining: MAX_LIMIT - 1 };
  }

  // Jika waktu window telah berlalu, reset hitungan
  if (now - track.lastReset > WINDOW_MS) {
    track.count = 1;
    track.lastReset = now;
    return { allowed: true, remaining: MAX_LIMIT - 1 };
  }

  if (track.count >= MAX_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  track.count += 1;
  return { allowed: true, remaining: MAX_LIMIT - track.count };
}
