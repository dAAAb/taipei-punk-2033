// ============================================================
// Colorfigures × Cyberpunk 2033 Afterlife (來生・台北安可) 3D Engine (v3 High-Perf & Immersive Zoom)
// Optimized for Safari / Mobile 60FPS (color-batched loft paths + fast crowd silhouettes)
// and zoomed-in Stage-Front POV framing with zero dead space.
// ============================================================

(function () {
  /* ---------- Palettes (Colorfigures 3-Band Flat Cel-Shading {l, m, d}) ---------- */
  const PALS = {
    afterlife: {
      name: '來生霓虹 (Afterlife 2033)',
      bg: '#0d0e1a',
      paperInk: '#090710',
      stage: { l: '#2a2d4a', m: '#1b1d32', d: '#101120' },
      arch: { l: '#3c365c', m: '#26223d', d: '#151224' },
      neonA: { l: '#00f0ff', m: '#00a8cc', d: '#005066' },
      neonB: { l: '#ff2a85', m: '#cc1662', d: '#5e082b' },
      gold: { l: '#ffd026', m: '#d49c1f', d: '#5c4108' },
      emerald: { l: '#00ff9d', m: '#00b870', d: '#004d30' },
      shadow: '#06050c'
    },
    encore: {
      name: '台北安可・黃金十年 (Encore Blue & Gold)',
      bg: '#0c1930',
      paperInk: '#0a0f1d',
      stage: { l: '#25477a', m: '#183157', d: '#0d1c36' },
      arch: { l: '#f4b829', m: '#cc9214', d: '#5e4006' },
      neonA: { l: '#47c8ff', m: '#1a90cc', d: '#0b4566' },
      neonB: { l: '#ffd438', m: '#d9a414', d: '#664a05' },
      gold: { l: '#ffe14d', m: '#d49c1f', d: '#5e4309' },
      emerald: { l: '#5ce6a0', m: '#36b074', d: '#164d32' },
      shadow: '#070f1f'
    },
    nvidia: {
      name: '台北AI園區・12兆綠光 (AI Park Matrix)',
      bg: '#091410',
      paperInk: '#060d0a',
      stage: { l: '#1e382d', m: '#13261e', d: '#0a1410' },
      arch: { l: '#324d40', m: '#20332a', d: '#111c17' },
      neonA: { l: '#76ff03', m: '#52b800', d: '#245200' },
      neonB: { l: '#00f0ff', m: '#00a3b8', d: '#004954' },
      gold: { l: '#f4b829', m: '#c78f16', d: '#573d06' },
      emerald: { l: '#00ff9d', m: '#00b870', d: '#004d30' },
      shadow: '#040a08'
    },
    paper: {
      name: 'Colorfigures 經典手繪暖紙 (April Zhu Paper)',
      bg: '#f2efe7',
      paperInk: '#231e16',
      stage: { l: '#76a0e2', m: '#5a82c6', d: '#1c2948' },
      arch: { l: '#f4b829', m: '#d49c1f', d: '#4e4a18' },
      neonA: { l: '#ef6a4c', m: '#cf5038', d: '#4a2219' },
      neonB: { l: '#f3a6bb', m: '#d8869c', d: '#4b2430' },
      gold: { l: '#f4b829', m: '#d49c1f', d: '#4e4a18' },
      emerald: { l: '#93d3b0', m: '#71b693', d: '#1f4034' },
      shadow: '#41538f'
    }
  };

  const METAL = { l: '#eef2f5', m: '#b8c4cc', d: '#647078' };
  const DARK = { l: '#45424f', m: '#2b2833', d: '#17151c' };
  const CERAMIC = { l: '#ffffff', m: '#dfe5eb', d: '#9aa5b0' };
  const SUIT_NAVY = { l: '#2f528f', m: '#1f3866', d: '#101d38' };
  const SKIN = { l: '#ffdfc4', m: '#e6b896', d: '#a67858' };
  const HAIR = { l: '#2e2b36', m: '#1c1922', d: '#0d0b10' };
  const TIE_BLUE = { l: '#5cd6ff', m: '#2ca0d9', d: '#125478' };

  let INK = '#120e1a';
  let SHADOW = '#06050c';

  /* ---------- Zoomed-In Immersive Stage-Front Camera (viewBox 960 x 560) ----------
     World coordinates:
       x = depth toward viewer (0 = back skyline, 92 = central stage, 138..215 = crowd pit)
       y = horizontal stage width (0 = stage-right/viewer-left, 140 = center, 280 = stage-left/viewer-right)
       z = vertical height (0 = club floor, 26 = stage deck, 175 = top hangar arch)
  ------------------------------------------------------------------------------- */
  let OX = 480, OY = 268;
  let RC = [105, 140], RCZ = 76;
  const YAW0 = 0, PITCH0 = 12.5;
  let CAM_K = 2.58; // Zoomed-in close to the central stage for maximum immersion!
  let YAW = YAW0, PITCH = PITCH0, CAM_R, CAM_U, CAM_V, CAM_D;
  let PERSP = 0.0022;

  const camBasis = (yaw, pitch) => {
    const t = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180;
    const ct = Math.cos(t), st = Math.sin(t), cp = Math.cos(p), sp2 = Math.sin(p);
    return {
      R: [-st, ct, 0],
      U: [-sp2 * ct, -sp2 * st, cp],
      V: [cp * ct, cp * st, sp2]
    };
  };
  const CAM_B0 = camBasis(45, 32);

  function setCam(yaw, pitch, camK = null) {
    YAW = ((yaw % 360) + 360) % 360;
    if (YAW > 180) YAW -= 360;
    PITCH = Math.max(4, Math.min(70, pitch));
    if (camK != null) CAM_K = camK;
    const b = camBasis(YAW, PITCH);
    CAM_R = b.R;
    CAM_U = b.U;
    CAM_V = b.V;
    CAM_D = CAM_U.map(v => -v);
  }
  setCam(YAW0, PITCH0);

  const camDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rotV = n => {
    const r = camDot(n, CAM_R), u = camDot(n, CAM_U), v = camDot(n, CAM_V);
    return [0, 1, 2].map(i => CAM_B0.R[i] * r + CAM_B0.U[i] * u + CAM_B0.V[i] * v);
  };
  const yawTurn = ([x, y]) => {
    const t = ((YAW - YAW0) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
    return [x * c - y * s, x * s + y * c];
  };

  const P = (x, y, z) => {
    const qx = x - RC[0], qy = y - RC[1], qz = z - RCZ;
    const depth = qx * CAM_V[0] + qy * CAM_V[1] + qz * CAM_V[2];
    const scale = PERSP > 0 ? 1 / Math.max(0.42, 1 - depth * PERSP) : 1;
    const rx = qx * CAM_R[0] + qy * CAM_R[1] + qz * CAM_R[2];
    const dy = qx * CAM_D[0] + qy * CAM_D[1] + qz * CAM_D[2];
    return [CAM_K * rx * scale + OX, CAM_K * dy * scale + OY];
  };

  const Dv = (x, y, z, atPt = [RC[0], RC[1], RCZ]) => {
    const qx = atPt[0] - RC[0], qy = atPt[1] - RC[1], qz = atPt[2] - RCZ;
    const depth = qx * CAM_V[0] + qy * CAM_V[1] + qz * CAM_V[2];
    const scale = PERSP > 0 ? 1 / Math.max(0.42, 1 - depth * PERSP) : 1;
    return [CAM_K * camDot([x, y, z], CAM_R) * scale, CAM_K * camDot([x, y, z], CAM_D) * scale];
  };

  const depthOf = p => camDot(p, CAM_V);
  const f = v => (Number.isFinite(v) ? v.toFixed(1) : '0.0');
  const pd = (pts, close = true) =>
    'M' +
    pts
      .map(p => {
        const q = P(p[0], p[1], p[2]);
        return f(q[0]) + ' ' + f(q[1]);
      })
      .join('L') +
    (close ? 'Z' : '');
  const sp = pts => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';

  /* ---------- 2D Plane Helpers ---------- */
  const arcUV = (cu, cv, r, a0, a1, n = 4) => {
    const o = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      o.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
    }
    return o;
  };
  const rrUV = (u0, v0, u1, v1, r, n = 4) =>
    r <= 0
      ? rectUV(u0, v0, u1, v1)
      : [
          ...arcUV(u1 - r, v0 + r, r, -90, 0, n),
          ...arcUV(u1 - r, v1 - r, r, 0, 90, n),
          ...arcUV(u0 + r, v1 - r, r, 90, 180, n),
          ...arcUV(u0 + r, v0 + r, r, 180, 270, n)
        ];
  const rectUV = (u0, v0, u1, v1) => [
    [u0, v0],
    [u1, v0],
    [u1, v1],
    [u0, v1]
  ];
  const ellUV = (cu, cv, ru, rv, n = 14) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI;
      return [cu + ru * Math.cos(a), cv + rv * Math.sin(a)];
    });
  const PX = x => ([u, v]) => [x, u, v];
  const PY = y => ([u, v]) => [u, y, v];
  const PZ = z => ([u, v]) => [u, v, z];
  const on = (plane, uv) => uv.map(plane);

  /* ---------- Vectors & Colorfigures 3-Band Shading ---------- */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const norm = a => {
    const l = Math.hypot(...a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const avg = ps => {
    let sx = 0, sy = 0, sz = 0;
    const len = ps.length || 1;
    for (let i = 0; i < len; i++) {
      sx += ps[i][0];
      sy += ps[i][1];
      sz += ps[i][2];
    }
    return [sx / len, sy / len, sz / len];
  };
  const vis = n => camDot(n, CAM_V) > -0.05;

  const SHADOW_K = 0.85, SHADOW_LEN = 0.4;
  const L = norm([0.5, -0.35, 0.8]), SH = [-0.4, 0.3];
  const LIN = norm([0.6, 0.25, 0.95]);
  const mix = (a, b, t) =>
    '#' +
    [1, 3, 5]
      .map(i =>
        Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t)
          .toString(16)
          .padStart(2, '0')
      )
      .join('');
  const matOf = hex => ({ l: hex, m: mix(hex, '#080614', 0.22), d: mix(hex, '#05030d', 0.5) });
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // Quantized 3-band flat tone (returns pure m.l, m.m, or m.d so adjacent strips batch into 1 SVG path!)
  const step3Fast = (d, hi, lo, m) => (d >= hi ? m.l : d <= lo ? m.d : m.m);
  const tone = (n, m) => step3Fast(dot(rotV(n), L), -0.1, -0.42, m);
  const toneI = (n, m) => step3Fast(dot(rotV(n), LIN), 0.52, 0.02, m);

  /* ---------- Colorfigures SVG Drawing Primitives (Color-Batched for Safari 60FPS) ---------- */
  const ink = (d, w = 1.0, col = INK) =>
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const fill = (d, c, extra = '') => `<path d="${d}" fill="${c}" ${extra}/>`;
  const face = (d, c) => `<path d="${d}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`;
  const shape = (pts, c, w = 0.9, strokeCol = INK) =>
    fill(pd(pts), c) + (w ? ink(pd(pts), w, strokeCol) : '');
  const line = (pts, w = 0.9, col = INK) => ink(pd(pts, false), w, col);

  // Color-batched loft: groups all quads sharing the same flat shade color into a single <path>!
  function loft(A, B, colour, flip = false) {
    const n = A.length, cen = avg(A.concat(B));
    const byCol = {};
    for (let i = 0; i < n; i++) {
      const a0 = A[i], a1 = A[(i + 1) % n], b1 = B[(i + 1) % n], b0 = B[i];
      let nr = norm(cross(sub(a1, a0), sub(b0, a0)));
      if (!isFinite(nr[0])) continue;
      if (dot(nr, sub(avg([a0, a1, b1, b0]), cen)) < 0) nr = [-nr[0], -nr[1], -nr[2]];
      if (flip) nr = [-nr[0], -nr[1], -nr[2]];
      if (vis(nr)) {
        const c = colour(nr);
        byCol[c] = (byCol[c] || '') + pd([a0, a1, b1, b0]);
      }
    }
    let s = '';
    for (const c in byCol) s += face(byCol[c], c);
    return s;
  }

  function hull(pts) {
    if (pts.length < 3) return pts;
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (const p of pts.reverse()) {
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
      up.push(p);
    }
    lo.pop();
    up.pop();
    return lo.concat(up);
  }

  const hullInk = (pts3, w = 2.2, col = INK) => {
    const h = hull(pts3.map(p => P(p[0], p[1], p[2])));
    if (h.length < 3) return '';
    return ink(sp(h), w, col);
  };

  function box(x0, y0, z0, x1, y1, z1, m, shade = toneI, w = 0.9, strokeCol = INK) {
    const F = [
      [[0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]],
      [[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]]],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]]
    ];
    let s = '', dInk = '';
    for (let i = 0; i < 5; i++) {
      const n = F[i][0];
      if (vis(n)) {
        const d = pd(F[i][1]);
        s += fill(d, shade(n, m));
        if (w) dInk += d;
      }
    }
    return s + (dInk ? ink(dInk, w, strokeCol) : '');
  }

  function extrude(profileUV, x0, x1, m, shade = tone) {
    return loft(on(PX(x0), profileUV), on(PX(x1), profileUV), n => shade(n, m));
  }

  function cyl(x, y, z0, z1, r, m, shade = toneI, w = 1.4, n = 12, strokeCol = INK) {
    const A = on(PZ(z0), ellUV(x, y, r, r, n)), B = on(PZ(z1), ellUV(x, y, r, r, n));
    const dB = pd(B);
    return (
      loft(A, B, nr => shade(nr, m)) +
      fill(dB, shade([0, 0, 1], m)) +
      hullInk([...A, ...B], w, strokeCol) +
      ink(dB, w * 0.75, strokeCol)
    );
  }

  function rod(a, b, r, m, shade = toneI, w = 1.2, r1 = r, n = 8, strokeCol = INK) {
    const d = norm(sub(b, a));
    const u = norm(cross(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
    const v = cross(d, u);
    const ring = (p, rr) =>
      Array.from({ length: n }, (_, i) => {
        const t = (i / n) * 2 * Math.PI, c = Math.cos(t) * rr, s2 = Math.sin(t) * rr;
        return [p[0] + u[0] * c + v[0] * s2, p[1] + u[1] * c + v[1] * s2, p[2] + u[2] * c + v[2] * s2];
      });
    const A = ring(a, r), B = ring(b, r1), capB = vis(d), cap = capB ? B : A, cn = capB ? d : [-d[0], -d[1], -d[2]];
    const dCap = pd(cap);
    return (
      loft(A, B, nr => shade(nr, m)) +
      (Math.max(r, r1) > 0 ? fill(dCap, shade(cn, m)) + ink(dCap, w * 0.75, strokeCol) : '') +
      hullInk([...A, ...B], w, strokeCol)
    );
  }

  const txM = (o, U, V) => {
    const det = U[0] * V[1] - U[1] * V[0];
    if (Math.abs(det) <= 0.01 * Math.hypot(...U) * Math.hypot(...V)) {
      return `matrix(1 0 0 1 ${f(o[0])} ${f(o[1])})`;
    }
    return `matrix(${U[0].toFixed(3)} ${U[1].toFixed(3)} ${V[0].toFixed(3)} ${V[1].toFixed(3)} ${f(o[0])} ${f(o[1])})`;
  };

  const txStage = (x, y, z, str, size, col = '#ffffff', weight = 800, extra = '') => {
    const o = P(x, y, z);
    const U = Dv(0, 1, 0, [x, y, z]);
    const V = Dv(0, 0, -1, [x, y, z]);
    return `<text transform="${txM(o, U, V)}" font-size="${f(size)}" fill="${col}" text-anchor="middle" font-family="'Chakra Petch','Noto Sans TC',ui-monospace,monospace" font-weight="${weight}" letter-spacing=".04em" ${extra}>${str}</text>`;
  };

  const castShadow = (pts3, z0 = 0, op = 0.55) => {
    const k = SHADOW_LEN / SHADOW_K, [sx, sy] = yawTurn(SH);
    const h = hull(pts3.map(([x, y, z]) => P(x + (z - z0) * sx * k, y + (z - z0) * sy * k, z0)));
    if (h.length < 3) return '';
    return fill(sp(h), SHADOW, `opacity="${f(op)}"`);
  };

  const act = (name, inner, data = '') => `<g data-act="${name}" ${data} style="cursor:pointer">${inner}</g>`;

  function tag(p3, dx, dy, text, on = false, accentCol = '#00f0ff') {
    const [X, Y] = P(p3[0], p3[1], p3[2]);
    const fs = 10.0, h = 20, w = text.length * 8.6 + 20;
    const cx = Math.max(w / 2 + 12, Math.min(960 - w / 2 - 12, X + dx));
    const cy = Math.max(h / 2 + 12, Math.min(545 - h / 2 - 12, Y + dy));
    const bg = on ? accentCol : '#fff4d6';
    const fg = '#120e1a';
    return (
      `<g class="tag${on ? ' on' : ''}">` +
      `<path d="M${f(X)} ${f(Y)}L${f(cx)} ${f(cy)}" fill="none" stroke="${on ? accentCol : '#fff4d6'}" stroke-width="1.8"/>` +
      `<circle cx="${f(X)}" cy="${f(Y)}" r="2.8" fill="${on ? accentCol : '#fff4d6'}" stroke="#120e1a" stroke-width="1"/>` +
      `<rect x="${f(cx - w / 2 + 2.5)}" y="${f(cy - h / 2 + 2.5)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="#090710"/>` +
      `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="${bg}" stroke="#120e1a" stroke-width="1.6"/>` +
      `<text x="${f(cx)}" y="${f(cy + 3.8)}" font-size="${f(fs)}" text-anchor="middle" font-family="ui-monospace,Menlo,'Noto Sans TC',monospace" font-weight="800" fill="${fg}">${text}</text>` +
      `</g>`
    );
  }

  /* ============================================================
     1. 2033 台北 AI 園區 (原松山機場 870 公頃) 窗外天際線與磁浮機捷
     ============================================================ */
  function drawSkyline2033(st, pal) {
    const t = st.time;
    let s = '';
    const winProf = rrUV(14, 32, 266, 174, 8, 3);
    s += shape(on(PX(6), winProf), pal.bg === '#f2efe7' ? '#1c2948' : '#070914', 2.0);

    // Grid lines batched into 1 path
    let gridD = '';
    for (let z = 48; z <= 160; z += 22) {
      gridD += pd([[6.5, 20, z], [6.5, 260, z]], false);
    }
    s += ink(gridD, 0.7, mix(pal.neonA.m, '#0a0d1a', 0.6));

    // 110公頃台北中央公園 (4x Daan Forest Park) glowing bio-domes along Keelung River
    const riverPts = on(PX(7), [[18, 36], [262, 36], [262, 49], [18, 49]]);
    s += fill(pd(riverPts), pal.emerald.d, 'opacity="0.78"');
    for (const [cy, r] of [[65, 22], [115, 28], [175, 25], [220, 20]]) {
      const dome = on(PX(7.5), arcUV(cy, 45, r, 0, 180, 6));
      s += shape(dome, pal.emerald.m, 1.1, pal.emerald.l);
    }

    const towers = [
      { y0: 26, y1: 52, z1: 146, label: '北士科 NVIDIA', col: pal.emerald },
      { y0: 56, y1: 84, z1: 162, label: 'AI 12兆研發塔', col: pal.neonA },
      { y0: 92, y1: 132, z1: 92, label: 'TAIPEI DOME 大巨蛋', col: METAL, dome: true },
      { y0: 194, y1: 220, z1: 160, label: '松機 AI 總部 A1', col: pal.gold },
      { y0: 226, y1: 252, z1: 168, label: 'TAIPEI 101', col: pal.neonA, spire: true }
    ];
    for (const tw of towers) {
      if (tw.dome) {
        const dPts = on(PX(8), arcUV((tw.y0 + tw.y1) / 2, 45, (tw.y1 - tw.y0) / 2, 0, 180, 7));
        s += shape(dPts, tw.col.m, 1.4, INK);
        s += txStage(8.5, (tw.y0 + tw.y1) / 2, 60, '大巨蛋 DOME', 5.4, tw.col.l);
      } else {
        s += box(7, tw.y0, 45, 13, tw.y1, tw.z1, tw.col, toneI, 1.1);
        let winD = '';
        for (let wz = 58; wz < tw.z1 - 10; wz += 14) {
          winD += pd([[13.3, tw.y0 + 3, wz], [13.3, tw.y1 - 3, wz]], false);
        }
        s += ink(winD, 1.2, tw.col.l);
        if (tw.spire) {
          s += line([[10, (tw.y0 + tw.y1) / 2, tw.z1], [10, (tw.y0 + tw.y1) / 2, tw.z1 + 14]], 1.8, tw.col.l);
        }
        s += txStage(13.6, (tw.y0 + tw.y1) / 2, tw.z1 - 6, tw.label, 4.8, '#ffffff');
      }
    }

    // 台北 XY 軸磁浮機捷列車 (GD & 黃仁勳 坐機捷來台北只要 36 分鐘)
    const trainY = ((t * 48) % 300) - 30;
    s += line([[14, 18, 118], [14, 262, 118]], 2.2, pal.neonA.l);
    if (trainY > 15 && trainY < 235) {
      const ty0 = Math.max(18, trainY), ty1 = Math.min(260, trainY + 46);
      if (ty1 - ty0 > 12) {
        s += box(12, ty0, 119, 16, ty1, 127, pal.gold, toneI, 1.3);
        s += txStage(16.5, (ty0 + ty1) / 2, 121.5, 'XY軸機捷 36MIN ➔ GD & 黃仁勳', 4.6, '#120e1a', 900);
      }
    }
    return s;
  }

  /* ============================================================
     2. 來生夜店 (AFTERLIFE TAIPEI) 舞台結構、巨型音箱塔、吧台與負壓吸菸艙
     ============================================================ */
  function drawAfterlifeClub(st, pal) {
    const t = st.time, beat = st.beatPulse;
    const k = ease(st.xr || 0);
    const ghostOp = k > 0 ? (1 - 0.72 * k).toFixed(2) : '1';
    let s = '';

    // Club main floor & batched grid lines
    const floorPts = on(PZ(0), rectUV(10, 2, 240, 278));
    s += fill(pd(floorPts), pal.bg === '#f2efe7' ? '#dfd9cc' : '#101223', `opacity="${ghostOp}"`);
    let fGrid = '';
    for (let x = 30; x <= 230; x += 32) fGrid += pd([[x, 8, 0.2], [x, 272, 0.2]], false);
    for (let y = 20; y <= 260; y += 32) fGrid += pd([[14, y, 0.2], [236, y, 0.2]], false);
    s += ink(fGrid, 0.6, mix(pal.neonA.d, pal.stage.d, 0.5)) + ink(pd(floorPts), 2.2);

    // ---- Left Wing (viewer left, low y): 生生喝鮮乳 Cyber Bar ----
    let leftWing = '';
    leftWing += box(48, 8, 0, 112, 34, 24, pal.stage, toneI, 1.4);
    leftWing += box(46, 8, 24, 114, 36, 28, pal.neonA, toneI, 1.4);
    for (const bx of [62, 82, 100]) {
      leftWing += cyl(bx, 22, 28, 39, 3.2, CERAMIC, toneI, 1.1, 8);
      leftWing += cyl(bx, 22, 39, 42, 1.8, pal.neonA, toneI, 1.0, 6);
    }
    leftWing += box(50, 6, 52, 110, 14, 70, pal.neonB, toneI, 1.5);
    leftWing += txStage(115, 22, 14, '生生鮮奶吧', 5.8, pal.neonA.l);

    // ---- Right Wing (viewer right, high y): 無菸城市・負壓吸菸艙 ----
    let rightWing = '';
    rightWing += box(48, 246, 0, 112, 272, 68, METAL, toneI, 1.5);
    rightWing += box(46, 244, 64, 114, 274, 74, pal.emerald, toneI, 1.5);
    const podGlass = on(PY(245.5), rectUV(54, 8, 106, 60));
    rightWing += fill(pd(podGlass), '#76ff03', 'opacity="0.22"') + ink(pd(podGlass), 1.2);
    rightWing += txStage(113, 258, 54, '負壓吸菸艙', 5.8, pal.emerald.l);
    rightWing += txStage(113, 258, 42, '無菸城市 0鼠害', 4.6, '#ffffff');

    // ---- Left & Right Giant Subwoofer Speaker Stacks ----
    const spkScale = 1 + beat * 0.08;
    for (const [sy0, sy1, yc] of [[36, 66, 51], [214, 244, 229]]) {
      let spk = box(54, sy0, 0, 86, sy1, 96, DARK, toneI, 1.8);
      spk += hullInk([[54, sy0, 0], [86, sy0, 0], [86, sy1, 0], [54, sy1, 96], [86, sy1, 96]], 2.6);
      for (const sz of [22, 52, 80]) {
        const cr = (sz === 22 ? 11 : 9) * spkScale;
        const ring1 = on(PX(86.6), ellUV(yc, sz, cr, cr, 12));
        const ring2 = on(PX(86.9), ellUV(yc, sz, cr * 0.48, cr * 0.48, 10));
        spk += shape(ring1, pal.neonA.m, 1.4) + shape(ring2, pal.gold.l, 1.2);
      }
      for (let i = 0; i < 4; i++) {
        const bh = 6 + 16 * Math.abs(Math.sin(t * 9 + i * 1.4 + sy0));
        spk += box(64, sy0 + 5 + i * 6, 96, 76, sy0 + 9 + i * 6, 96 + bh, i % 2 ? pal.neonB : pal.neonA, toneI, 0.9);
      }
      s += act('speaker', spk);
    }

    // ---- Central Stage Arch & Afterlife Neon Sign ----
    let arch = '';
    arch += box(58, 68, 0, 76, 82, 152, pal.arch, tone, 1.8);
    arch += box(58, 198, 0, 76, 212, 152, pal.arch, tone, 1.8);
    arch += box(56, 62, 144, 82, 218, 172, pal.arch, tone, 2.2);
    let hazD = '';
    for (let hy = 72; hy < 206; hy += 18) {
      hazD += pd(on(PX(82.4), [[hy, 145], [hy + 8, 145], [hy + 12, 152], [hy + 4, 152]]));
    }
    arch += fill(hazD, pal.gold.l) + ink(hazD, 0.8);
    arch += box(82, 72, 151, 88, 208, 170, DARK, toneI, 1.8);
    arch += txStage(88.8, 140, 158, 'AFTERLIFE // 來生・台北 2033', 8.2, pal.neonB.l, 900);
    arch += txStage(88.8, 140, 145.5, 'TAIPEI AI PARK 870HA ・ 台北安可 NIGHTCLUB', 4.6, pal.neonA.l, 800);

    // DJ Booth & R-chord Cyber Console at back of stage
    let dj = '';
    dj += box(50, 112, 26, 68, 168, 48, pal.arch, toneI, 1.5);
    dj += box(67, 116, 30, 70, 164, 44, pal.neonA, toneI, 1.2);
    dj += txStage(70.5, 140, 35, '♫ 台北安可 TAIPEI ENCORE ♫', 5.0, '#120e1a', 900);
    dj += cyl(59, 128, 48, 50.5, 6, METAL, toneI, 1.0, 10);
    dj += cyl(59, 152, 48, 50.5, 6, METAL, toneI, 1.0, 10);

    // ---- Central Stage Circular Turntable Platform ----
    let stageDeck = '';
    const stOuterR = 54, stInnerR = 35;
    const baseA = on(PZ(0), ellUV(92, 140, stOuterR, stOuterR * 0.78, 18));
    const baseB = on(PZ(26), ellUV(92, 140, stOuterR, stOuterR * 0.78, 18));
    stageDeck += loft(baseA, baseB, nr => tone(nr, pal.stage));
    stageDeck += fill(pd(baseB), pal.stage.l) + hullInk([...baseA, ...baseB], 2.6);
    const ringOuter = on(PZ(26.3), ellUV(92, 140, stOuterR - 3, (stOuterR - 3) * 0.78, 18));
    const ringMid = on(PZ(26.5), ellUV(92, 140, stInnerR, stInnerR * 0.78, 16));
    stageDeck += ink(pd(ringOuter), 2.8, pal.neonA.l);
    stageDeck += shape(ringMid, mix(pal.stage.m, pal.neonB.d, 0.4 + 0.3 * beat), 2.2, pal.neonB.l);

    // Stage CO2 / 生生鮮奶冷霧噴射柱
    let cryo = '';
    if (st.cryo > 0.05 || beat > 0.68) {
      const ch = 48 * Math.max(st.cryo, beat * 0.65);
      for (const cy of [94, 186]) {
        const cPts = [[92, cy - 3, 26], [92, cy + 3, 26], [92, cy + 11, 26 + ch], [92, cy - 11, 26 + ch]];
        cryo += fill(pd(cPts), '#ffffff', 'opacity="0.55"') + ink(pd(cPts), 1.2, pal.neonA.l);
      }
    }

    s += `<g opacity="${ghostOp}">${leftWing}${rightWing}${arch}${dj}${stageDeck}</g>${cryo}`;

    if (k > 0.02) {
      s += `<g opacity="${f(k)}">${drawUndergroundMech(st, pal)}</g>`;
    }

    // Volumetric Stage Laser Beams & Spotlight Cones
    const beamOp = (0.15 + 0.14 * beat).toFixed(2);
    for (let i = 0; i < 4; i++) {
      const ly = 84 + i * 37;
      const sway = Math.sin(t * 2.6 + i * 1.7) * 26;
      const col = i % 2 === 0 ? pal.neonA.l : pal.neonB.l;
      const cone = [[74, ly, 144], [96, 140 + sway - 14, 26], [96, 140 + sway + 14, 26]];
      s += fill(pd(cone), col, `opacity="${beamOp}"`);
      s += line([[74, ly, 144], [96, 140 + sway, 26]], 1.4, col);
    }

    return s;
  }

  /* ============================================================
     3. Colorfigures 招牌透視解剖結構 (See-through Underground Stage Mechanism)
     ============================================================ */
  function drawUndergroundMech(st, pal) {
    const spin = st.mjSpinAngle;
    let m = '';
    m += cyl(92, 140, 2, 10, 18, METAL, toneI, 1.6, 12);
    m += cyl(92, 140, 10, 25, 5.5, pal.gold, toneI, 1.4, 10);
    let gearD = '';
    for (let i = 0; i < 8; i++) {
      const a = spin + (i * Math.PI) / 4;
      gearD += pd(
        [[92 + 16 * Math.cos(a), 140 + 16 * Math.sin(a), 10.5], [92 + 7 * Math.cos(a), 140 + 7 * Math.sin(a), 10.5]],
        false
      );
    }
    m += ink(gearD, 1.6, INK);
    m += box(62, 102, 2, 80, 124, 22, pal.emerald, toneI, 1.4);
    m += cyl(92, 98, 2, 22, 8, CERAMIC, toneI, 1.4, 10);
    m += cyl(92, 178, 2, 16, 6, pal.neonB, toneI, 1.4, 10);
    m += cyl(92, 178, 16, 25, 3.5, METAL, toneI, 1.2, 8);
    const spPts = [];
    for (let i = 0; i <= 10; i++) {
      spPts.push([114 + (i % 2 ? -4 : 4), 140 + (i % 2 ? 4 : -4), 2 + i * 2.1]);
    }
    m += line(spPts, 2.2, pal.neonA.l);
    m += rod([80, 114, 6], [92, 134, 6], 1.8, pal.emerald, toneI, 1.0);
    m += rod([92, 106, 8], [92, 134, 8], 1.8, CERAMIC, toneI, 1.0);
    return m;
  }

  /* ============================================================
     4. 蔣萬安 3D 模型 ＋ 麥可傑克森 (Michael Jackson) 旋轉舞步與反重力前傾
     ============================================================ */
  function drawChiangWanAn(st, pal) {
    const cx = 92;
    const cy = 140 + st.mjSlideY;
    const cz = 26.5;
    const spin = st.mjSpinAngle;
    const lean = st.mjLeanAngle;
    const sc = 1.22;

    const M = (lx, ly, lz) => {
      const sx = lx * sc, sy = ly * sc, sz = lz * sc;
      const lx1 = sx * Math.cos(lean) + sz * Math.sin(lean);
      const lz1 = -sx * Math.sin(lean) + sz * Math.cos(lean);
      const c = Math.cos(spin), s = Math.sin(spin);
      return [cx + lx1 * c - sy * s, cy + lx1 * s + sy * c, cz + lz1];
    };

    let s = '';
    s += castShadow([M(0, -10, 2), M(0, 10, 2), M(0, -12, 48), M(0, 12, 48)], cz, 0.65);

    if (st.mjSpinSpeed > 3.0) {
      for (const [rz, rr, col] of [[36, 21, pal.neonA.l], [52, 25, pal.gold.l], [68, 22, pal.neonB.l]]) {
        const arc = [];
        for (let i = 0; i <= 8; i++) {
          const a = spin * 1.4 + (i * Math.PI) / 5;
          arc.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a), cz + rz]);
        }
        s += line(arc, 2.4, col);
      }
    }

    // Legs: Loafers + White Socks + Navy Suit Trousers
    const stepSwing = Math.sin(st.time * 10) * (st.mjMode === 'moonwalk' ? 5.5 : 2.0);
    s += rod(M(-2 + stepSwing, -4.5, 0.5), M(4 + stepSwing, -4.5, 2.2), 2.8, DARK, toneI, 1.6);
    s += rod(M(2 - stepSwing, 4.5, 0.5), M(-3 - stepSwing, 4.5, 2.2), 2.8, DARK, toneI, 1.6);
    s += rod(M(stepSwing * 0.7, -4.5, 2.2), M(stepSwing * 0.4, -4.5, 8.0), 2.3, CERAMIC, toneI, 1.4);
    s += rod(M(-stepSwing * 0.7, 4.5, 2.2), M(-stepSwing * 0.4, 4.5, 8.0), 2.3, CERAMIC, toneI, 1.4);
    s += rod(M(stepSwing * 0.4, -4.5, 8.0), M(0, -4.2, 24), 3.4, SUIT_NAVY, toneI, 1.7);
    s += rod(M(-stepSwing * 0.4, 4.5, 8.0), M(0, 4.2, 24), 3.4, SUIT_NAVY, toneI, 1.7);

    // Torso: Tailored Navy Suit + White Shirt + Sky-Blue Tie + Gold「台北安可」Pin
    const torsoPtsA = [M(-4.5, -8.5, 23), M(4.5, -8.5, 23), M(4.5, 8.5, 23), M(-4.5, 8.5, 23)];
    const torsoPtsB = [M(-5.2, -10.2, 44), M(5.2, -10.2, 44), M(5.2, 10.2, 44), M(-5.2, 10.2, 44)];
    s += loft(torsoPtsA, torsoPtsB, nr => tone(nr, SUIT_NAVY));
    s += fill(pd(torsoPtsB), SUIT_NAVY.l) + hullInk([...torsoPtsA, ...torsoPtsB], 2.6);

    const frontDir = [Math.cos(spin), Math.sin(spin), 0];
    if (camDot(frontDir, CAM_V) > -0.15) {
      const shirtV = [M(5.4, -4.2, 43.5), M(5.4, 4.2, 43.5), M(5.1, 0, 29)];
      s += shape(shirtV, '#ffffff', 1.2);
      const tiePts = [M(5.6, -1.2, 42), M(5.6, 1.2, 42), M(5.5, 1.6, 28), M(5.5, 0, 25.5), M(5.5, -1.6, 28)];
      s += shape(tiePts, TIE_BLUE.l, 1.1);
      const pinPt = P(...M(5.6, -5.8, 39));
      s += `<circle cx="${f(pinPt[0])}" cy="${f(pinPt[1])}" r="3.8" fill="#ffd026" stroke="#120e1a" stroke-width="1.4"/>`;
    }

    // Arms + MJ Silver Sequined Glove
    const armRaise = 0.5 + 0.5 * Math.sin(st.time * 5.5);
    const lShoulder = M(0, -10.2, 42);
    const lElbow = M(4, -15.5, 35);
    const lHand = M(5.5, -8.5, 27);
    s += rod(lShoulder, lElbow, 2.8, SUIT_NAVY, toneI, 1.6);
    s += rod(lElbow, lHand, 2.5, SUIT_NAVY, toneI, 1.6);
    s += rod(lHand, M(6.2, -7.2, 26.5), 2.3, SKIN, toneI, 1.3);

    const rShoulder = M(0, 10.2, 42);
    const rElbow = M(3.5, 15.5, 49 + armRaise * 4);
    const rHand = M(4.5, 13.5, 61 + armRaise * 6);
    s += rod(rShoulder, rElbow, 2.8, SUIT_NAVY, toneI, 1.6);
    s += rod(rElbow, rHand, 2.5, SUIT_NAVY, toneI, 1.6);
    const glovePt = P(...rHand);
    s += `<circle cx="${f(glovePt[0])}" cy="${f(glovePt[1])}" r="6.2" fill="#ffffff" stroke="${pal.neonA.l}" stroke-width="2.5"/>`;
    s += `<circle cx="${f(glovePt[0])}" cy="${f(glovePt[1])}" r="3.0" fill="${pal.neonA.l}"/>`;

    // Head & Face + MJ Fedora
    const headTop = M(0, 0, 56.5);
    s += rod(M(0, 0, 43.5), headTop, 6.2, SKIN, toneI, 2.1, 6.6, 10);
    s += rod(M(-0.8, 0, 52.5), M(0.4, 0, 58.5), 6.9, HAIR, toneI, 2.1, 6.0, 10);

    if (camDot(frontDir, CAM_V) > 0.05) {
      const eyeL = P(...M(6.3, -2.4, 51.5));
      const eyeR = P(...M(6.3, 2.4, 51.5));
      s += line([M(6.4, -4.0, 53.2), M(6.4, -1.1, 53.6)], 2.0, INK);
      s += line([M(6.4, 1.1, 53.6), M(6.4, 4.0, 53.2)], 2.0, INK);
      s += `<circle cx="${f(eyeL[0])}" cy="${f(eyeL[1])}" r="1.8" fill="${INK}"/>`;
      s += `<circle cx="${f(eyeR[0])}" cy="${f(eyeR[1])}" r="1.8" fill="${INK}"/>`;
      s += line([M(6.3, -2.2, 48.2), M(6.5, 0, 47.4), M(6.3, 2.2, 48.2)], 1.8, INK);
    }

    if (st.hatOn) {
      const brim = on(PZ(0), ellUV(0, 0, 11.0, 10.0, 12)).map(([u, v]) => M(u + 0.5, v, 57.2));
      const crown = on(PZ(0), ellUV(0, 0, 6.5, 6.0, 10)).map(([u, v]) => M(u, v, 61.8));
      s += shape(brim, CERAMIC.l, 1.9) + shape(crown, CERAMIC.m, 1.7);
      s += line(on(PZ(0), ellUV(0, 0, 6.7, 6.2, 10)).map(([u, v]) => M(u, v, 58.2)), 2.2, pal.neonB.l);
    }

    return act('wanan', s);
  }

  /* ============================================================
     5. 蔣萬安的 3D 立體對話泡泡 ＋ 從畫面外飛進來的 3D 立體政見字
     ============================================================ */
  function drawStage3DSpeechAndFlyingText(st, pal) {
    const pol = window.TAIPEI_2033_DATA.stagePolicies[st.policyIdx % window.TAIPEI_2033_DATA.stagePolicies.length];
    const age = st.policyAge;
    const rawT = Math.min(1, age / 0.65);
    const flyEase = 1 - Math.pow(1 - rawT, 3);

    let s = '';

    // ---- Part A: 蔣萬安的 3D 立體對話泡泡 (Upper-Left of Stage) ----
    const head3D = [92, 134 + st.mjSlideY * 0.5, 88];
    const [hx, hy] = P(...head3D);
    const anchor3D = [96, 52, 114 + Math.sin(st.time * 3.2) * 2.0];
    const [ax, ay] = P(...anchor3D);
    const bX = Math.max(156, Math.min(235, ax));
    const bY = Math.max(112, Math.min(168, ay));
    const bW = 282, bH = 86, depth3D = 9;

    const txt = pol.speechBubble;
    const l1 = txt.slice(0, 21), l2 = txt.slice(21, 42), l3 = txt.slice(42, 66);

    s += `<g class="wanan-3d-bubble" data-act="policy3d" style="cursor:pointer">`;
    s += `<polygon points="${f(bX - bW / 2)},${f(bY - bH / 2)} ${f(bX - bW / 2 - depth3D)},${f(bY - bH / 2 - depth3D)} ${f(bX + bW / 2 - depth3D)},${f(bY - bH / 2 - depth3D)} ${f(bX + bW / 2)},${f(bY - bH / 2)}" fill="#e6dec3" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<polygon points="${f(bX - bW / 2)},${f(bY - bH / 2)} ${f(bX - bW / 2 - depth3D)},${f(bY - bH / 2 - depth3D)} ${f(bX - bW / 2 - depth3D)},${f(bY + bH / 2 - depth3D)} ${f(bX - bW / 2)},${f(bY + bH / 2)}" fill="#bfb493" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<polygon points="${f(bX + 55)},${f(bY + bH / 2 - 4)} ${f(bX + 46)},${f(bY + bH / 2 - 12)} ${f(hx)},${f(hy)}" fill="#bfb493" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<polygon points="${f(bX + 32)},${f(bY + bH / 2 - 2)} ${f(bX + 64)},${f(bY + bH / 2 - 2)} ${f(hx)},${f(hy)}" fill="#fffdf7" stroke="${pol.accent}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<rect x="${f(bX - bW / 2)}" y="${f(bY - bH / 2)}" width="${bW}" height="${bH}" rx="10" fill="#fffdf7" stroke="${pol.accent}" stroke-width="3"/>`;
    s += `<rect x="${f(bX - bW / 2 + 5)}" y="${f(bY - bH / 2 + 5)}" width="${bW - 10}" height="22" rx="6" fill="${pol.accent}" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<text x="${f(bX)}" y="${f(bY - bH / 2 + 20)}" font-size="11" font-weight="900" text-anchor="middle" fill="#120e1a" font-family="'Noto Sans TC',ui-monospace,sans-serif">🎙️ 蔣萬安 3D 政見泡泡｜${pol.category}</text>`;
    s += `<text x="${f(bX)}" y="${f(bY - 2)}" font-size="11.5" font-weight="800" text-anchor="middle" fill="#120e1a" font-family="'Noto Sans TC',sans-serif">${l1}</text>`;
    s += `<text x="${f(bX)}" y="${f(bY + 15)}" font-size="11.5" font-weight="800" text-anchor="middle" fill="#120e1a" font-family="'Noto Sans TC',sans-serif">${l2}</text>`;
    if (l3) {
      s += `<text x="${f(bX)}" y="${f(bY + 32)}" font-size="11.5" font-weight="900" text-anchor="middle" fill="#c9184a" font-family="'Noto Sans TC',sans-serif">${l3}</text>`;
    }
    s += `</g>`;

    // ---- Part B: 從畫面外飛進來的 3D 立體政見字 ----
    const dirMode = st.policyIdx % 3;
    const startX = dirMode === 2 ? 280 : 135;
    const startY = dirMode === 0 ? 350 : dirMode === 1 ? -70 : 175;
    const startZ = dirMode === 2 ? 165 : 135;

    const chars = Array.from(pol.flyText3D).slice(0, 13);
    const nChars = chars.length;
    for (let i = 0; i < nChars; i++) {
      const charDelay = i * 0.025;
      const ct = Math.max(0, Math.min(1, (age - charDelay) / 0.58));
      const ce = 1 - Math.pow(1 - ct, 3);
      const charTargetY = 114 + (i / Math.max(1, nChars - 1)) * 108;
      const charTargetZ = 120 + Math.sin((i / Math.max(1, nChars - 1)) * Math.PI) * 10 + Math.sin(st.time * 4 + i * 0.6) * 1.4;
      const charTargetX = 104;

      const cx3 = startX + (charTargetX - startX) * ce;
      const cy3 = startY + (charTargetY - startY) * ce;
      const cz3 = startZ + 18 * (1 - ce) + (charTargetZ - startZ) * ce;

      const cw = 3.8, ch = 4.9, cd = 4.8;
      const blockMat = i % 2 === 0 ? matOf(pol.accent) : pal.gold;
      s += box(cx3 - cd, cy3 - cw, cz3 - ch, cx3, cy3 + cw, cz3 + ch, blockMat, toneI, 1.5, INK);
      s += txStage(cx3 + 0.5, cy3, cz3 - 1.9, chars[i], 5.8, '#120e1a', 900);
    }

    // 3D Extruded Slogan Plinth under the flying 3D character blocks
    const targetX = 104, targetY = 168, targetZ = 103 + Math.sin(st.time * 3.8) * 1.5;
    const curX = startX + (targetX - startX) * flyEase;
    const curY = startY + (targetY - startY) * flyEase;
    const curZ = startZ + (targetZ - startZ) * flyEase;

    if (rawT < 0.96) {
      for (const dz of [-6, 0, 6]) {
        s += line([[startX, startY, startZ + dz], [curX, curY, curZ + dz]], 2.2, pol.accent);
      }
    }

    const banProfile = rrUV(curY - 58, curZ - 6, curY + 58, curZ + 6, 3, 3);
    const banMat = matOf(pol.accent);
    s += extrude(banProfile, curX - 5, curX + 1, banMat, toneI);
    s += shape(on(PX(curX + 1), banProfile), '#120e1a', 2.2, pol.accent);
    s += txStage(curX - 0.8, curY, curZ - 2.2, pol.subText3D, 5.8, pol.accent, 900);
    s += txStage(curX + 1.4, curY, curZ - 2.2, pol.subText3D, 5.8, '#ffffff', 900);

    return act('policy3d', s);
  }

  /* ============================================================
     6. 底下萬頭鑽動群眾 (Fast 3D Silhouette Batching for Safari 60FPS + Full-Width Mosh Pit)
     ============================================================ */
  const CROWD_MEMBERS = [];
  const CROWD_LEFT = [], CROWD_MID = [], CROWD_RIGHT = [];
  (function initCrowd() {
    // Wide rows spanning y = -10..290 so when zoomed in, the crowd fills the ENTIRE foreground edge-to-edge!
    const rows = [
      { x: 132, count: 12, yMin: 24, yMax: 256, scale: 0.84 },
      { x: 152, count: 13, yMin: 10, yMax: 270, scale: 0.94 },
      { x: 172, count: 14, yMin: -6, yMax: 286, scale: 1.05 },
      { x: 194, count: 14, yMin: -18, yMax: 298, scale: 1.18 }
    ];
    let id = 0;
    for (const r of rows) {
      for (let i = 0; i < r.count; i++) {
        const frac = (i + 0.5) / r.count;
        const y = r.yMin + frac * (r.yMax - r.yMin) + ((id * 17) % 7) - 3;
        const x = r.x + ((id * 13) % 7) - 3;
        const member = {
          id: id++,
          x,
          y,
          scale: r.scale,
          phase: id * 0.77,
          hairStyle: id % 4,
          stickColor: id % 3 === 0 ? '#00f0ff' : id % 3 === 1 ? '#ff2a85' : '#ffd026',
          dualSticks: id % 2 === 0
        };
        CROWD_MEMBERS.push(member);
        if (y < 95) CROWD_LEFT.push(member);
        else if (y > 185) CROWD_RIGHT.push(member);
        else CROWD_MID.push(member);
      }
    }
  })();

  function drawCrowdAndCheers(st, pal) {
    const t = st.time, beat = st.beatPulse;
    // Sort crowd back-to-front along CAM_V
    const sorted = CROWD_MEMBERS.slice().sort((a, b) => depthOf([a.x, a.y, 15]) - depthOf([b.x, b.y, 15]));
    let s = '<g data-act="crowd" style="cursor:pointer">';

    for (let idx = 0; idx < sorted.length; idx++) {
      const p = sorted[idx];
      const jump = Math.abs(Math.sin(t * 7.5 + p.phase)) * (3.2 + beat * 4.2);
      const sway = Math.sin(t * 4.2 + p.phase) * 2.0;
      const px = p.x, py = p.y + sway, pz = jump;
      const sc = p.scale;

      const bodyFill = p.id % 2 === 0 ? '#24212e' : '#1b1726';
      const collarCol = p.stickColor;
      const tw = 6.2 * sc, th = 18.5 * sc;

      // Fast 3D-projected silhouette torso + shoulders + head (only 4 SVG elements per crowd member instead of 35!)
      const b0 = P(px, py - tw, pz), b1 = P(px, py + tw, pz);
      const b2 = P(px, py + tw * 0.92, pz + th), b3 = P(px, py - tw * 0.92, pz + th);
      const tTop0 = P(px - 4 * sc, py - tw * 0.82, pz + th + 1.5 * sc);
      const tTop1 = P(px - 4 * sc, py + tw * 0.82, pz + th + 1.5 * sc);

      // 1. Torso back & shoulder top bevel (Colorfigures 3-band look)
      s += `<path d="${sp([b0, b1, b2, b3])}" fill="${bodyFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
      s += `<path d="${sp([b3, b2, tTop1, tTop0])}" fill="#3c3554" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
      // Cyber Jacket Neon Collar & Spine
      s += `<path d="M${f(b3[0] + 2)} ${f(b3[1] + 2)}L${f(b2[0] - 2)} ${f(b2[1] + 2)}M${f((b2[0] + b3[0]) / 2)} ${f(b2[1] + 2)}L${f((b0[0] + b1[0]) / 2)} ${f(b2[1] + (b0[1] - b2[1]) * 0.55)}" fill="none" stroke="${collarCol}" stroke-width="2.2" stroke-linecap="round"/>`;

      // 2. Screaming raised arms & glowing lightsticks
      const waveA = Math.sin(t * 9 + p.phase) * 4.5;
      const rSh = P(px, py + tw * 0.8, pz + th - 2);
      const rHd = P(px - 2, py + tw + 3.0 * sc, pz + th + 12 * sc + waveA * 0.5);
      const rSt = P(px - 3, py + tw + (3.0 + waveA * 0.35) * sc, pz + th + 22 * sc);
      let armD = `M${f(rSh[0])} ${f(rSh[1])}L${f(rHd[0])} ${f(rHd[1])}`;
      let stickD = `M${f(rHd[0])} ${f(rHd[1])}L${f(rSt[0])} ${f(rSt[1])}`;

      if (p.dualSticks) {
        const lSh = P(px, py - tw * 0.8, pz + th - 2);
        const lHd = P(px - 2, py - tw - 3.0 * sc, pz + th + 11 * sc - waveA * 0.5);
        const lSt = P(px - 3, py - tw - (3.0 + waveA * 0.35) * sc, pz + th + 21 * sc);
        armD += `M${f(lSh[0])} ${f(lSh[1])}L${f(lHd[0])} ${f(lHd[1])}`;
        stickD += `M${f(lHd[0])} ${f(lHd[1])}L${f(lSt[0])} ${f(lSt[1])}`;
      }
      s += `<path d="${armD}" fill="none" stroke="${INK}" stroke-width="${f(4.5 * sc)}" stroke-linecap="round"/>`;
      s += `<path d="${stickD}" fill="none" stroke="${collarCol}" stroke-width="${f(3.6 * sc)}" stroke-linecap="round"/>`;

      // 3. 3D Head silhouette + Cyber Mohawk / Hair rim
      const hc = P(px, py, pz + th + 4.8 * sc);
      const hrPx = Math.max(6, 10.5 * sc);
      s += `<circle cx="${f(hc[0])}" cy="${f(hc[1])}" r="${f(hrPx)}" fill="#181520" stroke="${INK}" stroke-width="2.2"/>`;
      if (p.hairStyle === 0) {
        s += `<rect x="${f(hc[0] - 2.5 * sc)}" y="${f(hc[1] - hrPx - 5 * sc)}" width="${f(5 * sc)}" height="${f(7 * sc)}" rx="2" fill="${collarCol}" stroke="${INK}" stroke-width="1.3"/>`;
      } else if (p.hairStyle === 2) {
        s += `<path d="M${f(hc[0] - hrPx * 0.8)} ${f(hc[1] - 2)}L${f(hc[0] + hrPx * 0.8)} ${f(hc[1] - 2)}" stroke="${pal.gold.l}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
    }
    s += '</g>';

    // ---- 3 Non-Overlapping Crowd Gratitude Speech Bubbles (Left / Center / Right) ----
    const cheers = window.TAIPEI_2033_DATA.crowdCheers;
    const slots = [
      { member: CROWD_LEFT[st.cheerBaseIdx % CROWD_LEFT.length], bx: 175, by: 506 },
      { member: CROWD_MID[(st.cheerBaseIdx + 3) % CROWD_MID.length], bx: 480, by: 516 },
      { member: CROWD_RIGHT[(st.cheerBaseIdx + 6) % CROWD_RIGHT.length], bx: 785, by: 506 }
    ];

    slots.forEach((slot, idx) => {
      const m = slot.member || CROWD_MEMBERS[idx * 12];
      const cheer = cheers[(st.cheerBaseIdx + idx * 5) % cheers.length];
      const head3D = [m.x, m.y, 26 * m.scale];
      const [hx, hy] = P(...head3D);
      const bx = slot.bx;
      const by = slot.by;
      const bw = 278, bh = 56;
      const borderCol = idx === 0 ? pal.neonA.l : idx === 1 ? pal.gold.l : pal.neonB.l;

      const line1 = cheer.text.slice(0, 23);
      const line2 = cheer.text.slice(23, 47);

      s += `<g class="crowd-bubble" data-act="crowd" style="cursor:pointer">`;
      const tx0 = Math.max(bx - bw / 2 + 24, Math.min(bx + bw / 2 - 24, hx));
      const clampHy = Math.max(360, Math.min(by - bh / 2, hy));
      s += `<path d="M${f(tx0 - 9)} ${f(by - bh / 2 + 4)} L${f(hx)} ${f(clampHy)} L${f(tx0 + 9)} ${f(by - bh / 2 + 4)} Z" fill="#141629" stroke="${borderCol}" stroke-width="1.8"/>`;
      s += `<rect x="${f(bx - bw / 2 + 4)}" y="${f(by - bh / 2 + 4)}" width="${bw}" height="${bh}" rx="10" fill="#090710"/>`;
      s += `<rect x="${f(bx - bw / 2)}" y="${f(by - bh / 2)}" width="${bw}" height="${bh}" rx="10" fill="#141629" stroke="${borderCol}" stroke-width="2.2"/>`;
      s += `<text x="${f(bx)}" y="${f(by - 10)}" font-size="9.3" font-weight="900" text-anchor="middle" fill="${borderCol}" font-family="'Noto Sans TC',ui-monospace,sans-serif">🙌 ${cheer.who}｜❤️ ${cheer.policy}</text>`;
      s += `<text x="${f(bx)}" y="${f(by + 5)}" font-size="10.0" font-weight="700" text-anchor="middle" fill="#ffffff" font-family="'Noto Sans TC',sans-serif">${line1}</text>`;
      if (line2) {
        s += `<text x="${f(bx)}" y="${f(by + 20)}" font-size="10.0" font-weight="700" text-anchor="middle" fill="#ffd026" font-family="'Noto Sans TC',sans-serif">${line2}</text>`;
      }
      s += `</g>`;
    });

    return s;
  }

  /* ============================================================
     7. Colorfigures 工程構造標籤 (Surface & See-Through Callout Tags)
     ============================================================ */
  function drawLabels(st, pal) {
    if (!st.labelsOn) return '';
    const k = ease(st.xr || 0);
    let s = '';
    if (k > 0.5) {
      s += tag([92, 140, 12], -165, -8, 'MJ 360° 磁浮旋轉軸承馬達', true, pal.gold.l);
      s += tag([70, 112, 12], -175, -45, '北士科×松機 NVIDIA 12兆運算核心', true, pal.emerald.l);
      s += tag([92, 98, 14], -170, 28, '生生喝鮮乳 低溫氮氣冷卻泵', st.cryo > 0, pal.neonA.l);
      s += tag([92, 178, 14], 165, -18, '公辦都更 75%➔50% 液壓升降缸', true, pal.neonB.l);
      s += tag([114, 140, 12], 168, 18, '台北 XY軸捷運 共構減震彈簧', true, pal.neonA.l);
    } else {
      s += tag([92, 140 + st.mjSlideY, 64], 150, 12, '蔣萬安・MJ 360° 旋轉舞步', true, pal.gold.l);
      s += tag([80, 22, 36], -75, -16, '生生鮮奶吧 (鮮奶週報免費領)', false, pal.neonA.l);
      s += tag([80, 256, 52], 65, -16, '無菸城市・負壓吸菸艙', false, pal.emerald.l);
    }
    return s;
  }

  /* ============================================================
     8. Master Scene Composer & Animation Loop
     ============================================================ */
  function renderScene(st) {
    const pal = PALS[st.pal] || PALS.afterlife;
    INK = pal.paperInk;
    SHADOW = pal.shadow;
    document.body.style.setProperty('--club-bg', pal.bg);

    const sky = drawSkyline2033(st, pal);
    const club = drawAfterlifeClub(st, pal);
    const wanan = drawChiangWanAn(st, pal);
    const crowd = drawCrowdAndCheers(st, pal);
    const speechAndFly = drawStage3DSpeechAndFlyingText(st, pal);
    const labels = drawLabels(st, pal);

    if (CAM_V[0] >= -0.15) {
      return sky + club + wanan + speechAndFly + crowd + labels;
    } else {
      return crowd + club + wanan + sky + speechAndFly + labels;
    }
  }

  window.AfterlifeEngine = {
    PALS,
    setCam,
    getCam: () => ({ yaw: YAW, pitch: PITCH, persp: PERSP, camK: CAM_K }),
    setPersp: p => { PERSP = p; },
    renderScene
  };
})();
