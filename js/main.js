import { setupThemeToggle } from './theme.js';
import { initUI } from './ui.js';

const els = initUI();
setupThemeToggle({ buttonEl: els.themeBtn, rootEl: document.body });
