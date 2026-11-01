// Uji tampilan otomatis HargaPas (alur pengguna dari awal sampai akhir).
// Jalankan: node tools/build.js && node tests/e2e.js
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'dist', 'preview.html');
let lulus = 0;
const ok = (cond, msg) => { assert(cond, msg); lulus++; console.log('  ✓ ' + msg); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const text = async (s) => (await page.textContent(s)).replace(/\s+/g, ' ').trim();
  const rp = async (s) => Number((await text(s)).replace(/[^\d]/g, ''));

  // 1. Pengguna baru: panduan, pilih tampilan, beranda kosong
  await page.goto(URL);
  await page.waitForSelector('#onboard:not([hidden])');
  await page.click('#obNext'); await page.click('#obNext');
  await page.click('[data-obui=sederhana]');
  await page.waitForSelector('#tplDlg:not([hidden])');
  ok(await page.isVisible('#tplDlg'), 'pengguna baru langsung diajak membuat produk');
  ok((await page.$$('#tplGrid [data-tpl]')).length === 11, 'tersedia 11 template, termasuk 5 produk khas Majene');

  // 2. Template abon ayam
  await page.click('[data-tpl=abonayam]');
  await page.waitForFunction(() => location.hash === '#hitung');
  ok(await page.inputValue('#bn0') === 'Daging ayam', 'template abon ayam mengisi nama bahan');
  ok(await text('#checks') === '', 'belum ada peringatan sebelum pengguna mengisi');
  ok(await page.isVisible('#emptyRes'), 'kartu "hasil akan muncul" tampil saat kosong');

  // 3. Isi data sederhana
  await page.fill('#f_nama', 'Abon ayam uji');
  await page.fill('#f_hasil', '20');
  await page.fill('#bi0', '1'); await page.fill('#bh0', '40000'); await page.fill('#bp0', '2');
  for (let i = 1; i < (await page.$$('#bahanList details')).length; i++) {
    await page.click(`[data-del="1"]`);
  }
  await page.click('[data-next="2"]');
  await page.fill('#f_upah', '15000'); await page.fill('#f_jam', '4'); await page.fill('#f_kemasan', '2000');
  await page.click('[data-next="3"]');
  await page.fill('#f_batch', '8'); await page.fill('#f_gas', '80000');
  await page.waitForTimeout(500);
  // bahan 2 kg × 40.000 = 80.000/20 = 4.000; TK 60.000/20 = 3.000; kemasan 2.000; overhead 80.000/160 = 500 → 9.500
  ok(await rp('#outHPP .anum') === 9500, 'modal per bungkus dihitung benar (Rp9.500)');
  ok((await text('#kesMain')).startsWith('Jual Rp'), 'kesimpulan berupa kalimat');

  // 4. PPh final menaikkan harga
  const sebelum = await rp('#outPriceSimple .v');
  await page.check('#f_pph'); await page.waitForTimeout(300);
  const sesudah = await rp('#outPriceSimple .v');
  ok(sesudah >= sebelum, 'PPh final 0,5% ikut diperhitungkan di harga');
  await page.uncheck('#f_pph');

  // 5. Rencana sebulan
  await page.fill('#f_ru', '160'); await page.fill('#f_rt', '1000000'); await page.waitForTimeout(300);
  ok(/Rp/.test(await text('#outRencana')), 'rencana sebulan menampilkan omzet dan untung');

  // 6. Produk kedua memakai biaya bersama
  await page.click('#btnNew'); await page.click('[data-tpl=boncabe]');
  await page.waitForTimeout(200);
  await page.click('#secOH summary');
  await page.click('[data-oh=bersama]');
  await page.waitForTimeout(200);
  await page.selectOption('#prodSel', { index: 0 });
  await page.waitForTimeout(200);
  await page.evaluate(() => { document.querySelector('#secOH').open = true; });
  await page.click('[data-oh=bersama]');
  await page.waitForTimeout(400);
  ok((await text('#ohInfo')).includes('2 produk'), 'biaya bulanan dibagi ke 2 produk');
  ok(await rp('#outHPP .anum') === 9250, 'modal turun karena biaya gas dibagi rata (Rp9.250)');

  // 7. Beranda: kartu produk dan catat penjualan
  await page.click('nav.tabs a[data-view=beranda]');
  await page.waitForFunction(() => location.hash === '#beranda');
  await page.waitForSelector('.pcard');
  const nCard = (await page.$$('.pcard')).length;
  ok(nCard === 2, 'beranda menampilkan 2 kartu produk');
  await page.click('#btnCatat');
  await page.waitForSelector('#jualDlg:not([hidden])');
  const first = await page.$('[data-jual]'); await first.fill('10');
  await page.click('#jualSimpan');
  ok((await text('#outUsaha')).includes('10'), 'catatan penjualan masuk ke ringkasan bulan ini');

  // 8. Kartu harga bergambar
  await page.click('.pcard'); await page.waitForFunction(() => location.hash === '#hitung');
  await page.click('#btnKartu');
  await page.waitForSelector('#kartuDlg:not([hidden])', { timeout: 6000 });
  ok((await page.getAttribute('#kartuImg', 'src')).startsWith('data:image/png'), 'kartu harga dibuat sebagai gambar PNG');
  await page.click('#kartuClose');

  // 9. Halaman lain terbuka tanpa galat
  for (const v of ['bahan', 'lainnya', 'laporan', 'belajar', 'tentang', 'privasi', 'lembar']) {
    await page.goto(URL + '#' + v); await page.waitForTimeout(100);
    ok(await page.isVisible(`#view-${v}`), `halaman ${v} tampil`);
  }

  ok(errors.length === 0, 'tidak ada galat JavaScript' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(`\nSemua ${lulus} uji tampilan lulus.`);
})().catch((e) => { console.error('\nGAGAL:', e.message); process.exit(1); });
