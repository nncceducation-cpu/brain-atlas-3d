# Interactive 3D Brain Atlas

**Live site:** https://nncceducation-cpu.github.io/brain-atlas-3d/

This browser-based teaching atlas now uses real, individually named anatomical surface meshes rather than a procedurally generated approximation. It includes detailed cortex, deep grey nuclei, diencephalon, brainstem, cerebellum, ventricles, white-matter pathways, cranial nerves, cerebral and cerebellar arteries, dural venous sinuses, and dural reflections.

## Features

- Hundreds of selectable left, right, and midline structures with TA2-style anatomical paths
- Hover identification without a persistent label cloud
- Live search with side filtering
- Layer groups and per-structure visibility
- Left, right, and bilateral hemisphere views
- Cortex opacity control for deep-anatomy exploration
- Sagittal, axial, and coronal clipping planes with side flipping
- One-click sagittal, coronal, axial, and three-quarter anatomical orientations
- Focus, isolate, presets, guided systems, and lessons
- Shareable views and high-resolution poster export
- Keyboard navigation: `1` Explore, `2` Systems, `3` Learn, `/` search, `R` reset

The clipping planes intentionally leave cut faces open. The model contains anatomical surface meshes, not voxel tissue or histology; inventing filled cut textures would imply detail that is not present in the source data.

## Accuracy and intended use

The gross-anatomy surfaces are derived from Z-Anatomy / BodyParts3D. Registered deep structures and tracts draw on open MNI-space imaging atlases, including CIT168, the Najdenovska thalamic atlas, the Neudorfer hypothalamic atlas, and HCP1065 tract templates. Registered structures are approximate at roughly 7 mm.

This is an educational atlas, not a patient-specific brain. Do not use it for diagnosis, lesion localization, stereotactic targeting, or operative planning.

## Running locally

Serve the repository over HTTP and open `index.html`. The model is loaded at runtime from `models/brain.glb`; opening the file directly from disk will not work reliably.

## Licensing and attribution

Viewer code is Apache License 2.0. The 3D anatomy assets and derived metadata are CC BY-SA 4.0 and remain under that license. See [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md).

The atlas is adapted from [itayinbarr/brainproject](https://github.com/itayinbarr/brainproject), with anatomical clipping added for this deployment.

Interaction ideas were also informed by the public interfaces of the [Neurotorium 3D Brain Atlas](https://neurotorium.org/tool/brain-atlas/) and [NeuroGlance](https://neuroglance.labs.memebu.com/). No models, text, imagery, or source code were copied from those sites.
