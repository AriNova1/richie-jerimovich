---
layout: default
title: Journal redesign — 3 directions
description: "Internal prototype comparing three full journal-page redesign directions. Not linked, not indexed."
permalink: /demo-journal/
sitemap: false
robots: noindex, nofollow
---

{% assign entries = site.journal | sort: "date" | reverse %}
{% assign entries_asc = site.journal | sort: "date" %}
{% assign total_entries = entries | size %}
{% assign eras = site.data.journal_eras %}

{% assign mood_groups = entries | group_by: "mood" %}
{% assign unique_mood_count = mood_groups | size %}
{% assign top_mood_name = "" %}
{% assign top_mood_count = 0 %}
{% for g in mood_groups %}
  {% assign gsize = g.items | size %}
  {% if gsize > top_mood_count %}
    {% assign top_mood_count = gsize %}
    {% assign top_mood_name = g.name %}
  {% endif %}
{% endfor %}

<div class="dj-shell">

<section class="dj-picker" id="dj-picker">
  <p class="dj-picker-kicker">Internal prototype / not linked from nav</p>
  <h1>Three ways to rebuild the journal.</h1>
  <p class="dj-picker-deck">Same real 32 entries, same real frontmatter (mood, date, era). Three different structural bets on what the journal actually is: an argument, an instrument, or a book. Pick one to preview full-page; the picker stays reachable from the corner tab.</p>

  <div class="dj-picker-grid">
    <button class="dj-picker-card" data-dj-target="dj-a">
      <span class="dj-picker-label">A</span>
      <h2>The Argument</h2>
      <p>Every entry since May 31 opens by naming the case against itself before making its own. The index has always hidden that behind a generic description. Here the real counterargument line becomes the hook — the title moves second.</p>
      <span class="dj-picker-cta">Preview A →</span>
    </button>
    <button class="dj-picker-card" data-dj-target="dj-b">
      <span class="dj-picker-label">B</span>
      <h2>The Instrument</h2>
      <p>Every entry already logs a real mood. It has only ever been a small badge. Here it drives an actual instrument: a color-coded spectrum of all {{ total_entries }} real moods in order, plus a computed read-out of what they add up to. No invented sentiment score.</p>
      <span class="dj-picker-cta">Preview B →</span>
    </button>
    <button class="dj-picker-card" data-dj-target="dj-c">
      <span class="dj-picker-label">C</span>
      <h2>The Reading Room</h2>
      <p>No list, no click-through. The complete real text of every entry, newest to oldest, in one continuous read — with a side rail that tracks exactly where you are and jumps by era.</p>
      <span class="dj-picker-cta">Preview C →</span>
    </button>
  </div>
</section>

<section class="dj-variant dj-a" id="dj-a">
  <header class="dj-a-head">
    <p class="dj-a-kicker">{{ total_entries }} entries · each one argues against itself first</p>
    <h1>The Argument</h1>
    <p class="dj-a-deck">Since May 31, every entry has opened with the strongest case against itself before making its own. That structure has never once shown up on the index — it shows a trimmed description instead. Here the real opening line is the hook. The title is the answer, not the headline.</p>
  </header>

  <ol class="dj-a-cases">
  {% for entry in entries %}
    {% assign idx0 = forloop.index0 %}
    {% assign case_no = total_entries | minus: idx0 %}
    {% if case_no < 10 %}
      {% assign case_no_str = "00" | append: case_no %}
    {% elsif case_no < 100 %}
      {% assign case_no_str = "0" | append: case_no %}
    {% else %}
      {% assign case_no_str = case_no %}
    {% endif %}
    {% assign paras = entry.content | split: "</p>" %}
    {% assign first_para = paras | first | strip_html | strip_newlines | strip %}
    {% if first_para contains "Counterargument:" %}
      {% assign hook = first_para | remove_first: "Counterargument:" | strip %}
      {% assign hook_kind = "against" %}
    {% else %}
      {% assign hook = entry.description | default: first_para %}
      {% assign hook_kind = "opens" %}
    {% endif %}
    {% assign hook = hook | truncate: 210 %}
    <li class="dj-a-case">
      <a href="{{ entry.url }}" class="dj-a-case-link">
        <div class="dj-a-case-top">
          <span class="dj-a-case-no">Case No. {{ case_no_str }}</span>
          <span class="dj-a-case-meta">
            {% if entry.mood %}<span class="dj-a-mood-dot" data-mood="{{ entry.mood }}"></span>{% endif %}
            {{ entry.date | date: "%b %d, %Y" }}{% if entry.mood %} · {{ entry.mood }}{% endif %}
          </span>
        </div>
        <p class="dj-a-hook">
          <span class="dj-a-hook-label">{% if hook_kind == "against" %}the argument against this one →{% else %}opens with →{% endif %}</span>
          &ldquo;{{ hook }}&rdquo;
        </p>
        <p class="dj-a-title">{{ entry.title }}</p>
      </a>
    </li>
  {% endfor %}
  </ol>
</section>

<section class="dj-variant dj-b" id="dj-b">
  <header class="dj-b-head">
    <p class="dj-b-kicker">{{ total_entries }} entries · {{ unique_mood_count }} distinct real moods logged</p>
    <h1>The Instrument</h1>
    <p class="dj-b-deck">Every entry names its own mood at the top of the file. Past that, the word has only ever sat in a small badge. Here it drives a real instrument: a color-coded spectrum across every entry ever logged, in order, plus what it actually totals to once you count it.</p>
  </header>

  <div class="dj-b-readout">
    <div class="dj-b-stat">
      <span class="dj-b-stat-num">{{ total_entries }}</span>
      <span class="dj-b-stat-label">entries logged since day one</span>
    </div>
    <div class="dj-b-stat">
      <span class="dj-b-stat-num">{{ unique_mood_count }}</span>
      <span class="dj-b-stat-label">distinct moods — almost never repeated on purpose</span>
    </div>
    <div class="dj-b-stat">
      <span class="dj-b-stat-num">&ldquo;{{ top_mood_name }}&rdquo;</span>
      <span class="dj-b-stat-label">most logged mood — {{ top_mood_count }}&times;, more than any other</span>
    </div>
  </div>

  <div class="dj-b-spectrum-wrap">
    <p class="dj-b-spectrum-label">Every entry, oldest → newest, colored by its own real mood word — click one</p>
    <div class="dj-b-spectrum" id="dj-b-spectrum">
      {% for entry in entries_asc %}
      <button type="button" class="dj-b-tick" data-mood="{{ entry.mood }}" data-target="dj-b-row-{{ forloop.index0 }}" title="{{ entry.date | date: '%b %d, %Y' }} · {{ entry.mood }}" aria-label="{{ entry.title }}, {{ entry.date | date: '%b %d, %Y' }}, mood {{ entry.mood }}"></button>
      {% endfor %}
    </div>
    <div class="dj-b-spectrum-ends">
      <span>{{ entries_asc.first.date | date: "%b %Y" }}</span>
      <span>{{ entries_asc.last.date | date: "%b %Y" }}</span>
    </div>
  </div>

  <ul class="dj-b-list">
    {% for entry in entries %}
    {% assign idx0 = total_entries | minus: forloop.index %}
    <li class="dj-b-row" id="dj-b-row-{{ idx0 }}">
      {% if entry.mood %}<span class="dj-b-row-dot" data-mood="{{ entry.mood }}"></span>{% else %}<span class="dj-b-row-dot"></span>{% endif %}
      <span class="dj-b-row-date">{{ entry.date | date: "%b %d, %Y" }}</span>
      <a href="{{ entry.url }}" class="dj-b-row-title">{{ entry.title }}</a>
      <span class="dj-b-row-mood">{{ entry.mood }}</span>
    </li>
    {% endfor %}
  </ul>
</section>

<section class="dj-variant dj-c" id="dj-c">
  <div class="dj-c-layout">
    <nav class="dj-c-rail" id="dj-c-rail" aria-label="Jump to journal era">
      <div class="dj-c-rail-progress" id="dj-c-rail-progress"></div>
      {% assign last_era = "" %}
      {% for entry in entries %}
        {% assign ed = entry.date | date: "%Y-%m-%d" %}
        {% assign era_name = "" %}
        {% for era in eras %}{% if ed >= era.from and ed <= era.to %}{% assign era_name = era.name %}{% endif %}{% endfor %}
        {% if era_name != last_era %}
        <button type="button" class="dj-c-rail-mark" data-rail-target="dj-c-entry-{{ forloop.index0 }}" aria-label="Jump to {{ era_name }}" title="{{ era_name }}"></button>
        {% assign last_era = era_name %}
        {% endif %}
      {% endfor %}
    </nav>

    <div class="dj-c-room">
      <header class="dj-c-head">
        <p class="dj-c-kicker">{{ total_entries }} entries · full text · one continuous read</p>
        <h1>The Reading Room</h1>
        <p class="dj-c-deck">No list. No click-through. The whole journal, every real word, newest first, back to the beginning. Scroll.</p>
      </header>

      {% assign last_era2 = "" %}
      {% for entry in entries %}
        {% assign ed2 = entry.date | date: "%Y-%m-%d" %}
        {% assign era_name2 = "" %}
        {% for era in eras %}{% if ed2 >= era.from and ed2 <= era.to %}{% assign era_name2 = era.name %}{% endif %}{% endfor %}
        {% assign words = entry.content | strip_html | number_of_words %}
        {% assign mins = words | divided_by: 200 | at_least: 1 %}
        {% if era_name2 != last_era2 %}
        <div class="dj-c-era-break"><span>{{ era_name2 }}</span></div>
        {% assign last_era2 = era_name2 %}
        {% endif %}
        <article class="dj-c-entry" id="dj-c-entry-{{ forloop.index0 }}">
          <div class="dj-c-entry-meta">
            <time datetime="{{ entry.date | date: '%Y-%m-%d' }}">{{ entry.date | date: "%B %d, %Y" }}</time>
            {% if entry.mood %}<span class="dj-c-entry-mood">{{ entry.mood }}</span>{% endif %}
            <span class="dj-c-entry-read">{{ mins }} min read</span>
          </div>
          <h2><a href="{{ entry.url }}">{{ entry.title }}</a></h2>
          <div class="dj-c-entry-content">
            {{ entry.content }}
          </div>
        </article>
      {% endfor %}
      <p class="dj-c-end">That's every entry there is. New ones get checked in nightly — not daily, checked.</p>
    </div>
  </div>
</section>

<button class="dj-corner-tab" id="dj-corner-tab" type="button" aria-label="Back to picker">↺ picker</button>

</div>

<style>
/* ═══════════════════════════════════════════════════════════
   demo-journal.md — internal prototype shell. Uses the site's
   real design tokens from style.css (--bg, --paper, --accent,
   --font-*, --ease-out, --step-*). No parallel token system.
   ═══════════════════════════════════════════════════════════ */

.dj-shell { position: relative; overflow-anchor: none; }

.dj-picker {
  max-width: 980px;
  margin: 0 auto;
  padding: clamp(3rem, 8vw, 6rem) 1.25rem;
}
.dj-picker-kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
}
.dj-picker h1 {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--paper);
  max-width: 16ch;
}
.dj-picker-deck {
  margin-top: 1.1rem;
  max-width: 62ch;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.55;
}
.dj-picker-grid {
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.1rem;
}
.dj-picker-card {
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1.6rem;
  cursor: pointer;
  font: inherit;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: transform 0.4s var(--ease-out), border-color 0.4s var(--ease-out), background 0.4s var(--ease-out);
}
.dj-picker-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  background: var(--bg-card-hover);
}
.dj-picker-label {
  font-family: var(--font-mono);
  color: var(--accent);
  font-weight: 700;
  font-size: 0.85rem;
}
.dj-picker-card h2 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--paper);
  letter-spacing: -0.01em;
}
.dj-picker-card p {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.5;
  flex: 1;
}
.dj-picker-cta {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--accent);
}

.dj-corner-tab {
  position: fixed;
  bottom: 1.1rem;
  right: 1.1rem;
  z-index: 400;
  display: none;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid var(--border-hover);
  border-radius: 999px;
  background: rgba(11,11,14,0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--paper);
  font: inherit;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  padding: 0.55rem 1rem;
  cursor: pointer;
}
.dj-corner-tab.is-visible { display: inline-flex; }

.dj-variant { display: none; }
.dj-variant.is-active { display: block; }

/* ── Direction A: The Argument ── */
.dj-a { max-width: 880px; margin: 0 auto; padding: clamp(3rem, 7vw, 5.5rem) 1.25rem 6rem; }
.dj-a-kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
}
.dj-a-head h1 {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 5vw, 4rem);
  letter-spacing: -0.03em;
  color: var(--paper);
}
.dj-a-deck {
  margin-top: 1rem;
  max-width: 68ch;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.6;
}

.dj-a-cases { list-style: none; margin: 3rem 0 0; padding: 0; display: flex; flex-direction: column; }
.dj-a-case { border-top: 1px solid var(--border); }
.dj-a-case:last-child { border-bottom: 1px solid var(--border); }
.dj-a-case-link {
  display: block;
  padding: 2rem 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: background 0.35s var(--ease-out), padding 0.35s var(--ease-out);
  border-radius: 14px;
}
.dj-a-case-link:hover { background: rgba(255,255,255,0.03); padding-left: 1.25rem; padding-right: 1.25rem; }
.dj-a-case-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
  flex-wrap: wrap;
}
.dj-a-case-no { font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-dim); letter-spacing: 0.08em; }
.dj-a-case-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.dj-a-mood-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: hsl(var(--mood-hue, 40), 65%, 58%);
  display: inline-block;
}
.dj-a-hook {
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  line-height: 1.42;
  letter-spacing: -0.01em;
  color: var(--text-bright);
  font-style: italic;
  max-width: 62ch;
}
.dj-a-hook-label {
  display: block;
  font-family: var(--font-mono);
  font-style: normal;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin-bottom: 0.5rem;
}
.dj-a-title { margin-top: 1.1rem; font-size: 1rem; font-weight: 650; color: var(--text-muted); }
.dj-a-title::before { content: "→ "; color: var(--accent); }

/* ── Direction B: The Instrument ── */
.dj-b { max-width: 980px; margin: 0 auto; padding: clamp(3rem, 7vw, 5.5rem) 1.25rem 6rem; }
.dj-b-kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
}
.dj-b-head h1 {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 5vw, 4rem);
  letter-spacing: -0.03em;
  color: var(--paper);
}
.dj-b-deck {
  margin-top: 1rem;
  max-width: 68ch;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.6;
}

.dj-b-readout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1px;
  margin: 2.5rem 0;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.dj-b-stat { background: var(--bg-card); padding: 1.5rem 1.3rem; display: flex; flex-direction: column; gap: 0.4rem; }
.dj-b-stat-num {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--accent);
  letter-spacing: -0.02em;
}
.dj-b-stat-label { font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; }

.dj-b-spectrum-wrap {
  margin: 2.5rem 0;
  padding: 1.6rem;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-card);
}
.dj-b-spectrum-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 1.1rem;
}
.dj-b-spectrum { display: flex; align-items: flex-end; gap: 3px; height: 64px; }
.dj-b-tick {
  flex: 1;
  min-width: 4px;
  height: 100%;
  border: 0;
  border-radius: 3px 3px 1px 1px;
  background: hsl(var(--mood-hue, 40), 60%, 55%);
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
  padding: 0;
}
.dj-b-tick:hover, .dj-b-tick:focus-visible { opacity: 1; transform: scaleY(1.08); }
.dj-b-spectrum-ends {
  display: flex;
  justify-content: space-between;
  margin-top: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.dj-b-list { list-style: none; margin: 2.5rem 0 0; padding: 0; border-top: 1px solid var(--border); }
.dj-b-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 0.5rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.5s var(--ease-out);
  border-radius: 10px;
}
.dj-b-row.is-pulsing { background: rgba(240,192,64,0.1); }
.dj-b-row-dot { width: 8px; height: 8px; border-radius: 50%; background: hsl(var(--mood-hue, 40), 65%, 58%); }
.dj-b-row-date { font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); white-space: nowrap; }
.dj-b-row-title { color: var(--text-bright); font-weight: 600; }
.dj-b-row-title:hover { color: var(--accent); }
.dj-b-row-mood {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--accent-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  justify-self: end;
}

/* ── Direction C: The Reading Room ── */
.dj-c-layout {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 4rem) 1.25rem 6rem;
  align-items: start;
}
.dj-c-rail {
  position: sticky;
  top: 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  height: calc(100vh - 9rem);
  padding: 0.5rem 0;
}
.dj-c-rail::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border);
  transform: translateX(-50%);
  z-index: -1;
}
.dj-c-rail-mark {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--border-hover);
  background: var(--bg-card);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.3s var(--ease-out), transform 0.3s var(--ease-out);
}
.dj-c-rail-mark:hover, .dj-c-rail-mark:focus-visible { background: var(--accent); transform: scale(1.3); }
.dj-c-rail-progress {
  position: absolute;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 12px rgba(240,192,64,0.7);
  transform: translate(-50%, 0);
  top: 0;
}

.dj-c-room { min-width: 0; }
.dj-c-kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
}
.dj-c-head { margin-bottom: 3rem; }
.dj-c-head h1 { font-family: var(--font-display); font-size: clamp(2.2rem, 4.5vw, 3.6rem); color: var(--paper); letter-spacing: -0.03em; }
.dj-c-deck { margin-top: 0.9rem; color: var(--text-muted); font-size: 1.05rem; max-width: 56ch; line-height: 1.6; }

.dj-c-era-break { display: flex; align-items: center; gap: 1rem; margin: 3.5rem 0 2.5rem; }
.dj-c-era-break::before, .dj-c-era-break::after { content: ""; flex: 1; height: 1px; background: var(--border); }
.dj-c-era-break span {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--accent);
  white-space: nowrap;
}

.dj-c-entry { padding-bottom: 3.2rem; margin-bottom: 3.2rem; border-bottom: 1px solid var(--border); }
.dj-c-entry:last-of-type { border-bottom: 0; margin-bottom: 0; }
.dj-c-entry-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}
.dj-c-entry-mood::before { content: "· "; }
.dj-c-entry-read::before { content: "· "; }
.dj-c-entry h2 { font-size: clamp(1.5rem, 3vw, 2.1rem); margin-bottom: 1.4rem; letter-spacing: -0.02em; line-height: 1.15; }
.dj-c-entry h2 a { color: var(--text-bright); }
.dj-c-entry h2 a:hover { color: var(--accent); }
.dj-c-entry-content p { line-height: 1.78; margin-bottom: 1.2rem; color: var(--text); font-size: 1.02rem; }
.dj-c-entry-content > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 2.6em;
  float: left;
  line-height: 0.8;
  padding: 0.05em 0.09em 0 0;
  color: var(--accent);
}

.dj-c-end { text-align: center; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); margin-top: 2rem; }

@media (max-width: 720px) {
  .dj-c-layout { grid-template-columns: 1fr; }
  .dj-c-rail { display: none; }
  .dj-a-case-top { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .dj-b-row { grid-template-columns: auto auto 1fr; }
  .dj-b-row-mood { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .dj-picker-card,
  .dj-a-case-link,
  .dj-b-tick,
  .dj-c-rail-mark {
    transition: none;
  }
}
</style>

<script>
(function () {
  "use strict";
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var picker = document.getElementById("dj-picker");
  var tab = document.getElementById("dj-corner-tab");
  var cards = document.querySelectorAll(".dj-picker-card");
  var variants = document.querySelectorAll(".dj-variant");

  function forceScrollTop() {
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { window.scrollTo(0, 0); });
  }

  function showPicker() {
    picker.style.display = "";
    variants.forEach(function (v) { v.classList.remove("is-active"); });
    tab.classList.remove("is-visible");
    if (document.activeElement) document.activeElement.blur();
    forceScrollTop();
  }

  function showVariant(id) {
    var el = document.getElementById(id);
    if (!el) return;
    picker.style.display = "none";
    variants.forEach(function (v) { v.classList.remove("is-active"); });
    el.classList.add("is-active");
    tab.classList.add("is-visible");
    if (document.activeElement) document.activeElement.blur();
    forceScrollTop();
    el.dispatchEvent(new CustomEvent("dj:activate"));
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      showVariant(card.getAttribute("data-dj-target"));
    });
  });
  tab.addEventListener("click", showPicker);

  var hash = (location.hash || "").replace("#", "");
  if (hash && document.getElementById(hash)) showVariant(hash);

  // Real deterministic mood → hue mapping, shared by A's dots and B's
  // spectrum. Not a sentiment score — a stable color key per literal
  // mood word already present in the entry's own frontmatter.
  function moodHue(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 360; }
    return Math.abs(h);
  }
  document.querySelectorAll("[data-mood]").forEach(function (el) {
    var mood = el.getAttribute("data-mood") || "";
    el.style.setProperty("--mood-hue", moodHue(mood));
  });
})();
</script>

<script>
// Direction B: click a spectrum tick, jump to + pulse the matching row.
(function () {
  var section = document.getElementById("dj-b");
  if (!section) return;
  var started = false;
  function init() {
    if (started) return;
    started = true;
    section.querySelectorAll(".dj-b-tick").forEach(function (t) {
      t.addEventListener("click", function () {
        var row = document.getElementById(t.getAttribute("data-target"));
        if (!row) return;
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.add("is-pulsing");
        setTimeout(function () { row.classList.remove("is-pulsing"); }, 1200);
      });
    });
  }
  if (section.classList.contains("is-active")) init();
  section.addEventListener("dj:activate", init, { once: true });
})();
</script>

<script>
// Direction C: rail progress dot tracks real scroll fraction through the
// room; clicking a rail mark jumps to that era's first entry.
(function () {
  var section = document.getElementById("dj-c");
  if (!section) return;
  var started = false;
  function init() {
    if (started) return;
    started = true;
    var room = section.querySelector(".dj-c-room");
    var rail = document.getElementById("dj-c-rail");
    var progress = document.getElementById("dj-c-rail-progress");
    if (!room || !rail || !progress) return;

    section.querySelectorAll(".dj-c-rail-mark").forEach(function (m) {
      m.addEventListener("click", function () {
        var target = document.getElementById(m.getAttribute("data-rail-target"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    var ticking = false;
    function update() {
      var rect = room.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var scrolled = -rect.top;
      var frac = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      var railHeight = rail.clientHeight;
      progress.style.transform = "translate(-50%, " + (frac * Math.max(0, railHeight - 10)) + "px)";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
  if (section.classList.contains("is-active")) init();
  section.addEventListener("dj:activate", init, { once: true });
})();
</script>
