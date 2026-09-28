# Copyright, licences and attribution

Newborn Brain 3D is an adapted educational application. The combined
application and NNCC Education modifications are distributed under **Creative
Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**, while
identifiable upstream code and data retain the licences stated below. The
complete source is available at
https://github.com/nncceducation-cpu/brain-atlas-3d.

Developed by **Khorshid Mohammad**, [The Harvey Sarnat NNCC Care
Program](https://sarnatnncc.ca/), and the [Dr. Luis Bello-Espinosa Innovation
in NNCC Lab](https://sarnatnncc.ca/innovation.html).

## Original viewer

This site incorporates and adapts the open anatomical viewer and model from:

- **Brain Project**, © Itay Inbar and contributors: https://github.com/itayinbarr/brainproject
- Original viewer code: **Apache License 2.0**. The Apache licence and copyright
  notice are preserved in `LICENSE`.

## Z-Anatomy and upstream model notices

The initial 3D anatomy is adapted from **Z-Anatomy**. Required upstream notices
are preserved here:

- **“Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0.”**
  https://github.com/Z-Anatomy/Models-of-human-anatomy
- **“BodyParts3D — The Database Center for Life Science — CC BY-SA 2.1
  Japan.”** Original model:
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Z-Anatomy's upstream notice identifies **“Brainder” and “White matter” from
  the University of Washington**. This wording is reproduced as a required
  upstream notice; its precise provenance has been publicly questioned and is
  not independently asserted here.
- Z-Anatomy's upstream notice identifies **“Cranial Nerves and Foramina — by
  University of Dundee, CAHID — CC BY 4.0.”** This required upstream notice is
  preserved for the cranial-nerve material contained in the adapted model.

Authors named by the upstream Z-Anatomy notice include Kousaku Okubo (original
BodyParts3D model), Gauthier Kervyn (design, 3D and anatomy), Marcin Zielinski
(Blender add-on), Lluis Vinent (Unity development), Ana Teresa Bigio, Carlos
Torres Villar, Paola Perin, Daniele Cossellu, Elisa Vivado, Jadwiga Palosz and
Shariar Ahmadpour.

**Changes made for this project:** the anatomy was converted and reorganized
as glTF; structure names and metadata were normalized; materials, colours and
visibility groups were changed; atlas-derived deep structures and tract
centre-lines were registered; neonatal section data, vascular overlays and
interactive educational behaviour were added. These are adaptations, not the
original creators' clinical products, and no endorsement is implied.

## Registered imaging atlases

- Initial 3D anatomy from **Z-Anatomy**, built on **BodyParts3D / DBCLS**
- Globus pallidus, subthalamic nucleus, substantia nigra, nucleus accumbens and related registered structures from the **CIT168 subcortical atlas** (Pauli, Nili & Tyszka, 2018)
- Amygdala groups from the **CIT168 amygdala atlas** (Tyszka & Pauli, 2016)
- Thalamic nuclei groups from **Najdenovska et al. (2018)**
- Hypothalamic regions from **Neudorfer et al. (2020)**
- White-matter tract templates from the **HCP1065 Population-Averaged
  Tractography Atlas**, Fang-Cheng Yeh (2022), **CC BY-SA 4.0**:
  https://brain.labsolver.org/hcp_trk_atlas.html

HCP acknowledgement: Data were provided in part by the Human Connectome
Project, WU-Minn Consortium (Principal Investigators: David Van Essen and
Kamil Ugurbil; 1U54MH091657), funded by the 16 NIH Institutes and Centers that
support the NIH Blueprint for Neuroscience Research, and by the McDonnell
Center for Systems Neuroscience at Washington University.

The upstream viewer source remains under Apache License 2.0. The 3D anatomy
assets (`models/brain.glb`) and derived anatomical metadata are redistributed
under **CC BY-SA 4.0**, subject to the preserved source-specific notices above.
Modified versions of these assets remain available under the same licence.

The orthogonal section viewer uses aligned atlas voxels rather than reconstructed mesh caps. This remains a population-average educational model and is not intended for clinical use.

## Neonatal anatomy references

- Schuh A, Makropoulos A, Robinson EC, et al. *Unbiased construction of a temporally consistent morphological atlas of neonatal brain development*. 2018. The bundled 40-week T2 volume, tissue segmentation, and 87-region structural segmentation are adapted from the Developing Human Connectome Project volumetric atlas under **CC BY 4.0**: https://gin.g-node.org/BioMedIA/dhcp-volumetric-atlas-groupwise
- Meijler G, Mohammad K, editors. *Neonatal Brain Injury: An Illustrated Guide for Clinicians Counselling Parents and Caregivers*. Springer Nature; 2024. Chapter 2, Normal Anatomy. CC BY 4.0. https://doi.org/10.1007/978-3-031-55972-3
- Rutherford MA, editor. *MRI of the Neonatal Brain*. https://www.mrineonatalbrain.com/. Used as a textual anatomy and maturation reference. Website figures are not redistributed.

## Interaction references

The anatomical orientation controls were informed by the public Neurotorium 3D Brain Atlas interface. Keyboard-accessible learning-mode navigation was informed by the public NeuroGlance interface. These are UX references only; this repository does not redistribute their models, imagery, text, or source code.

## Cerebral arterial territory references

- Núñez C, Arca G, Agut T, Stephan-Otto C, García-Alix A. *Precise neonatal arterial ischemic stroke classification with a three-dimensional map of the arterial territories of the neonatal brain.* Pediatric Research. 2020;87:1231–1236. https://doi.org/10.1038/s41390-019-0724-x. The educational slice-territory topology is informed by this neonatal ATNB work; its original atlas files and figures are not redistributed here.
- Liu CF, et al. *Digital 3D Brain MRI Arterial Territories Atlas.* Scientific Reports. 2023;13:2890. https://doi.org/10.1038/s41598-023-29381-5. Used to cross-check the major ACA, MCA, PCA, vertebrobasilar and deep-perforator organization.

## Cerebral venous anatomy references

- Chaiyamoon A, et al. *Cerebral circulation 1: anatomy.* BJA Education. 2021;21(11):390–395. https://doi.org/10.1016/j.bjae.2021.07.001. Used for the superficial/deep division and the courses of the Sylvian, Trolard, Labbé, internal cerebral, basal and Galenic pathways.
- Chaigasame O, et al. *Neuroanatomy, Brain Veins.* StatPearls. National Center for Biotechnology Information. https://www.ncbi.nlm.nih.gov/books/NBK546605/. Used to cross-check named superficial veins, dural-sinus connections, deep venous convergence and documented normal variation.
- Idiculla PS, et al. *Cerebral venous thrombosis: a spectrum of imaging findings.* Singapore Medical Journal. 2022;63(9):497–507. https://doi.org/10.11622/smedj.2021114. Used to cross-check MR-visible sinus and deep-vein relationships. No source figures are redistributed.

## MRI venography surface

- **“CNS Venography 3D SR Nevit Dilmen.stl”**, © Nevit Dilmen, CC BY-SA
  3.0 Unported:
  https://commons.wikimedia.org/wiki/File:CNS_Venography_3D_SR_Nevit_Dilmen.stl
- Changes: coordinate-axis remapping, proportional fitting, removal of a
  duplicate rendered system, surface registration and material styling for
  integration into this atlas.

## Reference-image policy

Published figures, screenshots and videos supplied as anatomical references
are not redistributed by this project. Citations in this file identify works
used to check anatomy; a citation does not imply that their figures or source
files are included.

## Bundled software

React, ReactDOM, Babel, Three.js, its loaders, Draco, Electron and Chromium
retain their respective licences. See `THIRD_PARTY_NOTICES.md` and, in desktop
packages, `LICENSE.electron.txt` and `LICENSES.chromium.html`.
