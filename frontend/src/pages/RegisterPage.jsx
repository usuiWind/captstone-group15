import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { register } from "../api/services/authService";

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

const PASSWORD_HELP = "At least 8 characters, with uppercase, lowercase, number, and special character (@$!%*?&).";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  // Token is pre-filled from the email link (/register?token=...) or entered manually
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const tokenFromUrl = !!searchParams.get("token");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register({ token: token.trim(), name: name.trim(), password });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(err.message || "Registration failed. Check your invite token and try again.");
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
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2, color: "#03082e", marginBottom: "0.5rem" }}>Register</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
              {tokenFromUrl
                ? "Your invite link is ready. Set your name and password to complete your account."
                : "Have an invite token? Enter it below with your name and password to create your account."}
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Hide the token field when it came from the URL — user doesn't need to see it */}
              {!tokenFromUrl && (
                <div>
                  <label className="form-label">Invite token</label>
                  <input
                    className="form-input"
                    type="text"
                    autoComplete="off"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="form-label">Full name</label>
                <input
                  className="form-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  title={PASSWORD_HELP}
                />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#888", marginTop: 4 }}>{PASSWORD_HELP}</p>
              </div>
              <div>
                <label className="form-label">Confirm password</label>
                <input
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C8102E" }}>{error}</p>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", marginTop: "1.5rem", textAlign: "center" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#C8102E", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
