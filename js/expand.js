export function createExpander() {
  let overlay = null;
  let current = null; // { node, placeholder }

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlayCard" role="dialog" aria-modal="true">
        <div class="overlayTop">
          <div id="overlayTitle" style="font-weight:700;font-size:13px;"></div>
          <button class="btn mini" id="overlayCloseBtn">收起</button>
        </div>
        <div class="overlayBody" id="overlayBody"></div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    overlay.querySelector('#overlayCloseBtn').addEventListener('click', close);

    document.body.appendChild(overlay);
    return overlay;
  }

  function open({ node, title }) {
    const ov = ensureOverlay();
    if (current) close();

    const body = ov.querySelector('#overlayBody');
    const t = ov.querySelector('#overlayTitle');

    const placeholder = document.createElement('div');
    placeholder.style.height = `${node.getBoundingClientRect().height}px`;
    placeholder.style.borderRadius = '14px';
    placeholder.style.border = '1px dashed var(--border)';
    placeholder.style.background = 'rgba(0,0,0,0.03)';

    node.parentNode.insertBefore(placeholder, node);

    body.appendChild(node);
    t.textContent = title || 'Expanded';

    ov.classList.add('open');
    current = { node, placeholder };
  }

  function close() {
    if (!current) return;
    const ov = ensureOverlay();
    const { node, placeholder } = current;

    placeholder.parentNode.insertBefore(node, placeholder);
    placeholder.remove();

    ov.classList.remove('open');
    current = null;
  }

  function isOpen() {
    return !!current;
  }

  return { open, close, isOpen };
}
