import { setupThemeToggle } from './theme.js';
import { initUI } from './ui.js';

function boot() {
  const els = initUI();
  setupThemeToggle({ buttonEl: els.themeBtn, rootEl: document.body });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
