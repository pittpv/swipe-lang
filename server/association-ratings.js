/** One vote per user per word. A repeat of the same vote clears it. */
export function applyAssociationVote(rows, entry) {
  const list = Array.isArray(rows) ? rows : [];
  const index = list.findIndex(
    (row) => row.user_id === entry.user_id && row.word_id === entry.word_id,
  );
  if (entry.vote == null) {
    if (index >= 0) list.splice(index, 1);
    return list;
  }
  const next = {
    ...(index >= 0 ? list[index] : { id: entry.id }),
    user_id: entry.user_id,
    word_id: entry.word_id,
    lemma: entry.lemma,
    lang_pair: entry.lang_pair,
    hook: entry.hook || '',
    image: entry.image || '',
    vote: entry.vote,
    updated_at: entry.updated_at,
  };
  if (index >= 0) list[index] = next;
  else list.push(next);
  return list;
}

/** Group votes so the admin can see which associations people reject. */
export function summarizeAssociationRatings(rows) {
  const groups = new Map();
  let up = 0;
  let down = 0;
  for (const row of rows ?? []) {
    if (row.vote !== 'up' && row.vote !== 'down') continue;
    const key = `${row.lang_pair || ''}\n${String(row.lemma || '').toLowerCase()}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        lemma: row.lemma,
        langPair: row.lang_pair || '',
        hook: row.hook || '',
        image: row.image || '',
        up: 0,
        down: 0,
        updatedAt: row.updated_at || '',
      };
      groups.set(key, group);
    }
    group[row.vote] += 1;
    if (row.vote === 'up') up += 1;
    else down += 1;
    if (String(row.updated_at || '') >= group.updatedAt) {
      group.updatedAt = row.updated_at || group.updatedAt;
      if (row.hook) group.hook = row.hook;
      if (row.image) group.image = row.image;
    }
  }
  const list = [...groups.values()].map((group) => {
    const total = group.up + group.down;
    return {
      ...group,
      total,
      likeRate: total ? Math.round((100 * group.up) / total) : null,
    };
  });
  list.sort((a, b) => (a.likeRate ?? 101) - (b.likeRate ?? 101) || b.down - a.down || b.total - a.total);
  return { totals: { up, down, words: list.length }, rows: list };
}
