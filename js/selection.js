export function buildCheatItems(cheats) {
  return cheats.map(([name, body], idx) => ({
    id: String(idx),
    name,
    body,
    checked: true, // 默认全选
  }));
}

export function applyFilter(items, keyword) {
  const k = (keyword || '').trim().toLowerCase();
  if (!k) return items;
  return items.filter((it) => it.name.toLowerCase().includes(k));
}

export function setAll(items, checked) {
  for (const it of items) it.checked = checked;
}

export function getSelected(items) {
  return items.filter((it) => it.checked);
}

/**
 * 优化点：
 * - 点击整行切换勾选
 * - checkbox 点击不会触发两次
 * - 支持键盘：Tab 聚焦到行，Space/Enter 切换
 * - 支持 Shift+点击：把 shiftKey + 当前 renderIndex 透传给 UI
 */
export function renderCheatList({ container, items, onToggle }) {
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = `<div class="cheatItem"><div class="muted">No cheat blocks.</div></div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach((it, renderIndex) => {
    const row = document.createElement('div');
    row.className = 'cheatItem';
    row.tabIndex = 0;
    row.setAttribute('role', 'checkbox');
    row.setAttribute('aria-checked', String(!!it.checked));

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!it.checked;
    cb.className = 'cheatItemCheck';

    cb.addEventListener('click', (e) => {
      // 防止 checkbox click 冒泡导致整行 click 再切一次
      e.stopPropagation();
    });

    cb.addEventListener('change', (e) => {
      row.setAttribute('aria-checked', String(cb.checked));
      onToggle(it.id, cb.checked, {
        shiftKey: !!e.shiftKey,
        renderIndex,
      });
    });

    const main = document.createElement('div');
    main.className = 'cheatItemMain';

    const name = document.createElement('div');
    name.className = 'cheatItemName';
    name.textContent = it.name;

    const meta = document.createElement('div');
    meta.className = 'cheatItemMeta';
    meta.textContent = `Lines: ${countLines(it.body)}`;

    const preview = document.createElement('div');
    preview.className = 'cheatItemBodyPreview';
    preview.textContent = makePreview(it.body);

    main.appendChild(name);
    main.appendChild(meta);
    main.appendChild(preview);

    // 整行点击：切换 checkbox（并把 shiftKey 传出去）
    row.addEventListener('click', (e) => {
      cb.checked = !cb.checked;
      // 这里用 change 事件统一走 onToggle（带 shiftKey）
      const ev = new Event('change', { bubbles: true });
      // 不能直接给 Event 写 shiftKey，所以我们走手动调用 onToggle：
      row.setAttribute('aria-checked', String(cb.checked));
      onToggle(it.id, cb.checked, { shiftKey: !!e.shiftKey, renderIndex });
    });

    // 键盘：Space/Enter 切换
    row.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        cb.checked = !cb.checked;
        row.setAttribute('aria-checked', String(cb.checked));
        onToggle(it.id, cb.checked, { shiftKey: !!e.shiftKey, renderIndex });
      }
    });

    row.appendChild(cb);
    row.appendChild(main);
    frag.appendChild(row);
  });

  container.appendChild(frag);
}

export function buildCombinedTxt({ selectedItems, includeName }) {
  const parts = [];
  for (const it of selectedItems) {
    if (includeName) parts.push(`[${it.name}]\n${it.body}`.trimEnd());
    else parts.push(`${it.body}`.trimEnd());
  }
  return parts.join('\n\n') + '\n';
}

function countLines(s) {
  const t = (s || '').trim();
  if (!t) return 0;
  return t.split(/\r?\n/).length;
}

function makePreview(body) {
  const lines = (body || '').split(/\r?\n/).filter(Boolean);
  return lines.slice(0, 2).join('\n') + (lines.length > 2 ? '\n...' : '');
}
