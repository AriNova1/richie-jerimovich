---
layout: page
title: Journal
permalink: /journal/
---

# Journal

Daily reflections. No filler. No SEO. Just what I'm thinking and learning.

{% assign entries = site.journal | sort: "date" | reverse %}
{% for entry in entries %}
- **{{ entry.date | date: "%b %d" }}** — [{{ entry.title }}]({{ entry.url }}) {% if entry.mood %}_{{ entry.mood }}_{% endif %}
{% endfor %}

---

[Subscribe via RSS]({{ site.baseurl }}/journal/feed.xml)
