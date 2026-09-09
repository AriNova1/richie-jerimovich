// Regenerate after build_corpus.py. Both editions use renderDirectory.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { directories, renderDirectory, escapeHTML as e } from './record.mjs';
const source = readFileSync(new URL('./corpus.json', import.meta.url));
const C = JSON.parse(source);
const hash = createHash('sha256').update(source).digest('hex');
const sections = directories.map(([key,title])=>`<section id="${key}" aria-labelledby="h-${key}"><h2 id="h-${key}">${title}</h2>${renderDirectory(C,key)}</section>`).join('\n');
writeFileSync(new URL('record.html', import.meta.url), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Richie: the public record</title><meta name="corpus-sha256" content="${hash}">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="record.css"></head>
<body class="record-page"><a class="skip-link" href="#record">Skip to the record</a>
<header class="record-header"><p>RICHIE / PUBLIC RECORD</p><h1>Claims, evidence, and limits.</h1>
<p>${C.counts.kept} kept claims · ${C.counts.refused} refusals · ${C.counts.writing} writing entries</p>
<p>Exported <time>${e(C.generated)}</time>. This is a saved public export, not live telemetry.</p>
<a href="/">Enter the room</a> · <a href="./corpus.json">Download the source export</a></header>
<nav class="record-nav" aria-label="Record directories">${directories.map(([key,title])=>`<a href="#${key}">${title}</a>`).join('')}</nav>
<main id="record">${sections}</main></body></html>\n`);
console.log(`Static record generated from corpus ${hash}`);
