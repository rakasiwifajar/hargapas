(function(){
  'use strict';
  const VERSION = '__VERSION__';
  const H = window.HPP;
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const KEY = 'hargapas.v1', OLDKEY = 'hitunghpp.v1', OBKEY = 'hargapas.onboarded';
  const embedded = (() => { try { return window.self !== window.top; } catch(e) { return true; } })();
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} };

  // ---------- format angka ----------
  const fmtRp = (x) => (x === null || x === undefined || !Number.isFinite(x)) ? '—' : 'Rp' + (Math.round(x) || 0).toLocaleString('id-ID');
  const fmtPct = (x) => (x === null || x === undefined || !Number.isFinite(x)) ? '—' : (x*100).toLocaleString('id-ID',{maximumFractionDigits:1}) + '%';
  const fmtNum = (x) => Number.isFinite(x) ? x.toLocaleString('id-ID',{maximumFractionDigits:1}) : '—';
  const fmtInput = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v))) ? '' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: 3 });
  function formatRaw(str){
    let s = String(str).replace(/[^\d,]/g, '');
    const i = s.indexOf(',');
    let int = i >= 0 ? s.slice(0, i) : s, dec = i >= 0 ? s.slice(i + 1).replace(/,/g, '').slice(0, 3) : null;
    int = int.replace(/^0+(?=\d)/, '');
    const intF = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return dec === null ? intF : (intF || '0') + ',' + dec;
  }
  const parseInput = (str) => { const s = String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''); return s === '' || s === '.' ? '' : Number(s); };
  function onNumInput(el){
    const pos = el.selectionStart ?? el.value.length;
    const sig = el.value.slice(0, pos).replace(/[^\d,]/g, '').length;
    const f = formatRaw(el.value);
    el.value = f;
    let n = 0, p = 0;
    while (p < f.length && n < sig) { if (/[\d,]/.test(f[p])) n++; p++; }
    try { el.setSelectionRange(p, p); } catch(e) {}
    return parseInput(f);
  }
  const uid = () => Math.random().toString(36).slice(2, 9);
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  // ---------- model ----------
  const defaultKanal = () => ([
    { id: uid(), nama: 'Toko langsung', tipe: 'langsung', persen: 0, biaya: 0 },
    { id: uid(), nama: 'Reseller', tipe: 'diskon', persen: 15, biaya: 0 },
    { id: uid(), nama: 'Marketplace', tipe: 'komisi', persen: 12, biaya: 0 }
  ]);
  const emptyBahan = () => ({ nama:'', harga:'', isi:'', satuanIsi:'kg', pakai:'', satuanPakai:'g' });
  const blank = () => ({
    id: uid(), mode: 'batch', nama: '', satuan: '', hasilBatch: '', susutPct: '', upahJam: '', jamBatch: '', menitUnit: '', kemasan: '', batchBulan: '',
    bahan: [emptyBahan()],
    overhead: { gas:'', listrik:'', sewa:'', hargaAlat:'', umurAlat:'', lain0:'' },
    harga: { metode:'margin', persen:30, bulat:500, kanal: defaultKanal() },
    mundur: { harga:'', komisi:'' },
    ohMode: 'sendiri', porsi: '', pesaing: { min:'', max:'' }, paket: { isi:'', diskon:'' }, rencana: { unit:'', target:'' }
  });
  const emptyOH = () => ({ gas:'', listrik:'', sewa:'', hargaAlat:'', umurAlat:'', lain0:'' });
  const contoh = () => ({
    ...blank(), isContoh: true, nama:'Bolu pisang (contoh)', satuan:'potong', hasilBatch:24, upahJam:15000, jamBatch:3, kemasan:1000, batchBulan:20,
    bahan: [
      { nama:'Tepung terigu', harga:14000, isi:1, satuanIsi:'kg', pakai:500, satuanPakai:'g' },
      { nama:'Gula pasir', harga:18000, isi:1, satuanIsi:'kg', pakai:400, satuanPakai:'g' },
      { nama:'Telur', harga:2000, isi:1, satuanIsi:'butir', pakai:8, satuanPakai:'butir' },
      { nama:'Mentega', harga:45000, isi:500, satuanIsi:'g', pakai:250, satuanPakai:'g' },
      { nama:'Pisang', harga:20000, isi:10, satuanIsi:'buah', pakai:10, satuanPakai:'buah' }
    ],
    overhead: { gas:120000, listrik:150000, sewa:0, hargaAlat:3000000, umurAlat:36, lain0:50000 },
    mundur: { harga:10000, komisi:0 }
  });
  const TEMPLATES = [
    { id:'kosong', judul:'Kosong', ket:'Isi semuanya sendiri', mode:'batch', satuan:'', bahan:[] },
    { id:'kue', judul:'Kue & roti', ket:'Sekali masak · potong', mode:'batch', satuan:'potong', bahan:[['Tepung terigu','kg','g'],['Gula pasir','kg','g'],['Telur','butir','butir'],['Mentega / margarin','g','g'],['Susu','liter','ml']] },
    { id:'minuman', judul:'Minuman', ket:'Sekali buat · cup', mode:'batch', satuan:'cup', bahan:[['Bubuk kopi / teh','g','g'],['Gula','kg','g'],['Susu','liter','ml'],['Es batu','kg','kg']] },
    { id:'camilan', judul:'Keripik & camilan', ket:'Sekali goreng · bungkus', mode:'batch', satuan:'bungkus', bahan:[['Bahan utama (singkong, pisang)','kg','kg'],['Minyak goreng','liter','ml'],['Bumbu','g','g'],['Garam','g','g']] },
    { id:'konveksi', judul:'Jahitan & konveksi', ket:'Satu per satu · pcs', mode:'unit', satuan:'pcs', bahan:[['Kain','m','cm'],['Benang','pcs','pcs'],['Kancing / resleting','pcs','pcs'],['Label','pcs','pcs']] },
    { id:'kerajinan', judul:'Kerajinan', ket:'Satu per satu · pcs', mode:'unit', satuan:'pcs', bahan:[['Bahan utama','pcs','pcs'],['Lem / bahan finishing','ml','ml'],['Aksesori','pcs','pcs']] },
    { id:'abonayam', lokal:true, judul:'Abon ayam', ket:'Sekali masak · bungkus', mode:'batch', satuan:'bungkus', bahan:[['Daging ayam','kg','kg'],['Bawang merah','kg','g'],['Bawang putih','kg','g'],['Gula merah','kg','g'],['Ketumbar','g','g'],['Lengkuas','g','g'],['Serai','ikat','ikat'],['Santan / kelapa','buah','buah'],['Minyak goreng','liter','ml'],['Garam','g','g']] },
    { id:'abonikan', lokal:true, judul:'Abon ikan', ket:'Sekali masak · bungkus', mode:'batch', satuan:'bungkus', bahan:[['Ikan (tuna / cakalang)','kg','kg'],['Bawang merah','kg','g'],['Bawang putih','kg','g'],['Cabai','kg','g'],['Gula merah','kg','g'],['Ketumbar','g','g'],['Lengkuas','g','g'],['Serai','ikat','ikat'],['Santan / kelapa','buah','buah'],['Minyak goreng','liter','ml'],['Garam','g','g']] },
    { id:'tuing', lokal:true, judul:'Sambal ikan tuing-tuing', ket:'Sekali masak · botol', mode:'batch', satuan:'botol', bahan:[['Ikan tuing-tuing (ikan terbang)','kg','g'],['Cabai rawit','kg','g'],['Cabai merah','kg','g'],['Bawang merah','kg','g'],['Bawang putih','kg','g'],['Tomat','kg','g'],['Minyak goreng','liter','ml'],['Gula','kg','g'],['Garam','g','g']] },
    { id:'bawanggoreng', lokal:true, judul:'Bawang goreng', ket:'Sekali goreng · bungkus', mode:'batch', satuan:'bungkus', bahan:[['Bawang merah','kg','kg'],['Minyak goreng','liter','ml'],['Tepung (bila dipakai)','kg','g'],['Garam','g','g']] },
    { id:'boncabe', lokal:true, judul:'Bon cabe (cabai bubuk)', ket:'Sekali buat · botol', mode:'batch', satuan:'botol', bahan:[['Cabai rawit','kg','kg'],['Bawang putih','kg','g'],['Daun jeruk','lembar','lembar'],['Garam','g','g'],['Botol / wadah','pcs','pcs']] }
  ];
  const UNIT_GROUPS = [['Berat', ['g','ons','kg']], ['Cairan', ['ml','liter']], ['Panjang', ['cm','m']], ['Hitungan', ['butir','buah','biji','pcs','lembar','bungkus','sachet','ikat','botol','kaleng']]];
  const UNIT_LABEL = { g:'gram', ons:'ons', kg:'kg', ml:'ml', liter:'liter', cm:'cm', m:'meter', butir:'butir', buah:'buah', biji:'biji', pcs:'pcs', lembar:'lembar', bungkus:'bungkus', sachet:'sachet', ikat:'ikat', botol:'botol', kaleng:'kaleng' };
  const uLabel = (u) => UNIT_LABEL[H.normSatuan(u)] || u || '';
  function unitOptions(selected, compatWith){
    const sel = H.normSatuan(selected);
    let html = '';
    const known = Object.keys(H.SATUAN);
    if (sel && !known.includes(sel)) html += `<option value="${esc(selected)}" selected>${esc(selected)}</option>`;
    UNIT_GROUPS.forEach(([g, us]) => {
      const list = compatWith ? us.filter(u => H.faktor(u, compatWith) !== null) : us;
      if (list.length) html += `<optgroup label="${g}">` + list.map(u => `<option value="${u}"${u === sel ? ' selected' : ''}>${UNIT_LABEL[u]}</option>`).join('') + '</optgroup>';
    });
    return html;
  }

  let state;
  function migrate(p){
    const b = blank();
    p.mode = p.mode || 'batch';
    if (p.isContoh === undefined) p.isContoh = /\(contoh\)/i.test(p.nama || '');
    ['susutPct','menitUnit'].forEach(k => { if (p[k] === undefined) p[k] = ''; });
    p.overhead = { ...b.overhead, ...(p.overhead || {}) };
    p.mundur = { ...b.mundur, ...(p.mundur || {}) };
    p.harga = p.harga || b.harga;
    if (!Array.isArray(p.harga.kanal)) {
      const h = p.harga;
      h.kanal = [
        { id: uid(), nama: 'Toko langsung', tipe: 'langsung', persen: 0, biaya: 0 },
        { id: uid(), nama: 'Reseller', tipe: 'diskon', persen: h.diskonReseller ?? 15, biaya: 0 },
        { id: uid(), nama: 'Marketplace', tipe: 'komisi', persen: h.komisi ?? 12, biaya: h.biayaMP ?? 0 }
      ];
      delete h.diskonReseller; delete h.komisi; delete h.biayaMP;
    }
    if (!Array.isArray(p.bahan) || !p.bahan.length) p.bahan = [emptyBahan()];
    p.ohMode = p.ohMode || 'sendiri'; if (p.porsi === undefined) p.porsi = '';
    p.pesaing = { min:'', max:'', ...(p.pesaing || {}) }; p.paket = { isi:'', diskon:'', ...(p.paket || {}) }; p.rencana = { unit:'', target:'', ...(p.rencana || {}) };
    p.bahan.forEach(b => { if (b.satuanIsi) b.satuanIsi = H.normSatuan(b.satuanIsi); if (!b.satuanPakai) b.satuanPakai = b.satuanIsi || ''; else b.satuanPakai = H.normSatuan(b.satuanPakai); });
    return p;
  }
  function emptyKas(){ return { profil: {}, awal: { bulan: '', kas: '', persediaan: '', peralatan: [], utang: [] }, trx: [], stok: {}, lk: { n: 3, kota: '', catatan: '', lamp: false } }; }
  function normKas(){
    const e = emptyKas(), k = state.kas || {};
    state.kas = { ...e, ...k, profil: { ...(k.profil || {}) }, awal: { ...e.awal, ...(k.awal || {}) }, stok: { ...(k.stok || {}) }, lk: { ...e.lk, ...(k.lk || {}) } };
    if (!Array.isArray(state.kas.trx)) state.kas.trx = [];
    if (!Array.isArray(state.kas.produksi)) state.kas.produksi = [];
    if (!Array.isArray(state.kas.awal.peralatan)) state.kas.awal.peralatan = [];
    if (!Array.isArray(state.kas.awal.utang)) state.kas.awal.utang = [];
    ['piutang', 'utangUsaha'].forEach(f => { if (!Array.isArray(state.kas.awal[f])) state.kas.awal[f] = []; });
  }
  function load(){
    try { state = JSON.parse(lsGet(KEY) || lsGet(OLDKEY)); } catch(e) { state = null; }
    if (!state || !Array.isArray(state.products)) state = { products: [], activeId: null };
    normKas();
    state.usaha = { bagi: 'rata', pph: false, ...(state.usaha || {}) }; state.usaha.overhead = { ...emptyOH(), ...(state.usaha.overhead || {}) };
    if (!Array.isArray(state.penjualan)) state.penjualan = [];
    state.products.forEach(migrate);
    if (!state.firstUse) state.firstUse = new Date().toISOString();
    if (!state.products.find(p => p.id === state.activeId)) state.activeId = state.products[0] ? state.products[0].id : null;
  }
  let saveT;
  let savedT;
  const saveNow = () => {
    clearTimeout(saveT); lsSet(KEY, JSON.stringify(state));
    const s = document.getElementById('saved');
    if (s) { s.classList.add('show'); clearTimeout(savedT); savedT = setTimeout(() => s.classList.remove('show'), 1600); }
  };
  const save = () => { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); };
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
  const cur = () => state.products.find(p => p.id === state.activeId) || state.products[0];
  const getPath = (o, path) => path.split('.').reduce((x, k) => (x ? x[k] : undefined), o);
  function setPath(o, path, val){ const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((x, k) => (x[k] ??= {}), o); t[last] = val; }
  const jamBulan = (p) => (p.mode === 'unit' ? (Number(p.menitUnit) || 0) / 60 : (Number(p.jamBatch) || 0)) * (Number(p.batchBulan) || 0);
  function shareOf(p){
    return H.bagianBersama(state.products.map(x => ({ id: x.id, bersama: x.ohMode === 'bersama', jamBulan: jamBulan(x), porsi: x.porsi })), p.id, state.usaha.bagi);
  }
  const ohTarget = (p, key) => (key.startsWith('overhead.') && p.ohMode === 'bersama') ? state.usaha : p;
  function toEngine(p){
    const e = { ...p, overhead: { ...p.overhead, lain: [{ nilai: p.overhead.lain0 }] } };
    if (p.ohMode === 'bersama') { const u = state.usaha.overhead; e.overhead = H.skalaOverhead({ ...u, lain: [{ nilai: u.lain0 }] }, shareOf(p)); }
    if (p.mode === 'unit') { e.hasilBatch = 1; e.jamBatch = (Number(p.menitUnit) || 0) / 60; }
    return e;
  }
  function switchMode(p, to){
    if (p.mode === to) return;
    const r = (x, d) => Math.round(x * 10**d) / 10**d;
    if (to === 'unit') {
      const n = Number(p.hasilBatch) || 0;
      if (n > 0) {
        p.bahan.forEach(b => { if (b.pakai !== '') b.pakai = r(Number(b.pakai) / n, 3); });
        p.menitUnit = r((Number(p.jamBatch) || 0) * 60 / n, 2);
        if (p.batchBulan !== '') p.batchBulan = n * Number(p.batchBulan);
      }
    } else { p.hasilBatch = 1; p.jamBatch = r((Number(p.menitUnit) || 0) / 60, 2); }
    p.mode = to;
  }

  // ---------- bahan bersama ----------
  function allBahanRows(){ const out = []; state.products.forEach(p => p.bahan.forEach(b => { if (norm(b.nama)) out.push({ p, b }); })); return out; }
  function propagate(src){
    const key = norm(src.nama); if (!key) return 0;
    let n = 0;
    state.products.forEach(p => p.bahan.forEach(b => {
      if (b !== src && norm(b.nama) === key) { b.harga = src.harga; b.isi = src.isi; b.satuanIsi = src.satuanIsi; if (H.faktor(b.satuanPakai, b.satuanIsi) === null) b.satuanPakai = b.satuanIsi; if (p !== cur()) n++; }
    }));
    return n;
  }
  function sharedCount(b){ const key = norm(b.nama); if (!key) return 0; return state.products.filter(p => p !== cur() && p.bahan.some(x => norm(x.nama) === key)).length; }
  function findLib(name, except){ const key = norm(name); if (!key) return null; for (const { b } of allBahanRows()) if (b !== except && norm(b.nama) === key && b.harga !== '') return b; return null; }

  // ---------- render: hitung ----------
  function renderSelect(){
    const sel = $('#prodSel'); sel.innerHTML = '';
    state.products.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.nama || 'Produk tanpa nama'; o.selected = p.id === state.activeId; sel.appendChild(o); });
  }
  function applyMode(){
    const p = cur(), unit = p.mode === 'unit';
    document.body.classList.toggle('mode-unit', unit);
    $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === p.mode)));
  }
  function fillInputs(){
    const p = cur(); if (!p) return;
    $$('#view-hitung [data-k]').forEach(el => {
      const v = getPath(ohTarget(p, el.dataset.k), el.dataset.k);
      el.value = el.classList.contains('num') ? fmtInput(v) : (v ?? '');
    });
    $$('[data-metode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metode === p.harga.metode)));
    applyOh(); $('#f_pph').checked = !!state.usaha.pph;
    applyMode(); renderBahan(); renderKanalEditor(); renderDatalist();
  }
  function renderDatalist(){
    const names = new Map(); allBahanRows().forEach(({ b }) => names.set(norm(b.nama), b.nama.trim()));
    $('#dlBahan').innerHTML = Array.from(names.values()).map(n => `<option value="${esc(n)}"></option>`).join('');
  }
  let openRows = new Set();
  function renderBahan(focusNew){
    const p = cur(), list = $('#bahanList'); list.innerHTML = '';
    p.bahan.forEach((b, i) => {
      const incomplete = !norm(b.nama) || !(Number(b.isi) > 0) || b.harga === '' || b.pakai === '';
      const d = document.createElement('details'); d.className = 'brow'; d.dataset.row = i;
      if (openRows.has(i) || (incomplete && !p.isContoh)) d.open = true;
      d.innerHTML = `
        <summary><span class="bt"><span class="bname" data-bname="${i}"></span><span class="bsum" data-bsum="${i}"></span></span><b class="bcost" data-costb="${i}">Rp0</b>
          <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary>
        <div class="bbody">
          <div class="rowhead">
            <div class="field"><label for="bn${i}">Nama bahan</label><input id="bn${i}" data-b="${i}" data-f="nama" type="text" list="dlBahan" placeholder="mis. Tepung terigu" autocomplete="off"></div>
            <button class="btn icon" type="button" data-del="${i}" aria-label="Hapus bahan ${i+1}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
          </div>
          <div class="sentence">
            <div class="field"><label for="bi${i}">Beli berapa?</label><div class="inp"><input id="bi${i}" class="num" data-b="${i}" data-f="isi" type="text" inputmode="decimal" placeholder="1"></div></div>
            <div class="field"><label for="bs${i}">Satuan beli</label><select id="bs${i}" data-b="${i}" data-f="satuanIsi">${unitOptions(b.satuanIsi)}</select></div>
            <div class="field full"><label for="bh${i}">Harganya</label><div class="inp has-pre"><span class="pre">Rp</span><input id="bh${i}" class="num" data-b="${i}" data-f="harga" type="text" inputmode="decimal" placeholder="14.000"></div></div>
            <div class="field"><label for="bp${i}"><span class="only-batch">Dipakai sekali produksi</span><span class="only-unit">Dipakai untuk satu barang</span></label><div class="inp"><input id="bp${i}" class="num" data-b="${i}" data-f="pakai" type="text" inputmode="decimal" placeholder="500"></div></div>
            <div class="field"><label for="bu${i}">Satuan pakai</label><select id="bu${i}" data-b="${i}" data-f="satuanPakai">${unitOptions(b.satuanPakai || b.satuanIsi, b.satuanIsi)}</select></div>
          </div>
          <div class="conv" data-conv="${i}" hidden></div>
          <div class="shared" data-sharedb="${i}" hidden></div>
        </div>`;
      d.addEventListener('toggle', () => { if (d.open) openRows.add(i); else openRows.delete(i); });
      list.appendChild(d);
      $$('input[data-b]', d).forEach(el => { const v = b[el.dataset.f]; el.value = el.classList.contains('num') ? fmtInput(v) : (v ?? ''); });
    });
    updateBahanMeta();
  }
  function updateBahanMeta(){
    const p = cur();
    p.bahan.forEach((b, i) => {
      const bn = $(`[data-bname="${i}"]`); if (bn) bn.textContent = b.nama || 'Bahan baru';
      const ok = Number(b.isi) > 0 && b.harga !== '' && b.pakai !== '';
      const f = H.faktor(b.satuanPakai || b.satuanIsi, b.satuanIsi);
      const bs = $(`[data-bsum="${i}"]`);
      if (bs) {
        bs.textContent = ok ? `Beli ${fmtInput(b.isi)} ${uLabel(b.satuanIsi)} ${fmtRp(Number(b.harga))} · pakai ${fmtInput(b.pakai)} ${uLabel(b.satuanPakai || b.satuanIsi)}` : 'Belum lengkap, ketuk untuk mengisi';
        bs.classList.toggle('bad', !ok && (Number(b.harga) > 0 || Number(b.pakai) > 0));
      }
      const c = $(`[data-costb="${i}"]`); if (c) c.textContent = ok && f !== null ? fmtRp(H.biayaBahan(b)) : '—';
      const cv = $(`[data-conv="${i}"]`);
      if (cv) {
        const beda = H.normSatuan(b.satuanPakai) !== H.normSatuan(b.satuanIsi);
        cv.hidden = !(ok && beda && f !== null);
        if (!cv.hidden) cv.textContent = `${fmtInput(b.pakai)} ${uLabel(b.satuanPakai)} = ${fmtInput(Number(b.pakai) * f)} ${uLabel(b.satuanIsi)}, biayanya ${fmtRp(H.biayaBahan(b))}`;
      }
      const sh = $(`[data-sharedb="${i}"]`);
      if (sh) { const n = sharedCount(b); sh.hidden = n === 0; sh.textContent = n ? `Harga bahan ini dipakai bersama ${n} produk lain dan ikut diperbarui.` : ''; }
      const isiEl = $('#bi' + i);
      if (isiEl) isiEl.classList.toggle('invalid', (Number(b.harga) > 0 || Number(b.pakai) > 0) && !(Number(b.isi) > 0));
    });
  }
  function renderKanalEditor(){
    const p = cur(), box = $('#kanalList'); box.innerHTML = '';
    p.harga.kanal.forEach((k, i) => {
      const d = document.createElement('div'); d.className = 'kcard';
      if (k.tipe === 'langsung') {
        d.innerHTML = `<div class="khead"><label class="sr" for="kn${i}">Nama kanal</label><input id="kn${i}" data-kn="${i}" data-kf="nama" type="text"></div>
          <div class="kf">
            <div class="field"><label for="kp${i}">Potongan (mis. QRIS)</label><div class="inp has-suf"><input id="kp${i}" class="num" data-kn="${i}" data-kf="persen" type="text" inputmode="decimal" placeholder="0"><span class="suf">%</span></div></div>
            <div class="field"><label for="kb${i}">Biaya/unit (mis. ongkir)</label><div class="inp has-pre"><span class="pre">Rp</span><input id="kb${i}" class="num" data-kn="${i}" data-kf="biaya" type="text" inputmode="decimal" placeholder="0"></div></div>
            <div></div>
          </div>
          <div class="knote">Harga dasar. Potongan dan biaya di sini ikut diperhitungkan agar untung tetap.</div>`;
      } else {
        const komisi = k.tipe === 'komisi';
        d.innerHTML = `
          <div class="khead"><label class="sr" for="kn${i}">Nama kanal</label><input id="kn${i}" data-kn="${i}" data-kf="nama" type="text" placeholder="Nama kanal, mis. GoFood">
            <button class="btn icon" type="button" data-kdel="${i}" aria-label="Hapus kanal ${esc(k.nama || '')}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>
          <div class="kf">
            <div class="field"><label for="kt${i}">Jenis</label><select id="kt${i}" data-kn="${i}" data-kf="tipe"><option value="diskon">Diskon</option><option value="komisi">Komisi</option></select></div>
            <div class="field"><label for="kp${i}">${komisi ? 'Komisi' : 'Diskon'}</label><div class="inp has-suf"><input id="kp${i}" class="num" data-kn="${i}" data-kf="persen" type="text" inputmode="decimal" placeholder="0"><span class="suf">%</span></div></div>
            ${komisi ? `<div class="field"><label for="kb${i}">Biaya/unit</label><div class="inp has-pre"><span class="pre">Rp</span><input id="kb${i}" class="num" data-kn="${i}" data-kf="biaya" type="text" inputmode="decimal" placeholder="0"></div></div>` : `<div></div>`}
          </div>
          <div class="knote">${komisi ? 'Harga tayang dinaikkan agar margin tetap setelah dipotong komisi.' : 'Harga untuk kanal ini = harga toko dikurangi diskon.'}</div>`;
      }
      box.appendChild(d);
      $$('[data-kn]', d).forEach(el => { const v = k[el.dataset.kf]; el.value = el.classList.contains('num') ? fmtInput(v) : (v ?? ''); });
    });
  }

  let last = null;
  function compute(){
    if (!cur()) return;
    const p = cur(), e = toEngine(p), r = H.hitungHPP(e);
    const sat = p.satuan || 'unit';
    $$('.satuanTxt').forEach(s => s.textContent = sat);
    $('#sumBahan').textContent = fmtRp(r.bahanBatch) + (p.mode === 'unit' ? '/' + sat : '');
    $('#sumTK').textContent = fmtRp(r.perUnit.tenagaKerja + r.perUnit.kemasan) + '/' + sat;
    $('#sumOH').textContent = fmtRp(r.overheadBulan) + '/bln';
    $('#hintSusut').textContent = 'Penyusutan: ' + fmtRp(r.penyusutan) + '/bulan';
    $('#sufProd').textContent = p.mode === 'unit' ? sat : 'kali';
    $('#sufHasil').textContent = sat;
    $('#stLbl').textContent = 'Modal / ' + sat;
    if (Number(p.susutPct) > 0) $('#extra1').open = true;
    if (Number(p.overhead.sewa) > 0 || Number(p.overhead.lain0) > 0 || Number(p.overhead.hargaAlat) > 0) $('#extra3').open = true;
    $('#noteContoh').hidden = !p.isContoh;
    $('#hintProd').textContent = '= ' + fmtNum(r.produksiBulan) + ' ' + sat + ' layak jual per bulan';
    $('#hintProd').hidden = false;
    $('#noteUpah').hidden = Number(p.upahJam) > 0;
    updateBahanMeta();

    // pemeriksaan
    const cek = H.periksa(e);
    $('#checks').innerHTML = cek.length && (p.touched !== false || p.isContoh) ? `<div class="note ${cek.some(c => c.level === 'bad') ? 'bad' : 'warn'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg><div class="grow"><b>Periksa isian berikut</b><ul>${cek.map(c => `<li>${esc(c.pesan)}</li>`).join('')}</ul></div></div>` : '';

    // HPP
    $('#outHPP').innerHTML = `<span class="anum">${fmtRp(r.hpp)}</span> <small>/ ${esc(sat)}</small>`; bumpIf($('#outHPP'), r.hpp);
    const comps = [['Bahan', r.perUnit.bahan, 'var(--c1)'], ['Tenaga kerja', r.perUnit.tenagaKerja, 'var(--c2)'], ['Kemasan', r.perUnit.kemasan, 'var(--c3)'], ['Biaya bulanan', r.perUnit.overhead, 'var(--c4)']];
    $('#outStack').innerHTML = r.hpp > 0 ? comps.map(c => `<i style="width:${c[1]/r.hpp*100}%;background:${c[2]}"></i>`).join('') : '';
    $('#outLegend').innerHTML = comps.map(c => `<div><span class="k"><i style="background:${c[2]}"></i>${c[0]}</span><b>${fmtRp(c[1])} <span style="color:var(--muted);font-weight:500">${r.hpp>0?fmtPct(c[1]/r.hpp):''}</span></b></div>`).join('');

    // harga
    const h = { ...p.harga, metode: state.ui === 'sederhana' ? 'margin' : p.harga.metode, pajak: state.usaha.pph ? 0.5 : 0 }, step = Number(h.bulat) || 0, persen = Number(h.persen) || 0;
    const pMarkup = H.hargaDasar(r.hpp, 'markup', persen), pMargin = H.hargaDasar(r.hpp, 'margin', persen);
    $('#outCompare').innerHTML = `
      <div class="box ${h.metode==='margin'?'on':''}"><div class="lbl2">Untung ${fmtNum(persen)}% dari harga jual <span class="term">(margin)</span></div><div class="val">${fmtRp(pMargin)}</div><div class="eq">sama dengan tambah ${fmtPct(H.markupDariMargin(persen/100))} dari modal</div></div>
      <div class="box ${h.metode==='markup'?'on':''}"><div class="lbl2">Tambah ${fmtNum(persen)}% dari modal <span class="term">(markup)</span></div><div class="val">${fmtRp(pMarkup)}</div><div class="eq">untungnya hanya ${fmtPct(H.marginDariMarkup(persen/100))} dari harga jual</div></div>`;
    const nh = $('#noteHarga');
    nh.hidden = !(h.metode === 'margin' && persen >= 100);
    nh.textContent = 'Untung dari harga jual tidak bisa 100% atau lebih. Pakai angka di bawah 100.';
    const kanal = H.hargaSemuaKanal(r.hpp, h, h.kanal);
    $('#outKanal').innerHTML = kanal.map(c => {
      const cls = c.margin === null || c.margin < 0 ? 'bad' : c.margin < 0.15 ? 'warn' : 'good';
      const pot = (c.potongan ? ` · potongan ${fmtNum(c.potongan)}%` : '') + (c.biayaUnit ? ` + ${fmtRp(c.biayaUnit)}` : '');
      const sub = (c.tipe === 'langsung' ? 'harga dasar' : c.tipe === 'diskon' ? `diskon ${fmtNum(Number(c.persen)||0)}% dari harga toko` : 'harga tayang') + pot;
      return `<tr><td class="chname">${esc(c.nama || 'Kanal')}<small>${sub}</small></td><td class="n"><b>${c.harga === null ? 'Tidak mungkin' : fmtRp(c.harga)}</b></td><td class="n hide-s">${fmtRp(c.diterima)}</td><td class="n">${fmtRp(c.laba)}</td><td class="n"><span class="pill ${cls}">${fmtPct(c.margin)}</span></td></tr>`;
    }).join('');
    const toko = kanal.find(c => c.tipe === 'langsung');
    const hargaToko = toko && toko.harga !== null ? toko.harga : null;
    const kT = toko ? toko.potongan : 0, fT = toko ? toko.biayaUnit : 0;
    $('#outPriceSimple').innerHTML = hargaToko ? `<div class="l">Harga jual yang disarankan</div><div class="v">${fmtRp(hargaToko)} <span style="font-size:16px;font-weight:600;color:var(--muted)">/ ${esc(sat)}</span></div><div class="s">Untung ${fmtRp(toko.laba)} setiap ${esc(sat)}${kT ? ' (setelah potongan ' + fmtNum(kT) + '%)' : ''}</div>` : '';

    // hitung mundur
    const mh = Number(p.mundur.harga) || 0, mk = Number(p.mundur.komisi) || 0;
    const ma = H.marginAktual(mh, r.hpp, mk, 0);
    const mcol = ma === null ? '' : ma < 0 ? 'var(--bad)' : ma < 0.15 ? 'var(--warn)' : 'var(--good)';
    $('#outMundur').innerHTML = mh > 0 ? `
      <div class="box"><div class="lbl2">Laba per ${esc(sat)}</div><div class="val">${fmtRp(mh*(1-mk/100) - r.hpp)}</div></div>
      <div class="box"><div class="lbl2">Margin sebenarnya</div><div class="val" style="color:${mcol}">${fmtPct(ma)}</div></div>
      <div class="box"><div class="lbl2">Setara markup</div><div class="val">${r.hpp > 0 ? fmtPct((mh*(1-mk/100) - r.hpp)/r.hpp) : '—'}</div></div>`
      : `<div class="box wide"><div class="lbl2">Isi harga jual untuk melihat hasilnya</div></div>`;

    // BEP
    $('#bepHargaTxt').textContent = fmtRp(hargaToko);
    const b = hargaToko ? H.bep(r.fc, hargaToko, r.vc, kT, fT) : null;
    const nb = $('#noteBEP');
    if (b) {
      $('#outBEP').innerHTML = `
        <div class="box"><div class="lbl2">Minimal terjual</div><div class="val">${fmtNum(b.unitBulat)} ${esc(sat)}</div></div>
        <div class="box"><div class="lbl2">Omzet minimal</div><div class="val">${fmtRp(b.rupiah)}</div></div>
        <div class="box"><div class="lbl2">Biaya tetap / bulan</div><div class="val">${fmtRp(r.fc)}</div></div>`;
      if (r.produksiBulan > 0) {
        const pct = b.unitBulat / r.produksiBulan;
        nb.hidden = false; nb.className = 'note ' + (pct > 1 ? 'bad' : pct > 0.7 ? 'warn' : 'info');
        nb.textContent = pct > 1 ? `Produksi ${fmtNum(r.produksiBulan)} ${sat}/bulan belum cukup untuk menutup biaya tetap. Naikkan harga, tekan biaya, atau tambah produksi.`
          : `Titik impas = ${fmtPct(pct)} dari produksi bulanan Anda (${fmtNum(r.produksiBulan)} ${sat}). Setiap ${sat} di atas itu menyumbang laba ${fmtRp(b.kontribusi)}.`;
      } else nb.hidden = true;
    } else {
      $('#outBEP').innerHTML = `<div class="box wide"><div class="lbl2">Harga belum menutup biaya variabel per unit</div><div class="val" style="font-size:15px">Harga harus di atas ${fmtRp(r.vc)}.</div></div>`;
      nb.hidden = true;
    }

    // biaya bersama
    if (p.ohMode === 'bersama') {
      const n = state.products.filter(x => x.ohMode === 'bersama').length, sh = shareOf(p);
      const cara = { rata: 'dibagi rata', waktu: 'sesuai lama produksi', manual: 'sesuai porsi yang Anda atur' }[state.usaha.bagi];
      $('#ohInfo').innerHTML = `<span class="grow">Biaya bulanan usaha dipakai <b>${n} produk</b>, ${cara}. Bagian produk ini <b>${fmtPct(sh)}</b> = ${fmtRp(r.overheadBulan)} per bulan.</span>`;
      $('#fieldPorsi').hidden = state.usaha.bagi !== 'manual';
    }

    // atur harga: pesaing, harga psikologis, paket
    const pmin = Number(p.pesaing.min) || 0, pmax = Number(p.pesaing.max) || 0;
    if (hargaToko && pmin > 0 && pmax > pmin) {
      const lo = Math.min(pmin, hargaToko) * 0.95, hi = Math.max(pmax, hargaToko) * 1.05, pos = (v) => ((v - lo) / (hi - lo) * 100).toFixed(1);
      const posisi = hargaToko < pmin ? 'lebih murah dari semua pesaing' : hargaToko > pmax ? 'lebih mahal dari semua pesaing' : 'berada di rentang harga pesaing';
      $('#outPesaing').innerHTML = `<div class="pbar" role="img" aria-label="Harga Anda ${posisi}"><div class="mk" style="left:${pos(hargaToko)}%"><span>Anda ${fmtRp(hargaToko)}</span></div></div>
        <div class="pbar-l"><span>${fmtRp(pmin)}</span><span>${fmtRp(pmax)}</span></div>
        <p class="hint" style="margin:6px 0 0">Harga Anda ${posisi}. ${hargaToko > pmax ? 'Tonjolkan keunggulan produk, atau periksa biaya yang bisa ditekan.' : hargaToko < pmin ? 'Ada ruang menaikkan harga tanpa kalah bersaing.' : ''}</p>`;
    } else $('#outPesaing').innerHTML = '<p class="hint" style="margin:6px 0 0">Isi harga termurah dan termahal pesaing untuk melihat posisi harga Anda.</p>';
    const ps = hargaToko ? H.hargaPsikologis(hargaToko, r.hpp, kT, fT) : [];
    $('#outPsiko').innerHTML = ps.length ? ps.map(x => `<div class="pc"><b>${fmtRp(x.harga)}</b><span>untung ${fmtPct(x.margin)}</span></div>`).join('') : '<p class="hint">—</p>';
    const pIsi = Number(p.paket.isi) || 0;
    if (hargaToko && pIsi > 1) {
      const pk = H.hargaPaket(hargaToko, r.hpp, pIsi, p.paket.diskon, kT, fT, step);
      $('#outPaket').innerHTML = `<div class="box"><div class="lbl2">Harga paket isi ${pk.isi}</div><div class="val">${fmtRp(pk.harga)}</div></div>
        <div class="box"><div class="lbl2">Untung per paket</div><div class="val" style="color:${pk.untung < 0 ? 'var(--bad)' : 'inherit'}">${fmtRp(pk.untung)}</div></div>
        <div class="box"><div class="lbl2">Pembeli hemat per ${esc(sat)}</div><div class="val">${fmtRp(pk.hematPerUnit)}</div></div>`;
    } else $('#outPaket').innerHTML = '<div class="box wide"><div class="lbl2">Isi jumlah per paket (2 atau lebih) untuk melihat harga paket</div></div>';

    // rencana sebulan
    const ru = Number(p.rencana.unit) || 0, rt = Number(p.rencana.target) || 0;
    const nr = $('#noteRencana');
    if (hargaToko) {
      const pr = H.proyeksi(r.fc, r.vc, hargaToko, ru, kT, fT);
      const perlu = rt > 0 ? H.unitUntukTarget(r.fc, r.vc, hargaToko, rt, kT, fT) : null;
      $('#outRencana').innerHTML = `<div class="box"><div class="lbl2">Omzet sebulan</div><div class="val">${ru ? fmtRp(pr.omzet) : '—'}</div></div>
        <div class="box"><div class="lbl2">Untung bersih sebulan</div><div class="val" style="color:${ru && pr.untung < 0 ? 'var(--bad)' : ru ? 'var(--good)' : 'inherit'}">${ru ? fmtRp(pr.untung) : '—'}</div></div>
        <div class="box"><div class="lbl2">Perlu terjual untuk target</div><div class="val">${rt ? (perlu === null ? 'Tidak mungkin' : fmtNum(perlu) + ' ' + esc(sat)) : '—'}</div></div>`;
      const msg = [];
      if (ru) msg.push(`Dari ${fmtNum(ru)} ${sat}: omzet ${fmtRp(pr.omzet)}, dikurangi biaya bahan, tenaga & kemasan ${fmtRp(pr.biayaVariabel)}${pr.potongan ? ', potongan ' + fmtRp(pr.potongan) : ''}, dan biaya tetap ${fmtRp(pr.biayaTetap)}.`);
      if (rt && perlu !== null && r.produksiBulan > 0 && perlu > r.produksiBulan) msg.push(`Target ini butuh ${fmtNum(perlu)} ${sat}, lebih dari produksi Anda sekarang (${fmtNum(r.produksiBulan)} ${sat}). Naikkan harga, tambah produksi, atau turunkan target.`);
      nr.hidden = !msg.length; nr.className = 'note ' + (rt && perlu !== null && r.produksiBulan > 0 && perlu > r.produksiBulan ? 'warn' : 'info'); nr.textContent = msg.join(' ');
    } else { $('#outRencana').innerHTML = ''; nr.hidden = true; }

    // kesimpulan (bahasa sehari-hari)
    const kes = $('#kesimpulan'), mtk = hargaToko ? H.marginAktual(hargaToko, r.hpp, 0, 0) : null;
    let level = '', main = '', sub = '';
    if (!(r.hpp > 0)) { main = 'Isi bahan dan biaya untuk melihat hasilnya.'; sub = 'Mulai dari langkah 1: bahan yang dibeli.'; }
    else if (!hargaToko) { level = 'bad'; main = 'Harga jual belum bisa dihitung.'; sub = 'Periksa persentase untung yang diinginkan.'; }
    else {
      const mtk2 = toko.margin; level = mtk2 < 0 ? 'bad' : mtk2 < 0.15 ? 'warn' : 'good';
      main = `Jual ${fmtRp(hargaToko)} per ${sat}.`;
      const parts = [`Modal Anda ${fmtRp(r.hpp)} per ${sat}, jadi untungnya ${fmtRp(toko.laba)} setiap ${sat}${kT ? ' setelah potongan' : ''}.`];
      if (level === 'warn') parts.push('Untungnya tipis; pertimbangkan menaikkan harga atau menekan biaya.');
      if (level === 'bad') parts.push('Harga ini masih rugi.');
      if (b && b.unitBulat > 0) parts.push(`Supaya balik modal, jual paling sedikit ${fmtNum(b.unitBulat)} ${sat} sebulan.`);
      if (cek.some(c => c.level === 'bad')) parts.push('Ada isian yang perlu diperiksa.');
      sub = parts.join(' ');
    }
    kes.className = 'result kesimpulan res ' + level;
    const s1 = (p.mode === 'unit' || Number(p.hasilBatch) > 0) && p.bahan.some(x => Number(x.isi) > 0 && x.harga !== '' && x.pakai !== '');
    const s2 = Number(p.upahJam) > 0 || Number(p.kemasan) > 0;
    const s3 = Number(p.batchBulan) > 0;
    const done = [s1, s2, s3];
    $$('#emptyRes .prog i').forEach((el, j) => el.classList.toggle('on', done[j]));
    $('#emptyProg').textContent = done.filter(Boolean).length + ' dari 3 langkah selesai';
    $('#emptyNext').textContent = !s1 ? 'Mulai dari langkah 1: tulis bahan yang dibeli, berapa harganya, dan berapa yang dipakai.' : !s2 ? 'Lanjut ke langkah 2: isi upah dan biaya kemasan.' : 'Lanjut ke langkah 3: isi berapa kali produksi dalam sebulan.';
    $('.col-out').classList.toggle('has-res', r.hpp > 0);
    document.body.classList.toggle('no-res', !(r.hpp > 0));
    $('#kesMain').textContent = main; $('#kesSub').textContent = sub;

    // simulasi
    const sp = Number($('#f_sim').value);
    $('#simPct').textContent = '+' + sp + '%';
    const s = H.simulasiBahan(e, sp, hargaToko);
    $('#outSim').innerHTML = `
      <div class="box"><div class="lbl2">HPP baru</div><div class="val">${fmtRp(s.hppBaru)}</div></div>
      <div class="box"><div class="lbl2">Margin jika harga tetap</div><div class="val">${fmtPct(s.marginBaru)}</div></div>
      <div class="box"><div class="lbl2">Harga agar margin tetap</div><div class="val">${fmtRp(s.hargaPertahankan === null ? null : H.bulatkan(s.hargaPertahankan, step))}</div></div>`;

    // sticky
    animNum($('#stHPP'), r.hpp); animNum($('#stHarga'), hargaToko);
    const mt = hargaToko ? H.marginAktual(hargaToko, r.hpp, 0, 0) : null;
    const st = $('#stMargin'); st.textContent = 'Margin ' + fmtPct(mt);
    st.className = 'pill ' + (mt === null || mt < 0 ? 'bad' : mt < 0.15 ? 'warn' : 'good');

    last = { p, e, r, kanal, hargaToko, b, sat };
    $('#btnWA').href = 'https://wa.me/?text=' + encodeURIComponent(summaryText());
    updateKirimLink();
    checkBackup();
  }

  function summaryText(){
    const { p, r, kanal, b, sat } = last;
    return [
      `*${p.nama || 'Produk'}* — ringkasan harga`,
      `Modal per ${sat} (HPP): ${fmtRp(r.hpp)}`,
      `  • Bahan baku: ${fmtRp(r.perUnit.bahan)}`,
      `  • Tenaga kerja: ${fmtRp(r.perUnit.tenagaKerja)}`,
      `  • Kemasan: ${fmtRp(r.perUnit.kemasan)}`,
      `  • Overhead: ${fmtRp(r.perUnit.overhead)}`,
      ``,
      ...kanal.map(c => `Harga ${c.nama}: ${fmtRp(c.harga)} (margin ${fmtPct(c.margin)})`),
      b ? `Titik impas: ${fmtNum(b.unitBulat)} ${sat}/bulan` : `Titik impas: harga belum menutup biaya variabel`,
      ``, `Dihitung dengan HargaPas by Universitas Terbuka Majene`
    ].join('\n');
  }

  // ---------- laporan ----------
  function renderReport(){
    compute();
    const { p, r, kanal, hargaToko, b, sat } = last;
    const tgl = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    const rows = p.bahan.filter(x => x.nama || Number(x.harga)).map(x => {
      return `<tr><td>${esc(x.nama || '-')}</td><td class="n">${fmtRp(Number(x.harga))}</td><td class="n">${fmtInput(x.isi)} ${esc(uLabel(x.satuanIsi))}</td><td class="n">${fmtInput(x.pakai)} ${esc(uLabel(x.satuanPakai || x.satuanIsi))}</td><td class="n">${fmtRp(H.biayaBahan(x))}</td></tr>`;
    }).join('');
    const per = p.mode === 'unit' ? 'per unit' : 'per batch';
    $('#report').innerHTML = (`
      <div class="kop"><div class="l"><img src="__ICON__" alt=""><div><b>HargaPas</b><span>by Universitas Terbuka Majene</span></div></div><div class="ut"><img src="__LOGO_UT__" alt="Logo Universitas Terbuka"></div></div>
      <div class="sure-strip kop-strip" aria-hidden="true"></div>
      <h1>Laporan HPP & Harga Jual</h1>
      <div class="meta">Produk: <b>${esc(p.nama || 'Tanpa nama')}</b> · Satuan: ${esc(sat)} · Cara isi: ${per}${p.mode === 'batch' ? ` (hasil ${fmtInput(p.hasilBatch)} ${esc(sat)}, gagal/susut ${fmtInput(p.susutPct) || 0}%)` : ''} · Tanggal: ${tgl}</div>
      <h2>Bahan baku (${per})</h2>
      <table><thead><tr><th>Bahan</th><th class="n">Harga beli</th><th class="n">Dibeli</th><th class="n">Dipakai</th><th class="n">Biaya</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Belum ada bahan</td></tr>'}<tr class="tot"><td colspan="4">Total bahan ${per}</td><td class="n">${fmtRp(r.bahanBatch)}</td></tr></tbody></table>
      <h2>Rincian HPP per ${esc(sat)}</h2>
      <table><tbody>
        <tr><td>Bahan baku</td><td class="n">${fmtRp(r.perUnit.bahan)}</td></tr>
        <tr><td>Tenaga kerja (${fmtRp(Number(p.upahJam))}/jam)</td><td class="n">${fmtRp(r.perUnit.tenagaKerja)}</td></tr>
        <tr><td>Kemasan</td><td class="n">${fmtRp(r.perUnit.kemasan)}</td></tr>
        <tr><td>Overhead (${fmtRp(r.overheadBulan)}/bulan ÷ ${fmtNum(r.produksiBulan)} ${esc(sat)})</td><td class="n">${fmtRp(r.perUnit.overhead)}</td></tr>
        <tr class="tot"><td>HPP per ${esc(sat)}</td><td class="n">${fmtRp(r.hpp)}</td></tr>
      </tbody></table>
      <h2>Harga jual (${p.harga.metode} ${fmtNum(Number(p.harga.persen)||0)}%)</h2>
      <table><thead><tr><th>Kanal</th><th class="n">Harga</th><th class="n">Diterima</th><th class="n">Laba/unit</th><th class="n">Margin</th></tr></thead>
        <tbody>${kanal.map(c => `<tr><td>${esc(c.nama)}</td><td class="n">${fmtRp(c.harga)}</td><td class="n">${fmtRp(c.diterima)}</td><td class="n">${fmtRp(c.laba)}</td><td class="n">${fmtPct(c.margin)}</td></tr>`).join('')}</tbody></table>
      <h2>Titik impas bulanan</h2>
      <table><tbody>
        <tr><td>Biaya tetap per bulan (sewa, penyusutan, lain-lain)</td><td class="n">${fmtRp(r.fc)}</td></tr>
        <tr><td>Biaya variabel per ${esc(sat)}</td><td class="n">${fmtRp(r.vc)}</td></tr>
        <tr><td>Harga toko${state.usaha.pph ? ' (sudah memperhitungkan PPh final 0,5%)' : ''}</td><td class="n">${fmtRp(hargaToko)}</td></tr>
        <tr class="tot"><td>Titik impas</td><td class="n">${b ? fmtNum(b.unitBulat) + ' ' + esc(sat) + ' (' + fmtRp(b.rupiah) + ')' : 'Harga belum menutup biaya variabel'}</td></tr>
      </tbody></table>
      <div class="foot">Dihitung dengan HargaPas versi ${VERSION} (metode full costing; titik impas dengan pemisahan biaya tetap dan variabel). Hasil bergantung pada data yang diisi pengguna. HargaPas dikembangkan oleh Universitas Terbuka Majene (Fajar Rakasiwi). Alat bantu perhitungan, bukan nasihat keuangan atau pajak.</div>`).replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>');
  }

  // ---------- harga bahan (library) ----------
  function renderLib(){
    const map = new Map();
    allBahanRows().forEach(({ p, b }) => { const k = norm(b.nama); if (!map.has(k)) map.set(k, { b, produk: new Set() }); map.get(k).produk.add(p.nama || 'Tanpa nama'); });
    const q = norm($('#libSearch').value);
    const items = Array.from(map.values()).sort((a, c) => a.b.nama.localeCompare(c.b.nama, 'id')).filter(it => !q || norm(it.b.nama).includes(q));
    $('#libEmpty').hidden = map.size > 0;
    $('#libBody').innerHTML = items.length ? items.map((it, i) => {
      const k = esc(norm(it.b.nama)), n = it.produk.size;
      return `<div class="libcard">
        <div class="lt"><b>${esc(it.b.nama)}</b><small>dipakai di ${n} produk</small></div>
        <div class="lf">
          <div class="field"><label for="lh${i}">Harga</label><div class="inp has-pre"><span class="pre">Rp</span><input id="lh${i}" class="num" data-lib="${k}" data-f="harga" type="text" inputmode="decimal" value="${esc(fmtInput(it.b.harga))}"></div></div>
          <div class="field"><label for="li${i}">Beli</label><input id="li${i}" class="num" data-lib="${k}" data-f="isi" type="text" inputmode="decimal" value="${esc(fmtInput(it.b.isi))}"></div>
          <div class="field"><label for="ls${i}">Satuan</label><select id="ls${i}" data-lib="${k}" data-f="satuanIsi">${unitOptions(it.b.satuanIsi)}</select></div>
        </div>
        <div class="hint" style="margin-top:6px">${esc(Array.from(it.produk).join(', '))}</div>
      </div>`;
    }).join('') : (map.size ? '<p class="hint">Tidak ada bahan dengan nama itu.</p>' : '');
  }

  // ---------- cadangan ----------
  function checkBackup(){
    const lb = state.lastBackup ? Date.parse(state.lastBackup) : null;
    const since = Date.now() - (lb || Date.parse(state.firstUse));
    const adaKas = state.kas && state.kas.trx.length > 0;
    const hasData = adaKas || state.products.some(p => p.bahan.some(b => Number(b.harga) > 0));
    const batas = adaKas ? 7 : 30, perlu = hasData && since > batas * 864e5;
    const hari = Math.floor(since / 864e5);
    const msg = (lb ? `Cadangan terakhir ${hari} hari lalu.` : 'Data belum pernah dicadangkan.') + ' Data hanya tersimpan di HP ini; bila HP hilang atau rusak, catatan ikut hilang.';
    $('#noteBackupHome').hidden = !perlu; $('#noteBackupHome .grow').textContent = msg;
    const nk = $('#noteBackupKeu'); if (nk) { nk.hidden = !perlu; nk.querySelector('.grow').textContent = msg; }
  }
  async function doBackup(){
    const json = JSON.stringify(state);
    if (embedded) {
      try { await navigator.clipboard.writeText(json); toast('Data cadangan disalin. Tempel ke catatan atau chat WhatsApp untuk disimpan.'); }
      catch(e) { toast('Gagal menyalin data'); return; }
    } else {
      const name = 'hargapas-cadangan-' + new Date().toISOString().slice(0,10) + '.json';
      try {
        const f = new File([JSON.stringify(state)], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: 'Cadangan HargaPas', text: 'Simpan file ini (mis. kirim ke WhatsApp sendiri atau Google Drive). Pulihkan lewat menu Cadangan & pemulihan data.' });
          state.lastBackup = new Date().toISOString(); saveNow(); checkBackup(); toast('Cadangan dibagikan. Simpan file-nya di tempat aman.');
          return;
        }
      } catch(e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type:'application/json' }));
      a.download = 'hargapas-cadangan-' + new Date().toISOString().slice(0,10) + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('File cadangan diunduh ke folder Download');
    }
    state.lastBackup = new Date().toISOString(); saveNow(); checkBackup();
  }
  function restore(text){
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.products) || !(data.products.length || (data.kas && Array.isArray(data.kas.trx)))) throw new Error('format');
    state = data; normKas(); state.usaha = { bagi: 'rata', pph: false, ...(state.usaha || {}) }; state.usaha.overhead = { ...emptyOH(), ...(state.usaha.overhead || {}) };
    if (!Array.isArray(state.penjualan)) state.penjualan = [];
    state.products.forEach(migrate);
    if (!state.products.find(p => p.id === state.activeId)) state.activeId = state.products[0] ? state.products[0].id : null;
    if (!state.firstUse) state.firstUse = new Date().toISOString();
    saveNow(); renderSelect(); if (state.products.length) { fillInputs(); compute(); } route();
    toast('Data dipulihkan: ' + state.products.length + ' produk, ' + state.kas.trx.length + ' catatan keuangan');
  }

  // ---------- tooltip ----------
  const TIPS = {
    hpp: ['Modal per barang (HPP)', 'Biaya untuk membuat satu barang: bahan + tenaga kerja + kemasan + bagian dari biaya bulanan. Harga jual harus di atas modal ini supaya untung. Istilah resminya HPP, harga pokok produksi.'],
    batch: ['Sekali produksi atau satu per satu', 'Sekali produksi: isi bahan untuk satu kali masak, misalnya satu adonan jadi 24 potong. Satu per satu: isi bahan untuk satu barang, misalnya satu tas. Kalau diganti, angka diubah otomatis.'],
    susut: ['Barang rusak / tidak laku', 'Bagian yang tidak bisa dijual: gosong, pecah, cacat. Contoh: dari 24 potong, 1 rusak, kira-kira 4%. Biayanya ditanggung barang yang laku. Istilahnya gagal atau susut.'],
    upah: ['Upah diri sendiri', 'Waktu Anda punya nilai. Kalau tidak dihitung, untung terlihat besar padahal sebagian adalah gaji Anda. Caranya: upah sehari yang wajar dibagi jam kerja sehari.'],
    tetapvar: ['Biaya tetap & tidak tetap', 'Biaya tetap tidak berubah walau produksi naik-turun, misalnya sewa dan alat. Biaya tidak tetap (variabel) bertambah kalau produksi bertambah, misalnya gas dan listrik.'],
    penyusutan: ['Penyusutan alat', 'Harga alat dibagi lama dipakai. Oven Rp3.000.000 yang dipakai 36 bulan berarti Rp83.333 per bulan. Dengan begitu, saat alat rusak Anda sudah menyisihkan uang untuk menggantinya.'],
    margin: ['Untung dari harga jual atau dari modal', 'Untung dari harga jual (margin): untung dibagi harga jual. Tambah dari modal (markup): untung dibagi modal. Modal Rp10.000 ditambah 30% jadi Rp13.000, tetapi untungnya hanya 23% dari harga jual.'],
    kanal: ['Tempat menjual', 'Tempat Anda menjual barang. Reseller biasanya dapat potongan harga. Marketplace dan ojek online memotong komisi, jadi harganya perlu lebih tinggi supaya untung tetap. Istilahnya kanal penjualan.'],
    bep: ['Batas balik modal (BEP)', 'Jumlah barang yang harus terjual sebulan supaya biaya tetap tertutup: tidak untung, tidak rugi. Penjualan di atas jumlah ini menjadi untung. Istilahnya titik impas atau BEP.'],
    bersama: ['Biaya bulanan dipakai bersama', 'Kalau gas, listrik, sewa, dan alat dipakai untuk beberapa produk, pilih "Dipakai bersama". Biaya diisi sekali untuk seluruh usaha, lalu dibagi ke setiap produk: rata, sesuai lama produksi, atau sesuai persen yang Anda atur. Dengan begitu modal tiap produk tidak terhitung terlalu tinggi.'],
    pph: ['PPh final UMKM 0,5%', 'Pajak penghasilan bagi UMKM orang pribadi dengan omzet sampai Rp4,8 miliar setahun: 0,5% dari omzet. Karena dihitung dari setiap penjualan, HargaPas menaikkan harga sedikit agar untung Anda tetap. Ketentuan pajak bisa berubah; tanyakan ke kantor pajak bila ragu.'],
    rencana: ['Rencana sebulan', 'Isi berapa barang yang ingin dijual sebulan untuk melihat perkiraan untung bersih (sudah dikurangi semua biaya). Atau isi untung yang Anda inginkan, lalu HargaPas menghitung berapa barang yang harus terjual.'],
    tampilan: ['Tampilan Sederhana atau Lengkap', 'Sederhana: langkah demi langkah, hanya modal, harga jual, dan untung. Lengkap: semua fitur, termasuk tempat menjual, cek harga, dan simulasi. Bisa diganti kapan saja.']
  };
  const pop = $('#pop'); let popFor = null;
  function showTip(btn){
    const t = TIPS[btn.dataset.tip]; if (!t) return;
    if (popFor === btn && !pop.hidden) { hideTip(); return; }
    pop.innerHTML = `<b>${esc(t[0])}</b>${esc(t[1])}` + (canSpeak ? `<div style="margin-top:8px"><button type="button" class="btn small" data-speak-tip="${esc(btn.dataset.tip)}" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.5)">Bacakan</button></div>` : ''); pop.hidden = false; popFor = btn;
    const r = btn.getBoundingClientRect(), w = Math.min(300, window.innerWidth - 24);
    pop.style.maxWidth = w + 'px';
    let left = Math.min(Math.max(12, r.left + r.width/2 - w/2), window.innerWidth - w - 12);
    pop.style.left = left + 'px';
    const ph = pop.offsetHeight;
    pop.style.top = (r.bottom + 8 + ph > window.innerHeight ? r.top - ph - 8 : r.bottom + 8) + 'px';
  }
  function hideTip(){ pop.hidden = true; popFor = null; }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.tip');
    if (t) { e.preventDefault(); e.stopPropagation(); showTip(t); return; }
    const sp = e.target.closest('[data-speak-tip]');
    if (sp) { const t = TIPS[sp.dataset.speakTip]; speak(t[0] + '. ' + t[1]); return; }
    if (!e.target.closest('#pop')) hideTip();
  }, true);
  window.addEventListener('scroll', hideTip, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideTip(); closeOverlays(); } });

  // ---------- overlays ----------
  function openOverlay(id){ $('#' + id).hidden = false; const f = $('#' + id + ' button.primary, #' + id + ' button'); if (f) f.focus(); }
  function closeOverlays(){ $$('.overlay').forEach(o => o.hidden = true); }
  let slide = 0;
  function showSlide(i){
    slide = i;
    $$('#onboard [data-slide]').forEach(s => s.hidden = Number(s.dataset.slide) !== i);
    $$('#onboard .dots i').forEach((d, j) => d.classList.toggle('on', j === i));
    $('#obNext').hidden = i === 2;
  }
  function startTour(){ showSlide(0); openOverlay('onboard'); }
  function endTour(){ $('#onboard').hidden = true; lsSet(OBKEY, '1'); }
  $('#obNext').addEventListener('click', () => { if (slide < 2) showSlide(slide + 1); });
  $$('[data-obui]').forEach(b => b.addEventListener('click', () => { setUi(b.dataset.obui); endTour(); if (state.products.length) { location.hash = '#hitung'; openStep(1); } else { location.hash = '#beranda'; setTimeout(() => openOverlay('tplDlg'), 80); } }));
  $('#obSkip').addEventListener('click', endTour);
  $$('[data-tour]').forEach(b => b.addEventListener('click', () => { closeOverlays(); startTour(); }));

  const TPL_ICON = {
    kosong: '<path d="M12 5v14M5 12h14"/>',
    kue: '<path d="M4 20h16M5 20v-6a2 2 0 012-2h10a2 2 0 012 2v6"/><path d="M5 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0M12 12V8M12 5.5v.01"/>',
    minuman: '<path d="M6 8h12l-1.5 12h-9z"/><path d="M5 8h14M10 8l1-5h3"/>',
    camilan: '<path d="M7 3h10l-1 3 1 15H7L8 6z"/><path d="M9 11h6M9 15h6"/>',
    konveksi: '<path d="M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8z"/>',
    kerajinan: '<path d="M4 10h16l-2 10H6z"/><path d="M8 10a4 4 0 018 0M9 14l.5 3M15 14l-.5 3"/>',
    abonayam: '<path d="M5 9h14l-1.2 10.5a1.5 1.5 0 01-1.5 1.5H7.7a1.5 1.5 0 01-1.5-1.5z"/><path d="M8 9V6a4 4 0 018 0v3M9 14c1 1 2 1 3 0s2-1 3 0"/>',
    abonikan: '<path d="M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z"/><circle cx="8" cy="11" r=".8"/>',
    tuing: '<path d="M3 12c3-3 7-4 11-2l2-4 1 5 4 1-4 2-1 4-2-4c-4 2-8 1-11-2z"/><circle cx="7" cy="11.5" r=".8"/>',
    bawanggoreng: '<path d="M12 3c3 3 6 6 6 10a6 6 0 01-12 0c0-4 3-7 6-10z"/><path d="M12 9v9M9 12l3 3 3-3"/>',
    boncabe: '<path d="M9 3h6v3H9z"/><path d="M8 6h8l1 3v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"/><path d="M10 13c1.5-1.5 3-1 4 1"/>'
  };
  const tplBtn = (t) => `<button type="button" data-tpl="${t.id}"${t.lokal ? ' class="lokal"' : ''}><span class="ti"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TPL_ICON[t.id] || ''}</svg></span><span><b>${esc(t.judul)}</b><span>${esc(t.ket)}</span></span></button>`;
  $('#tplGrid').innerHTML = '<div class="tpl-h">Produk khas Majene</div>' + TEMPLATES.filter(t => t.lokal).map(tplBtn).join('') + '<div class="tpl-h">Jenis usaha umum</div>' + TEMPLATES.filter(t => !t.lokal).map(tplBtn).join('');
  $('#tplGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tpl]'); if (!btn) return;
    const t = TEMPLATES.find(x => x.id === btn.dataset.tpl), p = blank();
    p.mode = t.mode; p.satuan = t.satuan;
    if (t.mode === 'unit') p.hasilBatch = 1;
    if (t.bahan.length) p.bahan = t.bahan.map(([nama, beli, pakai]) => {
      const lib = findLib(nama);
      if (lib) return { nama, harga: lib.harga, isi: lib.isi, satuanIsi: lib.satuanIsi, pakai: '', satuanPakai: H.faktor(pakai, lib.satuanIsi) !== null ? pakai : lib.satuanIsi };
      return { nama, harga:'', isi:'', satuanIsi: beli, pakai:'', satuanPakai: pakai };
    });
    p.touched = false;
    const u = state.usaha.overhead;
    if (state.products.some(x => x.ohMode === 'bersama') && Object.values(u).some(v => Number(v) > 0)) p.ohMode = 'bersama';
    state.products.push(p); state.activeId = p.id; openRows = new Set();
    closeOverlays(); if (location.hash !== '#hitung') { location.hash = '#hitung'; } renderSelect(); fillInputs(); compute(); save();
    $('#secBahan').open = true; $('#f_nama').focus();
    toast(t.id === 'kosong' ? 'Produk baru dibuat' : `Template ${t.judul} dipakai. Isi nama dan harganya.`);
  });
  $('#tplCancel').addEventListener('click', closeOverlays);
  $('#btnPaste').addEventListener('click', () => { $('#pasteText').value = ''; openOverlay('pasteDlg'); $('#pasteText').focus(); });
  $('#pasteCancel').addEventListener('click', closeOverlays);
  $('#pasteOk').addEventListener('click', () => { try { restore($('#pasteText').value.trim()); closeOverlays(); } catch(e) { toast('Teks tidak dikenali sebagai cadangan HargaPas'); } });
  $$('.overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) { if (o.id === 'onboard') endTour(); else o.hidden = true; } }));

  function toast(msg, action, fn){
    const t = $('#toast'); t.textContent = msg; t.classList.toggle('has-action', !!action);
    if (action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tact'; b.textContent = action; b.onclick = () => { t.classList.remove('show'); fn(); }; t.appendChild(b); }
    t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), action ? 7000 : 2800);
  }
  function confirmBox(title, text, yes, fn){
    $('#cfTitle').textContent = title; $('#cfText').textContent = text; $('#cfYes').textContent = yes;
    $('#cfYes').onclick = () => { closeOverlays(); fn(); };
    openOverlay('confirmDlg'); $('#cfNo').focus();
  }
  $('#cfNo').addEventListener('click', closeOverlays);

  // ---------- routing ----------
  const VIEWS = ['beranda', 'hitung', 'keuangan', 'lapkeu', 'bahan', 'lainnya', 'laporan', 'tentang', 'privasi', 'lembar', 'belajar'];
  function route(){
    if (location.hash.startsWith('#impor=')) { handleImport(location.hash.slice(7)); return; }
    let v = (location.hash || '#beranda').slice(1);
    if (!VIEWS.includes(v)) v = 'beranda';
    if ((v === 'hitung' || v === 'laporan') && !state.products.length) { history.replaceState(null, '', '#beranda'); v = 'beranda'; setTimeout(() => openOverlay('tplDlg'), 50); }
    $$('.overlay').forEach(o => { if (o.id !== 'onboard') o.hidden = true; });
    $$('[data-page]').forEach(m => m.hidden = m.dataset.page !== v);
    const navOf = { lapkeu: 'keuangan', laporan: 'lainnya', tentang: 'lainnya', privasi: 'lainnya', lembar: 'lainnya', belajar: 'lainnya' };
    $$('nav.tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.view === (navOf[v] || v) ? 'page' : 'false'));
    document.body.classList.toggle('view-other', v !== 'hitung');
    if (v === 'beranda') renderBeranda();
    if (v === 'bahan') renderLib();
    if (v === 'laporan') renderReport();
    if (v === 'hitung') { renderSelect(); fillInputs(); compute(); }
    if (v === 'keuangan') renderKeuangan();
    if (v === 'lapkeu') renderLapKeu();
    hideTip();
    if (v !== 'hitung') window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- events ----------
  document.addEventListener('input', (ev) => {
    const el = ev.target, p = cur();
    const val = el.classList.contains('num') ? onNumInput(el) : el.value;
    if (p && el.closest('#view-hitung') && (el.dataset.k || el.dataset.b !== undefined)) p.touched = true;
    if (el.dataset.k) {
      setPath(ohTarget(p, el.dataset.k), el.dataset.k, el.tagName === 'SELECT' ? Number(val) : val);
      if (el.dataset.k === 'nama') renderSelect();
    } else if (el.dataset.b !== undefined) {
      const b = p.bahan[Number(el.dataset.b)];
      b[el.dataset.f] = val;
      const i = el.dataset.b;
      if (el.dataset.f === 'satuanIsi') {
        if (H.faktor(b.satuanPakai, b.satuanIsi) === null) b.satuanPakai = b.satuanIsi;
        $('#bu' + i).innerHTML = unitOptions(b.satuanPakai, b.satuanIsi);
      }
      if (['harga', 'isi', 'satuanIsi'].includes(el.dataset.f)) propagate(b);
      if (el.dataset.f === 'nama') {
        const lib = findLib(val, b);
        if (lib && (b.harga === '' || b.harga === undefined)) {
          b.harga = lib.harga; b.isi = lib.isi; b.satuanIsi = lib.satuanIsi;
          if (H.faktor(b.satuanPakai, b.satuanIsi) === null) b.satuanPakai = b.satuanIsi;
          $('#bh' + i).value = fmtInput(b.harga); $('#bi' + i).value = fmtInput(b.isi);
          $('#bs' + i).innerHTML = unitOptions(b.satuanIsi); $('#bu' + i).innerHTML = unitOptions(b.satuanPakai, b.satuanIsi);
          toast(`Harga ${lib.nama} diambil dari produk lain`);
        }
      }
    } else if (el.dataset.kn !== undefined) {
      const k = p.harga.kanal[Number(el.dataset.kn)];
      k[el.dataset.kf] = val;
      if (el.dataset.kf === 'tipe') { renderKanalEditor(); }
    } else if (el.dataset.lib !== undefined) {
      allBahanRows().forEach(({ b }) => { if (norm(b.nama) === el.dataset.lib) { b[el.dataset.f] = val; if (H.faktor(b.satuanPakai, b.satuanIsi) === null) b.satuanPakai = b.satuanIsi; } });
      save(); return;
    } else if (el.id !== 'f_sim') return;
    compute(); save();
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.tagName === 'SELECT' && (el.dataset.k || el.dataset.kn !== undefined)) el.dispatchEvent(new Event('input', { bubbles: true }));
    if (el.dataset.b !== undefined && el.dataset.f === 'nama') renderDatalist();
    if (el.dataset.lib !== undefined) renderLib();
  });
  $('#bahanList').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-del]'); if (!btn) return;
    const p = cur(); p.bahan.splice(Number(btn.dataset.del), 1);
    if (!p.bahan.length) p.bahan.push(emptyBahan());
    openRows = new Set(); renderBahan(); compute(); save();
  });
  $('#btnAddBahan').addEventListener('click', () => {
    cur().bahan.push(emptyBahan()); openRows.add(cur().bahan.length - 1); renderBahan(); compute(); save();
    const el = $('#bn' + (cur().bahan.length - 1)); if (el) el.focus();
  });
  $('#kanalList').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-kdel]'); if (!btn) return;
    cur().harga.kanal.splice(Number(btn.dataset.kdel), 1); renderKanalEditor(); compute(); save();
  });
  $('#btnAddKanal').addEventListener('click', () => {
    cur().harga.kanal.push({ id: uid(), nama: '', tipe: 'komisi', persen: '', biaya: '' });
    renderKanalEditor(); compute(); save();
    const el = $('#kn' + (cur().harga.kanal.length - 1)); if (el) el.focus();
  });
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
    const p = cur(); if (p.mode === b.dataset.mode) return;
    switchMode(p, b.dataset.mode); fillInputs(); compute(); save();
    toast(b.dataset.mode === 'unit' ? 'Mode per unit: angka sudah dikonversi, HPP tetap sama' : 'Mode per batch aktif');
  }));
  $$('[data-metode]').forEach(b => b.addEventListener('click', () => {
    cur().harga.metode = b.dataset.metode;
    $$('[data-metode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    compute(); save();
  }));
  $('#prodSel').addEventListener('change', (e) => { state.activeId = e.target.value; openRows = new Set(); fillInputs(); compute(); save(); });
  $('#btnNew').addEventListener('click', () => openOverlay('tplDlg'));
  $('#btnMulaiSaya').addEventListener('click', () => openOverlay('tplDlg'));
  $('#btnDel').addEventListener('click', () => {
    const p = cur();
    confirmBox('Hapus produk?', `"${p.nama || 'Produk tanpa nama'}" akan dihapus dari HP ini.`, 'Hapus', () => {
      const idx = state.products.findIndex(x => x.id === p.id), copy = JSON.parse(JSON.stringify(p));
      state.products.splice(idx, 1);
      state.activeId = state.products.length ? state.products[Math.max(0, idx - 1)].id : null;
      openRows = new Set(); saveNow();
      if (state.products.length) { renderSelect(); fillInputs(); compute(); } else location.hash = '#beranda';
      toast('Produk dihapus', 'Batalkan', () => {
        state.products.splice(Math.min(idx, state.products.length), 0, copy); state.activeId = copy.id;
        openRows = new Set(); saveNow(); toast('Produk dikembalikan');
        if (location.hash === '#hitung') { renderSelect(); fillInputs(); compute(); } else if (location.hash === '#beranda' || !location.hash) renderBeranda();
      });
    });
  });
  $('#btnCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(summaryText()); toast('Ringkasan disalin'); } catch(e) { toast('Gagal menyalin; coba tombol WhatsApp'); } });
  $('#btnExport').addEventListener('click', doBackup);
  $$('[data-backup]').forEach(b => b.addEventListener('click', doBackup));
  $('#fileImport').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { restore(await f.text()); } catch(err) { toast('File tidak dikenali sebagai cadangan HargaPas'); }
    e.target.value = '';
  });
  $('#btnPrint').addEventListener('click', () => printWithGuide(renderReport));

  // ---------- tampilan sederhana / lengkap ----------
  function setUi(mode){
    state.ui = mode === 'lengkap' ? 'lengkap' : 'sederhana';
    document.body.classList.toggle('ui-sederhana', state.ui === 'sederhana');
    document.body.classList.toggle('ui-lengkap', state.ui === 'lengkap');
    $$('[data-ui]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ui === state.ui)));
    saveNow(); if (last) compute();
  }
  $$('[data-ui]').forEach(b => b.addEventListener('click', () => { setUi(b.dataset.ui); toast(b.dataset.ui === 'sederhana' ? 'Tampilan sederhana: hanya yang penting' : 'Tampilan lengkap: semua fitur'); }));
  function openStep(n){
    $$('.step-card').forEach(d => { d.open = Number(d.dataset.step) === n; });
    const d = $(`.step-card[data-step="${n}"]`);
    if (d) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  $$('.step-card').forEach(d => d.addEventListener('toggle', () => {
    if (d.open && state.ui === 'sederhana') $$('.step-card').forEach(o => { if (o !== d && o.open) o.open = false; });
  }));
  $$('[data-next]').forEach(b => b.addEventListener('click', () => openStep(Number(b.dataset.next))));
  $('#btnLihatHasil').addEventListener('click', () => {
    const k = $('#kesimpulan');
    if (window.innerWidth < 1024) k.scrollIntoView({ behavior: 'smooth', block: 'start' });
    k.focus({ preventScroll: true }); k.animate([{ boxShadow: '0 0 0 4px #F9D800' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 1400 });
  });

  // ---------- ukuran huruf ----------
  function setTs(v){
    const z = ['1', '1.12', '1.25'].includes(String(v)) ? String(v) : '1';
    document.documentElement.style.setProperty('--z', z);
    $$('[data-ts]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ts === z)));
    lsSet('hargapas.ts', z);
  }
  $$('[data-ts]').forEach(b => b.addEventListener('click', () => setTs(b.dataset.ts)));
  const mqDark = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function setTheme(v){
    const t = ['auto', 'light', 'dark'].includes(v) ? v : 'auto';
    const dark = t === 'dark' || (t === 'auto' && mqDark && mqDark.matches);
    document.body.classList.toggle('dark', dark);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#0B1220' : '#1E4094';
    $$('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === t)));
    lsSet('hargapas.tema', t);
  }
  $$('[data-theme]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.theme)));
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', () => setTheme(lsGet('hargapas.tema') || 'auto'));
  setTheme(lsGet('hargapas.tema') || 'auto');

  // ---------- bacakan ----------
  const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  function speak(text){
    if (!canSpeak) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/Rp([\d.]+)/g, (m, n) => n.replace(/\./g, '') + ' rupiah'));
      u.lang = 'id-ID'; u.rate = 0.95;
      const v = speechSynthesis.getVoices().find(x => /^id/i.test(x.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch(e) { toast('Suara tidak tersedia di perangkat ini'); }
  }
  if (!canSpeak) $('#btnBacakan').hidden = true;
  $('#btnBacakan').addEventListener('click', () => speak($('#kesMain').textContent + ' ' + $('#kesSub').textContent));

  // ---------- bantu perkiraan gas & listrik ----------
  const pv = (id) => Number(parseInput($('#' + id).value)) || 0;
  function helperOut(){
    const g = pv('hg_n') * pv('hg_p'), l = pv('hl_t') * pv('hl_p') / 100;
    $('#hg_out').textContent = g ? '= ' + fmtRp(g) + ' per bulan' : '';
    $('#hl_out').textContent = l ? '= ' + fmtRp(l) + ' per bulan' : '';
    return { g, l };
  }
  ['hg_n','hg_p','hl_t','hl_p'].forEach(id => $('#' + id).addEventListener('input', helperOut));
  $('#hg_ok').addEventListener('click', () => { const { g } = helperOut(); if (!g) return toast('Isi jumlah tabung dan harganya dulu'); cur().overhead.gas = Math.round(g); $('#f_gas').value = fmtInput(Math.round(g)); compute(); save(); toast('Biaya gas diisi ' + fmtRp(g)); });
  $('#hl_ok').addEventListener('click', () => { const { l } = helperOut(); if (!l) return toast('Isi tagihan listrik dan bagian untuk usaha dulu'); cur().overhead.listrik = Math.round(l); $('#f_listrik').value = fmtInput(Math.round(l)); compute(); save(); toast('Biaya listrik diisi ' + fmtRp(l)); });

  // ---------- kirim produk ke HP lain ----------
  const APP_URL = 'https://rakasiwifajar.github.io/hargapas/';
  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function productLink(){
    const p = JSON.parse(JSON.stringify(cur())); delete p.id; p.isContoh = false;
    const base = (!embedded && /^https?:/.test(location.protocol)) ? location.origin + location.pathname : APP_URL;
    return base + '#impor=' + b64e(JSON.stringify(p));
  }
  function updateKirimLink(){
    const p = cur();
    $('#btnKirimProduk').href = 'https://wa.me/?text=' + encodeURIComponent(`Perhitungan HPP "${p.nama || 'produk'}" dari HargaPas by Universitas Terbuka Majene. Buka tautan ini di HP Anda untuk menyimpannya:\n` + productLink());
  }
  function handleImport(code){
    let p;
    try { p = JSON.parse(b64d(code)); if (!p || !Array.isArray(p.bahan)) throw 0; } catch(e) { history.replaceState(null, '', '#hitung'); route(); toast('Tautan produk tidak bisa dibaca'); return; }
    history.replaceState(null, '', '#hitung'); route();
    confirmBox('Tambahkan produk?', `Anda menerima perhitungan "${p.nama || 'produk'}". Tambahkan ke HargaPas di HP ini?`, 'Tambahkan', () => {
      p.id = uid(); p.isContoh = false; migrate(p);
      state.products.push(p); state.activeId = p.id; openRows = new Set();
      renderSelect(); fillInputs(); compute(); save(); toast('Produk ditambahkan');
    });
  }
  $('#btnPrintLembar').addEventListener('click', () => window.print());

  // ---------- animasi angka ----------
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animNum(el, to){
    if (!el) return;
    const from = el._v;
    el._v = to;
    if (to === null || !Number.isFinite(to) || from === undefined || from === null || !Number.isFinite(from) || from === to || reduceMotion) { el.textContent = fmtRp(to); return; }
    const t0 = performance.now(), d = 350;
    cancelAnimationFrame(el._raf);
    const step = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmtRp(from + (to - from) * e); if (k < 1) el._raf = requestAnimationFrame(step); };
    el._raf = requestAnimationFrame(step);
  }
  function bumpIf(el, v){ if (el._v !== undefined && el._v !== v && !reduceMotion) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } el._v = v; }

  // ---------- beranda ----------
  function summaryOf(p){
    const r = H.hitungHPP(toEngine(p));
    const h = { ...p.harga, metode: state.ui === 'sederhana' ? 'margin' : p.harga.metode, pajak: state.usaha.pph ? 0.5 : 0 };
    const toko = H.hargaSemuaKanal(r.hpp, h, h.kanal).find(c => c.tipe === 'langsung');
    const harga = toko && toko.harga !== null ? toko.harga : null;
    const m = harga && r.hpp > 0 ? toko.margin : null;
    return { r, harga, m, laba: harga ? toko.laba : null, k: toko ? toko.potongan : 0, f: toko ? toko.biayaUnit : 0, level: m === null ? '' : m < 0 ? 'bad' : m < 0.15 ? 'warn' : 'good' };
  }
  function renderBeranda(){
    const g = $('#prodGrid'), list = state.products;
    $('#emptyHome').hidden = list.length > 0;
    $('#btnLihatContoh').hidden = list.some(x => x.isContoh);
    $('#prodCount').textContent = list.length ? list.length + ' produk' : '';
    g.innerHTML = list.map(p => {
      const s = summaryOf(p), sat = p.satuan || 'unit';
      const ok = s.r.hpp > 0;
      const tag = p.isContoh ? 'Contoh' : !ok ? 'Belum lengkap' : s.level === 'good' ? 'Untung sehat' : s.level === 'warn' ? 'Untung tipis' : 'Rugi';
      const lv = p.isContoh ? 'demo' : !ok ? 'todo' : s.level;
      const steps = [p.bahan.some(b => Number(b.harga) > 0 && Number(b.pakai) > 0), Number(p.upahJam) > 0 || Number(p.jamBatch) > 0 || Number(p.menitUnit) > 0, p.mode === 'unit' || Number(p.hasilBatch) > 0, Number(p.batchBulan) > 0];
      const done = steps.filter(Boolean).length;
      const nama = p.nama || 'Produk tanpa nama', ini = (p.nama || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
      return `<a class="pcard ${lv}" href="#hitung" data-open="${p.id}">
        <div class="pt"><span class="pav" aria-hidden="true">${esc(ini || '?')}</span><div class="pti"><div class="pn">${esc(nama)}</div><div class="ps">${p.mode === 'unit' ? 'Satu per satu' : 'Sekali produksi'} · per ${esc(sat.toLowerCase())}</div></div><span class="tag">${tag}</span></div>
        ${ok ? `<div class="pv"><div><span>Modal / ${esc(sat.toLowerCase())}</span><b>${fmtRp(s.r.hpp)}</b></div><div><span>Harga jual</span><b>${fmtRp(s.harga)}</b></div><div><span>Untung / ${esc(sat.toLowerCase())}</span><b>${s.harga ? fmtRp(s.laba) : '—'}</b></div></div>`
          : `<div class="pprog"><div class="pbar2"><i style="width:${Math.max(6, done / 4 * 100)}%"></i></div><div class="pprog-l"><span>${done} dari 4 langkah terisi</span><span class="pgo">Lanjutkan<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span></div></div>`}
      </a>`;
    }).join('');
    checkBackup(); renderUsaha();
  }
  $('#prodGrid').addEventListener('click', (e) => {
    const c = e.target.closest('[data-open]'); if (!c) return;
    state.activeId = c.dataset.open; openRows = new Set(); saveNow();
  });
  $('#btnBerandaBaru').addEventListener('click', () => openOverlay('tplDlg'));
  $$('[data-qa-trx]').forEach(b => b.addEventListener('click', () => { const j = b.dataset.qaTrx; location.hash = '#keuangan'; setTimeout(() => openTrx(j), 60); }));
  const TIPS_BAN = [
    ['Catat setiap hari, walau sedikit', 'Laporan dipercaya bank bila catatannya rutin 3–6 bulan.'],
    ['Pisahkan uang usaha dan uang dapur', 'Ambil "gaji" untuk diri sendiri dan catat sebagai Ambil untuk pribadi.'],
    ['Harga bahan naik? Hitung ulang', 'Perbarui harga di menu Harga bahan, semua produk ikut terhitung ulang.'],
    ['Jangan lupa upah sendiri', 'Tenaga Anda juga biaya. Masukkan upah per jam agar harga tidak kemurahan.'],
    ['Cadangkan data sepekan sekali', 'Data hanya di HP ini. Kirim file cadangan ke WhatsApp atau Drive Anda.'],
  ];
  (function(){ const d = Math.floor(Date.now() / 864e5) % TIPS_BAN.length; $('#tipT').textContent = TIPS_BAN[d][0]; $('#tipS').textContent = TIPS_BAN[d][1]; })();
  $('#btnLihatContoh').addEventListener('click', () => {
    let p = state.products.find(x => x.isContoh);
    if (!p) { p = contoh(); state.products.push(p); }
    state.activeId = p.id; openRows = new Set(); saveNow(); location.hash = '#hitung';
  });
  $('#libSearch').addEventListener('input', renderLib);
  $('#btnDataMenu').addEventListener('click', () => { const d = $('#dataSec'); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' }); });

  // ---------- pengaturan ----------
  const openSettings = () => openOverlay('settingsDlg');
  $('#btnSettings').addEventListener('click', openSettings);
  $$('[data-open-settings]').forEach(b => b.addEventListener('click', openSettings));
  $('#setClose').addEventListener('click', closeOverlays);

  // ---------- kartu harga (gambar) ----------
  let kartuBlob = null;
  const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function rr(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  async function buildKartu(){
    compute();
    const { p, r, hargaToko, b, sat } = last;
    const W = 1080, Hh = 1350, c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const x = c.getContext('2d');
    try { await Promise.race([document.fonts.load('800 40px "Plus Jakarta Sans"'), new Promise(r => setTimeout(r, 700))]); } catch(e) {}
    const F = '"Plus Jakarta Sans", system-ui, sans-serif';
    const [icon, ut, sure] = await Promise.all([loadImg('__ICON__'), loadImg('__LOGO_UT__'), loadImg('__SURE__')]);
    x.fillStyle = '#F3F5F9'; x.fillRect(0, 0, W, Hh);
    // kepala bermotif sure'
    x.fillStyle = '#1E4094'; x.fillRect(0, 0, W, 330);
    if (sure) { x.save(); x.globalAlpha = 0.9; const pat = x.createPattern(sure, 'repeat'); x.fillStyle = pat; x.setTransform(1.5, 0, 0, 1.5, 0, 0); x.fillRect(0, 0, W / 1.5, 330 / 1.5); x.restore(); }
    const grd = x.createLinearGradient(0, 0, W, 0); grd.addColorStop(0, 'rgba(21,46,107,.96)'); grd.addColorStop(1, 'rgba(30,64,148,.55)');
    x.fillStyle = grd; x.fillRect(0, 0, W, 330);
    x.fillStyle = '#F9D800'; x.fillRect(0, 330, W, 10);
    if (icon) x.drawImage(icon, 64, 64, 120, 120);
    x.fillStyle = '#fff'; x.font = `800 64px ${F}`; x.fillText('HargaPas', 210, 128);
    x.fillStyle = '#F9D800'; x.font = `700 32px ${F}`; x.fillText('by Universitas Terbuka Majene', 212, 174);
    if (ut) { x.fillStyle = '#fff'; rr(x, W - 64 - 170, 60, 170, 138, 18); x.fill(); const s = Math.min(150 / ut.width, 118 / ut.height); x.drawImage(ut, W - 64 - 170 + (170 - ut.width * s) / 2, 60 + (138 - ut.height * s) / 2, ut.width * s, ut.height * s); }
    x.fillStyle = '#D7E2F8'; x.font = `600 30px ${F}`; x.fillText('Kartu harga produk', 64, 270);
    // nama produk
    x.fillStyle = '#141B2D'; x.font = `800 60px ${F}`;
    let nama = p.nama || 'Produk'; while (x.measureText(nama).width > W - 128 && nama.length > 4) nama = nama.slice(0, -2) + '…';
    x.fillText(nama, 64, 450);
    // harga besar
    x.fillStyle = '#fff'; rr(x, 64, 500, W - 128, 330, 28); x.fill();
    x.strokeStyle = '#DCE2EC'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#545D70'; x.font = `700 34px ${F}`; x.fillText('Harga jual', 108, 575);
    x.fillStyle = '#152E6B'; x.font = `800 150px ${F}`; x.fillText(fmtRp(hargaToko), 100, 735);
    x.fillStyle = '#545D70'; x.font = `600 34px ${F}`; x.fillText('per ' + sat, 108, 795);
    // modal & untung
    const box = (bx, label, val, color) => { x.fillStyle = '#fff'; rr(x, bx, 870, (W - 128 - 24) / 2, 190, 24); x.fill(); x.strokeStyle = '#DCE2EC'; x.stroke(); x.fillStyle = '#545D70'; x.font = `700 30px ${F}`; x.fillText(label, bx + 36, 935); x.fillStyle = color; x.font = `800 64px ${F}`; x.fillText(val, bx + 32, 1018); };
    box(64, 'Modal per ' + sat, fmtRp(r.hpp), '#152E6B');
    box(64 + (W - 128 + 24) / 2, 'Untung per ' + sat, fmtRp(hargaToko - r.hpp), '#1D6B3E');
    x.fillStyle = '#2F374A'; x.font = `600 32px ${F}`;
    x.fillText(b && b.unitBulat > 0 ? `Balik modal: jual minimal ${fmtNum(b.unitBulat)} ${sat} sebulan` : ' ', 64, 1125);
    // kaki
    x.fillStyle = '#1E4094'; x.fillRect(0, Hh - 130, W, 130);
    if (sure) { x.save(); x.globalAlpha = 0.5; x.fillStyle = x.createPattern(sure, 'repeat'); x.fillRect(0, Hh - 130, W, 130); x.restore(); }
    x.fillStyle = 'rgba(21,46,107,.85)'; x.fillRect(0, Hh - 130, W, 130);
    x.fillStyle = '#fff'; x.font = `700 30px ${F}`; x.fillText('Dihitung dengan HargaPas · gratis untuk UKM', 64, Hh - 72);
    x.fillStyle = '#D7E2F8'; x.font = `500 26px ${F}`; x.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · rakasiwifajar.github.io/hargapas', 64, Hh - 34);
    return new Promise((ok) => c.toBlob((bl) => ok({ blob: bl, url: c.toDataURL('image/png') }), 'image/png'));
  }
  $('#btnKartu').addEventListener('click', async () => {
    if (!last || !(last.r.hpp > 0) || !last.hargaToko) return toast('Lengkapi perhitungan dulu');
    const { blob, url } = await buildKartu(); kartuBlob = blob;
    $('#kartuImg').src = url;
    const canShare = !embedded && navigator.canShare && navigator.canShare({ files: [new File([blob], 'kartu.png', { type: 'image/png' })] });
    $('#kartuShare').hidden = embedded;
    $('#kartuShare').textContent = canShare ? 'Bagikan' : 'Unduh gambar';
    openOverlay('kartuDlg');
  });
  $('#kartuClose').addEventListener('click', closeOverlays);
  $('#kartuShare').addEventListener('click', async () => {
    if (!kartuBlob) return;
    const name = 'kartu-harga-' + (cur().nama || 'produk').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
    const file = new File([kartuBlob], name, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Kartu harga ' + (cur().nama || ''), text: 'Dihitung dengan HargaPas by Universitas Terbuka Majene' }); return; }
    } catch(e) { if (e && e.name === 'AbortError') return; }
    const a2 = document.createElement('a'); a2.href = URL.createObjectURL(kartuBlob); a2.download = name; document.body.appendChild(a2); a2.click(); a2.remove();
    toast('Gambar kartu harga diunduh');
  });

  // ---------- layar pembuka ----------
  function hideSplash(){
    const s = $('#splash'); if (!s) return;
    const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    const first = !sessionStorage.getItem('hargapas.splash');
    try { sessionStorage.setItem('hargapas.splash', '1'); } catch(e) {}
    if (!(standalone || first) || reduceMotion) { s.remove(); return; }
    setTimeout(() => { s.classList.add('hide'); setTimeout(() => s.remove(), 500); }, 900);
  }

  // ---------- biaya bersama & PPh ----------
  function applyOh(){
    const p = cur(); if (!p) return;
    document.body.classList.toggle('oh-bersama', p.ohMode === 'bersama');
    $$('[data-oh]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.oh === p.ohMode)));
    $('#f_bagi').value = state.usaha.bagi;
  }
  $$('[data-oh]').forEach(b => b.addEventListener('click', () => {
    const p = cur(); if (!p || p.ohMode === b.dataset.oh) return;
    if (b.dataset.oh === 'bersama') {
      const u = state.usaha.overhead;
      if (!Object.values(u).some(v => Number(v) > 0)) { Object.keys(u).forEach(k => { u[k] = p.overhead[k]; }); toast('Biaya bulanan produk ini dijadikan biaya usaha bersama'); }
      else toast('Memakai biaya bulanan usaha yang sudah ada');
    }
    p.ohMode = b.dataset.oh; p.touched = true; fillInputs(); compute(); save();
  }));
  $('#f_bagi').addEventListener('change', (e) => { state.usaha.bagi = e.target.value; compute(); save(); });
  $('#f_pph').addEventListener('change', (e) => { state.usaha.pph = e.target.checked; compute(); save(); toast(e.target.checked ? 'PPh final 0,5% ikut diperhitungkan' : 'PPh final tidak diperhitungkan'); });

  // ---------- catatan penjualan & ringkasan bulan ini ----------
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  function terjualProduk(pid, bln){
    const a = state.penjualan.filter(x => x.pid === pid && x.tgl.startsWith(bln)).reduce((t, x) => t + (Number(x.qty) || 0), 0);
    const b = state.kas.trx.filter(t => t.items && t.tgl.startsWith(bln)).reduce((t, x) => t + x.items.filter(i => i.pid === pid).reduce((s, i) => s + (Number(i.qty) || 0), 0), 0);
    return a + b;
  }
  function ringkas7(){
    const d = (n) => { const x = new Date(today() + 'T00:00:00'); x.setDate(x.getDate() - n); return new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
    const sum = (from, to, j) => state.kas.trx.filter(t => t.jenis === j && t.tgl > from && t.tgl <= to && ['jual', 'lain'].includes(t.kat)).reduce((s, t) => s + Number(t.nominal), 0);
    const ini = sum(d(7), today(), 'masuk'), lalu = sum(d(14), d(7), 'masuk');
    return { ini, lalu, naik: lalu > 0 ? (ini - lalu) / lalu : null };
  }
  function renderUsaha(){
    const card = $('#usahaCard'); const list = state.products.filter(p => !p.isContoh);
    const bln = today().slice(0, 7);
    const wd = $('#wDate'); if (wd) { const h = new Date().getHours(); wd.textContent = (h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam') + ' · ' + new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    const pakaiKas = state.kas.trx.some(t => t.tgl.startsWith(bln));
    card.hidden = !list.length && !pakaiKas;
    $('#bulanNama').textContent = new Date(bln + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (pakaiKas) {
      const L = H.laporanBulan(bukuEngine(), bln);
      const masuk = L ? H.KATEGORI.masuk.reduce((s, c) => s + L.k[c.id], 0) : 0, keluar = L ? H.KATEGORI.keluar.reduce((s, c) => s + L.k[c.id], 0) : 0, laba = L ? L.labaRugi.laba : 0;
      $('#outUsaha').innerHTML = `<div class="box"><div class="lbl2">Uang masuk</div><div class="val" style="color:var(--good)">${fmtRp(masuk)}</div></div>
        <div class="box"><div class="lbl2">Uang keluar</div><div class="val">${fmtRp(keluar)}</div></div>
        <div class="box"><div class="lbl2">Untung bersih</div><div class="val" style="color:${laba < 0 ? 'var(--bad)' : 'var(--good)'}">${fmtRp(laba)}</div></div>`;
      const lastT = state.kas.trx.reduce((m, t) => (t.t || 0) > m ? t.t : m, 0), hari = lastT ? Math.floor((Date.now() - lastT) / 864e5) : 0;
      const w = ringkas7();
      $('#usahaNote').textContent = `Sisa uang usaha ${fmtRp(L ? L.arusKas.kasAkhir : 0)}.` + (w.ini ? ` Penjualan 7 hari terakhir ${fmtRp(w.ini)}${w.naik !== null ? ` (${w.naik >= 0 ? 'naik' : 'turun'} ${fmtPct(Math.abs(w.naik))} dari pekan sebelumnya)` : ''}.` : '') + (hari >= 3 ? ` Terakhir mencatat ${hari} hari lalu; jangan lupa catat transaksi hari ini.` : '');
      return;
    }
    if (!list.length) return;
    let terjual = 0, omzet = 0, kontrib = 0, fc = 0, rencanaUntung = 0, adaRencana = false;
    list.forEach(p => {
      const s = summaryOf(p); if (!s.harga) return;
      const sold = terjualProduk(p.id, bln);
      terjual += sold; omzet += sold * s.harga; kontrib += sold * H.kontribusiUnit(s.harga, s.r.vc, s.k, s.f); fc += s.r.fc;
      if (Number(p.rencana.unit) > 0) { adaRencana = true; rencanaUntung += H.proyeksi(s.r.fc, s.r.vc, s.harga, p.rencana.unit, s.k, s.f).untung; }
    });
    const untung = kontrib - fc;
    $('#outUsaha').innerHTML = `<div class="box"><div class="lbl2">Terjual</div><div class="val">${fmtNum(terjual)}</div></div>
      <div class="box"><div class="lbl2">Omzet</div><div class="val">${fmtRp(omzet)}</div></div>
      <div class="box"><div class="lbl2">Untung bersih <span class="term">(perkiraan)</span></div><div class="val" style="color:${terjual ? (untung < 0 ? 'var(--bad)' : 'var(--good)') : 'inherit'}">${terjual ? fmtRp(untung) : '—'}</div></div>`;
    $('#usahaNote').textContent = terjual
      ? `Untung dihitung dari penjualan tercatat dikurangi biaya tetap sebulan ${fmtRp(fc)}.` + (adaRencana ? ` Rencana bulan ini: untung ${fmtRp(rencanaUntung)}.` : '')
      : 'Catat penjualan lewat tombol Uang masuk untuk melihat untung sebenarnya bulan ini.' + (adaRencana ? ` Rencana: untung ${fmtRp(rencanaUntung)}.` : '');
  }
  function openJual(){
    const list = state.products.filter(p => !p.isContoh);
    if (!list.length) return toast('Buat produk dulu');
    const tgl = $('#jualTgl'); tgl.value = today(); tgl.max = today();
    const fill = () => {
      $('#jualList').innerHTML = list.map(p => {
        const rec = state.penjualan.find(x => x.pid === p.id && x.tgl === tgl.value);
        return `<div class="jrow"><div><b>${esc(p.nama || 'Produk tanpa nama')}</b><small>per ${esc(p.satuan || 'unit')}</small></div><div><label class="sr" for="jq_${p.id}">Jumlah ${esc(p.nama)}</label><input id="jq_${p.id}" class="num" data-jual="${p.id}" type="text" inputmode="decimal" placeholder="0" value="${rec ? esc(fmtInput(rec.qty)) : ''}"></div></div>`;
      }).join('');
    };
    tgl.onchange = fill; fill(); openOverlay('jualDlg');
  }
  $('#jualBatal').addEventListener('click', closeOverlays);
  $('#jualSimpan').addEventListener('click', () => {
    const tgl = $('#jualTgl').value || today(); let n = 0;
    $$('[data-jual]').forEach(el => {
      const pid = el.dataset.jual, q = Number(parseInput(el.value)) || 0;
      state.penjualan = state.penjualan.filter(x => !(x.pid === pid && x.tgl === tgl));
      if (q > 0) { const s = summaryOf(state.products.find(p => p.id === pid)); state.penjualan.push({ tgl, pid, qty: q, harga: s.harga }); n += q; }
    });
    closeOverlays(); saveNow(); renderUsaha(); toast(n ? `Tersimpan: ${fmtNum(n)} terjual pada ${new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}` : 'Catatan tanggal itu dikosongkan');
  });

  // ================= KEUANGAN =================
  const BLN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const namaBulan = (b) => { const [y, m] = b.split('-').map(Number); return BLN[m - 1] + ' ' + y; };
  const blnPendek = (b) => { const [y, m] = b.split('-').map(Number); return BLN[m - 1].slice(0, 3) + ' ' + String(y).slice(2); };
  const akhirBulan = (b) => { const [y, m] = b.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const tglPanjang = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const KAT_ALL = {}; ['masuk', 'keluar'].forEach(j => H.KATEGORI[j].forEach(c => KAT_ALL[j + ':' + c.id] = c));
  const KAT_INFO = {
    jual: 'Uang dari pembeli, termasuk penjualan lewat reseller dan marketplace.',
    lain: 'Pemasukan di luar penjualan produk, mis. jasa atau sewa alat.',
    modal: 'Uang pribadi yang Anda masukkan ke usaha. Bukan pendapatan, jadi tidak menambah laba.',
    pinjam: 'Uang pinjaman dari bank, koperasi, atau keluarga. Dicatat sebagai utang, bukan pendapatan.',
    bahan: 'Termasuk kemasan. Sisa yang belum terpakai di akhir bulan diisi sebagai stok akhir.',
    alat: 'Dicatat sebagai aset dan biayanya dibagi selama umur pakainya (penyusutan), bukan sekaligus.',
    cicil: 'Bagian pokok cicilan mengurangi utang, bukan biaya. Catat bunganya terpisah.',
    bunga: 'Bunga, biaya administrasi, atau denda pinjaman.',
    prive: 'Uang usaha yang dipakai untuk keperluan rumah tangga. Tidak mengurangi laba, tapi mengurangi kas.',
    pajak: 'Mis. PPh final 0,5% dari omzet atau retribusi usaha.',
  };
  const KAT_IC = {
    jual: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 016 0"/>',
    lain: '<path d="M12 5v14M5 12h14"/>',
    modal: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    pinjam: '<path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18"/>',
    bahan: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    upah: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18.5 20a6.5 6.5 0 00-2-4.7"/>',
    sewa: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    energi: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    kirim: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    promo: '<path d="M4 10v4l11 5V5zM15 8a4 4 0 010 8M4 14l2 6h3l-1-5"/>',
    lainop: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    bunga: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    pajak: '<path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z"/><path d="M10 8h4M10 12h4"/>',
    alat: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    cicil: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
    prive: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M12 17s-3-1.8-3-3.7a1.6 1.6 0 013-.8 1.6 1.6 0 013 .8C15 15.2 12 17 12 17z"/>',
  };
  const kic = (id, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${KAT_IC[id] || KAT_IC.lainop}</svg>`;
  const bulanIni = () => today().slice(0, 7);
  let kMonth = null;
  function bukuEngine(){
    const k = state.kas, a = k.awal, n = (v) => Number(v) || 0;
    return {
      awal: { bulan: a.bulan || '', kas: n(a.kas), persediaan: n(a.persediaan),
        peralatan: a.peralatan.map(x => ({ nama: x.nama, nilai: n(x.nilai), umur: n(x.umur) || 4 })),
        utang: a.utang.map(x => ({ nama: x.nama, sisa: n(x.sisa) })),
        piutang: a.piutang.map(x => ({ nama: x.nama, nilai: n(x.nilai), lunasTgl: x.lunasTgl })),
        utangUsaha: a.utangUsaha.map(x => ({ nama: x.nama, nilai: n(x.nilai), lunasTgl: x.lunasTgl })) },
      trx: k.trx, stok: k.stok,
    };
  }
  const kasMulai = () => H.bulanMulai(bukuEngine()) || bulanIni();
  const adaSaldoAwal = () => { const a = state.kas.awal; return Number(a.kas) > 0 || Number(a.persediaan) > 0 || a.peralatan.some(x => Number(x.nilai) > 0) || a.utang.some(x => Number(x.sisa) > 0) || a.piutang.some(x => Number(x.nilai) > 0) || a.utangUsaha.some(x => Number(x.nilai) > 0); };
  function pastikanMulai(bln){
    const a = state.kas.awal;
    if (!a.bulan) { a.bulan = bln; return true; }
    if (bln < a.bulan) { if (!adaSaldoAwal()) { a.bulan = bln; return true; } return false; }
    return true;
  }
  function penjualanBulan(b){
    return state.penjualan.filter(x => x.tgl.startsWith(b)).reduce((t, x) => t + (Number(x.qty) || 0) * (Number(x.harga) || 0), 0);
  }
  function renderKeuangan(){
    const k = state.kas, buku = bukuEngine(), mulai = kasMulai(), now = bulanIni();
    if (!kMonth) kMonth = now;
    if (kMonth < mulai) kMonth = mulai;
    $('#kSetup').hidden = !!(k.profil.namaUsaha && k.awal.bulan);
    $('#kBulan').textContent = namaBulan(kMonth);
    $('#kBulanSub').textContent = kMonth === now ? 'Bulan berjalan' : kMonth === mulai ? 'Awal pencatatan' : '';
    $('#kPrev').disabled = kMonth <= mulai; $('#kNext').disabled = kMonth >= now;
    const lap = H.laporanBulan(buku, kMonth);
    const masuk = lap ? H.KATEGORI.masuk.reduce((s, c) => s + lap.k[c.id], 0) : 0;
    const keluar = lap ? H.KATEGORI.keluar.reduce((s, c) => s + lap.k[c.id], 0) : 0;
    const laba = lap ? lap.labaRugi.laba : 0, kas = lap ? lap.arusKas.kasAkhir : 0;
    $('#kSum').innerHTML = `
      <div class="ks-main"><span>Sisa uang usaha <span class="term">(kas akhir)</span></span><b class="${kas < 0 ? 'neg' : ''}">${fmtRp(kas)}</b>${canSpeak ? '<button class="btn small ghost ks-speak" type="button" id="kSpeak" aria-label="Bacakan ringkasan bulan ini"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>Bacakan</button>' : ''}</div>
      <div class="ks-grid">
        <div><span>Masuk</span><b class="pos">${fmtRp(masuk)}</b></div>
        <div><span>Keluar</span><b>${fmtRp(keluar)}</b></div>
        <div><span>Untung bersih</span><b class="${laba < 0 ? 'neg' : 'pos'}">${lap && lap.jumlahTrx ? fmtRp(laba) : '—'}</b></div>
      </div>
      ${kas < 0 ? '<p class="ks-warn">Kas tercatat minus. Mungkin ada uang masuk yang belum dicatat, atau uang kas awal belum diisi di Data usaha & saldo awal.</p>' : ''}
      ${lap && lap.jumlahTrx && (lap.k.modal || lap.k.pinjam || lap.k.cicil || lap.k.prive || lap.k.alat || lap.labaRugi.penyusutan) ? '<p class="ks-note">Untung bersih tidak sama dengan masuk − keluar karena modal, pinjaman, cicilan pokok, pengambilan pribadi, dan beli peralatan bukan pendapatan atau biaya.</p>' : ''}`;
    const sp = $('#kSpeak'); if (sp) sp.onclick = () => speak(`${namaBulan(kMonth)}. Uang masuk ${fmtRp(masuk)}. Uang keluar ${fmtRp(keluar)}. ${laba < 0 ? 'Rugi' : 'Untung'} bersih ${fmtRp(Math.abs(laba))}. Sisa uang usaha ${fmtRp(kas)}.`);
    renderOpen(); renderKInfo(lap); checkBackup(); renderProd();
    // rekap penjualan
    const pj = penjualanBulan(kMonth), src = 'pj:' + kMonth, ex = k.trx.find(t => t.src === src);
    const jn = $('#kJualNote');
    if (pj > 0 && (!ex || Math.round(ex.nominal) !== Math.round(pj))) {
      jn.hidden = false;
      jn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><span class="grow">Catatan penjualan bulan ini bernilai <b>${fmtRp(pj)}</b>${ex ? ` (tercatat ${fmtRp(ex.nominal)})` : ' dan belum masuk ke Keuangan'}.</span><button class="btn small primary" type="button" id="kJualAdd">${ex ? 'Perbarui' : 'Masukkan'}</button>`;
      $('#kJualAdd').onclick = () => {
        const manual = k.trx.filter(t => t.kat === 'jual' && t.jenis === 'masuk' && !t.src && t.tgl.startsWith(kMonth));
        if (manual.length && !ex) return confirmBox('Penjualan bisa tercatat dua kali', `Sudah ada ${manual.length} catatan penjualan bulan ini yang diisi sendiri (${fmtRp(manual.reduce((s, t) => s + Number(t.nominal), 0))}). Masukkan rekap hanya bila penjualannya berbeda.`, 'Tetap masukkan', addRekap);
        addRekap();
      };
      function addRekap(){
        const tgl = kMonth === bulanIni() ? today() : `${kMonth}-${akhirBulan(kMonth)}`;
        if (ex) { ex.nominal = Math.round(pj); } else { pastikanMulai(kMonth); k.trx.push({ id: uid(), tgl, jenis: 'masuk', kat: 'jual', nominal: Math.round(pj), ket: 'Rekap catatan penjualan', src }); }
        saveNow(); renderKeuangan(); toast('Penjualan dimasukkan ke Keuangan');
      }
    } else jn.hidden = true;
    const st = $('#kStok'); if (document.activeElement !== st) st.value = fmtInput(k.stok[kMonth]);
    // daftar
    const list = k.trx.filter(t => t.tgl.startsWith(kMonth)).sort((a, b) => b.tgl.localeCompare(a.tgl) || (b.t || 0) - (a.t || 0));
    $('#kCount').textContent = list.length ? list.length + ' catatan' : '';
    $('#kEmpty').hidden = list.length > 0;
    const sebelum = k.awal.bulan && kMonth === k.awal.bulan ? k.trx.filter(t => t.tgl.slice(0, 7) < k.awal.bulan).length : 0;
    let html = '', lastD = '';
    list.forEach(t => {
      if (t.tgl !== lastD) { lastD = t.tgl; html += `<div class="tday">${new Date(t.tgl + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</div>`; }
      const c = KAT_ALL[t.jenis + ':' + t.kat] || { nama: t.kat };
      html += `<button type="button" class="trow ${t.jenis}" data-trx-id="${t.id}"><span class="ti">${kic(t.kat)}</span><span class="tt"><b>${esc(c.nama)}${t.tempo ? (t.lunasTgl ? ' <i class="tbadge ok">lunas</i>' : ` <i class="tbadge">${t.jenis === 'masuk' ? 'belum dibayar pembeli' : 'belum dibayar'}</i>`) : ''}</b>${t.ket ? `<small>${esc(t.ket)}</small>` : ''}</span><span class="tn">${t.jenis === 'masuk' ? '+' : '−'}${fmtRp(Number(t.nominal)).replace('Rp', 'Rp ')}</span></button>`;
    });
    if (sebelum) html += `<p class="hint">${sebelum} catatan bertanggal sebelum ${namaBulan(k.awal.bulan)} tidak dihitung. Ubah "Mulai mencatat bulan" di Data usaha & saldo awal bila perlu.</p>`;
    $('#kList').innerHTML = html;
  }
  function rencanaMargin(){
    const ms = state.products.filter(p => !p.isContoh).map(summaryOf).filter(x => x.m !== null && x.harga);
    return ms.length ? ms.reduce((t, x) => t + x.m, 0) / ms.length : null;
  }
  function renderKInfo(lap){
    const box = $('#kInfo'), parts = [];
    if (lap && lap.k.jual > 0 && !lap.k.pajak) {
      const pph = Math.round(lap.k.jual * 0.005);
      parts.push(`<div class="kcard-i"><div class="grow"><b>Perkiraan pajak bulan ini ${fmtRp(pph)}</b><p>PPh final 0,5% × penjualan ${fmtRp(lap.k.jual)}. Berlaku untuk UMKM perorangan dengan omzet sampai Rp4,8 miliar setahun; pastikan aturan yang berlaku untuk usaha Anda.</p></div><button class="btn small" type="button" id="kPajak">Catat bayar pajak</button></div>`);
    }
    const rm = rencanaMargin();
    if (lap && lap.labaRugi.pendapatan > 0 && rm !== null) {
      const nyata = lap.labaRugi.laba / lap.labaRugi.pendapatan, jauh = nyata < rm - 0.1;
      parts.push(`<div class="kcard-i ${jauh ? 'warn' : ''}"><div class="grow"><b>Untung nyata vs rencana</b><p>Rencana di hitungan harga: untung rata-rata <b>${fmtPct(rm)}</b> dari harga jual. Kenyataan bulan ini: untung bersih <b>${fmtPct(nyata)}</b> dari penjualan.${jauh ? ' Selisihnya besar. Periksa apakah harga bahan naik, banyak barang tidak laku, ada biaya yang belum masuk hitungan, atau stok akhir bulan belum diisi.' : ''}</p></div></div>`);
    }
    const top = state.products.filter(p => !p.isContoh).map(p => ({ p, q: terjualProduk(p.id, kMonth), s: summaryOf(p) })).filter(x => x.q > 0).sort((a, b) => b.q * (b.s.laba || 0) - a.q * (a.s.laba || 0)).slice(0, 3);
    if (top.length) parts.push(`<div class="kcard-i"><div class="grow"><b>Produk terlaris bulan ini</b>${top.map((x, i) => `<div class="toprow"><span class="tr-n">${i + 1}</span><span class="grow">${esc(x.p.nama || 'Produk')}</span><span>${fmtInput(x.q)} ${esc((x.p.satuan || 'unit').toLowerCase())}</span>${x.s.laba ? `<b>untung ±${fmtRp(x.q * x.s.laba)}</b>` : ''}</div>`).join('')}</div></div>`);
    box.hidden = !parts.length; box.innerHTML = parts.join('');
    const bp = $('#kPajak'); if (bp) bp.onclick = () => { openTrx('keluar'); trx.kat = 'pajak'; renderTrxKat(); $('#trxNom').value = fmtInput(Math.round(lap.k.jual * 0.005)); $('#trxKet').value = 'PPh final 0,5% ' + namaBulan(kMonth); };
  }
  function jualList(){
    const out = state.penjualan.map(x => ({ pid: x.pid, qty: Number(x.qty) || 0, tgl: x.tgl }));
    state.kas.trx.forEach(t => (t.items || []).forEach(i => out.push({ pid: i.pid, qty: Number(i.qty) || 0, tgl: t.tgl })));
    return out;
  }
  const stokSampai = (tgl) => H.stokProduk(state.kas.produksi, jualList(), tgl);
  const adaProduksi = (pid) => state.kas.produksi.some(x => x.pid === pid);
  function renderProd(){
    const list = state.products.filter(p => !p.isContoh), box = $('#kProd');
    box.hidden = !list.length; if (!list.length) return;
    const st = stokSampai(today());
    const rows = list.map(p => { const sat = esc((p.satuan || 'unit').toLowerCase());
      if (!adaProduksi(p.id)) return `<button type="button" class="prow" data-prod="${p.id}"><span class="grow"><b>${esc(p.nama || 'Produk tanpa nama')}</b><small>Belum ada catatan produksi</small></span><span class="pchip none">Catat</span></button>`;
      const q = st[p.id] || 0, cls = q <= 0 ? 'out' : q <= 5 ? 'low' : 'ok';
      return `<button type="button" class="prow" data-prod="${p.id}"><span class="grow"><b>${esc(p.nama || 'Produk tanpa nama')}</b><small>${q <= 0 ? 'Stok habis, saatnya produksi' : q <= 5 ? 'Stok menipis' : 'Siap dijual'}</small></span><span class="pchip ${cls}">${fmtInput(Math.max(0, q))} ${sat}</span></button>`; });
    $('#kProdList').innerHTML = rows.join('');
    // tombol hitung persediaan dari stok produk
    const any = state.kas.produksi.length > 0; $('#kStokHitung').hidden = !any;
  }
  function openProd(pid){
    const list = state.products.filter(p => !p.isContoh); if (!list.length) return toast('Buat produk dulu di menu Hitung');
    $('#prPid').innerHTML = list.map(p => `<option value="${p.id}">${esc(p.nama || 'Produk tanpa nama')}</option>`).join('');
    if (pid) $('#prPid').value = pid;
    $('#prQty').value = ''; $('#prTgl').value = today(); $('#prTgl').max = today(); $('#prAwal').checked = false;
    updProdDlg(); openOverlay('prodDlg'); setTimeout(() => $('#prQty').focus(), 30);
  }
  function updProdDlg(){
    const pid = $('#prPid').value, p = state.products.find(x => x.id === pid); $('#prSat').textContent = p ? (p.satuan || 'unit').toLowerCase() : '';
    const r = state.kas.produksi.filter(x => x.pid === pid).sort((a, b) => b.tgl.localeCompare(a.tgl)).slice(0, 5);
    $('#prRiwayat').innerHTML = r.length ? `<div class="lbl" style="margin-top:14px">Catatan produksi terakhir</div>${r.map(x => `<div class="prh"><span class="grow">${tglPanjang(x.tgl)}${x.awal ? ' · stok awal' : ''}</span><b>${fmtInput(x.qty)}</b><button class="btn icon" type="button" data-prdel="${x.id}" aria-label="Hapus catatan produksi">${DEL_IC}</button></div>`).join('')}` : '';
  }
  $('#btnProduksi').addEventListener('click', () => openProd());
  $('#kProdList').addEventListener('click', (e) => { const r = e.target.closest('[data-prod]'); if (r) openProd(r.dataset.prod); });
  $('#prPid').addEventListener('change', updProdDlg);
  $('#prBatal').addEventListener('click', closeOverlays);
  $('#prRiwayat').addEventListener('click', (e) => { const d = e.target.closest('[data-prdel]'); if (!d) return; state.kas.produksi = state.kas.produksi.filter(x => x.id !== d.dataset.prdel); saveNow(); updProdDlg(); renderProd(); toast('Catatan produksi dihapus'); });
  $('#prSimpan').addEventListener('click', () => {
    const qty = Number(parseInput($('#prQty').value)) || 0; if (!(qty > 0)) { toast('Isi jumlah barang yang jadi'); return; }
    const pid = $('#prPid').value, p = state.products.find(x => x.id === pid);
    state.kas.produksi.push({ id: uid(), pid, qty, tgl: $('#prTgl').value || today(), ...($('#prAwal').checked ? { awal: true } : {}) });
    saveNow(); closeOverlays(); renderKeuangan();
    toast(`Produksi ${p ? p.nama : ''} ${fmtInput(qty)} ${(p && p.satuan || 'unit').toLowerCase()} dicatat. Stok sekarang ${fmtInput(Math.max(0, stokSampai(today())[pid] || 0))}.`);
  });
  $('#kStokHitung').addEventListener('click', () => {
    const end = `${kMonth}-${String(akhirBulan(kMonth)).padStart(2, '0')}`, st = stokSampai(end), hpp = {};
    state.products.forEach(p => { hpp[p.id] = summaryOf(p).r.hpp || 0; });
    const v = Math.round(H.nilaiStok(st, hpp));
    pastikanMulai(kMonth); state.kas.stok[kMonth] = v; $('#kStok').value = fmtInput(v); saveNow(); renderKeuangan();
    toast(`Nilai stok produk jadi ${fmtRp(v)} (jumlah × modal). Tambahkan nilai bahan yang tersisa bila ada.`);
  });
  function renderOpen(){
    const aw = state.kas.awal, tglAwal = (aw.bulan || bulanIni()) + '-01';
    const fromAwal = (arr, jenis, key) => arr.map((x, i) => ({ awalKey: key, idx: i, jenis, kat: jenis === 'masuk' ? 'jual' : 'bahan', nominal: Number(x.nilai) || 0, ket: (x.nama || 'Tanpa nama') + ' (saldo awal)', tgl: tglAwal, lunasTgl: x.lunasTgl })).filter(x => x.nominal > 0 && !x.lunasTgl);
    const open = [...fromAwal(aw.piutang, 'masuk', 'piutang'), ...fromAwal(aw.utangUsaha, 'keluar', 'utangUsaha'), ...state.kas.trx.filter(t => t.tempo && !t.lunasTgl && H.BOLEH_TEMPO.includes(t.kat))].sort((a, b) => a.tgl.localeCompare(b.tgl));
    const box = $('#kOpen'); box.hidden = !open.length; if (!open.length) { box.innerHTML = ''; return; }
    const sum = (j) => open.filter(t => t.jenis === j).reduce((s, t) => s + Number(t.nominal), 0);
    const row = (t) => { const c = KAT_ALL[t.jenis + ':' + t.kat] || {}; const hari = Math.round((new Date(today()) - new Date(t.tgl)) / 864e5);
      return `<div class="orow"><div class="grow"><b>${esc(t.ket || c.nama)}</b><small>${esc(c.nama)} · ${tglPanjang(t.tgl)}${hari > 30 ? ` · <span class="neg">${hari} hari</span>` : ''}</small></div><span class="tn ${t.jenis === 'masuk' ? 'pos' : ''}">${fmtRp(Number(t.nominal))}</span>${t.jenis === 'masuk' ? `<button class="btn small ghost wa" type="button" data-ingat="${esc(t.ket || '')}" data-nom="${t.nominal}" data-tgl="${t.tgl}" aria-label="Ingatkan lewat WhatsApp">Ingatkan</button>` : ''}<button class="btn small" type="button" ${t.awalKey ? `data-lunas-awal="${t.awalKey}" data-si="${t.idx}"` : `data-lunas="${t.id}"`}>${t.jenis === 'masuk' ? 'Sudah dibayar' : 'Sudah lunas'}</button></div>`; };
    const pi = open.filter(t => t.jenis === 'masuk'), ut = open.filter(t => t.jenis === 'keluar');
    box.innerHTML = `<div class="sec-head" style="margin:0 0 8px"><h2>Belum dibayar</h2><span class="hint">semua bulan</span></div>
      ${pi.length ? `<div class="ohead"><span>Pembeli yang belum bayar <span class="term">(piutang)</span></span><b class="pos">${fmtRp(sum('masuk'))}</b></div>${pi.map(row).join('')}` : ''}
      ${ut.length ? `<div class="ohead"><span>Bon yang belum kita bayar <span class="term">(utang usaha)</span></span><b>${fmtRp(sum('keluar'))}</b></div>${ut.map(row).join('')}` : ''}`;
  }
  $('#kOpen').addEventListener('click', (e) => {
    const ig = e.target.closest('[data-ingat]');
    if (ig) { const P = state.kas.profil; return kirimWA(`Assalamualaikum/Salam sejahtera Bapak/Ibu${ig.dataset.ingat ? ' (' + ig.dataset.ingat.replace(/ \(saldo awal\)$/, '') + ')' : ''}. Mohon maaf mengganggu, kami ingin mengingatkan pembayaran sebesar ${fmtRp(Number(ig.dataset.nom))} untuk pembelian tanggal ${tglPanjang(ig.dataset.tgl)}. Terima kasih atas kepercayaannya.${P.namaUsaha ? '\n\n' + P.namaUsaha : ''}`); }
    const ba = e.target.closest('[data-lunas-awal]');
    if (ba) { const x = state.kas.awal[ba.dataset.lunasAwal][Number(ba.dataset.si)]; x.lunasTgl = today(); saveNow(); renderKeuangan(); toast(`Ditandai lunas hari ini (${fmtRp(Number(x.nilai))})`, 'Urungkan', () => { delete x.lunasTgl; saveNow(); renderKeuangan(); }); return; }
    const b = e.target.closest('[data-lunas]'); if (!b) return;
    const t = state.kas.trx.find(x => x.id === b.dataset.lunas); if (!t) return;
    t.lunasTgl = today() < t.tgl ? t.tgl : today(); saveNow(); renderKeuangan();
    toast(`Ditandai lunas hari ini (${fmtRp(Number(t.nominal))})`, 'Urungkan', () => { delete t.lunasTgl; saveNow(); renderKeuangan(); });
  });
  $('#kPrev').addEventListener('click', () => { kMonth = H.geserBulan(kMonth, -1); renderKeuangan(); });
  $('#kNext').addEventListener('click', () => { kMonth = H.geserBulan(kMonth, 1); renderKeuangan(); });
  $('#kStok').addEventListener('input', (e) => { const v = parseInput(e.target.value); if (v === '') delete state.kas.stok[kMonth]; else { pastikanMulai(kMonth); state.kas.stok[kMonth] = v; } save(); });
  $('#kStok').addEventListener('change', renderKeuangan);
  $('#kList').addEventListener('click', (e) => { const r = e.target.closest('[data-trx-id]'); if (r) openTrx(null, r.dataset.trxId); });
  $$('[data-trx]').forEach(b => b.addEventListener('click', () => openTrx(b.dataset.trx)));

  // ----- lembar transaksi -----
  let trx = { id: null, jenis: 'masuk', kat: 'jual' };
  function renderTrxKat(){
    $('#trxTitle').textContent = trx.id ? 'Ubah catatan' : (trx.jenis === 'masuk' ? 'Uang masuk' : 'Uang keluar');
    $$('[data-tj]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tj === trx.jenis)));
    $('#trxDlg .sheet').dataset.jenis = trx.jenis;
    $('#trxKat').innerHTML = H.KATEGORI[trx.jenis].map(c => `<button type="button" role="radio" class="kat" data-kat="${c.id}" aria-checked="${c.id === trx.kat}">${kic(c.id, 20)}<span>${esc(c.nama)}</span></button>`).join('');
    const c = KAT_ALL[trx.jenis + ':' + trx.kat];
    $('#trxKatHint').innerHTML = c ? `<b>${esc(c.nama)}</b> <span class="term">(${esc(c.resmi)})</span>${KAT_INFO[c.id] ? ' · ' + esc(KAT_INFO[c.id]) : ''}` : '';
    $('#trxUmurF').hidden = trx.kat !== 'alat';
    const bt = H.BOLEH_TEMPO.includes(trx.kat);
    $('#trxTempoF').hidden = !bt;
    $('#trxTempoL').innerHTML = trx.jenis === 'masuk' ? 'Pembeli belum bayar <span class="term">(piutang)</span>' : 'Belum dibayar / masih bon <span class="term">(utang usaha)</span>';
    $('#trxLunasF').hidden = !(bt && $('#trxTempo').checked && trx.id);
    renderItems(); renderBahanUpd();
  }
  function terbilangSingkat(n){ return n >= 1e9 ? (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' miliar' : n >= 1e6 ? (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' juta' : n.toLocaleString('id-ID'); }
  const produkJual = () => state.products.filter(p => !p.isContoh).map(p => ({ p, s: summaryOf(p) })).filter(x => x.s.harga > 0);
  function renderItems(){
    const list = produkJual(), box = $('#trxItems');
    box.hidden = !(trx.jenis === 'masuk' && trx.kat === 'jual' && list.length);
    if (box.hidden) return;
    $('#trxItemList').innerHTML = list.map(({ p, s }) => { const q = trx.items[p.id] || 0, h = trx.harga[p.id] ?? Math.round(s.harga);
      return `<div class="irow${q ? ' on' : ''}"><div class="grow"><b>${esc(p.nama || 'Produk tanpa nama')}</b><small>${fmtRp(h)} / ${esc((p.satuan || 'unit').toLowerCase())}</small></div><div class="qty"><button type="button" class="qb" data-qm="${p.id}" aria-label="Kurangi">−</button><label class="sr" for="iq_${p.id}">Jumlah ${esc(p.nama)}</label><input id="iq_${p.id}" class="num" data-iq="${p.id}" type="text" inputmode="decimal" value="${q ? fmtInput(q) : ''}" placeholder="0"><button type="button" class="qb" data-qp="${p.id}" aria-label="Tambah">+</button></div></div>`; }).join('');
    updItemSum();
  }
  function itemTotal(){ return produkJual().reduce((t, { p, s }) => t + (trx.items[p.id] || 0) * (trx.harga[p.id] ?? Math.round(s.harga)), 0); }
  function updItemSum(){
    const tot = itemTotal(), n = Object.values(trx.items).filter(q => q > 0).length;
    $('#trxItemSum').innerHTML = n ? `Total dari ${n} produk: <b>${fmtRp(tot)}</b>${trx.nomManual && Math.round(Number(parseInput($('#trxNom').value)) || 0) !== Math.round(tot) ? ' · jumlah di atas diubah manual (mis. ada diskon)' : ''}` : 'Ketuk + pada produk yang terjual; jumlah uang terisi otomatis.';
    if (n && !trx.nomManual) $('#trxNom').value = fmtInput(Math.round(tot));
  }
  $('#trxItemList').addEventListener('click', (e) => {
    const m = e.target.closest('[data-qm]'), pl = e.target.closest('[data-qp]'); if (!m && !pl) return;
    const id = (m || pl).dataset[m ? 'qm' : 'qp']; trx.items[id] = Math.max(0, (trx.items[id] || 0) + (pl ? 1 : -1));
    const inp = $('#iq_' + id); inp.value = trx.items[id] ? fmtInput(trx.items[id]) : ''; inp.closest('.irow').classList.toggle('on', trx.items[id] > 0); updItemSum();
  });
  $('#trxItemList').addEventListener('input', (e) => { const el = e.target.closest('[data-iq]'); if (!el) return; trx.items[el.dataset.iq] = Number(parseInput(el.value)) || 0; el.closest('.irow').classList.toggle('on', trx.items[el.dataset.iq] > 0); updItemSum(); });
  $('#trxNom').addEventListener('input', () => { trx.nomManual = true; if (!$('#trxItems').hidden) updItemSum(); });
  function libBahan(){ const m = new Map(); allBahanRows().forEach(({ b }) => { const k = norm(b.nama); if (!m.has(k)) m.set(k, b); }); return Array.from(m.values()).sort((a, b) => a.nama.localeCompare(b.nama, 'id')); }
  function renderBahanUpd(){
    const d = $('#trxBahanUpd'), lib = libBahan();
    d.hidden = !(trx.jenis === 'keluar' && trx.kat === 'bahan' && lib.length && !trx.id);
    if (d.hidden) return;
    const sel = $('#trxBhn'), cur = sel.value;
    sel.innerHTML = '<option value="">— pilih bahan —</option>' + lib.map(b => `<option value="${esc(norm(b.nama))}">${esc(b.nama)} (sekarang ${fmtRp(Number(b.harga))} / ${fmtInput(b.isi)} ${esc(uLabel(b.satuanIsi))})</option>`).join('');
    sel.value = cur; updBhnSat();
  }
  function updBhnSat(){ const b = libBahan().find(x => norm(x.nama) === $('#trxBhn').value); $('#trxBhnSat').textContent = b ? uLabel(b.satuanIsi) : ''; if (b && !$('#trxBhnIsi').value) $('#trxBhnIsi').value = fmtInput(b.isi); }
  $('#trxBhn').addEventListener('change', () => { $('#trxBhnIsi').value = ''; updBhnSat(); });
  function notaText(t){
    const P = state.kas.profil, lines = [`*${P.namaUsaha || 'Nota penjualan'}*`, P.alamat || '', `Tanggal: ${tglPanjang(t.tgl)}`, ''].filter((x, i) => x || i === 3);
    (t.items || []).forEach(it => lines.push(`${it.nama} × ${fmtInput(it.qty)} @ ${fmtRp(it.harga)} = ${fmtRp(it.qty * it.harga)}`));
    if (!(t.items || []).length && t.ket) lines.push(t.ket);
    lines.push('', `*Total: ${fmtRp(Number(t.nominal))}*`, t.tempo && !t.lunasTgl ? 'Status: belum dibayar' : 'Status: lunas', '', 'Terima kasih atas pembeliannya 🙏');
    return lines.join('\n');
  }
  const kirimWA = (text) => { const u = 'https://wa.me/?text=' + encodeURIComponent(text); if (embedded) { navigator.clipboard && navigator.clipboard.writeText(text); toast('Teks disalin. Tempel di WhatsApp.'); } else window.open(u, '_blank', 'noopener'); };
  $('#trxNota').addEventListener('click', () => { const t = state.kas.trx.find(x => x.id === trx.id); if (t) kirimWA(notaText(t)); });
  function openTrx(jenis, id){
    const t = id ? state.kas.trx.find(x => x.id === id) : null;
    trx = t ? { id: t.id, jenis: t.jenis, kat: t.kat } : { id: null, jenis, kat: jenis === 'masuk' ? 'jual' : 'bahan' };
    trx.items = {}; trx.harga = {}; trx.nomManual = !!t;
    if (t && t.items) t.items.forEach(it => { trx.items[it.pid] = it.qty; trx.harga[it.pid] = it.harga; });
    $('#trxBhnIsi').value = ''; $('#trxBhn').value = ''; $('#trxBahanUpd').open = false;
    $('#trxNota').hidden = !(t && t.jenis === 'masuk' && t.kat === 'jual');
    $('#trxNom').value = t ? fmtInput(t.nominal) : '';
    $('#trxKet').value = t ? (t.ket || '') : '';
    $('#trxUmur').value = t && t.umur ? fmtInput(t.umur) : '';
    const m = kMonth || bulanIni();
    $('#trxTgl').value = t ? t.tgl : (m === bulanIni() ? today() : `${m}-${String(akhirBulan(m)).padStart(2, '0')}`);
    $('#trxTgl').max = today();
    $('#trxDel').hidden = !t;
    $('#trxTempo').checked = !!(t && t.tempo); $('#trxLunas').value = t && t.lunasTgl ? t.lunasTgl : '';
    renderTrxKat(); openOverlay('trxDlg');
    setTimeout(() => $('#trxNom').focus(), 30);
  }
  $$('[data-tj]').forEach(b => b.addEventListener('click', () => { if (trx.jenis === b.dataset.tj) return; trx.jenis = b.dataset.tj; trx.kat = trx.jenis === 'masuk' ? 'jual' : 'bahan'; renderTrxKat(); }));
  $('#trxKat').addEventListener('click', (e) => { const b = e.target.closest('[data-kat]'); if (!b) return; trx.kat = b.dataset.kat; renderTrxKat(); });
  $('#trxTempo').addEventListener('change', renderTrxKat);
  $('#trxBatal').addEventListener('click', closeOverlays);
  $('#trxSimpan').addEventListener('click', () => {
    const nominal = Number(parseInput($('#trxNom').value)) || 0;
    if (!(nominal > 0)) { toast('Isi jumlah uangnya dulu'); $('#trxNom').focus(); return; }
    if (nominal >= 50000000 && !trx.yakin) {
      const d = $('#trxDlg'); d.hidden = true;
      confirmBox('Jumlahnya sudah benar?', `${fmtRp(nominal)} (${terbilangSingkat(nominal)}). Pastikan tidak ada angka nol yang berlebih.`, 'Ya, benar', () => { $('#cfNo').onclick = null; d.hidden = false; trx.yakin = true; $('#trxSimpan').click(); });
      $('#cfNo').onclick = () => { $('#cfNo').onclick = null; closeOverlays(); d.hidden = false; $('#trxNom').focus(); };
      return;
    }
    trx.yakin = false;
    const tgl = $('#trxTgl').value || today();
    const okMulai = pastikanMulai(tgl.slice(0, 7));
    const data = { tgl, jenis: trx.jenis, kat: trx.kat, nominal, ket: $('#trxKet').value.trim() };
    if (trx.kat === 'alat') data.umur = Number(parseInput($('#trxUmur').value)) || 4;
    const tempo = H.BOLEH_TEMPO.includes(trx.kat) && $('#trxTempo').checked;
    let items = null;
    if (trx.jenis === 'masuk' && trx.kat === 'jual') {
      items = produkJual().filter(({ p }) => trx.items[p.id] > 0).map(({ p, s }) => ({ pid: p.id, nama: p.nama || 'Produk', qty: trx.items[p.id], harga: trx.harga[p.id] ?? Math.round(s.harga) }));
      if (items.length) { data.items = items; if (!data.ket) data.ket = items.map(it => `${it.nama} ${fmtInput(it.qty)}`).join(', '); } else items = null;
    }
    let bhnMsg = '';
    if (trx.kat === 'bahan' && !$('#trxBahanUpd').hidden && $('#trxBhn').value) {
      const isi = Number(parseInput($('#trxBhnIsi').value)) || 0, key = $('#trxBhn').value;
      if (isi > 0) { let src = null, nProd = new Set(); allBahanRows().forEach(({ p, b }) => { if (norm(b.nama) === key) { b.harga = nominal; b.isi = isi; src = b; nProd.add(p.id); } }); if (src) { propagate(src); bhnMsg = ` Harga ${src.nama} diperbarui di ${nProd.size} produk.`; if (!data.ket) data.ket = `${src.nama} ${fmtInput(isi)} ${uLabel(src.satuanIsi)}`; } }
    }
    if (tempo) { data.tempo = true; const l = $('#trxLunas').value; if (trx.id && l) data.lunasTgl = l < tgl ? tgl : l; }
    if (!trx.id && trx.kat === 'jual' && state.kas.trx.some(x => x.src === 'pj:' + tgl.slice(0, 7))) toast('Perhatian: rekap catatan penjualan bulan ini sudah masuk. Pastikan penjualan ini tidak tercatat dua kali.');
    if (trx.id) { const t = state.kas.trx.find(x => x.id === trx.id); Object.assign(t, data); if (!items) delete t.items; if (trx.kat !== 'alat') delete t.umur; if (!tempo) { delete t.tempo; delete t.lunasTgl; } else if (!data.lunasTgl) delete t.lunasTgl; delete t.src; }
    else state.kas.trx.push({ id: uid(), t: Date.now(), ...data });
    const saved = trx.id ? state.kas.trx.find(x => x.id === trx.id) : state.kas.trx[state.kas.trx.length - 1];
    kMonth = tgl.slice(0, 7);
    saveNow(); closeOverlays(); renderKeuangan(); if (location.hash === '#beranda' || !location.hash) renderBeranda();
    let stokMsg = '';
    if (items) { const st = stokSampai(today()); items.forEach(it => { if (adaProduksi(it.pid) && (st[it.pid] || 0) < 0) stokMsg += ` Stok ${it.nama} tercatat minus; catat produksinya.`; }); }
    const msg = okMulai ? (trx.id ? 'Catatan diperbarui.' : `${trx.jenis === 'masuk' ? 'Uang masuk' : 'Uang keluar'} ${fmtRp(nominal)} dicatat.`) + bhnMsg : 'Tersimpan, tetapi tanggalnya sebelum awal pencatatan sehingga belum dihitung';
    if (saved && saved.kat === 'jual' && saved.jenis === 'masuk' && !trx.id) toast(msg + stokMsg, 'Kirim nota', () => kirimWA(notaText(saved))); else toast(msg);
  });
  $('#trxDel').addEventListener('click', () => {
    const id = trx.id; const t = state.kas.trx.find(x => x.id === id); if (!t) return;
    confirmBox('Hapus catatan ini?', `${(KAT_ALL[t.jenis + ':' + t.kat] || {}).nama || ''} ${fmtRp(Number(t.nominal))} pada ${tglPanjang(t.tgl)}.`, 'Hapus', () => {
      const idx = state.kas.trx.indexOf(t); state.kas.trx.splice(idx, 1); saveNow(); renderKeuangan();
      toast('Catatan dihapus', 'Urungkan', () => { state.kas.trx.splice(idx, 0, t); saveNow(); renderKeuangan(); });
    });
  });
  $('#trxNom').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#trxSimpan').click(); });

  // ----- data usaha & saldo awal -----
  function renderAwalLists(){
    const a = state.kas.awal;
    $('#awAlat').innerHTML = a.peralatan.map((x, i) => `<div class="arow"><div class="field"><label for="al_n${i}">Nama</label><input id="al_n${i}" data-al="${i}" data-af="nama" type="text" value="${esc(x.nama || '')}" placeholder="mis. Oven"></div><div class="field"><label for="al_v${i}">Nilai sekarang</label><div class="inp has-pre"><span class="pre">Rp</span><input id="al_v${i}" class="num" data-al="${i}" data-af="nilai" type="text" inputmode="decimal" value="${esc(fmtInput(x.nilai))}"></div></div><div class="field sm"><label for="al_u${i}">Sisa umur (thn)</label><input id="al_u${i}" class="num" data-al="${i}" data-af="umur" type="text" inputmode="decimal" value="${esc(fmtInput(x.umur))}" placeholder="4"></div><button class="btn icon" type="button" data-al-del="${i}" aria-label="Hapus peralatan">${DEL_IC}</button></div>`).join('');
    $('#awUtang').innerHTML = a.utang.map((x, i) => `<div class="arow u"><div class="field"><label for="ut_n${i}">Dari siapa</label><input id="ut_n${i}" data-ut="${i}" data-uf="nama" type="text" value="${esc(x.nama || '')}" placeholder="mis. KUR Bank, koperasi"></div><div class="field"><label for="ut_s${i}">Sisa pokok</label><div class="inp has-pre"><span class="pre">Rp</span><input id="ut_s${i}" class="num" data-ut="${i}" data-uf="sisa" type="text" inputmode="decimal" value="${esc(fmtInput(x.sisa))}"></div></div><button class="btn icon" type="button" data-ut-del="${i}" aria-label="Hapus pinjaman">${DEL_IC}</button></div>`).join('');
    const simple = (arr, key, ph) => arr.map((x, i) => `<div class="arow u"><div class="field"><label for="${key}_n${i}">Nama</label><input id="${key}_n${i}" data-sl="${key}" data-si="${i}" data-sf="nama" type="text" value="${esc(x.nama || '')}" placeholder="${ph}"></div><div class="field"><label for="${key}_v${i}">Jumlah</label><div class="inp has-pre"><span class="pre">Rp</span><input id="${key}_v${i}" class="num" data-sl="${key}" data-si="${i}" data-sf="nilai" type="text" inputmode="decimal" value="${esc(fmtInput(x.nilai))}"></div></div><button class="btn icon" type="button" data-sl-del="${key}" data-si="${i}" aria-label="Hapus">${DEL_IC}</button></div>`).join('');
    $('#awPiutang').innerHTML = simple(a.piutang, 'piutang', 'mis. Warung Pak Rudi');
    $('#awBon').innerHTML = simple(a.utangUsaha, 'utangUsaha', 'mis. Pemasok ikan');
    updAwalModal();
  }
  const DEL_IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  function updAwalModal(){
    const a = state.kas.awal, n = (v) => Number(v) || 0;
    const aset = n(a.kas) + n(a.persediaan) + a.peralatan.reduce((s, x) => s + n(x.nilai), 0) + a.piutang.reduce((s, x) => s + n(x.nilai), 0), ut = a.utang.reduce((s, x) => s + n(x.sisa), 0) + a.utangUsaha.reduce((s, x) => s + n(x.nilai), 0);
    $('#awModal').innerHTML = `Modal awal pemilik <span class="term">(aset − utang)</span>: <b>${fmtRp(aset - ut)}</b>`;
  }
  function openProfil(){
    const k = state.kas;
    if (!k.awal.bulan) k.awal.bulan = H.bulanMulai(bukuEngine()) || bulanIni();
    $$('[data-pf]').forEach(el => el.value = k.profil[el.dataset.pf] || '');
    $$('[data-aw]').forEach(el => el.value = fmtInput(k.awal[el.dataset.aw]));
    $('#awBulan').value = k.awal.bulan; $('#awBulan').max = bulanIni();
    renderAwalLists(); openOverlay('profilDlg'); setTimeout(() => $('#pfUsaha').focus(), 30);
  }
  $$('[data-open-profil]').forEach(b => b.addEventListener('click', openProfil));
  $('#profilDlg').addEventListener('input', (e) => {
    const el = e.target, k = state.kas, val = el.classList.contains('num') ? parseInput(el.value) : el.value;
    if (el.dataset.pf) k.profil[el.dataset.pf] = el.value;
    else if (el.dataset.aw) { k.awal[el.dataset.aw] = val; updAwalModal(); }
    else if (el.dataset.al !== undefined) { k.awal.peralatan[Number(el.dataset.al)][el.dataset.af] = val; updAwalModal(); }
    else if (el.dataset.ut !== undefined) { k.awal.utang[Number(el.dataset.ut)][el.dataset.uf] = val; updAwalModal(); }
    else if (el.dataset.sl) { k.awal[el.dataset.sl][Number(el.dataset.si)][el.dataset.sf] = val; updAwalModal(); }
    else if (el.id === 'awBulan' && el.value) k.awal.bulan = el.value;
    save();
  });
  $('#profilDlg').addEventListener('click', (e) => {
    const a = state.kas.awal, d1 = e.target.closest('[data-al-del]'), d2 = e.target.closest('[data-ut-del]');
    if (d1) { a.peralatan.splice(Number(d1.dataset.alDel), 1); renderAwalLists(); save(); }
    if (d2) { a.utang.splice(Number(d2.dataset.utDel), 1); renderAwalLists(); save(); }
    const d3 = e.target.closest('[data-sl-del]'); if (d3) { a[d3.dataset.slDel].splice(Number(d3.dataset.si), 1); renderAwalLists(); save(); }
  });
  $('#awAlatAdd').addEventListener('click', () => { state.kas.awal.peralatan.push({ nama: '', nilai: '', umur: '' }); renderAwalLists(); $('#al_n' + (state.kas.awal.peralatan.length - 1)).focus(); });
  $('#awPiutangAdd').addEventListener('click', () => { state.kas.awal.piutang.push({ nama: '', nilai: '' }); renderAwalLists(); $('#piutang_n' + (state.kas.awal.piutang.length - 1)).focus(); });
  $('#awBonAdd').addEventListener('click', () => { state.kas.awal.utangUsaha.push({ nama: '', nilai: '' }); renderAwalLists(); $('#utangUsaha_n' + (state.kas.awal.utangUsaha.length - 1)).focus(); });
  $('#awUtangAdd').addEventListener('click', () => { state.kas.awal.utang.push({ nama: '', sisa: '' }); renderAwalLists(); $('#ut_n' + (state.kas.awal.utang.length - 1)).focus(); });
  $('#profilClose').addEventListener('click', () => { saveNow(); closeOverlays(); route(); toast('Data usaha disimpan'); });

  // ----- laporan keuangan -----
  function svgChart(rows){
    const W = 640, Hh = 220, pl = 64, pr = 12, pt = 16, pb = 34;
    const vals = rows.flatMap(r => [r.labaRugi.pendapatan, r.labaRugi.laba]);
    let max = Math.max(1, ...vals), min = Math.min(0, ...vals);
    const step = (() => { const raw = (max - min) / 4, p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; })();
    max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step;
    const y = (v) => pt + (max - v) / (max - min) * (Hh - pt - pb);
    const gw = (W - pl - pr) / rows.length, bw = Math.min(28, gw * 0.32);
    const short = (v) => { const a = Math.abs(v); const s = a >= 1e9 ? (v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M' : a >= 1e6 ? (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt' : a >= 1e3 ? Math.round(v / 1e3).toLocaleString('id-ID') + ' rb' : String(Math.round(v)); return s; };
    let g = '';
    for (let v = min; v <= max + 1e-6; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#8A93A6' : '#E3E7EF'}" stroke-width="1"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#5B6478">${short(v)}</text>`;
    rows.forEach((r, i) => {
      const cx = pl + gw * i + gw / 2, a = r.labaRugi.pendapatan, l = r.labaRugi.laba;
      g += `<rect x="${cx - bw - 2}" y="${y(Math.max(a, 0))}" width="${bw}" height="${Math.abs(y(a) - y(0))}" rx="3" fill="#1E4094"/>`;
      g += `<rect x="${cx + 2}" y="${y(Math.max(l, 0))}" width="${bw}" height="${Math.max(1, Math.abs(y(l) - y(0)))}" rx="3" fill="${l < 0 ? '#C0392B' : '#E5B800'}"/>`;
      g += `<text x="${cx}" y="${Hh - 12}" text-anchor="middle" font-size="11.5" fill="#2A3245">${blnPendek(r.bulan)}</text>`;
    });
    return `<svg class="lk-chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Grafik pendapatan dan laba bersih per bulan">${g}</svg>
      <div class="lk-legend"><span><i style="background:#1E4094"></i>Pendapatan</span><span><i style="background:#E5B800"></i>Laba bersih</span></div>`;
  }
  function renderLapKeu(){
    const k = state.kas, buku = bukuEngine(), mulai = kasMulai(), now = bulanIni();
    const sel = $('#lkBulan'), months = H.daftarBulan(mulai, now).reverse();
    const want = sel.value && months.includes(sel.value) ? sel.value : (kMonth && months.includes(kMonth) ? kMonth : months[0]);
    sel.innerHTML = months.map(b => `<option value="${b}"${b === want ? ' selected' : ''}>${namaBulan(b)}${b === now ? ' (berjalan)' : ''}</option>`).join('');
    $('#lkN').value = String(k.lk.n || 3); $('#lkKota').value = k.lk.kota || ''; $('#lkCatatan').value = k.lk.catatan || ''; $('#lkLamp').checked = !!k.lk.lamp;
    const out = $('#lapKeu');
    const kurang = ['namaUsaha', 'pemilik', 'alamat'].filter(f => !(k.profil[f] || '').trim());
    $('#lkWarn').hidden = !kurang.length || (!k.trx.length && !adaSaldoAwal());
    if (!k.trx.length && !adaSaldoAwal()) {
      out.innerHTML = `<div class="empty-home"><b>Belum ada catatan keuangan</b><p>Catat uang masuk dan keluar di menu <a href="#keuangan">Keuangan</a>. Laporan akan tersusun otomatis di sini.</p><button class="btn" type="button" id="lkContoh">Lihat contoh laporan</button></div>`;
      $('#lkContoh').onclick = showContohLap;
      return;
    }
    const bln = want, L = H.laporanBulan(buku, bln), R = H.ringkasanBulan(buku, bln, Number(k.lk.n) || 3), lr = L.labaRugi, ak = L.arusKas, nr = L.neraca;
    const P = k.profil, last = `${akhirBulan(bln)} ${namaBulan(bln)}`;
    const neg = (v) => v ? `(${fmtRp(Math.abs(v))})` : fmtRp(0);
    const sgn = (v) => v < 0 ? `(${fmtRp(-v)})` : fmtRp(v);
    const row = (label, v, cls = '', fmt = sgn) => `<tr class="${cls}"><td>${label}</td><td class="n">${fmt(v)}</td></tr>`;
    const KN = (id) => KAT_ALL['keluar:' + id].nama;
    const pb = H.geserBulan(bln, -1), Lp = pb >= mulai ? H.laporanBulan(buku, pb) : null, nc = Lp ? 3 : 2;
    const lrow = (label, f, cls = '', fmt = sgn) => `<tr class="${cls}"><td>${label}</td><td class="n">${fmt(f(lr))}</td>${Lp ? `<td class="n pv">${fmt(f(Lp.labaRugi))}</td>` : ''}</tr>`;
    const bebanIds = Object.keys(lr.beban).filter(id => lr.beban[id] || (Lp && Lp.labaRugi.beban[id]));
    const ident = [['Nama usaha', P.namaUsaha], ['Nama pemilik', P.pemilik], ['Jenis usaha', P.jenis], ['Alamat', P.alamat], ['NIB', P.nib], ['Nomor HP', P.hp], ['Berdiri sejak', P.sejak]].filter(([, v], i) => i < 2 || v);
    const tglCetak = tglPanjang(today());
    const ratio = (x) => x === null ? '—' : x.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '×';
    const pinjamIni = L.k.pinjam, cicilIni = L.k.cicil;
    const asetRows = L.aset.map(a => `<tr><td>${esc(a.nama)}${a.dariAwal ? '' : ` <span class="rs">dibeli ${namaBulan(a.mulai)}</span>`}</td><td class="n">${fmtRp(a.biaya)}</td><td class="n">${fmtNum(a.umur)} th</td><td class="n">${fmtRp(a.sisa)}</td></tr>`).join('');
    const utRows = k.awal.utang.filter(u => Number(u.sisa) > 0).map(u => `<li>${esc(u.nama || 'Pinjaman')}: sisa pokok saat mulai mencatat ${fmtRp(Number(u.sisa))}.</li>`).join('');
    const trxBulan = k.trx.filter(t => t.tgl.startsWith(bln)).sort((a, b) => a.tgl.localeCompare(b.tgl));
    let no = 0;
    const catat = [];
    catat.push(`<li><b>Gambaran umum.</b> ${esc(P.namaUsaha || 'Usaha ini')} adalah usaha${P.jenis ? ' ' + esc(P.jenis.toLowerCase()) : ''} milik ${esc(P.pemilik || 'pemilik')}${P.alamat ? ', beralamat di ' + esc(P.alamat) : ''}${P.sejak ? ', berdiri sejak ' + esc(P.sejak) : ''}${P.nib ? ', NIB ' + esc(P.nib) : ''}.</li>`);
    catat.push(`<li><b>Dasar penyusunan.</b> Laporan disusun oleh pemilik usaha dari catatan transaksi harian menggunakan aplikasi HargaPas, mengacu pada SAK EMKM yang disederhanakan, dalam mata uang Rupiah. Pencatatan dimulai ${namaBulan(mulai)}. Laporan ini belum diaudit.</li>`);
    catat.push(`<li><b>Persediaan.</b> ${L.stokDiisi ? `Persediaan akhir bulan sebesar ${fmtRp(nr.persediaan)} berdasarkan perkiraan pemilik atas nilai bahan, kemasan, dan barang jadi yang tersisa.` : `Persediaan akhir bulan tidak dihitung ulang dan dianggap sama dengan awal bulan (${fmtRp(nr.persediaan)}).`}</li>`);
    if (nr.piutang || nr.utangUsaha) catat.push(`<li><b>Piutang dan utang usaha.</b> Penjualan dan pembelian dicatat pada tanggal terjadinya walaupun belum dibayar. Per ${last}, pembeli yang belum membayar ${fmtRp(nr.piutang)} dan bon yang belum dibayar ke pemasok ${fmtRp(nr.utangUsaha)}.</li>`);
    catat.push(`<li><b>Peralatan.</b> Disusutkan dengan metode garis lurus sesuai perkiraan umur pakai. Penyusutan bulan ini ${fmtRp(lr.penyusutan)}.${asetRows ? `<div class="tw"><table class="mini"><thead><tr><th>Peralatan</th><th class="n">Nilai perolehan</th><th class="n">Umur</th><th class="n">Nilai buku</th></tr></thead><tbody>${asetRows}</tbody></table></div>` : ' Tidak ada peralatan yang dicatat.'}</li>`);
    catat.push(`<li><b>Pinjaman.</b> ${utRows || pinjamIni || nr.utang ? `${utRows ? `<ul>${utRows}</ul>` : ''}Bulan ini diterima pinjaman ${fmtRp(pinjamIni)}, dibayar pokok ${fmtRp(cicilIni)} dan bunga/biaya ${fmtRp(L.k.bunga)}. Sisa pinjaman per ${last}: ${fmtRp(nr.utang)}.` : 'Usaha tidak memiliki pinjaman.'}</li>`);
    catat.push(`<li><b>Pengambilan pribadi (prive).</b> Uang usaha yang dipakai untuk keperluan pribadi bulan ini ${fmtRp(L.k.prive)}. Prive tidak dicatat sebagai beban.</li>`);
    if ((k.lk.catatan || '').trim()) catat.push(`<li><b>Keterangan tambahan.</b> ${esc(k.lk.catatan.trim()).replace(/\n/g, '<br>')}</li>`);
    out.innerHTML = (`
      <div class="kop"><div class="l"><img src="__ICON__" alt=""><div><b>HargaPas</b><span>by Universitas Terbuka Majene</span></div></div><div class="ut"><img src="__LOGO_UT__" alt="Logo Universitas Terbuka"></div></div>
      <div class="sure-strip kop-strip" aria-hidden="true"></div>
      <div class="lk-title"><h1>Laporan Keuangan</h1><div class="lk-ent">${esc(P.namaUsaha || 'Nama usaha belum diisi')}</div><div class="lk-per">Periode 1–${last}</div></div>
      <table class="ident"><tbody>${ident.map(([l, v]) => `<tr><td>${l}</td><td>${esc(v || '—')}</td></tr>`).join('')}</tbody></table>

      <h2><span class="no">1</span>Laporan Laba Rugi <small>untuk bulan yang berakhir ${last}</small></h2>
      <table class="fin${Lp ? ' cmp' : ''}">${Lp ? `<thead><tr><th></th><th class="n">${namaBulan(bln)}</th><th class="n">${namaBulan(Lp.bulan)}</th></tr></thead>` : ''}<tbody>
        ${lrow('Penjualan <span class="rs">pendapatan usaha</span>', x => x.penjualan, 'b')}
        <tr class="sub"><td colspan="${nc}">Harga pokok penjualan</td></tr>
        ${lrow('Persediaan awal', x => x.persAwal, 'ind')}
        ${lrow('Belanja bahan & kemasan', x => x.pembelian, 'ind')}
        ${lrow('Persediaan akhir', x => x.persAkhir, 'ind', neg)}
        ${lrow('Jumlah harga pokok penjualan', x => x.hpp, 'st', neg)}
        ${lrow('Laba kotor', x => x.labaKotor, 'tot')}
        ${lr.pendapatanLain || (Lp && Lp.labaRugi.pendapatanLain) ? lrow('Pendapatan lain-lain', x => x.pendapatanLain) : ''}
        <tr class="sub"><td colspan="${nc}">Beban usaha</td></tr>
        ${bebanIds.map(id => lrow(`${KN(id)} <span class="rs">${KAT_ALL['keluar:' + id].resmi}</span>`, x => x.beban[id], 'ind')).join('') || `<tr class="ind"><td>Tidak ada beban tunai</td><td class="n">Rp0</td>${Lp ? '<td class="n">Rp0</td>' : ''}</tr>`}
        ${lrow('Penyusutan peralatan', x => x.penyusutan, 'ind')}
        ${lrow('Jumlah beban usaha', x => x.bebanUsaha, 'st', neg)}
        ${lrow('Laba usaha', x => x.labaUsaha, 'tot')}
        ${lr.bunga || (Lp && Lp.labaRugi.bunga) ? lrow('Beban bunga & biaya pinjaman', x => x.bunga, '', neg) : ''}
        ${lr.pajak || (Lp && Lp.labaRugi.pajak) ? lrow('Pajak', x => x.pajak, '', neg) : ''}
        ${lrow(lr.laba < 0 ? 'RUGI BERSIH' : 'LABA BERSIH', x => x.laba, 'grand')}
      </tbody></table>

      <h2><span class="no">2</span>Laporan Arus Kas <small>metode langsung, bulan ${namaBulan(bln)}</small></h2>
      <table class="fin"><tbody>
        <tr class="sub"><td colspan="2">Arus kas dari kegiatan usaha</td></tr>
        ${row('Penerimaan dari pelanggan dan pemasukan lain', ak.masukOperasi, 'ind')}
        ${row('Pembayaran bahan & kemasan', ak.bayarBahan, 'ind', neg)}
        ${row('Pembayaran beban usaha', ak.bayarBeban, 'ind', neg)}
        ${L.kc.bunga ? row('Pembayaran bunga', L.kc.bunga, 'ind', neg) : ''}
        ${L.kc.pajak ? row('Pembayaran pajak', L.kc.pajak, 'ind', neg) : ''}
        ${row('Kas bersih dari kegiatan usaha', ak.operasi, 'st')}
        <tr class="sub"><td colspan="2">Arus kas dari kegiatan investasi</td></tr>
        ${row('Pembelian peralatan', L.kc.alat, 'ind', neg)}
        ${row('Kas bersih dari kegiatan investasi', ak.investasi, 'st')}
        <tr class="sub"><td colspan="2">Arus kas dari kegiatan pendanaan</td></tr>
        ${L.kc.modal ? row('Tambahan modal pemilik', L.kc.modal, 'ind') : ''}
        ${row('Penerimaan pinjaman', L.kc.pinjam, 'ind')}
        ${row('Pembayaran pokok pinjaman', L.kc.cicil, 'ind', neg)}
        ${row('Pengambilan pribadi (prive)', L.kc.prive, 'ind', neg)}
        ${row('Kas bersih dari kegiatan pendanaan', ak.pendanaan, 'st')}
        ${row(ak.naik < 0 ? 'Penurunan kas' : 'Kenaikan kas', ak.naik, 'tot')}
        ${row('Kas awal bulan', ak.kasAwal)}
        ${row('KAS AKHIR BULAN', ak.kasAkhir, 'grand')}
      </tbody></table>

      <h2><span class="no">3</span>Laporan Posisi Keuangan <small>per ${last}</small></h2>
      <div class="lk-2col">
        <table class="fin"><tbody>
          <tr class="sub"><td colspan="2">Aset</td></tr>
          ${row('Kas', nr.kas, 'ind')}
          ${nr.piutang ? row('Piutang usaha <span class="rs">pembeli belum bayar</span>', nr.piutang, 'ind') : ''}
          ${row('Persediaan', nr.persediaan, 'ind')}
          ${row('Peralatan (nilai perolehan)', nr.peralatanBiaya, 'ind')}
          ${row('Akumulasi penyusutan', nr.akumulasi, 'ind', neg)}
          ${row('JUMLAH ASET', nr.totalAset, 'grand')}
        </tbody></table>
        <table class="fin"><tbody>
          <tr class="sub"><td colspan="2">Liabilitas <span class="rs">utang</span></td></tr>
          ${nr.utangUsaha ? row('Utang usaha <span class="rs">bon ke pemasok</span>', nr.utangUsaha, 'ind') : ''}
          ${row('Utang pinjaman', nr.utang, 'ind')}
          ${row('Jumlah liabilitas', nr.totalLiabilitas, 'st')}
          <tr class="sub"><td colspan="2">Ekuitas <span class="rs">modal pemilik</span></td></tr>
          ${row('Modal awal', nr.modalAwal, 'ind')}
          ${nr.setoran ? row('Tambahan modal', nr.setoran, 'ind') : ''}
          ${row('Pengambilan pribadi (prive)', nr.prive, 'ind', neg)}
          ${row('Saldo laba s.d. bulan lalu', nr.labaLalu, 'ind')}
          ${row('Laba (rugi) bulan berjalan', nr.labaBulan, 'ind')}
          ${row('Jumlah ekuitas', nr.ekuitas, 'st')}
          ${row('JUMLAH LIABILITAS & EKUITAS', nr.totalPasiva, 'grand')}
        </tbody></table>
      </div>
      <p class="lk-check ${nr.seimbang ? 'ok' : 'bad'}">${nr.seimbang ? '✓ Seimbang: jumlah aset sama dengan jumlah liabilitas dan ekuitas.' : '⚠ Belum seimbang. Periksa kembali saldo awal.'}</p>

      <section class="pb">
      <h2><span class="no">4</span>Ringkasan ${R.n} Bulan <small>${namaBulan(R.bulan[0].bulan)} – ${namaBulan(bln)}</small></h2>
      ${svgChart(R.bulan)}
      <div class="tw"><table class="mini"><thead><tr><th>Bulan</th><th class="n">Pendapatan</th><th class="n">Beban & HPP</th><th class="n">Laba bersih</th><th class="n">Kas akhir</th></tr></thead><tbody>
        ${R.bulan.map(x => `<tr><td>${namaBulan(x.bulan)}</td><td class="n">${fmtRp(x.labaRugi.pendapatan)}</td><td class="n">${fmtRp(x.labaRugi.pendapatan - x.labaRugi.laba)}</td><td class="n">${sgn(x.labaRugi.laba)}</td><td class="n">${sgn(x.arusKas.kasAkhir)}</td></tr>`).join('')}
        <tr class="tot"><td>Jumlah</td><td class="n">${fmtRp(R.pendapatan)}</td><td class="n">${fmtRp(R.pendapatan - R.laba)}</td><td class="n">${sgn(R.laba)}</td><td class="n">—</td></tr>
      </tbody></table></div>
      <div class="lk-kpi">
        <div><span>Rata-rata pendapatan / bulan</span><b>${fmtRp(R.rataPendapatan)}</b></div>
        <div><span>Rata-rata laba bersih / bulan</span><b>${sgn(R.rataLaba)}</b></div>
        <div><span>Margin laba bersih</span><b>${fmtPct(R.marginLaba)}</b></div>
        <div><span>Kemampuan bayar angsuran</span><b>${ratio(R.kemampuanBayar)}</b></div>
      </div>
      <p class="lk-fn">Kemampuan bayar angsuran = (laba bersih + penyusutan + bunga) ÷ (cicilan pokok + bunga) selama periode ringkasan. Di atas 1× berarti hasil usaha cukup untuk membayar angsuran.${R.kemampuanBayar === null ? ' Tidak ada angsuran pada periode ini.' : ''}</p>

      <h2><span class="no">5</span>Catatan atas Laporan Keuangan</h2>
      <ol class="lk-notes">${catat.join('')}</ol>

      <div class="lk-sign">
        <p>Saya yang bertanda tangan di bawah ini menyatakan bahwa laporan keuangan ini disusun berdasarkan catatan usaha yang sebenarnya.</p>
        <div class="sg"><div>${esc(k.lk.kota || '..................')}, ${tglCetak}</div><div>Pemilik usaha,</div><div class="sg-space"></div><div class="sg-name">${esc(P.pemilik || '(.................................)')}</div></div>
      </div>
      </section>
      ${k.lk.lamp ? `<section class="pb"><h2>Lampiran: Daftar Transaksi ${namaBulan(bln)}</h2>
        <div class="tw"><table class="mini"><thead><tr><th>No</th><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th class="n">Masuk</th><th class="n">Keluar</th></tr></thead><tbody>
        ${trxBulan.map(t => `<tr><td>${++no}</td><td>${new Date(t.tgl + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</td><td>${esc((KAT_ALL[t.jenis + ':' + t.kat] || {}).nama || '')}</td><td>${esc(t.ket || '')}</td><td class="n">${t.jenis === 'masuk' ? fmtRp(Number(t.nominal)) : ''}</td><td class="n">${t.jenis === 'keluar' ? fmtRp(Number(t.nominal)) : ''}</td></tr>`).join('') || '<tr><td colspan="6">Tidak ada transaksi</td></tr>'}
        </tbody></table></div></section>` : ''}
      <div class="foot">Disusun oleh pemilik usaha berdasarkan catatan pribadi menggunakan HargaPas versi ${VERSION}, aplikasi gratis yang dikembangkan oleh Universitas Terbuka Majene. Laporan ini belum diaudit. Angka dalam kurung menunjukkan pengurang atau nilai negatif.</div>`);
  }
  function showContohLap(){
    const asli = state.kas, m = bulanIni(), ms = [-3, -2, -1].map(n => H.geserBulan(m, n));
    const tr = []; let id = 0; const t = (tgl, jenis, kat, nominal, ket) => tr.push({ id: 'c' + (++id), tgl, jenis, kat, nominal, ket });
    ms.forEach((b, i) => { const f = 1 + i * 0.07; t(b + '-05', 'masuk', 'jual', Math.round(8500000 * f), 'Penjualan abon'); t(b + '-03', 'keluar', 'bahan', Math.round(4800000 * f), 'Ikan, minyak, bumbu, kemasan'); t(b + '-10', 'keluar', 'upah', 1500000, '1 pekerja'); t(b + '-12', 'keluar', 'energi', 350000, ''); t(b + '-25', 'keluar', 'cicil', 500000, 'KUR'); t(b + '-25', 'keluar', 'bunga', 80000, 'KUR'); t(b + '-28', 'keluar', 'prive', 1200000, ''); });
    state.kas = { profil: { namaUsaha: 'Usaha Contoh Abon Ikan', pemilik: 'Nama Pemilik', jenis: 'Olahan hasil laut', alamat: 'Majene, Sulawesi Barat' }, awal: { bulan: ms[0], kas: 2000000, persediaan: 800000, peralatan: [{ nama: 'Kompor & wajan', nilai: 1800000, umur: 3 }], utang: [{ nama: 'KUR', sisa: 6000000 }], piutang: [], utangUsaha: [] }, trx: tr, stok: {}, lk: { n: 3, kota: 'Majene', catatan: '', lamp: false } };
    kMonth = ms[2];
    try { renderLapKeu(); } finally { state.kas = asli; kMonth = null; }
    $('#lapKeu').insertAdjacentHTML('afterbegin', '<div class="contoh-mark">CONTOH — data rekaan, bukan data Anda</div>');
    $('#lkWarn').hidden = true;
  }
  const lkSave = () => { const l = state.kas.lk; l.n = Number($('#lkN').value) || 3; l.kota = $('#lkKota').value; l.catatan = $('#lkCatatan').value; l.lamp = $('#lkLamp').checked; save(); renderLapKeu(); };
  ['#lkBulan', '#lkN', '#lkLamp'].forEach(s => $(s).addEventListener('change', lkSave));
  ['#lkKota', '#lkCatatan'].forEach(s => $(s).addEventListener('change', lkSave));
  $('#btnPrintKeu').addEventListener('click', () => printWithGuide(lkSave));

  // ----- panduan simpan PDF -----
  function printWithGuide(prep){
    const go = () => { closeOverlays(); prep(); setTimeout(() => window.print(), 60); };
    if (lsGet('hargapas.pdfguide') === '1') return go();
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    $('#pdfSteps').innerHTML = ios
      ? '<li>Tekan <b>Lanjut</b>.</li><li>Di layar pratinjau, tekan tombol <b>Bagikan</b> (kotak dengan panah ke atas).</li><li>Pilih <b>Simpan ke File</b> atau langsung kirim lewat <b>WhatsApp</b>.</li>'
      : '<li>Tekan <b>Lanjut</b>.</li><li>Di bagian <b>Printer / Tujuan</b>, pilih <b>Simpan sebagai PDF</b>.</li><li>Tekan tombol <b>PDF</b> atau <b>Simpan</b>. File tersimpan di folder <b>Download</b> dan bisa dikirim lewat WhatsApp atau dicetak di tempat fotokopi.</li>';
    $('#pdfGo').onclick = () => { if ($('#pdfNoShow').checked) lsSet('hargapas.pdfguide', '1'); go(); };
    openOverlay('pdfDlg');
  }
  $('#pdfCancel').addEventListener('click', closeOverlays);
  // ----- ekspor CSV (Excel) -----
  $('#btnCsv').addEventListener('click', () => {
    const rows = [['Tanggal', 'Jenis', 'Kategori', 'Istilah resmi', 'Keterangan', 'Masuk', 'Keluar', 'Status bayar', 'Tanggal lunas']];
    state.kas.trx.slice().sort((a, b) => a.tgl.localeCompare(b.tgl)).forEach(t => {
      const c = KAT_ALL[t.jenis + ':' + t.kat] || {};
      rows.push([t.tgl, t.jenis === 'masuk' ? 'Uang masuk' : 'Uang keluar', c.nama || t.kat, c.resmi || '', t.ket || '', t.jenis === 'masuk' ? t.nominal : '', t.jenis === 'keluar' ? t.nominal : '', t.tempo ? (t.lunasTgl ? 'Lunas' : 'Belum dibayar') : 'Tunai', t.lunasTgl || '']);
    });
    const csv = '\ufeff' + rows.map(r => r.map(v => { const x = String(v ?? ''); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'hargapas-transaksi-' + today() + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('File transaksi diunduh. Buka dengan Excel atau Google Sheets.');
  });
  // minta penyimpanan permanen agar data tidak dihapus browser
  try { if (navigator.storage && navigator.storage.persist && state.kas.trx.length) navigator.storage.persist(); } catch(e) {}

  // ---------- kirim masukan ----------
  (function(){
    const body = `\n\n---\nVersi HargaPas: ${VERSION}\nPerangkat: ${navigator.userAgent.slice(0, 160)}`;
    $('#lnkMasukan').href = 'mailto:rakasiwifajar@ecampus.ut.ac.id?subject=' + encodeURIComponent('Masukan HargaPas ' + VERSION) + '&body=' + encodeURIComponent('Tulis masukan Anda di sini:' + body);
  })();

  // ---------- start ----------
  if (embedded) { $$('[data-standalone]').forEach(el => el.hidden = true); $$('[data-embedded-only]').forEach(el => el.hidden = false); }
  hideSplash();
  setTs(lsGet('hargapas.ts') || '1');
  load(); setUi(state.ui || 'sederhana'); renderSelect(); route();
  if (lsGet(OBKEY) !== '1' && !location.hash.startsWith('#impor=')) startTour();
})();
