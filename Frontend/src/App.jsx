import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // REACTIVE AUTH STATE
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("musiclab_token")
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("musiclab_user") || "{}")
  );

  // Listen for storage changes (e.g., logout from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("musiclab_token"));
      setUser(JSON.parse(localStorage.getItem("musiclab_user") || "{}"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Re-check auth every time the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsLoggedIn(!!localStorage.getItem("musiclab_token"));
        setUser(JSON.parse(localStorage.getItem("musiclab_user") || "{}"));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("musiclab_token");
    localStorage.removeItem("musiclab_user");
    setIsLoggedIn(false);
    setUser({});
    navigate("/");
  };

  const requireAuth = (callback) => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      callback?.();
    }
  };

  const slides = [
    {
      id: 1,
      category: "Stem Separation",
      subtitle: "Isolate vocals & instruments",
      description:
        "Split any song into individual tracks — vocals, drums, bass, guitar, piano. Mute what you want, solo what you love.",
      buttonText: "Separate Tracks",
      image: "/stem separation.jpg",
      type: "image",
      color: "#00D9FF",
    },
    {
      id: 2,
      category: "Key & Pitch Detection",
      subtitle: "Detect keys, shift pitch",
      description:
        "Instantly identify the musical key and BPM of any track. Change pitch to match your vocal range without affecting tempo.",
      buttonText: "Analyze Song",
      image: "/key detection.jpeg",
      type: "image",
      color: "#FF6B9D",
    },
    {
      id: 3,
      category: "Chord Display",
      subtitle: "See every chord in real-time",
      description:
        "Watch chord progressions unfold as your song plays. Perfect for learning covers and transcribing music.",
      buttonText: "View Chords",
      video: "/chord-detection.mp4",
      type: "video",
      color: "#4ECDC4",
    },
  ];

  // AUTO CAROUSEL
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => setCurrentSlide(index);
  const slide = slides[currentSlide];

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <span className="logo">∿</span>
          <a href="#" className="nav-link">Made for</a>
          <a href="#" className="nav-link">Features</a>
          <a href="#" className="nav-link">Platforms</a>
          <a href="#" className="nav-link">Tutorials</a>
          <a href="#" className="nav-link">Media</a>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <span
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Hi, {user?.name || "Musician"} 👋
              </span>

              <button
                className="btn-login"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>

              <button className="btn-signup" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-login"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

              <button
                className="btn-signup"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-container">
          <video
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className="video-frame"
          >
            <source src="/video1.mp4" type="video/mp4" />
          </video>

          <div className="gradient-overlay"></div>

          <div className="text-content">
            <h1 className="main-title">
              <span style={{ whiteSpace: "nowrap" }}>
                The Intelligent Studio
              </span>
              <br />
              <span>for Musicians</span>
            </h1>

            <p className="sub-text">
              MusicLab is the essential toolkit for musicians to practice,
              perform, create and collaborate anywhere.
            </p>

            <div className="btn-group">
              <button
                className="btn-filled"
                onClick={() => requireAuth(() => navigate("/dashboard"))}
              >
                {isLoggedIn ? "Enter Studio" : "Start Creating"}
              </button>

              <button className="btn-ghost">Download Desktop App</button>
            </div>
          </div>
        </div>
      </section>

      {/* CAROUSEL SECTION */}
      <section className="showcase-section">
        <div className="carousel-container">
          {/* LEFT PANEL */}
          <div className="showcase-text">
            <div className="slide-content" key={slide.id}>
              <h2 className="showcase-title">{slide.category}</h2>
              <p className="showcase-subtitle">{slide.subtitle}</p>
              <p className="showcase-desc">{slide.description}</p>

              <button
                className="showcase-btn"
                style={{ backgroundColor: slide.color }}
                onClick={() => requireAuth(() => navigate("/dashboard"))}
              >
                {slide.buttonText}
              </button>

              <div className="dot-nav">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`dot ${
                      index === currentSlide ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="showcase-image-wrapper">
            {slide.type === "video" ? (
              <video
                src={slide.video}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                className="media-content"
                key={`vid-${slide.id}`}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={slide.image}
                alt={slide.category}
                className="media-content"
                key={`img-${slide.id}`}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;