# The room references, and the two lists

## henryheffernan.com — the strongest reference for the room

Entry is two gates: a black terminal box, "Click start to begin", then a low-poly desk
floating in a **white void** (not a modelled room), then "Click anywhere to begin" and
the camera flies in to sit at the desk. Now the frame is: dark desk across the bottom
third, a beige CRT centred, keyboard, mouse, speaker, two binders, a mug, paper trays,
loose paper. A small HUD top-left reads name / role / a live clock with two tiny buttons.

**The live UI is rendered as a texture on the CRT's screen plane.** A classic Mac window
sits on the glass, inside the 3D scene, and it is real interface rather than a picture.

Two measurements that overturn my assumptions:

- **Geometry is 185KB total.** `computer_setup.glb` 73KB, `decor.glb` 54KB,
  `environment.glb` 57KB. I had written in the plan that VIGIL's room was "3–4 days of
  asset production" and the long pole. Low-poly with baked lighting is not the long pole.
- **The audio is the craft.** `mouse_down.mp3` and `mouse_up.mp3` as separate files, and
  `key_1.mp3` through `key_6.mp3` — six keypress samples, randomised so typing never
  repeats. Every physical action makes a sound. This is a large part of why it feels
  alive, and I used zero audio in three demos.

The white void matters too: modelling only the furniture and letting it float reads as a
diorama or a memory rather than a failed attempt at photorealism. It is cheaper *and*
better.

## framer.com/marketplace/templates/macfolio — one good idea inside a template

The template itself is ordinary, but the hero move is not: a **photographed** classic
Macintosh CRT on a real desk, plant, cables, outdoor railing behind it, with the live
desktop rendered inside the screen. The chrome of the site is a photograph of the world;
the content lives on the glass.

That is the cheap version of Heffernan's idea and it needs no 3D at all.

## adrianraath.com/templates/deskfolio — the failure mode, usefully

A $35 Framer template. Its own page list gives it away:

> Home · About · Projects · Articles · Tools · Contact · 404 · Style Guide

An ordinary eight-page website with folder icons standing in for nav links. Nothing
about the information architecture is a desktop; only the decoration is. This is the
clearest statement in the reference set of **skin versus structure** — and it is the trap
my own GLASS came closest to, because a tree and a list is only a filing system if the
things in it genuinely are files.

## github.com/syxanash/awesome-web-desktops — ~200 entries, and a warning

The web's biggest directory of web desktops. Skimming the full table: WinXP, 98.js,
Windows 93/95/96, Win11React, Win11 Svelte, RebornXP, WebXP, vue-95, Github95, macOS in
Svelte, MacOS Big Sur Clone, Ubuntu Tour, Deepin, webKDE, NeXT, Amiga Workbench…

The overwhelming majority are clones of a shipped OS. Confirms the space is crowded in
exactly one direction, and that anything wearing Windows or macOS is entering a field of
two hundred.

The non-clones are the interesting ones: Poolsuite, Nightwave Plaza, Broken Reality,
RACER TRASH, Whimsy Space, constraint systems OS, Orb, DROPS, Big Desk Energy,
daedalOS, Henry Heffernan.

## github.com/jubalh/awesome-os — low value for this brief, and worth saying so

I expected a source of un-cloned visual languages. It is not that. It is a list of
kernels and hobby operating systems — 9front, Brutal, Interim, Genode, HelenOS, Fiwix,
Dreamos64 — almost all headless or terminal-only, collected so people can read the
source. There is no GUI vocabulary to mine here.

The only real signal: outside Windows and macOS the established GUI languages are few —
Plan 9's rio and acme, AmigaOS Workbench, NeXTSTEP, BeOS. If we want a look nobody has,
it has to be invented rather than borrowed, which is what the plan already said.
