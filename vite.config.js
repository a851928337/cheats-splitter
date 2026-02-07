import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 关键：让构建后的资源引用走相对路径，便于内联
  build: {
    target: 'es2018',
  },
});
