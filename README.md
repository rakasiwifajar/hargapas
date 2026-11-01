# HargaPas

**HargaPas by Universitas Terbuka Majene** — kalkulator HPP (harga pokok produksi) dan harga jual untuk UKM. Gratis, tanpa akun, bisa dipakai offline, dan data tersimpan di HP pengguna.

## Fitur

- Dua cara mengisi data: **per batch** (resep, cocok untuk makanan dan minuman) atau **per unit** (cocok untuk kerajinan dan konveksi). Saat pindah mode, angka dikonversi otomatis sehingga HPP tetap sama.
- HPP per unit dari bahan baku, tenaga kerja, kemasan, dan overhead bulanan.
- Harga jual dengan metode margin atau markup, lengkap dengan harga per kanal: toko, reseller, dan marketplace.
- Hitung mundur dari harga pasar, titik impas (BEP) bulanan, dan simulasi kenaikan harga bahan.
- Kirim ringkasan ke WhatsApp, cetak ke PDF, serta cadangkan dan pulihkan data (file JSON).

## Isi folder

| File | Fungsi |
| --- | --- |
| `index.html` | Aplikasi siap pakai (satu file, mesin hitung sudah di dalamnya) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Supaya bisa dipasang di layar utama HP dan dibuka offline |
| `src/engine.js` | Semua rumus perhitungan (fungsi murni) |
| `src/app.html` | Tampilan aplikasi (sumber `index.html`) |
| `tests/test.js` | Uji otomatis rumus dengan kasus bolu pisang |

## Menerbitkan dengan GitHub Pages

1. Buat repository baru di GitHub, misalnya `hargapas`, dengan visibilitas **Public**.
2. Unggah seluruh isi folder ini ke repository (tombol **Add file → Upload files**, atau `git push`).
3. Buka **Settings → Pages**. Pada **Source** pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit. Aplikasi bisa dibuka di `https://<username>.github.io/hargapas/`.
5. Di HP Android, buka alamat itu di Chrome, lalu pilih menu **Tambahkan ke layar utama**.

Setiap kali `index.html` diubah, naikkan nilai `VERSI` di `sw.js` (misalnya `hargapas-v2`) supaya pengguna lama mendapat versi terbaru.

## Menjalankan uji

```bash
node tests/test.js
```

## Mengubah rumus atau tampilan

Ubah `src/engine.js` atau `src/app.html`, lalu gabungkan lagi menjadi `index.html` dengan menempelkan isi `engine.js` di tempat penanda `/*__ENGINE__*/` di dalam `app.html`.

## Pengembang

Dikembangkan oleh Universitas Terbuka Majene.

## Lisensi

Belum ditentukan. Untuk aplikasi gratis yang boleh dipakai dan dikembangkan orang lain, lisensi MIT adalah pilihan yang umum.
