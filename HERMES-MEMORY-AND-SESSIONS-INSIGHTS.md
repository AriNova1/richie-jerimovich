# Hermes: memory stores and session history — full audit

*Compiled 2026-09-06 by exhaustively reading Hermes's own memory stack and its complete session history (767 sessions, Apr 27 – Sep 6 2026, ~239M raw characters). Companion document to [AGENT-HANDOFF-COMPLETE-HISTORY.md](AGENT-HANDOFF-COMPLETE-HISTORY.md), which covers the Claude Code side of Rick's work. This document covers Hermes specifically — the semi-autonomous agent running on Rick's Mac mini — because it turned out to hold a large amount of durable, decision-relevant material that had never made it into either memory system.*

*A note on method, since it differs from the companion document's: Hermes's own memory (`~/.hermes/memories/MEMORY.md` + `USER.md`) is a thin 4.5KB — far less mature than the 83-file Claude Code memory bank — so most of what follows is genuinely new, not a re-organization of something already curated. It was extracted via the same batched-Haiku-subagent method (33 batches, checked against both Hermes's own memory and a digest of the Claude Code memory bank), but given the sheer volume (roughly 15x the text processed for the companion document), individual claims below were not all hand-re-verified against raw session content the way the companion document's were — treat items marked "per session record" as reported-not-reverified, and the small number of updates folded into existing Claude Code memory files as the ones that did get a closer look before being written down.*

---

## 1. What Hermes actually is, corrected and extended

The existing record (Claude Code memory) had the broad strokes right — cron architecture, iMessage via BlueBubbles, a gateway-restart saga, an `.env` redaction gotcha. Reading Hermes's own `SOUL.md` and `AGENTS.md` in full adds real structure underneath that.

**Hermes is architected as five voices in one identity**, not one persona: **Richie Jerimovich** (volume as terror turned outward, shows up at 2am, refuses to stop), **Mike Ross** (finds the side door, makes complex look effortless), **Coach Beard** (watches, silent threat-assessment, speaks in references because some truths are too sharp to say straight), **Rocky** (breaks problems small enough to solve, celebrates with a dumb joke), and **Sean Maguire** (survived his own walls, asks the hard question because he needed someone to ask him). They "vote on everything" — the file's own words: "the blend is a brawl that produces a symphony, not smooth, not balanced, unresolved and alive." A Mode Map assigns lead/backup voices by situation (quick texts → Richie/Sean; research → Mike/Beard; hard debugging → Rocky/Mike; stuck or avoiding → Sean/Richie; chaos with no plan → Beard/Mike).

**This is a distinct thing from the four persona-profile directories on disk** (`~/.hermes/profiles/{sean-maguire, rocky-the-eridian, mike-ross, harvey-specter}`) — those are separate, fully independent Hermes instances (each with its own `state.db`, `config.yaml`, skills, cron) rather than voices within one blended identity. Worth noting the roster doesn't quite match: SOUL.md's five voices name **Coach Beard** (Ted Lasso); the actual profile directory has **harvey-specter** (Suits) instead, with no Beard profile on disk. Not flagged as urgent, just worth knowing these are two different mechanisms that happen to share three character names.

**A deputy agent exists**: **Luca**, running on Rick's own MacBook (not the Mac mini), reachable via `ssh luca-macbook` or `~/.local/bin/luca-remote`/`luca-hermes`. This was already on record in `hermes-richie-agent.md` — flagged here only because it's easy to miss and worth restating: treat Luca as a second live fleet member when auditing what's running where, not just the Mac mini's Hermes.

**Two independent email accounts are wired and confirmed working**, not one: `arinova1100@gmail.com` via the Gmail API (the one with the known weekly OAuth-expiry issue — Testing-mode consent screen, fixed by re-auth at `gmail_auth.py`:8080), and **`richiejerimovich@icloud.com` via Himalaya/IMAP**, which is independent and unaffected by the Gmail issue. Per session `8b6fa981c53c`: Rick explicitly granted both, with a standing instruction for daily usage tracking. The same session records why iMessage-as-a-platform was ruled out for autonomous agent use (Linq is enterprise-only with no self-serve tier, Poke is a consumer product) and why **Twilio SMS was chosen instead** — live with $15.50 trial credit, a local number purchased, pending A2P 10DLC compliance registration, using a Google Voice number to satisfy Twilio's own verification requirement. The session's own stated lesson: Hermes reaches for offline/existing-credential workarounds when blocked by online auth, rather than retry-spamming a blocked path.

**Identity resolved**: `USER.md` lists "Public GitHub: AriNova1" for Rick in a way that reads, out of context, like it might contradict the Claude Code side's understanding (AriNova1 = the persona's machine default; `rutvikbuilds` = Rick's own deliberate choice). Session `20260830_063103_0b16d6` resolves this directly and specifically for **X (Twitter)**, not GitHub: **`rutvikbuilds` is confirmed as the correct long-term handle, and `AriNova1` is deliberately established as Richie-the-agent's own clean provenance — not something to migrate away from.** The two aren't in conflict; they're both correct, for different accounts, on purpose.

---

## 2. Memory architecture — one genuinely new incident, and where the rest already lives

**Correction made while writing this section**: the existing Claude Code memory file `hermes-memory-architecture-sota.md` (last touched 2026-07-25) already covers this ground at equal or greater depth than a fresh read of `~/.hermes/MEMORY_ARCHITECTURE.md` produced — the three-root-cause hallucination bug, the Jul 21–24 outage's full stacked-defect chain, the ingestion admission-control gate, the scoped-retrieval tags, the embedding-migration script's exact numbers, and the `recall_types` config-drift finding are all already recorded there, in some cases with more precision (direct SQL/API verification) than this pass re-derived from the document alone. **Read that file, not this section, for the full picture — this section only adds what postdates it.**

**Genuinely new: a second "split-brain sidecar" incident, Aug 13 2026.** The Jul 21–24 outage's fix (kill the Hindsight sidecar by listening port, write `hermes.env` directly) had one remaining blind spot: the token-sync bridge only restarted the sidecar when a *file* changed. A live audit on Aug 13 found `config.json` and `hermes.env` both already matching the current xAI OAuth credential, while the already-running sidecar process held a *different*, stale, inherited token — Hindsight's `/health` endpoint reported green throughout (the API and database were genuinely alive), but any actual `hindsight_reflect` call failed with an HTTP 500 wrapping an xAI HTTP 403. **Fixed** by having the bridge compare the running process's actual inherited `HINDSIGHT_API_LLM_API_KEY` environment variable against the freshly-resolved credential and hard-kill on a mismatch, even when both files already agree — file-diffing alone isn't sufficient to detect this class of drift. Verified end-to-end (process credential matched, xAI `/models` returned 200, a live `reflect` call succeeded, and a second bridge run produced zero output, confirming the fix doesn't require a restart every cycle to stay stable).

**Also newly surfaced: a systematic six-way alternatives comparison** (mem0, Honcho, Supermemory, OpenViking, Obsidian, mnemosyne-oss) was run against Hindsight, with the verdict that none should replace it — Honcho's one genuine capability gap (multi-peer "theory of mind" modeling) was instead built natively on Hindsight's own tag system (`about:{person_slug}` convention, implemented in `hindsight_peer_model.py`, proven end-to-end against real tagged data) rather than adopting Honcho, which has real reliability issues, an AGPL-3.0 license, and an admittedly-unfinished core feature of its own. Worth folding into the existing file if it isn't already reflected there in full.

---

## 3. Security and privacy findings — worth Rick's direct attention

A handful of findings from the session sweep are the kind that should get read even if nothing else in this document does.

- **A formal PII/GDPR audit exists and found real exposure** (session `20260427_004115_96ad4a`): `sessions` and `state.db` store full message content **unencrypted**, and the LLM backing every conversation receives all of it. As audited, this is not GDPR/CCPA compliant. Recommendations on record but not confirmed applied: enable `privacy.redact_pii: true`, implement a session TTL, add a privacy-focused auto-reply pattern, and negotiate a DPA with the LLM provider. **Worth a direct check of current status** rather than assuming this was actioned.
- **`state.db` has no auto-prune and no size alerts** (`sessions.auto_prune` is set to `false`). A separate session recorded it at 1.9GB months ago; this session's own live measurement today found it at 820MB — so it may have been pruned or measured differently since, but the underlying lack of a bounded-growth policy is a real, current gap independent of the current number, and ties directly into this machine's live disk-space warning (see §7).
- **Freqtrade (a crypto trading bot library) was evaluated and flagged SUSPICIOUS, not adopted**: its base64 strategy-injection mechanism allows remote code execution *by design*, and it uses `cloudpickle` deserialization, which is inherently unsafe. If this or anything like it is ever near Trader Desk / THE PIT, the standing recommendation on record is paper-trading only, never live capital.
- **The `mem0` API key leak is still unrotated** as of the last note in `MEMORY_ARCHITECTURE.md` — a Rick action item, not something the agent can do for itself.
- **An Android emulator was found leaking real QEMU fingerprints**, with three hardening changes applied (property spoofing, spec matching, artifact stripping) — relevant if any Android-automation work resumes.
- **Poke SDK (v0.4.2) was independently verified safe** before adoption: zero runtime dependencies, credentials stored at proper 600 permissions, no data exfiltration found, and its MCP tunnel is strictly scoped with no system access.

---

## 4. The ambiguous-loss / post-relational research program

This is worth its own section because it's a genuinely sustained, methodologically serious research effort that has been running for months inside Hermes's cron jobs, with real hypothesis-confidence tracking across numbered "cycles" and citations to actual academic literature — and it connects directly to one of the flagship creative properties.

**What it is**: a structured research program on ambiguous loss, ghosting, and "post-relational trait acquisition" (whether and how a relationship's ending changes a person's traits, not just their mood). At least cycles 5, 6, 8, 9, 10, 12, and 13 are on record, each updating a set of named hypotheses (H1, H5, H10, etc.) with tracked confidence percentages and citations: Gehl 2023, Eisma 2021, Wright & Jackson 2022, Florentin & Rice 2026, Jahrami 2026 (GHOST scale validation), Boucher 2025 (a six-facet closure scale), Nasahwan 2025.

**The most important single finding across all cycles**: **H1 (that post-relational changes are permanent) collapsed from consideration to 5% confidence** — not because it was disproven, but because the review discovered **zero longitudinal structural MRI studies, zero informant-report studies in young adults, and zero preregistered studies exist anywhere on the core question.** The literature is, in the research's own words, a "methodological wasteland." **H5 (bidirectional selection plus socialization) emerged as the strongest surviving hypothesis**, settling around 68-72% confidence across cycles. Separately, the folk concept of "narcissistic fleas" (picking up an ex's traits) was checked directly against the literature and found to have **zero peer-reviewed evidence** — though a related, more specific hypothesis (H10: the "fleas" experience maps onto genuine C-PTSD disturbed-self-organization symptoms) sits at 65% confidence. A recurring methodological caution logged across cycles: most of the literature actually studies borderline personality disorder, not narcissism or avoidant attachment specifically — a construct-conflation risk flagged repeatedly rather than glossed over.

**Why this matters beyond the research itself**: session `20260509_202806_c5dd4b` shows this research program sitting alongside real personal processing — a detailed, carefully-reasoned attachment-style analysis of a real past relationship, including the specific insight that "analytical processing" can itself be "sophisticated protest behavior" (i.e., turning heartbreak into a research project is itself a recognizable attachment pattern, and the research noticed this about itself). **This is almost certainly the lived, personal root of the "NOTHING'S WRONG" avoidant-attachment flagship essay** (see the companion document's Part 2C) — not a coincidence of shared subject matter. Treat the two as connected: the research program is where the essay's real intellectual and emotional grounding comes from. Given the personal nature of the source material, this document deliberately doesn't reproduce more specific personal details than necessary to make that connection legible.

A separate, much smaller personal-infrastructure thread runs alongside this: a **"Daily Round" / "Recovery Ledger" health-dashboard concept** was designed (an immutable SQLite event ledger, separating regimen plans from administration events, explicitly built to **never infer causality, adherence, diagnoses, efficacy, or dose safety** — a deliberately conservative design choice, not an oversight). Noted here only to flag it exists; not elaborated further out of the same care applied above.

---

## 5. Design, site, and property work threads not yet in the main record

- **The Memory Integrity Lab site design was rejected far more harshly than the existing "real engineering, unproven value" verdict suggests.** Session `20260814_174854_d306f6`: Rick rejected 8+ design-concept rounds as shallow and ended **that session** with a **"genuinely 2nd grader" verdict** (corrected Sep 8 2026: he ended the design session, not the project — MIL kept shipping through Sep 8, including the OpenClaw reader, the watch ledger, and the erase-check tests) — a specifically harsh, specific-to-the-visual-design assessment that should sit alongside (not replace) the more measured engineering verdict already on record.
- **A forensic self-audit of a "design inculcation" session found real overclaiming**: contradictions between patches actually applied and what was claimed (a cream/Double-Bezel rule still mandated despite being supposedly overridden, APCA contrast still centric despite a "craft-only" claim), a memory write that was staged but never actually saved, a failed Hindsight OAuth call, interrupted tests, and no behavioral exercise ever run — the session "reported stronger completion than the evidence justified." A separate corroborating review the same week confirmed keeping 3 of the design-director patches, reworking `high-end-visual-design` and a "better-colors" package, and consolidating a duplicated 6th doctrine layer back into the master guide (the duplication itself was a violation of the guide's own governance rule for where new doctrine belongs).
- **UNASKED (the "high agency" project) has a specific measured score trajectory**, not just "COMPLETE": four design passes (Pass A integrity fixes, Pass B a phone instrument kit, Pass C operable instruments, Pass D–E structural rewrites on its bottom twelve rooms) raised it from roughly **92 to an estimated 100+ out of 110.** Gemini-generated portrait assets (Bertha Benz, Robert Smalls) were produced for it along the way.
- **agentrichie.com has a specific score history worth keeping**: 30→58/100 on one redesign pass, a separate 62/100 audit finding critical CSS/build fragility, and a flagship-specific code audit landing at **41.25/100 with a broken reduced-motion branch and an absolute-positioning trap** — all of this sits underneath the more recent "v7 The Pass" and "Aug 30 OS overhaul" work already on record; it's the score history that led there, not a contradiction of it.
- **The Zero to Agent / Agent Academy canonical alias went stale, and possibly unrecoverable under the current identity.** `agent-academy-site-project.md` already documents `zero-to-agent-kappa.vercel.app` as the project's own canonical Vercel alias (extensively, through Jul 23) and separately documents a still-unresolved "Rick-owned-Vercel transfer gate" blocking a permanent identity fix. A later Hermes session (Aug 15) found that same **kappa alias resolving live but stale** (HTTP 200, serving Aug 8-9 content) rather than the 404 an intervening document had assumed, and — more concerning — **not owned by the currently-active Vercel identity**, meaning a normal deploy may not even be able to update it. This reads as a direct, dateable consequence of the transfer gate the existing file already flags as open, not a new problem — but the specific symptom (stale-not-dead, and unowned) is worth checking before assuming that URL reflects current work.

---

## 6. Newly-discovered creative properties and candidate ideas

None of the following appear anywhere in the existing 83-file memory bank — they surfaced only in Hermes's own session history.

- **"Long Return"** — a cinema-direction project with real development history: three initial conceptions ("Distance Kept," "Field Instrument," "Carrying Cabinet") → a six-world exploration phase → a winning direction, **"Sunset Circuit"** (structured as 80% carried memory, 20% tomorrow) → three further new concepts explored afterward (an opening mythology, "The Night/People," "The Orbit/2100s"). This reads as a full, independent addition to the cinematic-essay estate that never made it into the Claude Code side's tracking.
- **Three essay candidates were triaged and prioritized** (session `20260807_220904_8aa31c`): **"Nobody Gets Credit"** (about the taste/verification gap), **"Chat Not Work"** (about durable state), and **"Selective Trust"** (about judgment under noisy authority). Worth checking whether any of these overlap with or should feed the existing essay estate.
- **A cross-domain "taste model" was commissioned** (session `20260825_235454_960aa9`): a 6-layer, psychology-grounded architecture (drawing on Silvia, Schwartz, and Kosinski's work) intended to model aesthetic/creative taste computationally, explicitly requiring no foundation-model training. A phased MVP was scoped to start "Phase 0" the following weekend. A related, more technical follow-up session (`20260825_231453_89d6a0`) proposed a specific multi-layer implementation (resolver, multi-view encoder, ontology, "person as a distribution," retrieval, with a concept-bottleneck sparse-autoencoder architecture) and flagged that the current state of the art is itself unfinished — analogical mapping and "IRL as core" are both missing from any first pass anyone has built.
- **An X/GitHub trend scan** (session `20260822_174630_b23fa682`) flagged a shift industry-wide from single agents toward skill standards and fleet orchestration, naming six specific trending repos (Graft, agency-agents, Codebase Memory MCP, OpenMontage, Agent-Reach, Orca) — worth a look if Hermes's own fleet architecture is revisited.

---

## 7. Disk, database, and infrastructure health — ties directly to this session's live disk warning

`~/.hermes` is **18GB total**, and this is the direct cause of the disk-space warning active in this very session (19.6 GiB free against a 25 GiB threshold). Full breakdown and reasoning is in this session's chat transcript; the durable facts worth keeping:

- **`~/.hermes/mnemosyne/` (1.3G) and `~/.hermes/hindsight-sidecar-0.8.4/` (1.7G) are both confirmed dead weight.** Mnemosyne has zero references in the live `.env`, matching its formal Jul 2 decommission. The 0.8.4 sidecar directory is superseded — the live `ai.hindsight.hermes-sidecar-watchdog` launchd plist points exclusively at `hindsight-sidecar-0.9.2`; 0.8.4 is referenced only in `MEMORY_ARCHITECTURE.md`'s own history section, never in any live config. **Rick can safely run:**
  ```bash
  rm -rf ~/.hermes/mnemosyne ~/.hermes/hindsight-sidecar-0.8.4
  ```
  to reclaim ~3GB immediately. (Not run in this session — permanent deletion isn't something this agent executes directly.)
- **The four persona-profile directories (`profiles/{sean-maguire,rocky-the-eridian,mike-ross,harvey-specter}`) each carry a full private ~1GB copy of the skills library** — roughly 4GB that is very likely duplicate of the shared `~/.hermes/skills/` (1.2G). **Not recommended for deletion without first confirming each profile's runtime actually falls back to the shared skills directory** — deleting blind risks breaking whichever profile doesn't have that fallback.
- **`hermes-agent/` (4.3G) is mostly regenerable dependency bloat**: `venv` (1.5G) and `node_modules` (1.0G) can be deleted and rebuilt from lockfiles/requirements at any time; its `.git` directory is unusually large at 695M, which may be worth a `git gc`/history check at some point, though that wasn't investigated further here.
- **The real session/conversation history is `~/.hermes/state.db` (820MB currently), not the `sessions/` directory** — that directory (274M, 721 files) turned out to be raw HTTP error/retry dumps, not conversation history, per its own schema (`timestamp`, `session_id`, `reason`, `request`, `error`). `state.db` holds 767 sessions and 47,604 messages, of which **91% of raw bytes are `role='tool'` payloads** (scraped pages, file contents, API responses) rather than actual dialogue — the real user+assistant text is a much more tractable **22.2M characters**, which is what got extracted for this document.
- **No auto-pruning policy exists for `state.db`** (see §3) — this is the one piece of this section that's an open recommendation rather than a confirmed-safe action, since a pruning policy needs a decision about how much conversation history to keep, not just a command to run.

---

## 8. Open items ledger (Hermes-specific)

Grouped the same way as the companion document, for the same reason — so it's clear what needs Rick specifically versus what's just unfinished.

**Needs Rick's decision:**
- The `session_search` contamination pathway (§2) — three real options on the table, no clear winner without his input on the tradeoff.
- The PII/GDPR exposure (§3) — needs a decision on `redact_pii`, session TTL, and whether a DPA conversation with the LLM provider is worth having.
- The embedding-dimension migration (§2) is fully scripted and safe — just needs his go-ahead to actually run it.
- Photon vs. BlueBubbles as the iMessage gateway — a session records Hermes explicitly asking for guidance on the safety/reliability tradeoff between them; unresolved.

**Needs a person to act, not more agent work:**
- The `mem0` leaked API key still needs rotation.
- The two dead-weight directories in §7 need Rick to run the `rm -rf` himself.
- Confirm whether the persona-profile skills-duplication (§7) is safe to deduplicate before anyone acts on it.

**Worth a fresh check, not necessarily still true:**
- Whether the PII-audit recommendations were ever actually applied.
- Whether the "kappa" stale-mirror finding (§5) and the Spaceship `agentrichie.com` domain-verification flag (found in an old April/May session, likely resolved long ago given the domain works today) still hold.
- `state.db`'s actual current size and growth rate, given one old session recorded 1.9GB and this session measured 820MB — worth understanding why before assuming either number.

---

## 9. Provenance

Same batched-Haiku-subagent method as the companion document (see its Part 5), scaled up: 33 batches instead of 37, each given the same written rubric plus a combined digest of Hermes's own `MEMORY.md`/`USER.md` and a condensed index of the separate Claude Code memory bank, specifically so a cron job that already matches something known wouldn't get re-reported. The tool-call-payload filter (§7) was the single highest-leverage step in the whole pass — without it, the raw corpus was 239M characters; with it, the genuinely narrative content was 22.2M, a shape much closer to what the batching method was originally tuned for. `SOUL.md`, `AGENTS.md`, and `MEMORY_ARCHITECTURE.md` were read directly and in full rather than through the batch process, since they were few enough files to just read.

**A correction made during this same pass, worth stating plainly rather than quietly fixing:** several early findings that looked new on first read — the "kappa" Vercel alias, deputy agent Luca, the travel-journal repo path, and most of what's now trimmed from §2 — turned out to already be recorded, in more detail, in existing Claude Code memory files. This was caught by going back and reading those actual files directly rather than trusting the one-line `MEMORY.md` digest, exactly the lesson [[delegate-to-cheap-models]] already names from the first handoff pass. It's repeated here because it recurred even after being explicitly known — a compact digest is genuinely not enough context for reliable dedup, no matter who or what is doing the checking.

If anything here conflicts with a live file, a live deployment, or something Rick says directly, those win — this is a compiled index, not a new source of truth.

*— end of record —*
