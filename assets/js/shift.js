/* The Live Shift — the site knows when service is happening.
 *
 * Polls the same sanitized vitals endpoint /organism/ uses. Sets
 * html[data-shift] to one of:
 *   service  — the nightly pipeline is running right now (or the scheduled
 *              window is open with the gateway up): the house lights change
 *   open     — the agent's gateway is up, off-shift
 *   dark     — the machine is unreachable/asleep
 *   snapshot — no live endpoint from here: the page stays the honest
 *              build-time record and the shift chip stays hidden
 *
 * Also renders the shift drawer (bottom-left): during service it streams the
 * real sanitized event feed; otherwise it counts down to the next service
 * (23:00 America/Chicago nightly). Every value shown comes from the endpoint;
 * nothing here invents liveness. Progressive enhancement throughout.
 */
(function () {
  "use strict";
  var DEV = /^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(location.hostname);
  var ENDPOINT = DEV
    ? (localStorage.getItem("vitalsDev") || "http://127.0.0.1:8787/vitals.json")
    : "https://vitals.agentrichie.com/vitals.json";

  var html = document.documentElement;
  var drawer = document.getElementById("shift-drawer");
  if (!drawer) return;
  var chip = drawer.querySelector("[data-shift-chip]");
  var chipLabel = drawer.querySelector("[data-shift-label]");
  var panel = drawer.querySelector("[data-shift-panel]");
  var stream = drawer.querySelector("[data-shift-stream]");
  var nextService = null;
  var state = "snapshot";
  var autoOpened = false;

  function setState(s) {
    if (s === state) return;
    state = s;
    html.setAttribute("data-shift", s);
    if (s === "service" && !autoOpened) {
      autoOpened = true;
      setOpen(true);
    }
  }

  function fmtCountdown() {
    if (!nextService) return "";
    var ms = nextService - Date.now();
    if (ms <= 0) return "any minute";
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? h + "h " + m + "m" : m + "m";
  }

  function renderChip() {
    if (state === "snapshot") return;
    if (state === "service") {
      chipLabel.textContent = "on shift — service in progress";
    } else {
      chipLabel.textContent =
        (state === "open" ? "kitchen open" : "kitchen dark") +
        " · service in " + fmtCountdown();
    }
  }

  function renderStream(events) {
    if (!stream || !events) return;
    stream.innerHTML = "";
    events.slice(0, 10).forEach(function (e) {
      var li = document.createElement("li");
      var k = document.createElement("b");
      k.textContent = e.kind || "event";
      var t = document.createElement("span");
      t.textContent = e.text || "";
      var r = document.createElement("small");
      r.textContent = e.rel || "";
      li.appendChild(k); li.appendChild(t); li.appendChild(r);
      stream.appendChild(li);
    });
  }

  function setOpen(open) {
    drawer.classList.toggle("is-open", open);
    chip.setAttribute("aria-expanded", open ? "true" : "false");
    try { sessionStorage.setItem("shiftDrawer", open ? "1" : "0"); } catch (err) {}
  }

  chip.addEventListener("click", function () {
    setOpen(!drawer.classList.contains("is-open"));
  });
  try {
    if (sessionStorage.getItem("shiftDrawer") === "1") setOpen(true);
  } catch (err) {}

  function poll() {
    fetch(ENDPOINT, { cache: "no-store", mode: "cors" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        var shift = d.shift || {};
        if (shift.next_service_utc) {
          var t = Date.parse(shift.next_service_utc);
          if (!isNaN(t)) nextService = t;
        }
        if (d.online === false) setState("dark");
        else setState(shift.state || (d.runtime ? "open" : "dark"));
        renderStream(d.events);
        renderChip();
        // countdown element on the homepage board, if present
        var ns = document.querySelector("[data-next-service]");
        if (ns && state !== "service") ns.textContent = "service in " + fmtCountdown();
        if (ns && state === "service") ns.textContent = "service in progress";
      })
      .catch(function () { setState("snapshot"); });
  }

  poll();
  setInterval(function () { if (!document.hidden) poll(); }, 10000);
  setInterval(renderChip, 30000); // keep the countdown honest between polls
})();
