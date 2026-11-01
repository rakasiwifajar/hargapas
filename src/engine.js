// HargaPas — mesin hitung HPP & harga jual (fungsi murni, tanpa DOM).
// Dikembangkan oleh Universitas Terbuka Majene.
(function (root) {
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // Satuan dan konversinya ke satuan dasar per dimensi.
  const SATUAN = {
    g: ['berat', 1], ons: ['berat', 100], kg: ['berat', 1000],
    ml: ['volume', 1], liter: ['volume', 1000],
    cm: ['panjang', 1], m: ['panjang', 100],
    butir: ['hitung', 1], buah: ['hitung', 1], biji: ['hitung', 1], pcs: ['hitung', 1], lembar: ['hitung', 1],
    bungkus: ['hitung', 1], sachet: ['hitung', 1], ikat: ['hitung', 1], botol: ['hitung', 1], kaleng: ['hitung', 1],
  };
  const ALIAS = { gram: 'g', gr: 'g', grm: 'g', kilo: 'kg', kilogram: 'kg', l: 'liter', lt: 'liter', ltr: 'liter', mililiter: 'ml', meter: 'm', centimeter: 'cm', senti: 'cm', pc: 'pcs', potong: 'pcs', bks: 'bungkus', pack: 'bungkus', pak: 'bungkus' };
  function normSatuan(s) {
    const k = String(s || '').trim().toLowerCase();
    return SATUAN[k] ? k : (ALIAS[k] || k);
  }
  // Faktor pengali dari satuan "dari" ke satuan "ke"; null jika tidak bisa dikonversi.
  function faktor(dari, ke) {
    const a = normSatuan(dari), b = normSatuan(ke || dari);
    if (a === b) return 1;
    const sa = SATUAN[a], sb = SATUAN[b];
    if (!sa || !sb || sa[0] !== sb[0] || sa[0] === 'hitung') return null;
    return sa[1] / sb[1];
  }
  // Biaya satu bahan: harga untuk "isi" (satuanIsi), dipakai "pakai" (satuanPakai, default = satuanIsi).
  function biayaBahan(b) {
    const isi = num(b.isi);
    if (!(isi > 0)) return 0;
    const f = faktor(b.satuanPakai || b.satuanIsi, b.satuanIsi);
    if (f === null) return 0;
    return num(b.harga) / isi * num(b.pakai) * f;
  }
  function biayaBahanBatch(bahan) {
    return (bahan || []).reduce((s, b) => s + biayaBahan(b), 0);
  }

  // Overhead bulanan dipisah: variabel (ikut naik-turun dengan produksi) dan tetap.
  function overheadBulanan(oh) {
    oh = oh || {};
    const umur = num(oh.umurAlat);
    const penyusutan = umur > 0 ? num(oh.hargaAlat) / umur : 0;
    const lain = (oh.lain || []).reduce((s, x) => s + num(x.nilai), 0);
    const variabel = num(oh.gas) + num(oh.listrik);
    const tetap = num(oh.sewa) + penyusutan + lain;
    return { penyusutan, variabel, tetap, total: variabel + tetap };
  }

  // p: { hasilBatch, batchBulan, susutPct, upahJam, jamBatch, kemasan, bahan[], overhead{} }
  function hitungHPP(p) {
    const s = clamp(num(p.susutPct) / 100, 0, 0.95);
    const n = num(p.hasilBatch);
    const nLayak = n * (1 - s);
    const bahanBatch = biayaBahanBatch(p.bahan);
    const tkBatch = num(p.upahJam) * num(p.jamBatch);
    const oh = overheadBulanan(p.overhead);
    const produksiBulan = nLayak * num(p.batchBulan);
    const perUnit = {
      bahan: nLayak > 0 ? bahanBatch / nLayak : 0,
      tenagaKerja: nLayak > 0 ? tkBatch / nLayak : 0,
      kemasan: num(p.kemasan),
      overhead: produksiBulan > 0 ? oh.total / produksiBulan : 0,
    };
    const ohVarUnit = produksiBulan > 0 ? oh.variabel / produksiBulan : 0;
    const hpp = perUnit.bahan + perUnit.tenagaKerja + perUnit.kemasan + perUnit.overhead;
    const vc = perUnit.bahan + perUnit.tenagaKerja + perUnit.kemasan + ohVarUnit;
    return {
      bahanBatch, tkBatch, nLayak, susut: s, produksiBulan,
      overheadBulan: oh.total, overheadTetap: oh.tetap, overheadVariabel: oh.variabel, penyusutan: oh.penyusutan,
      perUnit, hpp, vc, fc: oh.tetap,
    };
  }

  const bulatkan = (x, step) => {
    if (!Number.isFinite(x)) return x;
    const v = step > 0 ? Math.ceil(x / step - 1e-9) * step : x;
    return v === 0 ? 0 : v;
  };

  // metode: 'margin' (persen dari harga jual) | 'markup' (persen dari HPP)
  function hargaDasar(hpp, metode, persen) {
    const r = num(persen) / 100;
    if (metode === 'markup') return hpp * (1 + r);
    return r < 1 ? hpp / (1 - r) : Infinity;
  }

  // Harga tayang kanal berkomisi agar margin bersih tetap g (persen dari harga tayang).
  function hargaKanal(hpp, komisiPct, biayaTetap, marginPct) {
    const k = num(komisiPct) / 100, g = num(marginPct) / 100;
    const d = 1 - k - g;
    return d > 0 ? (hpp + num(biayaTetap)) / d : Infinity;
  }

  function marginAktual(harga, hpp, komisiPct, biayaTetap) {
    const P = num(harga);
    if (P <= 0 || !Number.isFinite(P)) return null;
    const bersih = P * (1 - num(komisiPct) / 100) - num(biayaTetap);
    return (bersih - hpp) / P;
  }

  const markupDariMargin = (g) => (g < 1 ? g / (1 - g) : Infinity);
  const marginDariMarkup = (m) => m / (1 + m);

  // Harga per kanal. kanal: [{ nama, tipe: 'langsung'|'diskon'|'komisi', persen, biaya }]
  // 'langsung' = harga toko; 'diskon' = harga toko dikurangi persen; 'komisi' = harga tayang menutup komisi.
  function hargaSemuaKanal(hpp, opsi, kanal) {
    const metode = opsi.metode, persen = num(opsi.persen), step = num(opsi.bulat);
    const gTarget = metode === 'margin' ? persen : marginDariMarkup(persen / 100) * 100;
    const toko = bulatkan(hargaDasar(hpp, metode, persen), step);
    return (kanal || []).map((c) => {
      let harga, k = 0, f = num(c.biaya);
      if (c.tipe === 'diskon') harga = toko * (1 - num(c.persen) / 100);
      else if (c.tipe === 'komisi') { k = num(c.persen); harga = bulatkan(hargaKanal(hpp, k, f, gTarget), step); }
      else { harga = toko; f = 0; }
      const ok = Number.isFinite(harga) && harga > 0;
      const diterima = ok ? harga * (1 - k / 100) - f : null;
      return { ...c, harga: ok ? harga : null, diterima, laba: ok ? diterima - hpp : null, margin: ok ? marginAktual(harga, hpp, k, f) : null };
    });
  }

  function bep(fc, harga, vc) {
    const kontribusi = num(harga) - num(vc);
    if (!(kontribusi > 0)) return null;
    const unit = num(fc) / kontribusi;
    const unitBulat = Math.ceil(unit - 1e-9);
    return { unit, unitBulat, rupiah: unitBulat * num(harga), kontribusi };
  }

  function simulasiBahan(p, naikPct, hargaJual) {
    const dasar = hitungHPP(p);
    const f = 1 + num(naikPct) / 100;
    const hppBaru = dasar.perUnit.bahan * f + dasar.perUnit.tenagaKerja + dasar.perUnit.kemasan + dasar.perUnit.overhead;
    const mLama = marginAktual(hargaJual, dasar.hpp, 0, 0);
    const mBaru = marginAktual(hargaJual, hppBaru, 0, 0);
    const hargaPertahankan = mLama !== null && mLama < 1 ? hppBaru / (1 - mLama) : null;
    return { hppLama: dasar.hpp, hppBaru, marginLama: mLama, marginBaru: mBaru, hargaPertahankan };
  }

  // Pemeriksaan input yang ramah: mengembalikan daftar { level: 'warn'|'bad', pesan }.
  function periksa(p) {
    const out = [];
    const unit = p.mode === 'unit';
    if (!unit && !(num(p.hasilBatch) > 0)) out.push({ level: 'bad', pesan: 'Isi "hasil per batch" agar biaya bisa dibagi per unit.' });
    (p.bahan || []).forEach((b, i) => {
      const nama = b.nama || `Bahan ${i + 1}`;
      const adaAngka = num(b.harga) > 0 || num(b.pakai) > 0;
      if (adaAngka && !(num(b.isi) > 0)) out.push({ level: 'bad', pesan: `${nama}: "isi kemasan" belum diisi.` });
      const f = faktor(b.satuanPakai || b.satuanIsi, b.satuanIsi);
      if (adaAngka && f === null) out.push({ level: 'bad', pesan: `${nama}: satuan beli (${b.satuanIsi}) dan satuan pakai (${b.satuanPakai}) tidak bisa dikonversi.` });
      else if (num(b.isi) > 0 && num(b.pakai) * (f || 1) > num(b.isi) * 20) out.push({ level: 'warn', pesan: `${nama}: jumlah dipakai lebih dari 20× jumlah yang dibeli. Periksa satuannya.` });
    });
    if (!(num(p.batchBulan) > 0)) out.push({ level: 'warn', pesan: 'Isi jumlah produksi per bulan agar biaya bulanan ikut terhitung.' });
    if (num(p.susutPct) >= 50) out.push({ level: 'warn', pesan: 'Persentase gagal/susut 50% atau lebih. Pastikan angkanya benar.' });
    return out;
  }

  const api = { SATUAN, normSatuan, faktor, biayaBahan, biayaBahanBatch, overheadBulanan, hitungHPP, bulatkan, hargaDasar, hargaKanal, hargaSemuaKanal, marginAktual, markupDariMargin, marginDariMarkup, bep, simulasiBahan, periksa };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HPP = api;
})(this);
