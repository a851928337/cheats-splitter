import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const distHtmlPath = path.join(distDir, 'index.html');
const outPath = path.join(root, 'single.html');

if (!fs.existsSync(distHtmlPath)) {
  throw new Error('dist/index.html not found. Run `npm run build` first.');
}

let html = fs.readFileSync(distHtmlPath, 'utf-8');

// 把引用的 css/js 读出来并内联
function readDistFile(relOrAbs) {
  const rel = relOrAbs.replace(/^\.\//, '').replace(/^\/+/, '');
  const abs = path.join(distDir, rel);
  return fs.readFileSync(abs, 'utf-8');
}

// 1) 内联所有 css link
// 匹配：<link rel="stylesheet" href="./assets/xxx.css">
html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (_m, href) => {
  const css = readDistFile(href);
  return `<style>\n${css}\n</style>`;
});

// 2) 内联所有 module script
// 匹配：<script type="module" crossorigin src="./assets/xxx.js"></script>
// 或： <script type="module" src="./assets/xxx.js"></script>
html = html.replace(/<script\s+type="module"[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g, (_m, src) => {
  const js = readDistFile(src);
  return `<script>\n${js}\n</script>`;
});

// 3) 可选：移除 base tag（如果存在）
html = html.replace(/<base[^>]*>/g, '');

// 4) 给 single.html 加个标记注释
html = html.replace(/<\/head>/, `  <!-- generated: single.html (all js/css inlined) -->\n</head>`);

fs.writeFileSync(outPath, html, 'utf-8');

console.log('✅ single.html generated:', outPath);
