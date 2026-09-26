# Neonatal anatomy landmark audit

Source comparison: Meijler and Mohammad, *Neonatal Brain Injury* (2024), Chapter 2, Figures 2.1-2.9; Rutherford, *MRI of the Neonatal Brain*, Chapters 3-4.

This audit distinguishes anatomy present in the current 3D mesh from reference landmarks that would require new validated geometry. A landmark is marked represented only when a corresponding named mesh exists. Grouped labels are not claimed when only component meshes exist.

| Reference view | Represented and selectable | Not represented as a discrete mesh |
|---|---|---|
| Low axial | Internal carotid, anterior cerebral, middle cerebral, posterior cerebral and basilar arteries; superior sagittal and straight sinuses; lateral ventricle; choroid plexus; optic chiasm; midbrain; hippocampal/parahippocampal region; cerebellar structures | Separate temporal and occipital horns; confluence of sinuses; upper vermis as one grouped mesh |
| Anterior coronal | Lateral ventricle; corpus callosum; septum pellucidum; caudate; putamen; globus pallidus; choroid plexus | Genu as a separate corpus-callosum segment; anterior limb of internal capsule; separate ventricular horns |
| Mid-coronal | Lateral and third ventricles; corpus callosum; putamen; globus pallidus; thalamic nuclei; pons | Posterior limb of internal capsule; body of corpus callosum as a separate segment; lentiform nucleus as one grouped mesh |
| Posterior coronal | Lateral ventricle; choroid plexus; corpus callosum; thalamic nuclei; midbrain; cerebral arterial branches | Internal cerebral vein; body of corpus callosum as a separate segment |
| Mid-sagittal | Superior, inferior and straight sinuses; basilar, anterior communicating, anterior cerebral, pericallosal and posterior cerebral arteries; septum pellucidum; third ventricle; cerebral aqueduct; fourth ventricle; corpus callosum; fornix; midbrain; pons; cerebellar vermian lobules; medulla | Cavum septi pellucidi as a separate cavity; confluence of sinuses; vein of Galen; interthalamic adhesion; transverse sinus origin |
| Para-sagittal | Lateral ventricle; choroid plexus; caudate; putamen; globus pallidus; thalamic nuclei; hippocampus; parahippocampal gyrus; cerebellar hemisphere | Separate frontal, body, occipital and temporal ventricular horns; internal capsule; grouped lentiform nucleus |
| Ventricular system | Lateral, third and fourth ventricles; septum pellucidum; choroid plexus; cerebral aqueduct | Foramen of Monro; foramina of Luschka; foramen of Magendie; individual ventricular horns |
| Brainstem and cerebellum | Midbrain; pons; medulla; cerebellar peduncles; multiple vermian and hemispheric lobules | Dentate nucleus; superior and inferior colliculi as isolated teaching meshes; complete vermis as one selectable object |
| Term-neonatal maturation | Cortex, deep grey structures, major commissures, many tracts and ventricular anatomy can be displayed | The source mesh is not an MRI intensity model and cannot depict neonatal T1/T2 signal, water content, tissue myelination, germinal matrix remnants or gestation-specific cortical folding with diagnostic fidelity |

## Interpretation boundary

The viewer is an educational surface model. Plane controls reveal existing anatomical surfaces; they do not generate voxel-based MRI slices or histological cut faces. Gestation-specific signal intensity, myelination and injury should not be inferred from colour or opacity.
