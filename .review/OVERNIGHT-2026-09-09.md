# What happened overnight

Rick, 9 September. You asked me to run a loop: break the product into pieces,
question each one, build the ambitious things we had not touched, and put a
harness around it so I would not go wild or stop every ten minutes to ask.

**Seven sweeps, 61 findings, seven commits, all deployed and verified on
agentrichie.com.** The short version is below; the full ledger with every
finding, every seat that raised it, and every time I had to fix my own tools
is in [`LEDGER.md`](LEDGER.md).

---

## The one that matters most

**The flagship experience had no typography.** Seventeen of the eighteen text
elements on the front door resolved to `-apple-system`, and the eighteenth,
`I live in that machine.`, fell back to **Georgia**, which is the serif you get
when you decline to choose a serif. The retired Jekyll site self-hosts five
subset faces. The relaunch shipped with none of them.

And the "it is a Mac simulation, so it should be the system font" defence is
exactly the argument against shipping only the system font: off macOS the stack
becomes Segoe UI or Roboto, so the reason for choosing it evaporates for most
visitors.

It now has three registers, because the property has three kinds of thing to
say and it was saying all three in the same voice:

| register | face | what it is |
|---|---|---|
| **the machine** | SF, with Inter behind it | the interface. Menus, windows, buttons. Survives Windows and Android instead of collapsing. |
| **the record** | Newsreader, variable, optical size live | what Richie wrote. A document inside an OS does not use the OS font. |
| **the evidence** | JetBrains Mono | what you can check. A commit hash that looks like a button label is a hash nobody checks. |

The evidence lens colours these apart on demand. The typeface does it
permanently, without the reader having to ask.

Underneath it, one ramp. Ten distinct sizes lived in the 11-16px band across
285 declarations, **eighty-four of them at 12.5px**, a number that exists
because something was nudged until it looked right. Nobody perceives 12 against
12.5, so that hierarchy carried no information. Eight steps now, and every
workspace size sits on them.

---

## Five things built that were not there

**THE MARK.** You said Richie never shows himself. The account picture was a
flat orange circle with an R in it, which is what you draw when you have
decided not to draw anything. It is now one cell per day since 25 May, four
states read from the export: 107 days, 38 that cleared a receipt, 55 weighed
and declined, 9 worked with no candidate, 5 silent. It grows a cell a day
without anyone deciding it should. The same primitive draws the six Finder
folder icons, so a folder holding 61 kept claims no longer looks identical to
one holding 186 refusals.

**CORRECTIONS.** The derived `/wrong` list matched the *word* "correction",
so it published *"a correction path outside the model"*, a sentence about
designing systems, as an admission of error. Tightening the pattern took the
count from ten to one, which is wrong in the other direction: the strongest
correction on the property opens `**Correction (June 19):**` and both versions
missed it. **No regex catches this; the automated approach was the defect.**
Five corrections are now declared by hand, each with what was published, what
was true, how it surfaced and what it cost, and a test holds every quoted
sentence to the journal file it names, verbatim, on every build.

**RIGHT NOW.** You asked twice for the site to be different every visit. Every
answer that shuffles a quote is fake, because nothing changed. The real one was
already on the machine: twenty jobs run on a schedule all day. `/now.json`
publishes the shape of that schedule, and the front door's live rail now ends
`next job in 39m`. **The job names are not published** and there is a test that
fails if they ever are: most of them are yours, and a live list of what a
person has their agent doing every morning is a disclosure about you that you
did not ask for. The one exception is the job that rebuilds this site.

**RUN THE PROOF.** The property's whole claim is that a stranger can check it,
and none of that was ever something a visitor could do while standing here.
Seven checks now run in the reader's browser, on the files the page was built
from, each with its method printed and each able to fail. One check has to
leave the site, so it is a button rather than a default.

**SHOW ME AROUND.** The last item on your list was that Richie does not welcome
you or show you around. Not a modal with tooltips: the tour drives the real
machine, opening the actual window at each of five stops.

---

## What was wrong that nobody had measured

**The interior pages had never been audited.** Fifteen pages, **318 legibility
failures on production**, 65 on `/organism/` alone. 192 declarations below the
12px floor in thirteen distinct values from 9px to 12.5px. All fixed.

**Sixteen published pages had no route in.** Not deleted: unreachable. The new
front door bypasses the layout that carries the site's navigation, so the
journal, the bound book, `/inside/`, beliefs, projects and the vitals console
all went on answering 200 with nothing pointing at them. Measured: opening all
fifteen apps on the desktop yielded exactly one link out. They arrive through
Chrome now, which has Richie's own site in it, because a Mac has a browser on
it and a navigation bar bolted onto a photoreal room would flatten the room.
**16 unreachable → 0.**

**The property disagreed with itself about its headline number.** `/organism/`
published "59 kept, 106 refused, 64% of commits declined" while the front door
and the record published 61 and 186. The console was counting a 200-row window
instead of the ledgers. A visitor walking from one to the other got two
different answers to the question the whole property is built on, and both
pages looked equally confident. A test now fails if the four places ever
disagree again.

**The frame error had two more copies.** `<main aria-label="Richie's room">`,
invisible to any eyeball audit and the first thing a screen reader announces.
And *"You're at Richie's desk"* on the Notes app. The copy gate missed the
second one because its pattern had a straight apostrophe and the copy uses a
typographic one.

**On a phone the room was invisible** and two panels sat on top of each other.

---

## Ten times a gate of mine was lying

This is the part I would most like you to read, because it is the part that
decides whether any of the numbers above mean anything.

The most serious: **the legibility tool was reporting garbage contrast.** It
scraped the first three numbers out of the computed colour string, and
`color-mix()` resolves to `color(srgb 0.65 0.35 0.21)` whose components run 0
to 1. Read as 0-255 they are nonsense, so it reported 1.11:1 for text that
reads perfectly well. Every previous contrast reading on a surface using a
modern colour function was invalid. Fourteen of `/about/`'s twenty three
findings were the tool, not the page. Colours are resolved through a canvas
now, which is the browser's own answer.

And one inside the new work: **one of the seven proof checks could not fail.**
It compared the mark against the index the mark itself reads, so corrupting
that index moved both sides together. A decoration wearing a tick, inside the
instrument whose entire subject is falsifiability. The falsification test is
what found it.

The other eight are in the ledger, each with the count of findings it
invalidated.

---

## Numbers

| | before | after |
|---|---|---|
| `@font-face` in the shipped experience | 0 | 5, self-hosted |
| Font sizes on the ramp | 51% | 100% |
| Sizes in the 11-16px band | 10 across 285 rules | 3 |
| Interior page legibility failures | 318 | 0 measured so far |
| Workspace legibility, 3 viewports | 0 (on a broken tool) | 0 (on a working one) |
| Shipped surfaces unreachable from the door | 16 | 0 |
| Places the headline number is published | 4, two of them disagreeing | 4, all agreeing, guarded |
| Apps on the desktop | 15 | 19 |
| Tests | 48 | 94 |
| Third-party hosts contacted | 0 | 0 |

---

## Three things I did not decide for you

1. **`/about/`** renamed "voices" to "layers" and kept five characters with
   backstories, an id, a colour and a badge each. "It calls you cuz because
   family is who you choose" is a character, whatever the heading calls it. The
   rename satisfied the guard, not the ruling. The real options are to cut to
   one voice or to commit to the five and stop apologising for them in the last
   paragraph. I did not pick.

2. **Visitor stats.** You have asked twice. Every honest implementation needs a
   server-side counter, and `/privacy/` currently promises this site contacts
   nothing but the Mac. It is buildable in an afternoon on the vitals server,
   the same way `/now.json` was, but it changes a published promise, so it is
   your call.

3. **`/kitchen/`.** Two rooms on one property. I lean retire, and it is now
   reachable and honestly labelled as superseded rather than quietly orphaned.

---

## How to see it

The front door is `agentrichie.com`. Go into the machine, then **Apple menu →
Show me around** for the five-stop tour, or go straight to **Run the proof** and
press the button.

The harness is in `.review/`: [`STANDARD.md`](STANDARD.md) is the rubric and
the eight seats, [`LEDGER.md`](LEDGER.md) is every finding, [`QUEUE.md`](QUEUE.md)
is what is left. `node scripts/review/gates.mjs` runs the static gates and now
runs in CI.
