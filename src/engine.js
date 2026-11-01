// Mesin hitung HPP & harga jual — fungsi murni, tanpa DOM.
(function (root) {
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

  function biayaBahanBatch(bahan) {
    return (bahan || []).reduce((s, b) => {
      const isi = num(b.isi);
      return s + (isi > 0 ? num(b.harga) / isi * num(b.pakai) : 0);
    }, 0);
  }

  function overheadBulanan(oh) {
    oh = oh || {};
    const umur = num(oh.umurAlat);
    const susut = umur > 0 ? num(oh.hargaAlat) / umur : 0;
    const lain = (oh.lain || []).reduce((s, x) => s + num(x.nilai), 0);
    return { susut, total: num(oh.gas) + num(oh.listrik) + num(oh.sewa) + susut + lain };
  }

  function hitungHPP(p) {
    const n = num(p.hasilBatch);
    const bahanBatch = biayaBahanBatch(p.bahan);
    const tkBatch = num(p.upahJam) * num(p.jamBatch);
    const oh = overheadBulanan(p.overhead);
    const produksiBulan = n * num(p.batchBulan);
    const perUnit = {
      bahan: n > 0 ? bahanBatch / n : 0,
      tenagaKerja: n > 0 ? tkBatch / n : 0,
      kemasan: num(p.kemasan),
      overhead: produksiBulan > 0 ? oh.total / produksiBulan : 0,
    };
    const hpp = perUnit.bahan + perUnit.tenagaKerja + perUnit.kemasan + perUnit.overhead;
    const vc = perUnit.bahan + perUnit.tenagaKerja + perUnit.kemasan;
    return { bahanBatch, tkBatch, overheadBulan: oh.total, susut: oh.susut, produksiBulan, perUnit, hpp, vc, fc: oh.total };
  }

  const bulatkan = (x, step) => { const v = step > 0 ? Math.ceil(x / step - 1e-9) * step : x; return v === 0 ? 0 : v; };

  // metode: 'margin' (g = % dari harga jual) | 'markup' (m = % dari HPP)
  function hargaDasar(hpp, metode, persen) {
    const r = num(persen) / 100;
    if (metode === 'markup') return hpp * (1 + r);
    return r < 1 ? hpp / (1 - r) : Infinity;
  }

  // Harga tayang untuk kanal berkomisi agar margin bersih tetap g.
  function hargaKanal(hpp, komisiPct, biayaTetap, marginPct) {
    const k = num(komisiPct) / 100, g = num(marginPct) / 100;
    const d = 1 - k - g;
    return d > 0 ? (hpp + num(biayaTetap)) / d : Infinity;
  }

  function marginAktual(harga, hpp, komisiPct, biayaTetap) {
    const P = num(harga);
    if (P <= 0) return null;
    const bersih = P * (1 - num(komisiPct) / 100) - num(biayaTetap);
    return (bersih - hpp) / P;
  }

  const markupDariMargin = (g) => (g < 1 ? g / (1 - g) : Infinity);
  const marginDariMarkup = (m) => m / (1 + m);

  function bep(fc, harga, vc) {
    const kontribusi = num(harga) - num(vc);
    if (kontribusi <= 0) return null;
    const unit = num(fc) / kontribusi;
    return { unit, unitBulat: Math.ceil(unit - 1e-9), rupiah: Math.ceil(unit - 1e-9) * num(harga), kontribusi };
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

  const api = { biayaBahanBatch, overheadBulanan, hitungHPP, bulatkan, hargaDasar, hargaKanal, marginAktual, markupDariMargin, marginDariMarkup, bep, simulasiBahan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HPP = api;
})(this);
