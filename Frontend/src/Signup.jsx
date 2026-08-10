import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password
      });

      const data = response.data;

      if (data.success) {
        localStorage.setItem('musiclab_token', data.token);
        localStorage.setItem('musiclab_user', JSON.stringify({
          name: data.userName,
          email: email
        }));
        navigate("/dashboard");
      } else {
        setError(data.message || "Unable to create your account. Please try again.");
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

        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">∿</span>
          <span className="login-logo-text">MusicLab</span>
        </div>

        <h1 className="login-title">Create your account</h1>

        <form className="email-form" onSubmit={handleSignup}>

          {/* Error Message */}
          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
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

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn submit-signup-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Terms */}
          <p className="terms-text">
            By signing up, you agree to our{" "}
            <a href="#" className="terms-link">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="terms-link">Privacy Policy</a>.
          </p>

        </form>

        <p className="login-footer">
          Already have an account?{" "}
          <Link to="/login" className="signup-link">Log in</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;
