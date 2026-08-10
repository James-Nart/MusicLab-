import { useState, useEffect, useMemo } from "react";

// ============================================================
// PIANO CONFIG
// ============================================================
const PIANO_START_MIDI = 36;  // C2
const PIANO_END_MIDI = 96;    // C7

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function isBlackKey(midi) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

function midiToNoteName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

function buildKeys(startMidi, endMidi) {
  const keys = [];
  for (let midi = startMidi; midi <= endMidi; midi++) {
    keys.push({ midi, name: midiToNoteName(midi), isBlack: isBlackKey(midi) });
  }
  return keys;
}

function formatTime(s) {
  if (isNaN(s) || s === 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ============================================================
// CHORD PARSING
// ============================================================
function parseChord(chordName) {
  if (!chordName || chordName === "N") return null;

  const match = chordName.match(/^([A-G]#?)(.*)$/);
  if (!match) return null;

  const root = match[1];
  const type = match[2];

  const rootPitch = NOTE_NAMES.indexOf(root);
  if (rootPitch === -1) return null;

  const CHORD_INTERVALS = {
    "":     [0, 4, 7],
    "m":    [0, 3, 7],
    "7":    [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "m7":   [0, 3, 7, 10],
    "sus4": [0, 5, 7],
    "dim":  [0, 3, 6],
  };

  const intervals = CHORD_INTERVALS[type] || CHORD_INTERVALS[""];
  const pitchClasses = intervals.map(interval => (rootPitch + interval) % 12);

  return {
    name: chordName,
    root,
    rootPitch,
    pitchClasses,
    displayName: chordName,
  };
}

function getChordMidiNotes(chord) {
  if (!chord) return [];
  const notes = [];
  const rangeStart = 48;  // C3
  const rangeEnd = 84;    // C6

  for (let midi = rangeStart; midi <= rangeEnd; midi++) {
    if (chord.pitchClasses.includes(midi % 12)) {
      notes.push(midi);
    }
  }
  return notes;
}

// ============================================================
// PIANO KEYBOARD
// ============================================================
function PianoKeyboard({ activeMidiNotes, rootMidi, startMidi, endMidi }) {
  const keys = useMemo(() => buildKeys(startMidi, endMidi), [startMidi, endMidi]);
  const whiteKeys = useMemo(() => keys.filter(k => !k.isBlack), [keys]);
  const blackKeyHeight = 100;
  const whiteKeyHeight = 160;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: whiteKeyHeight,
        background: "#0a0a0f",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", display: "flex", height: "100%", width: "100%" }}>
        {whiteKeys.map((key) => {
          const isActive = activeMidiNotes.includes(key.midi);
          const isRoot = key.midi % 12 === rootMidi % 12 && isActive;
          const isCOctave = key.name.startsWith('C') && !key.name.includes('#');

          return (
            <div
              key={key.midi}
              style={{
                position: "relative",
                flex: 1,
                minWidth: 24,
                height: "100%",
                background: isRoot
                  ? "linear-gradient(to bottom, #f7b731 0%, #d4941e 100%)"
                  : isActive
                  ? "linear-gradient(to bottom, #00d9ff 0%, #0099cc 100%)"
                  : "linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 100%)",
                border: "1px solid #333",
                borderRadius: "0 0 4px 4px",
                boxShadow: isRoot
                  ? "0 0 20px rgba(247, 183, 49, 0.9), inset 0 0 12px rgba(255,255,255,0.4)"
                  : isActive
                  ? "0 0 15px rgba(0, 217, 255, 0.7), inset 0 0 10px rgba(255,255,255,0.4)"
                  : "inset 0 -4px 0 rgba(0,0,0,0.15)",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isActive ? "#000" : isCOctave ? "#333" : "rgba(0,0,0,0.35)",
                  fontFamily: "monospace",
                }}
              >
                {isActive || isCOctave ? key.name : ""}
              </span>
            </div>
          );
        })}

        {keys.filter(k => k.isBlack).map((key) => {
          const isActive = activeMidiNotes.includes(key.midi);
          const isRoot = key.midi % 12 === rootMidi % 12 && isActive;
          const whiteKeyIndex = whiteKeys.findIndex(w => w.midi > key.midi) - 1;
          if (whiteKeyIndex < 0) return null;
          const leftPercent = ((whiteKeyIndex + 1) / whiteKeys.length) * 100;
          const blackKeyWidth = Math.max(14, (100 / whiteKeys.length) * 6.5);

          return (
            <div
              key={key.midi}
              style={{
                position: "absolute",
                top: 0,
                left: `calc(${leftPercent}% - ${blackKeyWidth / 2}px)`,
                width: blackKeyWidth,
                height: blackKeyHeight,
                background: isRoot
                  ? "linear-gradient(to bottom, #f7b731 0%, #b8830f 100%)"
                  : isActive
                  ? "linear-gradient(to bottom, #00d9ff 0%, #0088aa 100%)"
                  : "linear-gradient(to bottom, #1a1a1a 0%, #000 100%)",
                border: "1px solid #000",
                borderRadius: "0 0 3px 3px",
                boxShadow: isRoot
                  ? "0 0 16px rgba(247, 183, 49, 1)"
                  : isActive
                  ? "0 0 12px rgba(0, 217, 255, 0.9)"
                  : "inset 0 -3px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)",
                zIndex: 2,
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 4,
              }}
            >
              {isActive && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#000",
                    fontFamily: "monospace",
                  }}
                >
                  {key.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PANEL
// ============================================================
export default function PianoPanel({
  isOpen,
  onClose,
  currentTime,
  duration,
  chordsUrl,
  isPlaying,
  onPlayPause,
  onSeek,
  onSkip,
  playbackRate,
  onPlaybackRateChange,
}) {
  const [chords, setChords] = useState([]);
  const [keyInfo, setKeyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chordsUrl || !isOpen) return;

    setLoading(true);
    setError(null);

    fetch(chordsUrl)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch chords");
        return r.json();
      })
      .then((data) => {
        // New format: { key: {...}, chords: [...] }
        // Old format: [...] (backwards compatible)
        if (Array.isArray(data)) {
          setChords(data);
          setKeyInfo(null);
        } else {
          setChords(data.chords || []);
          setKeyInfo(data.key || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load chords:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [chordsUrl, isOpen]);

  const currentChordIndex = useMemo(() => {
    if (chords.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < chords.length; i++) {
      if (chords[i].time <= currentTime) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [chords, currentTime]);

  const currentChordData = currentChordIndex >= 0 ? chords[currentChordIndex] : null;
  const currentChord = useMemo(() => {
    return currentChordData ? parseChord(currentChordData.chord) : null;
  }, [currentChordData]);

  const activeMidiNotes = useMemo(() => {
    return currentChord ? getChordMidiNotes(currentChord) : [];
  }, [currentChord]);

  const upcomingChords = useMemo(() => {
    if (currentChordIndex < 0) return chords.slice(0, 5);
    return chords.slice(currentChordIndex + 1, currentChordIndex + 6);
  }, [chords, currentChordIndex]);

  const totalChanges = chords.length;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "500px",
        background: "#13131a",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0 }}>
              🎹 Chord Display
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0" }}>
              {loading
                ? "Loading chords..."
                : error
                ? `Error: ${error}`
                : keyInfo
                ? `Key: ${keyInfo.display} · ${totalChanges} chord changes`
                : `${totalChanges} chord changes detected`}
            </p>
          </div>

          {/* KEY BADGE */}
          {keyInfo && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 16px",
                background: "linear-gradient(135deg, rgba(247,183,49,0.15) 0%, rgba(78,205,196,0.15) 100%)",
                border: "1.5px solid rgba(247,183,49,0.4)",
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
                SONG KEY
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#f7b731",
                  fontFamily: "monospace",
                  letterSpacing: -0.5,
                  lineHeight: 1,
                }}
              >
                {keyInfo.key}{keyInfo.mode === "minor" ? "m" : ""}
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
                {keyInfo.mode}
              </span>
            </div>
          )}

          {/* Current Chord Display */}
          {currentChord && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "8px 20px",
                background: "linear-gradient(135deg, rgba(0,217,255,0.15) 0%, rgba(247,183,49,0.1) 100%)",
                border: "1.5px solid rgba(0,217,255,0.4)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
                  NOW PLAYING
                </span>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#00d9ff",
                    fontFamily: "monospace",
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  {currentChord.displayName}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>
                  NOTES
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {currentChord.pitchClasses.map((pc, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: i === 0 ? "#f7b731" : "#fff",
                        fontFamily: "monospace",
                        padding: "2px 8px",
                        background: i === 0 ? "rgba(247,183,49,0.2)" : "rgba(255,255,255,0.08)",
                        borderRadius: 4,
                      }}
                    >
                      {NOTE_NAMES[pc]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            width: 32,
            height: 32,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      {/* KEYBOARD + UPCOMING */}
      <div style={{ padding: "16px 20px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Loading chords...
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ff6b6b", fontSize: 14 }}>
            Failed to load chords: {error}
          </div>
        ) : (
          <>
            <PianoKeyboard
              activeMidiNotes={activeMidiNotes}
              rootMidi={currentChord ? currentChord.rootPitch : -1}
              startMidi={PIANO_START_MIDI}
              endMidi={PIANO_END_MIDI}
            />

            {upcomingChords.length > 0 && (
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>
                  UPCOMING CHORDS
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {upcomingChords.map((c, i) => {
                    const timeUntil = (c.time - currentTime).toFixed(1);
                    const parsed = parseChord(c.chord);
                    if (!parsed) return null;
                    return (
                      <div
                        key={i}
                        style={{
                          padding: "8px 14px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems: "center",
                        }}
                      >
                        <span style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#a29bfe",
                          fontFamily: "monospace",
                        }}>
                          {parsed.displayName}
                        </span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                          in {timeUntil}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PLAYBACK CONTROLS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => onSkip && onSkip(-5)}
            title="Skip back 5s"
            style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⏮
          </button>

          <button
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
            style={{
              width: 44,
              height: 44,
              background: "#fff",
              border: "none",
              borderRadius: "50%",
              color: "#000",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: isPlaying ? 0 : 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <button
            onClick={() => onSkip && onSkip(5)}
            title="Skip forward 5s"
            style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⏭
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "monospace",
              minWidth: 42,
            }}
          >
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
            style={{
              flex: 1,
              height: 4,
              WebkitAppearance: "none",
              background: `linear-gradient(to right, #00d9ff 0%, #00d9ff ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.15) ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.15) 100%)`,
              borderRadius: 2,
              outline: "none",
              cursor: "pointer",
            }}
          />

          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "monospace",
              minWidth: 42,
            }}
          >
            {formatTime(duration)}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>
            SPEED
          </span>
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            {[0.5, 0.75, 1].map((rate) => (
              <button
                key={rate}
                onClick={() => onPlaybackRateChange && onPlaybackRateChange(rate)}
                style={{
                  background: playbackRate === rate ? "rgba(0,217,255,0.15)" : "transparent",
                  color: playbackRate === rate ? "#00d9ff" : "rgba(255,255,255,0.5)",
                  border: "none",
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}