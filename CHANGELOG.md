# Catatan perubahan HargaPas

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
