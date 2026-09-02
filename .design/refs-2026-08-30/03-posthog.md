# posthog.com — the OS-as-website

I previously read only their blog post about this and never opened the site. The site
teaches more than the post does.

## Confirmed by measurement

`document.body.scrollHeight === innerHeight`. **The page does not scroll.** Eight
independent inner scrollers instead. Same finding as the Silo site. Two of the three
strongest references in this set are fixed viewports where scrolling happens inside
panes.

`localStorage` holds `fullWidthContent` and `cookie_consent`: window layout preference
persists per visitor. The OS remembers how you like it.

## The IA is the desktop

Left rail, as desktop icons: Home · Self-driving product · Context warehouse · Pricing ·
Docs · Demo · Talk to a human · About us · Changelog · Company handbook · Store ·
Careers · **Trash**. The information architecture *is* the icon set. There is no nav
menu pretending to be a nav menu, and there is a Trash, which is a joke that also
teaches the metaphor in one glance.

`#app-container[data-window-expanded] #taskbar { border-bottom-left-radius: 0 }` — the
taskbar squares off its corners when a window is expanded, so the chrome physically
docks to the window. Tiny, and it is the kind of thing that sells a system.

## The changelog is the best page and the most stealable idea

Not a reverse-chronological list. Three **week columns side by side** (August Week II,
III, IV), each a stack of entries with an author avatar and a team label. Underneath,
a full-width **year scrubber**: Jul 2025 → Jul 2026 in months, with per-period density
squares, GitHub-contribution-graph style but horizontal and used as a control.

Filters are two pills at the top: "All categories", "All teams".

Why it works: a changelog's real question is "what changed *relative to what else*",
and columns answer that where a list cannot. This is the multitasking argument from
their blog post, made concrete on the one page where it matters most.

## What I take from this

- The fixed viewport is not a Silo quirk. It is the pattern. Page scroll is what makes
  an OS metaphor collapse back into a web page.
- Persist the layout. An OS that forgets is a page.
- **agentrichie already has this page and it is currently a vertical list.** /changelog/
  braids commits, receipts, refusals and the journal — the exact shape that wants
  columns and a year scrubber rather than a feed.
- Their density scrubber and my VIGIL shift band are the same instrument at different
  zoom. One control, two ranges: a night, and the whole 97 days.
