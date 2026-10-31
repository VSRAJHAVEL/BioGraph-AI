import os
import glob
import subprocess
import wave

AUDIO_DIR = "demo_audio"
RECORDING_DIR = "raw_recordings"
FINAL_OUTPUT = "biograph_ai_real_demo.mp4"

ORDERED_AUDIO_FILES = [
    "01_intro_predict.wav",
    "02_viewer3d.wav",
    "03_admet.wav",
    "04_lead_opt.wav",
    "05_chem_space.wav",
    "06_gnn_explain.wav",
    "07_batch.wav",
    "08_outro.wav"
]

def merge_audio():
    print("=== Step 1: Merging Neural Audio Clips ===")
    combined_wav = os.path.join(AUDIO_DIR, "full_voiceover.wav")
    
    # Write concat list for ffmpeg
    list_path = os.path.join(AUDIO_DIR, "audio_concat.txt")
    with open(list_path, "w") as f:
        for fname in ORDERED_AUDIO_FILES:
            full_p = os.path.abspath(os.path.join(AUDIO_DIR, fname)).replace("\\", "/")
            f.write(f"file '{full_p}'\n")
            
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_path,
        "-c:a", "pcm_s16le",
        combined_wav
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("Audio merge error:", res.stderr)
        raise RuntimeError("Failed to merge audio")
        
    with wave.open(combined_wav, "rb") as w:
        total_audio_dur = w.getnframes() / float(w.getframerate())
    print(f"Merged audio duration: {total_audio_dur:.2f} seconds")
    return combined_wav, total_audio_dur

def build_final_video():
    # 1. Merge audio
    combined_wav, audio_dur = merge_audio()
    
    # 2. Record live Playwright demo
    print("\n=== Step 2: Executing Live Playwright Recording ===")
    # Clear old recordings
    for old_f in glob.glob(os.path.join(RECORDING_DIR, "*.webm")):
        try:
            os.remove(old_f)
        except:
            pass
            
    ret = subprocess.run(["python", "record_live_demo.py"], text=True)
    if ret.returncode != 0:
        raise RuntimeError("record_live_demo.py failed")
        
    # Find recorded webm
    recorded_files = glob.glob(os.path.join(RECORDING_DIR, "*.webm"))
    if not recorded_files:
        raise FileNotFoundError("No recorded webm found in " + RECORDING_DIR)
        
    raw_video = recorded_files[0]
    print(f"Found recorded live video: {raw_video}")
    
    # 3. Mux Video + Audio with FFmpeg
    print("\n=== Step 3: Muxing High-Definition MP4 with Neural Voiceover ===")
    
    # In ffmpeg:
    # Use -vf scale=1920:1080, format=yuv420p
    # Faststart for smooth streaming on LinkedIn
    # Audio with subtle broadcast normalization (loudnorm) so it sounds like a professional documentary/keynote
    mux_cmd = [
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", combined_wav,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "256k",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-shortest",
        "-movflags", "+faststart",
        FINAL_OUTPUT
    ]
    
    res = subprocess.run(mux_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("FFmpeg muxing error:", res.stderr)
        raise RuntimeError("Muxing failed")
        
    size_mb = os.path.getsize(FINAL_OUTPUT) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"🎉 REAL DEMO VIDEO COMPLETED: {FINAL_OUTPUT}")
    print(f"   Size: {size_mb:.2f} MB")
    print(f"=======================================================")

if __name__ == "__main__":
    build_final_video()

