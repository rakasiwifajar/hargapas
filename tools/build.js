// Menggabungkan src/ menjadi index.html satu file (dan dist/preview.html tanpa PWA).
// Jalankan: node tools/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p));
const pkg = JSON.parse(read('package.json'));
const VERSION = pkg.version;

const dataUri = (p, type) => `data:${type};base64,${read(p).toString('base64')}`;
const icon = dataUri('assets/icon.svg', 'image/svg+xml');
const logoUT = dataUri('assets/logo-ut.webp', 'image/webp');
const sure = dataUri('assets/sure.svg', 'image/svg+xml');
const sureEmas = dataUri('assets/sure-emas.svg', 'image/svg+xml');
// Pita emas bermotif sure' yang meliuk (dipakai di layar pembuka dan sambutan beranda)
const pita = (id) => {
  const d = 'M310 -40 C 90 160, 360 360, 190 520 S 70 820, 300 960';
  return `<svg class="pita" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="${id}P" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><image href="${sureEmas}" width="44" height="44"/></pattern>
    <linearGradient id="${id}R" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="360" y2="900">
      <stop offset="0" stop-color="#7A5313"/><stop offset=".08" stop-color="#F7DE8E"/><stop offset=".16" stop-color="#A8771F"/>
      <stop offset=".27" stop-color="#FFF2C4"/><stop offset=".38" stop-color="#9C6B1C"/><stop offset=".5" stop-color="#E9C062"/>
      <stop offset=".6" stop-color="#7E5514"/><stop offset=".72" stop-color="#FBE6A6"/><stop offset=".84" stop-color="#A27420"/><stop offset="1" stop-color="#F0CF7A"/>
    </linearGradient>
    <linearGradient id="${id}T" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="900">
      <stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".14" stop-color="#000" stop-opacity="0"/>
      <stop offset=".24" stop-color="#fff" stop-opacity=".22"/><stop offset=".36" stop-color="#000" stop-opacity=".35"/>
      <stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".6" stop-color="#fff" stop-opacity=".18"/>
      <stop offset=".74" stop-color="#000" stop-opacity=".4"/><stop offset=".88" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
    </linearGradient>
    <filter id="${id}S" x="-60%" y="-10%" width="220%" height="120%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="${id}H" x="-60%" y="-10%" width="220%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <radialGradient id="${id}B"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".85"/><stop offset=".35" stop-color="#FFE7A0" stop-opacity=".35"/><stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- bayangan jatuh -->
  <path d="${d}" transform="translate(16 22)" fill="none" stroke="#020818" stroke-opacity=".55" stroke-width="74" filter="url(#${id}S)"/>
  <!-- bingkai logam: tepi gelap, kilau emas, alur dalam -->
  <path d="${d}" fill="none" stroke="#3A2606" stroke-width="72"/>
  <path d="${d}" fill="none" stroke="url(#${id}R)" stroke-width="68"/>
  <path d="${d}" fill="none" stroke="#2A1A04" stroke-width="56"/>
  <!-- ukiran sure' -->
  <path d="${d}" fill="none" stroke="url(#${id}P)" stroke-width="53"/>
  <!-- bayangan lipatan (kesan meliuk 3D) -->
  <path d="${d}" fill="none" stroke="url(#${id}T)" stroke-width="72"/>
  <!-- kilau tepi -->
  <path d="M302 -40 C 82 160, 352 360, 182 520 S 62 820, 292 960" fill="none" stroke="#FFF4CF" stroke-opacity=".7" stroke-width="2.2" filter="url(#${id}H)"/>
  <!-- titik cahaya di lekukan -->
  <circle cx="231" cy="255" r="42" fill="url(#${id}B)" opacity=".85"/>
  <circle cx="95" cy="748" r="34" fill="url(#${id}B)" opacity=".6"/>
</svg>`;
};
const engine = read('src/engine.js').toString();
const css = read('src/app.css').toString();
const appJs = read('src/app.js').toString();

function build(pwa) {
  let html = read('src/app.html').toString();
  html = html.replace('/*__CSS__*/', () => css).replace('/*__APP__*/', () => appJs).replace('/*__ENGINE__*/', () => engine)
    .replace(/__ICON__/g, icon)
    .replace(/__LOGO_UT__/g, logoUT)
    .replace(/<!--__PITA:(\w+)-->/g, (m, id) => pita(id))
    .replace(/__SURE_EMAS__/g, sureEmas)
    .replace(/__SURE__/g, sure)
    .replace(/__VERSION__/g, VERSION);
  if (pwa) {
    html = html.replace('<!--__HEAD_EXTRA__-->',
      '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" sizes="48x48" href="icons/favicon-48.png">\n<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="HargaPas">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">')
      .replace('<!--__BODY_EXTRA__-->',
      "<script>\nif ('serviceWorker' in navigator && location.protocol === 'https:') {\n  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));\n}\n</script>");
  } else {
    html = html.replace('<!--__HEAD_EXTRA__-->', '').replace('<!--__BODY_EXTRA__-->', '');
  }
  return html;
}

fs.writeFileSync(path.join(root, 'index.html'), build(true));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'preview.html'), build(false));

// Samakan versi cache service worker dengan versi aplikasi.
const swPath = path.join(root, 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8').replace(/const VERSI = '[^']*';/, `const VERSI = 'hargapas-v${VERSION}';`);
fs.writeFileSync(swPath, sw);

console.log(`Build selesai: index.html & dist/preview.html (versi ${VERSION})`);
