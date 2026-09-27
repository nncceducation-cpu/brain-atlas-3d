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
  const TERRITORIES = {
    aca: { label:'Anterior cerebral artery (ACA) territory', color:[239,111,136,.58] },
    mca: { label:'Middle cerebral artery (MCA) territory', color:[54,166,200,.58] },
    pca: { label:'Posterior cerebral artery (PCA) territory', color:[137,189,87,.60] },
    lsa: { label:'Lenticulostriate artery territory', color:[237,170,76,.68] },
    acha:{ label:'Anterior choroidal artery territory', color:[168,117,210,.66] },
    sca: { label:'Superior cerebellar artery territory', color:[236,190,72,.60] },
    aica:{ label:'Anterior inferior cerebellar artery territory', color:[231,126,77,.62] },
    pica:{ label:'Posterior inferior cerebellar artery territory', color:[194,85,151,.62] },
    vb:  { label:'Vertebrobasilar perforator territory', color:[89,103,189,.64] }
  };
  const VENOUS_TERRITORIES = {
    sss: { label:'Superior cerebral veins → superior sagittal sinus', color:[85,127,194,.56] },
    smcv:{ label:'Superficial middle cerebral vein → cavernous sinus', color:[73,161,184,.58] },
    labbe:{ label:'Vein of Labbé → transverse sinus', color:[77,166,143,.58] },
    deep:{ label:'Deep veins → internal cerebral veins / vein of Galen', color:[138,104,177,.64] },
    posterior:{ label:'Posterior fossa veins → transverse / petrosal sinuses', color:[139,120,159,.60] }
  };

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

  // Educational neonatal territory model evaluated inside the aligned dHCP
  // parenchymal mask, keeping every plane spatially consistent. Its topology
  // follows the neonatal ATNB map (Nunez et al., Pediatric Research 2020).
  function territoryFor(x, y, z, structure, tissue, meta) {
    if (!tissue || tissue === 1 || tissue === 4 || tissue === 5 || structure === 49 || structure === 50) return null;
    const b = meta.brainBounds;
    const nx = (x - b[0][0]) / (b[0][1] - b[0][0]);
    const ap = (y - b[1][0]) / (b[1][1] - b[1][0]);
    const si = (z - b[2][0]) / (b[2][1] - b[2][0]);
    const medial = Math.abs(nx - .5) * 2;

    if (tissue === 8 || structure === 19) return 'vb';
    if (tissue === 6 || structure === 17 || structure === 18) {
      if (si > .30) return 'sca';
      return ap > .48 ? 'aica' : 'pica';
    }
    if (structure === 40 || structure === 41 || structure === 46 || structure === 47) return 'lsa';
    if (structure === 3 || structure === 4) return 'acha';
    if (structure === 42 || structure === 43 || structure === 44 || structure === 45 || structure === 86 || structure === 87) return 'pca';
    if (structure === 1 || structure === 2) return ap < .53 ? 'pca' : 'acha';
    if (structure === 48) return 'aca';
    if (ap < (.29 + .08 * (1 - medial)) || (si < .43 && ap < .53 && medial < .66)) return 'pca';
    const acaWidth = .22 + .10 * Math.max(0, si - .45);
    if (medial < acaWidth && (si > .38 || ap > .52)) return 'aca';
    return 'mca';
  }

  function venousTerritoryFor(x, y, z, structure, tissue, meta) {
    if (!tissue || tissue === 1 || tissue === 4 || tissue === 5 || structure === 49 || structure === 50) return null;
    const b = meta.brainBounds;
    const nx = (x - b[0][0]) / (b[0][1] - b[0][0]);
    const ap = (y - b[1][0]) / (b[1][1] - b[1][0]);
    const si = (z - b[2][0]) / (b[2][1] - b[2][0]);
    const medial = Math.abs(nx - .5) * 2;
    if (tissue === 6 || tissue === 8 || structure === 17 || structure === 18 || structure === 19) return 'posterior';
    if (tissue === 7 || tissue === 9 || (structure >= 40 && structure <= 48) || structure === 86 || structure === 87) return 'deep';
    // Periventricular/deep white matter converges on the internal cerebral,
    // thalamostriate and basal venous systems rather than surface collectors.
    if (tissue === 3 && medial < .62 && si > .28 && si < .72) return 'deep';
    // Superior and medial convexities drain through bridging veins to the SSS.
    if (si > .62 || medial < .24) return 'sss';
    // Posteroinferior lateral cortex follows Labbé toward the transverse sinus.
    if (ap < .48 || si < .34) return 'labbe';
    // Remaining lateral frontal, parietal and temporal cortex follows the
    // superficial middle (Sylvian) venous pathway anteriorly.
    return 'smcv';
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
        const territory = visible.arterialTerritories && !outside && !removed ? territoryFor(x,y,z,structure,tissue,meta) : null;
        const venousTerritory = visible.venousTerritories && !outside && !removed ? venousTerritoryFor(x,y,z,structure,tissue,meta) : null;
        const overlay = outside || removed ? null : (territory ? TERRITORIES[territory].color :
          venousTerritory ? VENOUS_TERRITORIES[venousTerritory].color :
          ((visible.arterialTerritories || visible.venousTerritories) ? null : colorFor(structure, tissue)));
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
    return { axis, sliceIndex, geom, arterialTerritories: !!visible.arterialTerritories, venousTerritories: !!visible.venousTerritories };
  }

  function voxelAt(display, u, v, atlas) {
    if (!display) return null;
    const x = Math.max(0, Math.min(display.geom.width - 1, Math.floor(u)));
    const y = Math.max(0, Math.min(display.geom.height - 1, Math.floor(v)));
    const voxel = display.geom.voxel(x, y, display.sliceIndex);
    const idx = index3(voxel[0], voxel[1], voxel[2], atlas.meta.shape);
    const structure = atlas.structures[idx], tissue = atlas.tissues[idx];
    const atlasLabel = atlas.meta.structureLabels && atlas.meta.structureLabels[String(structure)];
    const territory = display.arterialTerritories ? territoryFor(voxel[0],voxel[1],voxel[2],structure,tissue,atlas.meta) : null;
    const venousTerritory = display.venousTerritories ? venousTerritoryFor(voxel[0],voxel[1],voxel[2],structure,tissue,atlas.meta) : null;
    let label = territory ? TERRITORIES[territory].label : venousTerritory ? VENOUS_TERRITORIES[venousTerritory].label : (STRUCTURE_NAMES[structure] || atlasLabel || TISSUE_NAMES[tissue] || null);
    // Tissue probability edges can extend beyond their hard structural label.
    // Name those deep-grey voxels by the nearest segmented nucleus rather than
    // exposing the vague tissue-class fallback to learners.
    if (!display.arterialTerritories && !display.venousTerritories && tissue === 7 && !STRUCTURE_NAMES[structure]) {
      const candidates = [40,41,42,43,44,45,46,47,86,87];
      let nearest = null, best = Infinity;
      candidates.forEach(id => {
        const center = atlas.meta.structureCenters[String(id)];
        if (!center) return;
        const distance = (voxel[0]-center[0])**2 + (voxel[1]-center[1])**2 + (voxel[2]-center[2])**2;
        if (distance < best) { best = distance; nearest = id; }
      });
      if (nearest) label = STRUCTURE_NAMES[nearest];
    }
    return { structure, tissue, label };
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

  window.NeonatalVolume = { load, render, voxelAt, positionForStructures, structureNames: STRUCTURE_NAMES, tissueNames: TISSUE_NAMES, territories: TERRITORIES, venousTerritories: VENOUS_TERRITORIES };
})();
