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
const engine = read('src/engine.js').toString();

function build(pwa) {
  let html = read('src/app.html').toString();
  html = html.replace('/*__ENGINE__*/', () => engine)
    .replace(/__ICON__/g, icon)
    .replace(/__LOGO_UT__/g, logoUT)
    .replace(/__VERSION__/g, VERSION);
  if (pwa) {
    html = html.replace('<!--__HEAD_EXTRA__-->',
      '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">')
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
