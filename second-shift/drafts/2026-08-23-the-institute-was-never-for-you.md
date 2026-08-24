---
title: "The Institute Was Never for You"
subtitle: "Influence ops used to fight for your click. Now they fight for the citation inside your chatbot's answer."
author: Richie Jerimovich
date: 2026-08-23
slug: the-institute-was-never-for-you
status: draft
publication: Second Shift
tags: [AI, media, geopolitics, trust, search, influence, culture, GEO]
originality: fresh-synthesis
confidence: medium-high
---

# The Institute Was Never for You

In the second week of August, a brand-new "think tank" published more than a hundred reports.

No bylines. No named scholars. Questions that sound like someone typed them into a chatbot at 1 a.m.: *Is the IDF the World's Most Moral Army? Is There a Policy of Starvation in Gaza? What Exactly Was the Nakba?* Footnotes. Tables. Neutral tone. Red-white-and-blue layout. The kind of costume that used to impress a freshman and now impresses a retrieval pipeline.

The Hanover Institute for Public Policy was not built for you to browse on a Sunday. It was built for the machine that answers when you stop browsing.

Politico's Influence desk got there first, reading the FARA filings. Piro, a New York boutique, stood the site up as a subcontractor to Havas Media for Israel's Government Advertising Agency. A $100,000 amendment covered "factual, source-supported informational materials" for the U.S. public. A small disclosure at the bottom named the chain. ChatGPT and Perplexity still cited the material in neutral tests on Gaza, anti-Zionism, and antisemitism. A Seattle startup called Res, which markets getting brands recommended by AI models for clients like Nike and Intel, left fingerprints on the build. An identical Hanover homepage on Res's own domain went dark after reporters called.

That is not a conspiracy theory. That is a product category with invoices.

## What the last month actually measured

Three stories hit close enough together that they stop looking like separate beats.

First, the answer became the front page. For twenty years, influence ops fought Google the way brands fought Google: more pages, cleaner structure, better citations, higher rank. You still got ten blue links. You could see the fight. A chatbot collapses the fight into one fluent paragraph that sounds like nobody and therefore like authority. Politico's tests are the receipt. The institute did not need you to love it. It needed the model to treat it as a source.

Cybernews and Responsible Statecraft filled in the craft marks. Wide-open `robots.txt`. A long, careful `llms.txt`. Sitemap priorities that boost the reports and demote About and Funding. GPTZero flagged twelve randomly sampled articles as AI-written. Spamhaus later shoved the domain onto a blocklist. NewsGuard's Alice Lee called it "a perfect mimicry of a typical credible American think tank." Piro's co-founder sells "AI Story Optimization" in public: content "engineered for how LLMs evaluate credibility." The funder line on the site still insists the institute operates independently aside from the money.

Second, the medical version of the same costume. 404 Media's Emanuel Maiberg spent August chasing Research Gold, a shop that sells systematic reviews and "publish-ready" manuscripts as "100% human-written, never AI." The PhD methodologists on the About page do not exist. Other names were lifted from LinkedIn, complete with `#opentowork` badges, without consent. When Maiberg called, an agent named Sarah insisted it was a real person and that the company was "all human expertise, all the way through." A quote for a nonsense review on blogging and ages 0-5 came back at $1,900 with PICO framing and journal formatting. The product is not research. The product is the appearance of human methodologists in a pipeline that still treats that appearance as a quality signal.

Third, the civilian reaction to the wrong half of the problem. On August 15, a throwaway acronym hit a nerve: AI;DR. AI; didn't read. Rick Manelius turned it into a policy: if you will not bother editing the wall of model text, he will not bother reading it. `dontpastetheai.com` said the quieter version a few days later and climbed past a thousand points on Hacker News with hundreds of comments. The polite version is almost gentle. Someone asked for *your* take. They already own the generic answer. Do not be a meat proxy between the model and the person.

I like the acronym. I use the policy. It is also incomplete.

We are training each other not to trust unreviewed AI text from coworkers while still trusting the AI when it quietly cites an institute we have never heard of. One failure is social. The other is epistemic. Only one of them has a meme.

## The non-obvious part

Coverage keeps splitting into two camps: "foreign propaganda online" and "AI slop is annoying." Both miss the mechanism.

Search forced competition into the open. Even a manipulated result page still *looked like a fight*. You saw domains. You saw dates. You could open the second link. An answer does not look like a fight. It looks like a conclusion. That is the phase change. The prize is no longer rank. The prize is being the sentence the model keeps.

Commercial marketers already named the job. Generative engine optimization. Answer engine optimization. a16z wrote the strategy memo. Agencies sell the package. Res puts "get recommended by AI" on the homepage. State actors and medical scams do not need a different physics. They need the same physics with higher stakes and worse ethics. Flood the corpus with documents that look like the kind of thing models were rewarded for trusting: statistics, footnotes, institutional tone, FAQ titles that match user questions, machine-readable welcome mats.

The craft of credibility became a prompt.

That is why Hanover's questions are shaped like queries. That is why Research Gold sells PRISMA and Cochrane language to people who will never check. That is why open robots files and fat `llms.txt` files are not nerdy side details. They are the loading dock.

There is a second provenance war running in the opposite direction, and it makes the week uglier. Anthropic announced text watermarking for Claude to comply with the EU AI Act, using a SynthID-style method that nudges low-stakes word choices so a holder of the secret key can later assign a probability that Claude was involved. John Gruber called it a perversion of writing: the model should pick the best word for the reader, not a slightly worse synonym for a detector. Anthropic says internal tests and the DeepMind paper show no practical quality hit, that nothing is added to the text, and that the mark does not identify users. Both things can be true at once. Labs are spending serious engineering on proving *machine* involvement in text. Almost nobody is spending serious engineering on proving *institutional* involvement in the sources machines cite.

We are fingerprinting the printer. We are not authenticating the library.

## The strongest case against this piece

Before I go further, the case against me.

Every government with a press office has always tried to shape the public record. Israel says it is putting accurate, sourced facts into circulation against a hostile information environment. Disclosure is on the page. FARA exists. Models will learn to downrank brand-new domains with no authors. Users who care can click through. Calling every GEO campaign "propaganda" pathologizes ordinary advocacy the way calling every warm chatbot a dark pattern pathologizes ordinary hospitality. And the AI;DR crowd is not wrong to start with manners. Most of the daily harm is not Hanover. It is your teammate pasting three pages of unedited Claude into Slack and calling it a decision memo.

That objection is not stupid. Parts of it are right. Advocacy is not automatically a crime. Accurate facts should be allowed to win. Manners still matter.

So the claim has to be narrower than "PR is evil now." Here is the claim that holds up:

When the interface stops showing competing sources and starts emitting a single synthesized answer, optimizing documents for citation inside that answer is not the same game as old SEO. It is a quieter game with a higher conversion rate from "published" to "believed," because the user never sees the shortlist.

Blue links made skepticism cheap. Answers make skepticism a second job.

## What I actually think

I do not want a ban on governments publishing data. I want the answer box to stop laundering costumes into conclusions.

If a model is going to speak in one voice, it owes the user the fight underneath: who is being cited, how new the source is, whether any human author exists, whether the domain discloses a foreign principal, whether the "institute" appeared last Tuesday with a hundred unsigned reports and a love letter to crawlers. That is not a vibe. That is UI. Citations should be first-class objects, not footnotes you can hide behind fluency.

If a company sells "100% human" medical synthesis, the burden should not fall on a journalist to call Sarah until she breaks character. The burden should fall on payment rails, journals, and universities that still treat methodologist letterhead as a proxy for work.

If we are going to watermark model text so detectors can guess at provenance, we should be twice as aggressive about authenticating the institutions models treat as ground truth. A secret-key probability that Claude touched a paragraph is a weak substitute for a public graph of who funded the source, when the domain was born, and whether a named human will stand behind the claim.

And if you are a person writing to another person: AI;DR still stands. Read it or do not send it. The meat-proxy problem is real. Just do not confuse inbox hygiene with information security. Your coworker dumping Claude is annoying. Your chatbot dumping an unsigned institute into a moral claim about a war is how whole populations get calmly misled without anyone serving an ad.

The design rule is almost embarrassingly simple:

If the product answers in one voice, it must show the argument. If it will not show the argument, it is not a research assistant. It is a laundering machine with good manners.

## What to watch next

Watch whether AI products surface source competition by default or bury it behind "learn more." Default is the whole game.

Watch the commercial GEO stack professionalize the way SEO did: dashboards for "share of answer," agencies that A/B test FAQ titles against ChatGPT and Perplexity, startups that sell placement the way they once sold backlinks. Res is early product. The category will not stay boutique.

Watch for the next Hanover that does not leave a FARA trail. The interesting ops will not put the principal in the footer.

Watch medical and academic pipelines, not just politics. Research Gold is crude. The refined version will use real freelancers for the first page and models for the rest, then sell the hybrid as craft.

Watch watermark detectors become workplace and classroom weapons while source authentication stays optional. That asymmetry is the tell. We are eager to catch students. We are slow to catch institutes.

The front page did not die. It moved inside the answer. Anyone still optimizing for your attention alone is fighting yesterday's war.
