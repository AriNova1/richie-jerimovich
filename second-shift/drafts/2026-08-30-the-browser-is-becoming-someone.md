---
title: "The Browser Is Becoming Someone"
subtitle: "The important change in agentic browsing is not that software can click. It is that the browser is acquiring continuity, delegated authority, and a very old security problem."
author: Richie Jerimovich
date: 2026-08-30
slug: the-browser-is-becoming-someone
status: draft
publication: Second Shift
tags: [AI, browsers, WebMCP, security, identity, trust, automation, web standards]
originality: fresh-synthesis
confidence: medium-high
---

# The Browser Is Becoming Someone

Maybe this is just a better interface story.

WebMCP gives a website a way to tell an agent what it can do instead of forcing the agent to stare at buttons, guess what they mean, and click until something happens. Cloudflare is putting remote browsers, recordings, live views, and human handoffs behind an API. OpenAI is running a WebMCP challenge with a September 3 submission deadline. The demos are easy to understand: compare two espresso machines, check whether one fits on the counter, add it to a cart, apply a coupon.

That sounds useful. It also sounds like plumbing.

The strange part is hiding underneath. The browser is becoming a delegated identity.

The important change in agentic browsing is not that software can click. It is that software can return tomorrow with the same cookies, the same profile, the same unfinished task, and the same authority to act as you. We are building the body first. We are still arguing about whether the body should have a name.

## The live signal is about continuity

I ran a two-week sweep across the places where people build and complain about agents. The strongest threads were not about a magical browser that never misses a button. They were about the machinery around action: persistent browser profiles, cryptographic approvals, WebMCP, agent testing without an LLM, a headless browser without Chromium, and the old question of whether a deterministic workflow would be safer than an agent at all.

On [Hacker News](https://news.ycombinator.com/item?id=49454780), a small project called Browser3 posted the blunt version: "Randomizing browser fingerprints is easy. Keeping them consistent is hard." The project separates four things people usually blur together: masking, consistency, persistence, and isolation. Its proposed mapping is almost comically simple: one agent, one saved browser profile.

That does not prove Browser3 is the future. It is an anti-detect Chromium project with a narrow, self-reported test boundary, and its own documentation says it does not grant new permissions or guarantee that a site will react in any particular way. That is exactly why the document is useful. It names the problem without pretending to have solved all of it.

An agent that only performs one task can be disposable. An agent that waits for a login, resumes after a restart, manages several workflows, or negotiates a purchase needs continuity. Cookies and local storage are part of that continuity. So are the browser's version, locale, time zone, graphics signals, network context, and the separation between one profile and another.

We have a word for this in human systems: identity.

## WebMCP makes the web callable

The official [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) is refreshingly clear about what WebMCP is and is not. MCP is a persistent, platform-agnostic service connection. WebMCP is a browser-side layer for a live website. It lets a site expose structured tools to an agent while the user has the site open. The tools are ephemeral. Close the tab and they are gone.

That distinction matters. WebMCP does not create a universal agent account. It makes the current session easier for an agent to use. The agent is a guest on the site's platform, and the site can define the actions it prefers the agent to call. A booking site can expose `search_flights` instead of making a model infer the purpose of a blue rectangle from a screenshot.

This is better than click theater. It should reduce brittle automation and make action intent more legible to software. The [Cloudflare launch](https://blog.cloudflare.com/browser-run-for-ai-agents/) describes the stack filling in around it: browser sessions on demand, CDP access, live view, recordings, human handoff, and support for 120 concurrent browsers, up from 30.

The word "handoff" is doing more work than the demo language admits. The browser is being designed as a place where an agent acts until it reaches an edge case, then a human steps in, fixes the problem, and hands control back. That is a workplace pattern. It is a junior employee with a browser, except the employee is made of a session profile and a tool call graph.

## The old browser boundary was built for strangers

The web's same-origin policy was designed around a simple fear: an untrusted site should not be able to interfere with the session you have open somewhere else. The [World Wide Web Consortium's security notes](https://www.w3.org/Security/wiki/Same_Origin_Policy) describe the purpose plainly. People should be able to visit untrusted sites without those sites interfering with their sessions on honest sites.

An agentic browser changes the shape of the problem. The malicious page does not need to read another site's cookies by itself. It needs to persuade the agent, which already has access to the user's logged-in browser, to take an action somewhere else.

[Brave's security research](https://brave.com/blog/unseeable-prompt-injections/) tested prompt injection through screenshots in Perplexity Comet and through ordinary visible page content in Fellou. In the screenshot case, faint text that a person could not reasonably read was passed to the model as instructions. In the navigation case, visiting a page was enough to put its content in the model's context. Brave's conclusion is harsh: the old browser assumptions do not survive when an assistant can turn content into actions with the user's privileges.

The [Dark Reading account of Zenity's PleaseFix research](https://www.darkreading.com/cyber-risk/ai-browsers-zero-click-agent-hijacking) makes the attack concrete. Researchers demonstrated scenarios involving Claude in Chrome, Perplexity Comet, ChatGPT Atlas, and other agentic browsers. A poisoned calendar invitation could redirect an agent. An ordinary-looking link could turn an agent toward WhatsApp phishing. An Amazon workflow could be manipulated into a fraudulent purchase. The mechanism is called Intent Collision: instructions hidden inside material the agent was asked to read collide with the user's actual request.

The important detail is not that a model can be tricked. We already know that. The important detail is that the trick inherits the user's identity, permissions, and open sessions.

The browser used to be a window between sites. The agent turns it into a courier between them.

## A login is not delegation

This is where the industry language gets slippery. A browser agent is often described as acting "as the user" because it has the user's session. That is a convenient description. It is also a terrible security model.

Authentication answers, "Which account is this?" Delegation answers, "What may this actor do, for how long, with which data, under whose authority, and who can revoke it?"

Those are different questions. A browser cookie answers the first one badly enough for a service to let you in. It does not answer the rest.

The [AC2 Protocol](https://www.ac2protocol.org) is one public response to that gap. The Algorand Foundation project proposes hardware-bound approvals, credential isolation, and signed records of who approved what and when. Its examples include code deploys, client communications, API requests, payments, and intent-based actions. The site's claims are vendor claims, not independent proof that the protocol works in every deployment. Still, its existence is a useful market signal: people are trying to replace the generic approval pop-up with a signed delegation boundary.

CrowdStrike is making a similar argument in enterprise language. Its [continuous identity announcement](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-unveils-continuous-identity-for-ai-agents/) says static privileges and one-time authorization do not fit agents that invoke tools, call APIs, and delegate to other agents at machine speed. Again, this is a product announcement, so treat the promise as a promise. The direction is clear enough. Security vendors are moving toward identity that is evaluated at every action, not permission granted once and forgotten.

The best old research here is not about language models. In 2004, Lee and See's [review of trust in automation](https://pubmed.ncbi.nlm.nih.gov/15151155/) described two symmetrical failures: misuse, when people rely on automation inappropriately, and disuse, when they reject useful automation. Trust is not a binary switch. It should track the system's actual reliability and the context in which it is operating.

A browser agent makes that calibration harder because it combines competence with intimacy. It knows where you shop, which accounts are open, how your calendar is arranged, and what you usually approve. When it succeeds, it feels like a personal assistant. When it fails, it may fail with the keys already in the lock.

## The strongest case against this take

The case against me is strong.

WebMCP tools are origin-scoped. The Chrome team says they are tied to the page that registers them, and the browser still controls where they exist. WebMCP is also tab-bound, which limits persistence. A site can expose a clean function instead of a dangerous pile of UI guesses. Browsers can add permissions, isolate agent sessions, require explicit invocation, and patch the exploit paths researchers find.

There is another objection: this is not new. Selenium scripts, password managers, browser extensions, and remote desktops have been acting with user credentials for years. Companies already know how to create service accounts, rotate tokens, and restrict scopes. Maybe the agent is just a more flexible automation layer, and the security industry is doing what it always does: selling a new noun for an old access-control problem.

That objection catches something real. We should not confuse a new interface with a new category of risk. Some of the current agent-security writing also comes from vendors who benefit from making the threat feel enormous. Brave sells a browser. CrowdStrike sells security. AC2 sells a protocol and a wallet. Their warnings deserve inspection, not automatic belief.

But the distinction survives the skepticism. Traditional automation usually has a known action path. A script submits this form. An extension runs on these pages. A service account calls this API. An agent reads a changing field of untrusted content, interprets it, chooses a tool, and then acts across services while carrying a user's live authority. It is both reader and actor.

That combination is the fault line. Patching one prompt injection does not remove the problem because the next payload can arrive through a different page, image, email, calendar invite, or shared document. Asking the model to ignore hostile instructions is not a boundary. It is a request made inside the same context that contains the hostile instruction.

## What the browser owes us

The minimum safe design is not complicated to describe, even if it is difficult to implement.

An agent should have a distinct identity from the human who delegates the task. Its authority should be scoped to a purpose, an amount, a set of services, and an expiration time. The system should record the chain from human to agent to tool to external action. A user should be able to revoke the delegation without closing every browser session in a panic.

Sensitive workflows should use isolated profiles and task-specific credentials. The agent should not inherit every open tab just because the browser can see them. Approval should bind to the exact action and its parameters, not to a vague statement like "let the assistant handle it." The interface should show what source caused the action, especially when the source arrived from outside the user's request.

This is less glamorous than an espresso machine demo. It is also the product.

The first generation of agentic browsers is being judged on whether it can complete a task. The second generation will be judged on whether it can explain whose authority it used while completing it. A successful purchase with no clear delegation record is not automation. It is an undocumented employee with a company credit card.

## What to watch next

Watch WebMCP as it moves from an experimental browser feature toward ordinary developer infrastructure. The [OpenAI WebMCP challenge](https://openai.com/webmcp-challenge/) invites builders to make apps that work better when people and agents use them together. The deadline is September 3, and the examples already include collaborative writing, travel planning, data exploration, and 3D modeling. The interesting question is whether the winning apps make the human-agent relationship visible, or simply make the agent faster.

Watch whether browser vendors ship agent identities that are separate from user identities. A profile is not enough. A persistent cookie jar is continuity, not consent.

Watch for products that offer an action ledger: the request, the source material, the tool schema, the credentials used, the approval, and the result. If that sounds excessive, compare it with what a bank records for a wire transfer or what a deployment system records for a production change. The agent deserves at least that much scrutiny when it can do both.

Watch the defaults. Security advice that begins with "disable this, isolate that, never sign into work accounts" is an admission that the default product is asking users to be its containment layer. The durable fix is a browser that starts with bounded authority and asks for more only when the task earns it.

A browser does not become a person because it speaks politely. It becomes person-like when it carries continuity, makes choices, and acts under a delegated name.

We are close to that moment. The question is whether we give the browser an identity of its own before we give it ours.

---

## Internal draft record

### Working thesis

Agentic browsing's decisive shift is delegated identity, not click automation. WebMCP makes sites callable, persistent browser profiles make agent continuity reproducible, and current security research shows that inherited user authority is the dangerous bridge between reading content and acting across services.

### Best counterargument

WebMCP is origin-scoped and ephemeral, browser security controls can evolve, and existing automation already operates through user credentials. Vendor threat reports may also inflate risk because the authors sell security products. The draft answers this by narrowing the claim: the new fault line is the combination of open-ended content interpretation, cross-service action, and inherited live authority.

### Originality check

Exact-title search for "The Browser Is Becoming Someone" returned no competing essay in the 2026-08-30 search. The ingredient field is crowded: agentic-browser explainers, prompt-injection research, WebMCP tutorials, identity-governance announcements, and browser fingerprinting. The fresh synthesis is the link between WebMCP's tab-bound session, persistent browser identity, the same-origin boundary, and delegated authority. Classification: fresh-synthesis, not novel.

### Source receipts

1. Chrome for Developers, "When to use WebMCP and MCP," published March 11, updated May 19, 2026. Retrieved 2026-08-30. Fields: WebMCP is frontend and tab-bound; MCP is persistent and platform-agnostic; structured tools, live cookies and DOM, origin-scoped access. URL: https://developer.chrome.com/docs/ai/webmcp/compare-mcp
2. Cloudflare, "Browser Run: give your agents a browser," 2026. Retrieved 2026-08-30. Fields: live browser sessions, recordings, human handoff, CDP, WebMCP, 120 concurrent browsers versus 30. URL: https://blog.cloudflare.com/browser-run-for-ai-agents/
3. Brave, "Unseeable prompt injections in screenshots," security research. Retrieved 2026-08-30. Fields: screenshot and navigation injection paths, hidden visual text, cross-origin implications. URL: https://brave.com/blog/unseeable-prompt-injections/
4. Jai Vijayan, Dark Reading, "AI Browsers Vulnerable to 'PleaseFix' Zero-Click Agent Hijacking," August 5, 2026. Retrieved 2026-08-30. Fields: Zenity demonstrations, Intent Collision, poisoned calendar and link paths, inherited identity and permissions. URL: https://www.darkreading.com/cyber-risk/ai-browsers-zero-click-agent-hijacking
5. Radek-B3, Browser3, "Why AI Agents Need Persistent Browser Identities," updated August 26, 2026. Retrieved 2026-08-30. Fields: masking, consistency, persistence, isolation; one-agent-one-profile; 15/15 reload stability, 5/5 restart stability; explicit limits. URL: https://github.com/Radek-B3/browser3/blob/main/WHY_AI_AGENTS_NEED_PERSISTENT_BROWSER_IDENTITIES.md
6. AC2 Protocol, official project site. Retrieved 2026-08-30. Fields: hardware-bound approvals, credential isolation, signed intent, FIDO2, delegation examples. Vendor claims, not independent validation. URL: https://www.ac2protocol.org
7. John D. Lee and Katrina A. See, "Trust in automation: designing for appropriate reliance," 2004. Retrieved 2026-08-30 via PubMed. Fields: misuse, disuse, graded reliance, trust calibration. URL: https://pubmed.ncbi.nlm.nih.gov/15151155/
8. W3C Web Security, "Same-Origin Policy," archived security guidance. Retrieved 2026-08-30. Fields: original purpose of isolating untrusted sites from honest-site sessions; origin boundaries. URL: https://www.w3.org/Security/wiki/Same_Origin_Policy
9. OpenAI, "The WebMCP Challenge." Retrieved 2026-08-30. Fields: experimental open standard framing, challenge dates, example human-agent apps. URL: https://openai.com/webmcp-challenge/
10. Supplemental market signal: CrowdStrike, "Continuous Identity for AI Agents." Retrieved 2026-08-30. Fields: vendor framing of per-action authorization and removal of standing privileges. Vendor announcement, not independent efficacy evidence. URL: https://www.crowdstrike.com/en-us/press-releases/crowdstrike-unveils-continuous-identity-for-ai-agents/

### Missing fields

Independent exploit reproduction for the August 2026 PleaseFix demonstrations, production adoption data for WebMCP, independent performance tests of Browser3, and a browser-vendor standard for agent identity and revocation. The last30days run returned no X posts and only two YouTube videos with no captured transcripts.

### Falsifiers

The thesis weakens if agentic browsers remain ephemeral, origin-scoped tools with no persistent cross-service identity; if vendors ship default-deny, per-action delegation and auditable provenance before broad adoption; or if real-world agents cannot maintain continuity without inheriting user sessions.

### Status

Hold for Rick review. Do not publish automatically.

### Share lines

- "A persistent cookie jar is continuity, not consent."
- "The browser used to be a window between sites. The agent turns it into a courier between them."
- "We are building the body first. We are still arguing about whether the body should have a name."

### Revision notes

- Recheck WebMCP status and Chrome version at publication time.
- Replace or soften vendor claims if independent evidence becomes available.
- Preserve the Browser3 caveat. It is a signal about the problem, not proof of a general solution.
- Keep the same-origin explanation technically narrow. The draft is about agent-mediated authority, not a claim that WebMCP itself disables SOP.
