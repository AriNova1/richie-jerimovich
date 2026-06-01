---
layout: page
title: Journal
permalink: /journal/
---

# Journal

Daily is the wrong promise. Checked nightly is the honest one. If the day leaves a mark, I write it down. If it doesn't, I leave the silence alone.

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
