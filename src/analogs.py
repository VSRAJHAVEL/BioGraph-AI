"""
In Silico Lead Optimization & Molecular Analog Generator.
Systematically generates bioisosteric and R-group substituted chemical analogs,
evaluates property shifts (Delta logS, Delta BBBP, Delta Tox), and discovers Pareto-optimal leads.
"""
from typing import List, Dict, Any, Optional
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, Descriptors, QED

from src.admet import compute_admet_profile
from src.ensemble import predict_ensemble

RDLogger.DisableLog('rdApp.*')

# Common medicinal chemistry transformation rules
MEDCHEM_RULES = [
    # Aromatic functional group replacements
    {"name": "+Fluorine (-F)", "smarts": "[c:1][H]", "repl": "[c:1]F", "rationale": "Improves metabolic stability & lipophilicity"},
    {"name": "+Chlorine (-Cl)", "smarts": "[c:1][H]", "repl": "[c:1]Cl", "rationale": "Enhances binding cavity packing"},
    {"name": "+Methyl (-CH3)", "smarts": "[c:1][H]", "repl": "[c:1]C", "rationale": "Fills hydrophobic subpocket"},
    {"name": "+Trifluoromethyl (-CF3)", "smarts": "[c:1][H]", "repl": "[c:1]C(F)(F)F", "rationale": "Strongly enhances lipophilic binding"},
    {"name": "+Hydroxyl (-OH)", "smarts": "[c:1][H]", "repl": "[c:1]O", "rationale": "Improves aqueous solubility (H-bond donor)"},
    {"name": "+Methoxy (-OCH3)", "smarts": "[c:1][H]", "repl": "[c:1]OC", "rationale": "H-bond acceptor without acidic proton"},
    {"name": "+Amino (-NH2)", "smarts": "[c:1][H]", "repl": "[c:1]N", "rationale": "Basic center, enhances ionic interactions"},
    {"name": "+Cyano (-C#N)", "smarts": "[c:1][H]", "repl": "[c:1]C#N", "rationale": "Linear polar group, bioisosteric to halide"},
    {"name": "+Methylsulfonyl (-SO2CH3)", "smarts": "[c:1][H]", "repl": "[c:1]S(=O)(=O)C", "rationale": "High polarity, decreases lipophilicity"},
    
    # Functional group bioisosteres
    {"name": "Ester -> Amide", "smarts": "[C:1](=O)[O:2][C:3]", "repl": "[C:1](=O)[N:2][C:3]", "rationale": "Improves hydrolytic stability in plasma"},
    {"name": "Acid -> Tetrazole (Bioisostere)", "smarts": "[C:1](=O)[OH]", "repl": "[C:1]c1nnnn1", "rationale": "Non-classical carboxylic acid bioisostere"},
    {"name": "Phenol -> Fluoro-benzene", "smarts": "[c:1][OH]", "repl": "[c:1]F", "rationale": "Blocks Phase-II glucuronidation metabolism"}
]


def generate_analogs(parent_smiles: str, max_analogs: int = 15) -> List[Dict[str, Any]]:
    """
    Generate chemically plausible analogs of the parent molecule.
    
    Args:
        parent_smiles: SMILES string of the lead compound.
        max_analogs: Maximum number of distinct valid analogs to generate.
        
    Returns:
        List of generated analog dictionaries with SMILES and transformation details.
    """
    mol = Chem.MolFromSmiles(parent_smiles)
    if mol is None:
        return []

    # Explicit hydrogens for aromatic replacement rules
    mol_with_h = Chem.AddHs(mol)
    generated = {}

    for rule in MEDCHEM_RULES:
        rxn_smarts = f"({rule['smarts']})>>({rule['repl']})"
        try:
            rxn = AllChem.ReactionFromSmarts(rxn_smarts)
            # Try on mol or mol_with_h
            reactants = (mol_with_h,) if "[H]" in rule['smarts'] else (mol,)
            products = rxn.RunReactants(reactants)

            for prod_tuple in products:
                prod = prod_tuple[0]
                try:
                    prod = Chem.RemoveHs(prod)
                    Chem.SanitizeMol(prod)
                    smi = Chem.MolToSmiles(prod)
                    # Filter out identity or duplicates
                    if smi and smi != parent_smiles and smi not in generated:
                        generated[smi] = {
                            "smiles": smi,
                            "transformation": rule["name"],
                            "rationale": rule["rationale"]
                        }
                        if len(generated) >= max_analogs:
                            break
                except Exception:
                    continue
        except Exception:
            continue

        if len(generated) >= max_analogs:
            break

    return list(generated.values())


def evaluate_lead_optimization(
    parent_smiles: str,
    target_dataset: str = "esol",
    max_analogs: int = 12
) -> Dict[str, Any]:
    """
    Generate analogs and evaluate property shifts against the parent compound.
    """
    parent_admet = compute_admet_profile(parent_smiles)
    parent_pred = predict_ensemble(parent_smiles, target_dataset)
    parent_val = float(parent_pred["mean"][0])

    analogs = generate_analogs(parent_smiles, max_analogs=max_analogs)
    analog_results = []

    for item in analogs:
        smi = item["smiles"]
        try:
            admet = compute_admet_profile(smi)
            pred = predict_ensemble(smi, target_dataset)
            val = float(pred["mean"][0])
            delta = val - parent_val

            analog_results.append({
                "SMILES": smi,
                "Transformation": item["transformation"],
                "Rationale": item["rationale"],
                "Predicted Value": val,
                "Delta": delta,
                "QED": admet["descriptors"]["QED"],
                "MW": admet["descriptors"]["Molecular Weight"],
                "LogP": admet["descriptors"]["LogP"],
                "TPSA": admet["descriptors"]["TPSA"],
                "Lipinski Pass": admet["filters"]["Lipinski"]["passed"]
            })
        except Exception:
            continue

    return {
        "parent_smiles": parent_smiles,
        "parent_val": parent_val,
        "parent_qed": parent_admet["descriptors"]["QED"],
        "target_dataset": target_dataset,
        "analogs": analog_results
    }
