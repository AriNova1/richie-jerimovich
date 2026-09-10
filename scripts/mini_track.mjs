#!/usr/bin/env node
/* Where is the Mac mini in each frame of the walk in? Measured, not guessed:
   normalised cross-correlation against the machine's appearance in the first
   frame (box read off a 3x crop), scale searched per three-frame step, until
   the box touches the edge of the frame. Writes the track and, given a third
   argument, a montage of eight frames with the box drawn on for a human to
   check. usage: node scripts/mini_track.mjs [footage] [out.json] [montage-dir] */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const [,, src = 'workspace/assets/video-pass-2/approach-1080.mp4', outJson = 'workspace/data/mini-track.json', montageDir] = process.argv;
const W = 960, H = 540, STEP = 3, MAXT = '5.2', FPS = 24, FINAL = 191;
function decode(pix) {
  const r = spawnSync('ffmpeg', ['-v','error','-t',MAXT,'-i',src,'-vf',`select=not(mod(n\\,${STEP})),scale=${W}:${H}`,'-vsync','vfr','-f','rawvideo','-pix_fmt',pix,'-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  return r.stdout;
}
const gray = decode('gray'), rgb = decode('rgb24');
const N = Math.floor(gray.length / (W * H));
const frame = (i) => gray.subarray(i * W * H, (i + 1) * W * H);
// Template: the mini in frame 0 with a small margin of desk around it (measured
// off a 3x crop: box x 492-555, y 317-337 at 960x540).
const T = { x0: 488, y0: 313, x1: 559, y1: 341 };
const TW = T.x1 - T.x0, TH = T.y1 - T.y0;
const f0 = frame(0);
const tmpl = new Float32Array(TW * TH);
for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) tmpl[y * TW + x] = f0[(T.y0 + y) * W + (T.x0 + x)];
function sampleT(u, v) { // bilinear in template space
  const x = Math.min(TW - 1.001, Math.max(0, u)), y = Math.min(TH - 1.001, Math.max(0, v));
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
  const a = tmpl[y0 * TW + x0], b = tmpl[y0 * TW + x0 + 1], c = tmpl[(y0 + 1) * TW + x0], d = tmpl[(y0 + 1) * TW + x0 + 1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
function ncc(img, cx, cy, s) { // template centred at (cx,cy), scaled by s; sampled on a grid capped at ~2000 points
  const w = TW * s, h = TH * s, step = Math.max(1, Math.sqrt((w * h) / 2000));
  let n = 0, st = 0, si = 0, stt = 0, sii = 0, sti = 0;
  for (let v = 0; v < h; v += step) for (let u = 0; u < w; u += step) {
    const x = Math.round(cx - w / 2 + u), y = Math.round(cy - h / 2 + v);
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    const t = sampleT(u / s, v / s), i = img[y * W + x];
    n++; st += t; si += i; stt += t * t; sii += i * i; sti += t * i;
  }
  const mt = st / n, mi = si / n, vt = stt / n - mt * mt, vi = sii / n - mi * mi;
  if (vt <= 1e-6 || vi <= 1e-6) return -1;
  return (sti / n - mt * mi) / Math.sqrt(vt * vi);
}
const track = [];
let cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2, s = 1, vx = 0, vy = 0;
for (let i = 0; i < N; i++) {
  const img = frame(i);
  let best = { score: -2 };
  const px = cx + vx, py = cy + vy, R = i === 0 ? 0 : 40;
  for (const sc of i === 0 ? [1] : [1, 1.02, 1.04, 1.06, 1.08, 1.11]) {
    const ss = s * sc;
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) {
      const score = ncc(img, px + dx, py + dy, ss);
      if (score > best.score) best = { score, x: px + dx, y: py + dy, s: ss };
    }
  }
  // refine to 1px
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const score = ncc(img, best.x + dx, best.y + dy, best.s); if (score > best.score) best = { score, x: best.x + dx, y: best.y + dy, s: best.s }; }
  vx = best.x - cx; vy = best.y - cy; cx = best.x; cy = best.y; s = best.s;
  const w = TW * s, h = TH * s;
  const frameNo = i * STEP, t = frameNo / FPS, p = Math.min(1, frameNo / FINAL) * 0.94;
  const box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
  const edge = box[2] >= W - 2 || box[3] >= H - 2 || box[0] <= 1;
  const row = { frame: frameNo, t: +t.toFixed(4), p: +p.toFixed(4), x: +(cx / W).toFixed(4), y: +(cy / H).toFixed(4), w: +(w / W).toFixed(4), h: +(h / H).toFixed(4), ncc: +best.score.toFixed(3), edge };
  track.push(row);
  console.log(JSON.stringify(row));
  if (edge || best.score < 0.45) break;
}
writeFileSync(outJson, JSON.stringify(track, null, 1));
if (montageDir) {
  mkdirSync(montageDir, { recursive: true });
  const picks = [0, 6, 12, 16, 20, 24, 28, track.length - 1].filter((i, k, a) => i < track.length && a.indexOf(i) === k);
  picks.forEach((i, k) => {
    const buf = Buffer.from(rgb.subarray(i * W * H * 3, (i + 1) * W * H * 3));
    const r = track[i], x0 = Math.round((r.x - r.w / 2) * W), x1 = Math.round((r.x + r.w / 2) * W), y0 = Math.round((r.y - r.h / 2) * H), y1 = Math.round((r.y + r.h / 2) * H);
    const dot = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const o = (y * W + x) * 3; buf[o] = 0; buf[o + 1] = 255; buf[o + 2] = 80; };
    for (let x = x0; x <= x1; x++) { dot(x, y0); dot(x, y0 + 1); dot(x, y1); dot(x, y1 - 1); }
    for (let y = y0; y <= y1; y++) { dot(x0, y); dot(x0 + 1, y); dot(x1, y); dot(x1 - 1, y); }
    const cxp = Math.round(r.x * W), cyp = Math.round(r.y * H); for (let d = -4; d <= 4; d++) { dot(cxp + d, cyp); dot(cxp, cyp + d); }
    writeFileSync(`${montageDir}/box${String(k).padStart(2, '0')}.ppm`, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), buf]));
  });
  spawnSync('ffmpeg', ['-v','error','-y','-framerate','1','-i',`${montageDir}/box%02d.ppm`,'-vf','scale=480:-1,tile=4x2',`${montageDir}/montage.png`]);
}
