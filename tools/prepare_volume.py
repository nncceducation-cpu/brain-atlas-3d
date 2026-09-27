"""Prepare the CC BY 4.0 dHCP 40-week atlas for the browser viewer.

This intentionally uses only the Python standard library and NumPy so the
source NIfTI files remain reproducibly convertible without a medical-imaging
runtime dependency.
"""

from __future__ import annotations

import gzip
import json
import shutil
import struct
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".atlas-source" / "dhcp40"
DEST = ROOT / "atlas" / "dhcp40"


DTYPES = {
    2: np.dtype("u1"),
    4: np.dtype("<i2"),
    8: np.dtype("<i4"),
    16: np.dtype("<f4"),
    64: np.dtype("<f8"),
    256: np.dtype("i1"),
    512: np.dtype("<u2"),
    768: np.dtype("<u4"),
}


def read_nifti(path: Path):
    with gzip.open(path, "rb") as handle:
        payload = handle.read()
    endian = "<" if struct.unpack_from("<I", payload, 0)[0] == 348 else ">"
    dims = struct.unpack_from(endian + "8h", payload, 40)
    shape = tuple(int(v) for v in dims[1 : dims[0] + 1])
    datatype = struct.unpack_from(endian + "h", payload, 70)[0]
    offset = int(struct.unpack_from(endian + "f", payload, 108)[0])
    slope = struct.unpack_from(endian + "f", payload, 112)[0] or 1.0
    intercept = struct.unpack_from(endian + "f", payload, 116)[0]
    dtype = DTYPES[datatype].newbyteorder(endian)
    count = int(np.prod(shape))
    data = np.frombuffer(payload, dtype=dtype, count=count, offset=offset).reshape(shape, order="F")
    return data.astype(np.float32) * slope + intercept, shape, datatype


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    t2, shape, _ = read_nifti(SOURCE / "template_t2.nii.gz")
    tissues, tissue_shape, _ = read_nifti(SOURCE / "tissues.nii.gz")
    structures, structure_shape, _ = read_nifti(SOURCE / "structures.nii.gz")
    if not (shape == tissue_shape == structure_shape):
        raise RuntimeError(f"Atlas grids differ: {shape}, {tissue_shape}, {structure_shape}")

    # Tissue label 4 is explicitly background in this atlas. Excluding it is
    # essential: otherwise the intensity window and slice travel include empty
    # padding rather than the neonatal head.
    brain = (tissues > 0) & (tissues != 4)
    valid = t2[brain & np.isfinite(t2)]
    lo, hi = np.percentile(valid, (0.5, 99.5))
    intensity = np.clip((t2 - lo) * 255.0 / (hi - lo), 0, 255).astype(np.uint8)
    intensity[~brain] = 0
    tissue_u8 = np.rint(tissues).astype(np.uint8)
    structure_u8 = np.rint(structures).astype(np.uint8)

    for name, array in (("t2.u8.gz", intensity), ("tissues.u8.gz", tissue_u8), ("structures.u8.gz", structure_u8)):
        with gzip.open(DEST / name, "wb", compresslevel=9) as handle:
            handle.write(array.tobytes(order="F"))

    coords = np.where(brain)
    bounds = [[int(axis.min()), int(axis.max())] for axis in coords]
    structure_centers = {}
    for label in np.unique(structure_u8):
        if not label or label in (84, 85):
            continue
        voxels = np.where(structure_u8 == label)
        structure_centers[str(int(label))] = [round(float(np.median(axis)), 2) for axis in voxels]

    metadata = {
        "title": "dHCP 40-week neonatal volumetric atlas",
        "shape": list(shape),
        "brainBounds": bounds,
        "voxelAxes": ["right-to-left", "posterior-to-anterior", "inferior-to-superior"],
        "storageOrder": "x-fastest",
        "intensityWindowSourcePercentiles": [0.5, 99.5],
        "source": "https://gin.g-node.org/BioMedIA/dhcp-volumetric-atlas-groupwise",
        "license": "CC BY 4.0",
        "citation": "Schuh et al. Unbiased construction of a temporally consistent morphological atlas of neonatal brain development (2018).",
        "files": {"intensity": "t2.u8.gz", "tissues": "tissues.u8.gz", "structures": "structures.u8.gz"},
        "structureCenters": structure_centers,
    }
    (DEST / "volume.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    shutil.copy2(SOURCE / "tissues.txt", DEST / "tissues.txt")
    shutil.copy2(SOURCE / "structures.txt", DEST / "structures.txt")
    print(json.dumps({"shape": shape, "window": [float(lo), float(hi)], "output": str(DEST)}, indent=2))


if __name__ == "__main__":
    main()
