/* A small CSS reader. Not a parser in the real sense: it does not need to be.
   It needs to answer three questions honestly on minified files, where every
   stylesheet is one line and grep is useless:

     - what declarations exist, under which selector, inside which @media
     - what sizes are declared, and at what viewport they apply
     - what moves, and whether the movement is guarded

   Comments are stripped first because a commented-out rule is not a rule. */
import { readFileSync } from 'node:fs';

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
/* Block-less at-rules (@import, @charset, @namespace) end in a semicolon and
   would otherwise be swallowed into the next selector. */
const stripAtStatements = (s) => s.replace(/@(?:import|charset|namespace)[^;{}]*;/g, '');

/** Split a block into top-level chunks, respecting nesting and strings. */
function chunks(src) {
  const out = [];
  let depth = 0, start = 0, quote = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) { if (ch === quote && src[i - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') { depth--; if (depth === 0) { out.push(src.slice(start, i + 1)); start = i + 1; } }
  }
  return out.map((c) => c.trim()).filter(Boolean);
}

function splitRule(chunk) {
  const i = chunk.indexOf('{');
  return { head: chunk.slice(0, i).trim(), body: chunk.slice(i + 1, chunk.lastIndexOf('}')) };
}

function decls(body) {
  const out = [];
  let quote = null, depth = 0, cur = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) { cur += ch; if (ch === quote && body[i - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((d) => {
    const c = d.indexOf(':');
    if (c < 0) return null;
    return { prop: d.slice(0, c).trim().toLowerCase(), value: d.slice(c + 1).trim() };
  }).filter(Boolean);
}

/** Every declaration in a file, flattened, each carrying its media context. */
export function readRules(file) {
  const src = stripAtStatements(stripComments(readFileSync(file, 'utf8')));
  const out = [];
  const walk = (text, media) => {
    for (const chunk of chunks(text)) {
      const { head, body } = splitRule(chunk);
      if (head.startsWith('@media') || head.startsWith('@supports') || head.startsWith('@container')) {
        walk(body, media ? `${media} AND ${head}` : head);
      } else if (head.startsWith('@keyframes') || head.startsWith('@-webkit-keyframes')) {
        out.push({ file, selector: head, media, keyframes: true, decls: [] });
      } else if (head.startsWith('@')) {
        /* @font-face, @property, @charset: keep the declarations, they matter
           for the font gate. */
        out.push({ file, selector: head, media, decls: decls(body) });
      } else {
        out.push({ file, selector: head, media, decls: decls(body) });
      }
    }
  };
  walk(src, null);
  return out;
}

/** Media queries that only apply on a narrow screen. */
export const isPhoneMedia = (m) => {
  if (!m) return false;
  const mx = [...m.matchAll(/max-width\s*:\s*(\d+)px/g)].map((x) => +x[1]);
  return mx.some((v) => v <= 760);
};

export const PX = (v) => {
  const m = /^(-?[\d.]+)px$/.exec(v.replace(/\s*!important$/, '').trim());
  return m ? parseFloat(m[1]) : null;
};
