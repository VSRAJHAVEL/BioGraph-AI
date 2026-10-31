import os
import sys
import math
import time
from playwright.sync_api import sync_playwright

RECORDING_DIR = "raw_recordings"
os.makedirs(RECORDING_DIR, exist_ok=True)

# Exact durations from generated neural voice clips
TIMINGS = {
    "01_intro_predict": 33.6,
    "02_viewer3d": 24.3,
    "03_admet": 22.2,
    "04_lead_opt": 18.7,
    "05_chem_space": 19.0,
    "06_gnn_explain": 19.4,
    "07_batch": 18.9,
    "08_outro": 19.4
}

CURSOR_AND_HUD_SCRIPT = """
(() => {
    // 1. Realistic Virtual Mouse Cursor
    if (!document.getElementById('virtual-cursor')) {
        const cursor = document.createElement('div');
        cursor.id = 'virtual-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '24px';
        cursor.style.height = '24px';
        cursor.style.borderRadius = '50%';
        cursor.style.backgroundColor = 'rgba(56, 189, 248, 0.75)';
        cursor.style.border = '2px solid #ffffff';
        cursor.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.9), inset 0 0 6px rgba(255,255,255,0.8)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '999999';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.transition = 'width 0.12s ease, height 0.12s ease, background-color 0.12s ease';
        document.body.appendChild(cursor);

        // Center dot
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.top = '50%';
        dot.style.left = '50%';
        dot.style.width = '4px';
        dot.style.height = '4px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = '#ffffff';
        dot.style.transform = 'translate(-50%, -50%)';
        cursor.appendChild(dot);

        window.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        window.addEventListener('mousedown', () => {
            cursor.style.backgroundColor = 'rgba(244, 63, 94, 0.9)';
            cursor.style.width = '18px';
            cursor.style.height = '18px';
        });
        window.addEventListener('mouseup', () => {
            cursor.style.backgroundColor = 'rgba(56, 189, 248, 0.75)';
            cursor.style.width = '24px';
            cursor.style.height = '24px';
        });
    }

    // 2. Sleek Broadcast HUD Banner (Bottom-Left)
    if (!document.getElementById('demo-hud')) {
        const hud = document.createElement('div');
        hud.id = 'demo-hud';
        hud.style.position = 'fixed';
        hud.style.bottom = '24px';
        hud.style.left = '24px';
        hud.style.zIndex = '999990';
        hud.style.pointerEvents = 'none';
        hud.style.display = 'flex';
        hud.style.alignItems = 'center';
        hud.style.gap = '14px';
        hud.style.padding = '10px 18px';
        hud.style.borderRadius = '16px';
        hud.style.background = 'rgba(10, 15, 29, 0.88)';
        hud.style.backdropFilter = 'blur(16px)';
        hud.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        hud.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
        hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        hud.style.color = '#ffffff';
        hud.style.transition = 'all 0.3s ease';

        hud.innerHTML = `
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e;"></div>
            <div>
                <div style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.1em;" id="hud-badge">LIVE PLATFORM DEMO</div>
                <div style="font-size: 15px; font-weight: 600; color: #f8fafc;" id="hud-title">BioGraph AI Discovery Studio</div>
            </div>
        `;
        document.body.appendChild(hud);
    }
})();
"""

def update_hud(page, badge, title):
    js = f"""
    (() => {{
        const b = document.getElementById('hud-badge');
        const t = document.getElementById('hud-title');
        if (b) b.innerText = "{badge}";
        if (t) t.innerText = "{title}";
    }})();
    """
    try:
        page.evaluate(js)
    except:
        pass

def smooth_move(page, start_x, start_y, end_x, end_y, steps=25, delay=0.015):
    for i in range(steps + 1):
        t = i / steps
        factor = (1 - math.cos(t * math.pi)) / 2
        cur_x = start_x + (end_x - start_x) * factor
        cur_y = start_y + (end_y - start_y) * factor
        page.mouse.move(cur_x, cur_y)
        time.sleep(delay)

def inject_helpers(page):
    page.wait_for_timeout(500)
    # Dismiss any rogue modal
    try:
        page.evaluate("""
            (() => {
                document.querySelectorAll('.fixed.inset-0.z-50').forEach(e => e.remove());
            })();
        """)
    except:
        pass
    page.evaluate(CURSOR_AND_HUD_SCRIPT)

def record_session():
    print("=== Starting Playwright Live Browser Recording ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--use-gl=angle",
                "--use-angle=default"
            ]
        )
        context = browser.new_context(
            record_video_dir=RECORDING_DIR,
            record_video_size={"width": 1920, "height": 1080},
            viewport={"width": 1920, "height": 1080}
        )
        
        # Disable modals and tour permanently in localStorage
        context.add_init_script("""
            localStorage.setItem('biograph-ai-storage', JSON.stringify({
                state: { tourCompleted: true, welcomeModalOpen: false, theme: 'dark' },
                version: 0
            }));
        """)
        
        page = context.new_page()
        
        # ----------------------------------------------------
        # SEGMENT 1: Consensus Molecular Predictor (33.6s)
        # ----------------------------------------------------
        print(">> Segment 1: Molecular Predictor...")
        t_start = time.time()
        page.goto("http://127.0.0.1:8008/predict")
        inject_helpers(page)
        update_hud(page, "MODULE 01 / 07 • PREDICTOR", "Consensus Multi-Model Molecular Predictor")
        
        page.mouse.move(960, 500)
        time.sleep(1.0)
        
        # Move to presets and click Ibuprofen
        smooth_move(page, 960, 500, 480, 290, steps=25)
        time.sleep(0.5)
        
        try:
            page.locator("button", has_text="Ibuprofen").first.click(force=True)
            print("   Clicked Ibuprofen successfully!")
        except Exception as e:
            print("   Click fallback:", e)
            
        time.sleep(2.0)
        
        # Move down to RDKit 2D Kekulé view
        smooth_move(page, 480, 290, 750, 480, steps=25)
        time.sleep(2.0)
        
        # Scroll down smoothly to show all model cards (MPNN, GIN, GAT, GCN, RF)
        for _ in range(6):
            page.mouse.wheel(0, 150)
            time.sleep(0.6)
            
        time.sleep(2.5)
        
        # Hover over model cards
        smooth_move(page, 750, 480, 1100, 600, steps=25)
        time.sleep(2.0)
        
        # Scroll back up to top
        for _ in range(6):
            page.mouse.wheel(0, -150)
            time.sleep(0.4)
            
        elapsed = time.time() - t_start
        rem = TIMINGS["01_intro_predict"] - elapsed
        if rem > 0:
            time.sleep(rem)
            
        # ----------------------------------------------------
        # SEGMENT 2: 3D Conformation Studio (24.3s)
        # ----------------------------------------------------
        print(">> Segment 2: 3D Conformation Studio...")
        t_start = time.time()
        smooth_move(page, 1100, 300, 80, 220, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='viewer']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "MODULE 02 / 07 • 3D VIEWER", "ETKDGv3 & MMFF94 Stereochemical Conformations")
        time.sleep(1.5)
        
        # Move to center of 3D WebGL viewer
        canvas_x, canvas_y = 1000, 550
        smooth_move(page, 80, 220, canvas_x, canvas_y, steps=30)
        time.sleep(0.8)
        
        # Rotate molecule smoothly in 3D WebGL!
        print("   Performing WebGL 3D rotation...")
        page.mouse.down()
        for ang in range(0, 360, 15):
            rad = math.radians(ang)
            cur_x = canvas_x + 180 * math.sin(rad)
            cur_y = canvas_y - 80 * math.cos(rad)
            page.mouse.move(cur_x, cur_y)
            time.sleep(0.04)
        page.mouse.up()
        time.sleep(1.0)
        
        page.mouse.down()
        smooth_move(page, canvas_x, canvas_y, canvas_x, canvas_y - 200, steps=20, delay=0.03)
        page.mouse.up()
        time.sleep(2.0)
        
        elapsed = time.time() - t_start
        rem = TIMINGS["02_viewer3d"] - elapsed
        if rem > 0:
            time.sleep(rem)

        # ----------------------------------------------------
        # SEGMENT 3: In Silico ADMET Radar (22.2s)
        # ----------------------------------------------------
        print(">> Segment 3: ADMET Radar...")
        t_start = time.time()
        smooth_move(page, canvas_x, canvas_y - 200, 80, 260, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='admet']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "MODULE 03 / 07 • ADMET RADAR", "Oral Bioavailability Polygon & Toxicity Screening")
        time.sleep(1.5)
        
        smooth_move(page, 80, 260, 650, 480, steps=25)
        time.sleep(2.5)
        smooth_move(page, 650, 480, 850, 520, steps=25)
        time.sleep(2.0)
        
        for _ in range(4):
            page.mouse.wheel(0, 120)
            time.sleep(0.5)
        time.sleep(2.5)
        
        for _ in range(4):
            page.mouse.wheel(0, -120)
            time.sleep(0.3)
            
        elapsed = time.time() - t_start
        rem = TIMINGS["03_admet"] - elapsed
        if rem > 0:
            time.sleep(rem)

        # ----------------------------------------------------
        # SEGMENT 4: Lead Optimization (18.7s)
        # ----------------------------------------------------
        print(">> Segment 4: Lead Optimization...")
        t_start = time.time()
        smooth_move(page, 850, 400, 80, 380, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='analogs']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "MODULE 04 / 07 • LEAD OPTIMIZATION", "Matched Molecular Pairs & Bioisosteric Replacements")
        time.sleep(1.5)
        
        smooth_move(page, 80, 380, 600, 450, steps=25)
        time.sleep(2.0)
        smooth_move(page, 600, 450, 1050, 520, steps=25)
        time.sleep(2.0)
        
        for _ in range(3):
            page.mouse.wheel(0, 100)
            time.sleep(0.5)
        time.sleep(2.0)
        
        for _ in range(3):
            page.mouse.wheel(0, -100)
            time.sleep(0.3)
            
        elapsed = time.time() - t_start
        rem = TIMINGS["04_lead_opt"] - elapsed
        if rem > 0:
            time.sleep(rem)

        # ----------------------------------------------------
        # SEGMENT 5: Chemical Space (19.0s)
        # ----------------------------------------------------
        print(">> Segment 5: Chemical Space...")
        t_start = time.time()
        smooth_move(page, 1050, 400, 80, 340, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='space']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "MODULE 05 / 07 • CHEMICAL SPACE", "2048-bit Morgan Fingerprints & 2D PCA Embeddings")
        time.sleep(1.5)
        
        smooth_move(page, 80, 340, 800, 450, steps=25)
        time.sleep(2.0)
        smooth_move(page, 800, 450, 1050, 520, steps=25)
        time.sleep(2.0)
        smooth_move(page, 1050, 520, 920, 620, steps=25)
        time.sleep(2.0)
        
        elapsed = time.time() - t_start
        rem = TIMINGS["05_chem_space"] - elapsed
        if rem > 0:
            time.sleep(rem)

        # ----------------------------------------------------
        # SEGMENT 6: GNNExplainer (19.4s)
        # ----------------------------------------------------
        print(">> Segment 6: GNNExplainer Attribution...")
        t_start = time.time()
        smooth_move(page, 920, 620, 80, 300, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='explain']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "MODULE 06 / 07 • EXPLAINABLE AI", "GNNExplainer Substructure & Pharmacophore Attribution")
        time.sleep(1.5)
        
        smooth_move(page, 80, 300, 750, 500, steps=25)
        time.sleep(2.5)
        smooth_move(page, 750, 500, 1150, 500, steps=25)
        time.sleep(2.5)
        
        for _ in range(3):
            page.mouse.wheel(0, 100)
            time.sleep(0.5)
        time.sleep(2.0)
        for _ in range(3):
            page.mouse.wheel(0, -100)
            time.sleep(0.3)
            
        elapsed = time.time() - t_start
        rem = TIMINGS["06_gnn_explain"] - elapsed
        if rem > 0:
            time.sleep(rem)

        # ----------------------------------------------------
        # SEGMENT 7: Batch Screening (18.9s)
        # ----------------------------------------------------
        print(">> Segment 7: Batch Screening...")
        t_start = time.time()
        smooth_move(page, 1150, 400, 80, 420, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='batch']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "MODULE 07 / 07 • BATCH SCREENING", "High-Throughput Virtual Screening & Desirability Score")
        time.sleep(1.5)
        
        smooth_move(page, 80, 420, 700, 480, steps=25)
        time.sleep(1.5)
        for _ in range(5):
            page.mouse.wheel(0, 120)
            time.sleep(0.5)
        time.sleep(2.0)
        for _ in range(5):
            page.mouse.wheel(0, -120)
            time.sleep(0.3)
            
        elapsed = time.time() - t_start
        rem = TIMINGS["07_batch"] - elapsed
        if rem > 0:
            time.sleep(rem)

        # ----------------------------------------------------
        # SEGMENT 8: Outro & Overview (19.4s)
        # ----------------------------------------------------
        print(">> Segment 8: Outro...")
        t_start = time.time()
        smooth_move(page, 700, 480, 80, 180, steps=25)
        time.sleep(0.3)
        page.locator("aside nav a[href*='predict']").click(force=True)
        time.sleep(1.5)
        inject_helpers(page)
        update_hud(page, "BIOGRAPH AI • OPEN SOURCE CADD", "Graph Neural Networks for Drug Discovery")
        time.sleep(1.5)
        
        smooth_move(page, 80, 180, 960, 450, steps=25)
        time.sleep(3.0)
        
        elapsed = time.time() - t_start
        rem = TIMINGS["08_outro"] - elapsed
        if rem > 0:
            time.sleep(rem)
            
        print(">> Closing recording context...")
        page.close()
        context.close()
        browser.close()

    print("=== Browser Session Successfully Recorded ===")

if __name__ == "__main__":
    record_session()
