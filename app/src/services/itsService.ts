import type { Explanation, BloomsLevel, StudentLevel } from '../models/types';

// In-memory cache for explanations
const cache = new Map<string, Explanation>();

function bloomsForMastery(mastery: number): BloomsLevel {
  if (mastery < 0.2) return 'remember';
  if (mastery < 0.4) return 'understand';
  if (mastery < 0.6) return 'apply';
  if (mastery < 0.8) return 'analyze';
  return 'evaluate';
}

function levelToComplexity(level: StudentLevel): string {
  switch (level) {
    case 'beginner':
      return 'simple, using basic vocabulary';
    case 'explorer':
      return 'moderate, with some academic terms';
    case 'scholar':
      return 'detailed, with technical language';
    case 'master':
      return 'advanced, with nuanced analysis';
  }
}

async function fetchFromDictionary(
  word: string,
  bloomsLevel: BloomsLevel,
): Promise<Explanation> {
  const fallback: Explanation = {
    definition: `Definition not available for '${word}'.`,
    examples: [],
    relatedConcepts: [],
    bloomsLevel,
    source: 'local',
  };

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!response.ok) return fallback;

    const data = await response.json();
    const entry = data[0];
    if (!entry?.meanings?.length) return fallback;

    // Collect all definitions, examples, and synonyms across meanings
    const allDefinitions: string[] = [];
    const allExamples: string[] = [];
    const allSynonyms: string[] = [];

    for (const meaning of entry.meanings) {
      for (const def of meaning.definitions ?? []) {
        if (def.definition) allDefinitions.push(def.definition);
        if (def.example) allExamples.push(def.example);
      }
      for (const syn of meaning.synonyms ?? []) {
        if (!allSynonyms.includes(syn)) allSynonyms.push(syn);
      }
    }

    // Adapt output based on Bloom's level
    let definition: string;
    let examples: string[];
    let relatedConcepts: string[];

    switch (bloomsLevel) {
      case 'remember':
        definition = allDefinitions[0] ?? fallback.definition;
        examples = [];
        relatedConcepts = [];
        break;
      case 'understand':
        definition = allDefinitions[0] ?? fallback.definition;
        examples = allExamples.slice(0, 2);
        relatedConcepts = [];
        break;
      default:
        // apply, analyze, evaluate — full detail
        definition = allDefinitions.join(' | ');
        examples = allExamples;
        relatedConcepts = allSynonyms.slice(0, 10);
        break;
    }

    return {
      definition,
      examples,
      relatedConcepts,
      bloomsLevel,
      source: 'api',
    };
  } catch {
    return fallback;
  }
}

export async function getExplanation(
  word: string,
  context: string,
  studentLevel: StudentLevel,
  mastery: number = 0,
): Promise<Explanation> {
  const bloomsLevel = bloomsForMastery(mastery);
  const cacheKey = `${word}:${studentLevel}:${bloomsLevel}`;

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const explanation = await fetchFromDictionary(word, bloomsLevel);

  cache.set(cacheKey, explanation);
  return explanation;
}

export function buildPrompt(
  word: string,
  context: string,
  level: StudentLevel,
  bloomsLevel: BloomsLevel,
): string {
  const complexity = levelToComplexity(level);
  return [
    `Define the word "${word}" as used in this context: "${context}".`,
    `Explanation should be ${complexity}.`,
    `Target Bloom's level: ${bloomsLevel}.`,
    bloomsLevel === 'remember'
      ? 'Provide a clear definition and one example.'
      : bloomsLevel === 'understand'
        ? 'Explain the meaning and provide 2 examples showing usage.'
        : bloomsLevel === 'apply'
          ? 'Explain how to use this word in different contexts.'
          : 'Analyze how this word connects to related concepts.',
  ].join('\n');
}

export function clearCache(): void {
  cache.clear();
}
