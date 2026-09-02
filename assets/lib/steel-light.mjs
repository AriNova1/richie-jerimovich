/* ============================================================================
   steel-light: M0 to M4 backdrop. Hand-rolled WebGL1, one quad.
   Brushed steel, lamp pools, pointer lamp, grain, vignette.
   Text is never in the shader.
   ========================================================================== */

export function canShader() {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  if (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData) {
    return false;
  }
  const mobile = typeof matchMedia === 'function' && matchMedia('(max-width: 860px)').matches;
  if (mobile && typeof window !== 'undefined' && window.devicePixelRatio > 2) {
    return false;
  }
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_pointer_on;
uniform vec3 u_lamps[6];
uniform vec3 u_night;
uniform vec3 u_steel;
uniform float u_grain;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv - 0.5;
  float steel = noise(vec2(uv.x * 4.0, uv.y * 240.0));
  vec3 col = mix(u_night, u_steel, 0.35 + steel * 0.28);

  for (int i = 0; i < 6; i++) {
    vec3 L = u_lamps[i];
    if (L.z <= 0.001) continue;
    vec2 d = vec2((uv.x - L.x) * 1.15, (uv.y - L.y) * 2.4);
    float fall = exp(-dot(d, d) * 3.2);
    vec3 warm = vec3(0.94, 0.75, 0.25);
    col += warm * fall * L.z * 0.55;
  }

  if (u_pointer_on > 0.01) {
    vec2 d = (uv - u_pointer) * vec2(1.0, 1.6);
    float fall = exp(-dot(d, d) * 7.0);
    col += vec3(0.94, 0.72, 0.22) * fall * u_pointer_on * 0.7;
  }

  float n = hash(gl_FragCoord.xy * 0.37 + u_time * 12.0);
  col += (n - 0.5) * u_grain;

  float vig = smoothstep(1.15, 0.25, length(p));
  col *= mix(0.65, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('steel-light shader: ' + log);
  }
  return s;
}

/**
 * Mount the steel backdrop. Returns { setLamps, setPointer, setTime, pause, resume, destroy }.
 * Lamps: array of {x, y, intensity} in 0..1 UV. Pointer: {x, y, on} smoothed by the caller.
 */
export function mountSteel(canvas, { night = '#080605', steel = '#1b1917' } = {}) {
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('steel-light link: ' + gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uPointer = gl.getUniformLocation(prog, 'u_pointer');
  const uPointerOn = gl.getUniformLocation(prog, 'u_pointer_on');
  const uLamps = gl.getUniformLocation(prog, 'u_lamps[0]');
  const uNight = gl.getUniformLocation(prog, 'u_night');
  const uSteel = gl.getUniformLocation(prog, 'u_steel');
  const uGrain = gl.getUniformLocation(prog, 'u_grain');

  gl.uniform3fv(uNight, hexToRgb(night));
  gl.uniform3fv(uSteel, hexToRgb(steel));
  gl.uniform1f(uGrain, 0.05);

  const lamps = new Float32Array(18);
  let pointer = [0.5, 0.35];
  let pointerOn = 0;
  let time = 0;
  let paused = false;
  let raf = 0;
  let last = 0;

  const size = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };

  const draw = (now) => {
    if (paused) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    time += dt;
    size();
    gl.uniform1f(uTime, time);
    gl.uniform2f(uPointer, pointer[0], pointer[1]);
    gl.uniform1f(uPointerOn, pointerOn);
    gl.uniform3fv(uLamps, lamps);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(draw);
  };

  size();
  raf = requestAnimationFrame(draw);

  const onHide = () => {
    if (document.hidden) api.pause();
    else api.resume();
  };
  document.addEventListener('visibilitychange', onHide);

  const api = {
    setLamps(list) {
      lamps.fill(0);
      (list || []).slice(0, 6).forEach((L, i) => {
        lamps[i * 3] = L.x;
        lamps[i * 3 + 1] = L.y;
        lamps[i * 3 + 2] = L.intensity;
      });
    },
    setPointer(x, y, on) {
      pointer = [x, y];
      pointerOn = on ? 1 : 0;
    },
    pause() {
      paused = true;
      last = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    resume() {
      if (!paused) return;
      paused = false;
      last = 0;
      raf = requestAnimationFrame(draw);
    },
    destroy() {
      api.pause();
      document.removeEventListener('visibilitychange', onHide);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
  return api;
}
