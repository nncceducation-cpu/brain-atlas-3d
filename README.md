# Interactive 3D Brain Atlas — sliceable, colour-coded, labelled

**Live site:** https://USERNAME.github.io/REPO/ (replace once GitHub Pages is enabled)

`index.html` is a single self-contained file (~700 KB, three.js inlined). It runs from GitHub Pages,
from any static host, or straight off disk by double-clicking it — no server, no build step, no install.

## What is in the model

43 labelled parts, each with its function, its connections and its landmarks:

| Group | Contents |
|---|---|
| Cerebral cortex | frontal, primary motor (M1), primary somatosensory (S1), parietal, temporal, primary auditory (A1), occipital, primary visual (V1) |
| Limbic | cingulate cortex, insula, hippocampus, amygdala, fornix |
| Basal ganglia | caudate, putamen, globus pallidus, nucleus accumbens, substantia nigra |
| Diencephalon | thalamus, hypothalamus |
| Brainstem & cerebellum | midbrain, pons, medulla, cerebellum |
| Ventricles & glands | lateral, third and fourth ventricles, pituitary, pineal |
| White matter | corpus callosum, anterior commissure, internal capsule |
| Cranial pathways | optic nerve/chiasm/tract, olfactory bulb & tract |
| Tracts | corticospinal, superior longitudinal/arcuate, uncinate, cingulum, inferior fronto-occipital, optic radiation, thalamocortical radiations, callosal radiations, middle cerebellar peduncle |

Paired structures are built for both hemispheres; midline structures are single.

## Controls

**Navigate** — drag to orbit, scroll to zoom, right-drag to pan. Preset views along the
top (Left, Right, Front, Back, Top, Bottom, Mid-sagittal, 3/4).

**Slice** — the panel at the bottom drives three independent clipping planes:
sagittal (x), coronal (z) and axial (y). Tick a plane, then drag its slider through the
brain; `⇄` flips which half is kept. Any combination of the three can be active at once,
so you can take a corner block out of the brain. *Filled cut face* draws a solid
cross-section instead of a hollow shell — grey for the cortical ribbon, cream for white
matter, and each nucleus in its own colour. **Scrub slice** animates the active plane
back and forth through the whole brain.

**Explore** — click any structure (in the 3D view, on a label, or in the left list) to
load its function, connections and landmarks into the right-hand card. Connection chips
are clickable, so you can walk the network: hippocampus → fornix → hypothalamus.
*Show connections* hides everything except the selected structure, everything it talks
to, and the tracts that link them. *Isolate* leaves only the selection. *Focus* flies the
camera to it.

**Display** — `Labels` cycles off / key structures / all. `Tracts` toggles the
white-matter bundles. `Ghost cortex` makes the cortical surface translucent so the deep
grey matter shows through without slicing. `L`/`R`/`Both` selects hemispheres, and the
left panel has per-structure visibility (the ◉ icon) plus *Cortex only* / *Deep only*.

**Keyboard** — `L` labels, `T` tracts, `G` ghost cortex, `X`/`Y`/`Z` toggle a slice
plane, `←`/`→` step the active plane by 2 mm, `Space` scrub, `Esc` clear isolation.

## How the geometry is made, and what that means

The anatomy is generated procedurally in the browser rather than loaded from a scan:
the cerebral surface is an analytic shell whose radius is shaped by the lateral fissure
and the tapering of the frontal, temporal and occipital poles. Stable anatomical
landmarks—the central, precentral, postcentral, lateral, frontal, intraparietal,
parieto-occipital and calcarine sulci—are layered with band-limited secondary folds;
parcels are cut from that surface by anatomical rules (the central sulcus line tilts
forward as it runs laterally, the temporal lobe starts below the Sylvian line, V1 hugs
the calcarine region). The cerebellum has transverse folia, a horizontal fissure,
vermis and paravermian grooves. Nuclei are
deformed ellipsoids and tapered tubes placed at coordinates in millimetres from the
mid-commissural point (x = right, y = superior, z = anterior); the corpus callosum is a
swept mid-sagittal profile; tracts are tubes along their anatomical courses.

Landmark dimensions were fitted against reference values — 163 mm anterior–posterior
(z = −86 to +77), 133 mm wide, vertex 54 mm above the origin, temporal pole reaching
z = +36 mm at y = −30 — so
proportions and spatial relationships are right, and the cut faces are watertight.

**It is a teaching model, not a subject's brain.** Gyral and sulcal patterns are
plausible rather than individual, parcel boundaries are idealised rules rather than
cytoarchitectonic borders, and nothing here is derived from or registered to MRI. Use it
to teach and to reason about layout and connectivity — not to localise a lesion or plan
anything clinical.

## Publishing

GitHub Pages: push this folder to a repository, then **Settings → Pages → Source: Deploy from a
branch → `main` / `root`**. The atlas is served at `https://<user>.github.io/<repo>/` within a
minute or two. `.nojekyll` keeps Jekyll from touching the file. Any other static host (Netlify,
Cloudflare Pages, S3) works the same way — it is one file with no dependencies.

## Rebuilding

`src/` holds the sources (`app_geom.js` geometry engine, `app_data.js` atlas content,
`app_main.js` renderer/UI, `shell.html`, `style.css`); `python build.py` inlines
everything, including three.js from `vendor/`, into the deployable `index.html`.
To add a structure, append one entry to `BD.STRUCTURES` with its colour, function text,
`conn` list, label anchor and a geometry recipe, then rebuild.
