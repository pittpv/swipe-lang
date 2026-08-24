import { importVocabulary } from './import-vocabulary.js';

const replace = process.argv.includes('--replace');
const stats = importVocabulary({ replace });
console.log(`Seeded ${stats.total} words (TR→RU). Added ${stats.added} new.`);
