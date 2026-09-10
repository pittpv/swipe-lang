function parseGloss(text) {
  const map = {};
  for (const line of text.trim().split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [lemma, pos, ru, example = '', exampleRu = ''] = line.split('|');
    if (!lemma || !ru) continue;
    const key = lemma.trim();
    if (map[key]) continue; // first (higher-frequency) sense wins
    map[key] = {
      pos: (pos || 'N').trim(),
      ru: ru.trim(),
      example: example.trim(),
      exampleRu: exampleRu.trim(),
    };
  }
  return map;
}

export function mergeGloss(...texts) {
  return Object.assign({}, ...texts.map(parseGloss));
}
