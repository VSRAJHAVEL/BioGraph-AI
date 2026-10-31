import os
import wave
import subprocess
from PIL import Image, ImageDraw, ImageFont
import win32com.client

OUTPUT_DIR = "video_build"
os.makedirs(OUTPUT_DIR, exist_ok=True)
FINAL_VIDEO = "biograph_ai_demo.mp4"

SECTIONS = [
    {
        "id": "00_intro",
        "type": "intro",
        "tag": "WELCOME TO BIOGRAPH AI",
        "title": "BioGraph AI",
        "subtitle": "Deep Graph Neural Networks for Molecular Discovery & CADD",
        "bullets": [
            "🧬 End-to-End In Silico Computer-Aided Drug Discovery",
            "⚡ 5 Deep Graph & Classical Models (MPNN, GIN, GAT, GCN, RF)",
            "🛡️ Strict Bemis-Murcko Scaffold Splitting (0% Test Leakage)",
            "🎯 Real-Time 3D Conformations, ADMET Radar & Lead Optimization",
            "🔍 Explainable AI via GNNExplainer Pharmacophore Attribution"
        ],
        "speech": "Welcome to BioGraph AI — an enterprise-grade Computer-Aided Drug Discovery platform that predicts chemical bioactivities, ADMET profiles, and toxicities directly from molecular graphs using Graph Neural Networks and RDKit."
    },
    {
        "id": "01_predictor",
        "type": "feature",
        "image": "docs/screenshots/01_predict_studio.png",
        "step": "FEATURE 01 / 07",
        "title": "Consensus Multi-Model Molecular Predictor",
        "subtitle": "Direct SMILES Graph Featurization with Epistemic Uncertainty Estimation",
        "tags": ["MPNN (NNConv)", "GIN (1-WL)", "GAT (Self-Attention)", "GCN (Spectral)", "Random Forest Baseline"],
        "speech": "First is the Multi-Model Molecular Predictor. It converts raw chemical SMILES into enriched 48-dimensional atomic graphs, running consensus bioactivity predictions across MPNN, GIN, GAT, and GCN models alongside epistemic uncertainty quantification."
    },
    {
        "id": "02_viewer3d",
        "type": "feature",
        "image": "docs/screenshots/02_viewer_3d.png",
        "step": "FEATURE 02 / 07",
        "title": "3D Stereochemical Conformation & Force-Field Studio",
        "subtitle": "ETKDGv3 Distance-Geometry Physics & MMFF94 Energy Relaxation",
        "tags": ["Interactive WebGL", "ETKDGv3 Geometry", "MMFF94 Force Field", "Stereo Isomers", "Conformer Exploration"],
        "speech": "Next, the 3D Conformation Studio generates low-energy stereochemical conformations using ETKDG distance geometry and MMFF94 force-field relaxation, rendered in an interactive real-time WebGL canvas."
    },
    {
        "id": "03_admet",
        "type": "feature",
        "image": "docs/screenshots/03_admet_radar.png",
        "step": "FEATURE 03 / 07",
        "title": "In Silico ADMET & Bioavailability Radar",
        "subtitle": "Multi-Parametric Oral Bioavailability Polygon & Toxicity Alerts",
        "tags": ["Lipinski Rule of 5", "Veber & Egan Rules", "PAINS Toxicophores", "Brenk Alerts", "QED Drug-Likeness"],
        "speech": "The ADMET Radar profiles drug-likeness and oral bioavailability in real-time. It maps physicochemical properties against Lipinski's Rule of Five, Veber, Ghose, and Egan rules, while instantly flagging structural toxicophores and PAINS alerts."
    },
    {
        "id": "04_lead_opt",
        "type": "feature",
        "image": "docs/screenshots/04_lead_optimization.png",
        "step": "FEATURE 04 / 07",
        "title": "In Silico Lead Optimization & Matched Molecular Pairs",
        "subtitle": "Automated Bioisosteric Replacements, Fluorination & Polar Surface Tuning",
        "tags": ["MMP Analysis", "Bioisosteric Tuning", "Polar Surface Area", "Target Delta Affinity", "Analogs Ranking"],
        "speech": "For rational drug design, the In Silico Lead Optimization engine automates matched molecular pair analysis—suggesting bioisosteric substitutions, selective fluorinations, and polar modifications to optimize binding affinity."
    },
    {
        "id": "05_chem_space",
        "type": "feature",
        "image": "docs/screenshots/05_chemical_space.png",
        "step": "FEATURE 05 / 07",
        "title": "2D Chemical Space & Tanimoto Structural Search",
        "subtitle": "High-Dimensional Morgan Fingerprints Projected into 2D PCA Embeddings",
        "tags": ["2048-bit ECFP4", "PCA Projection", "Tanimoto Similarity", "Scaffold Clustering", "Structural Retrieval"],
        "speech": "Explore chemical diversity in the Chemical Space viewer. High-dimensional 2048-bit Morgan fingerprints are projected into 2D PCA space, enabling structural clustering and nearest-neighbor Tanimoto similarity search."
    },
    {
        "id": "06_gnn_explain",
        "type": "feature",
        "image": "docs/screenshots/06_gnn_explainer.png",
        "step": "FEATURE 06 / 07",
        "title": "Explainable AI: GNNExplainer Substructure Attribution",
        "subtitle": "Information-Theoretic Graph Mutual Information Masking",
        "tags": ["Mutual Information", "Pharmacophore Attribution", "Edge Masking", "RDKit 2D Highlights", "XAI Interpretability"],
        "speech": "BioGraph AI delivers rigorous explainability through GNNExplainer. Information-theoretic subgraph mutual information masks isolate the critical pharmacophores and functional groups driving each deep learning prediction."
    },
    {
        "id": "07_batch",
        "type": "feature",
        "image": "docs/screenshots/07_batch_screening.png",
        "step": "FEATURE 07 / 07",
        "title": "High-Throughput Virtual Screening Engine",
        "subtitle": "Batch Library Evaluation & Composite Drug Desirability Score (0-100)",
        "tags": ["Library Screening", "Drug Desirability Score", "Parallel CPU Inference", "CSV Export", "CADD Pipeline"],
        "speech": "Finally, the High-Throughput Batch Screening engine processes thousands of compounds simultaneously, ranking candidate libraries with a multi-objective Drug Desirability Score and one-click data export."
    },
    {
        "id": "08_outro",
        "type": "outro",
        "tag": "ENTERPRISE CADD PLATFORM",
        "title": "BioGraph AI",
        "subtitle": "Graph Deep Learning Meets Cheminformatics for Drug Discovery",
        "bullets": [
            "⭐ Open Source & Fully Reproducible on GitHub",
            "🚀 Built with PyTorch Geometric, RDKit, FastAPI & React",
            "🧪 0% Scaffold Leakage • CPU-Optimized Inference",
            "🤝 Connect on LinkedIn & Share Your Feedback!"
        ],
        "speech": "BioGraph AI bridges graph deep learning with modern cheminformatics for rapid molecular discovery. Check out the project on GitHub, test the platform, and connect to collaborate!"
    }
]

def generate_voiceover(text, wav_path):
    speaker = win32com.client.Dispatch("SAPI.SpVoice")
    # Choose David or Zira
    for v in speaker.GetVoices():
        if "David" in v.GetDescription():
            speaker.Voice = v
            break
    speaker.Rate = 0  # Natural cadence
    stream = win32com.client.Dispatch("SAPI.SpFileStream")
    stream.Open(wav_path, 3)
    speaker.AudioOutputStream = stream
    speaker.Speak(text)
    stream.Close()
    
    with wave.open(wav_path, "rb") as w:
        duration = w.getnframes() / float(w.getframerate())
    return duration

def get_font(size, bold=False):
    font_path = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    try:
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.load_default()

def draw_header_nav(draw, w, tag_text):
    # Top Bar: Background
    draw.rectangle([0, 0, w, 68], fill="#0a0f1d")
    draw.line([(0, 68), (w, 68)], fill="#1e293b", width=1)
    
    # Left Logo & App name
    font_brand = get_font(26, bold=True)
    font_brand_sub = get_font(20, bold=False)
    draw.text((36, 18), "🧬 BioGraph AI", fill="#38bdf8", font=font_brand)
    draw.text((220, 23), "•  Molecular Discovery Platform", fill="#94a3b8", font=font_brand_sub)
    
    # Right Tag Pill
    font_tag = get_font(18, bold=True)
    bbox = font_tag.getbbox(tag_text)
    tw = bbox[2] - bbox[0]
    pill_w = tw + 32
    pill_x1 = w - pill_w - 36
    draw.rounded_rectangle([pill_x1, 14, pill_x1 + pill_w, 54], radius=12, fill="#1e3a8a", outline="#3b82f6", width=1)
    draw.text((pill_x1 + 16, 22), tag_text, fill="#60a5fa", font=font_tag)

def draw_footer_bar(draw, w, h, title, subtitle, tags=None):
    footer_h = 100
    y0 = h - footer_h
    draw.rectangle([0, y0, w, h], fill="#090d18")
    draw.line([(0, y0), (w, y0)], fill="#1e293b", width=1)
    
    font_title = get_font(26, bold=True)
    font_sub = get_font(18, bold=False)
    draw.text((36, y0 + 14), title, fill="#f8fafc", font=font_title)
    draw.text((36, y0 + 54), subtitle, fill="#94a3b8", font=font_sub)
    
    if tags:
        # Draw tag pills on the right side of footer
        font_pill = get_font(14, bold=True)
        cur_x = w - 36
        for tag in reversed(tags[:4]):
            tb = font_pill.getbbox(tag)
            pw = (tb[2] - tb[0]) + 20
            px1 = cur_x - pw
            draw.rounded_rectangle([px1, y0 + 26, cur_x, y0 + 64], radius=8, fill="#1e293b", outline="#334155", width=1)
            draw.text((px1 + 10, y0 + 34), tag, fill="#38bdf8", font=font_pill)
            cur_x = px1 - 12

def create_slide_image(sec, out_path):
    W, H = 1920, 1080
    canvas = Image.new("RGB", (W, H), color="#070b14")
    draw = ImageDraw.Draw(canvas)
    
    if sec["type"] in ("intro", "outro"):
        # Dark biotech gradient style
        for y in range(H):
            # Subtle vertical gradient
            ratio = y / H
            r = int(7 + ratio * 10)
            g = int(11 + ratio * 16)
            b = int(20 + ratio * 35)
            draw.line([(0, y), (W, y)], fill=(r, g, b))
        
        draw_header_nav(draw, W, sec["tag"])
        
        # Central Hero Card
        card_w, card_h = 1380, 800
        cx1 = (W - card_w) // 2
        cy1 = 130
        cx2 = cx1 + card_w
        cy2 = cy1 + card_h
        
        draw.rounded_rectangle([cx1, cy1, cx2, cy2], radius=24, fill="#0d1424", outline="#1e293b", width=2)
        draw.rounded_rectangle([cx1+2, cy1+2, cx2-2, cy1+10], radius=8, fill="#2563eb")
        
        font_hero = get_font(56, bold=True)
        font_sub = get_font(26, bold=False)
        font_bullet = get_font(22, bold=False)
        
        draw.text((cx1 + 80, cy1 + 70), "🧬 " + sec["title"], fill="#38bdf8", font=font_hero)
        draw.text((cx1 + 80, cy1 + 155), sec["subtitle"], fill="#94a3b8", font=font_sub)
        
        # Horizontal accent separator
        draw.line([(cx1 + 80, cy1 + 215), (cx2 - 80, cy1 + 215)], fill="#1e293b", width=2)
        
        # Bullet list
        by = cy1 + 250
        for b in sec["bullets"]:
            draw.rounded_rectangle([cx1 + 80, by + 4, cx1 + 92, by + 24], radius=4, fill="#38bdf8")
            draw.text((cx1 + 115, by), b, fill="#f1f5f9", font=font_bullet)
            by += 80
            
        # Badges at bottom of card
        badges = ["PyTorch Geometric 2.8", "RDKit Cheminformatics", "FastAPI Core", "React 18 Frontend", "MIT License"]
        font_b = get_font(15, bold=True)
        bx = cx1 + 80
        for bd in badges:
            tb = font_b.getbbox(bd)
            bw = (tb[2] - tb[0]) + 24
            draw.rounded_rectangle([bx, cy2 - 70, bx + bw, cy2 - 30], radius=10, fill="#111c33", outline="#1d4ed8", width=1)
            draw.text((bx + 12, cy2 - 60), bd, fill="#60a5fa", font=font_b)
            bx += bw + 18
            
    else:
        # Feature Slide: Image in center with top nav and bottom footer
        draw_header_nav(draw, W, sec["step"])
        
        # Load screenshot
        img_path = sec["image"]
        screenshot = Image.open(img_path).convert("RGB")
        
        # Available area: Y from 69 to 980 (height = 911), X from 20 to 1900 (width = 1880)
        avail_w = 1860
        avail_h = 880
        
        # Resize preserving aspect ratio
        sw, sh = screenshot.size
        scale = min(avail_w / sw, avail_h / sh)
        new_w = int(sw * scale)
        new_h = int(sh * scale)
        screenshot = screenshot.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center in available area
        px = (W - new_w) // 2
        py = 72 + (avail_h - new_h) // 2
        
        # Draw frame / shadow
        draw.rounded_rectangle([px - 4, py - 4, px + new_w + 4, py + new_h + 4], radius=12, fill="#0f172a", outline="#334155", width=2)
        canvas.paste(screenshot, (px, py))
        
        draw_footer_bar(draw, W, H, sec["title"], sec["subtitle"], sec.get("tags"))
        
    canvas.save(out_path, quality=95)

def build_all():
    print("=== STEP 1: Generating Audio and Slides ===")
    segment_files = []
    
    for i, sec in enumerate(SECTIONS):
        sec_id = sec["id"]
        wav_path = os.path.join(OUTPUT_DIR, f"{sec_id}.wav")
        img_path = os.path.join(OUTPUT_DIR, f"{sec_id}.png")
        mp4_path = os.path.join(OUTPUT_DIR, f"{sec_id}.mp4")
        
        print(f"[{i+1}/{len(SECTIONS)}] Processing {sec_id}...")
        
        # 1. Voiceover
        duration = generate_voiceover(sec["speech"], wav_path)
        print(f"   Audio duration: {duration:.2f}s")
        
        # 2. Slide image
        create_slide_image(sec, img_path)
        
        # 3. Render slide video segment (pad audio by 0.6s for comfortable pacing)
        total_sec = duration + 0.6
        
        # ffmpeg command to create single video with audio and loop image
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", img_path,
            "-i", wav_path,
            "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-t", str(total_sec),
            "-r", "30",
            mp4_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            print("FFmpeg error on segment:", res.stderr)
            raise RuntimeError(f"FFmpeg failed on {sec_id}")
            
        segment_files.append(mp4_path)
        
    print("=== STEP 2: Concatenating Segments ===")
    concat_list = os.path.join(OUTPUT_DIR, "concat_list.txt")
    with open(concat_list, "w") as f:
        for seg in segment_files:
            abs_p = os.path.abspath(seg).replace("\\", "/")
            f.write(f"file '{abs_p}'\n")
            
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        FINAL_VIDEO
    ]
    res = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("FFmpeg concat error:", res.stderr)
        raise RuntimeError("Concat failed")
        
    print(f"\n>>> VIDEO GENERATED SUCCESSFULLY: {FINAL_VIDEO} <<<")
    if os.path.exists(FINAL_VIDEO):
        size_mb = os.path.getsize(FINAL_VIDEO) / (1024 * 1024)
        print(f"File size: {size_mb:.2f} MB")

if __name__ == "__main__":
    build_all()

