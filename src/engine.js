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
  // 'langsung' = harga toko (boleh punya potongan persen, mis. QRIS, dan biaya per unit, mis. ongkir);
  // 'diskon' = harga toko dikurangi persen; 'komisi' = harga tayang menutup komisi.
  // opsi.pajak = persen dari omzet (mis. PPh final 0,5%) yang dipotong di semua kanal.
  function hargaSemuaKanal(hpp, opsi, kanal) {
    const metode = opsi.metode, persen = num(opsi.persen), step = num(opsi.bulat), pajak = num(opsi.pajak);
    const gTarget = metode === 'margin' ? persen : marginDariMarkup(persen / 100) * 100;
    const tokoK = (kanal || []).find((c) => c.tipe === 'langsung');
    const kToko = pajak + (tokoK ? num(tokoK.persen) : 0), fToko = tokoK ? num(tokoK.biaya) : 0;
    const toko = bulatkan(hargaKanal(hpp, kToko, fToko, gTarget), step);
    return (kanal || []).map((c) => {
      let harga, k = pajak, f = 0;
      if (c.tipe === 'diskon') harga = toko * (1 - num(c.persen) / 100);
      else if (c.tipe === 'komisi') { k = pajak + num(c.persen); f = num(c.biaya); harga = bulatkan(hargaKanal(hpp, k, f, gTarget), step); }
      else { harga = toko; k = kToko; f = fToko; }
      const ok = Number.isFinite(harga) && harga > 0;
      const diterima = ok ? harga * (1 - k / 100) - f : null;
      return { ...c, harga: ok ? harga : null, diterima, laba: ok ? diterima - hpp : null, margin: ok ? marginAktual(harga, hpp, k, f) : null, potongan: k, biayaUnit: f };
    });
  }

  // Bagian biaya bulanan bersama untuk satu produk.
  // produk: [{ id, bersama: bool, jamBulan, porsi }], cara: 'rata' | 'waktu' | 'manual'
  function bagianBersama(produk, id, cara) {
    const ikut = (produk || []).filter((p) => p.bersama);
    const p = ikut.find((x) => x.id === id);
    if (!p || !ikut.length) return 0;
    if (cara === 'manual') return clamp(num(p.porsi) / 100, 0, 1);
    if (cara === 'waktu') {
      const tot = ikut.reduce((s, x) => s + num(x.jamBulan), 0);
      if (tot > 0) return num(p.jamBulan) / tot;
    }
    return 1 / ikut.length;
  }
  function skalaOverhead(oh, f) {
    oh = oh || {};
    const out = {};
    ['gas', 'listrik', 'sewa', 'hargaAlat'].forEach((k) => { out[k] = num(oh[k]) * f; });
    out.umurAlat = oh.umurAlat;
    out.lain = (oh.lain || []).map((x) => ({ nilai: num(x.nilai) * f }));
    return out;
  }

  // Kontribusi per unit setelah potongan (pajak, komisi) dan biaya per unit.
  const kontribusiUnit = (harga, vc, potonganPct, biayaUnit) => num(harga) * (1 - num(potonganPct) / 100) - num(biayaUnit) - num(vc);

  // Jumlah unit per bulan agar untung bersih = target.
  function unitUntukTarget(fc, vc, harga, target, potonganPct, biayaUnit) {
    const k = kontribusiUnit(harga, vc, potonganPct, biayaUnit);
    if (!(k > 0)) return null;
    return Math.max(0, Math.ceil((num(fc) + num(target)) / k - 1e-9));
  }

  // Proyeksi sebulan dari rencana jumlah terjual.
  function proyeksi(fc, vc, harga, unit, potonganPct, biayaUnit) {
    const u = num(unit), P = num(harga);
    const omzet = u * P;
    const potongan = omzet * num(potonganPct) / 100 + u * num(biayaUnit);
    const biayaVariabel = u * num(vc);
    const untung = omzet - potongan - biayaVariabel - num(fc);
    return { omzet, potongan, biayaVariabel, biayaTetap: num(fc), untung };
  }

  // Pilihan harga "enak dibaca" di sekitar harga dasar, tidak di bawah batas margin minimum.
  function hargaPsikologis(hargaMin, hpp, potonganPct, biayaUnit) {
    const P = num(hargaMin);
    if (!(P > 0)) return [];
    const step = P >= 50000 ? 5000 : P >= 10000 ? 1000 : P >= 2000 ? 500 : 100;
    const naik = Math.ceil(P / step - 1e-9) * step;
    const cand = new Set([naik - (step >= 1000 ? 100 : step >= 500 ? 50 : 10), naik, naik + step, naik + step - (step >= 1000 ? 100 : 50)]);
    return [...cand].filter((x) => x > hpp && x >= P * 0.97).sort((a, b) => a - b).slice(0, 3)
      .map((x) => ({ harga: x, margin: marginAktual(x, hpp, potonganPct, biayaUnit) }));
  }

  // Harga paket isi n dengan diskon persen dari total harga satuan.
  function hargaPaket(hargaSatuan, hpp, n, diskonPct, potonganPct, biayaUnit, step) {
    const isi = Math.max(1, Math.round(num(n)));
    const harga = bulatkan(num(hargaSatuan) * isi * (1 - num(diskonPct) / 100), num(step));
    const modal = num(hpp) * isi;
    const diterima = harga * (1 - num(potonganPct) / 100) - num(biayaUnit);
    return { isi, harga, untung: diterima - modal, margin: harga > 0 ? (diterima - modal) / harga : null, hematPerUnit: num(hargaSatuan) - harga / isi };
  }

  function bep(fc, harga, vc, potonganPct, biayaUnit) {
    const kontribusi = kontribusiUnit(harga, vc, potonganPct, biayaUnit);
    if (!(kontribusi > 0)) return null;
    const unit = num(fc) / kontribusi;
    const unitBulat = Math.max(0, Math.ceil(unit - 1e-9));
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
    if (!unit && !(num(p.hasilBatch) > 0)) out.push({ level: 'bad', pesan: 'Isi "sekali produksi jadi berapa" agar biaya bisa dibagi per barang.' });
    (p.bahan || []).forEach((b, i) => {
      const nama = b.nama || `Bahan ${i + 1}`;
      const adaAngka = num(b.harga) > 0 || num(b.pakai) > 0;
      if (adaAngka && !(num(b.isi) > 0)) out.push({ level: 'bad', pesan: `${nama}: "beli berapa" belum diisi.` });
      const f = faktor(b.satuanPakai || b.satuanIsi, b.satuanIsi);
      if (adaAngka && f === null) out.push({ level: 'bad', pesan: `${nama}: satuan beli (${b.satuanIsi}) dan satuan pakai (${b.satuanPakai}) tidak bisa dikonversi.` });
      else if (num(b.isi) > 0 && num(b.pakai) * (f || 1) > num(b.isi) * 20) out.push({ level: 'warn', pesan: `${nama}: jumlah dipakai lebih dari 20× jumlah yang dibeli. Periksa satuannya.` });
    });
    if (!(num(p.batchBulan) > 0)) out.push({ level: 'warn', pesan: 'Isi berapa kali produksi dalam sebulan agar biaya bulanan ikut terhitung.' });
    if (num(p.susutPct) >= 50) out.push({ level: 'warn', pesan: 'Barang rusak/tidak laku 50% atau lebih. Pastikan angkanya benar.' });
    return out;
  }


  // ================= Keuangan (SAK EMKM, disederhanakan) =================
  // buku = { awal:{bulan:'YYYY-MM', kas, persediaan, peralatan:[{nama,nilai,umur(tahun)}], utang:[{nama,sisa}]},
  //          trx:[{tgl:'YYYY-MM-DD', jenis:'masuk'|'keluar', kat, nominal, umur?}], stok:{'YYYY-MM': nilai} }
  const KATEGORI = {
    masuk: [
      { id: 'jual', nama: 'Penjualan', resmi: 'pendapatan usaha', grup: 'operasi' },
      { id: 'lain', nama: 'Pemasukan lain', resmi: 'pendapatan lain-lain', grup: 'operasi' },
      { id: 'modal', nama: 'Tambah modal sendiri', resmi: 'setoran modal', grup: 'pendanaan' },
      { id: 'pinjam', nama: 'Terima pinjaman', resmi: 'penerimaan pinjaman', grup: 'pendanaan' },
    ],
    keluar: [
      { id: 'bahan', nama: 'Belanja bahan & kemasan', resmi: 'pembelian persediaan', grup: 'operasi' },
      { id: 'upah', nama: 'Upah & gaji', resmi: 'beban gaji', grup: 'operasi' },
      { id: 'sewa', nama: 'Sewa tempat', resmi: 'beban sewa', grup: 'operasi' },
      { id: 'energi', nama: 'Listrik, gas & air', resmi: 'beban utilitas', grup: 'operasi' },
      { id: 'kirim', nama: 'Transport & ongkir', resmi: 'beban angkut', grup: 'operasi' },
      { id: 'promo', nama: 'Promosi & iklan', resmi: 'beban pemasaran', grup: 'operasi' },
      { id: 'lainop', nama: 'Biaya lain usaha', resmi: 'beban lain-lain', grup: 'operasi' },
      { id: 'bunga', nama: 'Bunga & biaya pinjaman', resmi: 'beban keuangan', grup: 'operasi' },
      { id: 'pajak', nama: 'Pajak usaha', resmi: 'beban pajak', grup: 'operasi' },
      { id: 'alat', nama: 'Beli peralatan', resmi: 'pembelian aset tetap', grup: 'investasi' },
      { id: 'cicil', nama: 'Bayar cicilan pokok', resmi: 'pembayaran pinjaman', grup: 'pendanaan' },
      { id: 'prive', nama: 'Ambil untuk pribadi', resmi: 'prive', grup: 'pendanaan' },
    ],
  };
  const BEBAN = ['upah', 'sewa', 'energi', 'kirim', 'promo', 'lainop'];
  // jenis yang boleh "belum dibayar" (piutang usaha / utang usaha)
  const BOLEH_TEMPO = ['jual', 'lain', 'bahan', 'upah', 'sewa', 'energi', 'kirim', 'promo', 'lainop'];
  const isTempo = (x) => !!x.tempo && BOLEH_TEMPO.includes(x.kat);
  // bulan uangnya benar-benar berpindah (null = belum dibayar)
  const bulanKas = (x) => isTempo(x) ? (x.lunasTgl ? bulanDari(x.lunasTgl < x.tgl ? x.tgl : x.lunasTgl) : null) : bulanDari(x.tgl);
  const bulanDari = (tgl) => String(tgl || '').slice(0, 7);
  function geserBulan(b, n) {
    const [y, m] = b.split('-').map(Number); const t = y * 12 + (m - 1) + n;
    return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}`;
  }
  function daftarBulan(dari, sampai) {
    const out = []; if (!dari || !sampai || sampai < dari) return out;
    for (let b = dari; b <= sampai && out.length < 600; b = geserBulan(b, 1)) out.push(b);
    return out;
  }
  function bulanMulai(buku) {
    if (buku.awal && buku.awal.bulan) return buku.awal.bulan;
    const t = (buku.trx || []).map(x => bulanDari(x.tgl)).filter(Boolean).sort();
    return t[0] || null;
  }
  const r2 = (x) => Math.round(x * 100) / 100;

  // Hitung semua bulan dari awal pencatatan sampai `sampai` (inklusif).
  function hitungBuku(buku, sampai) {
    const awal = buku.awal || {}, mulai = bulanMulai(buku);
    const bulan = daftarBulan(mulai, sampai); if (!bulan.length) return [];
    const aset = (awal.peralatan || []).filter(a => num(a.nilai) > 0).map(a => ({ nama: a.nama || 'Peralatan', biaya: num(a.nilai), umur: num(a.umur) || 4, sisa: num(a.nilai), mulai, dariAwal: true }));
    const trx = (buku.trx || []).filter(t => bulanDari(t.tgl) >= mulai && num(t.nominal) > 0);
    let kas = num(awal.kas), persediaan = num(awal.persediaan);
    let utang = (awal.utang || []).reduce((s, u) => s + num(u.sisa), 0);
    // piutang & bon yang sudah ada saat mulai mencatat (tidak masuk laba rugi, hanya kas saat dilunasi)
    const pAwal = (awal.piutang || []).filter(x => num(x.nilai) > 0), uAwal = (awal.utangUsaha || []).filter(x => num(x.nilai) > 0);
    const lunasBln = (x) => x.lunasTgl ? (bulanDari(x.lunasTgl) < mulai ? mulai : bulanDari(x.lunasTgl)) : null;
    const sumN = (arr) => r2(arr.reduce((s, x) => s + num(x.nilai), 0));
    const modalAwal = kas + persediaan + aset.reduce((s, a) => s + a.sisa, 0) - utang + sumN(pAwal) - sumN(uAwal);
    let setoran = 0, prive = 0, labaDitahan = 0;
    const out = [];
    for (const b of bulan) {
      const t = trx.filter(x => bulanDari(x.tgl) === b), tc = trx.filter(x => bulanKas(x) === b);
      const jml = (arr, jenis, kat) => r2(arr.filter(x => x.jenis === jenis && x.kat === kat).reduce((s, x) => s + num(x.nominal), 0));
      const k = {}, kc = {};
      KATEGORI.masuk.forEach(c => { k[c.id] = jml(t, 'masuk', c.id); kc[c.id] = jml(tc, 'masuk', c.id); });
      KATEGORI.keluar.forEach(c => { k[c.id] = jml(t, 'keluar', c.id); kc[c.id] = jml(tc, 'keluar', c.id); });
      const belum = (jenis) => r2(trx.filter(x => x.jenis === jenis && isTempo(x) && bulanDari(x.tgl) <= b && (!x.lunasTgl || bulanKas(x) > b)).reduce((s, x) => s + num(x.nominal), 0));
      const tagihAwal = sumN(pAwal.filter(x => lunasBln(x) === b)), bayarAwal = sumN(uAwal.filter(x => lunasBln(x) === b));
      const sisaAwal = (arr) => sumN(arr.filter(x => !x.lunasTgl || lunasBln(x) > b));
      const piutang = r2(belum('masuk') + sisaAwal(pAwal)), utangUsaha = r2(belum('keluar') + sisaAwal(uAwal));
      t.filter(x => x.jenis === 'keluar' && x.kat === 'alat').forEach(x => aset.push({ nama: x.ket || 'Peralatan', biaya: num(x.nominal), umur: num(x.umur) || 4, sisa: num(x.nominal), mulai: b }));
      // penyusutan garis lurus, berhenti saat nilai buku habis
      let susut = 0;
      aset.forEach(a => { if (a.mulai <= b && a.sisa > 0) { const d = Math.min(a.sisa, a.biaya / (a.umur * 12)); a.sisa = r2(a.sisa - d); susut += d; } });
      susut = r2(susut);
      const persAwal = persediaan;
      const stok = buku.stok && buku.stok[b] !== undefined && buku.stok[b] !== '' && buku.stok[b] !== null ? num(buku.stok[b]) : null;
      const persAkhir = stok === null ? persAwal : stok;
      const hpp = r2(persAwal + k.bahan - persAkhir);
      const pendapatan = r2(k.jual + k.lain);
      const bebanUsaha = r2(BEBAN.reduce((s, id) => s + k[id], 0) + susut);
      const labaKotor = r2(k.jual - hpp);
      const labaUsaha = r2(labaKotor + k.lain - bebanUsaha);
      const labaSebelumPajak = r2(labaUsaha - k.bunga);
      const laba = r2(labaSebelumPajak - k.pajak);
      const opMasuk = r2(kc.jual + kc.lain + tagihAwal), opKeluar = r2(kc.bahan + bayarAwal + BEBAN.reduce((s, id) => s + kc[id], 0) + kc.bunga + kc.pajak);
      const arusOperasi = r2(opMasuk - opKeluar), arusInvestasi = r2(-kc.alat), arusPendanaan = r2(kc.modal + kc.pinjam - kc.cicil - kc.prive);
      const kasAwal = kas; kas = r2(kas + arusOperasi + arusInvestasi + arusPendanaan);
      persediaan = persAkhir; utang = r2(utang + k.pinjam - k.cicil);
      const labaLalu = labaDitahan;
      setoran = r2(setoran + k.modal); prive = r2(prive + k.prive); labaDitahan = r2(labaDitahan + laba);
      const peralatan = r2(aset.reduce((s, a) => s + a.sisa, 0));
      const peralatanBiaya = r2(aset.reduce((s, a) => s + a.biaya, 0));
      const totalAset = r2(kas + piutang + persediaan + peralatan), totalLiabilitas = r2(utang + utangUsaha);
      const ekuitas = r2(modalAwal + setoran - prive + labaDitahan);
      out.push({
        bulan: b, k, kc, jumlahTrx: t.length, stokDiisi: stok !== null,
        labaRugi: { penjualan: k.jual, pendapatanLain: k.lain, pendapatan, persAwal, pembelian: k.bahan, persAkhir, hpp, labaKotor, beban: Object.fromEntries(BEBAN.map(id => [id, k[id]])), penyusutan: susut, bebanUsaha, labaUsaha, bunga: k.bunga, labaSebelumPajak, pajak: k.pajak, laba },
        arusKas: { masukOperasi: opMasuk, bayarBahan: r2(kc.bahan + bayarAwal), tagihAwal, bayarAwal, bayarBeban: r2(BEBAN.reduce((s, id) => s + kc[id], 0)), keluarOperasi: opKeluar, operasi: arusOperasi, investasi: arusInvestasi, pendanaan: arusPendanaan, kasAwal, kasAkhir: kas, naik: r2(kas - kasAwal) },
        neraca: { kas, piutang, persediaan, peralatanBiaya, akumulasi: r2(peralatanBiaya - peralatan), peralatan, totalAset, utang, utangUsaha, totalLiabilitas, modalAwal: r2(modalAwal), setoran, prive, labaLalu, labaBulan: laba, ekuitas, totalPasiva: r2(totalLiabilitas + ekuitas), seimbang: Math.abs(totalAset - (totalLiabilitas + ekuitas)) < 0.05 },
        aset: aset.map(a => ({ ...a })),
      });
    }
    return out;
  }
  function laporanBulan(buku, bulan) { const all = hitungBuku(buku, bulan); return all.length ? all[all.length - 1] : null; }
  // Ringkasan n bulan terakhir sampai `bulan` (tidak sebelum awal pencatatan).
  function ringkasanBulan(buku, bulan, n) {
    const all = hitungBuku(buku, bulan).slice(-Math.max(1, n || 3));
    const sum = (f) => r2(all.reduce((s, x) => s + f(x), 0));
    const pendapatan = sum(x => x.labaRugi.pendapatan), laba = sum(x => x.labaRugi.laba);
    const kasOp = sum(x => x.arusKas.operasi), cicil = sum(x => x.kc.cicil), bunga = sum(x => x.k.bunga), susut = sum(x => x.labaRugi.penyusutan);
    const kewajiban = cicil + bunga;
    return {
      bulan: all, n: all.length, pendapatan, laba, kasOperasi: kasOp, cicilan: cicil, bunga,
      rataPendapatan: all.length ? r2(pendapatan / all.length) : 0, rataLaba: all.length ? r2(laba / all.length) : 0,
      marginLaba: pendapatan > 0 ? laba / pendapatan : null,
      // kemampuan membayar angsuran (mirip DSCR): (laba + penyusutan + bunga) / (pokok + bunga)
      kemampuanBayar: kewajiban > 0 ? (laba + susut + bunga) / kewajiban : null,
      prive: sum(x => x.k.prive),
    };
  }

  const api = { KATEGORI, BOLEH_TEMPO, geserBulan, daftarBulan, bulanMulai, hitungBuku, laporanBulan, ringkasanBulan, bagianBersama, skalaOverhead, kontribusiUnit, unitUntukTarget, proyeksi, hargaPsikologis, hargaPaket, SATUAN, normSatuan, faktor, biayaBahan, biayaBahanBatch, overheadBulanan, hitungHPP, bulatkan, hargaDasar, hargaKanal, hargaSemuaKanal, marginAktual, markupDariMargin, marginDariMarkup, bep, simulasiBahan, periksa };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HPP = api;
})(this);
