import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildPack, PACKS } from './scripts/generate-associations-enes.js';
import { glossStems, validateAssociation } from './scripts/lib/enes-association.js';
import { hydrateVocabulary } from './import-vocabulary.js';
import { db } from './database.js';
import { formatWord } from './session.js';

const root = dirname(fileURLToPath(import.meta.url));

test('gloss stems accept any inflection of the Russian meaning', () => {
  assert.ok(glossStems('нуждаться').includes('нужда'));
  assert.ok(glossStems('синий').includes('син'));
  assert.ok(glossStems('салат-латук').includes('латук'));
});

test('validator rejects a scene that forgets the hook or the meaning', () => {
  const word = { lemma: 'table', translation: 'стол' };
  const base = { kind: 'keyword', phonetic: 'тэ́йбл', hooks: ['таблица'] };
  assert.deepEqual(validateAssociation({ ...base, image: 'На столе лежит большая таблица.' }, word), []);
  assert.ok(validateAssociation({ ...base, image: 'В комнате лежит большая таблица.' }, word).includes('gloss'));
  assert.ok(validateAssociation({ ...base, image: 'На столе лежит большой атлас.' }, word).includes('hook-in-image'));
  assert.ok(validateAssociation({ ...base, phonetic: 'тэйбл' }, word).includes('stress'));
});

for (const lang of Object.keys(PACKS)) {
  test(`${lang} A1 banks validate against the dictionary and cover a contiguous prefix`, () => {
    const { entries, errors, stats } = buildPack(lang);
    assert.deepEqual(errors, []);
    assert.ok(stats.authored >= 250, `${lang} authored ${stats.authored}`);
    assert.ok(stats.keyword > 0 && stats.cognate > 0 && stats.usage > 0);

    const file = JSON.parse(readFileSync(join(root, 'data', PACKS[lang].dir, 'associations.json'), 'utf8'));
    assert.deepEqual(Object.keys(file).sort(), Object.keys(entries).sort(), 'run npm run generate:associations:enes');
  });
}

test('en and es A1 associations load through the shared import and reach the card', () => {
  hydrateVocabulary();
  const find = (pair, lemma) => db.data.words.find((w) => w.lang_pair === pair && w.lemma === lemma);

  const table = formatWord(find('en-ru', 'table'));
  assert.equal(table.association.kind, 'keyword');
  assert.deepEqual(table.association.hooks, ['таблица']);

  assert.equal(formatWord(find('en-ru', 'tourist')).association.kind, 'cognate');
  assert.equal(formatWord(find('en-ru', 'hello')).association.kind, 'usage');
  assert.equal(formatWord(find('es-ru', 'mesa')).association.kind, 'keyword');
  assert.equal(formatWord(find('es-ru', 'hotel')).association.kind, 'cognate');
  assert.equal(formatWord(find('es-ru', 'hola')).association.kind, 'usage');

  // Imported rows are marked curated so the vote threshold protects them.
  assert.equal(JSON.parse(find('en-ru', 'table').association).source, 'curated');
  // Turkish keeps working through the same path.
  assert.equal(formatWord(find('tr-ru', 'kitap')).association.kind, 'keyword');
});
