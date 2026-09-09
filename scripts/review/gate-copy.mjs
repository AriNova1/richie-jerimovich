/* ── COPY GATE ───────────────────────────────────────────────────────────
   What a machine can check about writing, and what it cannot.

   It CAN catch: em dashes, the filler vocabulary, the four or five sentence
   shapes that a language model reaches for when it has nothing to say, and
   frame violations (any sentence that gives Richie a body, hands, a chair,
   or a possession in a room that is Rick's).

   It CANNOT tell you whether a sentence is pulling the right string. That is
   the Editor's seat, and the gate says so out loud rather than pretending
   the checklist is the judgement.
   ─────────────────────────────────────────────────────────────────────── */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/* Sentence shapes a model produces when it is performing having a thought. */
const TELLS = [
  [/\bit'?s not just [^.,;]{2,40}, it'?s\b/i, 'the "not just X, it\'s Y" pivot'],
  [/\bin a world where\b/i, '"in a world where"'],
  [/\bwhether you'?re\b[^.]{0,60}\bor\b/i, 'the "whether you\'re A or B" address'],
  [/\bat the end of the day\b/i, '"at the end of the day"'],
  [/\bthe truth is\b/i, '"the truth is" (announcing candour instead of being candid)'],
  [/\blet'?s (dive|dig) in\b/i, '"let\'s dive in"'],
  [/\bthink of it (as|like)\b/i, '"think of it as"'],
  [/\bmore than just\b/i, '"more than just"'],
  [/\bthat'?s where [a-z ]{2,20} comes in\b/i, '"that\'s where X comes in"'],
  [/\bunlock(ing)? (the|your|its)\b/i, '"unlock"'],
  [/\bharness(ing)? the (power|potential)\b/i, '"harness the power"'],
  [/\bseamless(ly)?\b/i, '"seamless"'],
  [/\bleverage\b/i, '"leverage" as a verb'],
  [/\bdelve\b/i, '"delve"'],
  [/\bembark on\b/i, '"embark on"'],
  [/\bjourney\b(?! ?nav| ?stop)/i, '"journey" as a metaphor'],
  [/\belevate (your|the)\b/i, '"elevate your"'],
  [/\bgame[- ]chang(er|ing)\b/i, '"game changer"'],
  [/\bcutting[- ]edge\b/i, '"cutting edge"'],
  [/\bstate of the art\b/i, '"state of the art" as a self-description'],
];

/* Hedges that carry no information. A hedge that carries real uncertainty is
   fine; these are the ones that only soften. */
const FILLER = [
  [/\bsimply\b/i, '"simply"'], [/\bjust (click|open|press|type|go)\b/i, 'minimising "just"'],
  [/\bof course\b/i, '"of course"'], [/\bobviously\b/i, '"obviously"'],
  [/\bactually\b/i, '"actually"'], [/\bbasically\b/i, '"basically"'],
  [/\bvery unique\b/i, '"very unique"'], [/\bin order to\b/i, '"in order to"'],
];

/* The frame. Richie has no body and owns nothing in the room. */
const FRAME = [
  [/\b(?:I|Richie)\s+(?:sat|sits|sit down|sat down|stood|stands|walked|walks|reached for|picked up|picks up|put down|leaned|leans)\b/i,
   'gives Richie a body or a physical action'],
  [/\bmy\s+(?:desk|chair|room|apartment|keyboard|monitor|screen|shelf|journal|notebook|coffee|window|wall|floor)\b/i,
   'gives Richie a physical possession (the room is Rick\'s)'],
  [/\b(?:the desk is yours|take a seat|sit down at the desk|sit at the desk|come on in|pull up a chair|make yourself at home|have a seat|settle in)\b/i,
   'invites the reader into a room that is not theirs and not Richie\'s'],
  [/\bRichie'?s (?:desk|room|apartment|chair|keyboard|monitor)\b/i,
   'assigns Rick\'s furniture to Richie'],
];

/* One agent. The cast is dead; records may quote it, live copy may not. */
const CAST = /\b(?:five voices|the loyalist|the researcher|the risk officer|the operator|the witness)\b/i;

export const EM_DASH = /—/;

/* Strings a reader actually sees. HTML text nodes, attribute copy that is
   read aloud or shown, and JS template/quoted literals that end up in the
   DOM. Deliberately over-collects: a false positive costs one look, a missed
   line ships. */
function visibleStrings(file) {
  const src = readFileSync(file, 'utf8');
  const ext = extname(file);
  const out = [];
  /* A curly apostrophe is the same word to a reader and a different string to
     a regex. "You're at Richie's desk." sat on the Notes app through a full
     gate run because the pattern had a straight quote in it. Normalise. */
  const push = (text, line) => {
    const t = text.trim().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    if (t.length > 2) out.push({ text: t, line });
  };
  const lineOf = (idx) => src.slice(0, idx).split('\n').length;

  if (ext === '.html' || ext === '.md' || ext === '.markdown') {
    let body = src.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    /* front matter is metadata, but title/description ship */
    for (const m of body.matchAll(/>([^<>]{3,})</g)) push(m[1], lineOf(m.index));
    for (const m of body.matchAll(/(?:alt|title|aria-label|placeholder|content)="([^"]{3,})"/g)) push(m[1], lineOf(m.index));
    if (ext !== '.html') for (const m of body.matchAll(/^[^<\n][^\n]{3,}$/gm)) push(m[0], lineOf(m.index));
  } else {
    /* A comment is not visible copy. Without this the gate flagged a comment
       explaining a frame fix as the frame violation it was describing. */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
    for (const m of code.matchAll(/`([^`\\$]{4,})`|'([^'\\\n]{4,})'|"([^"\\\n]{4,})"/g)) {
      const s = m[1] ?? m[2] ?? m[3];
      /* selectors, urls, css, ids: not copy */
      if (/^[.#$]|^https?:|^\/|[{};]|^[a-z-]+$|^[A-Za-z0-9_-]+\.[a-z]{2,4}$|^\w+\/|px$|^data-/.test(s)) continue;
      if (!/\s/.test(s)) continue;                       // single tokens are code
      if (/^[a-z-]+ [a-z-]+$/.test(s) && s.length < 24) continue;  // class lists
      push(s, lineOf(m.index));
    }
  }
  return out;
}

/* A record of what was written is not live copy. Journal entries from May
   carry the retired cast and the old habits, and editing them to match
   today's rules would be falsifying the record. The exemption is the point:
   see tests/one-richie.test.mjs, which draws the same line. */
export const isRecord = (f) => /record\.html$|corpus\.json$|journal\.json$|^_journal\/|\/_journal\/|\.test\.mjs$/.test(f);

export function gateCopy(files) {
  const findings = [];
  for (const file of files) {
    if (isRecord(file)) continue;
    for (const { text, line } of visibleStrings(file)) {
      const at = `${file}:${line}`;
      if (EM_DASH.test(text)) findings.push({ gate: 'copy', severity: 'high', what: 'em dash in visible copy', where: at, quote: text.slice(0, 90) });
      for (const [re, name] of FRAME) if (re.test(text)) findings.push({ gate: 'copy', severity: 'stop-ship', what: `frame: ${name}`, where: at, quote: text.slice(0, 110) });
      if (CAST.test(text)) findings.push({ gate: 'copy', severity: 'stop-ship', what: 'names the retired cast', where: at, quote: text.slice(0, 110) });
      for (const [re, name] of TELLS) if (re.test(text)) findings.push({ gate: 'copy', severity: 'high', what: `model tell: ${name}`, where: at, quote: text.slice(0, 110) });
      for (const [re, name] of FILLER) if (re.test(text)) findings.push({ gate: 'copy', severity: 'low', what: `filler: ${name}`, where: at, quote: text.slice(0, 110) });
      if (/!(?!\[|=|important|\))/.test(text) && /[a-z]!/.test(text)) findings.push({ gate: 'copy', severity: 'low', what: 'exclamation mark', where: at, quote: text.slice(0, 90) });
    }
  }
  return findings;
}

export function walk(dir, exts, skip = /node_modules|_site|\.git|\.concept-preview|__pycache__/) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (skip.test(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, exts, skip));
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targets = process.argv.slice(2);
  const files = targets.flatMap((t) => (statSync(t).isDirectory() ? walk(t, ['.html', '.mjs', '.js', '.md']) : [t]));
  const f = gateCopy(files);
  const order = { 'stop-ship': 0, high: 1, low: 2 };
  f.sort((a, b) => order[a.severity] - order[b.severity]);
  for (const x of f) console.log(`[${x.severity}] ${x.what}\n    ${x.where}\n    "${x.quote}"`);
  console.log(`\n${f.length} finding(s) · ${f.filter((x) => x.severity === 'stop-ship').length} stop-ship`);
  console.log(`\nThis gate cannot tell you whether a sentence pulls the right string.\nThat is the Editor's seat. See .review/STANDARD.md.`);
}
