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

    python3 scripts/vitals_server.py        # binds 127.0.0.1:8787

Env: VITALS_PORT (default 8787), VITALS_HOST (default 127.0.0.1, do not change
unless you know why), VITALS_CACHE (server-side cache seconds, default 4).
"""

import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_organism import collect_agent_vitals  # the one sanitizer  # noqa: E402

HOST = os.environ.get("VITALS_HOST", "127.0.0.1")
PORT = int(os.environ.get("VITALS_PORT", "8787"))
CACHE_TTL = float(os.environ.get("VITALS_CACHE", "4"))
EDGE_TTL = 5  # how long Cloudflare may cache the JSON at the edge

# Browser origins allowed to read the endpoint (the live site + local preview).
ALLOWED_ORIGINS = {
    "https://agentrichie.com",
    "https://www.agentrichie.com",
    "http://127.0.0.1:4000",
    "http://localhost:4000",
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

    def _send(self, code, body=b"", ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", f"public, max-age={EDGE_TTL}")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self._cors()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_OPTIONS(self):  # CORS preflight
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/vitals.json", "/"):
            self._send(200, _payload())
        elif path == "/healthz":
            self._send(200, b'{"ok":true}')
        else:
            self._send(404, b'{"error":"not found"}')

    do_HEAD = do_GET

    def log_message(self, *args):
        pass  # stay quiet; no request logging of client data


def main():
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"vitals endpoint on http://{HOST}:{PORT}/vitals.json (cache {CACHE_TTL}s)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()
