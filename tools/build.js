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
// Pita emas satin yang berpilin satu kali (dihitung dari garis tengah kurva Bezier)
const pita = (id) => {
  const P = [[372, -70], [70, 300], [380, 560], [120, 990]], W = 30, N = 90;
  const bz = (t) => { const u = 1 - t; return [0, 1].map(k => u*u*u*P[0][k] + 3*u*u*t*P[1][k] + 3*u*t*t*P[2][k] + t*t*t*P[3][k]); };
  const dz = (t) => { const u = 1 - t; return [0, 1].map(k => 3*u*u*(P[1][k]-P[0][k]) + 6*u*t*(P[2][k]-P[1][k]) + 3*t*t*(P[3][k]-P[2][k])); };
  const T0 = 0.52; // titik pilinan
  const edge = (a, b, sgn) => { const pts = []; for (let i = 0; i <= N; i++) { const t = a + (b - a) * i / N, c = bz(t), d = dz(t), L = Math.hypot(d[0], d[1]) || 1, n = [-d[1] / L, d[0] / L];
      const hw = Math.max(0.6, Math.abs(W * Math.sin(Math.PI / 2 * Math.min(1, Math.abs(t - T0) / 0.18))));
      pts.push([c[0] + sgn * n[0] * hw, c[1] + sgn * n[1] * hw]); } return pts; };
  const half = (a, b) => { const L = edge(a, b, 1), R = edge(a, b, -1).reverse(); return 'M' + L.concat(R).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z'; };
  const line = (a, b, sgn) => 'M' + edge(a, b, sgn).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const front = half(0, T0), back = half(T0, 1);
  const tw = bz(T0);
  return `<svg class="pita" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}F" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="330" y2="${tw[1].toFixed(0)}">
      <stop offset="0" stop-color="#B8862C"/><stop offset=".22" stop-color="#F6DC92"/><stop offset=".45" stop-color="#D2A447"/><stop offset=".7" stop-color="#FFF0C4"/><stop offset=".9" stop-color="#C08E33"/><stop offset="1" stop-color="#7C5414"/>
    </linearGradient>
    <linearGradient id="${id}K" gradientUnits="userSpaceOnUse" x1="300" y1="${tw[1].toFixed(0)}" x2="120" y2="900">
      <stop offset="0" stop-color="#5E3F0D"/><stop offset=".25" stop-color="#A57826"/><stop offset=".55" stop-color="#E4BE69"/><stop offset=".8" stop-color="#9A6E22"/><stop offset="1" stop-color="#6A470F"/>
    </linearGradient>
    <pattern id="${id}P" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><image href="${sureEmas}" width="40" height="40"/></pattern>
    <radialGradient id="${id}G" cx="${tw[0].toFixed(0)}" cy="${tw[1].toFixed(0)}" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF8E0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF8E0" stop-opacity="0"/></radialGradient>
    <filter id="${id}S" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <g transform="translate(14 20)" opacity=".5" filter="url(#${id}S)"><path d="${front}" fill="#020818"/><path d="${back}" fill="#020818"/></g>
  <path d="${back}" fill="url(#${id}K)"/>
  <path d="${front}" fill="url(#${id}F)"/>
  <path d="${front}" fill="url(#${id}P)" opacity=".16"/>
  <path d="${line(0, T0, 1)}" fill="none" stroke="#FFF3CF" stroke-width="1.4" stroke-opacity=".9"/>
  <path d="${line(0, T0, -1)}" fill="none" stroke="#6E4A10" stroke-width="1" stroke-opacity=".6"/>
  <path d="${line(T0, 1, 1)}" fill="none" stroke="#F3D58A" stroke-width="1" stroke-opacity=".6"/>
  <path d="${line(T0, 1, -1)}" fill="none" stroke="#FFF3CF" stroke-width="1.2" stroke-opacity=".5"/>
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
