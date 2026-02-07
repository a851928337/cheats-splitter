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

function readDistFile(hrefOrSrc) {
  const rel = hrefOrSrc.replace(/^\.\//, '').replace(/^\/+/, '');
  const abs = path.join(distDir, rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing asset: ${rel}`);
  }
  return fs.readFileSync(abs, 'utf-8');
}

/* --------------------------------------------------
 * 1) 移除 modulepreload（单文件不需要）
 * -------------------------------------------------- */
html = html.replace(/<link\s+[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '');

/* --------------------------------------------------
 * 2) 内联所有 CSS
 *    匹配任意属性顺序的 <link rel="stylesheet" href="...">
 * -------------------------------------------------- */
html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (_match, href) => {
  const css = readDistFile(href);
  return `<!-- inline css: ${href} -->\n<style>\n${css}\n</style>`;
});

/* --------------------------------------------------
 * 3) 内联所有 module script
 * -------------------------------------------------- */
html = html.replace(
  /<script\s+[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
  (_match, src) => {
    const js = readDistFile(src);
    return `<!-- inline js: ${src} -->\n<script>\n${js}\n</script>`;
  }
);

/* --------------------------------------------------
 * 4) 移除 <base>（避免 file:// 下路径异常）
 * -------------------------------------------------- */
html = html.replace(/<base[^>]*>\s*/gi, '');

/* --------------------------------------------------
 * 5) 标记
 * -------------------------------------------------- */
html = html.replace(/<\/head>/i, `  <!-- generated: single.html (all js + css inlined, no minify) -->\n</head>`);

fs.writeFileSync(outPath, html, 'utf-8');

console.log('✅ single.html generated:', outPath);
