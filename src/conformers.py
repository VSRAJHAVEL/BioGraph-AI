"""
3D Conformer Generation and Interactive Molecular Modeling.
Generates energetic 3D molecular conformations using ETKDG and MMFF94 force field,
and constructs py3Dmol visualizer HTML blocks for Streamlit components.
"""
from typing import Tuple, Optional
from rdkit import Chem
from rdkit.Chem import AllChem
import py3Dmol


def generate_3d_conformer(smiles_or_mol: any, seed: int = 42) -> Tuple[Optional[Chem.Mol], Optional[str], Optional[float], str]:
    """
    Generate an energy-minimized 3D conformer for a molecule.
    
    Args:
        smiles_or_mol: SMILES string or RDKit Mol object.
        seed: Random seed for deterministic coordinate embedding.
        
    Returns:
        Tuple of (mol_3d, mol_block_str, energy_kcal_per_mol, status_message)
    """
    if isinstance(smiles_or_mol, str):
        mol = Chem.MolFromSmiles(smiles_or_mol)
    else:
        mol = Chem.Mol(smiles_or_mol)

    if mol is None:
        return None, None, None, "Invalid chemical structure"

    mol_h = Chem.AddHs(mol)

    # Use ETKDG embedding
    params = AllChem.ETKDGv3() if hasattr(AllChem, 'ETKDGv3') else AllChem.ETKDG()
    params.randomSeed = seed
    embed_code = AllChem.EmbedMolecule(mol_h, params)

    if embed_code != 0:
        # Fallback with relaxed distance geometry
        embed_code = AllChem.EmbedMolecule(mol_h, randomSeed=seed, useRandomCoords=True)
        if embed_code != 0:
            return None, None, None, "Failed to embed 3D coordinates"

    # MMFF94 Force Field Optimization
    energy = None
    status = "MMFF94 optimized"
    if AllChem.MMFFHasAllMoleculeParams(mol_h):
        mmff_props = AllChem.MMFFGetMoleculeProperties(mol_h)
        ff = AllChem.MMFFGetMoleculeForceField(mol_h, mmff_props)
        if ff:
            ff.Initialize()
            ff.Minimize(maxIts=500)
            energy = float(ff.CalcEnergy())
    else:
        # Fallback to Universal Force Field (UFF)
        if AllChem.UFFHasAllMoleculeParams(mol_h):
            ff = AllChem.UFFGetMoleculeForceField(mol_h)
            if ff:
                ff.Initialize()
                ff.Minimize(maxIts=500)
                energy = float(ff.CalcEnergy())
                status = "UFF optimized (MMFF params unavailable for this element)"

    mol_block = Chem.MolToMolBlock(mol_h)
    return mol_h, mol_block, energy, status


def render_3dmol_html(
    mol_block: str,
    style: str = "stick",
    surface_type: str = "none",
    spin: bool = False,
    width: int = 500,
    height: int = 400
) -> str:
    """
    Generate self-contained HTML for interactive 3D molecular visualization using py3Dmol.
    
    Args:
        mol_block: MDL MolBlock representation of the 3D conformer.
        style: Visual representation ('stick', 'ball_and_stick', 'sphere', 'wireframe').
        surface_type: Molecular surface representation ('none', 'vdw', 'sas', 'ses').
        spin: Whether to enable auto-rotation.
        width: Viewer width in pixels.
        height: Viewer height in pixels.
        
    Returns:
        HTML string suitable for st.components.v1.html.
    """
    view = py3Dmol.view(width=width, height=height)
    view.addModel(mol_block, "mol")

    if style == "stick":
        view.setStyle({'stick': {'radius': 0.18, 'colorscheme': 'cyanCarbon'}})
    elif style == "ball_and_stick":
        view.setStyle({
            'stick': {'radius': 0.14, 'colorscheme': 'cyanCarbon'},
            'sphere': {'scale': 0.28, 'colorscheme': 'cyanCarbon'}
        })
    elif style == "sphere":
        view.setStyle({'sphere': {'scale': 0.85, 'colorscheme': 'cyanCarbon'}})
    elif style == "wireframe":
        view.setStyle({'line': {'linewidth': 2.0, 'colorscheme': 'cyanCarbon'}})
    else:
        view.setStyle({'stick': {}})

    # Optional molecular surface
    surf_map = {
        'vdw': py3Dmol.VDW,
        'sas': py3Dmol.SAS,
        'ses': py3Dmol.SES
    }
    if surface_type.lower() in surf_map:
        view.addSurface(surf_map[surface_type.lower()], {'opacity': 0.65, 'color': 'lightblue'})

    if spin:
        view.spin(True)

    view.zoomTo()
    view.setBackgroundColor('#0f172a')  # Dark slate background for premium biotech feel
    return view._make_html()
