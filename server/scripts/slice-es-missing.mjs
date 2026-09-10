import { readFileSync, writeFileSync } from 'fs';

const rows = readFileSync('server/scripts/frequency-sources/es-missing.tsv', 'utf8')
  .trim()
  .split(/\n/)
  .map((l) => {
    const [rank, pos, tag, lemma] = l.split('\t');
    return { rank: +rank, pos, tag, lemma };
  })
  .filter((r) => r.rank <= 3500 && ['N', 'V', 'A', 'D', 'C', 'R', 'O', 'F'].includes(r.pos));

const skip = new Set([
  'madrid', 'barcelona', 'sevilla', 'valencia', 'bilbao', 'zaragoza', 'málaga', 'malaga',
  'murcia', 'palma', 'córdoba', 'cordoba', 'vigo', 'gijón', 'gijon', 'oviedo', 'granada',
  'psoe', 'eta', 'aznar', 'zapatero', 'rajoy', 'franco', 'felipe', 'juan', 'carlos',
  'josé', 'jose', 'maría', 'maria', 'pedro', 'luis', 'antonio', 'francisco', 'manuel',
  'eeuu', 'otan', 'ue', 'pib', 'iva', 'csi', 'pp', 'ciu', 'iu', 'bildu',
  'cataluña', 'catalunya', 'euskadi', 'galicia', 'andalucía', 'andalucia',
  'castilla', 'aragon', 'aragón', 'navarra', 'asturias', 'cantabria', 'extremadura',
]);

const kept = rows.filter((r) => !skip.has(r.lemma));
writeFileSync(
  'server/scripts/frequency-sources/es-to-translate.tsv',
  kept.map((r) => `${r.rank}\t${r.pos}\t${r.lemma}`).join('\n'),
  'utf8',
);
console.log('spanish to translate', kept.length);
