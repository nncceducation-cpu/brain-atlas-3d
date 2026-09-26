/* ============================================================
   BG — procedural neuroanatomy geometry engine
   Coordinate frame (mm, origin ~ mid-commissural point):
     +x = right    +y = superior    +z = anterior
   ============================================================ */
var BG = (function () {
  'use strict';
  var T = THREE;

  /* ---------- half-extents of the cerebrum ---------- */
  var A = 66, B = 54, C = 84, GAP = 1.9;

  /* ---------- cheap deterministic value noise ---------- */
  function fract(v) { return v - Math.floor(v); }
  function hash3(x, y, z) { return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453); }
  function vnoise(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    function h(i, j, k) { return hash3(xi + i, yi + j, zi + k); }
    var c00 = h(0, 0, 0) * (1 - u) + h(1, 0, 0) * u, c10 = h(0, 1, 0) * (1 - u) + h(1, 1, 0) * u;
    var c01 = h(0, 0, 1) * (1 - u) + h(1, 0, 1) * u, c11 = h(0, 1, 1) * (1 - u) + h(1, 1, 1) * u;
    var c0 = c00 * (1 - v) + c10 * v, c1 = c01 * (1 - v) + c11 * v;
    return (c0 * (1 - w) + c1 * w) * 2 - 1;
  }
  function fbm(x, y, z) {
    return vnoise(x, y, z) * 0.62 +
           vnoise(x * 2.1 + 5.3, y * 2.1 + 1.7, z * 2.1 + 9.2) * 0.28 +
           vnoise(x * 4.3 + 11.1, y * 4.3 + 3.4, z * 4.3 + 7.7) * 0.11;
  }

  /* ---------- cortical parcellation rules ---------- */
  function sylvian(nz) { return -0.06 - 0.42 * nz; }          /* lateral fissure */
  function central(ax) { return -0.02 + 0.30 * ax; }          /* central sulcus  */

  function parcelOf(x, y, z) {
    var nx = x / A, ny = y / B, nz = z / C, ax = Math.abs(nx);
    var ys = sylvian(nz), cs = central(ax);
    if (ny < ys) {
      if (ny > ys - 0.17 && ax > 0.42 && nz > -0.30 && nz < 0.26) return 'auditory';
      if (nz > -0.52 && nz < 0.56) return 'temporal';
    }
    if (nz < -0.70 && ax < 0.42) return 'v1';
    if (nz < -0.56) return 'occipital';
    if (nz > cs + 0.12) return 'frontal';
    if (nz > cs) return 'motor';
    if (nz > cs - 0.12) return 'somato';
    return 'parietal';
  }

  /* corpus-callosum centreline in the (z,y) mid-sagittal plane */
  var CCL = [[34, -2], [42, 10], [34, 20], [12, 26], [-14, 25], [-34, 16], [-42, 4]];
  function distCCL(z, y) {
    var best = 1e9;
    for (var i = 0; i < CCL.length - 1; i++) {
      var az = CCL[i][0], ay = CCL[i][1], bz = CCL[i + 1][0], by = CCL[i + 1][1];
      var dz = bz - az, dy = by - ay, L2 = dz * dz + dy * dy;
      var t = L2 ? ((z - az) * dz + (y - ay) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      var qz = az + t * dz - z, qy = ay + t * dy - y;
      best = Math.min(best, Math.sqrt(qz * qz + qy * qy));
    }
    return best;
  }

  /* ---------- smooth cerebral shell (right hemisphere) ---------- */
  function shell(theta, phi) {
    var dy = Math.cos(theta), sn = Math.sin(theta);
    var dz = sn * Math.cos(phi), dx = sn * Math.sin(phi);
    var ax = A, by = B, cz = C, t = Math.max(0, -dy);
    ax *= 1 - 0.38 * Math.pow(Math.abs(dz), 1.45);       /* taper towards the poles */
    ax *= 1 - 0.16 * Math.max(0, dy) * Math.max(0, dy);  /* narrow at the vertex    */
    if (dy < 0) by *= 0.80;                              /* flat skull base         */
    if (dz > 0) cz *= 0.93 * (1 - 0.45 * Math.pow(t, 0.55));  /* short temporal pole */
    else cz *= 1 - 0.32 * Math.pow(t, 0.7);              /* inferior occipital      */
    var x = ax * dx, y = by * dy, z = cz * dz;
    y += 3.2 * Math.max(0, dz) * t;                      /* orbital surface lift    */
    var nz = z / C, ny = y / B;
    var q = (ny - sylvian(nz)) / 0.16;
    var lat = Math.max(0, (Math.abs(dx) - 0.12) / 0.88);
    var groove = Math.exp(-q * q) * lat * (nz > -0.6 ? 1 : 0);
    var k = 1 - 0.13 * groove;                           /* lateral fissure         */
    return [x * k, y * k, z * k];
  }
  function gyrify(p) {
    var x = p[0], y = p[1], z = p[2];
    var n = fbm(x * 0.072, y * 0.072, z * 0.072) * 2.9 +
            fbm(x * 0.155 + 3.1, y * 0.155 + 1.7, z * 0.155 + 8.3) * 1.15;
    var L = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x + x / L * n, y + y / L * n, z + z / L * n];
  }

  function geomFromTris(arr) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    return g;
  }

  /* Returns { parcelId: BufferGeometry } for one right hemisphere
     (lateral + medial surfaces), already shifted off the midline. */
  function buildCortex() {
    var NT = 132, NP = 96, i, j;
    var grid = [], base = [];
    for (i = 0; i <= NT; i++) {
      var th = Math.max(1e-4, Math.min(Math.PI - 1e-4, Math.PI * i / NT));
      var rp = [], rb = [];
      for (j = 0; j <= NP; j++) {
        var b = shell(th, Math.PI * j / NP);
        rb.push(b); rp.push(gyrify(b));
      }
      grid.push(rp); base.push(rb);
    }
    var buck = {}, shellT = [];
    function push(id, a, b2, c2) {
      var t = buck[id] || (buck[id] = []);
      t.push(a[0], a[1], a[2], b2[0], b2[1], b2[2], c2[0], c2[1], c2[2]);
      shellT.push(a[0], a[1], a[2], b2[0], b2[1], b2[2], c2[0], c2[1], c2[2]);
    }
    for (i = 0; i < NT; i++) for (j = 0; j < NP; j++) {
      var p00 = grid[i][j], p01 = grid[i][j + 1], p10 = grid[i + 1][j], p11 = grid[i + 1][j + 1];
      var q0 = base[i][j], q1 = base[i + 1][j + 1];
      var id = parcelOf((q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2, (q0[2] + q1[2]) / 2);
      push(id, p00, p11, p01);
      push(id, p00, p10, p11);
    }

    /* medial wall: annular rim between a central window and the mid-sagittal outline */
    var loop = [], K = 7;
    for (i = 0; i <= NT; i++) loop.push(grid[i][0]);            /* anterior meridian, top->bottom */
    for (i = NT; i >= 0; i--) loop.push(grid[i][NP]);           /* posterior meridian, bottom->top */
    var cy = 0, cz = 0, m;
    for (m = 0; m < loop.length; m++) { cy += loop[m][1]; cz += loop[m][2]; }
    cy /= loop.length; cz /= loop.length;
    var rings = [];
    for (m = 0; m < loop.length; m++) {
      var o = loop[m], f0 = 0.58 - 0.13 * Math.max(0, -o[1] / B);
      var col = [];
      for (var k = 0; k <= K; k++) {
        var f = f0 + (1 - f0) * (k / K);
        var y = cy + (o[1] - cy) * f, z = cz + (o[2] - cz) * f;
        var bump = (k === K) ? 0 : 0.8 * fbm(y * 0.11, z * 0.11, 3.7);
        col.push([bump, y, z]);
      }
      rings.push(col);
    }
    for (m = 0; m < rings.length; m++) for (k = 0; k < K; k++) {
      var mn = (m + 1) % rings.length;
      var a = rings[m][k], b3 = rings[mn][k], c3 = rings[m][k + 1], d3 = rings[mn][k + 1];
      var mz = (a[2] + d3[2]) / 2, my = (a[1] + d3[1]) / 2;
      var dd = distCCL(mz, my);
      var pid = (dd >= 6 && dd <= 15) ? 'cingulate' : parcelOf(0, my, mz);
      push(pid, a, b3, c3);
      push(pid, b3, d3, c3);
    }

    /* fill the medial window for the stencil shell only (keeps it a closed solid) */
    var ctr = [0, cy, cz];
    for (m = 0; m < rings.length; m++) {
      var u0 = rings[m][0], u1 = rings[(m + 1) % rings.length][0];
      shellT.push(ctr[0], ctr[1], ctr[2], u1[0], u1[1], u1[2], u0[0], u0[1], u0[2]);
    }

    var out = {};
    Object.keys(buck).forEach(function (id) {
      var g = geomFromTris(buck[id]);
      g.translate(GAP, 0, 0);
      out[id] = g;
    });
    var sh = geomFromTris(shellT);
    sh.translate(GAP, 0, 0);
    out._shell = sh;
    return out;
  }

  /* ---------- deformed ellipsoid ---------- */
  function blob(r, o) {
    o = o || {};
    var g = new T.SphereGeometry(1, o.seg || 40, o.ring || 26);
    g.deleteAttribute('uv');
    var p = g.attributes.position, i, v = [0, 0, 0];
    for (i = 0; i < p.count; i++) {
      var ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i);
      v[0] = ux * r[0]; v[1] = uy * r[1]; v[2] = uz * r[2];
      if (o.warp) v = o.warp(v[0], v[1], v[2], ux, uy, uz);
      p.setXYZ(i, v[0], v[1], v[2]);
    }
    if (o.rot) g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(
      new T.Euler(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0)));
    if (o.pos) g.translate(o.pos[0], o.pos[1], o.pos[2]);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- tapered tube through control points ---------- */
  function lerpArr(arr, t) {
    if (typeof arr === 'number') return arr;
    if (arr.length === 1) return arr[0];
    var s = t * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(s)), f = s - i;
    return arr[i] * (1 - f) + arr[i + 1] * f;
  }
  function tube(pts, radii, o) {
    o = o || {};
    var vs = pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); });
    var curve = new T.CatmullRomCurve3(vs, false, 'catmullrom', o.tension === undefined ? 0.5 : o.tension);
    var seg = o.seg || Math.max(28, pts.length * 14), rad = o.rad || 14, sq = o.squash || 1;
    var fr = curve.computeFrenetFrames(seg, false);
    var pos = [], idx = [], i, j;
    for (i = 0; i <= seg; i++) {
      var t = i / seg, P = curve.getPoint(t), r = lerpArr(radii, t);
      var N = fr.normals[i], Bn = fr.binormals[i];
      for (j = 0; j <= rad; j++) {
        var a = j / rad * Math.PI * 2, ca = Math.cos(a) * r, sa = Math.sin(a) * r * sq;
        pos.push(P.x + N.x * ca + Bn.x * sa, P.y + N.y * ca + Bn.y * sa, P.z + N.z * ca + Bn.z * sa);
      }
    }
    var W = rad + 1;
    for (i = 0; i < seg; i++) for (j = 0; j < rad; j++) {
      var a0 = i * W + j, b0 = i * W + j + 1, c0 = (i + 1) * W + j, d0 = (i + 1) * W + j + 1;
      idx.push(a0, b0, c0, b0, d0, c0);
    }
    /* end caps with their own vertices so the edge stays crisp */
    function cap(i0, dir) {
      var P = curve.getPoint(i0 / seg), off = pos.length / 3;
      pos.push(P.x, P.y, P.z);
      var ring = [];
      for (j = 0; j <= rad; j++) {
        var src = (i0 * W + j) * 3;
        ring.push(pos.length / 3);
        pos.push(pos[src], pos[src + 1], pos[src + 2]);
      }
      for (j = 0; j < rad; j++) {
        if (dir > 0) idx.push(off, ring[j], ring[j + 1]);
        else idx.push(off, ring[j + 1], ring[j]);
      }
    }
    if (o.caps !== false) { cap(0, -1); cap(seg, 1); }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- merge / mirror ---------- */
  function mergeGeoms(gs) {
    var chunks = [], nrm = [], n = 0;
    gs.forEach(function (g) {
      var h = g.index ? g.toNonIndexed() : g;
      if (!h.attributes.normal) h.computeVertexNormals();
      chunks.push(h.attributes.position.array);
      nrm.push(h.attributes.normal.array);
      n += h.attributes.position.count;
    });
    var P = new Float32Array(n * 3), N = new Float32Array(n * 3), k = 0;
    chunks.forEach(function (c, i) { P.set(c, k); N.set(nrm[i], k); k += c.length; });
    var g2 = new T.BufferGeometry();
    g2.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    g2.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    return g2;
  }
  function mirrorGeom(g) {
    var m = g.clone();
    m.scale(-1, 1, 1);
    if (m.index) {
      var a = m.index.array;
      for (var i = 0; i < a.length; i += 3) { var t = a[i]; a[i] = a[i + 2]; a[i + 2] = t; }
    } else {
      var p = m.attributes.position.array;
      for (var q = 0; q < p.length; q += 9) for (var c = 0; c < 3; c++) {
        var tt = p[q + c]; p[q + c] = p[q + 6 + c]; p[q + 6 + c] = tt;
      }
    }
    m.computeVertexNormals();
    return m;
  }

  /* ---------- corpus callosum: swept mid-sagittal profile ---------- */
  function ccGeom() {
    var th = [3, 8.5, 7, 5.5, 5.5, 9, 11], up = [], dn = [], i;
    for (i = 0; i < CCL.length; i++) {
      var pz = CCL[Math.max(0, i - 1)], nx2 = CCL[Math.min(CCL.length - 1, i + 1)];
      var tz = nx2[0] - pz[0], ty = nx2[1] - pz[1], L = Math.hypot(tz, ty) || 1;
      var nz2 = -ty / L, ny2 = tz / L, h = th[i] / 2;
      up.push([-(CCL[i][0] + nz2 * h), CCL[i][1] + ny2 * h]);
      dn.push([-(CCL[i][0] - nz2 * h), CCL[i][1] - ny2 * h]);
    }
    var sh = new T.Shape();
    sh.moveTo(up[0][0], up[0][1]);
    for (i = 1; i < up.length; i++) sh.lineTo(up[i][0], up[i][1]);
    for (i = dn.length - 1; i >= 0; i--) sh.lineTo(dn[i][0], dn[i][1]);
    sh.closePath();
    var g = new T.ExtrudeGeometry(sh, {
      depth: 52, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 2.5,
      bevelSegments: 3, curveSegments: 10, steps: 1
    });
    g.deleteAttribute('uv');
    g.translate(0, 0, -26);
    g.rotateY(Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }

  return {
    A: A, B: B, C: C, GAP: GAP, THREE: T,
    fbm: fbm, buildCortex: buildCortex, blob: blob, tube: tube,
    mergeGeoms: mergeGeoms, mirrorGeom: mirrorGeom, ccGeom: ccGeom
  };
})();
