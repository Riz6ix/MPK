# 🍃 Panduan Admin WEB-MPK SMANSAMAL

Halo semuanya! Berikut adalah panduan singkat untuk membantu kita mengelola website MPK SMAN 1 Malingping. Penjelasan di bawah ini dibuat sederhana dan langsung pada intinya agar mudah dipahami oleh seluruh pengurus.

---

## 🗺️ Pintasan Halaman
- [🔑 Cara Login](#-cara-login)
- [📊 Membaca Dashboard](#-membaca-dashboard)
- [📌 Catatan Tempel (Memo)](#-catatan-tempel-memo)
- [📣 Mengolah Keluhan Siswa (Aspirasi)](#-mengolah-keluhan-siswa-aspirasi)
- [👥 Mengatur Anggota Pengurus](#-mengatur-anggota-pengurus)
- [🕸️ Mengatur Bagan Organisasi (Hirarki)](#-mengatur-bagan-organisasi-hirarki)
- [🛡️ Tips Keamanan Sistem](#-tips-keamanan-sistem)

---

## 🔑 Cara Login

Berikut adalah cara masuk ke panel admin:
1. Buka tautan resmi berikut: **[Halaman Login MPK](https://mpksmansamal.netlify.app/login)**
2. Masukkan **Email** dan **Kata Sandi** admin yang telah diberikan oleh Humas atau tim IT MPK.
3. Klik **Masuk**. 

> [!NOTE]
> Di belakang layar, peramban (browser) akan mengunci sesi kita menggunakan cookie aman agar tidak mudah keluar (logout) secara otomatis saat sedang digunakan bekerja. Jika Anda lupa kata sandi, silakan langsung hubungi saya selaku pengembang agar dapat disetel ulang.

---

## 📊 Membaca Dashboard

Saat pertama kali masuk, Anda akan melihat angka-angka statistik pada halaman utama. Berikut adalah penjelasannya:
- **Pengurus**: Jumlah total anggota MPK aktif yang saat ini terdaftar di website.
- **Aspirasi Masuk**: Akumulasi semua keluhan siswa yang pernah dikirimkan ke website.
- **Belum Diproses**: Antrean keluhan baru yang harus segera kita baca dan tindaklanjuti.
- **Selesai Ditinjau**: Keluhan yang telah selesai dicarikan solusinya secara tuntas.
- **Laporan Progres**: Grafik warna-warni yang menunjukkan perbandingan status keluhan (Belum Diproses, Sedang Ditinjau, dan Selesai). Jika grafik didominasi warna hijau (Selesai), berarti kinerja organisasi kita berjalan sangat baik!
- **Jurnal Kebijaksanaan**: Berisi kutipan kata-kata bijak harian agar kita tetap tenang dan bijaksana saat menghadapi masukan dari para siswa.

---

## 📌 Catatan Tempel (Memo)

Papan tulis warna-warni pada dasbor berfungsi untuk menaruh memo pengingat seperti jadwal agenda atau catatan penting lainnya agar seluruh admin yang masuk sistem dapat saling membaca secara seketika (real-time).

- **Menempelkan Memo Baru**:
  1. Klik tombol **+ Tempel Memo**.
  2. Ketik pesan Anda pada kotak dialog. Contoh: _"Rapat koordinasi hari Jumat pukul 13.00 di ruang MPK, jangan terlambat!"_.
  3. Klik **OK**. Memo Anda akan langsung terpasang di layar semua pengurus secara seketika dengan posisi miring yang estetis.
- **Menghapus Memo Lama**:
  1. Sentuh atau arahkan mouse ke memo yang ingin dihapus.
  2. Klik tanda silang **(X)** kecil di pojok kanan atas memo tersebut. Memo akan langsung terhapus secara permanen dari basis data.

---

## 📣 Mengolah Keluhan Siswa (Aspirasi)

Siswa dapat mengirimkan keluhan melalui halaman depan website. Agar tidak ada kiriman iseng berupa pesan kosong atau sekadar gurauan, sistem akan otomatis menolak kiriman yang isinya di bawah 10 karakter.

### Cara Kita Menangani Aspirasi:
1. Buka tab **Aspirasi Masuk** pada sidebar kiri.
2. Pada tabel, Anda dapat melihat isi keluhan, kelas, dan nama pelapor (jika mereka tidak memilih untuk menjadi anonim).
3. **Mengubah Status Keluhan**:
   - Klik dropdown status pada baris keluhan tersebut sesuai dengan perkembangannya:
     - **Belum Diproses**: Keluhan baru masuk dan belum ditindaklanjuti.
     - **Sedang Ditinjau**: Sedang dibahas dalam rapat internal atau sedang dikoordinasikan dengan guru BK/pembina.
     - **Pending**: Sedang menunggu keputusan atau persetujuan dari pihak sekolah.
     - **Selesai**: Masalah telah teratasi dan mendapatkan solusi konkret (misalnya toilet rusak yang telah selesai diperbaiki).
     - **Anomali**: Keluhan tidak jelas, spam, atau isinya kasar dan tidak valid.
4. **Memberikan Jawaban Resmi**:
   - Ketik tanggapan resmi dari MPK pada kolom yang tersedia agar pengirim mengetahui bahwa suaranya didengar, lalu klik **Simpan Tanggapan**. Jawaban ini akan langsung tampil di halaman depan website.

---

## 👥 Mengatur Anggota Pengurus

Agar halaman publik tidak kosong, kita perlu memasukkan profil anggota pengurus MPK aktif melalui menu **Pengurus**.

### Tambah Anggota Satu Per Satu:
1. Isi **Nama**, pilih **Jabatan**, **Komisi**, **Kelas**, dan **Jenis Kelamin**.
2. **Set Foto Profil (Tanpa Upload Gambar)**:
   - Kita tidak perlu mengunggah berkas foto asli agar website tetap ringan. Cukup pilih **Gaya Avatar** pada dropdown (tersedia pilihan _Pixel Art_, _Bottts_ robot, _Adventurer_, dan lainnya).
   - Klik tombol **🎲 Random** untuk mengacak pola gambarnya, atau klik salah satu kotak warna di bawah pratinjau sampai menemukan pola kartun yang cocok.
3. Klik **Simpan Anggota**.

### Impor Banyak Sekaligus (Jurus Cepat):
Jika Anda ingin menghemat waktu saat awal tahun ajaran baru, gunakan fitur **Smart Batch Import**:
- Salin dan tempel daftar nama dengan format: `Nama | Jabatan | Komisi | Kelas | Jenis Kelamin` (satu orang per baris).
- Contoh:
  ```text
  Fata Shina | Ketua MPK | Inti | XII-F5 | Laki-laki
  Shina Fata | Anggota Komisi A | Komisi A | XI-F3 | Laki-laki
  ```
- Klik **Mulai Impor Massal**, maka sistem akan otomatis memasukkan semuanya secara instan.

---

## 🕸️ Mengatur Bagan Organisasi (Hirarki)

Agar struktur organisasi (organogram) pada halaman publik tersusun rapi dari Ketua di bagian atas sampai anggota komisi di bawahnya, kita dapat mengaturnya melalui menu **Hirarki Jabatan**.

- **Geser Posisi (Drag-and-Drop)**:
  - Cukup klik, tahan, lalu geser (drag-and-drop) posisi jabatan ke atas atau ke bawah untuk mengatur urutan tampil di halaman depan. Urutan tersebut akan langsung tersimpan secara otomatis ke dalam basis data.
- **Set Atasan Langsung (Parent)**:
  - Saat menambah atau mengedit jabatan, tentukan siapa atasan langsungnya. Misalnya: _Anggota Komisi B_ atasannya adalah _Koordinator Komisi B_. Bagan organisasi kita akan bercabang rapi layaknya pohon ek yang kokoh.

---

## 🛡️ Tips Keamanan Sistem

Sistem keamanan website kita sudah sangat kuat di belakang layar, namun kelalaian kita sendiri dapat menjadi celah. Tolong ikuti beberapa tips sederhana berikut:

1. **Wajib Keluar Sesi (Log Out)**: Jika Anda masuk menggunakan komputer sekolah, komputer orang lain, atau ponsel teman, selalu klik **Keluar Sesi (Log Out)** setelah selesai bekerja. Jangan sampai akun Anda tetap terhubung karena rentan disalahgunakan oleh pihak lain.
2. **Jaga Rahasia Akun**: Jangan pernah membagikan email dan kata sandi admin ke grup kelas atau angkatan (hanya berikan kepada pihak yang benar-benar tepercaya).
3. **Hargai Privasi Teman**: Alamat IP pengirim keluhan sengaja disamarkan agar mereka aman bersuara tanpa rasa takut. Oleh karena itu, mohon jaga kerahasiaan identitas mereka dan jangan menyebarkan nama pelapor yang tidak anonim ke grup obrolan luar.

---

_Semangat bertugas, rekan-rekan! Jadilah pengurus yang aktif dan jembatan aspirasi yang tepercaya bagi seluruh siswa SMAN 1 Malingping. Tetap kompak dan selalu berikan kinerja terbaik!_ ⚖️🍂
