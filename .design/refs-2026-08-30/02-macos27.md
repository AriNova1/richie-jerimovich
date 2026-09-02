# macos27.kimi.page — a macOS 27 clone

Studied by logging in, opening Finder and Music, and dumping the `:root` token block.
Tailwind + custom properties. Vite build (`index-*.js`), one bundle.

## The thing I got wrong the first time

I dismissed this as "a clone, therefore borrowed identity, therefore nothing to learn."
That was lazy. The clone is the least interesting part. What makes it read as an
operating system rather than a web page is the **completeness of its token system**, and
that is transferable to any visual language, including one nobody has seen before.

## The token system, verbatim from :root

**Glass tiers** — three blur strengths, not one
```
--lg-blur-strong: 30px   --lg-blur-medium: 20px   --lg-blur-light: 12px
--lg-saturate: 180%
--lg-hairline: rgba(255,255,255,.2)      --lg-hairline-dark: rgba(255,255,255,.14)
--lg-specular-top: inset 1px 1px 0 rgba(255,255,255,.5)   <- light catches the top-left edge
--lg-inner-glow: inset 0 0 12px rgba(255,255,255,.18)
```

**Shadows are three stacked layers, and have an inactive variant**
```
--lg-shadow-window:          0 24px 72px rgba(0,0,0,.35),   /* ambient  */
                             0 2px 12px rgba(0,0,0,.18),    /* contact  */
                             0 0 0 .5px rgba(0,0,0,.25);    /* hairline */
--lg-shadow-window-inactive: 0 10px 34px rgba(0,0,0,.22), 0 0 0 .5px rgba(0,0,0,.18);
```
An unfocused window sits *lower*. Depth encodes focus. I did not do this in VIGIL.

**A radius per component, not a global scale**
```
window 16   window-plain 10   sidebar 12   toolbar-pill 10   dock 24
dock-icon 22.37%   menu 8   menu-item 5   widget 14   notification 14
spotlight 20   button 8   capsule 999   control-small 6
```
`22.37%` is the squircle approximation. Nothing is rounded "about right".

**Duration and easing scales**
```
--dur-micro .12s  --dur-fast .18s  --dur-ui .25s  --dur-panel .35s  --dur-sheet .5s
--ease-ios cubic-bezier(.32,.72,0,1)        --ease-out-strong cubic-bezier(.23,1,.32,1)
--ease-inout-strong cubic-bezier(.77,0,.175,1)
--ease-spring-bounce cubic-bezier(.34,1.35,.44,1)
```

**Label hierarchy as alpha, not as greys**
```
--label rgba(0,0,0,.85)  --label-2 .5  --label-3 .26  --label-4 .1
--separator rgba(0,0,0,.1)
```
Four steps of the same ink. Composites over any background, so one scale serves the
light window chrome and the dark Music window without a second palette.

**The z-index ladder — the actual secret**
```
desktop 0 → desktop-icons 10 → windows 100 → dock 9000 → menubar 9100 → menus 9200
→ spotlight 9300 → control-centre 9350 → notification-centre 9400 → banners 9450
→ mission-control 9500 → app-switcher 9600 → lock 10000 → boot 11000
```
Every layer an OS can have is declared and ordered up front. This is why it feels like a
system: nothing is ever ambiguous about what covers what. A web page has 3 z-indexes
picked ad hoc; an OS has fourteen, named.

Also present: fixed geometry tokens for every chrome element (`--menubar-h: 24px`,
`--dock-icon-size: 48px`, `--titlebar-h: 44px`, `--tl-close/#FF5F57`, `--window-min-w`,
`--resize-hit: 6px`).

## Restraint I did not expect

Only **8 elements on the whole desktop** have a live `backdrop-filter`. The glass is
targeted at the surfaces that need to read as floating; everything else is opaque. I had
blur on every window in VIGIL, which costs a lot and buys less.

## What I take from this

- Feeling like an OS is a **completeness** problem, not a style problem. Ship the whole
  ladder: z-layers, radii per component, three blur tiers, five durations, four label
  alphas, active/inactive shadow.
- Encode focus in depth. An inactive window should physically sit lower.
- Label hierarchy as alpha on one ink survives any ground and halves the palette.
- This is exactly the discipline GLASS lacked. Rick's "so much going on, hard to keep
  up" is what happens when everything is drawn at one level of emphasis because there is
  no declared hierarchy for the eye to follow.
