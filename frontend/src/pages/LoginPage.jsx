import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .form-input {
      width: 100%; padding: 0.82rem 1rem; font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
      color: #03082e; background: white; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 6px;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus { border-color: #C8102E; box-shadow: 0 0 0 3px rgba(200,16,46,0.1); }
    .form-label { display: block; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 0.45rem; }
    .btn-primary {
      background: #C8102E; color: white; padding: 0.9rem 2.4rem; border-radius: 5px;
      font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
      border: none; cursor: pointer; width: 100%; transition: all 0.25s ease;
    }
    .btn-primary:hover:not(:disabled) { background: #a00d25; transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  `}</style>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || searchParams.get("callbackUrl") || "/";

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <Navbar active="" alwaysSolid />
      <div style={{ paddingTop: 68, minHeight: "100vh", background: "#f8f7f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 400, padding: "2rem" }}>
          <div style={{ background: "white", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.07)", padding: "2.5rem" }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2, color: "#03082e", marginBottom: "0.5rem" }}>Log in</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>Sign in to your FITP account.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C8102E" }}>{error}</p>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", marginTop: "1.5rem", textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link to="/register" style={{ color: "#C8102E", fontWeight: 600, textDecoration: "none" }}>Register</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
