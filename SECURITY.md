# Kebijakan Keamanan — MPK SMAN 1 Malingping

## Melaporkan Kerentanan

Jika kamu menemukan kerentanan keamanan pada sistem ini, **jangan buat GitHub Issue publik.**

Laporkan langsung ke pengembang melalui:
- **Email**: *(hubungi pengurus MPK atau developer)*
- **Discord**: Hubungi Rizky Setiawan (Developer, Angkatan Primordial)

Kami berkomitmen merespons laporan dalam **7 hari kerja**.

---

## Versi yang Didukung

| Versi | Dukungan Keamanan |
|---|---|
| Production (Netlify) | ✅ Aktif |
| Development (localhost) | ✅ Aktif |

---

## Arsitektur Pertahanan Berlapis

### Layer 1 — HTTP Security Headers (Netlify Edge)
- `X-Frame-Options: DENY` — Blokir Clickjacking
- `X-Content-Type-Options: nosniff` — Blokir MIME Sniffing
- `X-XSS-Protection: 1; mode=block` — Proteksi XSS di browser lama
- `Referrer-Policy: strict-origin-when-cross-origin` — Kontrol bocor referrer
- `Permissions-Policy` — Kamera, mikrofon, geolokasi diblokir
- Admin panel: `Cache-Control: no-store` + `noindex`

### Layer 2 — Middleware Autentikasi (Astro Edge SSR)
- Semua rute `/admin/*` dilindungi middleware server-side
- Cookie `httpOnly: true` — JavaScript client tidak bisa baca token
- Refresh token otomatis saat access token expired
- Paksa logout jika refresh gagal

### Layer 3 — Honeypot + Rate Limiting (API Route)
- **Honeypot**: Field tersembunyi — bot yang mengisi langsung ditolak
- **Rate Limit**: Maksimal 5 kiriman/jam per IP (toleransi Wi-Fi sekolah)
- **IP Hashing**: IP di-hash SHA-256 dengan salt sebelum disimpan

### Layer 4 — CORS Exact Match Allowlist
- Origin validation menggunakan exact match, bukan substring
- Hanya `https://mpksmansamal.netlify.app` dan `localhost:4321` yang diizinkan

### Layer 5 — Row-Level Security (Supabase PostgreSQL)
- RLS aktif di **7 tabel utama**: `members`, `alumni`, `positions`, `generations`, `memos`, `aspirations`, `classes`
- Policy INSERT `aspirations` dengan validasi panjang konten (10–2000 karakter)
- CHECK constraint di level tabel sebagai second layer of defense
- Operasi tulis hanya untuk `authenticated` role

### Layer 6 — XSS Sanitasi Input
- Semua input aspirasi di-sanitasi server-side sebelum masuk database
- HTML entities di-escape untuk mencegah injection

---

## Prosedur Rotasi Kredensial

> [!CAUTION]
> Lakukan ini segera jika terjadi kebocoran kredensial.

### Rotasi Supabase Anon Key
1. Buka Supabase Dashboard → Project Settings → API
2. Klik **"Regenerate"** pada anon key
3. Update `PUBLIC_SUPABASE_ANON_KEY` di Netlify Dashboard (Environment Variables)
4. Redeploy aplikasi dari Netlify Dashboard

### Rotasi RATE_LIMIT_SALT
1. Generate salt baru (minimal 32 karakter random)
2. Update `RATE_LIMIT_SALT` di Netlify Dashboard → Environment Variables
3. Redeploy (tidak perlu migrasi database)

### Reset Password Admin Supabase Auth
1. Buka Supabase Dashboard → Authentication → Users
2. Klik pengguna admin → kirim reset email
3. Atau gunakan Supabase CLI: `supabase auth reset-password`

---

## Variabel Lingkungan yang Wajib Dikonfigurasi di Netlify

| Variabel | Keterangan | Wajib? |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | URL proyek Supabase | ✅ Ya |
| `PUBLIC_SUPABASE_ANON_KEY` | Kunci anonim Supabase | ✅ Ya |
| `RATE_LIMIT_SALT` | Salt untuk hash IP rate limiter | ✅ Ya |
| `DISCORD_WEBHOOK_URL` | URL webhook Discord notifikasi | ❌ Opsional |

> [!WARNING]
> Jika `RATE_LIMIT_SALT` tidak dikonfigurasi di Netlify, sistem akan menggunakan salt default yang terbaca di source code — ini melemahkan privacy hash IP.