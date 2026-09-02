# howdidwelosethisworld.com — SILO (Apple TV+)

Studied 2026-08-30 by reading the live DOM, the computed stylesheet and the SVG defs.
Not by looking at a screenshot: the page is a fixed viewport that never finished its
tune-in animation in my pane, so the screenshots alone would have taught me nothing.

## What it actually is

`document.body.scrollHeight === innerHeight`. **It does not scroll.** One fixed
viewport, one headline, two pill buttons, a footer. My earlier note that it was "one
long vertical descent" was wrong and was written from a loading screen.

Vue (`data-v-*` scoped attrs). Typeface is **SF Pro** — the system font, no custom
display face at all. All the character is in effects, none of it in type choice.

## The four mechanisms

### 1. Live TV static, rendered per element on canvas
```
.static-bar  { position:relative; overflow:hidden }
.static-bar__noise { position:absolute; inset:0 }     <- <canvas>, sized to the element
.static-bar__content { position:relative; z-index:1 } <- real DOM text on top
```
Every chrome element (top bar, both pills, the tune-in track and fill) is a
`.static-bar`: a canvas of animated noise with real text composited over it. Six
canvases on the home screen alone. The noise is never a static image.

### 2. The headline is a photograph seen through letterforms, eroded by wind
```
.headline__mask {
  background: image-set(url(DVH6UBEz.avif) 1x, url(vNTHog-N.jpg) 1x) center/cover;
  mask-image: url(CX9fVlgf.svg), url(CX9fVlgf.svg);   /* the SAME svg, twice */
  mask-repeat: no-repeat, no-repeat;
}
/* animated inline: */
mask-size:     8526.87px 100%, 8526.87px 100%;
mask-position: 1442px 0px,     9968.87px 0px;         /* offset by exactly one width */
```
The type is an SVG mask; an AVIF photo shows through it. Two identical mask layers
offset by exactly the mask width scroll horizontally forever, so the erosion is
seamless and endless. Nothing about this is a text element.

### 3. `feTurbulence` boil — the alive mechanism
```svg
<filter id="v-0" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2"
                seed="1" result="boil-noise">
    <animate attributeName="seed" values="1;2;3;4;5;6;7;8"
             dur="1.1s" calcMode="discrete" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="boil-noise" scale="36"
                     xChannelSelector="R" yChannelSelector="G"/>
</filter>
```
`calcMode="discrete"` is the whole trick: the seed **snaps** between 8 values instead
of interpolating, so the displacement jumps 8 times a second like hand-inked animation
rather than easing like a CSS tween. This is why the page reads as alive and hand-made
instead of mechanical. It costs one filter and one `<animate>`.

There is also a `#wind-smear` filter class hook (`.headline__wind--filtered`) applied
to the headline for the same family of effect.

### 4. Boot choreography from a single state class
```
.home__bar--top      { transform: translateY(calc(-100% - var(--frame-m) - 2px)) }
.home__bottom .pill  { transform: translateY(calc(100% + 60px)) }
.home__top-content   { opacity: 0 }
.home--booted *      { transform: translateY(0); opacity: 1 }
```
One class flips and the whole frame assembles: bar drops in from above, pills rise from
below with an 80ms stagger on the second, content fades at 250ms. Easing is
`cubic-bezier(.22,1,.36,1)` over 550ms. The tune-in bar itself scales on Y
(`scale(1, 0.6776)` mid-flight) which is a CRT switching on.

Transition between routes: `.transition-overlay` = static canvas + blackout +
**scanlines**, three stacked layers.

## What I take from this for agentrichie

- Alive is not motion volume; it is **non-interpolated** motion. One discrete-stepped
  turbulence seed beats a dozen eased transitions.
- Chrome can carry texture. A bar that renders its own noise reads as a signal, not a div.
- Type as a window onto an image, not as coloured glyphs.
- Everything animated here still ships `prefers-reduced-motion` handling. Confirms the
  gate finding rather than contradicting it.
- Fixed viewport, no scroll. A "room" does not need a page.
