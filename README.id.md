<div align="center">
  <br />
  <a href="https://github.com/Riz6ix/MPK">
    <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="140" style="border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);" />
  </a>
  <br />
  <br />

  <h1 align="center">Website Majelis Perwakilan Kelas SMA</h1>

  <p align="center">
    <strong>Platform tata kelola terpusat dan berkinerja tinggi untuk Majelis Perwakilan Kelas modern.</strong>
    <br />
    <br />
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>
</div>

<p align="center">
  <kbd> <a href="README.md">🌐 English</a> </kbd> • <kbd> <a href="README.id.md">🇮🇩 Bahasa Indonesia</a> </kbd>
</p>

---

## ✦ Visi Proyek

Tata kelola siswa sering kali bergantung pada sistem yang terfragmentasi—*spreadsheet* yang tersebar, kotak saran fisik, dan alur komunikasi yang terputus.

Platform ini merekayasa ulang alur kerja **Majelis Perwakilan Kelas (MPK)** menjadi satu *digital workspace* yang terpadu. Berfungsi sebagai *single source of truth* untuk aspirasi siswa, manajemen keanggotaan, dan struktur organisasi, semuanya dibangun di atas teknologi *edge-ready* modern.

<br />

## ✦ Arsitektur Inti

Kami memprioritaskan integritas sistem dan performa di atas penumpukan fitur. Berikut adalah rincian arsitekturnya:

| Modul | Subsistem | Deskripsi Teknis |
| :--- | :--- | :--- |
| 🗳️ **Intake** | `Aspirations` | *Pipeline* penerimaan yang aman untuk *feedback* siswa. Dibangun dengan validasi *edge-function* dan *real-time persistence* dari Supabase. |
| 👥 **Roster** | `Alumni & HR` | *Relational schemas* terpusat untuk melacak anggota aktif, data hierarki, dan catatan riwayat alumni. |
| 🏛️ **Governance**| `Class Manager` | Antarmuka administratif yang menangani delegasi kelas, struktur perwakilan, dan izin internal (*permissions*). |
| 🚀 **Delivery** | `Astro SSR` | *Server-Side Rendering* (SSR) yang sangat dioptimasi, memastikan *zero-layout-shift* dan waktu muat di bawah satu detik. |

<br />

## ✦ Panduan Developer

Jalankan *local environment* hanya dalam hitungan detik. Kami menerapkan *strict node versioning* untuk menjaga konsistensi.

### 1. Setup Environment

Pastikan Anda menggunakan **Node.js v22.12.0+** dan memiliki instans **Supabase** yang aktif. Lakukan *clone* repositori dan instal *dependencies*:

```bash
git clone https://github.com/Riz6ix/MPK.git
cd MPK
npm install
```

### 2. Konfigurasi

Duplikasi *template environment* (jika ada) atau buat file `.env` di *root* proyek. Masukkan kredensial Supabase Anda dengan aman:

```env
# .env
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

> **Peringatan:** Jangan pernah melakukan *commit* pada file `.env` Anda. Repositori ini menggunakan aturan `.gitignore` yang ketat untuk mencegah kebocoran kredensial.

### 3. Inisialisasi Server

Jalankan *development server* Astro dengan *Hot Module Replacement* (HMR):

```bash
npm run dev
```
> Aplikasi akan berjalan dengan aman di `http://localhost:4321`.

<br />

## ✦ Infrastruktur Deployment

Repositori ini telah dioptimasi untuk **Continuous Deployment (CD)** melalui Netlify.

Melakukan *push* ke *branch* `main` akan secara otomatis memicu *pipeline CI/CD*. Netlify akan membaca file `netlify.toml` yang telah dikonfigurasi, mengeksekusi `npm run build`, dan mendistribusikan *static/SSR artifacts* secara global. Tidak diperlukan intervensi manual.

---
<div align="center">
  <i>Direkayasa untuk tata kelola siswa yang lebih baik.</i>
</div>