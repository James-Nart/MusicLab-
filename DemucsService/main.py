import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional

import librosa
import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ============================================================
# CONFIG
# ============================================================
WWWROOT = Path(r"C:\Users\LAPTOP\Desktop\MUSIC LAB\Backend\MusicLab.Api\wwwroot")

UPLOADS_DIR   = WWWROOT / "uploads"
SEPARATED_DIR = WWWROOT / "separated"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SEPARATED_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# NOTE NAMES
# ============================================================
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# ============================================================
# KEY DETECTION (Krumhansl-Schmuckler algorithm)
# ============================================================
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def detect_key(audio_path: Path):
    """Detect musical key using Krumhansl-Schmuckler algorithm."""
    print(f"[KEY] Analyzing {audio_path.name}...")

    try:
        y, sr = librosa.load(str(audio_path), sr=22050, mono=True)
        y_harmonic = librosa.effects.harmonic(y, margin=8)
        chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr)
        avg_chroma = np.mean(chroma, axis=1)

        major_scores = []
        minor_scores = []

        for shift in range(12):
            major_shifted = np.roll(MAJOR_PROFILE, shift)
            minor_shifted = np.roll(MINOR_PROFILE, shift)
            major_corr = np.corrcoef(avg_chroma, major_shifted)[0, 1]
            minor_corr = np.corrcoef(avg_chroma, minor_shifted)[0, 1]
            major_scores.append(major_corr)
            minor_scores.append(minor_corr)

        best_major_idx = int(np.argmax(major_scores))
        best_minor_idx = int(np.argmax(minor_scores))
        best_major_score = major_scores[best_major_idx]
        best_minor_score = minor_scores[best_minor_idx]

        if best_major_score >= best_minor_score:
            key = NOTES[best_major_idx]
            mode = "major"
            confidence = float(best_major_score)
            display = f"{key} major"
        else:
            key = NOTES[best_minor_idx]
            mode = "minor"
            confidence = float(best_minor_score)
            display = f"{key} minor"

        print(f"[KEY] Detected: {display} (confidence: {confidence:.2f})")

        return {
            "key": key,
            "mode": mode,
            "display": display,
            "confidence": round(confidence, 3),
            "key_pitch": best_major_idx if mode == "major" else best_minor_idx,
        }

    except Exception as e:
        print(f"[KEY] ERROR: {e}")
        return {"key": "C", "mode": "major", "display": "C major", "confidence": 0.0, "key_pitch": 0}


# ============================================================
# ENHANCED CHORD DETECTION V5
# ============================================================

# 16 chord types × 12 roots = 192 total chords
CHORD_TYPES = {
    "":       [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],  # Major
    "m":      [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],  # Minor
    "7":      [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],  # Dominant 7th
    "maj7":   [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],  # Major 7th
    "m7":     [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],  # Minor 7th
    "sus4":   [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],  # Sus4
    "sus2":   [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],  # Sus2
    "dim":    [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],  # Diminished
    "dim7":   [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],  # Diminished 7th
    "aug":    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],  # Augmented
    "6":      [1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],  # Major 6th
    "m6":     [1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0],  # Minor 6th
    "9":      [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],  # Dominant 9th
    "m9":     [1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0],  # Minor 9th
    "add9":   [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0],  # Add 9
    "m7b5":   [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],  # Half-diminished
}

# Chord weight priorities (favor simpler chords)
CHORD_WEIGHTS = {
    "":       1.00,  # Major - most common
    "m":      1.00,  # Minor - most common
    "7":      0.95,
    "maj7":   0.92,
    "m7":     0.92,
    "sus4":   0.85,
    "sus2":   0.80,
    "6":      0.85,
    "m6":     0.80,
    "add9":   0.80,
    "9":      0.75,
    "m9":     0.75,
    "dim":    0.70,
    "dim7":   0.65,
    "aug":    0.65,
    "m7b5":   0.60,
}

# Build all chord templates
CHORD_TEMPLATES = {}
CHORD_INTERVALS = {}
CHORD_WEIGHTS_MAP = {}

for i, root_note in enumerate(NOTES):
    for chord_type, template in CHORD_TYPES.items():
        chord_name = f"{root_note}{chord_type}"
        rolled = np.roll(template, i)
        CHORD_TEMPLATES[chord_name] = np.array(rolled, dtype=float)
        intervals = [j for j, v in enumerate(rolled) if v == 1]
        CHORD_INTERVALS[chord_name] = intervals
        CHORD_WEIGHTS_MAP[chord_name] = CHORD_WEIGHTS[chord_type]


def get_diatonic_chords(key_pitch, mode):
    """Return the 7 chords that naturally belong to a key."""
    if mode == "major":
        intervals = [0, 2, 4, 5, 7, 9, 11]
        qualities = ["", "m", "m", "", "", "m", "dim"]
    else:
        intervals = [0, 2, 3, 5, 7, 8, 10]
        qualities = ["m", "dim", "", "m", "m", "", ""]

    diatonic = []
    for interval, quality in zip(intervals, qualities):
        note = NOTES[(key_pitch + interval) % 12]
        diatonic.append(f"{note}{quality}")

    return diatonic


def detect_chords(audio_path: Path, hop_seconds: float = 0.1):
    """
    Enhanced chord detection v5:
    - Fine time resolution (0.1s = 10x per second)
    - Onset-based change detection (finds real chord boundaries)
    - Adaptive smoothing (only removes flickers < 0.3s)
    - Key-weighted scoring
    - Prevents chord changes closer than 0.4s
    """
    print(f"[CHORDS] Analyzing {audio_path.name}...")

    # Detect key first (used to weight chord probability)
    key_info = detect_key(audio_path)
    diatonic_chords = get_diatonic_chords(key_info["key_pitch"], key_info["mode"])
    print(f"[CHORDS] Expected chords in {key_info['display']}: {diatonic_chords}")

    # Load audio
    y, sr = librosa.load(str(audio_path), sr=22050, mono=True)

    # HPSS: Remove drums for cleaner harmonic content
    y_harmonic = librosa.effects.harmonic(y, margin=8)

    # Detect tempo (for display only, not for syncing)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=512)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=512)
    print(f"[CHORDS] Tempo: {float(tempo):.1f} BPM")

    # Fine-grained chroma (0.1 sec resolution = 10 frames per second)
    hop_length = int(sr * hop_seconds)
    chroma = librosa.feature.chroma_cqt(
        y=y_harmonic,
        sr=sr,
        hop_length=hop_length,
        n_chroma=12,
        bins_per_octave=36,
    )

    # Detect frame-level chord (fine granularity)
    frame_chords = []
    frame_scores = []

    for t in range(chroma.shape[1]):
        frame = chroma[:, t]

        if frame.sum() < 0.05:
            frame_chords.append("N")
            frame_scores.append(0)
            continue

        frame = frame / (frame.sum() + 1e-6)

        best_score = -1
        best_chord = "N"

        for chord_name, template in CHORD_TEMPLATES.items():
            template_norm = template / template.sum()
            similarity = np.dot(frame, template_norm) / (
                np.linalg.norm(frame) * np.linalg.norm(template_norm) + 1e-6
            )
            weighted_score = similarity * CHORD_WEIGHTS_MAP[chord_name]

            # Boost diatonic chords
            if chord_name in diatonic_chords:
                weighted_score *= 1.15

            if weighted_score > best_score:
                best_score = weighted_score
                best_chord = chord_name

        # Minimum confidence threshold
        if best_score < 0.40:
            best_chord = "N"

        frame_chords.append(best_chord)
        frame_scores.append(best_score)

    # SMOOTHING: Adaptive — remove only very short flickers (< 0.3 sec)
    MIN_DURATION_SEC = 0.3
    MIN_FRAMES = int(MIN_DURATION_SEC / hop_seconds)

    smoothed = list(frame_chords)

    # Pass 1: Remove very short runs (likely noise/flickers)
    i = 0
    while i < len(smoothed):
        current = smoothed[i]
        run_length = 1
        while i + run_length < len(smoothed) and smoothed[i + run_length] == current:
            run_length += 1

        # If run is too short AND has neighbors, replace with previous chord
        if run_length < MIN_FRAMES and i > 0 and current != "N":
            prev_chord = smoothed[i - 1]
            for j in range(run_length):
                smoothed[i + j] = prev_chord

        i += run_length

    # Pass 2: Build timeline (only where chord CHANGES)
    chord_timeline = []
    last_chord = None

    for t, chord in enumerate(smoothed):
        if chord != last_chord and chord != "N":
            time_sec = t * hop_seconds
            chord_timeline.append({
                "time": round(time_sec, 2),
                "chord": chord,
                "intervals": CHORD_INTERVALS.get(chord, []),
            })
            last_chord = chord

    # Post-process: If two adjacent chord changes are too close (< 0.4 sec), skip
    if len(chord_timeline) > 1:
        filtered_timeline = [chord_timeline[0]]
        for i in range(1, len(chord_timeline)):
            time_gap = chord_timeline[i]["time"] - filtered_timeline[-1]["time"]
            if time_gap < 0.4:
                continue
            filtered_timeline.append(chord_timeline[i])
        chord_timeline = filtered_timeline

    print(f"[CHORDS] Found {len(chord_timeline)} chord changes")

    return {
        "key": key_info,
        "tempo": round(float(tempo), 1),
        "chords": chord_timeline,
    }


# ============================================================
# NOTE DETECTION (Basic Pitch) — kept for future use
# ============================================================
def midi_to_note_name(midi_number: int) -> str:
    octave = (midi_number // 12) - 1
    note = NOTES[midi_number % 12]
    return f"{note}{octave}"


def detect_notes(audio_path: Path, instrument: str = "generic"):
    """Extract individual notes — kept but not used for piano display."""
    print(f"[NOTES] Analyzing {audio_path.name} as {instrument}...")

    try:
        from basic_pitch.inference import predict
        from basic_pitch import ICASSP_2022_MODEL_PATH

        if instrument == "bass":
            onset_threshold = 0.75
            frame_threshold = 0.55
            minimum_note_length = 120
            minimum_frequency = 30
            maximum_frequency = 250
        else:
            onset_threshold = 0.5
            frame_threshold = 0.3
            minimum_note_length = 58
            minimum_frequency = None
            maximum_frequency = None

        model_output, midi_data, note_events = predict(
            str(audio_path),
            model_or_model_path=ICASSP_2022_MODEL_PATH,
            onset_threshold=onset_threshold,
            frame_threshold=frame_threshold,
            minimum_note_length=minimum_note_length,
            minimum_frequency=minimum_frequency,
            maximum_frequency=maximum_frequency,
        )

        notes = []
        for event in note_events:
            notes.append({
                "time": round(float(event[0]), 3),
                "duration": round(float(event[1] - event[0]), 3),
                "midi": int(event[2]),
                "note": midi_to_note_name(int(event[2])),
                "velocity": int(event[3]),
            })

        notes.sort(key=lambda n: n["time"])
        print(f"[NOTES] Detected {len(notes)} notes")
        return notes

    except Exception as e:
        print(f"[NOTES] ERROR: {e}")
        return []


# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI(title="MusicLab AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PYTHON_EXE = sys.executable


class SeparateRequest(BaseModel):
    file_path: str
    track_id: Optional[str] = None

class StemInfo(BaseModel):
    name: str
    url: str

class SeparateResponse(BaseModel):
    success: bool
    message: str
    track_id: str
    stems: list[StemInfo]
    chords_url: Optional[str] = None
    bass_notes_url: Optional[str] = None
    piano_notes_url: Optional[str] = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "demucs + librosa (chord+key v5 fine-grained)",
        "python": sys.version
    }


@app.post("/separate", response_model=SeparateResponse)
def separate(req: SeparateRequest):
    input_path = Path(req.file_path)

    if not input_path.exists():
        raise HTTPException(404, f"File not found: {req.file_path}")

    track_id = req.track_id or input_path.stem

    print(f"\n{'='*60}")
    print(f"[JOB] Starting for: {input_path.name}")
    print(f"[JOB] track_id = {track_id}")
    print(f"{'='*60}\n")

    # STEP 1: DEMUCS
    print("[STEP 1/3] Running Demucs stem separation...")

    cmd = [
        PYTHON_EXE, "-m", "demucs",
        "--mp3",
        "--segment", "7",
        "-o", str(SEPARATED_DIR),
        str(input_path),
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "Separation timed out (> 1 hour)")

    if result.returncode != 0:
        print("[DEMUCS] STDERR:", result.stderr[-1000:])
        raise HTTPException(500, f"Demucs failed: {result.stderr[-500:]}")

    raw_out_dir = SEPARATED_DIR / "htdemucs" / input_path.stem

    if not raw_out_dir.exists():
        raise HTTPException(500, f"Output folder missing: {raw_out_dir}")

    final_dir = SEPARATED_DIR / track_id
    if final_dir.exists():
        shutil.rmtree(final_dir)
    shutil.move(str(raw_out_dir), str(final_dir))

    stems = []
    for stem_name in ["vocals", "drums", "bass", "other"]:
        stem_file = final_dir / f"{stem_name}.mp3"
        if stem_file.exists():
            stems.append(StemInfo(
                name=stem_name,
                url=f"/separated/{track_id}/{stem_name}.mp3"
            ))

    if not stems:
        raise HTTPException(500, "Demucs ran but produced no stem files")

    print(f"[STEP 1/3] ✓ Demucs done. Produced {len(stems)} stems.")

    # STEP 2: ENHANCED CHORD + KEY DETECTION
    print("\n[STEP 2/3] Detecting chords + key (v5 fine-grained)...")

    chords_url = None
    try:
        chord_data = detect_chords(input_path, hop_seconds=0.1)
        chords_file = final_dir / "chords.json"
        with open(chords_file, "w") as f:
            json.dump(chord_data, f, indent=2)
        chords_url = f"/separated/{track_id}/chords.json"
        print(f"[STEP 2/3] ✓ Chords saved: {len(chord_data['chords'])} changes")
        print(f"[STEP 2/3] ✓ Key: {chord_data['key']['display']} @ {chord_data['tempo']} BPM")
    except Exception as e:
        print(f"[STEP 2/3] ✗ Chord detection failed: {e}")
        import traceback
        traceback.print_exc()

    # STEP 3: Note detection skipped
    print("\n[STEP 3/3] Note detection skipped (chords-only mode)")

    bass_notes_url = None
    piano_notes_url = None

    print(f"\n{'='*60}")
    print(f"[JOB] ✓ COMPLETE for track {track_id}")
    print(f"{'='*60}\n")

    return SeparateResponse(
        success=True,
        message="Separation + chord + key analysis complete",
        track_id=track_id,
        stems=stems,
        chords_url=chords_url,
        bass_notes_url=bass_notes_url,
        piano_notes_url=piano_notes_url,
    )


if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print("🎵 MusicLab AI Service (v5 — fine-grained chord detection)")
    print("   Demucs + Librosa")
    print("   0.1s resolution + adaptive smoothing + key-weighted")
    print("=" * 60)
    print(f"   URL: http://localhost:8000")
    print(f"   wwwroot: {WWWROOT}")
    print("=" * 60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)