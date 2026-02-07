import { defineConfig } from 'vite';

export default defineConfig({
  base: './',

  build: {
    target: 'es2018',

    // ✅ 不压缩 = 不“混淆”
    minify: false,

    // ✅ CSS 也不压缩（可读）
    cssMinify: false,

    // ✅ sourcemap 可选：方便调试（建议开）
    sourcemap: true,

    // （可选）减少拆分，让输出更直观（single.html 内联也更干净）
    rollupOptions: {
      output: {
        // 尽量合并成一个 js chunk（不是必须，但更像“一个包”）
        manualChunks: undefined,
      },
    },
  },
});
