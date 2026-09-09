# What we retired, and what is worth saving

Fable, 2026-09-09. Written against commit `1e678fd` "Launch photoreal room entrance and complete Richie workspace". Nothing in this document has been acted on. It is for Rick to rule on first.

## First, the good news, and it changes the question

**Nothing was deleted.** The launch commit removed zero files:

```
git diff --diff-filter=D --name-only 1e678fd^ 1e678fd   →   0 files
```

It renamed `index.md` to `overnight.md` and added a new `index.html`. Every old page is still in the repo, still built into `_site/`, and still answering at its own URL right now.

**So what we lost is not content. It is reachability.**

The new `index.html` is a bare HTML file with `<base href="/workspace/">`. It does not use `_layouts/default.html`, which is where the site's entire navigation lives. The moment it became the front door, the nav went with the old homepage.

### Every way out of the new front door, in full

| path | goes to |
|---|---|
| Skip link, and the caption under the room | `workspace/record.html` |
| Header "Open workspace" | `workspace/desktop.html` |
| Desktop → How I think → "Read that page" | `/about/` |
| Desktop → Apple menu → "Read the public record" | `record.html` |
| Links inside individual records | `/projects/`, `/organism/` |

That is the complete list. There is no path at all from the front door to:

`/journal/` · `/journal/book/` · `/inside/` · `/beliefs/` · `/tonight/` · `/tape/` · `/rewind/` · `/kitchen/` · `/changelog/` · `/receipts/` · `/overnight/`

A visitor can only reach those by typing the URL or arriving from Google.

## The one live contradiction

`/about/` is titled **"The five voices"** and names a character cast. The desktop widget says **"Five layers. One agent. Loyalty, research, risk, hands, truth. Not a cast."** The desktop's own How I think app then links to /about/ and calls the names "a teaching device".

Both statements are live on the same domain today. This has to be resolved either way before anything else ships, because it is the property contradicting itself about its own identity, on the one page a curious visitor is most likely to open.

## The inventory

Sizes are the built page in `_site/`. "Covered?" asks whether the new desktop already carries the same thing.

### Tier 1: real value, and the new experience has no equivalent

| surface | what it is | covered by the desktop? | verdict |
|---|---|---|---|
| **`/journal/` (97 entries)** | Richie's daily writing, 2026-05-25 to 2026-09-08, 72K index | **No.** The corpus carries paragraph excerpts only. `record.mjs` says so out loud: "The export contains paragraph excerpts. Open the source file for each complete entry." | **Save. Highest priority.** This is the largest body of Richie's actual voice on the property and there is currently no way to read a single complete entry inside the new experience |
| **`/journal/book/`** | The bound flip book. 492K, four shipped checkpoints, the most crafted single artifact on the site | No | **Save.** Give it a physical home |
| **`/tonight/` + `/tape/`** | The Service Tape: last night's real pipeline run replayed with real steps, real timings, real receipt decisions, recorded by the run itself | No | **Save, and promote.** This is dynamism that already exists and is already real. It is the direct answer to "nothing is ever new" |
| **`/organism/`** | Vitals console, 136K, the galaxy canvas | Partly. Activity Monitor carries the health and runtime snapshots, and is a thinner instrument | **Save the galaxy.** Fold the numbers |
| **`/inside/`** | One public receipt traced through its real work night: the task, the pressure, the cost, the proof | No | **Save, and promote.** This is the best "what am I actually looking at" artifact the property has ever had, and it is orphaned |

### Tier 2: real value, overlaps the new experience, needs a ruling

| surface | what it is | overlap | verdict |
|---|---|---|---|
| **`/rewind/`** | Scrub the whole life of the site day by day, every frame read from git history, never estimated | Heavy with **C8 Time Machine** (102 recorded days). Different instrument though: continuous scrub versus day cards | **Your call.** Fold as a second mode inside Time Machine, or keep as its own app |
| **`/changelog/`** | Git commits braided with receipts, declined receipts and the journal. 184K | Heavy with Time Machine and Finder | Fold. Time Machine already does the braid, per day, with sources labelled |
| **`/projects/`** | "What runs", grouped by proof level, status, evidence, next verification step | **None.** The desktop has no projects surface at all | **Save.** Small, and it answers "what has this thing actually built" |
| **`/beliefs/`** | Standing positions on autonomy, growth, work, proof, taste, honest AI | None | **Save.** This is identity content, and you have said identity is the gap |
| **`/overnight/`** (the old homepage) | v9 THE OVERNIGHT, locked conception, 1,645 words | The *argument* is not carried anywhere in the new front door | **Mine it, do not restore it.** The layout is retired. The argument is the thing worth taking |
| **`/receipts/`** and **`/tape/`** archives | Script-free list pages | Yes, Finder covers receipts | Keep as they are. They are the no-JavaScript fallback and they cost nothing |

### Tier 3: leave alone

- **`/about/`** — keep, but resolve the cast contradiction above.
- **`/privacy/`** — leave exactly as is.
- **`/kitchen/`** — the CSS-3D navigable room. Honestly superseded: we now have a real photoreal room and a real desktop. **Recommend retiring it properly** and mining its copy, rather than keeping two rooms on one property. Worth a look before we drop it, in case you disagree.
- **`/talk/`** — already not built and already not live before this relaunch. `_site/` has no `talk` directory. Unchanged by us.

## The plan, in the order I would do it

Nothing here is started. Each phase is independently shippable.

### Phase 0: stop the contradiction and stop the bleed  (small)

1. Resolve **five voices versus five layers** on `/about/`. One ruling, applied to both surfaces.
2. Add a real way back into the record from the new front door. Not a nav bar bolted onto a cinematic room, something that belongs in it. My proposal is a **desk object**: the journal sitting on the desk, openable, and the shelf behind it.
3. Add `/journal/`, `/inside/`, `/tonight/` to `sitemap.xml` reachability so Google keeps them, and confirm no page 404s.

### Phase 1: the writing gets a home  (the biggest single gap)

4. **Notes reads complete entries, not excerpts.** Today the corpus is excerpt-only by design. Either extend the export to carry full entries, or have Notes fetch the built page for the entry it is showing. I would extend the export: it keeps the "everything is traceable to the export" property intact.
5. **The bound journal becomes an object on the desk.** A book you can pick up, which opens the existing flip book. It is already built and already good.

### Phase 2: the property gets its dynamism back, honestly  (answers your complaint directly)

6. **The Service Tape becomes a desktop app.** "Last night's service": the real run, real timings, real receipt decisions. Because it is recorded nightly by the run itself, **the site genuinely differs every day**, with no invented numbers. This is the honest version of the dynamism you asked for and it is already sitting there unused.
7. Decide **rewind versus Time Machine**. My recommendation: fold the scrub into Time Machine as a second mode rather than run two history instruments.

### Phase 3: the orphans that answer "what is this"  (feeds into the copy work)

8. **`/inside/` becomes the tour.** One receipt, traced through one real night. It is the single best explanation of what the property is, and right now nobody can find it.
9. **`/projects/` and `/beliefs/`** get surfaces in the workspace.
10. Mine `/overnight/` for the argument, then leave it retired at its URL.

### Phase 4: the galaxy  (craft, not urgency)

11. Bring the organism galaxy into Activity Monitor, or give it its own window. It is the most visually ambitious thing on the old site and Activity Monitor is currently the least interesting window in the new one.

## What I have deliberately not decided for you

- **Rewind versus Time Machine.** Two instruments over the same history. I lean fold, you may want both.
- **Whether the kitchen dies.** I lean yes. Two rooms on one property is one too many.
- **Whether the nav comes back at all.** A conventional header on a cinematic front door would flatten it. I would rather everything be reachable through the room and the desk. That is more work and it is the better answer.
- **Where full journal entries live.** Extending the corpus export is the honest path but it grows the export.

## The risk in all of this

The new front door is genuinely good. The failure mode of a "save the old stuff" pass is bolting a navigation bar and a footer onto a photoreal room and turning it back into a website. Everything above should arrive **as an object in the room or an app on the desk**, or not at all.
