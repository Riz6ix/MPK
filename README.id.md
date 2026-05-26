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
    <strong>Portal tata kelola kesiswaan premium, cozy, dan berkinerja tinggi.</strong>
    <br />
    <em>Simpul relasional tersinkronisasi, respon kueri sub-milidetik, dan keamanan edge yang kokoh.</em>
  </p>

  <p>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-FF5D01?style=flat-square&logo=astro&logoColor=white" alt="Astro" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>

  <p>
    <kbd> <a href="README.md">🌐 English</a> </kbd> • <kbd> <a href="README.id.md">🇮🇩 Bahasa Indonesia</a> </kbd>
  </p>
</div>

---

### ✦ Sentuhan Visual & Cozy

Didesain dengan psikologi tata letak untuk kenyamanan mata dan keaslian interaksi pengguna:
*   **Warm Forest Palette**: Kombinasi warna forest green pekat (`#2e473b`), aksen emas amber, dan latar kertas perkamen yang hangat.
*   **Transisi Mengalir**: Transisi panel akordion tanpa pergeseran tata letak (*zero-layout shift*) dan dropdown kustom popover HP.
*   **Minecraft Suspended Dust**: Partikel debu emas mengambang secara tenang dan bereaksi lembut mengikuti gerakan kursor mouse.

---

### ✦ Arsitektur Node Relasional (100% Sinkron)

```mermaid
flowchart LR
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b;
    
    Aspirasi[🗳️ Aspirasi Murid] --> Kelas[🏛️ Direktori Kelas]
    Kelas <--> Pengurus[👥 Pengurus Aktif]
    Pengurus <--> Jabatan[🌿 Hirarki Jabatan]
```

*   **Sinkronisasi Relasional Utama**: Operasional inti disinkronisasikan secara real-time. Aspirasi yang masuk otomatis dikelompokkan berdasarkan direktori kelas utama, yang kemudian terikat langsung ke daftar perwakilan kelas aktif dan diurutkan secara hierarkis.
*   **Simpul Data Arsip**: Riwayat alumni dan masa bakti angkatan terdahulu diarsipkan secara aman pada simpul relasional terpisah.

---

### ✦ Panel Admin & Alat Administratif Pintar

*   **⚡ Smart Batch Import**: Salin-tempel list mentah pengurus/alumni. Sistem otomatis menebak kelas, komisi, gender, dan menyematkan avatar Dicebear.
*   **🛡️ Kunci Eksklusif Developer**: Jabatan `"Developer"` secara ketat hanya dapat disematkan kepada **Rizky Setiawan** (Angkatan Primordial).
*   **📋 Memo Tempel & Jurnal**: Catatan local storage interaktif dan kutipan kepemimpinan harian dinamis.

---

### ✦ Kerangka Kerja Keamanan Tingkat Elit

```mermaid
flowchart LR
    A[Kirim Aspirasi] --> B{Honeypot Kosong?}
    B -- Tidak / Bot --> C[Gugurkan 400]
    B -- Ya / Manusia --> D{Device Lock < 1 jam?}
    D -- Ya / Cooldown --> E[Tolak 429]
    D -- Tidak --> F{Limit IP Bersama < 5/jam?}
    F -- Terlampaui --> G[Tolak 429]
    F -- Diizinkan --> H[Sanitasi & Simpan]
```

*   **Hybrid Rate Limiting**: Batasan ramah Wi-Fi sekolah (toleransi 5 pengiriman/jam per IP) berpadu dengan kunci peranti Local Storage 1 jam.
*   **Honeypot Trap**: Menggugurkan spam-bot secara otomatis jika mendeteksi kolom jebakan tersembunyi terisi.
*   **DDL Row-Level Security**: Proteksi penuh Postgres RLS aktif di seluruh tabel utama untuk memblokir bypass klien API ilegal.

---

### 🚀 Panduan Setup Pengembang lokal

Jalankan workspace lokal dengan fitur hot-reloading dalam waktu di bawah 60 detik:

```bash
# 1. Klon repositori dan pasang dependensi
git clone https://github.com/Riz6ix/MPK.git
cd MPK
npm install

# 2. Masukkan kredensial API ke file lokal .env
echo 'PUBLIC_SUPABASE_URL="https://proyek-anda.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="kunci-anon-anda"' > .env

# 3. Jalankan server lokal
npm run dev
```
> Buka tautan [http://localhost:4321](http://localhost:4321) untuk mulai menjelajah.

---
<div align="center">
  <sub>Developed with sustainable dedication by <strong>Angkatan Primordial</strong>. All Rights Reserved.</sub>
</div>