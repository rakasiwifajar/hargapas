# Catatan perubahan HargaPas

## 2.5.1 — 1 November 2026
- Pita emas di layar pembuka dan kartu sambutan dibuat lebih realistis: bingkai logam berkilau di kedua tepi, ukiran sure' dengan ornamen bunga kecil, bayangan lipatan dan bayangan jatuh, titik cahaya di lekukan; motif lebih besar dan lebih redup agar tetap bersih.

## 2.5.0 — 1 November 2026
### Baru
- Stok produk jadi: catat produksi (termasuk stok awal), sisa stok = dibuat − terjual otomatis dari catatan penjualan, penanda Siap dijual / Menipis / Habis, peringatan bila stok tercatat minus saat menjual.
- Tombol "Hitung dari stok produk" mengisi persediaan akhir bulan = stok × modal per barang.
- Mode gelap: Pengaturan → Tema warna (Ikuti HP / Terang / Gelap). Laporan cetak tetap berlatar putih.

## 2.4.0 — 1 November 2026
### Baru
- Penjualan per produk menyatu dengan Keuangan: di Uang masuk → Penjualan pilih produk dan jumlahnya (tombol − / +), jumlah uang terisi otomatis dari harga jual; masih bisa diubah manual untuk diskon.
- Kirim nota penjualan lewat WhatsApp setelah mencatat atau dari catatan yang sudah ada.
- Tombol "Ingatkan" untuk pembeli yang belum bayar: pesan tagihan sopan lewat WhatsApp.
- Belanja bahan bisa sekaligus memperbarui harga bahan; modal semua produk yang memakai bahan itu ikut dihitung ulang.
- Produk terlaris bulan ini (jumlah dan perkiraan untung) di Keuangan; ringkasan penjualan 7 hari dibanding pekan sebelumnya di Beranda.
- Daftar istilah (bahasa sehari-hari ↔ istilah resmi) di halaman Tentang.
### Perubahan
- Kartu "Bulan ini" di Beranda menjadi tautan ke Keuangan; tombol ganda dihapus sehingga menu cepat menjadi jalan utama.
- Istilah diseragamkan: "Untung bersih" di aplikasi, "Laba bersih" di laporan; kartu produk menulis "Modal / satuan" dan "Untung / satuan".
- Jendela yang terbuka otomatis tertutup saat pindah halaman.

## 2.3.3 — 1 November 2026
- Perbaikan: tombol Uang masuk/keluar meluap 2 px di layar 360 px; area sentuh tombol bantuan "?" diperbesar menjadi ±46 px.

## 2.3.2 — 1 November 2026
- Bagian bawah Beranda dibuat lebih ringkas dan bersih: kartu produk lebih kecil, pintasan berupa tombol kapsul kecil, kaki halaman satu baris dengan logo UT dan tautan teks.

## 2.3.1 — 1 November 2026
- Bagian bawah Beranda diperhalus: kartu produk dengan inisial berwarna, status berwarna, dan bilah kemajuan untuk produk yang belum lengkap; pintasan "Lihat contoh" dan "Panduan singkat" berbentuk kartu; kaki halaman berupa kartu biru malam dengan pita emas sure', logo UT, dan tautan berbentuk kapsul.

## 2.3.0 — 1 November 2026
### Tampilan
- Gaya biru malam berpendar dengan pita emas bermotif sure' Mandar yang meliuk di layar pembuka dan kartu sambutan.
- Menu cepat berbentuk tombol bundar di panel kaca: Hitung harga, Uang masuk, Uang keluar, Laporan, Harga bahan.
- Pita tips emas yang berganti setiap hari; kartu kas Keuangan bergaya kartu saldo; tombol utama berbentuk kapsul.

## 2.2.0 — 1 November 2026
- Saldo awal kini bisa memuat pembeli yang masih berutang (piutang awal) dan bon ke pemasok (utang usaha awal); ikut daftar Belum dibayar dan bisa dilunasi.
- Konfirmasi untuk jumlah ≥ Rp50 juta agar salah ketik nol tidak lolos.
- "Lihat contoh laporan" untuk pengguna baru dan pendamping UMKM.
- Peringatan bila nama usaha, pemilik, atau alamat belum diisi sebelum mencetak laporan.
- Tautan "catat uang masuk & keluar" di kartu sambutan beranda.

## 2.1.0 — 1 November 2026
### Baru
- Pembeli belum bayar (piutang usaha) dan bon ke pemasok (utang usaha): diakui saat terjadi, kas bergerak saat dilunasi; daftar "Belum dibayar" dengan tombol pelunasan dan penanda umur tagihan > 30 hari.
- Cadangan dibagikan langsung sebagai file (WhatsApp/Drive) di HP yang mendukung; pengingat cadangan mingguan bila ada catatan keuangan; permintaan penyimpanan permanen.
- Panduan "Cara menyimpan sebagai PDF" sebelum cetak (Android & iPhone); unduh semua transaksi ke Excel (CSV).
- Perkiraan PPh final 0,5% bulanan + tombol catat; perbandingan untung nyata vs rencana hitungan harga; peringatan penjualan tercatat dua kali; Bacakan ringkasan Keuangan; pengingat "terakhir mencatat".
- Laporan laba rugi dengan kolom pembanding bulan lalu; neraca memuat piutang dan utang usaha.
- Pelajaran baru: pisahkan uang usaha, kebiasaan mencatat, piutang & bon, menyiapkan pengajuan pinjaman. Kebijakan privasi mencakup data keuangan.

## 2.0.0 — 1 November 2026
### Baru
- Menu **Keuangan**: catat uang masuk/keluar per jenis (penjualan, modal, pinjaman, belanja bahan, upah, sewa, listrik/gas, ongkir, promosi, bunga, pajak, beli peralatan, cicilan pokok, ambil pribadi), pemilih bulan, sisa stok akhir bulan, rekap catatan penjualan ke Keuangan.
- **Data usaha & saldo awal**: identitas usaha, kas, persediaan, peralatan (umur pakai), pinjaman.
- **Laporan keuangan bulanan (PDF)** untuk pengajuan pinjaman: laba rugi, arus kas (metode langsung), posisi keuangan dengan pemeriksaan keseimbangan, ringkasan dan grafik 3/6/12 bulan, rasio kemampuan bayar angsuran, catatan atas laporan, pernyataan dan tanda tangan pemilik, lampiran transaksi. Mengacu SAK EMKM yang disederhanakan.
- Mesin hitung `hitungBuku`, `laporanBulan`, `ringkasanBulan` dengan 31 uji baru.
### Tampilan
- Kepala aplikasi satu baris, identitas UT tidak berulang; tanda "Tersimpan" ringkas di HP.
- Sapaan dan tanggal di beranda; tipografi angka tabular; bayangan dan warna lebih konsisten; tombol biru untuk aksi sekunder.
- Layar pembuka baru dengan indikator memuat dan keterangan "Dikembangkan oleh Universitas Terbuka Majene".
### Perbaikan
- Pilihan produk kosong saat membuka contoh/kartu produk.
- Lembar dialog panjang kini bisa digulir.
- Pemulihan cadangan menerima data yang hanya berisi catatan keuangan.

## 1.5.0 — 1 November 2026

Fokus: ketepatan ekonomi dan relevansi bagi UMKM Majene.

- **Biaya bulanan dipakai bersama.** Gas, listrik, sewa, dan alat dicatat sekali untuk seluruh usaha lalu dibagi ke produk: rata, sesuai lama produksi, atau persen yang diatur sendiri. Modal tiap produk tidak lagi terhitung terlalu tinggi bagi UKM dengan banyak produk.
- **PPh final 0,5% dari omzet** (pilihan). Harga dinaikkan secukupnya agar untung bersih tetap sesuai target.
- **Potongan di harga toko** (mis. QRIS) dan **biaya per unit** (mis. ongkir) ikut dihitung; titik impas memakai untung setelah potongan.
- **Rencana sebulan:** perkiraan omzet dan untung bersih dari rencana penjualan, serta jumlah yang harus terjual untuk mencapai target untung.
- **Atur harga** (tampilan Lengkap): posisi harga terhadap pesaing, pilihan harga yang enak dibaca (mis. Rp9.900), dan harga paket.
- **Catat penjualan** harian di Beranda, dengan ringkasan **Bulan ini** (terjual, omzet, perkiraan untung) dibandingkan rencana.
- **Template produk khas Majene:** abon ayam, abon ikan, sambal ikan tuing-tuing, bawang goreng, bon cabe.
- **Pelajaran singkat** (6 topik), **Kirim masukan** ke pengembang, dan **penafian** di Tentang, footer, dan laporan.
- **Struktur kode:** `src/app.html`, `src/app.css`, `src/app.js`, `src/engine.js` digabung oleh `tools/build.js`.
- **Uji otomatis:** 70 uji rumus dan 22 uji tampilan (Playwright) dijalankan di GitHub Actions setiap push.

## 1.4.0 — 1 November 2026

- **Beranda** berisi sapaan "Selamat datang di HargaPas by Universitas Terbuka Majene", kartu per produk (modal, harga jual, untung, tanda untung sehat/tipis/rugi), dan tombol besar **Hitung produk baru**. Data contoh tidak lagi menjadi produk pertama; tersedia lewat **Lihat contoh perhitungan**.
- **Navigasi bawah berikon** di HP (Beranda · Hitung · Bahan · Lainnya); di laptop tampil di atas.
- **Menu Lainnya** (Laporan, Pengaturan, Cadangan data, Lembar isian, Panduan, Tentang, Privasi) dan **Pengaturan** lewat ikon roda gigi (tampilan Sederhana/Lengkap, ukuran huruf).
- **Tampilan kosong yang ramah:** peringatan baru muncul setelah pengguna mulai mengisi; hasil diganti kartu "Hasil akan muncul di sini" dengan penanda kemajuan 3 langkah; bilah bawah disembunyikan sampai ada hasil.
- **Tanda "Tersimpan"** setelah setiap perubahan, animasi halus saat angka berubah.
- **Harga bahan berbentuk kartu** dengan pencarian dan keterangan "dipakai di N produk".
- **Ikon jenis usaha** di pilihan template.
- **Kartu harga bergambar** (PNG 1080×1350) berisi nama produk, harga jual, modal, untung, batas balik modal, logo HargaPas dan UT, serta pola sure'; dibagikan langsung ke WhatsApp/aplikasi lain atau diunduh.
- **Layar pembuka** bermotif sure' saat aplikasi dibuka dari layar utama HP; latar layar pembuka Android ikut biru UT.
- **Ikon aplikasi baru:** label harga dengan centang kuning di atas gradasi biru UT dan pita sure'; versi maskable (Android bulat/kotak) dan monochrome (ikon bertema Android 13+). Pintasan "Hitung produk baru" dan "Harga bahan" saat ikon ditekan lama.
- **Pengembang dan kontak:** Fajar Rakasiwi, Universitas Terbuka Majene, rakasiwifajar@ecampus.ut.ac.id (halaman Tentang, Privasi, dan footer). Rujukan metode ditambahkan.
- Pesan pemeriksaan isian memakai bahasa sehari-hari; perbaikan titik impas tanpa biaya tetap.

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
