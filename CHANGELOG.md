# Catatan perubahan HargaPas

## 1.3.0 — 1 November 2026

Fokus: mudah dipakai oleh pelaku UMKM/IKM dengan latar pendidikan, kemampuan teknologi, dan usia yang beragam.

- **Tampilan Sederhana dan Lengkap.** Sederhana (bawaan) memandu langkah demi langkah dan hanya menampilkan modal, harga jual, untung, dan batas balik modal. Lengkap menampilkan semua fitur.
- **Bahasa sehari-hari** dengan istilah resmi di dalam kurung: "Modal per potong (HPP)", "Batas balik modal (BEP)", "Tempat menjual", "Sekali masak / Satu per satu".
- **Satuan dipilih dari daftar** (gram, ons, kg, ml, liter, cm, meter, butir, buah, pcs, dll.) dan dikonversi otomatis: "Beli 1 kg Rp14.000, dipakai 500 gram".
- **Kesimpulan berupa kalimat** dengan warna lampu lalu lintas, dan tombol **Bacakan** (suara bahasa Indonesia bawaan HP).
- **Ramah lansia:** pilihan ukuran huruf (A / A+ / A++), huruf kecil dinaikkan (teks di bawah 14 px turun dari 58% menjadi 16%), tombol minimal 44 px.
- **Konfirmasi hapus** yang jelas dan tombol **Batalkan** setelah menghapus.
- **Isian tambahan boleh dilewati** (barang rusak, sewa, alat, lain-lain) dan bantuan **"Tidak tahu persis?"** untuk memperkirakan gas (tabung × harga) dan listrik (tagihan × bagian usaha).
- **Untuk pendamping:** lembar isian cetak untuk UKM tanpa HP pintar, dan **kirim produk ke HP lain** lewat tautan WhatsApp.
- Ikon di setiap langkah, tombol "Lanjut ke langkah berikutnya" dan "Lihat hasilnya".

## 1.2.0 — 1 November 2026

- Palet warna Universitas Terbuka: biru tua (#1E4094) sebagai warna utama dan kuning (#F9D800) sebagai aksen; diambil dari logo UT.
- Pola terinspirasi sure' lipaq saqbe Mandar (silangan garis vertikal dan horizontal) pada strip identitas, panduan awal, kartu HPP, bilah bawah, halaman Tentang, footer, dan kop laporan.
- Ikon aplikasi berwarna UT (biru tua dengan centang kuning).
- Tombol ajakan utama berwarna kuning UT, tab aktif bergaris kuning.
- Penjelasan warna dan motif di halaman Tentang.

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
