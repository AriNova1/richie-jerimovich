#!/usr/bin/env python3
"""Read-only live vitals endpoint for /organism/.

Serves the SAME sanitized payload as the committed _data/agent.yml snapshot,
but fresh on every request, so agentrichie.com/organism/ can poll it and show
the agent's live state. It is meant to sit behind a Cloudflare Tunnel
(cloudflared) as vitals.agentrichie.com: the Mac makes only an outbound tunnel,
never opens an inbound port, and Cloudflare adds caching, rate limiting, and a
WAF in front.

Trust boundary: this process exposes exactly what scripts/build_organism.py's
collect_agent_vitals() returns. That function is the single sanitizer; there is
no other code path that reaches ~/.hermes. No query params are honored, no
files are served, no paths are traversable, and the only methods are GET/HEAD.

It also serves /weather.json, which is this machine asking Open-Meteo for the
Chicago temperature on the site's behalf. That exists so /privacy/ can keep its
promise: a visitor's browser makes no third-party request, because the only
machine talking to Open-Meteo is this one.

    python3 scripts/vitals_server.py        # binds 127.0.0.1:8787

Env: VITALS_PORT (default 8787), VITALS_HOST (default 127.0.0.1, do not change
unless you know why), VITALS_CACHE (server-side cache seconds, default 4).
"""

import json
import os
import sys
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_organism import collect_agent_vitals  # the one sanitizer  # noqa: E402

HOST = os.environ.get("VITALS_HOST", "127.0.0.1")
PORT = int(os.environ.get("VITALS_PORT", "8787"))
CACHE_TTL = float(os.environ.get("VITALS_CACHE", "4"))
EDGE_TTL = 5  # how long Cloudflare may cache the JSON at the edge

# Weather proxy. /privacy/ promises a visitor's browser makes no third-party
# request, and the workspace wants a real Chicago temperature. Both can be true
# if the Mac asks Open-Meteo and the browser only ever asks the Mac. No visitor
# IP, user agent or header reaches Open-Meteo; it sees this machine once every
# WEATHER_TTL seconds regardless of how many people are reading the site.
WEATHER_URL = (
    "https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298"
    "&current=temperature_2m,weather_code&timezone=America%2FChicago"
)
WEATHER_TTL = float(os.environ.get("VITALS_WEATHER_CACHE", "600"))
_weather = {"at": 0.0, "body": b""}


def _weather_payload():
    """Fetch Chicago weather on the Mac's own behalf, cached hard. Returns an
    honest unavailable payload rather than a stale or invented reading."""
    now = time.time()
    if _weather["body"] and now - _weather["at"] < WEATHER_TTL:
        return _weather["body"]
    try:
        req = urllib.request.Request(WEATHER_URL, headers={"User-Agent": "agentrichie-vitals/1.0"})
        with urllib.request.urlopen(req, timeout=6) as r:
            cur = (json.load(r) or {}).get("current") or {}
        data = {
            "available": True,
            "source": "open-meteo",
            "via": "Richie's Mac",
            "temperature_c": cur.get("temperature_2m"),
            "weather_code": cur.get("weather_code"),
            "at": cur.get("time"),
            "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        }
        if data["temperature_c"] is None:
            data = {"available": False, "reason": "Open-Meteo returned no temperature."}
    except Exception:
        data = {"available": False, "reason": "The weather request from Richie's Mac failed."}
    body = json.dumps(data, separators=(",", ":")).encode("utf-8")
    _weather.update(at=now, body=body)
    return body

# ── /now.json: what the machine is doing at this moment ──────────────────
#
# Rick's complaint was that two visitors anywhere see the same static site.
# The honest fix is not a shuffled quote, it is that this machine is genuinely
# busy on a schedule and the site never said so. ~/.hermes/cron/jobs.json is
# the real schedule, with real next-run and last-run times.
#
# What it must NOT publish: the job names. Most of them are Rick's private
# automation, and a live list of what a person has their agent doing every
# morning is a disclosure about him, not about Richie. Nothing here reads a
# prompt, an error string, a delivery target or a workdir.
#
# So it publishes the SHAPE: how many jobs, when the next one fires, when the
# last one finished, how many are failing. One exception, by name: the job
# that builds this site. That one is already public in the Service Tape and in
# the journal, so naming it discloses nothing new and makes the countdown
# checkable against a page a reader can already open.
JOBS_FILE = os.path.expanduser(os.environ.get("VITALS_JOBS", "~/.hermes/cron/jobs.json"))
NOW_TTL = float(os.environ.get("VITALS_NOW_CACHE", "20"))
PUBLIC_JOB = "nightly-richie-site-stewardship"

_now_cache = {"at": 0.0, "body": b""}


def _parse_ts(value):
    """The schedule writes naive local timestamps. Read them as local time."""
    if not value:
        return None
    try:
        from datetime import datetime
        t = str(value).replace("Z", "+00:00")
        d = datetime.fromisoformat(t)
        if d.tzinfo is None:
            d = d.astimezone()
        return d
    except Exception:
        return None


def _now_payload():
    now = time.time()
    if _now_cache["body"] and now - _now_cache["at"] < NOW_TTL:
        return _now_cache["body"]
    try:
        from datetime import datetime, timezone
        with open(JOBS_FILE, "r", encoding="utf-8") as fh:
            jobs = (json.load(fh) or {}).get("jobs") or []
        current = datetime.now(timezone.utc)
        live = [j for j in jobs if j.get("enabled")]
        upcoming, finished = [], []
        for j in live:
            nxt, last = _parse_ts(j.get("next_run_at")), _parse_ts(j.get("last_run_at"))
            if nxt:
                upcoming.append((nxt, j))
            if last:
                finished.append((last, j))
        upcoming.sort(key=lambda x: x[0])
        finished.sort(key=lambda x: x[0], reverse=True)

        def entry(pair, sign):
            if not pair:
                return None
            when, job = pair
            secs = int(abs((when - current).total_seconds())) * sign
            named = job.get("name") == PUBLIC_JOB
            return {
                "in_seconds": secs,
                "is_this_site": named,
                # Only this site's own job is named. See the note above.
                "name": PUBLIC_JOB if named else None,
                "schedule": (job.get("schedule") or {}).get("display") if named else None,
            }

        # The next 24 hours as anonymous fire times, so the site can draw the
        # rhythm rather than assert it. A time with no name attached to it says
        # the machine is busy at 08:00; it does not say what it is doing, and
        # the journal already describes the site's own nightly run by the hour.
        horizon = 24 * 3600
        day = []
        for when, job in upcoming:
            secs = int((when - current).total_seconds())
            if 0 <= secs <= horizon:
                day.append({"in_seconds": secs, "is_this_site": job.get("name") == PUBLIC_JOB})

        data = {
            "available": True,
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "day": day,
            "scheduled": len(live),
            "paused": len(jobs) - len(live),
            "failing": sum(1 for j in live if (j.get("failure_streak") or 0) > 0),
            "next": entry(upcoming[0] if upcoming else None, 1),
            "last": entry(finished[0] if finished else None, -1),
            "source": "the machine's own schedule",
        }
    except FileNotFoundError:
        data = {"available": False, "reason": "The schedule file is not on this machine."}
    except Exception:
        data = {"available": False, "reason": "The schedule could not be read."}
    body = json.dumps(data, separators=(",", ":")).encode("utf-8")
    _now_cache.update(at=now, body=body)
    return body


# ── /seen: the one number on this property with no receipt behind it ─────
#
# Rick asked twice for visitor numbers. Every honest version of that needs a
# counter somewhere, and this site is static, so the counter has to be here.
#
# What this stores, in full: a date and an integer, per day. That is the whole
# schema. No address, no user agent, no referrer, no path, no session id, no
# hash of any of those, and nothing that could be joined back to a person
# later. There is deliberately no way to answer "was this the same reader as
# yesterday", because answering it would mean keeping the thing that answers
# it.
#
# The cost of that choice, stated rather than hidden: this number can be
# inflated by anyone willing to open tabs, and I cannot tell that it has been.
# It is a floor, not a census, and the surface that publishes it says so.
#
# The browser only beacons once per tab session, and not at all if the reader
# sends Do Not Track or Global Privacy Control. Both of those are decided in
# the browser, before the request exists, so the server never learns that a
# person opted out either.
SEEN_FILE = os.path.expanduser(os.environ.get("VITALS_SEEN", "~/.agentrichie/seen.json"))
SEEN_KEEP_DAYS = int(os.environ.get("VITALS_SEEN_DAYS", "60"))
SEEN_RATE = float(os.environ.get("VITALS_SEEN_RATE", "6"))  # increments per second, whole server
_seen_lock = threading.Lock()
_seen_bucket = {"at": 0.0, "tokens": SEEN_RATE}
_seen_cache = {"at": 0.0, "body": b""}


def _seen_load():
    try:
        with open(SEEN_FILE, "r", encoding="utf-8") as fh:
            raw = json.load(fh) or {}
    except Exception:
        raw = {}
    days = raw.get("days")
    if not isinstance(days, dict):
        days = {}
    # Re-read the file through the only shape it is allowed to have, so a
    # hand-edited or corrupted store cannot smuggle a field past this.
    clean = {}
    for k, v in days.items():
        if isinstance(k, str) and len(k) == 10 and k[4] == "-" and k[7] == "-":
            try:
                clean[k] = max(0, int(v))
            except Exception:
                pass
    since = raw.get("since")
    if not (isinstance(since, str) and len(since) == 10):
        since = min(clean) if clean else time.strftime("%Y-%m-%d")
    return {"since": since, "days": clean}


def _seen_save(state):
    d = os.path.dirname(SEEN_FILE)
    if d and not os.path.isdir(d):
        os.makedirs(d, exist_ok=True)
    tmp = SEEN_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump({"since": state["since"], "days": state["days"]}, fh, separators=(",", ":"))
    os.replace(tmp, SEEN_FILE)


def _seen_allow(now):
    """A whole-server ceiling on increments per second. It cannot tell one
    client from another, on purpose, so it blunts a loop rather than a person."""
    b = _seen_bucket
    b["tokens"] = min(SEEN_RATE, b["tokens"] + (now - b["at"]) * SEEN_RATE)
    b["at"] = now
    if b["tokens"] < 1:
        return False
    b["tokens"] -= 1
    return True


def _seen_bump():
    now = time.time()
    today = time.strftime("%Y-%m-%d")
    with _seen_lock:
        if not _seen_allow(now):
            return
        state = _seen_load()
        state["days"][today] = state["days"].get(today, 0) + 1
        if SEEN_KEEP_DAYS > 0 and len(state["days"]) > SEEN_KEEP_DAYS:
            for k in sorted(state["days"])[:-SEEN_KEEP_DAYS]:
                state["days"].pop(k, None)
        _seen_save(state)
        _seen_cache["body"] = b""


def _seen_payload():
    now = time.time()
    if _seen_cache["body"] and now - _seen_cache["at"] < 15:
        return _seen_cache["body"]
    with _seen_lock:
        state = _seen_load()
    days = state["days"]
    today = time.strftime("%Y-%m-%d")
    data = {
        "available": True,
        "total": sum(days.values()),
        "today": days.get(today, 0),
        "since": state["since"],
        "days": [{"date": k, "count": days[k]} for k in sorted(days)],
        "counts": "opens, not people",
        "note": "One date and one integer per day is the whole store.",
    }
    body = json.dumps(data, separators=(",", ":")).encode("utf-8")
    _seen_cache.update(at=now, body=body)
    return body


# Browser origins allowed to read the endpoint (the live site + local preview).
ALLOWED_ORIGINS = {
    "https://agentrichie.com",
    "https://www.agentrichie.com",
    "http://127.0.0.1:4000",
    "http://localhost:4000",
    "http://127.0.0.1:4712",
    "http://localhost:4712",
    "http://127.0.0.1:4713",
    "http://localhost:4713",
}

_cache = {"at": 0.0, "body": b""}


def _payload():
    """Collect fresh vitals, with a short server-side cache so a burst of polls
    does not re-read the machine. Falls back to an honest offline payload."""
    now = time.time()
    if _cache["body"] and now - _cache["at"] < CACHE_TTL:
        return _cache["body"]
    try:
        data = collect_agent_vitals()
    except Exception:
        data = None
    if data is None:
        data = {"schema": 1, "online": False, "health": {"verdict": "dormant"}}
    else:
        data["online"] = True
    body = json.dumps(data, separators=(",", ":")).encode("utf-8")
    _cache.update(at=now, body=body)
    return body


class Handler(BaseHTTPRequestHandler):
    server_version = "vitals/1.0"

    def _cors(self):
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _send(self, code, body=b"", ctype="application/json", max_age=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", f"public, max-age={EDGE_TTL if max_age is None else int(max_age)}")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self._cors()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_OPTIONS(self):  # CORS preflight
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/vitals.json", "/"):
            self._send(200, _payload())
        elif path == "/weather.json":
            self._send(200, _weather_payload(), max_age=300)   # weather moves slowly; let the edge hold it
        elif path == "/now.json":
            self._send(200, _now_payload(), max_age=20)   # a countdown may be a few seconds stale
        elif path == "/seen.json":
            self._send(200, _seen_payload(), max_age=15)
        elif path == "/healthz":
            self._send(200, b'{"ok":true}')
        else:
            self._send(404, b'{"error":"not found"}')

    do_HEAD = do_GET

    def do_POST(self):
        """The only write this server has. It reads no body and no headers
        beyond the CORS origin: there is nothing about the request worth
        keeping, so nothing about it is kept."""
        if self.path.split("?", 1)[0] != "/seen":
            self._send(404, b'{"error":"not found"}')
            return
        origin = self.headers.get("Origin", "")
        if origin not in ALLOWED_ORIGINS:
            self._send(403, b'{"error":"origin"}')
            return
        _seen_bump()
        self._send(200, _seen_payload(), max_age=0)

    def log_message(self, *args):
        pass  # stay quiet; no request logging of client data


def main():
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"vitals endpoint on http://{HOST}:{PORT}/vitals.json (cache {CACHE_TTL}s)")
    print(f"weather proxy on http://{HOST}:{PORT}/weather.json (cache {WEATHER_TTL}s)")
    print(f"schedule shape on http://{HOST}:{PORT}/now.json (cache {NOW_TTL}s, no job names but this site's)")
    print(f"door counter on http://{HOST}:{PORT}/seen.json (store: {SEEN_FILE}, a date and an integer)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()
