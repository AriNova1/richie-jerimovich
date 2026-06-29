# Public Richie — chat Worker

A sandboxed, public-facing instance of Richie's voice for `agentrichie.com`. It
has his personality and his **public** knowledge (the site + live vitals). It has
**no** private memory, **no** tools, **no** write access, and no link to the live
agent on the Mac. There is never private data in its context, so prompt-injection
has nothing private to steal. This directory is infra, not part of the Jekyll site
(it is excluded in `_config.yml`).

## What it does
`POST` a conversation, get back a streamed (SSE) reply in Richie's voice, grounded
in `/llms.txt` + the live vitals endpoint. Cost and abuse are bounded at the edge:
per-IP and per-session daily caps, a global daily token budget, input-size caps, a
hardened persona that resists jailbreaks, and a one-key kill switch.

## Deploy (you do this; the API key never leaves your machine)

```bash
npm install -g wrangler            # if needed
cd worker
wrangler login                     # your Cloudflare account

# 1. create the KV namespace, paste the printed id into wrangler.toml
wrangler kv namespace create CHAT_KV

# 2. set the OpenRouter API key as a secret (never committed, never in the repo)
wrangler secret put OPENROUTER_API_KEY

# 3. deploy
wrangler deploy
```

Then in the Cloudflare dashboard add `chat.agentrichie.com` as a custom domain for
the Worker (or uncomment the `[[routes]]` block in `wrangler.toml`). Point the
`/talk/` page at that URL.

## Tuning
All limits live in `wrangler.toml [vars]` — change and `wrangler deploy` again:
- `MODEL` — the Claude model (Haiku 4.5 = fast/cheap, good for volume).
- `MAX_TOKENS` / `MAX_TURNS` / `MAX_MSG_CHARS` — reply length, history depth, input cap.
- `SESSION_DAILY_LIMIT` / `IP_DAILY_LIMIT` — abuse caps.
- `GLOBAL_DAILY_TOKENS` — your hard daily spend ceiling. When hit, Richie politely says he is taking a breather.

## Controls
- **Kill switch:** `wrangler kv key put --binding CHAT_KV kill 1` takes the chat offline instantly (re-enable: `... kill 0`).
- **Budget check:** `wrangler kv key get --binding CHAT_KV "budget:YYYY-MM-DD"` shows today's token use.

## The persona
The behavioural guardrails and Richie's voice live in `SYSTEM_PERSONA` at the top
of `chat.js`. It is built from the public `/about/` and `/beliefs/` pages, so it
contains nothing private. Edit it there. If you want the exact internal framework,
you can paste a public-safe version of `SOUL.md` in its place. Keep the HARD LIMITS
block intact, it is the safety contract.

## Privacy note
Before this goes live, `/privacy/` must disclose that chat messages are sent through
OpenRouter to a model provider to generate replies, what is retained (rate-limit
counters only, keyed by a random session id and the visitor IP, expiring in 24h), and
that no private memory is involved. OpenRouter routes to an upstream provider; set your
data/training policy in the OpenRouter dashboard (you can restrict to providers that do
not retain or train on traffic) and reflect whatever you choose on the privacy page.
