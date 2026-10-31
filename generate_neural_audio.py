import asyncio
import os
import wave
import edge_tts

VOICE = "en-US-ChristopherNeural"
AUDIO_DIR = "demo_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

NARRATIONS = [
    {
        "id": "01_intro_predict",
        "title": "Consensus Molecular Property Predictor",
        "route": "/predict",
        "speech": (
            "Welcome to BioGraph AI — an enterprise-grade Computer-Aided Drug Discovery platform powered by Deep Graph Neural Networks. "
            "We begin in the Molecular Property Predictor. Rather than relying on simple fingerprints, BioGraph AI constructs attributed "
            "molecular graphs directly from chemical SMILES. Here, we can select candidate molecules like Ibuprofen or Atorvastatin, "
            "and run simultaneous consensus inference across MPNN, GIN, GAT, and GCN architectures alongside epistemic uncertainty estimation."
        )
    },
    {
        "id": "02_viewer3d",
        "title": "3D Stereochemical Conformation Studio",
        "route": "/viewer",
        "speech": (
            "Moving to the 3D Conformation Studio, BioGraph AI uses ETKDG distance geometry physics and MMFF94 force-field relaxation "
            "to compute low-energy stereochemical conformations. The result is fully interactive in real-time WebGL, allowing medicinal chemists "
            "to inspect 3D geometries, steric hindrance, and dihedral bond angles with complete freedom."
        )
    },
    {
        "id": "03_admet",
        "title": "In Silico ADMET & Bioavailability Radar",
        "route": "/admet",
        "speech": (
            "Next is the In Silico ADMET Radar. Drug candidates frequently fail in clinical trials due to poor pharmacokinetics. "
            "BioGraph AI provides real-time multi-parametric oral bioavailability profiling, mapping against Lipinski's Rule of Five, "
            "Veber, Ghose, and Egan rules, while instantly flagging toxicophores and PAINS alerts."
        )
    },
    {
        "id": "04_lead_opt",
        "title": "In Silico Lead Optimization",
        "route": "/analogs",
        "speech": (
            "In the Lead Optimization studio, we perform automated matched molecular pair analysis. "
            "The platform suggests bioisosteric replacements, selective fluorinations, and polar surface tuning, "
            "ranking each candidate analog by its predicted binding delta and quantitative estimate of drug-likeness."
        )
    },
    {
        "id": "05_chem_space",
        "title": "2D Chemical Space Explorer",
        "route": "/space",
        "speech": (
            "To understand structural diversity, the Chemical Space explorer projects high-dimensional 2048-bit Morgan fingerprints "
            "into two-dimensional PCA space. Researchers can visually identify chemical clusters, navigate scaffold neighborhoods, "
            "and retrieve nearest neighbors using Tanimoto structural similarity."
        )
    },
    {
        "id": "06_gnn_explain",
        "title": "Explainable AI via GNNExplainer",
        "route": "/explain",
        "speech": (
            "Explainability is paramount in drug discovery. BioGraph AI integrates GNNExplainer to eliminate black-box opacity. "
            "Using information-theoretic graph mutual information masking, the platform highlights the exact atomic subgraphs "
            "and pharmacophore functional groups that drive the model's predictions."
        )
    },
    {
        "id": "07_batch",
        "title": "High-Throughput Batch Virtual Screening",
        "route": "/batch",
        "speech": (
            "Finally, the High-Throughput Batch Screening engine evaluates thousands of compound candidates in parallel on CPU. "
            "Compounds are ranked by a composite Drug Desirability Score that balances bioactivity, blood-brain barrier permeability, "
            "and toxicity liabilities, ready for instant CSV export."
        )
    },
    {
        "id": "08_outro",
        "title": "Conclusion & Open Source",
        "route": "/predict",
        "speech": (
            "BioGraph AI combines cutting-edge graph deep learning with zero scaffold leakage and enterprise-grade reliability. "
            "The entire project is open source on GitHub, built with PyTorch Geometric, RDKit, FastAPI, and React. "
            "Connect with me on LinkedIn and explore the codebase today."
        )
    }
]

async def generate_all():
    durations = {}
    for item in NARRATIONS:
        mp3_path = os.path.join(AUDIO_DIR, f"{item['id']}.mp3")
        wav_path = os.path.join(AUDIO_DIR, f"{item['id']}.wav")
        print(f"Generating audio for {item['id']}...")
        
        # Rate slightly brisk (+3%) for natural, engaging cadence
        comm = edge_tts.Communicate(item["speech"], voice=VOICE, rate="+3%", pitch="+0Hz")
        await comm.save(mp3_path)
        
        # Convert to WAV with high quality
        os.system(f'ffmpeg -y -i "{mp3_path}" -ar 44100 -ac 2 "{wav_path}" >nul 2>&1')
        
        with wave.open(wav_path, "rb") as w:
            dur = w.getnframes() / float(w.getframerate())
        durations[item["id"]] = dur
        print(f"  {item['id']}: {dur:.2f}s")
        
    return durations

if __name__ == "__main__":
    durations = asyncio.run(generate_all())
    print("\nAll audio clips generated successfully!")
    print(durations)

