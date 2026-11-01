# Menerbitkan HargaPas di Google Play

HargaPas sudah berbentuk PWA (bisa dipasang dan dibuka offline), sehingga bisa dibungkus menjadi aplikasi Android dengan **Trusted Web Activity (TWA)** tanpa menulis ulang kode.

## Yang perlu disiapkan

1. **Akun Google Play Console** atas nama Universitas Terbuka Majene (biaya pendaftaran satu kali).
2. **Domain sendiri** (misalnya `hargapas.id`). TWA bisa memakai alamat GitHub Pages, tetapi domain sendiri lebih aman jangka panjang karena alamat aplikasi tidak bergantung pada akun GitHub pribadi.
3. **Kebijakan privasi** dengan alamat publik: sudah tersedia di aplikasi, `https://<alamat-aplikasi>/#privasi`.
4. Ikon 512×512 (`icons/icon-512.png`) dan beberapa tangkapan layar HP.

## Langkah

1. Buka [PWABuilder](https://www.pwabuilder.com), masukkan alamat HargaPas, lalu pilih **Package for stores → Android**.
2. Isi nama paket, misalnya `id.ac.ut.majene.hargapas`, dan unduh paketnya (berisi file `.aab` dan `assetlinks.json`).
3. Unggah `assetlinks.json` ke folder `.well-known/` di repository ini, lalu push. File ini membuktikan bahwa aplikasi Android dan situs web dimiliki pihak yang sama.
4. Di Play Console, buat aplikasi baru dan unggah file `.aab`. Isi deskripsi, kategori **Bisnis**, tangkapan layar, dan tautan kebijakan privasi.
5. Ajukan peninjauan. Setelah disetujui, setiap pembaruan di GitHub otomatis ikut tampil di aplikasi Android tanpa perlu unggah ulang ke Play Store.

Simpan baik-baik file kunci penandatanganan (*signing key*) yang dibuat PWABuilder. Tanpa kunci itu, pembaruan aplikasi di Play Store tidak bisa diterbitkan.
