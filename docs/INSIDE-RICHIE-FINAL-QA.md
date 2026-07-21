# Inside Richie: final release QA

Date: 2026-07-21

Surface: `/inside/`

Quality bar: flagship vertical slice

## Outcome

Release-ready after an integrity, accessibility, responsive, motion, and browser pass. The experience now follows one verifiable trace: the July 17 v7 rebuild receipt, its two same-day commits, and its same-day journal. The five pressure lines are explicitly presented as editorial readings of that journal, not as a transcript.

## Audit health

| Dimension | Score | Final finding |
|---|---:|---|
| Accessibility | 4/4 | Semantic eight-scene document, keyboard-safe ticket faces, visible focus, complete no-JS reading order |
| Performance | 4/4 | Zero new runtime dependencies; transform-only parallax; low-power and reduced-motion off-ramps |
| Responsive design | 4/4 | Verified at 1440×900 and 390×844 with no horizontal overflow or unreachable ending |
| Theming | 3/4 | Strong v7 token use; a few intentional scene-specific background values remain |
| Anti-patterns | 4/4 | Distinct kitchen-pass language; no scroll-jacking, fake terminal, avatar, generic card wall, or gated content |
| **Total** | **19/20** | **Excellent** |

Representative measured text contrast ranged from 5.59:1 to 13.67:1.

## Release blockers found and resolved

- **P0, narrative integrity:** Jul 20 ask, Jul 19 cost, and Jul 17 receipt were presented as one night. The generator now anchors every scene to the latest published receipt's work date.
- **P1, hidden-content failure:** `.anim` content could still be hidden when the page had the global JS class but the scene script failed. Motion hiding now starts only after the scene observer is successfully installed.
- **P1, unreadable evidence headings:** global heading color made task and receipt titles white on cream. Both explicitly use ticket ink now.
- **P1, desktop collision:** the five-pressure stage overlapped at 1440×900. The scene now has a wider, non-colliding spatial composition.
- **P1, mobile clipping:** the thermal ticket's intrinsic width forced the scene grid past the viewport. Grid tracks and scene children now shrink correctly; measured document width equals viewport width.
- **P2, misleading controls:** Quiet persisted a flag but controlled no audio. It is removed until opt-in audio exists; the asset plan says when to restore it.
- **P2, low-power gap:** Low Power stopped parallax but not the printer. It now suppresses both and persists across reloads.
- **P2, ticket keyboard order:** the hidden evidence face remained focusable. Hidden faces now receive both `aria-hidden` and `inert`.
- **P2, false journal claim:** “has not missed a night since mid-June” was not supported by the repository. It now reports the factual entry count.
- **P2, navigation polish:** desktop scene labels opened offscreen, mobile dots wrapped into two rows, and Low Power collided with back-to-top. All three layouts were corrected.

## Verification evidence

- Canonical generator rerun twice with identical SHA-256: `aaaae68d8ff05072c88e4be2f7811102183e43fae2a5a30cf6b293d4950f3f24`.
- Generator result: `2026-07-17`, 2 commits, 5 sourced pressures, 0 dramatized fallbacks, authorship cost.
- Clean Jekyll 4.4.1 production build.
- Repository site tests: 7 passed.
- JavaScript syntax, Python syntax, and `git diff --check`: clean.
- Browser flow: threshold → room → ask → move → cost → pass → turn → four doors.
- Ticket flip state, copy feedback, hidden-face accessibility state, local visit counter, and Low Power persistence verified.
- Browser console: no warnings or errors.

The unconstrained repository-root pytest command also discovers duplicated tests under generated `_site/trader-desk/` and optional trader-desk dependencies that are not installed. That pre-existing collection issue is outside this site release; the scoped site suite passes.

## Remaining enhancement path

The page is intentionally complete with no paid media. The next material jump is the existing asset pack in `docs/ASSET-PROMPTS.md`: original kitchen hero plate, macro printer inserts, opt-in room tone, and original voice casting. Add a Quiet control only when audio actually ships.
