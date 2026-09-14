/* ── THE RECORD, WRITTEN ON THE SCREEN YOU ARE WALKING INTO ────────
   From the moment the machine has left the frame (the track ends at
   p=.517) until the desktop takes over, the ultrawide's wallpaper is the
   whole picture. It is where the desktop is about to appear, so it is
   where the record is drawn: one square a day, lit in date order, by
   scroll. Scroll back and it unwrites. The greeting inside then opens with
   the same mark at 132px, and the reader has already seen it written
   across the screen they came through. Nothing is invented: the squares
   are the days in the export and their ink is what each day produced. */
export const PLATE = { from: 0.56, to: 0.90 };

/** How many of n squares are lit at progress p: none before the plate,
    all of them by its end, monotonic and reversible in between. */
export function litAt(p, n) {
  if (!Number.isFinite(p) || n <= 0) return 0;
  const t = Math.max(0, Math.min(1, (p - PLATE.from) / (PLATE.to - PLATE.from)));
  const s = t * t * (3 - 2 * t);
  return Math.round(s * n);
}

/** The plate's own opacity: in over the first stretch, held, gone at the handover. */
export function plateOpacity(p) {
  if (!Number.isFinite(p) || p >= 1) return 0;
  const t = Math.max(0, Math.min(1, (p - 0.55) / 0.05));
  return t * t * (3 - 2 * t);
}
