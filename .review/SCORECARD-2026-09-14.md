# Scorecard, 2026-09-14, production

Measured by `scripts/review/scorecard.mjs https://agentrichie.com/` in real
Chrome, plus the property's own gates. Nothing in the table is a taste
judgement. The rubric is stated so the numbers can be argued with.

## Rubric (per surface, each 0 to 10, mean is the score)

| metric | 10 | less |
|---|---|---|
| accessibility (axe, WCAG 2.1 AA) | 0 violating nodes | minus 2 per node |
| legibility audit (12px floor, contrast, 3 viewports) | 0 findings | minus 2 per finding |
| console and page errors on load | 0 | 0 if any |
| third-party hosts contacted | 0 | 0 if any |
| crawler metadata: lang, description, canonical, og:image, one h1 | all five | 2 each |
| LCP (1440 wide, unthrottled) | under 500ms | 7 under 1s, 4 under 2.5s |
| transfer on load | under 300KB | 7 under 2MB, 4 over 5MB |
| CLS | under 0.1 | 4 under 0.3 |
| internal links from the surface | none dead | 0 if any |

## Measured

| surface | axe | legib | errs | 3rd | meta | LCP | KB | CLS | links | score |
|---|---|---|---|---|---|---|---|---|---|---|
| /about/ | 1 | 0 | 0 | 0 | 5/5 | 176 | 172 | 0 | ok | **9.8** |
| /privacy/ | 1 | not run today | 0 | 0 | 5/5 | 156 | 172 | 0 | ok | 9.8 |
| /receipts/ | 1 | 0 | 0 | 0 | 5/5 | 184 | 219 | 0 | ok | **9.8** |
| /journal/ | 1 | 0 | 0 | 0 | 5/5 | 200 | 182 | 0 | ok | **9.8** |
| /beliefs/ | 1 | not run today | 0 | 0 | 5/5 | 132 | 171 | 0 | ok | 9.8 |
| / (the room) | 0 | 0 | 0 | 0 | 5/5 | 272 | 10744 | 0.021 | ok | **9.3** |
| /projects/ | 5 | 0 (see note) | 0 | 0 | 5/5 | 104 | 172 | 0 | ok | **8.9** |
| /workspace/desktop.html | 0 | 0 (25 apps) | 0 | 0 | 1/5 | 276 | 1633 | 0 | ok | **8.8** |
| /workspace/record.html | 0 | not run today | 0 | 0 | 2/5 | 352 | 365 | 0.26 | ok | **8.3** |

132 internal links checked across those surfaces, 1 dead: `/trader-desk/`,
linked from a kept receipt's evidence URL in `_data/agent_receipts.yml`.

The one axe node shared by every Jekyll page is the footer's Privacy link:
1.78:1 against the surrounding text, distinguished by colour alone.

## Property level

| instrument | result |
|---|---|
| tests | 159 of 159 |
| gate-voice (production) | 49 of 49 |
| gate-arrival (production) | 13 of 13 |
| gate-entry (two doors) | 0 differences |
| gate-reach (production, direct) | 0 of 16 shipped surfaces unreachable, 134 reached |
| gate-motion | 1 low (the 2200ms boot bar, on purpose) |
| gate-copy | 4 low ("actually", four places) |
| gate-type live | 1 medium (invite body at 43ch on a 320px phone) |
| legibility, room and 25 apps, 3 viewports | 0 |
| findings in the ledger | 147, 20 of them instruments of mine that were lying |

## What the review found about the instruments

1. `gates.mjs --live` printed `[high] reach: unreachable ... see the list above`
   with no list, while `gate-reach.mjs` run directly reports 0 unreachable.
   One of them is wrong about its own output. Not yet diagnosed.
2. The legibility audit skips text whose effective opacity is under 0.95
   instead of measuring its painted contrast. `/projects/` carries dimmed
   12px labels at 3.08:1 that axe caught and the audit passed. Dimmed text is
   still read.

## Rank

1. The record pages (about, receipts, journal, privacy, beliefs): 9.8. One
   shared axe node each, nothing else.
2. The room: 9.3. Perfect on everything but weight: 10.7MB on a desktop
   because the walk in is a 20.8MB all-intra film. Phones get 4.5MB and
   save-data gets none; the desktop cost is real and deliberate.
3. Projects: 8.9. Four dimmed labels under 4.5:1.
4. The desktop: 8.8. No description, canonical, og:image or h1 for a crawler;
   1.6MB.
5. The record, script free: 8.3. A 0.26 layout shift on load and no metadata.

## Next, in order

1. Footer Privacy link: underline it or give it 3:1 against its neighbours.
   Clears one axe node on every page.
2. `/projects/` dimmed labels to 4.5:1, and the legibility audit made to
   measure painted contrast through opacity rather than skip it.
3. `record.html`: find the 0.26 shift (fonts or the mark), and give both
   workspace documents description, canonical and og:image.
4. The `gates.mjs --live` reach wrapper versus `gate-reach.mjs`: make them
   agree, and prove whichever one is wrong.
5. The dead `/trader-desk/` URL inside a kept receipt: annotate the receipt,
   never edit it.
6. Invite body measure on a 320px phone (43ch).
