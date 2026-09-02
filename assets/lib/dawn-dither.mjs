/* ============================================================================
   dawn-dither: M5 only. 8x8 Bayer threshold wipe, one quad.
   Fallback is a hard cut, never a crossfade (failsIf 2).
   ========================================================================== */

import { canShader } from './steel-light.mjs';
export { canShader };

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_progress;
uniform vec3 u_colA;
uniform vec3 u_colB;

float bayer8(vec2 p) {
  float x = mod(p.x, 8.0);
  float y = mod(p.y, 8.0);
  float idx = x + y * 8.0;
  float m = 0.0;
  // 8x8 Bayer matrix, 0..63, normalised later
  if (idx < 32.0) {
    if (idx < 16.0) {
      if (idx < 8.0) {
        m = idx < 1.0 ? 0.0 : idx < 2.0 ? 32.0 : idx < 3.0 ? 8.0 : idx < 4.0 ? 40.0
          : idx < 5.0 ? 2.0 : idx < 6.0 ? 34.0 : idx < 7.0 ? 10.0 : 42.0;
      } else {
        m = idx < 9.0 ? 48.0 : idx < 10.0 ? 16.0 : idx < 11.0 ? 56.0 : idx < 12.0 ? 24.0
          : idx < 13.0 ? 50.0 : idx < 14.0 ? 18.0 : idx < 15.0 ? 58.0 : 26.0;
      }
    } else {
      if (idx < 24.0) {
        m = idx < 17.0 ? 12.0 : idx < 18.0 ? 44.0 : idx < 19.0 ? 4.0 : idx < 20.0 ? 36.0
          : idx < 21.0 ? 14.0 : idx < 22.0 ? 46.0 : idx < 23.0 ? 6.0 : 38.0;
      } else {
        m = idx < 25.0 ? 60.0 : idx < 26.0 ? 28.0 : idx < 27.0 ? 52.0 : idx < 28.0 ? 20.0
          : idx < 29.0 ? 62.0 : idx < 30.0 ? 30.0 : idx < 31.0 ? 54.0 : 22.0;
      }
    }
  } else {
    if (idx < 48.0) {
      if (idx < 40.0) {
        m = idx < 33.0 ? 3.0 : idx < 34.0 ? 35.0 : idx < 35.0 ? 11.0 : idx < 36.0 ? 43.0
          : idx < 37.0 ? 1.0 : idx < 38.0 ? 33.0 : idx < 39.0 ? 9.0 : 41.0;
      } else {
        m = idx < 41.0 ? 51.0 : idx < 42.0 ? 19.0 : idx < 43.0 ? 59.0 : idx < 44.0 ? 27.0
          : idx < 45.0 ? 49.0 : idx < 46.0 ? 17.0 : idx < 47.0 ? 57.0 : 25.0;
      }
    } else {
      if (idx < 56.0) {
        m = idx < 49.0 ? 15.0 : idx < 50.0 ? 47.0 : idx < 51.0 ? 7.0 : idx < 52.0 ? 39.0
          : idx < 53.0 ? 13.0 : idx < 54.0 ? 45.0 : idx < 55.0 ? 5.0 : 37.0;
      } else {
        m = idx < 57.0 ? 63.0 : idx < 58.0 ? 31.0 : idx < 59.0 ? 55.0 : idx < 60.0 ? 23.0
          : idx < 61.0 ? 61.0 : idx < 62.0 ? 29.0 : idx < 63.0 ? 53.0 : 21.0;
      }
    }
  }
  return (m + 0.5) / 64.0;
}

void main() {
  float b = bayer8(gl_FragCoord.xy);
  float k = step(b, u_progress);
  vec3 col = mix(u_colA, u_colB, k);
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
    throw new Error('dawn-dither shader: ' + gl.getShaderInfoLog(s));
  }
  return s;
}

export function mountDawn(canvas, { night = '#080605', dawn = '#a9bfd4' } = {}) {
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
    throw new Error('dawn-dither link: ' + gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uProgress = gl.getUniformLocation(prog, 'u_progress');
  const uA = gl.getUniformLocation(prog, 'u_colA');
  const uB = gl.getUniformLocation(prog, 'u_colB');
  gl.uniform3fv(uA, hexToRgb(night));
  gl.uniform3fv(uB, hexToRgb(dawn));

  let progress = 0;
  let paused = true;

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

  const paint = () => {
    if (paused) return;
    size();
    gl.uniform1f(uProgress, progress);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  size();

  return {
    setProgress(p) {
      progress = Math.max(0, Math.min(1, p));
      if (!paused) paint();
    },
    show() {
      canvas.hidden = false;
      paused = false;
      paint();
    },
    hide() {
      canvas.hidden = true;
      paused = true;
    },
    pause() { paused = true; },
    resume() { paused = false; paint(); },
    destroy() {
      paused = true;
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
