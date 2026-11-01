// Uji mesin hitung HargaPas. Jalankan: node tests/engine.test.js
const H = require('../src/engine.js');
const assert = require('assert');
let lulus = 0;
const near = (a, b, tol, msg) => { assert(Math.abs(a - b) <= tol, `${msg}: ${a} != ${b}`); lulus++; };
const eq = (a, b, msg) => { assert.strictEqual(a, b, msg); lulus++; };

const bolu = {
  hasilBatch: 24, batchBulan: 20, susutPct: 0, upahJam: 15000, jamBatch: 3, kemasan: 1000,
  bahan: [
    { nama: 'Tepung', harga: 14000, isi: 1000, pakai: 500 },
    { nama: 'Gula', harga: 18000, isi: 1000, pakai: 400 },
    { nama: 'Telur', harga: 2000, isi: 1, pakai: 8 },
    { nama: 'Mentega', harga: 45000, isi: 500, pakai: 250 },
    { nama: 'Pisang', harga: 20000, isi: 10, pakai: 10 },
  ],
  overhead: { gas: 120000, listrik: 150000, sewa: 0, hargaAlat: 3000000, umurAlat: 36, lain: [{ nilai: 50000 }] },
};

// HPP (full costing)
const r = H.hitungHPP(bolu);
near(r.bahanBatch, 72700, 0.01, 'bahan batch');
near(r.perUnit.bahan, 3029.17, 0.01, 'bahan/unit');
near(r.perUnit.tenagaKerja, 1875, 0.01, 'tk/unit');
near(r.overheadBulan, 403333.33, 0.01, 'overhead bulanan');
near(r.perUnit.overhead, 840.28, 0.01, 'overhead/unit');
near(r.hpp, 6744.44, 0.01, 'HPP');

// Overhead tetap vs variabel
near(r.overheadVariabel, 270000, 0.01, 'overhead variabel (gas+listrik)');
near(r.overheadTetap, 133333.33, 0.01, 'overhead tetap (sewa+penyusutan+lain)');
near(r.vc, 6466.67, 0.01, 'biaya variabel/unit');

// Harga
near(H.hargaDasar(r.hpp, 'markup', 30), 8767.78, 0.01, 'markup 30%');
near(H.hargaDasar(r.hpp, 'margin', 30), 9634.92, 0.01, 'margin 30%');
near(H.hargaKanal(r.hpp, 12, 0, 30), 11628.35, 0.01, 'harga kanal komisi');
near(H.marginAktual(10000, r.hpp, 0, 0), 0.32556, 0.0001, 'margin aktual');
near(H.marginAktual(H.hargaKanal(r.hpp, 12, 500, 30), r.hpp, 12, 500), 0.30, 1e-9, 'kanal bolak-balik');

const kanal = H.hargaSemuaKanal(r.hpp, { metode: 'margin', persen: 30, bulat: 500 }, [
  { nama: 'Toko', tipe: 'langsung' },
  { nama: 'Reseller', tipe: 'diskon', persen: 15 },
  { nama: 'Marketplace', tipe: 'komisi', persen: 12, biaya: 0 },
]);
eq(kanal[0].harga, 10000, 'harga toko');
eq(kanal[1].harga, 8500, 'harga reseller');
eq(kanal[2].harga, 12000, 'harga marketplace');
near(kanal[2].margin, 0.318, 0.001, 'margin marketplace');

// BEP dengan overhead tetap saja
const b = H.bep(r.fc, 10000, r.vc);
eq(b.unitBulat, 38, 'BEP unit');
eq(H.bep(r.fc, 6000, r.vc), null, 'BEP saat harga < biaya variabel');

eq(H.bep(0, 10000, 6000).unitBulat, 0, 'BEP tanpa biaya tetap = 0, bukan -0');
eq(Object.is(H.bep(0, 10000, 6000).unitBulat, -0), false, 'bukan minus nol');

// Simulasi
const s = H.simulasiBahan(bolu, 10, 10000);
near(s.hppBaru, 7047.36, 0.01, 'simulasi HPP');
near(s.marginBaru, 0.29526, 0.0001, 'simulasi margin');
near(s.hargaPertahankan, 10449.14, 0.01, 'simulasi harga');

// Susut 5%
const r5 = H.hitungHPP({ ...bolu, susutPct: 5 });
near(r5.nLayak, 22.8, 1e-9, 'unit layak');
near(r5.perUnit.bahan, 72700 / 22.8, 0.01, 'bahan/unit dengan susut');
near(r5.perUnit.overhead, 403333.333 / (22.8 * 20), 0.01, 'overhead/unit dengan susut');

// Mode per unit (n = 1)
const tas = H.hitungHPP({ hasilBatch: 1, batchBulan: 40, upahJam: 15000, jamBatch: 4, kemasan: 3000,
  bahan: [{ harga: 25000, isi: 100, pakai: 300 }], overhead: { listrik: 100000 } });
near(tas.hpp, 140500, 0.01, 'HPP tas rajut');

// Pembulatan & tepi
eq(H.bulatkan(9634.92, 500), 10000, 'bulatkan');
eq(H.bulatkan(10000, 500), 10000, 'bulatkan pas');
eq(H.bulatkan(0, 500), 0, 'bulatkan nol tanpa -0');
eq(H.hitungHPP({ hasilBatch: 0, bahan: [] }).hpp, 0, 'produk kosong');
eq(H.hargaKanal(1000, 60, 0, 50), Infinity, 'komisi + margin >= 100%');

// Pemeriksaan input
const cek = H.periksa({ mode: 'batch', hasilBatch: 0, batchBulan: 0, bahan: [{ nama: 'Terigu', harga: 14000, isi: '', pakai: 500 }, { nama: 'Gula', harga: 18, isi: 1, pakai: 500 }] });
eq(cek.some((x) => x.pesan.includes('sekali produksi jadi berapa')), true, 'cek hasil batch');
eq(cek.some((x) => x.pesan.includes('Terigu') && x.level === 'bad'), true, 'cek isi kemasan');
eq(cek.some((x) => x.pesan.includes('Gula') && x.level === 'warn'), true, 'cek satuan');

// Konversi satuan
eq(H.faktor('g', 'kg'), 0.001, 'g ke kg');
eq(H.faktor('kg', 'g'), 1000, 'kg ke g');
eq(H.faktor('ons', 'g'), 100, 'ons ke g');
eq(H.faktor('ml', 'liter'), 0.001, 'ml ke liter');
eq(H.faktor('cm', 'm'), 0.01, 'cm ke m');
eq(H.faktor('butir', 'kg'), null, 'butir tidak bisa ke kg');
eq(H.faktor('Gram', 'KG'), 0.001, 'alias & huruf besar');
eq(H.faktor('toples', 'toples'), 1, 'satuan bebas yang sama');
near(H.biayaBahan({ harga: 14000, isi: 1, satuanIsi: 'kg', pakai: 500, satuanPakai: 'g' }), 7000, 1e-9, 'beli 1 kg pakai 500 g');
near(H.biayaBahan({ harga: 30000, isi: 2, satuanIsi: 'liter', pakai: 250, satuanPakai: 'ml' }), 3750, 1e-9, 'beli 2 liter pakai 250 ml');
near(H.biayaBahan({ harga: 14000, isi: 1000, satuanIsi: 'g', pakai: 500 }), 7000, 1e-9, 'data lama tanpa satuanPakai');
eq(H.biayaBahan({ harga: 2000, isi: 1, satuanIsi: 'butir', pakai: 1, satuanPakai: 'kg' }), 0, 'satuan tak cocok = 0');
eq(H.periksa({ mode: 'unit', batchBulan: 1, bahan: [{ nama: 'Telur', harga: 2000, isi: 1, satuanIsi: 'butir', pakai: 1, satuanPakai: 'kg' }] }).some(x => x.level === 'bad' && x.pesan.includes('tidak bisa dikonversi')), true, 'cek satuan tak cocok');

// --- 1.5: pajak & potongan per kanal ---
const kp = H.hargaSemuaKanal(r.hpp, { metode: 'margin', persen: 30, bulat: 0, pajak: 0.5 }, [{ nama: 'Toko', tipe: 'langsung' }, { nama: 'MP', tipe: 'komisi', persen: 12 }]);
near(kp[0].harga, r.hpp / (1 - 0.005 - 0.30), 0.01, 'harga toko dengan PPh 0,5%');
near(kp[0].margin, 0.30, 1e-9, 'margin bersih toko tetap 30% setelah PPh');
near(kp[1].margin, 0.30, 1e-9, 'margin bersih marketplace tetap 30% setelah PPh + komisi');
const kq = H.hargaSemuaKanal(r.hpp, { metode: 'margin', persen: 30, bulat: 0 }, [{ nama: 'Toko', tipe: 'langsung', persen: 0.3, biaya: 500 }]);
near(kq[0].margin, 0.30, 1e-9, 'potongan QRIS & ongkir di toko tetap menjaga margin');
const km = H.hargaSemuaKanal(r.hpp, { metode: 'markup', persen: 30, bulat: 0 }, [{ nama: 'Toko', tipe: 'langsung' }]);
near(km[0].harga, r.hpp * 1.3, 0.01, 'markup tetap sama tanpa potongan');

// --- biaya bulanan bersama ---
const prs = [{ id: 'a', bersama: true, jamBulan: 60 }, { id: 'b', bersama: true, jamBulan: 30 }, { id: 'c', bersama: false }];
near(H.bagianBersama(prs, 'a', 'rata'), 0.5, 1e-9, 'bagi rata 2 produk');
near(H.bagianBersama(prs, 'a', 'waktu'), 2 / 3, 1e-9, 'bagi sesuai waktu');
eq(H.bagianBersama(prs, 'c', 'rata'), 0, 'produk tidak ikut = 0');
near(H.bagianBersama([{ id: 'a', bersama: true, porsi: 40 }], 'a', 'manual'), 0.4, 1e-9, 'porsi manual');
const so = H.skalaOverhead({ gas: 120000, listrik: 150000, sewa: 0, hargaAlat: 3000000, umurAlat: 36, lain: [{ nilai: 50000 }] }, 0.5);
const rb = H.hitungHPP({ ...bolu, overhead: so });
near(rb.overheadBulan, 403333.33 / 2, 0.01, 'overhead setengah');
near(rb.hpp, 6744.44 - 840.28 / 2, 0.01, 'HPP turun karena biaya bersama dibagi');

// --- target, proyeksi, BEP dengan potongan ---
eq(H.bep(r.fc, 10000, r.vc, 0.5).unitBulat, Math.ceil(r.fc / (10000 * 0.995 - r.vc) - 1e-9), 'BEP dengan PPh');
eq(H.unitUntukTarget(r.fc, r.vc, 10000, 1000000), Math.ceil((r.fc + 1000000) / (10000 - r.vc) - 1e-9), 'unit untuk target untung');
eq(H.unitUntukTarget(r.fc, r.vc, 5000, 1000000), null, 'target mustahil jika harga < biaya variabel');
const pr = H.proyeksi(r.fc, r.vc, 10000, 400);
near(pr.omzet, 4000000, 1e-6, 'omzet proyeksi');
near(pr.untung, 400 * (10000 - r.vc) - r.fc, 1e-6, 'untung proyeksi');

// --- harga psikologis & paket ---
const ps = H.hargaPsikologis(9635, r.hpp, 0, 0);
eq(ps.length > 0 && ps.every(x => x.harga > r.hpp), true, 'pilihan harga di atas modal');
eq(ps.some(x => x.harga === 9900 || x.harga === 10000), true, 'ada 9.900 atau 10.000');
const pk = H.hargaPaket(10000, r.hpp, 3, 10, 0, 0, 500);
eq(pk.harga, 27000, 'paket isi 3 diskon 10%');
near(pk.untung, 27000 - r.hpp * 3, 0.01, 'untung paket');


// ===== Laporan keuangan =====
const buku = {
  awal: { bulan: '2026-09', kas: 2000000, persediaan: 500000, peralatan: [{ nama: 'Oven', nilai: 4800000, umur: 4 }], utang: [{ nama: 'KUR', sisa: 3000000 }] },
  stok: { '2026-09': 700000 },
  trx: [
    { tgl: '2026-09-03', jenis: 'masuk', kat: 'jual', nominal: 6000000 },
    { tgl: '2026-09-04', jenis: 'keluar', kat: 'bahan', nominal: 2500000 },
    { tgl: '2026-09-10', jenis: 'keluar', kat: 'upah', nominal: 1000000 },
    { tgl: '2026-09-11', jenis: 'keluar', kat: 'energi', nominal: 300000 },
    { tgl: '2026-09-25', jenis: 'keluar', kat: 'cicil', nominal: 500000 },
    { tgl: '2026-09-25', jenis: 'keluar', kat: 'bunga', nominal: 50000 },
    { tgl: '2026-09-28', jenis: 'keluar', kat: 'prive', nominal: 400000 },
    { tgl: '2026-10-05', jenis: 'masuk', kat: 'jual', nominal: 5000000 },
    { tgl: '2026-10-06', jenis: 'keluar', kat: 'bahan', nominal: 2000000 },
    { tgl: '2026-10-07', jenis: 'keluar', kat: 'alat', nominal: 1200000, umur: 1, ket: 'Mixer' },
    { tgl: '2026-10-08', jenis: 'masuk', kat: 'pinjam', nominal: 1000000 },
    { tgl: '2026-08-30', jenis: 'masuk', kat: 'jual', nominal: 999 },
  ],
};
eq(H.geserBulan('2026-12', 1), '2027-01', 'geser bulan lintas tahun');
eq(H.daftarBulan('2026-11', '2027-02').length, 4, 'daftar bulan');
const sep = H.laporanBulan(buku, '2026-09');
eq(sep.labaRugi.hpp, 2300000, 'HPP = persediaan awal + pembelian - persediaan akhir');
eq(sep.labaRugi.penyusutan, 100000, 'penyusutan garis lurus');
eq(sep.labaRugi.labaKotor, 3700000, 'laba kotor');
eq(sep.labaRugi.laba, 2250000, 'laba bersih September');
eq(sep.arusKas.operasi, 2150000, 'arus kas operasi');
eq(sep.arusKas.pendanaan, -900000, 'arus kas pendanaan (cicilan + prive)');
eq(sep.arusKas.kasAkhir, 3250000, 'kas akhir September');
eq(sep.neraca.totalAset, 8650000, 'total aset September');
eq(sep.neraca.utang, 2500000, 'utang berkurang cicilan');
eq(sep.neraca.ekuitas, 6150000, 'ekuitas');
eq(sep.neraca.seimbang, true, 'neraca seimbang September');
eq(sep.k.jual, 6000000, 'transaksi sebelum awal pencatatan diabaikan');
const okt = H.laporanBulan(buku, '2026-10');
eq(okt.labaRugi.persAwal, 700000, 'persediaan awal = stok akhir bulan lalu');
eq(okt.labaRugi.hpp, 2000000, 'tanpa stok akhir: persediaan dianggap tetap');
eq(okt.labaRugi.penyusutan, 200000, 'penyusutan alat baru ikut');
eq(okt.labaRugi.laba, 2800000, 'laba Oktober');
eq(okt.arusKas.investasi, -1200000, 'arus kas investasi');
eq(okt.arusKas.kasAkhir, 6050000, 'kas akhir Oktober');
eq(okt.neraca.peralatan, 5700000, 'nilai buku peralatan');
eq(okt.neraca.utang, 3500000, 'pinjaman baru menambah utang');
eq(okt.neraca.seimbang, true, 'neraca seimbang Oktober');
eq(okt.neraca.totalAset, 12450000, 'total aset Oktober');
const ring = H.ringkasanBulan(buku, '2026-10', 6);
eq(ring.n, 2, 'ringkasan tidak melewati awal pencatatan');
eq(ring.pendapatan, 11000000, 'pendapatan 2 bulan');
eq(ring.laba, 5050000, 'laba 2 bulan');
near(ring.kemampuanBayar, 5400000 / 550000, 1e-9, 'kemampuan bayar angsuran');
eq(H.laporanBulan(buku, '2026-08'), null, 'bulan sebelum awal: tidak ada laporan');
// penyusutan berhenti saat nilai buku habis
const hab = H.laporanBulan({ awal: { bulan: '2026-01', peralatan: [{ nilai: 1200, umur: 0.25 }] } }, '2026-06');
eq(hab.neraca.peralatan, 0, 'nilai buku tidak negatif');
eq(hab.labaRugi.penyusutan, 0, 'tidak ada penyusutan setelah habis');

console.log(`Semua ${lulus} uji lulus.`);
