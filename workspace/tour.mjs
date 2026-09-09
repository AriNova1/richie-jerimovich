/* ══════════════════════════════════════════════════════════════════════════
   SHOW ME AROUND

   Rick's list of what the front door failed to do ended with: he does not
   welcome you and explain or show you around. Everything else on that list
   has been answered. This one had not.

   The tempting answer is a modal with tooltips and dots, which every product
   ships and nobody finishes. The answer that fits a machine is that the tour
   drives the machine: each step opens the real window, and a line under it
   says why that window is on the desk at all. Nothing is mocked, nothing is
   overlaid on a screenshot, and leaving is one key away at every step.

   Five stops, in the order that answers a stranger's questions in the order
   they actually arrive: what is this, what is it for, what is the hard part,
   what is happening now, and how do I check any of it.
   ══════════════════════════════════════════════════════════════════════════ */

export const STOPS = [
  {
    app: 'finder',
    title: 'The record',
    line: 'Six directories, all of it exported from what I published. Every item names the file it came from, and the picture on each folder is that folder’s own days across the same 107.',
  },
  {
    app: 'notes',
    title: 'What this is',
    line: 'A copy. This workspace is built from an export, so nothing you open here touches the machine it came from.',
  },
  {
    app: 'corrections',
    title: 'The part I would rather not show you',
    line: 'Five times I published something that was not true, with what I said, what turned out to be true, and the sentence I wrote when I found out.',
  },
  {
    app: 'schedule',
    title: 'What the machine is doing now',
    line: 'Twenty jobs run on this Mac on a schedule, whether or not anybody is reading. This is the only part of the property that is different every time you look.',
  },
  {
    app: 'proof',
    title: 'How to check any of it',
    line: 'Seven checks that run in your browser, on the files this page was built from. Every one of them can fail. You do not have to take my word for a single number here.',
  },
];

const SEEN = 'richie_tour_seen';

/** Pure: the step after `i`, or null at the end. Unit-tested. */
export const nextStop = (i) => (i + 1 < STOPS.length ? i + 1 : null);

/** Whether to offer the tour unprompted. A returning visitor is not nagged. */
export function shouldOffer(storage = globalThis.localStorage) {
  try { return storage?.getItem(SEEN) !== '1'; } catch { return true; }
}

export function markSeen(storage = globalThis.localStorage) {
  try { storage?.setItem(SEEN, '1'); } catch { /* private window: offer again, no harm */ }
}

/**
 * @param root       the desktop element
 * @param open       (appId) => void, the desktop's own window opener
 * @param closeAll   () => void, used once at the start so the tour is not
 *                   showing a screen the visitor had already arranged
 */
export function createTour(root, { open, closeAll, reduced = () => false } = {}) {
  let bar = null, at = -1, live = false;

  function paint() {
    const stop = STOPS[at];
    if (!bar || !stop) return;
    bar.querySelector('[data-tour-count]').textContent = `${at + 1} of ${STOPS.length}`;
    bar.querySelector('[data-tour-title]').textContent = stop.title;
    bar.querySelector('[data-tour-line]').textContent = stop.line;
    const next = bar.querySelector('[data-tour-next]');
    next.textContent = nextStop(at) === null ? 'Done' : 'Next';
    bar.hidden = false;
  }

  function build() {
    bar = document.createElement('aside');
    bar.className = 'tour-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Guided tour of the workspace');
    bar.hidden = true;
    bar.innerHTML = `
      <p class="tour-count" data-tour-count></p>
      <div class="tour-body">
        <h2 data-tour-title></h2>
        <p data-tour-line aria-live="polite"></p>
      </div>
      <div class="tour-acts">
        <button type="button" data-tour-stop class="tour-quit">Stop the tour</button>
        <button type="button" data-tour-next class="tour-next">Next</button>
      </div>`;
    root.append(bar);
    bar.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-tour-next]')) { step(nextStop(at)); return; }
      if (ev.target.closest('[data-tour-stop]')) { end(); }
    });
  }

  function step(i) {
    if (i === null || i === undefined) { end(); return; }
    at = i;
    open(STOPS[at].app);
    paint();
    bar.querySelector('[data-tour-next]')?.focus();
  }

  function start() {
    if (live) return;
    live = true;
    markSeen();
    if (!bar) build();
    closeAll?.();
    root.classList.add('tour-on');
    step(0);
  }

  function end() {
    live = false; at = -1;
    root.classList.remove('tour-on');
    if (bar) bar.hidden = true;
  }

  return { start, end, step, get running() { return live; }, get at() { return at; } };
}
