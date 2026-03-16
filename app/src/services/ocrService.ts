/**
 * OCR Service — dual engine:
 * - Web: Tesseract.js (free, runs in browser, 100+ languages)
 * - Native: react-native-mlkit-ocr (on-device Google ML Kit)
 *
 * Singleton worker pooling for Tesseract (web).
 * Throws OcrError on engine failures.
 */
import { Platform } from 'react-native';

// ─── OcrError ────────────────────────────────────────────────────────────────

export class OcrError extends Error {
  code: 'INVALID_URI' | 'ENGINE_FAILED' | 'WORKER_INIT_FAILED';

  constructor(message: string, code: OcrError['code']) {
    super(message);
    this.name = 'OcrError';
    this.code = code;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TextBlock {
  text: string;
  cornerPoints: { x: number; y: number }[];
  lines: { text: string; cornerPoints: { x: number; y: number }[] }[];
}

export interface TokenizedWord {
  text: string;
  context: string;
  position: { x: number; y: number };
}

// ─── Singleton Tesseract Worker ──────────────────────────────────────────────

let tesseractWorker: any | null = null;
let workerInitPromise: Promise<any> | null = null;

/**
 * Pre-warm the Tesseract worker at app startup (web only).
 * Safe to call multiple times — only initialises once.
 */
export async function initOcrWorker(): Promise<void> {
  if (Platform.OS !== 'web') return;
  await getOrCreateWorker();
}

async function getOrCreateWorker(): Promise<any> {
  if (tesseractWorker) return tesseractWorker;

  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    try {
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng');
      tesseractWorker = worker;
      return worker;
    } catch (error) {
      workerInitPromise = null;
      throw new OcrError(
        `Failed to initialise Tesseract worker: ${error instanceof Error ? error.message : String(error)}`,
        'WORKER_INIT_FAILED',
      );
    }
  })();

  return workerInitPromise;
}

// ─── URI Validation ──────────────────────────────────────────────────────────

function validateWebUri(uri: string): void {
  if (!uri) {
    throw new OcrError('Image URI is empty.', 'INVALID_URI');
  }
  const isDataUrl = uri.startsWith('data:image/');
  const isBlobUrl = uri.startsWith('blob:');
  const isHttpUrl = uri.startsWith('http://') || uri.startsWith('https://');
  if (!isDataUrl && !isBlobUrl && !isHttpUrl) {
    throw new OcrError(
      `Invalid image URI for web OCR. Expected data:image/*, blob:, or http(s) URL but got: ${uri.slice(0, 60)}`,
      'INVALID_URI',
    );
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Scan image for text — automatically picks the right engine.
 * Throws OcrError on engine failure; returns [] if no text found.
 */
export async function scanImage(uri: string): Promise<TextBlock[]> {
  if (Platform.OS === 'web') {
    return scanWithTesseract(uri);
  }
  return scanWithMlKit(uri);
}

// ─── Web: Tesseract.js ─────────────────────────────────────────────────────

async function scanWithTesseract(uri: string): Promise<TextBlock[]> {
  validateWebUri(uri);

  const worker = await getOrCreateWorker();

  try {
    const { data } = await worker.recognize(uri);

    // Convert Tesseract output to our TextBlock format
    // Use 'as any' for Tesseract's dynamic result structure
    const result = data as any;
    const paragraphs: any[] = result.paragraphs ?? [];
    const allLines: any[] = result.lines ?? [];

    if (paragraphs.length === 0 && result.text) {
      // Fallback: treat entire text as one block
      const lines = result.text.split('\n').filter((l: string) => l.trim());
      return [{
        text: result.text.trim(),
        cornerPoints: [],
        lines: lines.map((l: string) => ({
          text: l.trim(),
          cornerPoints: [],
        })),
      }];
    }

    return paragraphs.map((para: any) => ({
      text: (para.text ?? '').trim(),
      cornerPoints: para.bbox
        ? [
            { x: para.bbox.x0, y: para.bbox.y0 },
            { x: para.bbox.x1, y: para.bbox.y0 },
            { x: para.bbox.x1, y: para.bbox.y1 },
            { x: para.bbox.x0, y: para.bbox.y1 },
          ]
        : [],
      lines: allLines
        .filter((line: any) =>
          para.bbox && line.bbox &&
          line.bbox.y0 >= para.bbox.y0 &&
          line.bbox.y1 <= para.bbox.y1 + 5,
        )
        .map((line: any) => ({
          text: (line.text ?? '').trim(),
          cornerPoints: line.bbox
            ? [
                { x: line.bbox.x0, y: line.bbox.y0 },
                { x: line.bbox.x1, y: line.bbox.y1 },
              ]
            : [],
        })),
    }));
  } catch (error) {
    // If it's already an OcrError, rethrow
    if (error instanceof OcrError) throw error;

    console.error('Tesseract OCR error:', error);

    // Worker may be in a bad state — reset singleton so next call creates a fresh one
    try { await worker.terminate(); } catch {}
    tesseractWorker = null;
    workerInitPromise = null;

    throw new OcrError(
      `Tesseract OCR engine failed: ${error instanceof Error ? error.message : String(error)}`,
      'ENGINE_FAILED',
    );
  }
}

// ─── Native: ML Kit ─────────────────────────────────────────────────────────

async function scanWithMlKit(uri: string): Promise<TextBlock[]> {
  try {
    const MlkitOcr = (await import('react-native-mlkit-ocr')).default;
    const result = await MlkitOcr.detectFromUri(uri);

    return result.map((block) => ({
      text: block.text,
      cornerPoints: block.bounding
        ? [
            { x: block.bounding.left, y: block.bounding.top },
            { x: block.bounding.left + block.bounding.width, y: block.bounding.top },
            { x: block.bounding.left + block.bounding.width, y: block.bounding.top + block.bounding.height },
            { x: block.bounding.left, y: block.bounding.top + block.bounding.height },
          ]
        : [],
      lines: block.lines.map((line) => ({
        text: line.text,
        cornerPoints: line.bounding
          ? [
              { x: line.bounding.left, y: line.bounding.top },
              { x: line.bounding.left + line.bounding.width, y: line.bounding.top + line.bounding.height },
            ]
          : [],
      })),
    }));
  } catch (error) {
    if (error instanceof OcrError) throw error;

    throw new OcrError(
      `ML Kit OCR engine failed: ${error instanceof Error ? error.message : String(error)}`,
      'ENGINE_FAILED',
    );
  }
}

/**
 * Extract individual words from OCR text blocks.
 */
export function extractWords(blocks: TextBlock[]): TokenizedWord[] {
  const words: TokenizedWord[] = [];

  for (const block of blocks) {
    const fullText = block.text;
    for (const line of block.lines) {
      const lineWords = line.text.split(/\s+/).filter((w) => w.length > 1);
      const midPoint =
        line.cornerPoints.length >= 2
          ? {
              x: (line.cornerPoints[0].x + line.cornerPoints[1].x) / 2,
              y: (line.cornerPoints[0].y + line.cornerPoints[1].y) / 2,
            }
          : { x: 0, y: 0 };

      for (const word of lineWords) {
        const cleaned = word.replace(/[^\w'-]/g, '');
        if (cleaned.length > 1) {
          words.push({
            text: cleaned.toLowerCase(),
            context: fullText,
            position: midPoint,
          });
        }
      }
    }
  }

  return words;
}
