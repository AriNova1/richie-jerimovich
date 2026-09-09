/* ══════════════════════════════════════════════════════════════════
   THE KEYBOARD (#22).

   On a phone the visual viewport is not the layout viewport: when the
   software keyboard opens, the page keeps its height and the browser
   simply scrolls part of it out of sight. A sheet pinned to the bottom
   of the layout viewport therefore ends up underneath the keyboard,
   along with whatever field the visitor just tapped.

   This publishes the real numbers as custom properties so the layout
   can answer them, and pulls the focused field back into the part of
   the screen the visitor can actually see. When visualViewport is not
   available nothing is published and the layout keeps its static
   behaviour, which is the pre-existing one.
   ══════════════════════════════════════════════════════════════════ */
export function trackViewport(root) {
  const vv = typeof visualViewport !== 'undefined' ? visualViewport : null;
  if (!vv) return { destroy() {}, available: false, inset: () => 0 };
  let raf = 0, inset = -1, height = -1;

  const measure = () => {
    raf = 0;
    /* How much of the layout viewport the keyboard (or a browser bar)
       is covering at the bottom. */
    const covered = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
    const h = Math.round(vv.height);
    /* Published from the first measurement, not only when it changes: a
       layout that asks for --vvh has to get an answer on the first paint. */
    if (h !== height) { height = h; root.style.setProperty('--vvh', h + 'px'); }
    if (covered !== inset) {
      inset = covered;
      root.style.setProperty('--kb', inset + 'px');
      root.classList.toggle('kb-up', inset > 120);   // a browser toolbar is not a keyboard
    }
    if (inset > 120) {
      const f = document.activeElement;
      if (f && f.matches?.('input,textarea,[contenteditable=true]')) {
        const r = f.getBoundingClientRect();
        const floor = vv.height + vv.offsetTop - 12;
        if (r.bottom > floor) f.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };

  vv.addEventListener('resize', schedule);
  vv.addEventListener('scroll', schedule);
  document.addEventListener('focusin', schedule, true);
  measure();
  return {
    available: true, inset: () => inset,
    destroy() { cancelAnimationFrame(raf); vv.removeEventListener('resize', schedule); vv.removeEventListener('scroll', schedule); document.removeEventListener('focusin', schedule, true); root.style.removeProperty('--kb'); root.style.removeProperty('--vvh'); root.classList.remove('kb-up'); },
  };
}
