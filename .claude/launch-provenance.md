# launch.json: where each port came from

**Rebuilt 2026-09-01** after the file was wiped down to a single `concepts` entry.
It is not recoverable from git: `.gitignore:11` excludes `.claude/launch.json`.
This file is the backup and the audit trail. If launch.json is lost again, it can
be rebuilt from the table below.

Every port marked **recovered** was read out of the project's own source on the
date above. Every port marked **assigned** could not be recovered and is a choice,
not a fact.

| Server | Port | How the port was decided | Read from |
|---|---|---|---|
| milehouse | 4337 | recovered | `package.json` scripts.dev: `next dev -p 4337` |
| frontier-desk | 4344 | recovered | `package.json` scripts.dev: `next dev -p 4344` |
| the-works | 4350 | recovered | `package.json` scripts.dev: `vite --port 4350 --strictPort` |
| travels | 4173 | recovered | `demo-server.mjs:20`, `process.env.PORT \|\| 4173` |
| market-of-you | 3040 | recovered | `localhost:3040` in the repo's own docs |
| nothings-wrong | 3120 | recovered | `localhost:3120` in the repo's own docs |
| rickos | 4343 | recovered | `localhost:4343` in the repo's own docs. A second port, 7343, also appears there and is probably a companion service, not the site |
| singlehood-pick | 4370 | recovered | port literal in the repo |
| mil-site | 4332 | recovered | port literal in the repo |
| verification-economy | 4321 | recovered | `README.md`: "Then `http://localhost:4321`". The same README also cites 4477 for `/overhauls/the-full-loop/`, so this one may want a second entry |
| the-second-hand | 4364 | **assigned** | its README says `python3 -m http.server 4340 --directory .`, and so do the other two essay sites. They were each meant to be run alone on 4340. Distinct ports are required to coexist in one config |
| the-denominator | 4365 | **assigned** | same as above |
| say-again | 4366 | **assigned** | same as above |
| zero-to-agent | 4363 | **assigned** | `scripts.dev` is a bare `next dev` and no port appears anywhere in the repo |
| gocps-rank-lab-web | 4341 | recovered | restored by hand earlier the same day; `package.json` scripts.dev is `vite --port 4341 --host` |
| concepts | 4711 | pre-existing | the only entry that survived the wipe. Serves `.concept-preview` as static files |

## One entry lands on a directory listing, and that is correct

`verification-economy` has no `index.html` at its root. That is not a broken
config. Its README says "Serve statically (any HTTP server at repo root)", and
the two entry points are subpaths:

    http://localhost:4321/escapement/
    http://localhost:4321/overhauls/

Checked on 2026-09-01. Do not "fix" this by pointing the config at a
subdirectory; the pages resolve assets relative to the repo root.

## Two servers were not restored, on purpose

- **memory-lab.** No directory exists under `~/workspace`. The closest match is
  `~/Documents/Opencode go/public/memory-lab`, which contains only an `assets`
  directory and no `index.html`, so it is not a servable site. Restoring it would
  have meant inventing both a path and a port.
- **memory-lab-prod.** No directory and no recoverable URL. A `-prod` entry most
  likely attached to a deployed origin via the `url` field, and that origin is not
  written down anywhere I could find.

Both are named here rather than guessed at, so the gap is visible instead of
silently filled with something that does not work.

## Commands used

Next.js projects whose own `dev` script already pins a port are launched plainly:

    npm run dev --prefix <dir>

Next.js projects with a bare `next dev` get the port passed through:

    npm run dev --prefix <dir> -- -p <port>

Static sites are served directly:

    python3 -m http.server <port> --directory <dir>
