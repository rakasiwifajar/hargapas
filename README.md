# HargaPas

**HargaPas by Universitas Terbuka Majene** — kalkulator HPP (harga pokok produksi) dan harga jual untuk UKM. Gratis, tanpa akun, bisa dipakai offline, dan data tersimpan di HP pengguna.

Buka aplikasinya: **https://rakasiwifajar.github.io/hargapas/**

## Fitur

- Biaya bulanan dipakai bersama antar produk, PPh final 0,5% (pilihan), rencana sebulan dan target untung, catatan penjualan harian, template produk khas Majene (abon ayam, abon ikan, sambal ikan tuing-tuing, bawang goreng, bon cabe).
- **Tampilan Sederhana** (langkah demi langkah, bahasa sehari-hari, kesimpulan berupa kalimat yang bisa dibacakan) dan **Lengkap** (semua fitur).
- Satuan beli dan pakai dipilih dari daftar, dikonversi otomatis (kg↔gram, liter↔ml, meter↔cm). Pilihan ukuran huruf untuk pengguna lanjut usia.
- Untuk pendamping: lembar isian cetak (`#lembar`) dan kirim produk ke HP lain lewat tautan WhatsApp.
- Dua cara mengisi data: **per batch** (resep, cocok untuk makanan dan minuman) atau **per unit** (kerajinan, konveksi). Saat berpindah, angka dikonversi otomatis sehingga HPP tetap sama.
- HPP per unit dari bahan baku, tenaga kerja, kemasan, overhead bulanan, dan persentase gagal/susut.
- Harga jual dengan metode margin atau markup, plus harga per kanal penjualan yang bisa ditambah sendiri.
- Hitung mundur dari harga pasar, titik impas (BEP) dengan pemisahan biaya tetap dan variabel, simulasi kenaikan harga bahan.
- Harga bahan bersama antarproduk, template usaha, panduan singkat, dan penjelasan istilah.
- Laporan siap cetak/PDF berkop HargaPas dan Universitas Terbuka, kirim ringkasan ke WhatsApp, cadangan dan pemulihan data.
- **Keuangan (2.0)**: catat uang masuk/keluar, saldo awal, dan laporan keuangan bulanan siap PDF untuk pengajuan pinjaman (laba rugi, arus kas, neraca, ringkasan & grafik, catatan atas laporan; mengacu SAK EMKM yang disederhanakan).

## Struktur

| Lokasi | Isi |
| --- | --- |
| `index.html` | Aplikasi siap pakai (hasil build, jangan diedit langsung) |
| `src/app.html` | Kerangka halaman |
| `src/app.css` | Gaya tampilan |
| `src/app.js` | Logika antarmuka |
| `src/engine.js` | Semua rumus perhitungan (fungsi murni) |
| `assets/` | Logo Universitas Terbuka dan ikon sumber (SVG) |
| `icons/`, `manifest.webmanifest`, `sw.js` | PWA: ikon, pemasangan di layar utama, mode offline |
| `tests/engine.test.js` | Uji otomatis rumus |
| `tests/e2e.js` | Uji tampilan otomatis (Playwright) |
| `tools/build.js` | Menggabungkan `src/` dan `assets/` menjadi `index.html` |
| `docs/play-store.md` | Panduan menerbitkan ke Google Play |
| `CHANGELOG.md` | Catatan perubahan per versi |

## Mengembangkan

Butuh [Node.js](https://nodejs.org) versi 18 atau lebih baru.

```bash
node tests/engine.test.js   # uji rumus
npm install --no-save playwright@1 && npx playwright install chromium
node tools/build.js && node tests/e2e.js   # uji tampilan
node tools/build.js         # bangun ulang index.html setelah mengubah src/
```

Setiap rilis baru:

1. Ubah `version` di `package.json` (misalnya `1.0.1`) dan tambahkan catatan di `CHANGELOG.md`.
2. Jalankan `node tools/build.js`. Versi cache di `sw.js` ikut diperbarui otomatis, sehingga pengguna yang sudah memasang aplikasi mendapat versi baru.
3. Commit dan push ke `main`. GitHub Actions menjalankan uji dan memastikan `index.html` sudah dibangun ulang; GitHub Pages menerbitkan versi baru dalam 1–2 menit.

## Pengembang

Fajar Rakasiwi, Universitas Terbuka Majene — rakasiwifajar@ecampus.ut.ac.id. Logo Universitas Terbuka digunakan untuk menunjukkan identitas pengembang.

## Lisensi

Belum ditentukan. Untuk aplikasi gratis yang boleh dipakai dan dikembangkan pihak lain, lisensi MIT adalah pilihan yang umum.
