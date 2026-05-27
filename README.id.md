<div align="center">
  <br />
  <a href="https://github.com/Riz6ix/MPK">
    <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(74, 85, 69, 0.3); border: 2px solid #e2ebd9;" />
  </a>
  <br />
  <br />

  <h1>🍂 MAJELIS PERWAKILAN KELAS 🍃</h1>
  <p><sub>SMA Negeri 1 Malingping</sub></p>

  <p>
    <strong>Website portal kesiswaan yang sederhana, nyaman di mata, dan berkeamanan tinggi.</strong>
    <br />
    <em>Navigasi bersahabat · kueri database cepat · perlindungan privasi yang ketat</em>
  </p>

  <p>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-FF5D01?style=flat-square&logo=astro&logoColor=white" alt="Astro" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>

  <p>
    <kbd> <a href="README.md">🌐 English</a> </kbd> • <kbd> <a href="README.id.md">🇮🇩 Bahasa Indonesia</a> </kbd>
  </p>
</div>

---

### ✦ 🍃 Desain *Cozy* & Hangat

*Tampilan visual yang ramah dan nyaman untuk interaksi warga sekolah:*

- 🌿 **Warna Alami** — Kombinasi hijau hutan lembut, aksen emas hangat, dan latar belakang kertas perkamen
- 🍂 **Transisi Mulus** — Animasi natural pada panel akordion dan dropdown yang terasa bersahabat di mata
- ✨ **Debu Emas Melayang** — Partikel piksel emas khas Minecraft yang bergerak tenang di latar belakang

---

### ✦ 🕸️ Alur Relasi Data (*Database*)

*Semua data kesiswaan mengalir lancar melalui relasi database yang terstruktur:*

```mermaid
flowchart LR
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b

    A[🗳 Suara Siswa] --> B[🏛 Direktori Kelas]
    B <--> C[👥 Pengurus Aktif]
    C <--> D[🌿 Hirarki Jabatan]
```

- 🌱 **Pengelompokan Otomatis** — Aspirasi yang masuk otomatis dikelompokkan berdasarkan kelas pelapor secara seketika (*real-time*)
- 📜 **Daftar Purna Bakti** — Data alumni dan pengurus masa bakti terdahulu tersimpan aman di tabel terpisah

---

### ✦ ⚡ Fitur Cerdas Admin

*Alat administratif praktis untuk menyederhanakan tugas pengurus MPK:*

- 📋 **Impor Daftar Cepat** — Tinggal tempel daftar nama; sistem otomatis membaca kelas, komisi, gender, dan membuat avatar Dicebear
- 🔏 **Kunci Pengembang** — Aturan database mengunci peran `"Developer"` secara eksklusif hanya untuk **Rizky Setiawan**
- 📎 **Memo & Nasihat** — Papan catatan tempel interaktif dan widget kata bijak kepemimpinan harian

---

### ✦ 🛡️ Sistem Keamanan & Privasi

*Menjamin suara siswa terkirim dengan aman melalui perlindungan *backend* berlapis:*

```mermaid
flowchart TD
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b
    classDef safe fill:#eef7e8,stroke:#4a7c59,stroke-width:2px,color:#2e473b
    classDef block fill:#fdf0f0,stroke:#c05c5c,stroke-width:2px,color:#803030
    classDef dec fill:#fffdf3,stroke:#c5a880,stroke-width:2px,color:#4a3b2f

    A[🗳 Suara Siswa] --> B{🕸 Honeypot OK?}:::dec
    B -- Bot --> C[🍂 Ditolak]:::block
    B -- Manusia --> D{⏳ Cooldown Perangkat?}:::dec
    D -- Terkunci --> E[💤 Tunggu]:::block
    D -- Bebas --> F{🌲 Batas IP OK?}:::dec
    F -- Terlampaui --> G[🛡 Ditahan]:::block
    F -- Diizinkan --> H[🍃 Tersimpan Aman]:::safe
```

- 🕷️ **Jebakan *Honeypot*** — Input tersembunyi yang mendeteksi dan membuang bot spam secara senyap
- ⏱️ **Batas Frekuensi** — Pembatasan jumlah kiriman (*rate limit*) per jam dan waktu jeda (*cooldown*) perangkat untuk mencegah database macet
- 🧱 **PostgreSQL RLS** — Kebijakan *Row-Level Security* aktif penuh di semua tabel database utama

---

### 🚀 Panduan *Setup* Lokal

```bash
# Klon dan pasang dependensi
git clone https://github.com/Riz6ix/MPK.git && cd MPK && npm install

# Masukkan kredensial proyek ke .env
echo 'PUBLIC_SUPABASE_URL="https://proyek-anda.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="kunci-anon-anda"' > .env

# Jalankan server lokal
npm run dev
```
> Buka [http://localhost:4321](http://localhost:4321) · membutuhkan akun & kredensial Supabase

---
<div align="center">
  <sub>Dikembangkan dengan dedikasi oleh <strong>Angkatan Primordial</strong> · SMAN 1 Malingping</sub>
</div>