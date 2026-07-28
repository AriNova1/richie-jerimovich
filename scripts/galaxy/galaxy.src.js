// Cinematic WebGL for /organism/. Self-hosted, bundled by esbuild into
// assets/js/organism-galaxy.js (no third-party runtime request). Two visuals
// share this one Three.js import:
//   1. initGalaxy        the hero core: a face-on spiral particle disc, rendered
//                        crisp (additive points, no bloom) so the grain reads,
//                        rotating in-plane and reactive to live agent state via
//                        window.OrganismCore.sync(d).
//   2. initConstellation the memory card's knowledge graph: a slow rotating
//                        sphere of nodes wired by nearest-neighbour edges, its
//                        density scaled to the real mnemosyne facts/edge counts.
//
// A third visual, initVoices (the five-voices council), was removed in the v7
// "The Pass" rebuild along with the voices column it drew beside. It kept
// shipping in this bundle as dead code until 2026-07-28.
//
// Motion hold: every rig registers with HOLD so the page can stop all of them
// from one control (WCAG 2.2 SC 2.2.2). While held, the visibility and
// intersection observers below must not quietly resume them, which is why
// start() checks HOLD.held rather than the caller checking it.
import * as THREE from "three";

// Seeded from storage so a reader who held the board last visit does not get
// one frame of motion before the page script re-applies it.
var HOLD = { held: false, rigs: [] };
try { HOLD.held = localStorage.getItem("organismHold") === "1"; } catch (e) {}
function register(start, stop) { HOLD.rigs.push({ start: start, stop: stop }); }
window.OrganismMotion = {
  hold: function () { HOLD.held = true; HOLD.rigs.forEach(function (r) { r.stop(); }); },
  release: function () { HOLD.held = false; HOLD.rigs.forEach(function (r) { r.start(); }); },
  isHeld: function () { return HOLD.held; },
};

// shared soft-glow point sprite (additive); alpha carried in vA
var GLOW_FRAG = [
  "varying vec3 vColor;varying float vA;",
  "void main(){float d=distance(gl_PointCoord,vec2(0.5));",
  "float s=pow(max(0.0,1.0-d*2.0),2.4);if(s<0.01)discard;",
  "gl_FragColor=vec4(vColor,s*vA);}",
].join("\n");

function initGalaxy() {
  var canvas = document.querySelector(".core-orb__canvas");
  if (!canvas) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var gl;
  try { gl = canvas.getContext("webgl2") || canvas.getContext("webgl"); } catch (e) {}
  if (!gl) { window.OrganismCore = { sync: function () {}, start: function () {} }; return; }

  var small = Math.min(window.innerWidth, window.innerHeight) < 760;
  var COUNT = small ? 9000 : 16000;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 4.3);

  // ---- disc in the XY plane (faces the camera), hot core -> warm rim ----
  var MAXR = 1.7;
  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var scales = new Float32Array(COUNT);
  var seeds = new Float32Array(COUNT);
  var inside = new THREE.Color(0xfff1d4);
  var outside = new THREE.Color(0xd2872c);
  for (var i = 0; i < COUNT; i++) {
    var i3 = i * 3;
    var t = Math.pow(Math.random(), 0.62);
    var radius = 0.08 + t * MAXR;
    var angle = Math.random() * Math.PI * 2;
    var spin = radius * 0.5;
    var spread = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;
    positions[i3] = Math.cos(angle + spin) * radius + spread;
    positions[i3 + 1] = Math.sin(angle + spin) * radius + spread;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.1 * radius;
    var c = inside.clone().lerp(outside, Math.min(1, radius / MAXR));
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
    scales[i] = 0.4 + Math.random() * 0.9;
    seeds[i] = Math.random();
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  var uniforms = {
    uTime: { value: 0 },
    uSize: { value: 22 * renderer.getPixelRatio() },
    uEnergy: { value: 0.45 },
    uResp: { value: 0 },
  };
  var mat = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: uniforms,
    vertexShader: [
      "uniform float uTime;uniform float uSize;uniform float uEnergy;uniform float uResp;",
      "attribute float aScale;attribute float aSeed;",
      "varying vec3 vColor;varying float vA;",
      "void main(){",
      "float dc=length(position.xy);",
      "float ang=atan(position.y,position.x)+(1.0/(dc+0.4))*uTime*(0.14+uResp*0.16);",
      "vec3 p=vec3(cos(ang)*dc,sin(ang)*dc,position.z);",
      "vec4 mv=modelViewMatrix*vec4(p,1.0);",
      "gl_Position=projectionMatrix*mv;",
      "float tw=0.7+0.3*sin(uTime*1.4+aSeed*20.0);",
      "gl_PointSize=uSize*aScale*(0.7+uEnergy*0.6)*tw*(1.0/-mv.z);",
      "vColor=color;",
      "vA=(1.0-smoothstep(" + (MAXR * 0.6).toFixed(2) + "," + MAXR.toFixed(2) + ",dc))*(0.5+tw*0.5);",
      "}",
    ].join("\n"),
    fragmentShader: GLOW_FRAG,
  });
  var points = new THREE.Points(geo, mat);
  points.rotation.x = -0.18;   // a hint of tilt, still clearly circular/face-on
  scene.add(points);

  function resize() {
    var w = canvas.clientWidth || 320, h = canvas.clientHeight || 320;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  var energy = 0.45, responding = 0;
  window.OrganismCore = {
    sync: function (d) {
      if (!d || !d.runtime) return;
      responding = d.runtime.now_responding ? 1 : 0;
      if (d.online === false) { energy = 0.14; return; }
      var s = d.runtime.active_sessions || 0;
      energy = Math.min(1, 0.4 + s * 0.08);
    },
    start: function () {},
  };

  var last = performance.now();
  var raf = 0, running = false;
  function frame() {
    var nowt = performance.now();
    var dt = Math.min(0.05, (nowt - last) / 1000);   // clamp so a resumed tab does not jump
    last = nowt;
    uniforms.uTime.value += dt;
    uniforms.uEnergy.value += (energy - uniforms.uEnergy.value) * 0.04;
    uniforms.uResp.value += (responding - uniforms.uResp.value) * 0.06;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running && !reduce && !HOLD.held) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }
  register(start, stop);

  if (reduce) { uniforms.uTime.value = 8; renderer.render(scene, camera); }
  else start();

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.01 }).observe(canvas);
  }
}

function initConstellation() {
  var canvas = document.querySelector(".mind-orb__canvas");
  if (!canvas) return;
  var gl;
  try { gl = canvas.getContext("webgl2") || canvas.getContext("webgl"); } catch (e) {}
  if (!gl) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = Math.min(window.innerWidth, window.innerHeight) < 760;

  // density scaled (not 1:1) from the real mnemosyne counts; the card shows the
  // true numbers, this is an honest representation of the graph, not a plot.
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  var facts = parseInt(canvas.getAttribute("data-facts") || "0", 10) || 200;
  var edges = parseInt(canvas.getAttribute("data-edges") || "0", 10) || 240;
  var N = clamp(Math.round(facts / 12), 70, small ? 150 : 230);
  var ELIMIT = clamp(Math.round(edges / 9), 50, small ? 170 : 300);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 3.4);

  var group = new THREE.Group();
  scene.add(group);

  // node positions: a fibonacci sphere with a little radial variance so it
  // reads as a cloud, not a hollow shell.
  var R = 1.18;
  var node = [];
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2;
    var rr = Math.sqrt(Math.max(0, 1 - y * y));
    var phi = i * Math.PI * (3 - Math.sqrt(5));
    var rad = R * (0.8 + Math.random() * 0.2);
    node.push(new THREE.Vector3(Math.cos(phi) * rr * rad, y * rad, Math.sin(phi) * rr * rad));
  }

  // nodes as soft additive glow points
  var npos = new Float32Array(N * 3);
  var ncol = new Float32Array(N * 3);
  var nseed = new Float32Array(N);
  var nsc = new Float32Array(N);
  var nIn = new THREE.Color(0xffe3ad);
  var nOut = new THREE.Color(0xeaa83c);
  for (var i = 0; i < N; i++) {
    npos[i * 3] = node[i].x; npos[i * 3 + 1] = node[i].y; npos[i * 3 + 2] = node[i].z;
    var c = nIn.clone().lerp(nOut, Math.random());
    ncol[i * 3] = c.r; ncol[i * 3 + 1] = c.g; ncol[i * 3 + 2] = c.b;
    nseed[i] = Math.random();
    nsc[i] = 0.7 + Math.random() * 0.7;
  }
  var ngeo = new THREE.BufferGeometry();
  ngeo.setAttribute("position", new THREE.BufferAttribute(npos, 3));
  ngeo.setAttribute("color", new THREE.BufferAttribute(ncol, 3));
  ngeo.setAttribute("aSeed", new THREE.BufferAttribute(nseed, 1));
  ngeo.setAttribute("aScale", new THREE.BufferAttribute(nsc, 1));
  var nUniforms = { uTime: { value: 0 }, uSize: { value: 18 * renderer.getPixelRatio() } };
  var nmat = new THREE.ShaderMaterial({
    depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: nUniforms,
    vertexShader: [
      "uniform float uTime;uniform float uSize;attribute float aSeed;attribute float aScale;",
      "varying vec3 vColor;varying float vA;",
      "void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;",
      "float tw=0.55+0.45*sin(uTime*1.3+aSeed*30.0);",
      "gl_PointSize=uSize*aScale*(0.6+tw*0.7)*(1.0/-mv.z);vColor=color;vA=0.45+tw*0.55;}",
    ].join("\n"),
    fragmentShader: GLOW_FRAG,
  });
  group.add(new THREE.Points(ngeo, nmat));

  // edges: wire each node to its two nearest neighbours until the cap is hit.
  var segs = [];
  var used = {};
  for (var i = 0; i < N && segs.length < ELIMIT * 2; i++) {
    var best = -1, best2 = -1, bd = 1e9, bd2 = 1e9;
    for (var j = 0; j < N; j++) {
      if (j === i) continue;
      var dx = node[i].x - node[j].x, dy = node[i].y - node[j].y, dz = node[i].z - node[j].z;
      var dd = dx * dx + dy * dy + dz * dz;
      if (dd < bd) { bd2 = bd; best2 = best; bd = dd; best = j; }
      else if (dd < bd2) { bd2 = dd; best2 = j; }
    }
    [best, best2].forEach(function (j) {
      if (j < 0 || segs.length >= ELIMIT * 2) return;
      var key = i < j ? i + "_" + j : j + "_" + i;
      if (used[key]) return;
      used[key] = 1;
      segs.push(node[i], node[j]);
    });
  }
  var lpos = new Float32Array(segs.length * 3);
  for (var i = 0; i < segs.length; i++) {
    lpos[i * 3] = segs[i].x; lpos[i * 3 + 1] = segs[i].y; lpos[i * 3 + 2] = segs[i].z;
  }
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
  var lmat = new THREE.LineBasicMaterial({ color: 0xeaa83c, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(lgeo, lmat));

  group.rotation.x = 0.38;

  function resize() {
    var w = canvas.clientWidth || 300, h = canvas.clientHeight || 220;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  var last = performance.now(), raf = 0, running = false;
  function frame() {
    var nowt = performance.now();
    var dt = Math.min(0.05, (nowt - last) / 1000);
    last = nowt;
    nUniforms.uTime.value += dt;
    group.rotation.y += dt * 0.11;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running && !reduce && !HOLD.held) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }
  register(start, stop);

  if (reduce) { nUniforms.uTime.value = 5; renderer.render(scene, camera); }
  else start();

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.01 }).observe(canvas);
  }
}

initGalaxy();
initConstellation();
