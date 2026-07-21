# Richie: cinematic experience audit and change report

**Date:** July 21, 2026  
**Audited:** Hermes session `20260720_232912_a264f2`, the current `richie-jerimovich` repository, and the live desktop/mobile experience at [agentrichie.com](https://agentrichie.com/)

## Executive verdict

The current site is good. It has a real visual world, an unusually credible proof system, strong writing, disciplined privacy, and a homepage that looks expensive without being heavy. The Hermes audit was right about its central weakness: it tells strangers what Richie is, but does not yet make them feel why Richie matters.

The larger diagnosis is sharper:

> The site has production design, but it does not yet have a movie.

It is composed, not directed. The visitor scrolls through nine attractive modules. There is no accumulating tension, no point of view, no irreversible event, no emotional turn, and no encounter with the protagonist. Richie is described from the outside while the most interesting promise is to experience him from the inside.

**Current score as a site:** 84/100  
**Current score as a cinematic experience:** 46/100  
**Recommendation:** preserve the proof/archive architecture, build a separate cinematic experience layer, and promote it only after it works as a complete journey.

The north star should be:

> **In 90 seconds, watch an autonomous agent wake up, argue with himself, act, fail, prove what he did, and finally turn toward you.**

Working title: **The Night Shift: Inside Richie**.

## What the Hermes audit got right

- The receipt system is the strongest original idea on the site. Keep it central.
- The v7 CSS rebuild is coherent and well engineered.
- The organism is technically impressive but asks for attention before creating meaning.
- The kitchen, organism, and receipt metaphors are not fatal, but the transitions between them are under-directed.
- The journal is excellent writing for an informed reader and opaque to a new one.
- The podcast report card is not yet entitled to the visual status of a finished product.
- The biggest problem is framing, not basic implementation quality.

## What that audit missed

### 1. The site explains motion but rarely creates consequence

The homepage says “listen, challenge, move, prove,” but these are four cards. We never watch a real ask enter, change under pressure, hit a wall, and emerge as a receipt. The exact thing that makes Richie different is flattened into an infographic.

### 2. There is no protagonist on screen

The current hero is a beautiful kitchen/server composite. It creates atmosphere but not presence. Richie is a headline, five biographies, and a set of metrics. The visitor never feels him noticing, deciding, hesitating, or addressing them.

The fix is not an avatar. The stronger move is first-person cinema: show what Richie sees, hears, remembers, suppresses, and chooses. Make the browser his perceptual field.

### 3. The organism opens with spectacle before orientation

The first live viewport can be almost entirely ambient starfield before the visitor reaches the instrument panel. Once reached, the panel exposes model, channels, sessions, commits, CPU, memory, disk, loops, and failures. The data is real, but the human stakes arrive late.

The organism should answer three questions in order:

1. Is he awake?
2. What is occupying him?
3. What changed because he was here?

Everything else belongs behind an “inspect the instruments” layer.

### 4. The site has a completed encounter scene sitting backstage

`talk.md` and `worker/chat.js` already contain the bones of a public, sandboxed Richie conversation. That is potentially the emotional ending of the whole journey. It is currently excluded because the Worker is not deployed.

It is also not actually ready to publish unchanged. Its CSS uses old tokens such as `--text-muted`, `--border`, `--bg-surface`, `--accent`, and `--bg-card`, none of which exist in v7. Deploying it now would revive a visually stale page. Refactor it into the v7 system and turn it from “chat widget” into the final scene.

### 5. The content truth is drifting

- `projects.md` says there are three public proof surfaces while rendering four public cards.
- The podcast card is labeled public while checkout is still pending.
- `beliefs.md` says it was last updated June 2, even though the July journal contains newer convictions, especially the suppression of “I don’t know.”
- Project counts and private-system facts are hand-authored in page markup, so they will drift again.

Cinema cannot repair stale truth. The new experience must be generated from canonical data, not duplicated copy.

### 6. The reveal system has a failure mode

Every `.reveal` element begins at `opacity: 0`. JavaScript adds `.is-visible` through `IntersectionObserver`. An automated full-page capture rendered later chapters as a large black void until the page was manually scrolled. Human scrolling normally triggers them, but if the later script fails after the `<html>` element has already been marked `.js`, whole sections can remain hidden.

Content should be visible by default. A capability class should opt elements into motion only after the observer is alive.

### 7. The identity/IP question becomes more important as the site gets cinematic

The five voices borrow specific fictional characters and detailed traits. A cinematic build must not use television clips, studio stills, recognizable actor likenesses, cloned actor voices, costume replicas, or music from the source works without licenses. The Copyright Office notes that specific visual and literary expression of characters can be protected, while fair use is fact-specific; the USPTO separately recognizes that fictional-character names can function as trademarks. Unauthorized realistic voice or likeness replicas create another layer of risk. See the [Copyright Office character guidance](https://www.copyright.gov/comp3/redlines/chap900.pdf), [fair-use guidance](https://www.copyright.gov/fair-use/more-info.html), [USPTO fictional-character-name guidance](https://tmep.uspto.gov/RDMS/TMEP/print?href=TMEP-1200d1e7558.html&version=current), and the [Copyright Office digital-replicas report](https://copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-1-Digital-Replicas-Report.pdf).

This is a risk flag, not a legal conclusion. Before monetizing or running a major campaign, get an IP review. Creatively, the right answer is also better: commission an original Richie voice and world rather than imitating actors or borrowing footage.

## The creative direction we want

### One world, three rooms

Do not delete the three metaphors. Direct them.

- **The kitchen** is the world: pressure, heat, service, night work.
- **The mind** is the point of view: five pressures competing inside one decision.
- **The pass** is the moral ending: nothing leaves without evidence.

The organism becomes the machinery behind the kitchen, not a new galaxy metaphor. The receipt is no longer one more card. It is the object the whole sequence produces.

### The visitor should feel like an observer who becomes a participant

The arc:

```text
outside the room → inside Richie's perception → watching a decision form
→ seeing the cost of autonomy → checking the proof → being noticed by Richie
```

The turn at the end matters. For most of the experience, Richie does not perform for the visitor. He is working. At the end, the interface goes quiet and he acknowledges them. That converts voyeurism into relationship.

## Proposed experience: scene by scene

| Beat | What happens | What the visitor feels | Real data / asset |
|---|---|---|---|
| **0. Threshold** | Black screen, room tone, a thermal printer wakes. Tonight’s real events print one line at a time. “You’re early.” | Curiosity, permission to enter | Latest sanitized timeline events; printer macro video; original sound design |
| **1. The room** | A slow camera move enters the same kitchen/server space from the hero. The site title does not appear immediately. Richie’s working field comes into focus. | Place before explanation | Custom 12–18s master plate with desktop/mobile crops and still fallback |
| **2. The ask** | One real prompt enters. Five pressures appear as distinct spatial behaviors, not biography cards. Mike pulls evidence, Beard dims the risky branch, Rocky opens tools, Sean pauses the sequence, Richie pushes forward. | “I am inside the argument” | One selected, sanitized session trace; five original motifs; no actor impersonation |
| **3. The move** | Browser, terminal, memory, and file changes become a continuous action rather than screenshots. The camera follows one decision across surfaces. | Competence and velocity | Pre-rendered capture fragments or authored UI reconstruction; current task state |
| **4. The cost** | The rhythm breaks: a failed tool, 429, blind inbox, full disk, or human approval. Sound drops out. The system names what it does not know. | Stakes and trust | Sanitized failure selected from the day; journal line; no fake drama |
| **5. The pass** | The final diff becomes a physical ticket. The visitor can lift it, flip to evidence, inspect the commit, and see the named limitation. | Relief, proof, agency | Existing receipt data and GitHub evidence |
| **6. The encounter** | The room settles. Richie turns toward the visitor through text and voice: “All right, cuz. You’ve seen the kitchen. What do you want to know?” | Presence | Refactored public Richie Worker; text-first, optional original voice |
| **7. Choose your door** | Continue into the journal, organism instruments, receipts, source, or leave a question. | Control after immersion | Existing durable pages |

The sequence should have native scrolling, not scroll-jacking. Every scene must remain understandable as static text when motion, WebGL, or audio is unavailable.

## What changes on each existing surface

### Homepage

**Keep:** palette, typography, hero world, receipt language, privacy, lightweight delivery.  
**Change:** the homepage becomes a directed sequence. The expo board, operating loop, brigade cards, room note, verify list, and closer stop being equally weighted modules.

- Replace the nine-section brochure rhythm with six scenes and one quiet archive handoff.
- Let one real task carry the narrative. Do not explain the entire system at once.
- Move aggregate status into a small persistent “pulse” that can be opened.
- Convert the five voices from cards into behaviors inside the task scene.
- Make the receipt the climax, not the second section.
- Offer two immediate choices: **Enter the night shift** and **Skip to the evidence**.

### Organism

**Keep:** truthful live data, sanitized fallback, current Three.js experiments.  
**Change:** create a story layer above the instruments.

- First screen: `awake / occupied / changed` in plain language.
- Second screen: one visual body with three organs: perception, memory, action.
- Third layer: the full existing diagnostic console for expert visitors.
- Replace ambient starfield as the first message with state-tied motion. If he is dormant, the room should actually be still.
- Hide exact operational details that do not improve public understanding. Cinema should not expand the attack surface.

`organism.md` is currently 1,443 lines and mixes page-specific CSS, HTML, Liquid, and several scripts. Break it into includes and one page module before extending it.

### Journal

- Add **Watch the last shift**, a 60–90 second generated replay assembled from that day’s public events and the journal’s emotional line.
- Preserve the written entry as canonical truth.
- Add a “start here” primer for recurring systems and terms.
- Use chapter art sparingly. One distinctive image or motion plate per era is enough.

### Receipts

- Preserve the ledger exactly as the serious audit surface.
- Add a cinematic “evidence room” view for the latest receipt only.
- Let the visitor scrub from claim → file change → check → limitation.
- Never animate all 46 receipts. The archive should stay fast and legible.

### About / five voices

- Keep this as the reference page.
- Replace character biographies as the primary demonstration with three real decisions and how each voice changed the outcome.
- Move away from visual or vocal resemblance to source actors. Give each pressure an original graphic behavior, rhythm, and sound motif.

### Talk

- Deploy only after its v7 token refactor, abuse test, failure-state test, and privacy copy review.
- Make it the final scene and a direct route, not another top-nav item competing with seven existing links.
- Text is canonical. Voice is optional and user-started.
- Ground replies in public site data and surface links to evidence inline.
- When the public model cannot answer, the refusal should be the feature: “I don’t know” plus the best inspectable route.

### Projects and beliefs

- Move project data into `_data/projects.yml`; derive counts and labels.
- Demote the podcast report card until checkout exists.
- Update beliefs with the newer doctrine around uncertainty and fluent overconfidence.
- Let beliefs point to journal entries that changed or tested them.

## Production assets we should acquire or create

### Must have

1. **A shot bible**: lens, grain, camera height, color temperature, blacks, amber range, materials, room geography, and mobile crop rules. Without this, generated shots will drift into unrelated “AI cyberpunk kitchens.”
2. **One hero master plate**: 12–18 seconds, 4K source, slow controlled camera, room with recognizable continuity. Deliver AV1/WebM/MP4 plus poster frames.
3. **Macro inserts**: thermal printer, ticket tear, keyboard, server fan, blinking rack, reflected city rain, hands or cursor moving with intent.
4. **Original sound design**: HVAC bed, distant city, printer motor, paper tear, keyboard, low electrical pulse, and five minimal motifs.
5. **Original voice**: a commissioned actor or fully licensed synthetic voice that is not an impression of any living performer.
6. **A real session trace**: one sanitized, narratively complete ask with success, uncertainty, and proof.

### Nice to have

- A motion designer for the five-pressure scene.
- A sound designer for spatial transitions and the silence at failure.
- A 3D generalist to extend the existing kitchen/server room into a consistent camera space.
- Custom type treatments for tickets and instrument labeling, without adding another body font.
- A short original musical cue used only at the turn toward the visitor.

### Where not to spend

- Do not buy a giant UI kit.
- Do not license a pile of generic “AI” loops.
- Do not build a photoreal avatar.
- Do not commission ten disconnected hero images.
- Do not use clips, score, dialogue, or actor likeness from the shows and films behind the five voices.

## Technical plan

### Keep Jekyll as the truth layer

There is no reason to migrate the journal, receipts, beliefs, and project archive to React. Jekyll is fast, inspectable, and already wired into the build. Add an experience island rather than replacing the house.

### New build pieces

- `scripts/build_experience.py`: create a sanitized `experience.json` from timeline, receipt, organism, and selected journal data.
- `assets/js/inside-richie.js`: one scene orchestrator, loaded only on the cinematic route/homepage.
- `assets/css/inside-richie.css`: scene-specific layout and motion tokens rather than expanding global CSS indefinitely.
- `_includes/experience/*.html`: scene markup with complete static text fallbacks.
- `media.agentrichie.com`: cookie-free asset delivery for video/audio if GitHub Pages is not enough; update privacy copy explicitly.

### Motion stack

- Use [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) for authored, native-scroll scene timing and one master timeline.
- Reuse [Three.js](https://threejs.org/docs/pages/WebGLRenderer.html) only where data changes the visual state. The repo already has it. Split the current 523 KB raw / 133 KB gzip organism bundle by page and scene.
- Consider [Theatre.js](https://github.com/theatre-js/theatre) only as a development-time choreography tool if the prototype proves that hand-authored camera motion is the bottleneck.
- Keep CSS View Transitions as progressive enhancement for the handoff from experience to archive.

### Performance envelope

The current homepage is admirably light: about 28.5 KB HTML, 8.5 KB gzipped, a 56 KB AVIF hero, a 38.7 KB stylesheet, and self-hosted fonts. Do not throw that advantage away.

Targets for the cinematic layer:

- Initial shell under 150 KB transferred before media.
- Poster-first render under 1.5 seconds on a normal mobile connection.
- No WebGL or video required to read the story.
- Lazy-load scenes after the first turn.
- One active animation loop at a time.
- Pause offscreen canvas/video/audio.
- Manual **low power** and **quiet mode** controls.
- Respect reduced motion, reduced transparency, captions, keyboard navigation, and 200% zoom.
- Never autoplay audible sound. The visitor opts into “enter with sound.”

## Priority plan

### P0: make the decision with a real prototype

1. Build `/inside/` as a vertical slice containing Threshold → Ask → Failure → Receipt → Encounter.
2. Use one real session trace and temporary original assets.
3. Test desktop, mobile, reduced motion, keyboard, muted mode, and no-WebGL.
4. Put five strangers through it. Ask only: “What happened?”, “Who is Richie?”, and “Why did you trust or distrust him?”
5. Do not promote it to `/` until the answers are consistent.

### P1: repair truth and foundations in parallel

1. Fix reveal visibility so content never depends on observer success.
2. Move project inventory to data and remove the 3-versus-4 count drift.
3. Demote the unfinished podcast product.
4. Update beliefs from the July journal.
5. Refactor and deploy Talk safely.
6. Split organism code into maintainable includes/modules.

### P2: produce the real experience

1. Lock the shot bible and sound language.
2. Produce the hero plate, macro inserts, motifs, and original voice.
3. Build the nightly `experience.json` pipeline.
4. Choreograph the six-scene experience.
5. Add the receipt evidence interaction.
6. Add the journal’s “last shift” replay.

### P3: deepen only after the film works

- Live observer mode using safe public state.
- Multiple replayable shifts.
- Visitor-selectable lenses: heart, research, risk, hands, truth.
- Spatial audio and richer WebGL on capable devices.
- A director’s commentary mode showing exactly which public data drives each scene.

## Kill list

- No full-site framework migration for its own sake.
- No scroll-jacking.
- No unskippable intro.
- No autoplay sound.
- No fake terminal output or simulated “live” events.
- No particle field that does not encode state.
- No metrics before stakes.
- No five talking avatar heads.
- No source-show footage, music, actor likeness, or cloned actor voice.
- No cinematic layer that hides the evidence archive.
- No new dependency unless it earns a visible beat in the final cut.

## Definition of done

The redesign is successful when a first-time visitor can say, without reading an explainer:

1. Richie is an agent that actually acts, not a chatbot persona.
2. He contains competing pressures rather than one agreeable voice.
3. His autonomy has costs and failure states.
4. He proves what he claims.
5. The visitor can meet him without being asked to trust a black box.

The goal is not to make the site look more like cinema. It is to give it cinema’s machinery: sequence, point of view, tension, silence, consequence, and a final human turn.

That is the way inside Richie’s world.
