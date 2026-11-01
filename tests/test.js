const H = require('../src/engine.js');
const assert = require('assert');
const near = (a, b, tol = 0.5, msg) => assert(Math.abs(a - b) <= tol, `${msg}: ${a} != ${b}`);

const bolu = {
  hasilBatch: 24, batchBulan: 20, upahJam: 15000, jamBatch: 3, kemasan: 1000,
  bahan: [
    { nama: 'Tepung', harga: 14000, isi: 1000, pakai: 500 },
    { nama: 'Gula', harga: 18000, isi: 1000, pakai: 400 },
    { nama: 'Telur', harga: 2000, isi: 1, pakai: 8 },
    { nama: 'Mentega', harga: 45000, isi: 500, pakai: 250 },
    { nama: 'Pisang', harga: 20000, isi: 10, pakai: 10 },
  ],
  overhead: { gas: 120000, listrik: 150000, sewa: 0, hargaAlat: 3000000, umurAlat: 36, lain: [{ nama: 'Lain', nilai: 50000 }] },
};

const r = H.hitungHPP(bolu);
near(r.bahanBatch, 72700, 0.01, 'bahan batch');
near(r.perUnit.bahan, 3029.17, 0.01, 'bahan/unit');
near(r.perUnit.tenagaKerja, 1875, 0.01, 'tk/unit');
near(r.overheadBulan, 403333.33, 0.01, 'oh bulan');
near(r.perUnit.overhead, 840.28, 0.01, 'oh/unit');
near(r.hpp, 6744.44, 0.01, 'hpp');
near(H.hargaDasar(r.hpp, 'markup', 30), 8767.78, 0.01, 'markup');
near(H.hargaDasar(r.hpp, 'margin', 30), 9634.92, 0.01, 'margin');
near(H.hargaKanal(r.hpp, 12, 0, 30), 11628.35, 0.01, 'kanal');
near(H.marginAktual(10000, r.hpp, 0, 0), 0.32556, 0.0001, 'margin aktual');
near(H.marginAktual(H.hargaKanal(r.hpp, 12, 500, 30), r.hpp, 12, 500), 0.30, 1e-9, 'kanal round-trip');
const b = H.bep(r.fc, 10000, r.vc);
assert.strictEqual(b.unitBulat, 99, 'bep');
assert.strictEqual(H.bep(r.fc, 5000, r.vc), null, 'bep harga < vc');
const s = H.simulasiBahan(bolu, 10, 10000);
near(s.hppBaru, 7047.36, 0.01, 'sim hpp');
near(s.marginBaru, 0.29526, 0.0001, 'sim margin');
near(s.hargaPertahankan, 10449.14, 0.01, 'sim harga');
assert.strictEqual(H.bulatkan(9634.92, 500), 10000);
assert.strictEqual(H.bulatkan(10000, 500), 10000);
assert.strictEqual(H.bulatkan(11628.35, 500), 12000);
// kasus tepi
assert.strictEqual(H.hitungHPP({ hasilBatch: 0, bahan: [] }).hpp, 0);
assert.strictEqual(H.hargaKanal(1000, 60, 0, 50), Infinity);
console.log('Semua uji lulus. HPP =', r.hpp.toFixed(2));
