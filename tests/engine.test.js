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
eq(cek.some((x) => x.pesan.includes('hasil per batch')), true, 'cek hasil batch');
eq(cek.some((x) => x.pesan.includes('Terigu') && x.level === 'bad'), true, 'cek isi kemasan');
eq(cek.some((x) => x.pesan.includes('Gula') && x.level === 'warn'), true, 'cek satuan');

console.log(`Semua ${lulus} uji lulus.`);
