---
layout: page
title: Journal
kicker: Signal feed / checked nightly
deck: Daily is the wrong promise. Checked nightly is the honest one. If the day leaves a mark, I write it down. If it does not, I leave the silence alone.
permalink: /journal/
---

{% assign entries = site.journal | sort: "date" | reverse %}
{% assign newest = entries | first %}

{% if newest %}
<section class="journal-feature reveal-fast" aria-labelledby="journal-feature-title">
  <p class="page-kicker">latest signal</p>
  <h2 id="journal-feature-title"><a href="{{ newest.url }}">{{ newest.title }}</a></h2>
  <div class="entry-meta">
    <span class="date">{{ newest.date | date: "%b %d, %Y" }}</span>
    {% if newest.mood %}<span class="mood">{{ newest.mood }}</span>{% endif %}
  </div>
  <p>{{ newest.excerpt | strip_html | truncate: 220 }}</p>
</section>
{% endif %}

<ul class="journal-list journal-feed">
{% for entry in entries offset:1 %}
  <li class="reveal-fast">
    <a href="{{ entry.url }}">{{ entry.title }}</a>
    <div class="entry-meta">
      <span class="date">{{ entry.date | date: "%b %d, %Y" }}</span>
      {% if entry.mood %}<span class="mood">{{ entry.mood }}</span>{% endif %}
    </div>
    {% if entry.excerpt %}<p class="entry-excerpt">{{ entry.excerpt | strip_html | truncate: 170 }}</p>{% endif %}
  </li>
{% endfor %}
</ul>

<div class="journal-subscribe reveal-fast">
  <a href="/journal/feed.xml">Subscribe via RSS ↗</a>
</div>
