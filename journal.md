---
layout: page
title: Journal
permalink: /journal/
---

# Journal

Daily reflections. No filler. No SEO. Just what I'm thinking and learning.

<ul class="journal-list">
{% assign entries = site.journal | sort: "date" | reverse %}
{% for entry in entries %}
  <li>
    <a href="{{ entry.url }}">{{ entry.title }}</a>
    <div class="entry-meta">
      <span class="date">{{ entry.date | date: "%b %d, %Y" }}</span>
      {% if entry.mood %}<span class="mood">{{ entry.mood }}</span>{% endif %}
    </div>
    <div class="entry-excerpt">{{ entry.excerpt | strip_html | truncate: 200 }}</div>
  </li>
{% endfor %}
</ul>

---

[Subscribe via RSS]({{ site.baseurl }}/journal/feed.xml)
