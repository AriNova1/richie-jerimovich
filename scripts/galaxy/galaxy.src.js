// Cinematic galaxy/organism hero for /organism/. Self-hosted, bundled by esbuild
// into assets/js/organism-galaxy.js (no third-party runtime request). A glowing
// spiral particle disc seen FACE-ON (a circle facing the viewer, not a flat
// overhead ellipse), with a hot bloomed core, rotating in-plane. It is faded out
// radially well before the canvas edge, so it floats as a circle with no box.
// Reactive to real agent state via window.OrganismCore.sync(d).
import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing";

(function () {
  var canvas = document.querySelector(".core-orb__canvas");
  if (!canvas) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var gl;
  try { gl = canvas.getContext("webgl2") || canvas.getContext("webgl"); } catch (e) {}
  if (!gl) { window.OrganismCore = { sync: function () {}, start: function () {} }; return; }

  var small = Math.min(window.innerWidth, window.innerHeight) < 760;
  var COUNT = small ? 16000 : 52000;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);
  camera.lookAt(0, 0, 0);

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
    var t = Math.pow(Math.random(), 0.65);
    var radius = 0.1 + t * MAXR;
    var ring = radius + (Math.random() - 0.5) * 0.12;
    var angle = Math.random() * Math.PI * 2;
    var spin = radius * 0.5;
    var spread = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;
    positions[i3] = Math.cos(angle + spin) * ring + spread;
    positions[i3 + 1] = Math.sin(angle + spin) * ring + spread;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.09 * (0.4 + radius * 0.2);   // thin depth
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
    uSize: { value: 26 * renderer.getPixelRatio() },
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
      "varying vec3 vColor;varying float vTwinkle;varying float vEdge;",
      "void main(){",
      "float dc=length(position.xy);",
      "float ang=atan(position.y,position.x)+(1.0/(dc+0.4))*uTime*(0.14+uResp*0.16);",
      "vec3 p=vec3(cos(ang)*dc,sin(ang)*dc,position.z);",
      "p.z+=sin(uTime*0.5+aSeed*6.28)*0.01;",
      "vec4 mp=modelMatrix*vec4(p,1.0);vec4 vp=viewMatrix*mp;",
      "gl_Position=projectionMatrix*vp;",
      "vTwinkle=0.7+0.3*sin(uTime*1.4+aSeed*20.0);",
      "gl_PointSize=uSize*aScale*(0.7+uEnergy*0.6)*vTwinkle;",
      "gl_PointSize*=(1.0/-vp.z);",
      "vColor=color;",
      "vEdge=1.0-smoothstep(" + (MAXR * 0.6).toFixed(2) + "," + MAXR.toFixed(2) + ",dc);",
      "}",
    ].join("\n"),
    fragmentShader: [
      "varying vec3 vColor;varying float vTwinkle;varying float vEdge;",
      "void main(){",
      "float d=distance(gl_PointCoord,vec2(0.5));",
      "float s=pow(max(0.0,1.0-d*2.0),2.4)*vEdge;",
      "if(s<0.01)discard;",
      "gl_FragColor=vec4(vColor*(0.6+vTwinkle*0.6),s);}",
    ].join("\n"),
  });
  var points = new THREE.Points(geo, mat);
  points.rotation.x = -0.16;   // a hint of tilt, still clearly circular/face-on
  scene.add(points);

  var composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  var bloom = new BloomEffect({ intensity: 1.2, luminanceThreshold: 0.6, luminanceSmoothing: 0.32, mipmapBlur: true, radius: 0.72 });
  composer.addPass(new EffectPass(camera, bloom));

  function resize() {
    var w = canvas.clientWidth || 320, h = canvas.clientHeight || 320;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
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

  var clock = new THREE.Clock();
  var raf = 0, running = false;
  function frame() {
    var dt = clock.getDelta();
    uniforms.uTime.value += dt;
    uniforms.uEnergy.value += (energy - uniforms.uEnergy.value) * 0.04;
    uniforms.uResp.value += (responding - uniforms.uResp.value) * 0.06;
    bloom.intensity = 1.0 + uniforms.uEnergy.value * 0.5 + uniforms.uResp.value * 0.6;
    composer.render();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running && !reduce) { running = true; clock.start(); raf = requestAnimationFrame(frame); } }
  function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }

  if (reduce) { uniforms.uTime.value = 8; composer.render(); }
  else start();

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.01 }).observe(canvas);
  }
})();
