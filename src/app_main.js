/* ============================================================
   Interactive 3D brain atlas — renderer, slicing, labels, UI
   ============================================================ */
(function () {
  'use strict';
  var T = THREE;
  var $ = function (id) { return document.getElementById(id); };
  var hex = function (c) { return '#' + ('000000' + c.toString(16)).slice(-6); };

  /* ---------------- renderer / scene ---------------- */
  var canvas = $('gl');
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, stencil: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.localClippingEnabled = true;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(282, 150, 300);
  scene.add(camera);

  var controls = new T.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.85;
  controls.minDistance = 70;
  controls.maxDistance = 1200;
  controls.target.set(0, -4, 0);
  controls.autoRotateSpeed = 0.9;

  scene.add(new T.HemisphereLight(0xdcecff, 0x1b2330, 0.62));
  var d1 = new T.DirectionalLight(0xffffff, 0.86); d1.position.set(210, 260, 290); scene.add(d1);
  var d2 = new T.DirectionalLight(0xa8c8ff, 0.34); d2.position.set(-260, -90, -230); scene.add(d2);
  var d3 = new T.DirectionalLight(0xffe6c8, 0.22); d3.position.set(-180, 160, 240); scene.add(d3);
  var camLight = new T.DirectionalLight(0xffffff, 0.24); camLight.position.set(0, 0, 1); camera.add(camLight);

  /* ---------------- clipping planes ---------------- */
  var AXV = [new T.Vector3(1, 0, 0), new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1)];
  var PLANES = [new T.Plane(new T.Vector3(-1, 0, 0), 1e5),
                new T.Plane(new T.Vector3(0, -1, 0), 1e5),
                new T.Plane(new T.Vector3(0, 0, -1), 1e5)];
  var AXNAME = ['sagittal', 'axial', 'coronal'];
  var AXKEEP = [['left of cut', 'right of cut'], ['below cut', 'above cut'], ['behind cut', 'in front of cut']];
  var RANGE = [[-92, 92], [-80, 72], [-100, 100]];
  var slice = [{ on: false, val: 2, flip: false }, { on: false, val: 0, flip: false }, { on: false, val: 0, flip: false }];

  function updatePlane(a) {
    var s = slice[a], n = s.flip ? 1 : -1;
    PLANES[a].normal.set(a === 0 ? n : 0, a === 1 ? n : 0, a === 2 ? n : 0);
    PLANES[a].constant = s.on ? -n * s.val : 1e5;
  }
  [0, 1, 2].forEach(updatePlane);

  /* ---------------- containers ---------------- */
  var structRoot = new T.Group(), capRoot = new T.Group();
  scene.add(structRoot); scene.add(capRoot);
  var capGeo = new T.PlaneGeometry(520, 520);
  var meshes = [], pickable = [], allCaps = [], cortexMats = [], byId = {}, roCount = 1;

  function addCaps(geom, colorHex) {
    var out = [];
    for (var a = 0; a < 3; a++) {
      var plane = PLANES[a], ro = roCount++;
      var grp = new T.Group();
      var b = { depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: T.AlwaysStencilFunc };
      var m0 = new T.MeshBasicMaterial(b);
      m0.side = T.BackSide; m0.clippingPlanes = [plane];
      m0.stencilFail = m0.stencilZFail = m0.stencilZPass = T.IncrementWrapStencilOp;
      var m1 = new T.MeshBasicMaterial(b);
      m1.side = T.FrontSide; m1.clippingPlanes = [plane];
      m1.stencilFail = m1.stencilZFail = m1.stencilZPass = T.DecrementWrapStencilOp;
      var s0 = new T.Mesh(geom, m0), s1 = new T.Mesh(geom, m1);
      s0.renderOrder = ro; s1.renderOrder = ro;
      s0.frustumCulled = false; s1.frustumCulled = false;
      grp.add(s0); grp.add(s1); grp.visible = false;
      var capMat = new T.MeshStandardMaterial({
        color: colorHex, roughness: 0.8, metalness: 0.02, side: T.DoubleSide,
        clippingPlanes: PLANES.filter(function (p, i) { return i !== a; }),
        stencilWrite: true, stencilRef: 0, stencilFunc: T.NotEqualStencilFunc,
        stencilFail: T.ReplaceStencilOp, stencilZFail: T.ReplaceStencilOp, stencilZPass: T.ReplaceStencilOp
      });
      var cap = new T.Mesh(capGeo, capMat);
      cap.renderOrder = ro + 0.5;
      cap.frustumCulled = false;
      cap.visible = false;
      cap.userData.axis = a;
      cap.onAfterRender = function (r) { r.clearStencil(); };
      capRoot.add(grp); capRoot.add(cap);
      var rec = { grp: grp, cap: cap, mat: capMat, axis: a };
      allCaps.push(rec); out.push(rec);
    }
    return out;
  }

  /* ---------------- build the model ---------------- */
  var cortex = BG.buildCortex();
  var GRAY = 0xada79e, WM = 0xe7e0d1;

  function shrinkGeom(g, s) {
    var h = g.clone();
    h.computeBoundingBox();
    var c = new T.Vector3(); h.boundingBox.getCenter(c);
    h.translate(-c.x, -c.y, -c.z); h.scale(s, s, s); h.translate(c.x, c.y, c.z);
    h.computeVertexNormals();
    return h;
  }
  /* cortical ribbon + white-matter core shown on the cut face */
  var shellSets = [];
  (function () {
    var sR = cortex._shell, sL = BG.mirrorGeom(sR);
    [['R', sR], ['L', sL]].forEach(function (p) {
      shellSets.push({ side: p[0], caps: addCaps(p[1], GRAY) });
      shellSets.push({ side: p[0], caps: addCaps(shrinkGeom(p[1], 0.885), WM) });
    });
  })();

  BD.ALL.forEach(function (def) {
    byId[def.id] = def;
    var base = def.cortex ? cortex[def.id] : def.geom();
    if (!base) return;
    var sides = def.mirror ? [['R', base], ['L', BG.mirrorGeom(base)]] : [['M', base]];
    var mat = new T.MeshStandardMaterial({
      color: def.color, roughness: def.tract ? 0.45 : 0.62, metalness: 0.03,
      side: def.solid ? T.FrontSide : T.DoubleSide, clippingPlanes: PLANES
    });
    if (def.opacity) { mat.transparent = true; mat.opacity = def.opacity; mat.depthWrite = false; }
    if (def.tract) mat.emissive = new T.Color(def.color).multiplyScalar(0.16);
    def._mat = mat;
    if (def.cortex) cortexMats.push(mat);
    sides.forEach(function (sd) {
      sd[1].computeBoundingBox();      /* lets the raycaster reject quickly */
      sd[1].computeBoundingSphere();
      var m = new T.Mesh(sd[1], mat);
      m.renderOrder = def.opacity ? 6000 : 5000;
      m.userData = { def: def, side: sd[0] };
      if (def.solid && !def.cortex && !def.opacity) m.userData.caps = addCaps(sd[1], def.color);
      structRoot.add(m);
      meshes.push(m);
      pickable.push(m);
      (def._meshes || (def._meshes = [])).push(m);
    });
  });

  /* ---------------- view state ---------------- */
  var state = { hemi: 'B', vis: {}, ghost: false, tracts: true, labels: 1, caps: true,
                sel: null, focus: null, spin: false };
  BD.ALL.forEach(function (d) { state.vis[d.id] = true; });

  function hemiOK(side) {
    if (side === 'M') return true;
    return state.hemi === 'B' || state.hemi === side;
  }
  function effVisible(def) {
    if (!state.vis[def.id]) return false;
    if (def.tract && !state.tracts) return false;
    if (state.focus && !state.focus.has(def.id)) return false;
    return true;
  }
  function anyCortexVisible() {
    if (state.focus) return false;
    return BD.ALL.some(function (d) { return d.cortex && state.vis[d.id]; });
  }
  function applyVis() {
    meshes.forEach(function (m) {
      var def = m.userData.def;
      var on = effVisible(def) && hemiOK(m.userData.side);
      m.visible = on;
      if (m.userData.caps) m.userData.caps.forEach(function (c, a) {
        var show = on && slice[a].on && state.caps;
        c.grp.visible = show; c.cap.visible = show;
      });
    });
    var ac = anyCortexVisible() && !state.ghost;
    shellSets.forEach(function (s) {
      var on = ac && hemiOK(s.side);
      s.caps.forEach(function (c, a) {
        var show = on && slice[a].on && state.caps;
        c.grp.visible = show; c.cap.visible = show;
      });
    });
    cortexMats.forEach(function (mt) {
      mt.transparent = state.ghost;
      mt.opacity = state.ghost ? 0.26 : 1;
      mt.depthWrite = !state.ghost;
      mt.side = state.ghost ? T.DoubleSide : T.FrontSide;
      mt.needsUpdate = true;
    });
    syncList();
  }

  /* ---------------- labels ---------------- */
  var labelLayer = $('labels'), svg = $('leaders'), labels = [];
  var NSVG = 'http://www.w3.org/2000/svg';
  BD.ALL.forEach(function (def) {
    if (!def.label) return;
    var el = document.createElement('div');
    el.className = 'lab' + (def.tract ? ' tract' : '');
    el.innerHTML = '<span class="dotc" style="background:' + hex(def.color) + '"></span>' + def.name;
    el.addEventListener('click', function (e) { e.stopPropagation(); select(def.id); });
    labelLayer.appendChild(el);
    var line = document.createElementNS(NSVG, 'line');
    line.setAttribute('stroke', 'rgba(255,255,255,.35)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    var dot = document.createElementNS(NSVG, 'circle');
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', hex(def.color));
    svg.appendChild(dot);
    labels.push({ def: def, el: el, line: line, dot: dot });
  });

  var tmpV = new T.Vector3();
  function anchorOf(def) {
    var L = def.label, useLeft = (def.mirror && state.hemi === 'L');
    return tmpV.set(useLeft ? -L[0] : L[0], L[1], L[2]);
  }
  function insideSlices(p) {
    for (var a = 0; a < 3; a++) if (slice[a].on && PLANES[a].distanceToPoint(p) < -0.5) return false;
    return true;
  }
  function updateLabels() {
    var W = window.innerWidth, H = window.innerHeight, placed = [], i, j;
    for (i = 0; i < labels.length; i++) {
      var L = labels[i], def = L.def, show = state.labels > 0 && effVisible(def) &&
        (state.labels === 2 || def.key === 1) && (def.mirror ? hemiOK('R') || hemiOK('L') : true);
      if (show) {
        var p = anchorOf(def).clone();
        if (!insideSlices(p)) show = false;
        else {
          p.project(camera);
          if (p.z > 1) show = false;
          else {
            var x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
            if (x < -60 || x > W + 60 || y < -30 || y > H + 30) show = false;
            else placed.push({ L: L, ax: x, ay: y, x: x, y: y });
          }
        }
      }
      if (!show) { L.el.style.display = 'none'; L.line.setAttribute('stroke-opacity', '0'); L.dot.setAttribute('fill-opacity', '0'); }
    }
    placed.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < placed.length; i++) {
      for (j = 0; j < i; j++) {
        if (Math.abs(placed[i].x - placed[j].x) < 108 && Math.abs(placed[i].y - placed[j].y) < 17) {
          placed[i].y = placed[j].y + 17;
        }
      }
    }
    for (i = 0; i < placed.length; i++) {
      var q = placed[i], el = q.L.el;
      el.style.display = 'block';
      el.style.left = q.x + 'px';
      el.style.top = q.y + 'px';
      el.classList.toggle('sel', state.sel === q.L.def.id);
      var dy = q.y - q.ay;
      if (Math.abs(dy) > 8) {
        q.L.line.setAttribute('x1', q.ax); q.L.line.setAttribute('y1', q.ay);
        q.L.line.setAttribute('x2', q.x); q.L.line.setAttribute('y2', q.y);
        q.L.line.setAttribute('stroke-opacity', '0.4');
      } else q.L.line.setAttribute('stroke-opacity', '0');
      q.L.dot.setAttribute('cx', q.ax); q.L.dot.setAttribute('cy', q.ay);
      q.L.dot.setAttribute('fill-opacity', '0.9');
    }
  }

  /* ---------------- selection & highlight ---------------- */
  function setEmissive(def, mul) {
    if (!def._mat) return;
    def._mat.emissive = new T.Color(def.color).multiplyScalar(mul);
    def._mat.emissiveIntensity = 1;
  }
  function clearHighlights() {
    BD.ALL.forEach(function (d) { setEmissive(d, d.tract ? 0.16 : 0); });
  }
  function select(id) {
    state.sel = id;
    clearHighlights();
    var def = byId[id];
    if (def) {
      setEmissive(def, 0.55);
      def.conn.forEach(function (c) { if (byId[c]) setEmissive(byId[c], byId[c].tract ? 0.34 : 0.17); });
    }
    setInfo(def);
    syncList();
  }

  var cbar = $('cbar'), iname = $('iname'), igroup = $('igroup'), ifn = $('ifn'),
      iconn = $('iconn'), iloc = $('iloc');
  function setInfo(def) {
    if (!def) {
      cbar.style.background = '#3a475c';
      iname.textContent = 'Select a structure';
      igroup.textContent = 'brain atlas \u00b7 ' + BD.ALL.length + ' structures & tracts';
      ifn.textContent = 'Click any part of the model, a label, or a list entry to read what it does, what it connects to and where it sits.';
      iloc.textContent = '\u2014';
      iconn.innerHTML = '';
      return;
    }
    cbar.style.background = hex(def.color);
    iname.textContent = def.name;
    igroup.textContent = def.grp + (def.mirror ? ' \u00b7 paired / bilateral' : ' \u00b7 midline');
    ifn.textContent = def.fn;
    iloc.textContent = def.loc;
    iconn.innerHTML = '';
    def.conn.forEach(function (cid) {
      var d = byId[cid];
      if (!d) return;
      var c = document.createElement('span');
      c.className = 'chip';
      c.innerHTML = '<span class="sw" style="background:' + hex(d.color) + '"></span>' + d.name;
      c.addEventListener('click', function () { select(cid); focusOn(cid); });
      iconn.appendChild(c);
    });
  }

  /* ---------------- structure list ---------------- */
  var listEl = $('list'), rows = {};
  BD.GROUPS.forEach(function (gname) {
    var items = BD.ALL.filter(function (d) { return d.grp === gname; });
    if (!items.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'grp';
    var head = document.createElement('div');
    head.className = 'gt';
    head.innerHTML = gname + '<span class="cnt">' + items.length + '</span>';
    head.addEventListener('click', function () { wrap.classList.toggle('closed'); });
    wrap.appendChild(head);
    var box = document.createElement('div');
    box.className = 'items';
    items.forEach(function (d) {
      var r = document.createElement('div');
      r.className = 'it' + (d.tract ? ' tr' : '');
      r.innerHTML = '<span class="sw" style="background:' + hex(d.color) + '"></span>' +
                    '<span class="nm">' + d.name + '</span><span class="eye">\u25c9</span>';
      r.querySelector('.nm').addEventListener('click', function () { select(d.id); focusOn(d.id); });
      r.querySelector('.sw').addEventListener('click', function () { select(d.id); focusOn(d.id); });
      r.querySelector('.eye').addEventListener('click', function (e) {
        e.stopPropagation();
        state.vis[d.id] = !state.vis[d.id];
        applyVis();
      });
      box.appendChild(r);
      rows[d.id] = r;
    });
    wrap.appendChild(box);
    listEl.appendChild(wrap);
  });
  function syncList() {
    Object.keys(rows).forEach(function (id) {
      rows[id].classList.toggle('off', !state.vis[id]);
      rows[id].classList.toggle('sel', state.sel === id);
    });
  }

  $('q').addEventListener('input', function (e) {
    var s = e.target.value.trim().toLowerCase();
    BD.ALL.forEach(function (d) {
      var hit = !s || (d.name + ' ' + d.grp + ' ' + d.fn + ' ' + d.loc).toLowerCase().indexOf(s) >= 0;
      rows[d.id].style.display = hit ? 'flex' : 'none';
    });
  });
  $('showAll').addEventListener('click', function () {
    BD.ALL.forEach(function (d) { state.vis[d.id] = true; });
    state.focus = null; applyVis();
  });
  $('hideAll').addEventListener('click', function () {
    BD.ALL.forEach(function (d) { state.vis[d.id] = false; });
    state.focus = null; applyVis();
  });
  $('onlyCortex').addEventListener('click', function () {
    BD.ALL.forEach(function (d) { state.vis[d.id] = !!d.cortex; });
    state.focus = null; applyVis();
  });
  $('onlyDeep').addEventListener('click', function () {
    BD.ALL.forEach(function (d) { state.vis[d.id] = !d.cortex && !d.tract; });
    state.focus = null; applyVis();
  });

  /* ---------------- camera moves ---------------- */
  var tween = null;
  function moveCam(px, py, pz, tx, ty, tz, ms) {
    tween = { t: 0, ms: ms || 620,
      p0: camera.position.clone(), p1: new T.Vector3(px, py, pz),
      c0: controls.target.clone(), c1: new T.Vector3(tx || 0, ty === undefined ? -4 : ty, tz || 0) };
  }
  var VIEWS = {
    left:   [-390, 40, 0], right: [390, 40, 0], front: [0, 26, 430], back: [0, 26, -430],
    top:    [0, 430, 6],   bottom: [0, -420, 6], iso: [300, 175, 300]
  };
  function setView(v) {
    if (v === 'mid') {
      slice[0].on = true; slice[0].flip = true; slice[0].val = 0;
      syncSliceUI(0); updatePlane(0); applyVis();
      moveCam(-390, 18, 0, 0, 2, -4);
      return;
    }
    var p = VIEWS[v] || VIEWS.iso;
    moveCam(p[0], p[1], p[2], 0, -4, 0);
  }
  Array.prototype.forEach.call(document.querySelectorAll('#views button'), function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });

  var bbox = new T.Box3(), bsph = new T.Sphere();
  function focusOn(id) {
    var def = byId[id];
    if (!def || !def._meshes) return;
    bbox.makeEmpty();
    def._meshes.forEach(function (m) {
      if (!hemiOK(m.userData.side)) return;
      m.geometry.computeBoundingBox();
      bbox.union(m.geometry.boundingBox);
    });
    if (bbox.isEmpty()) return;
    bbox.getBoundingSphere(bsph);
    var r = Math.max(22, bsph.radius), dist = r * 4.2 + 60;
    var dir = camera.position.clone().sub(controls.target).normalize();
    moveCam(bsph.center.x + dir.x * dist, bsph.center.y + dir.y * dist, bsph.center.z + dir.z * dist,
            bsph.center.x, bsph.center.y, bsph.center.z, 700);
  }

  /* ---------------- picking ---------------- */
  var ray = new T.Raycaster(), mouse = new T.Vector2(), tip = $('tip'), hover = null, down = null;
  function pick(ev) {
    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    var hits = ray.intersectObjects(pickable, false);
    for (var i = 0; i < hits.length; i++) {
      if (!hits[i].object.visible) continue;
      if (!insideSlices(hits[i].point)) continue;
      return hits[i];
    }
    return null;
  }
  renderer.domElement.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', function (e) {
    if (!down || Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) return;
    var h = pick(e);
    if (h) { select(h.object.userData.def.id); } else { select(null); }
  });
  renderer.domElement.addEventListener('dblclick', function (e) {
    var h = pick(e);
    if (h) focusOn(h.object.userData.def.id);
  });
  var lastHover = 0;
  renderer.domElement.addEventListener('pointermove', function (e) {
    if (e.buttons) { tip.style.display = 'none'; return; }   /* orbiting */
    var now = performance.now();
    if (now - lastHover < 55) return;
    lastHover = now;
    var h = pick(e);
    var id = h ? h.object.userData.def.id : null;
    if (id !== hover) {
      hover = id;
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
    }
    if (id) {
      tip.style.display = 'block';
      tip.textContent = byId[id].name;
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top = (e.clientY + 14) + 'px';
    } else tip.style.display = 'none';
  });
  renderer.domElement.addEventListener('pointerleave', function () { tip.style.display = 'none'; });

  /* ---------------- toggles ---------------- */
  function flash(el, on) { el.classList.toggle('on', on); }
  $('tLab').addEventListener('click', function () {
    state.labels = (state.labels + 1) % 3;
    this.textContent = ['Labels off', 'Labels: key', 'Labels: all'][state.labels];
    flash(this, state.labels > 0);
  });
  $('tLab').textContent = 'Labels: key';
  $('tTract').addEventListener('click', function () {
    state.tracts = !state.tracts; flash(this, state.tracts); applyVis();
  });
  $('tGhost').addEventListener('click', function () {
    state.ghost = !state.ghost; flash(this, state.ghost); applyVis();
  });
  Array.prototype.forEach.call(document.querySelectorAll('#top [data-hemi]'), function (b) {
    b.addEventListener('click', function () {
      state.hemi = b.dataset.hemi;
      Array.prototype.forEach.call(document.querySelectorAll('#top [data-hemi]'), function (o) {
        o.classList.toggle('on', o === b);
      });
      applyVis();
    });
  });
  $('btnFocus').addEventListener('click', function () { if (state.sel) focusOn(state.sel); });
  $('btnIsolate').addEventListener('click', function () {
    if (!state.sel) return;
    if (state.focus && state.focus.size === 1 && state.focus.has(state.sel)) state.focus = null;
    else state.focus = new Set([state.sel]);
    applyVis();
  });
  $('btnConn').addEventListener('click', function () {
    if (!state.sel) return;
    var def = byId[state.sel];
    if (state.focus && state.focus.size > 1) state.focus = null;
    else {
      var s = new Set([def.id]);
      def.conn.forEach(function (c) { if (byId[c]) s.add(c); });
      BD.TRACTS.forEach(function (t) { if (t.conn.indexOf(def.id) >= 0) s.add(t.id); });
      state.focus = s;
      state.tracts = true; flash($('tTract'), true);
    }
    applyVis();
  });
  $('btnReset').addEventListener('click', function () {
    state.focus = null; state.hemi = 'B'; state.ghost = false;
    BD.ALL.forEach(function (d) { state.vis[d.id] = true; });
    [0, 1, 2].forEach(function (a) { slice[a].on = false; slice[a].flip = false; syncSliceUI(a); updatePlane(a); });
    Array.prototype.forEach.call(document.querySelectorAll('#top [data-hemi]'), function (o) {
      o.classList.toggle('on', o.dataset.hemi === 'B');
    });
    flash($('tGhost'), false);
    applyVis(); setView('iso'); select(null);
  });

  /* ---------------- slice UI ---------------- */
  var CHK = ['cx', 'cy', 'cz'], SLD = ['sx', 'sy', 'sz'], VAL = ['vx', 'vy', 'vz'], FLP = ['fx', 'fy', 'fz'];
  var lastAxis = 0;
  function syncSliceUI(a) {
    var s = slice[a];
    $(CHK[a]).checked = s.on;
    $(SLD[a]).disabled = !s.on;
    $(SLD[a]).value = s.val;
    $(VAL[a]).textContent = s.on ? (s.val > 0 ? '+' : '') + s.val + ' mm' : '\u2014';
    $(FLP[a]).classList.toggle('on', s.flip);
    var act = [0, 1, 2].filter(function (i) { return slice[i].on; });
    $('sliceInfo').textContent = act.length
      ? act.map(function (i) { return AXNAME[i] + ' ' + ((slice[i].val > 0 ? '+' : '') + slice[i].val) + ' mm (' + AXKEEP[i][slice[i].flip ? 1 : 0] + ')'; }).join(' \u00b7 ')
      : 'no slice active';
  }
  function setSliceVal(a, v) {
    slice[a].val = Math.round(Math.max(RANGE[a][0], Math.min(RANGE[a][1], v)));
    updatePlane(a); syncSliceUI(a);
  }
  [0, 1, 2].forEach(function (a) {
    $(CHK[a]).addEventListener('change', function () {
      slice[a].on = this.checked; lastAxis = a;
      updatePlane(a); syncSliceUI(a); applyVis();
    });
    $(SLD[a]).addEventListener('input', function () {
      lastAxis = a; setSliceVal(a, parseFloat(this.value));
    });
    $(FLP[a]).addEventListener('click', function () {
      slice[a].flip = !slice[a].flip; lastAxis = a; updatePlane(a); syncSliceUI(a);
    });
    syncSliceUI(a);
  });
  $('tCaps').addEventListener('change', function () { state.caps = this.checked; applyVis(); });
  $('tSpin').addEventListener('change', function () { controls.autoRotate = this.checked; });
  $('btnSliceOff').addEventListener('click', function () {
    playing = false; $('btnPlay').classList.remove('on');
    [0, 1, 2].forEach(function (a) { slice[a].on = false; updatePlane(a); syncSliceUI(a); });
    applyVis();
  });
  var playing = false, playT = 0.3;
  $('btnPlay').addEventListener('click', function () {
    playing = !playing;
    this.classList.toggle('on', playing);
    if (playing) {
      if (![0, 1, 2].some(function (a) { return slice[a].on; })) {
        slice[lastAxis].on = true; updatePlane(lastAxis); syncSliceUI(lastAxis); applyVis();
      } else lastAxis = [0, 1, 2].filter(function (a) { return slice[a].on; })[0];
    }
  });

  /* ---------------- keyboard ---------------- */
  window.addEventListener('keydown', function (e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === 'l') $('tLab').click();
    else if (k === 't') $('tTract').click();
    else if (k === 'g') $('tGhost').click();
    else if (k === 'x' || k === 'y' || k === 'z') {
      var a = { x: 0, y: 1, z: 2 }[k];
      slice[a].on = !slice[a].on; lastAxis = a;
      updatePlane(a); syncSliceUI(a); applyVis();
    } else if (k === 'arrowleft' || k === 'arrowright') {
      var b = [0, 1, 2].filter(function (i) { return slice[i].on; })[0];
      if (b === undefined) return;
      setSliceVal(b, slice[b].val + (k === 'arrowright' ? 2 : -2));
      e.preventDefault();
    } else if (k === ' ') { $('btnPlay').click(); e.preventDefault(); }
    else if (k === 'escape') { state.focus = null; applyVis(); select(null); }
  });

  /* ---------------- panels on narrow screens ---------------- */
  $('mLeft').addEventListener('click', function () { $('left').classList.toggle('min'); });
  $('mRight').addEventListener('click', function () { $('right').classList.toggle('min'); });

  /* ---------------- resize / loop ---------------- */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  }
  window.addEventListener('resize', resize);
  resize();

  var capPos = new T.Vector3(), clock = new T.Clock();
  function updateCaps() {
    for (var i = 0; i < allCaps.length; i++) {
      var rec = allCaps[i];
      if (!rec.cap.visible) continue;
      var p = PLANES[rec.axis];
      capPos.copy(p.normal).multiplyScalar(-p.constant);
      rec.cap.position.copy(capPos);
      rec.cap.lookAt(capPos.x + p.normal.x, capPos.y + p.normal.y, capPos.z + p.normal.z);
    }
  }

  function tick() {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, clock.getDelta());
    if (tween) {
      tween.t += dt * 1000 / tween.ms;
      var f = Math.min(1, tween.t), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      controls.target.lerpVectors(tween.c0, tween.c1, e);
      if (f >= 1) tween = null;
    }
    if (playing) {
      playT += dt * 0.18;
      var tri = Math.abs(((playT % 2) - 1));
      setSliceVal(lastAxis, RANGE[lastAxis][0] + (RANGE[lastAxis][1] - RANGE[lastAxis][0]) * tri);
    }
    controls.update();
    updateCaps();
    renderer.render(scene, camera);
    updateLabels();
  }

  applyVis();
  setInfo(null);
  tick();
  setTimeout(function () {
    var l = $('load');
    l.classList.add('gone');
    setTimeout(function () { l.parentNode && l.parentNode.removeChild(l); }, 700);
  }, 120);
})();
