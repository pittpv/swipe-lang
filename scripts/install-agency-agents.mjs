#!/usr/bin/env node
/**
 * Windows-friendly agency-agents installer for Cursor.
 * Converts agent .md files to .cursor/rules/*.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const vendor = path.join(root, '.vendor', 'agency-agents');
const rulesDir = path.join(root, '.cursor', 'rules');

const AGENT_DIRS = [
  'academic', 'design', 'engineering', 'finance', 'game-development', 'gis',
  'marketing', 'paid-media', 'product', 'project-management', 'sales', 'security',
  'spatial-computing', 'specialized', 'support', 'testing',
];

function getField(field, content) {
  const lines = content.split(/\r?\n/);
  let inFm = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      inFm = !inFm;
      continue;
    }
    if (inFm && line.startsWith(`${field}: `)) {
      return line.slice(field.length + 2);
    }
  }
  return '';
}

function getBody(content) {
  const lines = content.split(/\r?\n/);
  let fm = 0;
  const body = [];
  for (const line of lines) {
    if (line.trim() === '---') {
      fm++;
      continue;
    }
    if (fm >= 2) body.push(line);
  }
  return body.join('\n');
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isAgentFile(content) {
  return content.startsWith('---');
}

fs.mkdirSync(rulesDir, { recursive: true });

let count = 0;
for (const dir of AGENT_DIRS) {
  const dirPath = path.join(vendor, dir);
  if (!fs.existsSync(dirPath)) continue;

  for (const file of fs.readdirSync(dirPath).filter((f) => f.endsWith('.md')).sort()) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (!isAgentFile(content)) continue;

    const name = getField('name', content);
    const description = getField('description', content);
    if (!name) continue;

    const slug = slugify(name);
    const body = getBody(content);
    const mdc = `---
description: ${description}
globs: ""
alwaysApply: false
---
${body}
`;

    fs.writeFileSync(path.join(rulesDir, `${slug}.mdc`), mdc, 'utf8');
    count++;
  }
}

console.log(`[OK] Installed ${count} agency agent rules -> ${rulesDir}`);
