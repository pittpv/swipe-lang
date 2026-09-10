/** RFC 4180 field escaping. */
export function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function csvRow(fields) {
  return fields.map(csvEscape).join(',');
}

export const POS = {
  N: 'İSİMLER',
  V: 'FİİLLER',
  A: 'SIFATLAR',
  D: 'ZARFLAR',
  R: 'ZAMİRLER',
  C: 'EDATLAR / BAĞLAÇLAR',
  F: 'KALIP İFADELER',
  O: 'DİĞER KELİMELER',
};

export function expandPos(code) {
  return POS[code] || code;
}
