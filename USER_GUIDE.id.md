# 🌲 Panduan Penggunaan Website MPK SMAN 1 Malingping 🍂

Selamat datang di Panduan Tata Cara Penggunaan portal tata kelola digital **Majelis Perwakilan Kelas (MPK) SMAN 1 Malingping**. Panduan ini disusun untuk memudahkan seluruh siswa, pengurus, dan administrator dalam menggunakan fitur-fitur website secara optimal, aman, dan nyaman (*cozy*).

---

## 👥 1. Peran & Sasaran Pengguna

Portal ini membagi akses sistem menjadi dua ruang lingkup utama:
*   **Ruang Publik (Untuk Siswa Umum & Guru)**: Tempat menyampaikan keluhan, saran, memantau transparansi penanganan suara siswa, dan melihat struktur kepengurusan.
*   **Ruang Admin / CMS (Untuk Pengurus MPK)**: Dasbor khusus berbingkai kayu ek (*Oak Wood*) untuk mengelola kelas, menyusun jabatan, membalas aspirasi, serta memperbarui daftar pengurus.

---

## 🗳️ 2. Panduan Ruang Publik (Untuk Siswa)

### A. Menyampaikan Suara (Kotak Aspirasi)
1.  Geser layar ke bagian paling bawah di halaman utama hingga menemukan kontainer **"Sampaikan Aspirasi Anda"**.
2.  **Isian Nama**: Anda diperbolehkan menggunakan nama asli, inisial, maupun nama samaran. Jika ingin tetap sepenuhnya rahasia, kosongkan kolom nama untuk mengirim sebagai **"Anonim"**.
3.  **Dropdown Kelas**: Pilih kelas Anda saat ini dari daftar dropdown terkelompok (Tingkat X, XI, atau XII).
4.  **Isi Keluhan**: Tulis keluhan atau saran Anda secara jelas (misalnya: fasilitas kelas, toilet, parkir, atau kritik program kerja).
5.  Tekan **"Kirim Aspirasi"**.

> [!NOTE]
> **Keamanan Enkripsi Privasi**: IP asli Anda disandikan secara matematis menggunakan algoritma satu arah (*SHA-256 Hashed Salt*). Pengurus tidak pernah mengetahui IP asli Anda. Pengiriman dibatasi maksimal **1 jam sekali per peranti** untuk menghindari penyalahgunaan.

### B. Memantau Papan Aspirasi Transparan
*   Siswa dapat memantau progres keluhan yang masuk pada tabel **"Papan Aspirasi Siswa"** di halaman utama.
*   Setiap aspirasi akan menampilkan status real-time dari pengurus:
    *   `Belum Diproses` (Warna kuning bees-wax) ⏳
    *   `Sedang Ditinjau` (Warna biru langit) 🔍
    *   `Selesai` (Warna hijau rimbun) 🌲
    *   `Pending` (Penangguhan penanganan) 💸

---

## 👥 3. Panduan CMS Anggota & Alumni (Untuk Admin)

Sebagai administrator, Anda dapat mengelola roster pengurus aktif di `/admin/members` dan alumni purna di `/admin/alumni`.

### A. Smart Batch Import ("Tempel List")
Fitur ini memangkas waktu input manual satu-persatu. Anda dapat langsung menyalin list nama dari WhatsApp atau Excel:
1.  Klik tombol **"Smart Import"** di bagian atas halaman CMS.
2.  Tempel (*paste*) daftar nama mentah Anda ke dalam kotak teks yang tersedia. Format penulisan default:
    `Nama Pengurus | Jabatan | Kelas | Komisi | Jenis Kelamin`
    *(Contoh: Rizky Setiawan | Developer | XII-F5 | Inti | Laki-laki)*
3.  **Parser Cerdas**: Jika beberapa bagian tidak diisi, sistem otomatis menebak kelas default, komisi berdasarkan jabatan, dan jenis kelamin Anda.
4.  Tekan **"Proses & Simpan"**.

### B. Membuat Avatar Instan dengan Dicebear
*   Saat menambah atau mengedit pengurus, Anda tidak perlu repot mengunggah foto.
*   Pilih **Gaya Avatar** pada dropdown (misal: *Identicon, Pixel Art, Adventurer, Lorelei*, atau **🎲 All** untuk gaya acak).
*   Klik tombol **"Random"** atau pilih salah satu kotak warna *predefined seed* di bawah preview untuk menghasilkan pola visual 8-bit yang estetik dalam milidetik.

---

## 🏛️ 4. Panduan Struktur Jabatan & Kelas (Untuk Admin)

### A. Papan Hirarki Jabatan (Drag & Drop)
Kelola pohon organisasi kesiswaan secara interaktif di `/admin/positions`:
1.  **Menyusun Urutan**: Cukup tekan, tarik (*drag*), dan letakkan (*drop*) baris jabatan ke atas atau ke bawah untuk mengatur urutan visual (`order_index`) pada organogram halaman utama.
2.  **Relasi Atasan**: Anda dapat mengedit jabatan dan memilih siapa atasan langsungnya. Ini membolehkan struktur kepengurusan bercabang secara dinamis.

### B. Kelola Kelas & Analisis Representasi
Kelola direktori kelas SMAN 1 Malingping di `/admin/classes`:
*   **Seeding Instan**: Gunakan tombol **"Seed 31 Kelas Default"** untuk otomatis mengisi direktori dari kelas X-E1 sampai XII-F10.
*   **Monitoring Sebaran**: Dasbor secara otomatis menampilkan visualisasi representasi pengurus MPK di tiap kelas. Kelas yang sudah terwakili akan menyala hijau, sementara kelas kosong menyala redup untuk memudahkan pengawasan pemilu/delegasi kelas berikutnya.

---

## 🔒 5. Fitur Produktivitas & Keamanan Admin

### A. Papan Memo Pengingat (Scratchpad)
*   Di dasbor utama `/admin`, pengurus dapat menulis memo kerja kustom menggunakan tombol **"+ Tempel Memo"**.
*   Memo dapat dipindahkan secara asimetris, diberi warna kertas pastel pudar, dan tersimpan secara aman di Local Storage browser Anda masing-masing.

### B. Kebijakan Kehormatan "Developer"
*   Sebagai tanda lestari dedikasi sistem, jabatan **"Developer"** hanya dapat diisi jika nama pengurus tertulis tepat **"Rizky Setiawan"**. Sistem basis data akan menolak upaya penulisan jabatan Developer selain atas nama tersebut.

---
<div align="center">
  <sub>Buku Panduan Operasional Digital SMAN 1 Malingping. Dirancang oleh Angkatan Primordial.</sub>
</div>
