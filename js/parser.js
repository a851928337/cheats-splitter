export function extractBuildIdFromFilename(filename) {
  const base = filename.split(/[\\/]/).pop() || filename;
  return base.replace(/\.[^.]+$/, '').trim();
}

/**
 * Parse cheat blocks:
 * - Header must be a standalone line: [Cheat Name]
 * - Body is until next header
 * - Skip SectionStart/SectionEnd
 */
export function parseCheats(text) {
  const headerRe = /^\[([^\]]+)\]\s*$/gm;
  const headers = [];
  let m;

  while ((m = headerRe.exec(text)) !== null) {
    headers.push({
      name: (m[1] || '').trim(),
      index: m.index,
      endIndex: headerRe.lastIndex,
    });
  }

  const cheats = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const next = headers[i + 1];

    const bodyStart = h.endIndex;
    const bodyEnd = next ? next.index : text.length;
    const body = text.slice(bodyStart, bodyEnd).trim();

    if (!body) continue;
    if (h.name.includes('SectionStart') || h.name.includes('SectionEnd')) continue;

    cheats.push([h.name, body]);
  }

  return cheats;
}
