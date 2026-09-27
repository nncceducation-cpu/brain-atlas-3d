# Newborn Brain 3D

**Live site:** https://nncceducation-cpu.github.io/brain-atlas-3d/

Neonatal teaching content and the curated midsagittal landmark view are informed by Meijler and Mohammad's open-access *Neonatal Brain Injury* (2024), especially Chapter 2, Normal Anatomy (CC BY 4.0), and Rutherford's *MRI of the Neonatal Brain*. The latter is used as a textual reference only; its copyrighted figures are not redistributed.

See [NEONATAL_ANATOMY_AUDIT.md](NEONATAL_ANATOMY_AUDIT.md) for the plane-by-plane reference comparison and documented mesh limitations.

This browser-based teaching atlas combines individually named anatomical surface meshes for the global 3D view with the official dHCP 40-week volumetric neonatal atlas for orthogonal sections. Slice mode uses aligned T2 MRI, nine tissue classes, and an 87-region segmentation instead of cutting hollow surface meshes.

The NNCC interface uses an original dark clinical-workspace design with a right-side anatomy navigator, left-side structure cards, and a separate clipping console. The underlying anatomy dataset remains attributed under its open licence.

## Features

- Hundreds of selectable left, right, and midline structures with TA2-style anatomical paths
- Hover identification without a persistent label cloud
- Bilateral labels for the Sylvian, central, parieto-occipital, calcarine, and transverse fissures
- Live search with side filtering
- Layer groups and per-structure visibility
- Left, right, and bilateral hemisphere views
- Cortex opacity control for deep-anatomy exploration
- Full-field sagittal, axial, and coronal neonatal MRI sections with brain-bounded travel
- Aligned labels for ventricles, corpus callosum, hippocampi, amygdalae, caudate, lentiform nuclei, thalami, subthalamic nuclei, brainstem, and cerebellum
- Independent cortex, white-matter, and ventricular display controls in slice mode
- One-click cerebral arterial mode with the named 3D arterial tree and neonatal ACA, MCA, PCA, deep-perforator, and posterior-circulation supply territories in every MRI plane
- One-click venous mode combining dural-sinus meshes with superior cerebral, superficial middle, Trolard, Labbé, internal cerebral, basal (Rosenthal), and great cerebral (Galen) veins plus slice drainage regions
- One-click sagittal, coronal, axial, and three-quarter anatomical orientations
- Focus, isolate, presets, guided systems, and lessons
- Shareable views and high-resolution poster export
- Keyboard navigation: `1` Explore, `2` Systems, `3` Learn, `/` search, `R` reset

The anatomical-section controls render the CC BY 4.0 dHCP 40-week T2 atlas and its co-registered hard segmentations directly. The slider is limited to the non-background brain bounds, so both hemispheres are sectioned by one true orthogonal voxel plane and no unsliced surface geometry is visible behind it. Hovering a slice identifies labelled tissue or a major segmented structure.

The optional arterial mode preserves the MRI beneath a translucent educational supply-territory overlay. Its neonatal topology is informed by the published ATNB map, with major territories cross-checked against the Digital 3D Brain MRI Arterial Territories Atlas. Because arterial borders and watershed zones vary between infants, the territory overlay is for teaching rather than patient-level lesion localization.

The optional venous mode adds a purpose-built superficial and deep cerebral venous network to the source model's dural-sinus meshes. Slice colors indicate broad superior sagittal, superficial middle/cavernous, Labbé/transverse, deep Galenic, and posterior-fossa drainage regions. Normal venous anatomy is highly variable, so these regions are deliberately presented as educational drainage patterns rather than fixed diagnostic boundaries.

## Accuracy and intended use

The gross-anatomy surfaces are derived from Z-Anatomy / BodyParts3D. Registered deep structures and tracts in the global view draw on open MNI-space imaging atlases, including CIT168, the Najdenovska thalamic atlas, the Neudorfer hypothalamic atlas, and HCP1065 tract templates. Slice mode instead uses the internally aligned dHCP neonatal label volume.

The optional global cerebral venous overlay uses an MRI-venography-derived surface by Nevit Dilmen, registered and proportionally fitted to the teaching model. It preserves observed vessel asymmetry and calibre variation rather than using hand-drawn tubes. The source is licensed CC BY-SA 3.0; the fit is educational and is not patient-specific neonatal venography.

This is an educational atlas, not a patient-specific brain. Do not use it for diagnosis, lesion localization, stereotactic targeting, or operative planning.

## Running locally

Serve the repository over HTTP and open `index.html`. The model is loaded at runtime from `models/brain.glb`; opening the file directly from disk will not work reliably.

## Licensing and attribution

Viewer code is Apache License 2.0. The 3D anatomy assets and derived metadata are CC BY-SA 4.0 and remain under that license. See [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md).

The atlas is adapted from [itayinbarr/brainproject](https://github.com/itayinbarr/brainproject), with anatomical clipping added for this deployment.

Interaction ideas were also informed by the public interfaces of the [Neurotorium 3D Brain Atlas](https://neurotorium.org/tool/brain-atlas/) and [NeuroGlance](https://neuroglance.labs.memebu.com/). No models, text, imagery, or source code were copied from those sites.
