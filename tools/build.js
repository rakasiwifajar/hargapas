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
const pita = (id) => `<svg class="pita" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="${id}P" width="38" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><image href="${sureEmas}" width="38" height="38"/></pattern>
    <linearGradient id="${id}E" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".45" stop-color="#C8922B"/><stop offset=".7" stop-color="#F7D77C"/><stop offset="1" stop-color="#8A5D14"/></linearGradient>
    <linearGradient id="${id}S" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="${id}G" x="-60%" y="-10%" width="220%" height="120%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <path d="M310 -40 C 90 160, 360 360, 190 520 S 70 820, 300 960" fill="none" stroke="#F2C55C" stroke-opacity=".35" stroke-width="90" filter="url(#${id}G)"/>
  <path d="M310 -40 C 90 160, 360 360, 190 520 S 70 820, 300 960" fill="none" stroke="url(#${id}E)" stroke-width="70" stroke-linecap="round"/>
  <path d="M310 -40 C 90 160, 360 360, 190 520 S 70 820, 300 960" fill="none" stroke="url(#${id}P)" stroke-width="56"/>
  <path d="M296 -40 C 76 160, 346 360, 176 520 S 56 820, 286 960" fill="none" stroke="url(#${id}S)" stroke-width="10" stroke-opacity=".9"/>
</svg>`;
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
