"""
High-Throughput Virtual Screening & Batch Profiling Engine.
Screens libraries of candidate SMILES across ESOL, BBBP, Tox21, and ADMET filters,
and ranks compounds using a Multi-Objective Drug Desirability Score.
"""
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from rdkit import Chem, RDLogger
from rdkit.Chem import Descriptors, QED

from src.admet import compute_admet_profile
from src.ensemble import predict_all_endpoints

RDLogger.DisableLog('rdApp.*')


def calculate_desirability_score(
    qed: float,
    lipinski_pass: bool,
    log_s: float,
    max_tox_prob: float,
    has_pains: bool,
    prefer_bbb: bool = False,
    bbb_prob: float = 0.5
) -> float:
    """
    Compute a composite Drug Desirability Score between 0.0 and 100.0.
    """
    # 1. QED component (0 - 30 pts)
    score_qed = float(np.clip(qed, 0.0, 1.0)) * 30.0

    # 2. Lipinski compliance (0 or 20 pts)
    score_lipinski = 20.0 if lipinski_pass else 0.0

    # 3. Solubility (0 - 20 pts) - optimal between -1 and -3
    if log_s >= -2.0:
        score_sol = 20.0
    elif log_s >= -4.0:
        score_sol = 15.0
    elif log_s >= -6.0:
        score_sol = 8.0
    else:
        score_sol = 2.0

    # 4. Toxicity Safety (0 - 20 pts)
    score_tox = max(0.0, (1.0 - max_tox_prob) * 20.0)

    # 5. Assay Interference penalty (-10 pts if PAINS alert)
    penalty_pains = -10.0 if has_pains else 0.0

    # 6. BBB adjustment (0 - 10 pts)
    if prefer_bbb:
        score_bbb = bbb_prob * 10.0
    else:
        # Non-CNS drug preference (lower BBB is better)
        score_bbb = (1.0 - bbb_prob) * 10.0

    total = max(0.0, min(100.0, score_qed + score_lipinski + score_sol + score_tox + score_bbb + penalty_pains))
    return round(total, 1)


def screen_batch_molecules(
    smiles_list: List[str],
    compound_names: Optional[List[str]] = None,
    prefer_bbb: bool = False,
    progress_callback: Optional[Any] = None
) -> pd.DataFrame:
    """
    Screen a collection of SMILES strings and return a ranked DataFrame.
    """
    records = []
    total = len(smiles_list)

    for idx, smi in enumerate(smiles_list):
        smi = str(smi).strip()
        if not smi:
            continue

        name = compound_names[idx] if compound_names and idx < len(compound_names) else f"Compound_{idx+1}"
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            continue

        try:
            admet = compute_admet_profile(mol)
            preds = predict_all_endpoints(smi)

            esol_val = float(preds['esol']['mean'][0])
            bbbp_prob = float(preds['bbbp']['mean'][0])
            tox_probs = preds['tox21']['mean']
            max_tox = float(np.max(tox_probs))
            mean_tox = float(np.mean(tox_probs))
            high_risk_tox_count = int(np.sum(tox_probs >= 0.5))

            qed_score = admet['descriptors']['QED']
            lip_pass = admet['filters']['Lipinski']['passed']
            pains_alert = admet['alerts']['PAINS']['has_alerts']

            desirability = calculate_desirability_score(
                qed=qed_score,
                lipinski_pass=lip_pass,
                log_s=esol_val,
                max_tox_prob=max_tox,
                has_pains=pains_alert,
                prefer_bbb=prefer_bbb,
                bbb_prob=bbbp_prob
            )

            records.append({
                "Compound ID": name,
                "SMILES": smi,
                "Desirability Score": desirability,
                "QED": round(qed_score, 3),
                "Solubility logS": round(esol_val, 2),
                "BBB Probability": f"{bbbp_prob*100:.1f}%",
                "Max Tox Risk": f"{max_tox*100:.1f}%",
                "High Risk Assays": high_risk_tox_count,
                "MW (Da)": round(admet['descriptors']['Molecular Weight'], 1),
                "LogP": round(admet['descriptors']['LogP'], 2),
                "TPSA (Å²)": round(admet['descriptors']['TPSA'], 1),
                "Lipinski": "PASS" if lip_pass else f"FAIL ({admet['filters']['Lipinski']['num_violations']})",
                "PAINS Alert": "YES" if pains_alert else "Clean"
            })
        except Exception:
            continue

        if progress_callback:
            progress_callback((idx + 1) / total)

    df = pd.DataFrame(records)
    if not df.empty:
        df = df.sort_values(by="Desirability Score", ascending=False).reset_index(drop=True)
    return df
