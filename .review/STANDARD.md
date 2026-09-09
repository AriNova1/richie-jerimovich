# The Standard

The rubric this property is reviewed against, and the committee that applies it.
Written 2026-09-09. Every finding in `LEDGER.md` cites a seat and a gate from here.

---

## Why this exists

Rick's instruction, verbatim: break the product into small pieces and question each one
for whether it earns its place, whether it is integrated and built in a state-of-the-art
way, whether its wiring / sources / quality of output hold up, and **most importantly**
the design choices: effects, motion, layout, scroll, animation, use of image assets or
lack of them, use of basic fonts versus better fonts. Are we polishing this to be
tasteful, modern and sharp, or defaulting to old habits and being ignorant.

The failure mode this document exists to prevent is the one that already happened twice:
**I looked at a screenshot and called it good.** Once for an illegible label over a
photograph, once for "Come on in, the desk is yours" sitting on the front door three
turns after the frame that forbids it was explained to me.

So: **the eye proposes, the gate disposes.** A seat can raise anything. Nothing is
recorded as fixed until a gate says so, or until the ledger records exactly why no gate
can cover it.

---

## The unit of review: the atom

An **atom** is the smallest thing that can independently be wrong.

Not "the desktop." Not "Notes." An atom is *the Notes window's body type ramp*, or
*the dock's hover response*, or *the invitation headline's first six words*. If a
finding about it would name a different fix than a finding about its neighbour, it is
a different atom.

Every atom is listed in `ATOMS.md` with an id. Every ledger row cites one.

---

## The committee

Eight seats. Each seat is a fixed question, asked in a fixed order, and it may only
raise findings inside its own jurisdiction. The order matters: the Stranger goes first
because once you know how something works you can never un-know it.

| # | Seat | The question it is allowed to ask | Jurisdiction |
|---|---|---|---|
| 1 | **The Stranger** | Eight seconds, no context, no scroll. What is this, whose is it, and why should I care? | Comprehension, first frame, orientation |
| 2 | **The Skeptic** | If I deleted this atom entirely, what would be lost that nothing else provides? | Earning its place, redundancy, scope |
| 3 | **The Typographer** | Is this a decision or a default? Where is it on the ramp, what is the measure, what is the font actually doing? | Type stack, scale, weight, measure, rhythm, numerals |
| 4 | **The Colourist** | Is this palette chosen, or is it grey because grey is safe? | Colour, contrast, temperature, hierarchy by value |
| 5 | **The Motion Director** | What does this movement *mean*? Would the reader lose information if it were static? | Timing, easing, transitions, scroll, reduced-motion |
| 6 | **The Editor** | Which string is this sentence pulling, and did I choose it or did it fall out of my hands? | Every visible character, psychology, rhythm, frame |
| 7 | **The Auditor** | Where did this number come from, and can a stranger check it? | Sourcing, tiers, honesty, no fabricated anything |
| 8 | **The Engineer** | Is this wired into the system, or bolted onto the side of it? | Integration, weight, dead code, shared primitives, a11y |

### Seat rules

- A seat that finds nothing writes **"clean"** in the ledger with one line of reasoning.
  A blank is not a pass; it is a skipped seat.
- No seat may say "looks fine." It must name the specific decision it is approving.
- **The Skeptic outranks everyone.** If an atom does not earn its place, the other
  seven do not get to polish it. Cut it and move on.
- The Editor and the Auditor have veto: a frame violation or an unsourced number is a
  stop-ship regardless of how good the craft is.

---

## The gates

Automated. Runnable. A gate result is evidence; a seat's opinion is not.

Run all: `node scripts/review/gates.mjs <url>`

| Gate | Checks | Pass condition |
|---|---|---|
| `legibility` | Real measured contrast under every piece of text, at 3 viewports | 0 findings |
| `type` | Font stacks, size ramp conformance, measure, orphan sizes | 0 system-only stacks on editorial surfaces; ≥90% of sizes on the ramp |
| `motion` | Every animation and transition against `prefers-reduced-motion` | 0 unguarded |
| `copy` | Em dashes, frame violations, filler, banned constructions | 0 |
| `sourcing` | Evidence-lens marks with no tier | 0 unsourced |
| `weight` | Transferred bytes per surface | Front door ≤ 12 MB, any app ≤ 400 KB |
| `reach` | Every shipped surface, clicks from the front door | ≤ 3 |
| `a11y` | Focus visibility, name/role/value, heading order, contrast of focus ring | 0 criticals |

### Gate honesty rules

1. **A gate that has never failed is not a gate, it is decoration.** Every new gate must
   be shown failing on a real defect before it is trusted. The ledger records the first
   real catch for each gate.
2. **Do not loosen a gate to make it pass.** If a gate is wrong, fix the gate and record
   that its previous results were invalid. `completion-gates-are-not-honesty` is on file
   because I loosened a failing check once and nothing recorded it.
3. **A gate measures what is on screen at that moment.** Production caught a `.tm-foot`
   failure that three local runs missed. Gates run against production before a pass is
   called clean.

---

## The floors

Not negotiable. A build that breaks one of these does not ship, regardless of taste.

**Frame**
- Richie is virtual. He lives inside the Mac mini. He owns nothing physical.
  The room, the desk, the keyboard, all of it is Rick's.
- The Mac mini is the one exception in reverse: housing, not possession.
- One Richie. No cast, no named voices, no five characters.
- Nothing simulated, ever. No fabricated metric, no invented physical fact,
  no plausible-looking number without a source.

**Type**
- Nothing renders under 12px, anywhere, at any viewport.
- A phone gets **larger** type than a desktop, never smaller.
- Text over imagery gets a real plate. A text-shadow is not contrast.
- Tabular numbers get `font-variant-numeric: tabular-nums`.

**Colour**
- 4.5:1 normal, 3:1 large, measured against what is actually painted underneath.

**Motion**
- Every animation is disabled or reduced under `prefers-reduced-motion: reduce`.
- No motion without meaning. Decoration that moves is decoration that distracts.

**Copy**
- No em dashes in visible copy.
- Every number is traceable to the corpus export or the local git clone, and labelled
  which.

---

## The metrics

Tracked in `LEDGER.md`. A number that only goes down is not a metric, it is a
scoreboard; these are chosen because they can move both ways and I have to say why.

| Metric | Meaning | Now | Target |
|---|---|---|---|
| **Atoms reviewed** | Coverage of the property | — | 100% |
| **Open findings** | Raised, not yet fixed or ruled | — | 0 at each checkpoint |
| **Gate failures** | Automated, on production | — | 0 |
| **Default rate** | Atoms where the answer to "decision or default?" was *default* | — | falling |
| **Deleted atoms** | Things the Skeptic killed | — | non-zero (a review that cuts nothing is a review that flinched) |
| **New builds shipped** | Ambitious work, not just polish | — | non-zero per checkpoint |

**Default rate is the honest one.** It is the count of places where I did the safe
system-default thing rather than making a decision. It is the direct measure of the
habit Rick named. It should be high on the first pass and it should be embarrassing.

---

## The loop

```
  ┌─ SWEEP ──────────────────────────────────────────────────┐
  │  Pick the next atom cluster from QUEUE.md                │
  │  Seat 1..8 in order. Every seat writes a line.           │
  │  Findings → LEDGER.md, with seat, severity, and fix.     │
  └────────────────────────┬─────────────────────────────────┘
                           ▼
  ┌─ RULE ───────────────────────────────────────────────────┐
  │  Skeptic first: cut, keep, or rebuild.                   │
  │  Cut is a legitimate and preferred outcome.              │
  └────────────────────────┬─────────────────────────────────┘
                           ▼
  ┌─ BUILD ──────────────────────────────────────────────────┐
  │  Fix findings. Build the ambitious thing the sweep       │
  │  exposed. Ambition is part of the loop, not a reward     │
  │  for finishing the chores.                               │
  └────────────────────────┬─────────────────────────────────┘
                           ▼
  ┌─ GATE ───────────────────────────────────────────────────┐
  │  node scripts/review/gates.mjs   (local, then prod)      │
  │  node --test workspace/tests/*.test.mjs tests/*.test.mjs │
  └────────────────────────┬─────────────────────────────────┘
                           ▼
  ┌─ CHECKPOINT ─────────────────────────────────────────────┐
  │  Commit. Update metrics. Write what I got wrong.         │
  │  New work re-enters the queue as new atoms and gets      │
  │  the same eight seats. No exemption for being mine.      │
  └──────────────────────────────────────────────────────────┘
```

### Checkpoint rules

- A checkpoint is a **commit that leaves the site working**. `refresh.sh` gates the
  deploy, so a broken build cannot take the site down, but a checkpoint that ships a
  regression is a failed checkpoint and the ledger says so.
- **Nothing waits for approval.** Rick asked for a long unattended run. Rulings he has
  already given are in the floors. Anything genuinely new and irreversible gets built
  behind a flag and written up, not sent as a question.
- **The queue is append-only during a sweep.** A tangent found mid-sweep gets written
  down and left. Finishing the cluster beats chasing the shiny one.

## What I am not allowed to do in this loop

1. Call something clean because a screenshot looked fine.
2. Ship a new build without putting it through the same eight seats.
3. Quietly drop a queue item. Dropping is a ruling and it gets written down.
4. Fabricate anything, including a plausible-sounding statistic about visitors.
5. Spawn subagents. Rick banned them. The committee is eight lenses, one agent.
