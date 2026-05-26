<div align="center">
  <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="120" style="border-radius: 12px;"/>
  <h1>Website Majelis Perwakilan Kelas SMA</h1>
  <p><strong>Platform modern dan terpusat untuk tata kelola dan administrasi Majelis Perwakilan Kelas (MPK).</strong></p>
  
  <p>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build Status"/></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"/></a>
    <img src="https://img.shields.io/badge/Version-1.0.0-lightgrey?style=flat-square" alt="Version"/>
  </p>
</div>

<div align="center">
  <a href="README.md">🌐 English</a> | 🇮🇩 Bahasa Indonesia
</div>

---

## 🎯 Tujuan Proyek

Mengelola Majelis Perwakilan Kelas (MPK) seringkali melibatkan *spreadsheet* yang berantakan, kotak saran fisik, dan komunikasi yang terfragmentasi.

Proyek ini dibangun untuk menyelesaikan masalah tersebut dengan menyediakan **digital workspace yang terpusat**. Platform ini bertindak sebagai *single source of truth* untuk menampung aspirasi siswa, melacak data alumni, serta mengatur struktur organisasi, yang semuanya dibangun di atas *tech stack* modern berkinerja tinggi (Astro + React + Supabase).

## ⚡ Arsitektur Inti & Kapabilitas

Berikut adalah matriks arsitektur dari modul utama yang ditangani oleh platform ini:

| Kapabilitas | Modul | Deskripsi |
| :--- | :--- | :--- |
| 🗳️ **Aspiration Intake** | `Aspirasi Form` | Sistem penerimaan yang aman dan terstruktur untuk *feedback* siswa, memanfaatkan Supabase untuk *real-time data persistence*. |
| 👥 **HR & Roster** | `Alumni & Member Table` | *Relational tables* terpusat untuk melacak anggota organisasi aktif dan menjaga riwayat data alumni. |
| 🏛️ **Governance** | `Class Manager` | *Dashboard* administratif untuk mengelola delegasi kelas, struktur hierarki, dan data internal MPK. |
| 🚀 **Delivery** | `Astro SSR` | Pipeline *Server-Side Rendering* (SSR) yang dioptimasi untuk menjamin waktu muat (load time) super cepat. |

## 🛠️ Quick Start

Ikuti instruksi berikut untuk menjalankan *development environment* di mesin lokal Anda.

<details>
<summary><b>1. Persyaratan Sistem</b></summary>
<br>

Pastikan *environment* lokal Anda memenuhi spesifikasi berikut:
- **Node.js**: `v22.12.0` atau lebih baru.
- **Git**: Sudah terinstal dan terkonfigurasi.
- **Supabase**: *Project* Supabase aktif untuk keperluan *backend database*.

</details>

<details>
<summary><b>2. Instalasi & Setup</b></summary>
<br>

Lakukan *clone* repositori dan instal *dependencies* yang dibutuhkan:

```bash
# Clone repositori
git clone https://github.com/Riz6ix/MPK.git

# Masuk ke direktori
cd MPK

# Instal Node.js dependencies
npm install
```
</details>

<details>
<summary><b>3. Konfigurasi (Environment Variables)</b></summary>
<br>

Aplikasi ini bergantung pada Supabase untuk manajemen data. Anda harus menetapkan *environment variables* sebelum menjalankan *server*.

Buat file `.env` di *root directory*:

```env
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```
> **Security Note:** Jangan pernah melakukan *commit* file `.env` ke *version control*. Aturan ini sudah diamankan di dalam `.gitignore`.
</details>

<details>
<summary><b>4. Menjalankan Development Server</b></summary>
<br>

Inisialisasi *development server* Astro:

```bash
npm run dev
```
*Server* akan berjalan, dan aplikasi dapat diakses melalui <samp>http://localhost:4321</samp>.
</details>

## ☁️ Deployment

Proyek ini sudah dikonfigurasi untuk *Continuous Deployment* (CD).

Dengan memanfaatkan integrasi GitHub dari Netlify, setiap *commit* yang di-*push* ke *branch* `main` akan secara otomatis memicu *build pipeline* (`npm run build`) dan mendistribusikan *artifact* dari folder `dist` ke *production*. Tidak diperlukan konfigurasi *GitHub Actions* yang rumit untuk *hosting* dasarnya.

---
*Built with ❤️ for better student governance.*