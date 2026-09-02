# THE SERVICE · shot list for generation

For agentrichie.com Act 0. Scroll drives one night, 22:50 to dawn.
Canon: `CANON-v8-the-spike.md`. Engine: `reel-engine` REEL_MAP.

---

## THE HOOK, and it is one line

**A professional kitchen at full service with nobody in it.**

Every shot below is an empty room doing work. No people. No hands. No faces.
Tickets print, the pass fills, the spike loads, and there is not a single human
anywhere. That is the thesis delivered in three seconds without a word of
explanation: something is running this, and it is not a person.

If a shot comes back with a person in it, it is the wrong shot. Regenerate.

---

## LOOK BIBLE (paste into every prompt)

- Professional restaurant kitchen at night, expediting pass, stainless steel
- Only light source is a bank of amber heat lamps overhead, warm 2200K
- Everything outside the lamp pool falls to near black
- Cream thermal receipt paper is the one bright material in the room
- Shallow depth of field, slow deliberate camera, locked or very slow push
- Photographic, not stylized. No lens flares, no smoke machine, no neon
- **No people, no hands, no reflections of people, no chef whites on hooks**
- 16:9, 4K if available, 24fps

---

## SHOTS

Total footage target: **28 seconds**. Each shot is a scroll beat.

| # | Beat | Sec | What the visitor learns |
|---|---|---|---|
| 1 | 22:50 cold | 4 | A real place, closed, nothing running |
| 2 | 23:00 ignition | 3 | Something switched on with nobody there |
| 3 | First ticket | 4 | Work arrives as paper |
| 4 | The pass fills | 4 | This is volume, not a demo |
| 5 | The spike | 3 | Most of it is being destroyed |
| 6 | The imbalance | 4 | The pile is huge, the rail is nearly empty |
| 7 | Service down | 3 | It ends on its own |
| 8 | Dawn | 3 | The record is still there in daylight |

---

### 1 · 22:50 COLD  (4s)

> A dark, empty professional restaurant kitchen at night, seen from the
> expediting pass. Brushed stainless steel counters, empty ticket rail, a
> vertical steel order spike, all unlit and cold. One dim green safety light far
> in the background. Absolutely still, no movement, no people. Locked-off camera,
> shallow depth of field, near black with only faint steel highlights.
> Photographic, cinematic, 24fps.

Cut point: hold on stillness. This shot must feel like nothing is going to happen.

---

### 2 · 23:00 IGNITION  (3s)

> The same empty professional kitchen pass. A bank of amber heat lamps overhead
> switches on one lamp at a time, left to right, flooding the stainless steel
> with warm 2200K light. Dust drifts through the beams. The room is completely
> empty, no people anywhere. Locked-off camera, same framing as before.
> Photographic, cinematic.

Continuity: identical framing to shot 1. The only change is light.

---

### 3 · FIRST TICKET  (4s)

> Extreme close-up of a thermal receipt printer under amber kitchen heat lamps.
> Cream receipt paper feeds out of the print head and curls forward, still warm.
> Shallow macro depth of field, the paper edge in sharp focus, the dark kitchen
> soft behind it. No hands, nobody present. Slow push in.

This is the shot that has to be beautiful. It is the first close-up of the film.

---

### 4 · THE PASS FILLS  (4s)

> Wide shot of a restaurant expediting pass under amber heat lamps. A long steel
> ticket rail runs across the frame with cream paper tickets clipped along it,
> more tickets hanging than empty rail. The room is completely empty of people.
> Slow lateral camera drift to the right. Warm amber key, deep black shadows,
> shallow depth of field. Photographic.

---

### 5 · THE SPIKE  (3s)

> Extreme close-up of a steel restaurant order spike on a stainless counter under
> warm amber light. A cream paper ticket is driven down onto the spike, the metal
> point punching cleanly through the paper. Paper fibers visible at the puncture.
> Macro, very shallow focus, no hands visible in frame. Slight camera shake on
> the impact.

The impact is the moment the whole film turns. It must land hard.

---

### 6 · THE IMBALANCE  (4s)

> A steel order spike loaded with a thick stack of impaled cream paper tickets on
> a stainless kitchen counter, amber heat lamps above. In the soft background, a
> long ticket rail with only two or three tickets left hanging on it. Empty
> kitchen, no people. Slow rack focus from the loaded spike to the nearly empty
> rail behind it. Shallow depth of field, photographic.

The rack focus IS the argument. Spiked pile sharp, empty rail revealed behind.

---

### 7 · SERVICE DOWN  (3s)

> The same restaurant pass. The bank of amber heat lamps switches off one lamp at
> a time, right to left, the warm light draining away and the stainless steel
> going cold and blue. A loaded spike of paper tickets stays visible as the light
> leaves it. Empty room, no people. Locked-off camera.

Continuity: reverse of shot 2, same framing.

---

### 8 · DAWN  (3s)

> A professional kitchen pass in early morning. Cold grey daylight comes through
> a high window and falls across stainless steel. A steel spike thick with
> impaled cream paper tickets sits in the light. Completely empty, silent, no
> people. Very slow push in on the spike. Desaturated, cool, photographic.

The last frame of the film. It should be able to hold as a still.

---

## DELIVERY

Drop the files here and I will cut them in:

```
assets/reel/service-01-cold.mp4
assets/reel/service-02-ignition.mp4
assets/reel/service-03-ticket.mp4
assets/reel/service-04-pass.mp4
assets/reel/service-05-spike.mp4
assets/reel/service-06-imbalance.mp4
assets/reel/service-07-down.mp4
assets/reel/service-08-dawn.mp4
```

MP4/H.264 straight out of the generator is fine. I handle the rest:

- Concatenate to one continuous file so scroll scrubs a single timeline
- Encode a desktop and a mobile tier, plus a poster still per beat
- **Serve over HTTP, never a blob URL.** Chromium will not decode our VP9 encode
  through a blob even though it decodes the identical bytes over HTTP.
- Byte-range probe on load, because a host that will not serve ranges sticks the
  video on frame 0 while every seek is silently discarded

---

## HONESTY LINE

The room is a metaphor and always has been. The kitchen is not a claim about
where the work happens, and no shot may depict a number, a screen, a chart or a
readout, because those are the things that must stay real.

**Every figure the page states stays read from `git log` and `_data/` at build.**
Footage carries the world. Data carries the argument. They never swap jobs.

---

## WHILE THE FOOTAGE IS BEING MADE

I build the scroll engine against still plates so the sequence, the type timing
and the reduced-motion edition are all finished and verified before a single
frame arrives. Dropping the clips in is then a config change, not a rebuild.
