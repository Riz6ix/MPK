<div align="center">
  <br />
  <a href="https://github.com/Riz6ix/MPK">
    <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(74, 85, 69, 0.3); border: 2px solid #e2ebd9;" />
  </a>
  <br />
  <br />

  <h1>🌲 Majelis Perwakilan Kelas 🍂</h1>
  <p>🏛️ <em>SMA Negeri 1 Malingping</em></p>

  <p>
    <strong>Tempat bernaung bagi tata kelola kesiswaan — estetika hutan yang hangat, performa rekayasa tinggi.</strong>
    <br />
    <em>Akar relasi yang saling berbisik · kueri sub-milidetik · perlindungan privasi berlapis</em>
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

### ✦ 🍃 Estetika Forest Academy & Kertas Perkamen

*Didesain dengan psikologi tata letak untuk kenyamanan mata dan keterlibatan yang alami:*

- 🌿 **Kanvas Hutan Hangat** — Forest green pekat `#2e473b`, aksen emas amber, latar kertas perkamen
- 🍂 **Transisi Daun Mengalir** — Panel akordion dan dropdown yang terasa selembut desiran daun angin
- ✨ **Debu Emas Melayang** — Partikel piksel emas bergaya Minecraft yang mengapung tenang di latar belakang

---

### ✦ 🕸️ Jalinan Akar Relasi Kesiswaan

*Suara siswa mengalir melalui akar jalinan relasi — layaknya pohon data hutan yang hidup:*

```mermaid
flowchart LR
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b

    A[🗳 Suara Siswa] --> B[🏛 Direktori Kelas]
    B <--> C[👥 Pengurus Aktif]
    C <--> D[🌿 Hirarki Jabatan]
```

- 🌱 **Sinkronisasi Akar Dinamis** — Aspirasi masuk otomatis dikelompokkan ke direktori kelas & terikat ke daftar perwakilan aktif secara real-time
- 📜 **Arsip Kuno Angkatan** — Riwayat alumni dan masa bakti terdahulu diarsipkan di simpul relasional terpisah

---

### ✦ ⚡ Meja Ek Tua & Alat Administratif Cerdas

- 📋 **Smart Quill Import** — Tempel daftar mentah; sistem otomatis mengurai kelas, komisi, gender & menyematkan avatar Dicebear
- 🔏 **Segel Kerajaan** — Batasan database mengunci peran `"Developer"` secara eksklusif hanya untuk **Rizky Setiawan** *(Angkatan Primordial)*
- 📎 **Memo Perkamen** — Catatan local-storage interaktif & widget kutipan kepemimpinan harian

---

### ✦ 🛡️ Penjaga Pohon Ek (Benteng Privasi & Keamanan)

*Setiap suara siswa melewati tiga gerbang penjaga sebelum mencapai akar jalinan:*

```mermaid
flowchart TD
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b
    classDef safe fill:#eef7e8,stroke:#4a7c59,stroke-width:2px,color:#2e473b
    classDef block fill:#fdf0f0,stroke:#c05c5c,stroke-width:2px,color:#803030
    classDef dec fill:#fffdf3,stroke:#c5a880,stroke-width:2px,color:#4a3b2f

    A[🗳 Suara Siswa] --> B{🕸 Honeypot Kosong?}:::dec
    B -- Bot --> C[🍂 Gugur ke Bumi]:::block
    B -- Manusia --> D{⏳ Cooldown Peranti?}:::dec
    D -- Terkunci --> E[💤 Rehat]:::block
    D -- Bebas --> F{🌲 Batas IP OK?}:::dec
    F -- Terlampaui --> G[🛡 Ditahan Penjaga]:::block
    F -- Diizinkan --> H[🍃 Tersimpan Aman]:::safe
```

- 🕷️ **Jebakan Honeypot** — Kolom tersembunyi seperti jaring laba-laba yang menangkap bot spam secara senyap
- ⏱️ **Rate Limit Ramah** — 5 kiriman/jam per IP, cooldown 1 jam per perangkat; bersahabat dengan Wi-Fi sekolah
- 🧱 **Tembok Batu RLS** — PostgreSQL Row-Level Security aktif di seluruh 7 tabel utama

---

### 🚀 Menyalakan Lentera *(Panduan Setup Lokal)*

```bash
# Klon & pasang dependensi
git clone https://github.com/Riz6ix/MPK.git && cd MPK && npm install

# Isi kredensial ke .env
echo 'PUBLIC_SUPABASE_URL="https://proyek-anda.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="kunci-anon-anda"' > .env

# Jalankan server lokal
npm run dev
```
> Buka [http://localhost:4321](http://localhost:4321) · membutuhkan kredensial proyek Supabase

---
<div align="center">
  <sub>Dikembangkan dengan dedikasi yang berkelanjutan oleh <strong>Angkatan Primordial</strong> · Seluruh Hak Dilindungi</sub>
</div>