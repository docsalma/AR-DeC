import { chromium } from 'playwright';
import { resolve } from 'path';
import { mkdirSync, readFileSync } from 'fs';

const pdfPath = resolve('D:/Wproject/AR-DeC/article2/main.pdf');
const outDir = resolve('D:/Wproject/AR-DeC/article2/review');
mkdirSync(outDir, { recursive: true });

// Read PDF as base64
const pdfBase64 = readFileSync(pdfPath).toString('base64');

const html = `<!DOCTYPE html>
<html><head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs" type="module"></script>
<style>
  body { margin: 0; background: #525659; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; }
  canvas { box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white; }
  .page-label { color: white; font-family: sans-serif; font-size: 14px; }
</style>
</head><body>
<script type="module">
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs';

  const pdfData = Uint8Array.from(atob('${pdfBase64}'), c => c.charCodeAt(0));
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const label = document.createElement('div');
    label.className = 'page-label';
    label.textContent = 'Page ' + i + ' / ' + totalPages;
    document.body.appendChild(label);

    const canvas = document.createElement('canvas');
    canvas.id = 'page-' + i;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
  window.__pdfDone = true;
</script>
</body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 1800 } });
const page = await context.newPage();

await page.setContent(html, { waitUntil: 'networkidle' });

// Wait for pdf.js to finish rendering all pages
await page.waitForFunction(() => window.__pdfDone === true, { timeout: 60000 });
await page.waitForTimeout(2000);

// Get total page count
const totalPages = await page.evaluate(() => document.querySelectorAll('canvas').length);
console.log(`PDF has ${totalPages} pages`);

// Screenshot key pages by scrolling each canvas into view
const keyPages = [1, 2, 12, 13, 14, 19, 20, 21, 22, 23, 24, 25, 28, 33];
for (const num of keyPages) {
  if (num > totalPages) continue;
  const canvas = await page.$(`#page-${num}`);
  if (canvas) {
    await canvas.screenshot({ path: resolve(outDir, `page-${String(num).padStart(2,'0')}.png`) });
    console.log(`Captured page ${num}`);
  }
}

await browser.close();
console.log(`\nDone. Screenshots saved to: ${outDir}`);
