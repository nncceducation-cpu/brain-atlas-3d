(function () {
  'use strict';

  const BASE = 'atlas/dhcp40/';
  let cache = null;
  let pending = null;

  const STRUCTURE_NAMES = {
    1:'Left hippocampus',2:'Right hippocampus',3:'Left amygdala',4:'Right amygdala',
    17:'Left cerebellar hemisphere',18:'Right cerebellar hemisphere',19:'Brainstem',
    40:'Right caudate nucleus',41:'Left caudate nucleus',42:'Right thalamus',43:'Left thalamus',
    44:'Right subthalamic nucleus',45:'Left subthalamic nucleus',46:'Right lentiform nucleus',47:'Left lentiform nucleus',
    48:'Corpus callosum',49:'Left lateral ventricle',50:'Right lateral ventricle',
    86:'Right thalamus',87:'Left thalamus'
  };
  const TISSUE_NAMES = {1:'CSF',2:'Cortical gray matter',3:'White matter',5:'Ventricular CSF',6:'Cerebellum',7:'Deep gray matter',8:'Brainstem',9:'Hippocampus / amygdala'};

  async function inflate(path) {
    const response = await fetch(BASE + path);
    if (!response.ok) throw new Error(`Atlas file unavailable (${response.status})`);
    if (!window.DecompressionStream) throw new Error('This browser cannot decompress the neonatal volume.');
    const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (pending) return pending;
    pending = fetch(BASE + 'volume.json').then(r => {
      if (!r.ok) throw new Error(`Atlas metadata unavailable (${r.status})`);
      return r.json();
    }).then(async meta => {
      const [intensity, tissues, structures] = await Promise.all([
        inflate(meta.files.intensity), inflate(meta.files.tissues), inflate(meta.files.structures)
      ]);
      const expected = meta.shape[0] * meta.shape[1] * meta.shape[2];
      if (intensity.length !== expected || tissues.length !== expected || structures.length !== expected) {
        throw new Error('Neonatal atlas volume is incomplete.');
      }
      cache = { meta, intensity, tissues, structures };
      return cache;
    });
    return pending;
  }

  function index3(x, y, z, shape) { return x + shape[0] * (y + shape[1] * z); }

  function sliceGeometry(axis, shape) {
    // Each plane is emitted in standard radiological display orientation:
    // superior is up; anterior is left on sagittal and up on axial; patient
    // right is on the left of coronal and axial images.
    if (axis === 0) return { width: shape[1], height: shape[2], voxel: (u,v,k) => [k, shape[1]-1-u, shape[2]-1-v] };
    if (axis === 1) return { width: shape[0], height: shape[1], voxel: (u,v,k) => [u, shape[1]-1-v, k] };
    return { width: shape[0], height: shape[2], voxel: (u,v,k) => [u, k, shape[2]-1-v] };
  }

  function colorFor(structure, tissue) {
    if (tissue === 5 || structure === 49 || structure === 50) return [66, 190, 235, .88];
    if (structure === 48) return [244, 201, 92, .72];
    if (structure === 40 || structure === 41) return [239, 112, 108, .68];
    if (structure === 42 || structure === 43 || structure === 86 || structure === 87) return [151, 121, 224, .68];
    if (structure === 44 || structure === 45) return [240, 171, 76, .72];
    if (structure === 46 || structure === 47) return [76, 181, 166, .68];
    if (structure === 1 || structure === 2) return [91, 178, 121, .72];
    if (structure === 3 || structure === 4) return [220, 105, 166, .72];
    if (tissue === 7) return [174, 137, 210, .52];
    if (tissue === 9) return [91, 178, 121, .62];
    return null;
  }

  function render(target, atlas, axis, percent, visible) {
    const { meta, intensity, tissues, structures } = atlas;
    const shape = meta.shape;
    const volumeAxis = [0, 2, 1][axis];
    const bounds = meta.brainBounds[volumeAxis];
    const t = Math.max(0, Math.min(1, (percent + 100) / 200));
    const sliceIndex = Math.round(bounds[0] + t * (bounds[1] - bounds[0]));
    const geom = sliceGeometry(axis, shape);
    target.width = geom.width;
    target.height = geom.height;
    const ctx = target.getContext('2d', { alpha: false });
    const image = ctx.createImageData(geom.width, geom.height);
    const out = image.data;

    for (let v = 0; v < geom.height; v++) {
      for (let u = 0; u < geom.width; u++) {
        const [x,y,z] = geom.voxel(u,v,sliceIndex);
        const src = index3(x,y,z,shape);
        const tissue = tissues[src];
        const structure = structures[src];
        const dst = (u + v * geom.width) * 4;
        let value = intensity[src];
        const outside = tissue === 4 || !tissue;
        const removed = (tissue === 2 && !visible.cortex) ||
          (tissue === 3 && !visible.white_matter) ||
          ((tissue === 5 || structure === 49 || structure === 50) && !visible.ventricles);

        // Keep deliberate removals transparent-looking, but never create gaps
        // while all three core compartments are enabled.
        if (removed || outside) value = 0;

        // Gentle neonatal grayscale separation: cortex only slightly darker
        // than the immediately subjacent unmyelinated white matter.
        if (tissue === 2) value = Math.round(value * .88);
        else if (tissue === 3) value = Math.min(255, Math.round(value * .96 + 8));

        let r = outside || removed ? 219 : value;
        let g = outside || removed ? 228 : value;
        let b = outside || removed ? 236 : value;
        const overlay = outside || removed ? null : colorFor(structure, tissue);
        if (overlay) {
          const a = overlay[3];
          r = Math.round(value * (1-a) + overlay[0] * a);
          g = Math.round(value * (1-a) + overlay[1] * a);
          b = Math.round(value * (1-a) + overlay[2] * a);
        }
        out[dst] = r; out[dst+1] = g; out[dst+2] = b; out[dst+3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return { axis, sliceIndex, geom };
  }

  function voxelAt(display, u, v, atlas) {
    if (!display) return null;
    const x = Math.max(0, Math.min(display.geom.width - 1, Math.floor(u)));
    const y = Math.max(0, Math.min(display.geom.height - 1, Math.floor(v)));
    const voxel = display.geom.voxel(x, y, display.sliceIndex);
    const idx = index3(voxel[0], voxel[1], voxel[2], atlas.meta.shape);
    const structure = atlas.structures[idx], tissue = atlas.tissues[idx];
    return { structure, tissue, label: STRUCTURE_NAMES[structure] || TISSUE_NAMES[tissue] || null };
  }

  function positionForStructures(ids, axis) {
    if (!cache || !ids || !ids.length) return null;
    const volumeAxis = [0, 2, 1][axis];
    const values = ids.map(id => cache.meta.structureCenters[String(id)])
      .filter(Boolean).map(center => center[volumeAxis]);
    if (!values.length) return null;
    const coordinate = values.reduce((sum, value) => sum + value, 0) / values.length;
    const bounds = cache.meta.brainBounds[volumeAxis];
    return Math.max(-100, Math.min(100, Math.round((coordinate - bounds[0]) / (bounds[1] - bounds[0]) * 200 - 100)));
  }

  window.NeonatalVolume = { load, render, voxelAt, positionForStructures, structureNames: STRUCTURE_NAMES, tissueNames: TISSUE_NAMES };
})();
