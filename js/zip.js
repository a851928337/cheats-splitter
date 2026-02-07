import JSZip from 'jszip';
import { buildCombinedTxt } from './selection.js';

/**
 * Zip contains ONLY ONE file:
 *   cheats/<buildId>.txt
 */
export async function buildSelectedZip({ buildId, selectedItems, includeName }) {
  const zip = new JSZip();

  const content = buildCombinedTxt({
    selectedItems,
    includeName,
  });

  zip.file(`${buildId}/cheats/${buildId}.txt`, content);

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}
