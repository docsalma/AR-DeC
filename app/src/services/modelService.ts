/**
 * 3D Model Service — Fetches free 3D models from Sketchfab
 * No API key needed for search. Models stream from Sketchfab CDN.
 * Zero phone storage required.
 */

export interface Model3D {
  uid: string;
  name: string;
  thumbnailUrl: string;
  embedUrl: string;
  viewerUrl: string;
  author: string;
}

const SKETCHFAB_API = 'https://api.sketchfab.com/v3';

// Educational keyword mapping — maps word categories to better 3D search terms
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  science: ['atom', 'molecule', 'dna', 'microscope', 'chemistry', 'cell', 'planet'],
  biology: ['cell', 'heart', 'brain', 'skeleton', 'plant', 'flower', 'dna'],
  geography: ['globe', 'earth', 'mountain', 'volcano', 'map', 'compass'],
  math: ['geometry', 'cube', 'sphere', 'pyramid', 'calculator'],
  history: ['castle', 'ancient', 'statue', 'temple', 'artifact'],
  technology: ['robot', 'computer', 'circuit', 'gear', 'satellite'],
  language: ['book', 'scroll', 'pen', 'letter', 'library'],
  default: ['book', 'star', 'crystal', 'gem', 'treasure'],
};

/**
 * Search Sketchfab for free 3D models matching a keyword.
 * No authentication needed for the search endpoint.
 */
export async function searchModels(query: string, count: number = 6): Promise<Model3D[]> {
  try {
    const params = new URLSearchParams({
      type: 'models',
      q: query,
      downloadable: 'true',
      sort_by: '-likeCount',
      count: String(count),
      animated: 'false',
    });

    const response = await fetch(`${SKETCHFAB_API}/search?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.results || [];

    return results.map((model: any) => ({
      uid: model.uid,
      name: model.name,
      thumbnailUrl: model.thumbnails?.images?.[0]?.url ?? '',
      embedUrl: `https://sketchfab.com/models/${model.uid}/embed?autostart=1&transparent=1&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&ui_infos=0`,
      viewerUrl: model.viewerUrl,
      author: model.user?.displayName ?? 'Unknown',
    }));
  } catch (error) {
    console.warn('Sketchfab search failed:', error);
    return [];
  }
}

/**
 * Get a relevant 3D model for a scanned word.
 * First tries the word itself, then falls back to category keywords.
 */
// ─── GLTF Models for AR Camera Overlay ─────────────────────────────────────
// Free models from KhronosGroup glTF-Sample-Assets (GitHub raw CDN)
const GLTF_CDN = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

const GLTF_MODEL_MAP: Record<string, { file: string; label: string }> = {
  duck:       { file: 'Duck/glTF-Binary/Duck.glb',                   label: 'Duck' },
  avocado:    { file: 'Avocado/glTF-Binary/Avocado.glb',             label: 'Avocado' },
  brain:      { file: 'BrainStem/glTF-Binary/BrainStem.glb',         label: 'Brain Stem' },
  box:        { file: 'BoxTextured/glTF-Binary/BoxTextured.glb',     label: 'Textured Box' },
  helmet:     { file: 'DamagedHelmet/glTF-Binary/DamagedHelmet.glb', label: 'Sci-Fi Helmet' },
  lantern:    { file: 'Lantern/glTF-Binary/Lantern.glb',             label: 'Lantern' },
  barramundi: { file: 'BarramundiFish/glTF-Binary/BarramundiFish.glb', label: 'Barramundi Fish' },
  suzanne:    { file: 'Suzanne/glTF/Suzanne.gltf',                   label: 'Suzanne (Monkey)' },
};

// Map educational categories to model keys
const CATEGORY_MODEL_MAP: Record<string, string> = {
  science: 'brain',
  biology: 'brain',
  nature: 'avocado',
  food: 'avocado',
  animal: 'duck',
  fish: 'barramundi',
  ocean: 'barramundi',
  water: 'barramundi',
  light: 'lantern',
  history: 'helmet',
  space: 'helmet',
  math: 'box',
  geometry: 'box',
};

export interface GltfModel {
  url: string;
  label: string;
  isProcedural: boolean;
}

/**
 * Get a GLTF model URL for a word — used by ARScene for camera overlay.
 * Exact match → category match → procedural box fallback.
 */
export function getGltfUrlForWord(word: string): GltfModel {
  const lower = word.toLowerCase();

  // Exact match against model map keys
  for (const [key, model] of Object.entries(GLTF_MODEL_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { url: `${GLTF_CDN}/${model.file}`, label: model.label, isProcedural: false };
    }
  }

  // Category match
  for (const [keyword, modelKey] of Object.entries(CATEGORY_MODEL_MAP)) {
    if (lower.includes(keyword)) {
      const model = GLTF_MODEL_MAP[modelKey];
      return { url: `${GLTF_CDN}/${model.file}`, label: model.label, isProcedural: false };
    }
  }

  // Fallback — signal to ARScene to render procedural geometry
  return { url: '', label: word, isProcedural: true };
}

export async function getModelForWord(word: string): Promise<Model3D | null> {
  // Try the word directly first
  let models = await searchModels(word + ' low poly', 3);

  // If no results, try educational category keywords
  if (models.length === 0) {
    const lowerWord = word.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => lowerWord.includes(k) || k.includes(lowerWord))) {
        models = await searchModels(category + ' education 3d', 3);
        break;
      }
    }
  }

  // Last fallback — get a generic educational model
  if (models.length === 0) {
    const fallback = CATEGORY_KEYWORDS.default;
    const randomKeyword = fallback[Math.floor(Math.random() * fallback.length)];
    models = await searchModels(randomKeyword + ' low poly', 3);
  }

  return models.length > 0 ? models[0] : null;
}
