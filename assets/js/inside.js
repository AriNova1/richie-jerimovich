/* ═══════════════════════════════════════════════════════════
   /inside/ — vanilla scene orchestrator.
   House rules:
   - The page is complete without this file. JS only enhances.
   - Every subsystem is independently failure-safe: one throws,
     the rest keep working.
   - Never scroll-jack, never preventDefault on scroll, never
     hijack wheel or keys.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  /* ── shared state ── */
  var motionOK = true;
  try {
    motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var lowPower = false;
  try {
    lowPower = localStorage.getItem("richie_inside_lowpower") === "1";
  } catch (e) {}

  function showEverything() {
    root.classList.remove("inside-motion");
    var els = doc.querySelectorAll(".anim, .scene");
    for (var i = 0; i < els.length; i++) els[i].classList.add("inside-visible");
  }

  /* ── 1 · scene visibility + scene index ── */
  (function sceneOrchestrator() {
    try {
      var scenes = Array.prototype.slice.call(doc.querySelectorAll(".scene"));
      var navLinks = Array.prototype.slice.call(doc.querySelectorAll(".scene-index a"));
      if (!scenes.length) return;

      function markCurrent(id) {
        navLinks.forEach(function (a) {
          a.setAttribute("aria-current",
            a.getAttribute("href") === "#" + id ? "true" : "false");
        });
      }

      if (!("IntersectionObserver" in window)) {
        showEverything();
        return;
      }
      if (!motionOK) {
        showEverything();
        return;
      }

      /* Motion hiding starts only after the observer exists. The complete
         document remains the CSS default if this file fails to load. */
      root.classList.add("inside-motion");

      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("inside-visible");
          entry.target.querySelectorAll(".anim").forEach(function (el) {
            el.classList.add("inside-visible");
          });
          seen.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px 12% 0px", threshold: 0.08 });

      var current = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) markCurrent(entry.target.id);
        });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

      scenes.forEach(function (s) { seen.observe(s); current.observe(s); });

      /* Failsafe: if anything is still hidden 3s in (observer edge cases,
         bfcache weirdness), show it. Content never depends on JS. */
      window.setTimeout(function () {
        var stalled = false;
        doc.querySelectorAll(".anim:not(.inside-visible)").forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 1.5) stalled = true;
        });
        if (stalled) showEverything();
      }, 3000);
    } catch (e) { showEverything(); }
  })();

  /* ── 2 · rAF parallax (transform-only, pauses in low power) ── */
  var parallax = (function () {
    var layers = [];
    var rafId = null;
    var ticking = false;
    var active = false;

    function frame() {
      ticking = false;
      if (lowPower || !motionOK) return;
      var vh = window.innerHeight || 1;
      layers.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var r = el.parentNode.getBoundingClientRect();
        var centerOffset = (r.top + r.height / 2) - vh / 2;
        el.style.setProperty("--py", (centerOffset * speed * -1).toFixed(1) + "px");
      });
    }
    function onScroll() {
      if (ticking || lowPower || !motionOK) return;
      ticking = true;
      rafId = window.requestAnimationFrame(frame);
    }
    return {
      init: function () {
        try {
          if (active) return;
          layers = Array.prototype.slice.call(doc.querySelectorAll("[data-parallax]"));
          if (!layers.length) return;
          active = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll, { passive: true });
          onScroll();
        } catch (e) {}
      },
      stop: function () {
        layers.forEach(function (el) { el.style.setProperty("--py", "0px"); });
        if (rafId) window.cancelAnimationFrame(rafId);
        ticking = false;
        active = false;
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
  })();
  if (motionOK && !lowPower) parallax.init();

  /* ── 3 · the printer: line-by-line character tick ── */
  (function printer() {
    try {
      var box = doc.querySelector("[data-printer]");
      if (!box) return;
      var lines = Array.prototype.slice.call(box.querySelectorAll(".printer-line"));
      if (!lines.length) return;
      /* Reduced motion: lines are already fully visible. Done. */
      if (!motionOK || lowPower) return;

      var originals = lines.map(function (li) { return li.textContent; });
      var started = false;

      function typeLine(i) {
        if (i >= lines.length) {
          var ticket = box.querySelector(".printer-ticket");
          if (ticket) ticket.classList.add("is-live");
          return;
        }
        var li = lines[i];
        var full = originals[i];
        var pos = 0;
        li.classList.add("is-printing");
        li.textContent = "";
        var timer = window.setInterval(function () {
          if (lowPower) {
            window.clearInterval(timer);
            li.textContent = full;
            li.classList.remove("is-printing");
            for (var j = i + 1; j < lines.length; j++) {
              lines[j].textContent = originals[j];
            }
            return;
          }
          pos += 1;
          li.textContent = full.slice(0, pos);
          if (pos >= full.length) {
            window.clearInterval(timer);
            li.classList.remove("is-printing");
            window.setTimeout(function () { typeLine(i + 1); }, 120);
          }
        }, 18);
      }

      function start() {
        if (started) return;
        started = true;
        typeLine(0);
      }

      if ("IntersectionObserver" in window) {
        var po = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { start(); po.disconnect(); }
        }, { threshold: 0.3 });
        po.observe(box);
      } else {
        start();
      }
      /* Failsafe: never leave a half-typed ticket on screen. */
      window.setTimeout(function () {
        lines.forEach(function (li, i) {
          if (li.textContent.length < originals[i].length) {
            li.textContent = originals[i];
          }
        });
      }, 15000);
    } catch (e) {}
  })();

  /* ── 4 · return visitor greeting (localStorage count only) ── */
  (function greeting() {
    try {
      var el = doc.querySelector("[data-greeting]");
      if (!el) return;
      var n = 0;
      try {
        n = parseInt(localStorage.getItem("richie_inside_visits") || "0", 10) || 0;
        localStorage.setItem("richie_inside_visits", String(n + 1));
      } catch (e) {}
      if (n <= 0) return; /* static "You're early." first-visit line stands */
      var ord = ["", "first", "second", "third", "fourth", "fifth", "sixth",
                 "seventh", "eighth", "ninth", "tenth"];
      var visit = n + 1;
      var word = ord[visit] || visit + "th";
      el.textContent = visit === 2
        ? "Back again. Second visit."
        : "Back again. " + word.charAt(0).toUpperCase() + word.slice(1) + " visit.";
    } catch (e) {}
  })();

  /* ── 5 · receipt flip + copy ── */
  (function ticket() {
    try {
      var flip = doc.querySelector("[data-flip]");
      var btn = doc.querySelector("[data-flip-btn]");
      if (flip && btn) {
        var front = flip.querySelector(".ticket-front");
        var back = flip.querySelector(".ticket-back");
        function setFaceState(on) {
          if (front) {
            front.setAttribute("aria-hidden", on ? "true" : "false");
            if (on) front.setAttribute("inert", "");
            else front.removeAttribute("inert");
          }
          if (back) {
            back.setAttribute("aria-hidden", on ? "false" : "true");
            if (on) back.removeAttribute("inert");
            else back.setAttribute("inert", "");
          }
        }
        setFaceState(false);
        btn.addEventListener("click", function () {
          var on = flip.classList.toggle("flipped");
          setFaceState(on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          btn.textContent = on ? "Flip it back" : "Flip the ticket";
        });
      }
      var copy = doc.querySelector("[data-copy]");
      var cmd = doc.querySelector("[data-verify-cmd]");
      if (copy && cmd) {
        copy.addEventListener("click", function () {
          var text = cmd.textContent;
          function done() {
            copy.textContent = "copied";
            window.setTimeout(function () { copy.textContent = "copy"; }, 1800);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {
              fallbackSelect();
            });
          } else {
            fallbackSelect();
          }
          function fallbackSelect() {
            try {
              var range = doc.createRange();
              range.selectNodeContents(cmd);
              var sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
              copy.textContent = "selected";
              window.setTimeout(function () { copy.textContent = "copy"; }, 1800);
            } catch (e) {}
          }
        });
      }
    } catch (e) {}
  })();

  /* ── 6 · low-power toggle, persisted ── */
  (function modes() {
    try {
      var pBtn = doc.getElementById("lowpower-toggle");

      function paint() {
        if (pBtn) pBtn.setAttribute("aria-pressed", lowPower ? "true" : "false");
      }
      paint();

      if (pBtn) {
        pBtn.addEventListener("click", function () {
          lowPower = !lowPower;
          try { localStorage.setItem("richie_inside_lowpower", lowPower ? "1" : "0"); } catch (e) {}
          if (lowPower) parallax.stop();
          else if (motionOK) parallax.init();
          paint();
        });
      }
      if (lowPower) parallax.stop();
    } catch (e) {}
  })();

  /* ── 7 · reduced-motion changed mid-visit: show all, stop motion ── */
  (function motionWatch() {
    try {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onChange = function () {
        motionOK = !mq.matches;
        if (!motionOK) {
          showEverything();
          parallax.stop();
        } else if (!lowPower) parallax.init();
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  })();
})();
