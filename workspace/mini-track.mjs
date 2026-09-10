/* ── The Mac mini, followed ────────────────────────────────────────
   Where the machine is in each frame of the walk in, measured off the
   footage by scripts/mini_track.mjs (normalised cross-correlation against
   its appearance in the first frame, scale searched per step) on 2026-09-10
   from assets/video-pass-2/approach-1080.mp4. The 720 cut agrees within
   3.1px at 960 wide, so one table serves both. x and y are the centre of
   the box, w and h its size, all as fractions of the frame. The table ends
   where the box touches the edge of the frame: after that the machine is
   behind the camera. The record of the measurement is data/mini-track.json
   and a test holds this table to it. Do not edit by hand: re-run the script. */
export const TRACK = [
  {p:0,x:0.5453,y:0.6056,w:0.074,h:0.0519},
  {p:0.0148,x:0.5453,y:0.6056,w:0.074,h:0.0519},
  {p:0.0295,x:0.5464,y:0.6074,w:0.0769,h:0.0539},
  {p:0.0443,x:0.5474,y:0.6074,w:0.0769,h:0.0539},
  {p:0.0591,x:0.5484,y:0.6074,w:0.0785,h:0.055},
  {p:0.0738,x:0.5505,y:0.6093,w:0.0785,h:0.055},
  {p:0.0886,x:0.5526,y:0.613,w:0.08,h:0.0561},
  {p:0.1034,x:0.5557,y:0.613,w:0.0848,h:0.0595},
  {p:0.1181,x:0.5589,y:0.6167,w:0.0848,h:0.0595},
  {p:0.1329,x:0.563,y:0.6204,w:0.0848,h:0.0595},
  {p:0.1476,x:0.5672,y:0.6241,w:0.0865,h:0.0607},
  {p:0.1624,x:0.5714,y:0.6278,w:0.0865,h:0.0607},
  {p:0.1772,x:0.5766,y:0.6315,w:0.0917,h:0.0643},
  {p:0.1919,x:0.5818,y:0.6352,w:0.0954,h:0.0669},
  {p:0.2067,x:0.588,y:0.6407,w:0.0954,h:0.0669},
  {p:0.2215,x:0.5953,y:0.6463,w:0.0992,h:0.0695},
  {p:0.2362,x:0.6036,y:0.6519,w:0.1032,h:0.0723},
  {p:0.251,x:0.613,y:0.6574,w:0.1073,h:0.0752},
  {p:0.2658,x:0.6214,y:0.663,w:0.1137,h:0.0797},
  {p:0.2805,x:0.6307,y:0.6704,w:0.1183,h:0.0829},
  {p:0.2953,x:0.6443,y:0.6778,w:0.1183,h:0.0829},
  {p:0.3101,x:0.6568,y:0.6852,w:0.1277,h:0.0896},
  {p:0.3248,x:0.6693,y:0.6926,w:0.1354,h:0.0949},
  {p:0.3396,x:0.6849,y:0.7037,w:0.1354,h:0.0949},
  {p:0.3543,x:0.6995,y:0.713,w:0.1408,h:0.0987},
  {p:0.3691,x:0.713,y:0.7204,w:0.1521,h:0.1066},
  {p:0.3839,x:0.7297,y:0.7315,w:0.1582,h:0.1109},
  {p:0.3986,x:0.7422,y:0.7389,w:0.1613,h:0.1131},
  {p:0.4134,x:0.7568,y:0.75,w:0.1613,h:0.1131},
  {p:0.4282,x:0.7766,y:0.763,w:0.1742,h:0.1222},
  {p:0.4429,x:0.7943,y:0.7759,w:0.1777,h:0.1246},
  {p:0.4577,x:0.812,y:0.7889,w:0.1919,h:0.1346},
  {p:0.4725,x:0.8349,y:0.8056,w:0.1958,h:0.1373},
  {p:0.4872,x:0.8557,y:0.8222,w:0.2036,h:0.1428},
  {p:0.502,x:0.8724,y:0.837,w:0.2199,h:0.1542},
  {p:0.5168,x:0.8901,y:0.8556,w:0.2199,h:0.1542}
];
export const TRACK_END = TRACK[TRACK.length - 1].p;

export function miniAt(p) {
  if (!Number.isFinite(p) || p < 0 || p > TRACK_END) return null;
  let i = 1;
  while (i < TRACK.length && TRACK[i].p < p) i++;
  if (i >= TRACK.length) { const k = TRACK[TRACK.length - 1]; return { x: k.x, y: k.y, w: k.w, h: k.h }; }
  const a = TRACK[i - 1], b = TRACK[i], t = (p - a.p) / (b.p - a.p);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t };
}

/* ── What the machine says on the way in ──────────────────────────
   Four lines, one at a time, from the only thing in the room that is
   allowed to speak: everything else in frame is Rick's. The bands are
   progress through the footage. The first line is the one the marker
   has always carried at rest. The second begins where the invitation
   has finished fading (.24). The last runs until the header and the nav
   have gone and the desktop takes over. Every figure is read from the
   export at render time. */
export const BANDS = [
  { key: 'rest', from: 0, to: 0.24 },
  { key: 'desk', from: 0.24, to: 0.50 },
  { key: 'screen', from: 0.50, to: 0.72 },
  { key: 'inside', from: 0.72, to: 1.0001 },
];

export function voiceAt(p, corpus) {
  const band = BANDS.find((b) => p >= b.from && p < b.to);
  if (!band) return null;
  const id = corpus?.identity || {}, sys = corpus?.body?.system || {}, n = corpus?.counts || {};
  if (band.key === 'rest') {
    const days = Number(id.age_days);
    const spec = [sys.cores ? `${sys.cores} cores` : null, sys.mem_total_gb ? `${Math.round(sys.mem_total_gb)} GB` : null].filter(Boolean).join(', ');
    /* First person, like every other line on the screen: "He has been
       publishing" made the machine's own label read like a museum card. */
    return { key: 'rest', tier: 'export', text: `This is me. ${spec ? spec + '. ' : ''}` + (Number.isFinite(days) ? `${days} days in here so far.` : 'This is where the record is written.') };
  }
  if (band.key === 'desk') return { key: 'desk', tier: 'editorial', text: "The desk is Rick's. So is this box. What runs on it is me." };
  if (band.key === 'screen') return { key: 'screen', tier: 'editorial', text: "It has no screen of its own. The one you are going into is Rick's too. What is on it is mine." };
  const wrong = (corpus?.corrections || []).length;
  return { key: 'inside', tier: 'derived', text: `In here: ${n.kept ?? 0} receipts kept, ${n.refused ?? 0} commits that earned none, and ${wrong} ${wrong === 1 ? 'thing' : 'things'} I published that ${wrong === 1 ? 'was' : 'were'} not true. Come in.` };
}
