import { PLACEHOLDER } from './config.js';
import { extractBuildIdFromFilename, parseCheats } from './parser.js';
import { buildCheatItems, applyFilter, setAll, getSelected, renderCheatList } from './selection.js';
import { buildSelectedZip } from './zip.js';
import { createExpander } from './expand.js';

export function initUI() {
  const els = {
    themeBtn: document.getElementById('themeBtn'),
    buildId: document.getElementById('buildId'),
    fileInput: document.getElementById('fileInput'),
    cheatText: document.getElementById('cheatText'),
    dropZone: document.getElementById('dropZone'),
    includeName: document.getElementById('includeName'),
    clearBtn: document.getElementById('clearBtn'),
    zipBtn: document.getElementById('zipBtn'),
    status: document.getElementById('status'),

    // expand
    expandTextBtn: document.getElementById('expandTextBtn'),
    expandBlocksBtn: document.getElementById('expandBlocksBtn'),
    cheatPanel: document.getElementById('cheatPanel'),

    // list controls
    cheatList: document.getElementById('cheatList'),
    cheatCount: document.getElementById('cheatCount'),
    filterInput: document.getElementById('filterInput'),
    refreshListBtn: document.getElementById('refreshListBtn'),
    masterCheck: document.getElementById('masterCheck'),

    // ✅ 新增
    applyToFiltered: document.getElementById('applyToFiltered'),
  };

  const expander = createExpander();

  // internal state
  let allItems = [];
  let filteredItems = [];
  let lastToggledRenderIndex = null; // ✅ Shift 范围选择的锚点（基于“当前渲染列表”的索引）

  // placeholder init
  els.cheatText.value = PLACEHOLDER;

  els.cheatText.addEventListener('focus', () => {
    if (els.cheatText.value.trim() === PLACEHOLDER.trim()) els.cheatText.value = '';
  });
  els.cheatText.addEventListener('blur', () => {
    if (!els.cheatText.value.trim()) els.cheatText.value = PLACEHOLDER;
  });

  // expand
  els.expandTextBtn.addEventListener('click', () => {
    if (expander.isOpen()) return expander.close();
    expander.open({ node: els.cheatText, title: 'Cheat Text' });
  });

  els.expandBlocksBtn.addEventListener('click', () => {
    if (expander.isOpen()) return expander.close();
    expander.open({ node: els.cheatPanel, title: 'Cheat Blocks' });
  });

  // filter
  els.filterInput.addEventListener('input', () => {
    // 过滤变化后，Shift 锚点容易变乱，清掉更安全
    lastToggledRenderIndex = null;
    refreshView(true);
  });

  // refresh list
  els.refreshListBtn.addEventListener('click', () => {
    lastToggledRenderIndex = null;
    refreshFromText(true);
  });

  // apply scope toggle: 更新 master 三态展示（不改选择）
  els.applyToFiltered.addEventListener('change', () => {
    updateHeaderCountsAndMaster();
  });

  // master checkbox：勾上=全选，取消=全不选（按 scope 决定作用范围）
  els.masterCheck.addEventListener('change', () => {
    const checked = els.masterCheck.checked;
    const scopeItems = getScopeItems();

    setAll(scopeItems, checked);
    refreshListUI(); // 不需要重新 parse，只更新 UI
  });

  // file picker
  els.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      els.cheatText.value = content;

      const maybe = extractBuildIdFromFilename(file.name);
      if (!els.buildId.value.trim()) els.buildId.value = maybe;

      lastToggledRenderIndex = null;
      refreshFromText(true);
      setStatus(`Loaded: ${file.name}`, 'ok');
    } catch (err) {
      setStatus('Error: ' + (err?.message || String(err)), 'err');
    } finally {
      els.fileInput.value = '';
    }
  });

  // drag-drop
  ['dragenter', 'dragover'].forEach((evt) => {
    els.dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    els.dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.dropZone.classList.remove('dragover');
    });
  });

  els.dropZone.addEventListener('drop', async (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      els.cheatText.value = content;

      const maybe = extractBuildIdFromFilename(file.name);
      if (!els.buildId.value.trim()) els.buildId.value = maybe;

      lastToggledRenderIndex = null;
      refreshFromText(true);
      setStatus(`Loaded: ${file.name}`, 'ok');
    } catch (err) {
      setStatus('Error: ' + (err?.message || String(err)), 'err');
    }
  });

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  // clear
  els.clearBtn.addEventListener('click', () => {
    els.buildId.value = '';
    els.cheatText.value = PLACEHOLDER;
    els.filterInput.value = '';
    els.includeName.checked = true;
    els.applyToFiltered.checked = true;

    allItems = [];
    filteredItems = [];
    lastToggledRenderIndex = null;
    refreshListUI();

    setStatus('');
  });

  // Generate ZIP: only selected blocks
  els.zipBtn.addEventListener('click', async () => {
    const buildId = els.buildId.value.trim();
    const txt = els.cheatText.value.trim();
    const includeName = els.includeName.checked;

    const validation = validateInput(buildId, txt);
    if (!validation.ok) return setStatus(validation.msg, 'err');

    if (!allItems.length) refreshFromText(false);

    const selected = getSelected(allItems);
    if (!selected.length) return setStatus('Error: No cheat blocks selected.', 'err');

    try {
      const blob = await buildSelectedZip({
        buildId,
        selectedItems: selected,
        includeName,
      });

      const outName = `${buildId}_selected.zip`;
      downloadBlob(blob, outName);

      setStatus(
        `Success: Packed ${selected.length}/${allItems.length} blocks.\nDownloaded: ${outName}\n(Zip contains: ${buildId}.txt)`,
        'ok'
      );
    } catch (err) {
      setStatus('Error: ' + (err?.message || String(err)), 'err');
    }
  });

  // initial
  refreshListUI();
  return els;

  // ---------- helpers ----------
  function getScopeItems() {
    // ✅ scope：全选是否只作用于过滤结果
    return els.applyToFiltered.checked ? filteredItems : allItems;
  }

  function refreshFromText(keepStatus) {
    const txt = els.cheatText.value.trim();
    if (!txt || txt === PLACEHOLDER.trim()) {
      allItems = [];
      filteredItems = [];
      refreshListUI();
      if (!keepStatus) setStatus('');
      return;
    }

    const cheats = parseCheats(txt);
    allItems = buildCheatItems(cheats); // 默认全选
    refreshView(keepStatus);
  }

  function refreshView(keepStatus) {
    const k = els.filterInput.value || '';
    filteredItems = applyFilter(allItems, k);
    refreshListUI();
    if (!keepStatus) setStatus('');
  }

  function updateHeaderCountsAndMaster() {
    const selectedAll = getSelected(allItems).length;
    els.cheatCount.textContent = `${allItems.length} blocks — selected ${selectedAll}`;

    const scopeItems = getScopeItems();
    const selectedScope = scopeItems.filter((x) => x.checked).length;

    if (!scopeItems.length) {
      els.masterCheck.checked = false;
      els.masterCheck.indeterminate = false;
      return;
    }

    if (selectedScope === 0) {
      els.masterCheck.checked = false;
      els.masterCheck.indeterminate = false;
    } else if (selectedScope === scopeItems.length) {
      els.masterCheck.checked = true;
      els.masterCheck.indeterminate = false;
    } else {
      els.masterCheck.checked = false;
      els.masterCheck.indeterminate = true;
    }
  }

  function refreshListUI() {
    updateHeaderCountsAndMaster();

    renderCheatList({
      container: els.cheatList,
      items: filteredItems,
      onToggle: (id, checked, meta) => {
        const it = allItems.find((x) => x.id === id);
        if (!it) return;

        const shiftKey = !!meta?.shiftKey;
        const renderIndex = typeof meta?.renderIndex === 'number' ? meta.renderIndex : null;

        // ✅ Shift 范围选择：基于“当前过滤后的渲染顺序”
        if (shiftKey && renderIndex !== null && lastToggledRenderIndex !== null) {
          const a = Math.min(lastToggledRenderIndex, renderIndex);
          const b = Math.max(lastToggledRenderIndex, renderIndex);

          for (let i = a; i <= b; i++) {
            const itemInView = filteredItems[i];
            if (itemInView) itemInView.checked = checked;
          }
        } else {
          // 普通单项切换
          it.checked = checked;
        }

        // 更新锚点（只在我们确实知道当前 renderIndex 时更新）
        if (renderIndex !== null) lastToggledRenderIndex = renderIndex;

        updateHeaderCountsAndMaster();
        // 这里不强制全量重渲染，checkbox 自己已经变了；
        // 但 Shift 范围选择会改多项，需要刷新列表来同步显示
        if (shiftKey && renderIndex !== null && lastToggledRenderIndex !== null) {
          renderAllAgainPreserveScroll();
        }
      },
    });
  }

  function renderAllAgainPreserveScroll() {
    const scroller = els.cheatList;
    const top = scroller.scrollTop;
    // 重新渲染
    renderCheatList({
      container: els.cheatList,
      items: filteredItems,
      onToggle: (id, checked, meta) => {
        // 复用同一个 handler，避免重复逻辑：直接调用 refreshListUI 会递归
        // 所以这里走一次“本地逻辑”：
        const it = allItems.find((x) => x.id === id);
        if (!it) return;

        const shiftKey = !!meta?.shiftKey;
        const renderIndex = typeof meta?.renderIndex === 'number' ? meta.renderIndex : null;

        if (shiftKey && renderIndex !== null && lastToggledRenderIndex !== null) {
          const a = Math.min(lastToggledRenderIndex, renderIndex);
          const b = Math.max(lastToggledRenderIndex, renderIndex);
          for (let i = a; i <= b; i++) {
            const itemInView = filteredItems[i];
            if (itemInView) itemInView.checked = checked;
          }
        } else {
          it.checked = checked;
        }

        if (renderIndex !== null) lastToggledRenderIndex = renderIndex;

        updateHeaderCountsAndMaster();
        if (shiftKey) renderAllAgainPreserveScroll();
      },
    });
    scroller.scrollTop = top;
  }

  function validateInput(buildId, txt) {
    if (!buildId) return { ok: false, msg: 'Error: No Build ID detected or entered.' };
    if (!txt || txt === PLACEHOLDER.trim()) return { ok: false, msg: 'Error: Cheat text is empty.' };
    const cheats = parseCheats(txt);
    if (!cheats.length) return { ok: false, msg: 'Error: No valid cheat blocks found.' };
    return { ok: true };
  }

  function setStatus(msg, type = '') {
    els.status.className = 'status' + (type ? ' ' + type : '');
    els.status.textContent = msg || '';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
