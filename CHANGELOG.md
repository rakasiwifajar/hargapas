# Catatan perubahan HargaPas

## 1.1.0 — 1 November 2026

- Tampilan dua kolom di layar lebar (laptop/PC): isian di kiri, hasil selalu terlihat di kanan.
- Daftar bahan ringkas: satu baris per bahan berisi harga, isi, pemakaian, dan biaya; ketuk untuk mengubah. Halaman di HP sekitar 25% lebih pendek.
- Pengaturan kanal penjualan didesain ulang (kartu per kanal, label jelas, tidak terpotong di HP).
- Kotak hasil hitung mundur, titik impas, dan simulasi kini sejajar tiga kolom.
- Penanda "data contoh" dengan tombol "Mulai produk saya".
- Strip identitas Universitas Terbuka Majene di bagian atas.
- Huruf Plus Jakarta Sans (tersimpan untuk mode offline setelah dibuka sekali).
- Satuan produk dipakai konsisten (mis. "HPP / potong", hasil per batch dalam "potong").
- Tombol cadangan dan pemulihan data dikelompokkan agar bagian Bagikan lebih rapi.

## 1.0.0 — 1 November 2026

- Identitas Universitas Terbuka Majene: logo UT di panduan awal, header, halaman Tentang, footer, dan laporan.
- Ikon aplikasi baru (label harga dengan tanda centang).
- Pemisah ribuan pada semua isian angka (14.000, bukan 14000).
- Panduan singkat 3 layar untuk pengguna baru, dan tombol **?** yang menjelaskan istilah (HPP, susut, penyusutan, biaya tetap/variabel, margin, kanal, titik impas).
- Template usaha saat membuat produk baru: kue & roti, minuman, keripik & camilan, jahitan & konveksi, kerajinan.
- Persentase gagal/susut produksi.
- Titik impas memisahkan biaya tetap (sewa, penyusutan, lain-lain) dan variabel (gas, listrik).
- Kanal penjualan bisa ditambah sendiri (diskon dari harga toko atau dipotong komisi).
- Harga bahan bersama antarproduk dan halaman **Harga bahan** untuk memperbarui semuanya sekaligus.
- Laporan siap cetak/PDF dengan kop HargaPas dan logo UT.
- Halaman **Tentang & metode** dan **Kebijakan privasi**.
- Pemeriksaan isian yang memberi tahu data yang janggal (isi kemasan kosong, satuan mencurigakan).
- Pengingat cadangan data setiap 30 hari, dan pulihkan data dari teks.
- Struktur kode: `src/` (sumber), `tools/build.js` (penggabung), uji otomatis di GitHub Actions.

## 0.2.0 — 1 November 2026

- Nama aplikasi menjadi HargaPas, sambutan "by Universitas Terbuka Majene".
- Pilihan cara mengisi data: per batch atau per unit.

## 0.1.0 — 1 November 2026

- Prototipe pertama: HPP, harga markup/margin, harga per kanal, hitung mundur, titik impas, simulasi.
