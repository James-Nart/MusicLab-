import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import PianoPanel from "./PianoPanel";

// ============================================================
// ICONS
// ============================================================
const LogoIcon = () => (
  <svg width="24" height="20" viewBox="0 0 32 18" fill="none">
    <path
      d="M2 9C4 5 6 4.5 8 4.5S11 6 13 6c2 0 4-1.5 6-4.5s4 1.5 6 4.5c2 0 4-1.5 6-4.5"
      stroke="#00D9FF"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const PanelToggleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5">
    <rect x="1.5" y="3" width="11" height="10" rx="1" />
    <line x1="5.5" y1="6" x2="5.5" y2="10" />
    <line x1="8.5" y1="6" x2="8.5" y2="10" />
    <line x1="11.5" y1="6" x2="11.5" y2="10" />
  </svg>
);

const VocalsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

const GuitarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M19 4l-7 7M9.5 14.5a4 4 0 1 0 0-5 4 4 0 0 0 0 5z"/>
    <path d="M14.5 9.5l2-2 2 2-2 2-2-2z"/>
  </svg>
);

const BassIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M6 3v12"/>
    <path d="M18 9a3 3 0 0 1-3 3H6"/>
    <path d="M18 3a3 3 0 0 1 0 6"/>
    <circle cx="4" cy="20" r="2"/>
    <circle cx="4" cy="15" r="2"/>
  </svg>
);

const DrumsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <ellipse cx="12" cy="8" rx="9" ry="3"/>
    <path d="M3 8v8c0 1.66 4.03 3 9 3s9-1.34 9-3V8"/>
    <path d="M12 11v8"/>
  </svg>
);

const PianoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M6 4v9M10 4v9M14 4v9M18 4v9"/>
    <path d="M8 4v6M12 4v6M16 4v6"/>
  </svg>
);

const KeysIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <rect x="2" y="6" width="20" height="12" rx="1"/>
    <path d="M7 6v7M12 6v7M17 6v7M4.5 6v4.5M9.5 6v4.5M14.5 6v4.5M19.5 6v4.5"/>
  </svg>
);

const WindIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2"/>
    <path d="M12.42 19.42A2 2 0 1 0 14 16H2"/>
    <path d="M8 12H2"/>
    <path d="M20 12H12"/>
  </svg>
);

const StringsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M12 2v20M8 4v16M16 4v16M4 7v10M20 7v10"/>
  </svg>
);

// ============================================================
// INSTRUMENT OPTIONS
// ============================================================
const INSTRUMENT_OPTIONS = [
  { id: "vocals",  label: "Vocals",  icon: <VocalsIcon />,  color: "#00d9ff" },
  { id: "guitar",  label: "Guitar",  icon: <GuitarIcon />,  color: "#4ecdc4" },
  { id: "bass",    label: "Bass",    icon: <BassIcon />,    color: "#f7b731" },
  { id: "drums",   label: "Drums",   icon: <DrumsIcon />,   color: "#ff6b9d" },
  { id: "piano",   label: "Piano",   icon: <PianoIcon />,   color: "#a29bfe" },
  { id: "keys",    label: "Keys",    icon: <KeysIcon />,    color: "#fd79a8" },
  { id: "wind",    label: "Wind",    icon: <WindIcon />,    color: "#55efc4" },
  { id: "strings", label: "Strings", icon: <StringsIcon />, color: "#fdcb6e" },
  { id: "other",   label: "Other",   icon: <PianoIcon />,   color: "#a29bfe" },
];

// ============================================================
// SONG KEY CHIP (fetches key from chords.json)
// ============================================================
function SongKeyChip({ chordsUrl }) {
  const [keyInfo, setKeyInfo] = useState(null);

  useEffect(() => {
    if (!chordsUrl) return;
    fetch(chordsUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data) && data.key) {
          setKeyInfo(data.key);
        }
      })
      .catch(() => {});
  }, [chordsUrl]);

  if (!keyInfo) return null;

  return (
    <div className="studio-meta-chip" style={{ background: "rgba(247, 183, 49, 0.15)", color: "#f7b731" }}>
      🎼 Key: {keyInfo.key}{keyInfo.mode === "minor" ? "m" : ""} ({keyInfo.mode})
    </div>
  );
}

const getStemColor = (stemId) => {
  const inst = INSTRUMENT_OPTIONS.find((i) => i.id === stemId);
  return inst?.color || "#00d9ff";
};

// ============================================================
// WAVEFORM GENERATOR
// ============================================================
function generateWaveformBars(count = 60) {
  return Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="wave-bar"
      style={{
        height: `${15 + Math.random() * 70}%`,
        left: `${(i / count) * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
      }}
    />
  ));
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ sidebarOpen, setSidebarOpen, user, onLogout, activeView, onNavigate }) {
  const userInitial = user?.name ? user.name[0].toUpperCase() : "U";
  const userName = user?.name || "Musician";

  return (
    <aside className={`m-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
      <div className="m-sidebar-header">
        <div className="m-logo">
          <span className="m-logo-icon"><LogoIcon /></span>
          {sidebarOpen && <span className="m-logo-text">MusicLab</span>}
        </div>
        <button
          className="panel-minimize-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Minimize" : "Expand"}
        >
          <PanelToggleIcon />
        </button>
      </div>

      <nav className="m-nav">
        {sidebarOpen && (
          <>
            <div className="m-nav-section">
              <span className="m-section-label">Products</span>

              <button
                className={`m-nav-item ${activeView === "library" || activeView === "separation" ? "active" : ""}`}
                onClick={() => onNavigate("library")}
              >
                <span className="m-nav-icon"><LogoIcon /></span>
                <span className="m-nav-label">Track Separation</span>
              </button>

              <button className="m-nav-item">
                <span className="m-nav-icon">🤖</span>
                <span className="m-nav-label">AI Studio</span>
                <span className="m-badge">Beta</span>
              </button>

              <button className="m-nav-item">
                <span className="m-nav-icon">🎚️</span>
                <span className="m-nav-label">Mastering</span>
              </button>

              <button className="m-nav-item">
                <span className="m-nav-icon">🎤</span>
                <span className="m-nav-label">Voice Studio</span>
              </button>

              <button className="m-nav-item">
                <span className="m-nav-icon">📝</span>
                <span className="m-nav-label">Lyric Writer</span>
              </button>
            </div>

            <div className="m-nav-section">
              <span className="m-section-label">Setlists</span>

              <button className="m-nav-item m-setlist-item">
                <span className="m-setlist-icon" style={{ background: "#333" }}>➕</span>
                <div className="m-setlist-info">
                  <span className="m-nav-label">New Setlist</span>
                </div>
              </button>

              <button className="m-nav-item m-setlist-item">
                <span className="m-setlist-icon" style={{ background: "#E74C3C" }}>🎸</span>
                <div className="m-setlist-info">
                  <span className="m-nav-label">Guitar Exercises</span>
                  <span className="m-setlist-subtitle">By Berklee Online</span>
                </div>
              </button>

              <button className="m-nav-item m-setlist-item">
                <span className="m-setlist-icon" style={{ background: "#00D9FF", color: "#000" }}>
                  <LogoIcon />
                </span>
                <div className="m-setlist-info">
                  <span className="m-nav-label">MusicLab Collection</span>
                  <span className="m-setlist-subtitle">By MusicLab</span>
                </div>
              </button>
            </div>

            <div className="m-nav-bottom">
              <button className="m-nav-item m-bottom-item">
                <span className="m-nav-icon">⭐</span>
                <span className="m-nav-label m-muted">Jam Sessions</span>
              </button>
              <button className="m-nav-item m-bottom-item">
                <span className="m-nav-icon">⬇️</span>
                <span className="m-nav-label m-muted">Downloads</span>
              </button>
              <button className="m-nav-item m-bottom-item">
                <span className="m-nav-icon">💎</span>
                <span className="m-nav-label m-muted">Upgrade Plan</span>
              </button>
              <button
                className="m-nav-item m-bottom-item"
                onClick={onLogout}
              >
                <span className="m-nav-icon">🚪</span>
                <span className="m-nav-label m-muted">Logout</span>
              </button>
            </div>
          </>
        )}
      </nav>

      <div className="m-user-card">
        <div className="m-avatar">{userInitial}</div>
        {sidebarOpen && (
          <div className="m-user-info">
            <span className="m-username">{userName}</span>
            <span className="m-userplan">Free</span>
          </div>
        )}
      </div>
    </aside>
  );
}

// ============================================================
// VIEW 1: SEPARATION SELECTION VIEW
// ============================================================
function SeparationView({ file, onSubmit, onCancel, sidebarOpen }) {
  const [selectedInstruments, setSelectedInstruments] = useState(
    ["vocals", "drums", "bass", "other"]
  );

  const toggleInstrument = (id) => {
    setSelectedInstruments((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedInstruments.length === 0) {
      alert("Please select at least one instrument to separate.");
      return;
    }
    onSubmit(selectedInstruments);
  };

  return (
    <main className={`m-main ${!sidebarOpen ? "full-width" : ""}`}>
      <div className="sep-view-container">
        <div className="sep-view-header">
          <button className="back-to-lib-btn" onClick={onCancel}>
            ← Cancel
          </button>
          <div className="sep-file-info">
            <div className="sep-file-icon">🎵</div>
            <div>
              <p className="sep-file-name">{file.name}</p>
              <p className="sep-file-size">{file.size}</p>
            </div>
          </div>
        </div>

        <div className="sep-section">
          <h2 className="sep-section-title">Custom separation</h2>
          <p className="sep-section-sub">
            Select the instruments you want to isolate (Demucs supports: Vocals, Drums, Bass, Other)
          </p>
        </div>

        <div className="sep-instrument-grid">
          {INSTRUMENT_OPTIONS.filter(i => ["vocals","drums","bass","other"].includes(i.id)).map((inst) => {
            const isSelected = selectedInstruments.includes(inst.id);
            return (
              <button
                key={inst.id}
                className={`sep-instrument-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleInstrument(inst.id)}
                style={isSelected ? { borderColor: inst.color } : {}}
              >
                <div
                  className="sep-inst-icon"
                  style={isSelected ? { color: inst.color } : {}}
                >
                  {inst.icon}
                </div>
                <span className="sep-inst-label">{inst.label}</span>
                {isSelected && (
                  <div
                    className="sep-check"
                    style={{ background: inst.color }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="sep-section" style={{ marginTop: "8px" }}>
          <h2 className="sep-section-title">⏱️ AI Processing</h2>
          <p className="sep-section-sub">
            Separation + chord & key detection typically takes 10-30 minutes.
          </p>
        </div>

        <div className="sep-selected-count">
          {selectedInstruments.length} instrument
          {selectedInstruments.length !== 1 ? "s" : ""} selected
        </div>
      </div>

      <div className={`sep-bottom-bar ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>
        <div className="sep-bottom-left">
          <div className="sep-upload-indicator">
            <div className="sep-upload-spinner" />
            <span>Ready to separate</span>
          </div>
        </div>

        <div className="sep-bottom-right">
          <button
            className="sep-submit-btn"
            onClick={handleSubmit}
            disabled={selectedInstruments.length === 0}
          >
            Start Separation →
          </button>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// VIEW 2: LIBRARY VIEW
// ============================================================
function LibraryView({
  uploadedFiles,
  onFileClick,
  onAddFile,
  onDeleteFile,
  sidebarOpen,
  setSidebarOpen,
  fileInputRef,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  isUploading,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = uploadedFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = uploadedFiles.length === 0;

  const getStatusBadge = (status) => {
    if (status === "processing") return <span style={{ color: "#f7b731", fontSize: 11 }}>⏳ Processing...</span>;
    if (status === "ready") return <span style={{ color: "#4ecdc4", fontSize: 11 }}>✓ Ready</span>;
    if (status === "failed") return <span style={{ color: "#ff6b6b", fontSize: 11 }}>✗ Failed</span>;
    return <span style={{ color: "#888", fontSize: 11 }}>📁 Uploaded</span>;
  };

  return (
    <main
      className={`m-main ${!sidebarOpen ? "full-width" : ""}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="m-header">
        <div className="m-header-left">
          {!sidebarOpen && (
            <button
              className="m-toggle-btn inline-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelToggleIcon />
            </button>
          )}

          {!isEmpty ? (
            <>
              <h1 className="m-page-title">Track Separation</h1>
              <span className="m-file-count">
                {uploadedFiles.length} file
                {uploadedFiles.length !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <div className="m-logo-sm">
              <LogoIcon /> <span style={{ marginLeft: 8 }}>MusicLab</span>
            </div>
          )}
        </div>

        <div className="m-header-right">
          {!isEmpty && (
            <>
              <div className="m-search-wrapper">
                <svg className="m-search-icon" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  className="m-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="m-icon-btn" title="Filter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
              </button>

              <button className="m-icon-btn" title="Sort">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M6 12h12M9 18h6" />
                </svg>
              </button>

              <button className="m-add-btn" onClick={onAddFile} disabled={isUploading}>
                <span>+</span> {isUploading ? "Uploading..." : "Add"}
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp3,.wav,.flac,.aac,.m4a,.ogg,audio/*"
            onChange={handleFileSelect}
            hidden
          />
        </div>
      </header>

      <div className="m-content">
        {isEmpty ? (
          <div className="empty-state-container">
            <div className="empty-hero" style={{ backgroundImage: "url('/main1.jpg')" }}>
              <div className="empty-overlay" />
              <div className="empty-center-content">
                <h1 className="empty-title">Upload your first song</h1>
                <p className="empty-description">
                  Separate vocals and instruments, view chords,
                  <br />
                  practice along, and organize your music in one place.
                </p>
                <button className="upload-primary-btn" onClick={onAddFile} disabled={isUploading}>
                  <span className="plus-icon">+</span> {isUploading ? "Uploading..." : "Upload song"}
                </button>
              </div>
              <div className="empty-scroll-hint">
                <span>or drag & drop anywhere</span>
                <div className="scroll-arrow">↓</div>
              </div>
            </div>

            <div className="demo-preview-section">
              <div className="demo-header">
                <span className="demo-play-icon">▶</span>
                <span className="demo-title">Try a demo</span>
              </div>
              <div className="demo-library">
                <div className="library-bar">
                  <span className="library-label">Library</span>
                  <div className="library-actions">
                    <input type="text" placeholder="Search..." className="library-search" readOnly />
                    <button className="lib-filter-btn">≡</button>
                    <button className="lib-new-btn">+ New</button>
                  </div>
                </div>
                <div className="demo-track-row active">
                  <div className="demo-artwork">🎵</div>
                  <div className="demo-track-info">
                    <span className="demo-track-name">Pull Me Closer</span>
                    <span className="demo-track-artist">Nina Terol</span>
                  </div>
                  <div className="demo-meta">
                    <span>Feb 26, 2026</span>
                    <span>110</span>
                    <span>G</span>
                    <span>05:34</span>
                  </div>
                </div>
                <div className="waveform-container">
                  {[
                    ["Vocals", "#00d9ff", 40],
                    ["Drums", "#ff6b9d", 35],
                    ["Bass", "#4ecdc4", 38],
                    ["Guitar", "#f7b731", 42],
                  ].map(([label, color, count]) => (
                    <div key={label} className="wave-row">
                      <div className="wave-label">
                        <span className="track-icon">{label}</span>
                        <button className="wave-mute">♫</button>
                      </div>
                      <div className="wave-bars" style={{ "--color": color }}>
                        {generateWaveformBars(count)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="m-table-container">
            <table className="m-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => (
                  <tr
                    key={file.id}
                    className="m-track-row"
                    onClick={() => onFileClick(file)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="m-track-info-cell">
                      <div className="m-file-indicator">
                        <LogoIcon />
                      </div>
                      <div className="m-track-meta">
                        <span className="m-track-name">{file.name}</span>
                        <span className="m-track-artist">{file.artist}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(file.status)}</td>
                    <td className="m-date-cell">{file.date}</td>
                    <td className="m-duration-cell">{file.duration}</td>
                    <td
                      className="m-action-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="m-delete-btn"
                        onClick={() => onDeleteFile(file.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              className="add-more-area"
              onClick={onAddFile}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <span>Add another track or drag here</span>
              <span className="add-plus-small">+</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// VIEW 3: STUDIO VIEW
// ============================================================
function StudioView({ file, onBack, sidebarOpen, setSidebarOpen }) {
  const audioRef = useRef(null);
  const stemAudioRefs = useRef({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPiano, setShowPiano] = useState(false);

  const hasStems = file.stems && file.stems.length > 0;
  const stems = hasStems ? file.stems.map(s => s.name) : ["vocals", "drums", "bass", "other"];

  const [stemMutes, setStemMutes] = useState(() => {
    const init = {};
    stems.forEach((name) => { init[name] = false; });
    return init;
  });

  const [stemSolos, setStemSolos] = useState(() => {
    const init = {};
    stems.forEach((name) => { init[name] = false; });
    return init;
  });

  const [stemVolumes, setStemVolumes] = useState(() => {
    const init = {};
    stems.forEach((name) => { init[name] = 75; });
    return init;
  });

  const anySoloed = Object.values(stemSolos).some(v => v);

  useEffect(() => {
    if (!hasStems) return;

    file.stems.forEach((stem) => {
      if (!stemAudioRefs.current[stem.name]) {
        const audio = new Audio(stem.url);
        audio.preload = "auto";
        stemAudioRefs.current[stem.name] = audio;
      }
    });

    return () => {
      Object.values(stemAudioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      stemAudioRefs.current = {};
    };
  }, [file.stems, hasStems]);

  useEffect(() => {
    if (hasStems) {
      Object.values(stemAudioRefs.current).forEach((audio) => {
        if (isPlaying) {
          audio.play().catch(() => setIsPlaying(false));
        } else {
          audio.pause();
        }
      });
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, hasStems]);

  useEffect(() => {
    if (!hasStems) return;

    Object.entries(stemAudioRefs.current).forEach(([name, audio]) => {
      const isMuted = stemMutes[name] || false;
      const isSoloed = stemSolos[name] || false;
      const volume = (stemVolumes[name] ?? 75) / 100;

      let shouldPlay = !isMuted;
      if (anySoloed) {
        shouldPlay = isSoloed && !isMuted;
      }

      audio.muted = !shouldPlay;
      audio.volume = volume;
    });
  }, [stemMutes, stemSolos, stemVolumes, anySoloed, hasStems]);

  useEffect(() => {
    if (hasStems) {
      Object.values(stemAudioRefs.current).forEach((audio) => {
        audio.playbackRate = playbackRate;
      });
    } else if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, hasStems]);

  const handleTimeUpdate = () => {
    if (hasStems) {
      const firstStem = Object.values(stemAudioRefs.current)[0];
      if (firstStem) setCurrentTime(firstStem.currentTime);
    } else if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  useEffect(() => {
    if (!hasStems || !isPlaying) return;
    const interval = setInterval(handleTimeUpdate, 100);
    return () => clearInterval(interval);
  }, [hasStems, isPlaying]);

  useEffect(() => {
    if (!hasStems) return;
    const firstStem = Object.values(stemAudioRefs.current)[0];
    if (!firstStem) return;

    const onLoad = () => setDuration(firstStem.duration);
    firstStem.addEventListener("loadedmetadata", onLoad);
    if (firstStem.readyState >= 1) setDuration(firstStem.duration);

    return () => firstStem.removeEventListener("loadedmetadata", onLoad);
  }, [hasStems, file.stems]);

  const handleSeek = (e) => {
    const t = parseFloat(e.target.value);
    seekTo(t);
  };

  const seekTo = (t) => {
    if (hasStems) {
      Object.values(stemAudioRefs.current).forEach((audio) => {
        audio.currentTime = t;
      });
    } else if (audioRef.current) {
      audioRef.current.currentTime = t;
    }
    setCurrentTime(t);
  };

  const formatTime = (s) => {
    if (isNaN(s) || s === 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const skip = (seconds) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(nextTime);
  };

  const toggleStemMute = (stemName) => {
    setStemMutes((prev) => ({ ...prev, [stemName]: !prev[stemName] }));
  };

  const toggleStemSolo = (stemName) => {
    setStemSolos((prev) => ({ ...prev, [stemName]: !prev[stemName] }));
  };

  const setStemVolume = (stemName, vol) => {
    setStemVolumes((prev) => ({ ...prev, [stemName]: vol }));
  };

  const resetStems = () => {
    const reset = {};
    stems.forEach((s) => { reset[s] = false; });
    setStemMutes(reset);
    setStemSolos(reset);

    const resetVol = {};
    stems.forEach((s) => { resetVol[s] = 75; });
    setStemVolumes(resetVol);
  };

  return (
    <main className={`m-main studio-main ${!sidebarOpen ? "full-width" : ""}`}>
      {!hasStems && (
        <audio
          ref={audioRef}
          src={file.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      <div className="studio-top-bar">
        <div className="studio-top-left">
          {!sidebarOpen && (
            <button
              className="m-toggle-btn inline-toggle"
              onClick={() => setSidebarOpen(true)}
              style={{ marginRight: 8 }}
            >
              <PanelToggleIcon />
            </button>
          )}
          <button className="studio-back-btn" onClick={onBack} title="Back">
            ←
          </button>
          <div className="studio-file-thumb">🎵</div>
          <h1 className="studio-song-name">{file.name}</h1>
        </div>

        <div className="studio-top-right">
          {hasStems ? (
            <div className="studio-meta-chip" style={{ background: "rgba(78, 205, 196, 0.15)", color: "#4ecdc4" }}>
              ✓ {file.stems.length} stems separated
            </div>
          ) : (
            <div className="studio-meta-chip" style={{ background: "rgba(247, 183, 49, 0.15)", color: "#f7b731" }}>
              ⏳ No stems (single track)
            </div>
          )}

          {file.chordsUrl && (
            <>
              <div className="studio-meta-chip" style={{ background: "rgba(0, 217, 255, 0.15)", color: "#00d9ff" }}>
                🎼 Chords ready
              </div>
              <SongKeyChip chordsUrl={file.chordsUrl} />
            </>
          )}

          <button className="studio-export-btn">
            ⬇️ Export
          </button>
        </div>
      </div>

      <div className="studio-body">
        <div className="studio-left-panel">
          {stems.map((stemId) => {
            const inst = INSTRUMENT_OPTIONS.find((i) => i.id === stemId) || {
              label: stemId,
              color: "#00d9ff",
            };
            return (
              <StemControl
                key={stemId}
                title={inst.label}
                color={getStemColor(stemId)}
                muted={stemMutes[stemId] || false}
                soloed={stemSolos[stemId] || false}
                volume={stemVolumes[stemId] ?? 75}
                onToggleMute={() => toggleStemMute(stemId)}
                onToggleSolo={() => toggleStemSolo(stemId)}
                onVolumeChange={(v) => setStemVolume(stemId, v)}
              />
            );
          })}

          <button className="studio-reset-btn" onClick={resetStems}>
            ↻ Reset All
          </button>
        </div>

        <div className="studio-right-panel">
          <div className="studio-timeline-ruler">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="ruler-tick">
                <span className="ruler-label">
                  {formatTime((duration / 20) * i)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="studio-playhead"
            style={{
              left: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
            }}
          />

          {stems.map((stemId) => {
            const color = getStemColor(stemId);
            return (
              <div key={stemId} className="studio-waveform-track">
                <div
                  className="studio-waveform-fill"
                  style={{
                    "--wave-color": color,
                    background: `linear-gradient(to bottom, 
                      ${color}26 0%, 
                      ${color}40 50%, 
                      ${color}26 100%)`,
                    borderTop: `1px solid ${color}4D`,
                    borderBottom: `1px solid ${color}4D`,
                  }}
                >
                  {generateWaveformBars(80)}
                </div>
              </div>
            );
          })}

          <div className="studio-waveform-track metronome-track">
            <div className="metronome-speed-btns">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${playbackRate === s ? "active" : ""}`}
                  onClick={() => setPlaybackRate(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="studio-bottom-bar">
        <div className="studio-player-controls">
          <button className="studio-ctrl-btn" title="Volume">
            🔊
          </button>

          <button className="studio-ctrl-btn" onClick={() => skip(-10)} title="Skip back">
            ⏮
          </button>

          <button
            className="studio-play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <button className="studio-ctrl-btn" onClick={() => skip(10)} title="Skip forward">
            ⏭
          </button>

          <button className="studio-ctrl-btn" title="Loop">
            🔁
          </button>
        </div>

        <div className="studio-seek-area">
          <span className="studio-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="studio-seekbar"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
          />
          <span className="studio-time">{formatTime(duration)}</span>
        </div>

        <div className="studio-bottom-right">
          <button className="studio-feature-btn">
            💬 Lyrics
          </button>
          <button
            className="studio-feature-btn"
            onClick={() => setShowPiano(!showPiano)}
            disabled={!file.chordsUrl}
            style={
              showPiano
                ? {
                    background: "rgba(0,217,255,0.15)",
                    borderColor: "rgba(0,217,255,0.3)",
                    color: "#00d9ff",
                  }
                : !file.chordsUrl
                ? { opacity: 0.4, cursor: "not-allowed" }
                : {}
            }
          >
            🎹 Chords
          </button>
        </div>
      </div>

      {/* PIANO PANEL — Shows chord notes on keys */}
      <PianoPanel
        isOpen={showPiano}
        onClose={() => setShowPiano(false)}
        currentTime={currentTime}
        duration={duration}
        chordsUrl={file.chordsUrl}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onSeek={seekTo}
        onSkip={skip}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
      />
    </main>
  );
}

// ============================================================
// STEM CONTROL
// ============================================================
function StemControl({ title, color, muted, soloed, volume, onToggleMute, onToggleSolo, onVolumeChange }) {
  const [localVolume, setLocalVolume] = useState(volume);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalVolume(volume);
    }
  }, [volume, isDragging]);

  const handleSliderInput = (e) => {
    const newVol = parseInt(e.target.value);
    setLocalVolume(newVol);
    onVolumeChange(newVol);
  };

  return (
    <div className={`stem-control-row ${muted ? "stem-ctrl-muted" : ""}`}>
      <div className="stem-ctrl-top">
        <button
          className={`stem-ms-btn ${muted ? "stem-ms-active-m" : ""}`}
          onClick={onToggleMute}
          title="Mute"
        >
          M
        </button>
        <button
          className={`stem-ms-btn ${soloed ? "stem-ms-active-s" : ""}`}
          onClick={onToggleSolo}
          title="Solo"
        >
          S
        </button>
        <span
          className="stem-ctrl-label"
          style={muted ? { opacity: 0.4 } : {}}
        >
          {title}
        </span>
      </div>

      <div className="stem-ctrl-bottom">
        <input
          type="range"
          className="stem-ctrl-slider-fixed"
          min="0"
          max="100"
          value={localVolume}
          onChange={handleSliderInput}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            background: `linear-gradient(to right, ${muted ? '#444' : color} 0%, ${muted ? '#444' : color} ${localVolume}%, rgba(255,255,255,0.1) ${localVolume}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "monospace",
            minWidth: 24,
            textAlign: "right",
          }}
        >
          {localVolume}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState("library");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("musiclab_user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("musiclab_token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await api.get("/tracks");
        if (response.data.success) {
          const tracks = response.data.tracks.map((t) => ({
            id: t.id,
            backendId: t.id,
            name: t.name,
            artist: user?.name || "You",
            date: new Date(t.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            genre: "—",
            bpm: null,
            key: null,
            duration: "—",
            size: formatFileSize(t.fileSize),
            url: `http://localhost:5100${t.fileUrl}`,
            status: t.status,
            stems: t.stemsJson
              ? JSON.parse(t.stemsJson).map((s) => ({
                  name: (s.Name || s.name || "").toLowerCase(),
                  url: `http://localhost:5100${s.Url || s.url}`,
                }))
              : [],
            chordsUrl: t.chordsUrl ? `http://localhost:5100${t.chordsUrl}` : null,
            selectedInstruments: [],
          }));
          setUploadedFiles(tracks);
        }
      } catch (err) {
        console.error("Failed to load tracks:", err);
      }
    };

    const token = localStorage.getItem("musiclab_token");
    if (token) {
      loadTracks();

      const interval = setInterval(() => {
        const hasProcessing = uploadedFiles.some(f => f.status === "processing");
        if (hasProcessing) {
          loadTracks();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles.length]);

  const handleLogout = () => {
    localStorage.removeItem("musiclab_token");
    localStorage.removeItem("musiclab_user");
    navigate("/login");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDuration = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const processFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/tracks/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    const backendTrack = response.data.track;

    return new Promise((resolve) => {
      const audio = new Audio(`http://localhost:5100${backendTrack.fileUrl}`);

      const buildFileObject = (durationSeconds) => ({
        id: backendTrack.id,
        backendId: backendTrack.id,
        name: backendTrack.name,
        artist: user?.name || "You",
        date: new Date(backendTrack.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        genre: "—",
        bpm: null,
        key: null,
        duration: formatDuration(Math.floor(durationSeconds || 0)),
        size: formatFileSize(backendTrack.fileSize),
        url: `http://localhost:5100${backendTrack.fileUrl}`,
        status: backendTrack.status,
        selectedInstruments: [],
        stems: [],
        chordsUrl: null,
      });

      audio.addEventListener("loadedmetadata", () => {
        resolve(buildFileObject(audio.duration));
      });

      audio.addEventListener("error", () => {
        resolve(buildFileObject(0));
      });
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = "";
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const addFiles = async (files) => {
    const valid = files.filter(
      (f) =>
        f.type.startsWith("audio/") ||
        /\.(mp3|wav|flac|aac|m4a|ogg)$/i.test(f.name)
    );

    if (valid.length === 0) {
      alert("Please upload audio files (MP3, WAV, FLAC, AAC, M4A)");
      return;
    }

    setIsUploading(true);
    try {
      const processed = await processFile(valid[0]);
      setPendingFile(processed);
      setView("separation");
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeparationSubmit = async (selectedInstruments) => {
    const finalFile = {
      ...pendingFile,
      selectedInstruments,
      status: "processing",
    };

    setUploadedFiles((prev) => [finalFile, ...prev]);
    setPendingFile(null);
    setView("library");

    try {
      const response = await api.post("/tracks/separate", {
        trackId: finalFile.backendId,
        instruments: selectedInstruments,
      });

      if (response.data.success) {
        const stems = (response.data.stems || []).map((s) => ({
          name: (s.name || s.Name || "").toLowerCase(),
          url: `http://localhost:5100${s.url || s.Url}`,
        }));

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.backendId === finalFile.backendId
              ? {
                  ...f,
                  status: "ready",
                  stems,
                  chordsUrl: response.data.chordsUrl
                    ? `http://localhost:5100${response.data.chordsUrl}`
                    : null,
                }
              : f
          )
        );
      }
    } catch (err) {
      console.error("Separation failed:", err);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.backendId === finalFile.backendId
            ? { ...f, status: "failed" }
            : f
        )
      );
      alert(
        "Separation failed: " +
          (err.response?.data?.message || err.message) +
          "\nYou can still play the original track."
      );
    }
  };

  const handleSeparationCancel = () => {
    if (pendingFile?.backendId) {
      api.delete(`/tracks/${pendingFile.backendId}`).catch(() => {});
    }
    setPendingFile(null);
    setView("library");
  };

  const handleFileClick = (file) => {
    setActiveFile(file);
    setView("studio");
  };

  const handleDeleteFile = async (id) => {
    try {
      await api.delete(`/tracks/${id}`);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete track");
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const handleNavigate = (v) => {
    setView(v);
    setActiveFile(null);
  };

  return (
    <div className="moises-dashboard">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
        activeView={view}
        onNavigate={handleNavigate}
      />

      {view === "separation" && pendingFile && (
        <SeparationView
          file={pendingFile}
          onSubmit={handleSeparationSubmit}
          onCancel={handleSeparationCancel}
          sidebarOpen={sidebarOpen}
        />
      )}

      {view === "library" && (
        <LibraryView
          uploadedFiles={uploadedFiles}
          onFileClick={handleFileClick}
          onAddFile={openFileDialog}
          onDeleteFile={handleDeleteFile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          isUploading={isUploading}
        />
      )}

      {view === "studio" && activeFile && (
        <StudioView
          file={activeFile}
          onBack={() => setView("library")}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}
    </div>
  );
}

export default Dashboard;