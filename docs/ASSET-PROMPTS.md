# Asset Prompt Pack — "The Night Shift: Inside Richie"

*For Rick. Every prompt below is ready to paste into the relevant generator (Runway / Kling / Pika / Sora-class for video, Midjourney/SDXL/local image gen for stills, ElevenLabs for voice, Artlist/Epidemic or generative audio for sound). The /inside/ page is built to work with ZERO of these — each asset slots into a named, pre-wired place when it arrives.*

---

## 0. THE SHOT BIBLE (lock this first — every prompt below obeys it)

**World:** A small restaurant kitchen at night, after service, that is also a machine room. One continuous space. No people. The presence is felt through behavior (lights, steam, printer, screens), never shown as a body or face.

**Camera:**
- Height: 1.2–1.5m (a person's eye, slightly low — respectful, not god's-eye)
- Movement: slow push-ins and lateral drifts only. No whip pans, no handheld shake, no drone moves
- Lens feel: 35–50mm equivalent, shallow but not creamy depth of field
- Speed: everything 20–30% slower than feels natural. This is a place that has nowhere to be.

**Light & color (match the site's tokens):**
- Base black: warm, not blue — `#0d0b09`
- Key light: amber heat `#f0c040` — pass lamps, low and practical
- Accent: alarm red, used SPARINGLY (one element per frame max)
- Green: only as small "all-clear" indicator lights
- Steel: brushed, worn, fingerprinted — not chrome showroom
- Ticket paper: warm off-white, thermal-print texture

**Texture:** light film grain, gentle halation on practical lights, faint steam/haze always present. Never clean CGI. Never cyberpunk neon. No rain-on-window clichés except one specified insert.

**Mobile crop rule:** all key action center-weighted; the middle 60% of every frame must read on a 9:16 crop.

**IP hard rule (non-negotiable):** no actor likenesses, no cloned actor voices, no footage/stills/music from any show or film, no costume or prop replicas from source works. Original world, original voice. The five voices are *pressures*, not impressions.

---

## 1. HERO MASTER PLATE — "The Room" (Scene 1)
**Slot:** `inside.md` scene-room background (replaces the current CSS-gradient backdrop; poster frame required either way).
**Spec:** 12–18s seamless loop, 4K source, deliver AV1 + WebM + MP4 + 2 poster frames (AVIF, 1200w + 768w).

> Static wide shot, a small restaurant kitchen at night after service, empty of people. Low amber pass lamps glow over a stainless steel pass lined with a rail of blank order tickets. Faint steam drifts through the light. At the back of the room, incongruous but natural, a small server rack with soft green status LEDs blinks slowly beside the walk-in. Warm blacks, deep shadows, brushed worn steel, film grain, gentle halation on the lamps. Extremely slow, almost imperceptible camera push-in toward the pass. Quiet, patient, lived-in atmosphere. No people, no text, no logos. 35mm lens, shallow depth of field, color palette of warm black, amber, steel grey.

**Mobile variant:** same prompt, composed center-weighted for 9:16.

---

## 2. MACRO INSERTS (Scenes 0, 3, 4 — garnish loops, 3–5s each)

**2a. Thermal printer (Threshold):**
> Extreme close-up, macro lens: a thermal receipt printer in warm darkness prints a receipt one line at a time, paper emerging slowly, amber under-light, visible paper texture and faint print-head glow. Warm black background, film grain. Slow, deliberate, tactile. No readable text on the paper, no hands, no logos. 3-second loop.

**2b. Ticket tear (Threshold exit):**
> Macro shot: a thermal paper receipt being torn off a printer's serrated edge in one slow downward motion, paper fibers catching amber light, warm black background, film grain. No hands visible — shot tight enough that only the paper and edge are in frame. 2-second clip.

**2c. Keyboard/terminal (The Move):**
> Close-up, shallow focus: a backlit mechanical keyboard in a dark room, keys pressing themselves in a steady working rhythm — framed so only keys and amber screen-glow are visible, no hands. A terminal's soft green-amber glow reflects on the keycaps. Warm blacks, film grain, slow deliberate pacing. 4-second loop.

**2d. Server fan + LEDs (The Move / Machine Room):**
> Macro tracking shot along a server rack at night: slow-spinning fan behind a grille, soft green and one amber status LED blinking in patient rhythm, dust motes in a shaft of warm light, brushed steel, deep warm shadows, film grain. No text, no logos. 4-second loop.

**2e. The failure beat (The Cost):**
> A single amber pass lamp in a dark kitchen flickers once and dims to half brightness, steam continuing to drift through the reduced light. Everything else in frame perfectly still. Warm black, film grain. The mood of a held breath, not disaster. 3-second loop.

---

## 3. STILLS — poster frames & OG (always needed, even with video)

**3a. Hero poster (if video fails/loads):** use prompt §1 as a still, 1200w + 768w AVIF.
**3b. OG card for /inside/:**
> Cinematic wide still, empty restaurant kitchen at night merged subtly with a machine room: a rail of order tickets under amber pass lamps in the foreground, a server rack with soft green LEDs glowing in the deep background, steam in the light, warm blacks, worn steel, film grain, moody and quiet. No people, no text, no logos. 35mm, shallow depth of field, warm black and amber palette. — 1200×630, export PNG ≤150KB.

---

## 4. SOUND DESIGN (all opt-in and off by default; add a Quiet control when audio ships)

**4a. Room tone bed (The Room, loopable, 60s+):**
> Low restaurant-kitchen room tone at night: distant HVAC hum, faint refrigeration cycle, occasional soft metal tick of cooling steel, very distant muted city outside. Warm, close, quiet. No music, no voices. Seamless loop.

**4b. Machine bed (post-descent, loopable):**
> Low electrical ambience: soft server fan wash, faint disk ticks, a barely-audible low electrical pulse like a slow heartbeat every few seconds. Calm, alive, not ominous. Seamless loop, sits under room tone.

**4c. One-shots:** thermal printer motor + paper feed (2s), ticket tear (1s), keyboard soft clack burst (1s), a single subdued "lamp dim" thump for the failure beat (1s), paper slide for the receipt flip (0.5s).

**4d. Five pressure motifs (Ask scene, 2–4s each, minimal):**
> Five short original musical motifs, same instrument family (felt piano + low analog synth), distinct tempi: (1) curious ascending figure, (2) low cautionary sustained tone, (3) precise rhythmic tapping figure, (4) single suspended questioning note, (5) warm resolute two-chord resolve. Sparse, intimate, no melody longer than four notes.

*Source: Artlist/Epidemic for 4a–4c; 4d wants a composer or careful generative pass. Budget tier: skip motifs in v1.*

---

## 5. VOICE — "The Turn" (Scene 6; text is canonical, voice is opt-in)

**Requirement:** an ORIGINAL voice — not an impression of any performer (IP hard rule). Cast by description:

> Male, 30s–40s, American, working-class warmth without caricature. Raspy edges, talks like someone who has been on his feet for twelve hours and isn't tired of it yet. Direct, unsentimental, dry humor underneath. Never performs. Speed: unhurried. Think "short-order cook who reads" — NOT any specific actor.

**ElevenLabs:** design from that description in Voice Design; generate the Scene 6 address (~75 words, script lives in `inside.md` scene-turn) + one alternate take. Deliver MP3/OGG, loudness-normalized.
**Free path:** the local audio_generation plugin's Mandarin/English voices for a scratch track; replace when the commissioned voice lands.

---

## 6. THE SESSION TRACE (free — curation, not generation)

Scene 2/3 is anchored to the Jul-17 v7 receipt, its same-day commits, and its journal. The strongest long-term fuel is a **curated library of 3–5 sanitized, internally coherent session traces** (ask → pressure reading → move → cost → receipt). Good next candidates are the /31/ tunnel removal (Jul 9, has stakes) and a future receipt-backed night with strong failure material. Never splice separate dates and present them as one night. Format each trace as a YAML block matching `_data/experience.yml`; `build_experience.py` can later rotate them.

---

## Priority order

1. **§3b OG card** (cheap, immediate, every share of /inside/ needs it)
2. **§1 hero plate** (the biggest single upgrade to the film)
3. **§2a + 2b printer inserts** (Threshold is the first impression)
4. **§4a/4b sound beds** (the cinema feel is half audio)
5. **§5 voice** (needs casting care; don't rush)
6. **§2c/2d/2e, §4c/4d, §6** (season two)
