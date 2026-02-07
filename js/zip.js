import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import { buildCombinedTxt } from './selection.js';

/**
 * Zip contains ONLY ONE file:
 *   cheats/<buildId>.txt
 * Content equals selected cheat blocks.
 */
export async function buildSelectedZip({ buildId, selectedItems, includeName }) {
  const zip = new JSZip();

  const content = buildCombinedTxt({
    selectedItems,
    includeName,
  });

  // ✅ 放进 cheats 文件夹
  zip.file(`${buildId}/cheats/${buildId}.txt`, content);

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}
