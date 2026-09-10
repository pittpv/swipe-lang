import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');

export function loadLlmExamples(lang) {
  const file = join(root, `vocabulary-${lang}`, 'examples-llm.json');
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export function exampleFromLlmOr(fallback, map) {
  return (word) => {
    const hit = map[String(word.lemma || '').toLowerCase().trim()];
    if (hit?.example && hit?.translate) {
      return { example: hit.example, translate: hit.translate };
    }
    return fallback(word);
  };
}
