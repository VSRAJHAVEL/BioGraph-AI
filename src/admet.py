"""
ADMET & In Silico Drug-Likeness Profiling Engine.
Computes physicochemical descriptors, Lipinski Rule of 5, Veber, Ghose, Egan,
QED, PAINS filter alerts, Brenk toxicophores, and Bioavailability Radar coordinates.
"""
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski, Crippen, QED
from rdkit.Chem.FilterCatalog import FilterCatalog, FilterCatalogParams

# Initialize FilterCatalogs for PAINS and BRENK structural alerts
_pains_params = FilterCatalogParams()
_pains_params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS)
PAINS_CATALOG = FilterCatalog(_pains_params)

_brenk_params = FilterCatalogParams()
_brenk_params.AddCatalog(FilterCatalogParams.FilterCatalogs.BRENK)
BRENK_CATALOG = FilterCatalog(_brenk_params)


def compute_admet_profile(mol_or_smiles: Any) -> Dict[str, Any]:
    """
    Compute comprehensive in silico ADMET and drug-likeness profile.
    
    Args:
        mol_or_smiles: RDKit Mol object or SMILES string.
        
    Returns:
        Dictionary containing descriptors, rule evaluations, alerts, and scores.
    """
    if isinstance(mol_or_smiles, str):
        mol = Chem.MolFromSmiles(mol_or_smiles)
    else:
        mol = mol_or_smiles

    if mol is None:
        raise ValueError("Invalid molecule provided for ADMET calculation.")

    # 1. Fundamental Physicochemical Descriptors
    mw = float(Descriptors.MolWt(mol))
    logp = float(Crippen.MolLogP(mol))
    tpsa = float(Descriptors.TPSA(mol))
    hbd = int(Lipinski.NumHDonors(mol))
    hba = int(Lipinski.NumHAcceptors(mol))
    rot_bonds = int(Lipinski.NumRotatableBonds(mol))
    heavy_atoms = int(mol.GetNumHeavyAtoms())
    aromatic_rings = int(Lipinski.NumAromaticRings(mol))
    fraction_csp3 = float(Descriptors.FractionCSP3(mol))
    molar_refractivity = float(Crippen.MolMR(mol))
    qed_score = float(QED.qed(mol))

    # Synthetic Accessibility Approximation (heuristic based on complexity, rings, chiral centers)
    num_chiral = len(Chem.FindMolChiralCenters(mol, includeUnassigned=True))
    num_rings = Descriptors.RingCount(mol)
    bertz = Descriptors.BertzCT(mol)
    # Normalized complexity heuristic between 1.0 (very easy) and 10.0 (very hard)
    sascore_est = min(10.0, max(1.0, 1.0 + (bertz / 250.0) + (num_chiral * 0.4) + (max(0, num_rings - 2) * 0.5)))

    # 2. Rule of 5 (Lipinski)
    lipinski_violations = []
    if mw > 500:
        lipinski_violations.append(f"MW > 500 ({mw:.1f} Da)")
    if logp > 5.0:
        lipinski_violations.append(f"LogP > 5.0 ({logp:.2f})")
    if hbd > 5:
        lipinski_violations.append(f"HBD > 5 ({hbd})")
    if hba > 10:
        lipinski_violations.append(f"HBA > 10 ({hba})")

    lipinski_pass = len(lipinski_violations) <= 1

    # 3. Veber Rule (Oral Bioavailability)
    veber_violations = []
    if rot_bonds > 10:
        veber_violations.append(f"Rotatable Bonds > 10 ({rot_bonds})")
    if tpsa > 140.0:
        veber_violations.append(f"TPSA > 140 Å² ({tpsa:.1f})")
    veber_pass = len(veber_violations) == 0

    # 4. Ghose Filter
    ghose_violations = []
    if not (160 <= mw <= 480):
        ghose_violations.append(f"MW not in [160, 480] ({mw:.1f})")
    if not (-0.4 <= logp <= 5.6):
        ghose_violations.append(f"LogP not in [-0.4, 5.6] ({logp:.2f})")
    if not (40 <= molar_refractivity <= 130):
        ghose_violations.append(f"MR not in [40, 130] ({molar_refractivity:.1f})")
    if not (20 <= heavy_atoms <= 70):
        ghose_violations.append(f"Heavy atoms not in [20, 70] ({heavy_atoms})")
    ghose_pass = len(ghose_violations) == 0

    # 5. Egan Filter (Absorption)
    egan_violations = []
    if logp > 5.88:
        egan_violations.append(f"LogP > 5.88 ({logp:.2f})")
    if tpsa > 131.6:
        egan_violations.append(f"TPSA > 131.6 ({tpsa:.1f})")
    egan_pass = len(egan_violations) == 0

    # 6. PAINS Filter (Pan-Assay Interference Compounds)
    pains_matches = []
    for entry in PAINS_CATALOG.GetMatches(mol):
        pains_matches.append(entry.GetDescription())

    # 7. Brenk Filter (Toxicophores & Reactive Groups)
    brenk_matches = []
    for entry in BRENK_CATALOG.GetMatches(mol):
        brenk_matches.append(entry.GetDescription())

    # 8. Bioavailability Radar Coordinates (Normalized to [0, 1] relative to drug-like box)
    # Axes: LIPO (LogP), SIZE (MW), POLAR (TPSA), INSOLU (LogS proxy/LogP), INSATU (FractionCsp3), FLEX (RotBonds)
    # Optimal ranges:
    # LIPO: -0.7 to 5.0
    # SIZE: 150 to 500
    # POLAR: 20 to 130
    # INSOLU: 0 to 6
    # INSATU: 0.25 to 1.0
    # FLEX: 0 to 9
    radar_coords = {
        "LIPO": float(np.clip((logp - (-0.7)) / (5.0 - (-0.7)), 0.05, 1.2)),
        "SIZE": float(np.clip((mw - 150) / (500 - 150), 0.05, 1.2)),
        "POLAR": float(np.clip((tpsa - 20) / (130 - 20), 0.05, 1.2)),
        "INSOLU": float(np.clip(max(0, logp) / 6.0, 0.05, 1.2)),
        "INSATU": float(np.clip(fraction_csp3, 0.05, 1.2)),
        "FLEX": float(np.clip(rot_bonds / 9.0, 0.05, 1.2))
    }

    return {
        "descriptors": {
            "Molecular Weight": mw,
            "LogP": logp,
            "TPSA": tpsa,
            "H-Bond Donors": hbd,
            "H-Bond Acceptors": hba,
            "Rotatable Bonds": rot_bonds,
            "Heavy Atoms": heavy_atoms,
            "Aromatic Rings": aromatic_rings,
            "Fraction Csp3": fraction_csp3,
            "Molar Refractivity": molar_refractivity,
            "QED": qed_score,
            "SA Score (est)": sascore_est
        },
        "filters": {
            "Lipinski": {
                "passed": lipinski_pass,
                "num_violations": len(lipinski_violations),
                "violations": lipinski_violations
            },
            "Veber": {
                "passed": veber_pass,
                "num_violations": len(veber_violations),
                "violations": veber_violations
            },
            "Ghose": {
                "passed": ghose_pass,
                "num_violations": len(ghose_violations),
                "violations": ghose_violations
            },
            "Egan": {
                "passed": egan_pass,
                "num_violations": len(egan_violations),
                "violations": egan_violations
            }
        },
        "alerts": {
            "PAINS": {
                "has_alerts": len(pains_matches) > 0,
                "count": len(pains_matches),
                "descriptions": pains_matches
            },
            "Brenk": {
                "has_alerts": len(brenk_matches) > 0,
                "count": len(brenk_matches),
                "descriptions": brenk_matches
            }
        },
        "radar": radar_coords
    }
