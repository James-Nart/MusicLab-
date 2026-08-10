import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import api from "./api";

function Login() {
  const navigate = useNavigate();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    scope: "openid email profile",

    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);

      try {
        const response = await api.post("/auth/google-login", {
          accessToken: tokenResponse.access_token,
        });

        const data = response.data;

        if (data.success) {
          localStorage.setItem("musiclab_token", data.token);

          localStorage.setItem(
            "musiclab_user",
            JSON.stringify({
              name: data.userName || "Google User",
            })
          );

          navigate("/dashboard");
        } else {
          setError(data.message || "Google login failed.");
        }
      } catch (err) {
        console.error(err);

        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Google login failed. Is the backend running?");
        }
      } finally {
        setLoading(false);
      }
    },

    onError: () => {
      setError("Google login was cancelled or failed.");
    },
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      if (data.success) {
        localStorage.setItem("musiclab_token", data.token);

        localStorage.setItem(
          "musiclab_user",
          JSON.stringify({
            name: data.userName,
            email: email,
          })
        );

        navigate("/dashboard");
      } else {
        setError(data.message || "Unable to log in. Please try again.");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Cannot connect to server. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">∿</span>
          <span className="login-logo-text">MusicLab</span>
        </div>

        <h1 className="login-title">Welcome back</h1>

        {!showEmailForm ? (
          <>
            <div className="social-buttons">
              {/* GOOGLE - REAL LOGIN */}
              <button
                className="social-btn"
                aria-label="Continue with Google"
                onClick={() => loginWithGoogle()}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </button>

              {/* FACEBOOK - LATER */}
              <button
                className="social-btn"
                aria-label="Continue with Facebook"
                onClick={() => setError("Facebook login coming soon!")}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    fill="#1877F2"
                  />
                </svg>
              </button>

              {/* APPLE - LATER */}
              <button
                className="social-btn"
                aria-label="Continue with Apple"
                onClick={() => setError("Apple login coming soon!")}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path
                    d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                    fill="#000"
                  />
                </svg>
              </button>

              {/* X - LATER */}
              <button
                className="social-btn"
                aria-label="Continue with X"
                onClick={() => setError("X login coming soon!")}
              >
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    fill="#000"
                  />
                </svg>
              </button>
            </div>

            {error && <p className="error-text-center">{error}</p>}

            <div className="login-divider">
              <span className="divider-line" />
              <span className="divider-text">or</span>
              <span className="divider-line" />
            </div>

            <button
              className="email-btn"
              onClick={() => {
                setShowEmailForm(true);
                setError(null);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="email-icon"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Continue with email
            </button>
          </>
        ) : (
          <form className="email-form" onSubmit={handleLogin}>
            {error && <div className="error-box">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <a href="#" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setShowEmailForm(false);
                setError(null);
              }}
            >
              ← Back to all options
            </button>
          </form>
        )}

        <p className="login-footer">
          Not a member yet?{" "}
          <Link to="/signup" className="signup-link">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
