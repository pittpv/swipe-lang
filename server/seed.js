import { importVocabulary } from './import-vocabulary.js';

const replace = process.argv.includes('--replace');
const stats = importVocabulary({ replace });
const packSummary = Object.entries(stats.packs || {})
  .map(([pair, info]) => `${pair}:${info.unique}`)
  .join(', ');
console.log(`Seeded ${stats.total} words (${packSummary || 'no packs'}). Added ${stats.added} new.`);
