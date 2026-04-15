import { useState, useEffect } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; width: 100%; }
    body { font-family: 'DM Sans', sans-serif; background: white; overflow-x: hidden; width: 100%; }
    #root { width: 100%; }

    .form-input {
      width: 100%;
      padding: 0.82rem 1rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.93rem;
      color: #03082e;
      background: white;
      border: 1.5px solid rgba(0,0,0,0.12);
      border-radius: 6px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input::placeholder { color: #bbb; font-weight: 300; }
    .form-input:focus {
      border-color: #C8102E;
      box-shadow: 0 0 0 3px rgba(200,16,46,0.1);
    }
    .form-input.error { border-color: #C8102E; }

    .form-label {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase;
      color: #555; margin-bottom: 0.45rem;
    }

    /* Member sign-in button — red */
    .btn-member {
      background: #C8102E; color: white;
      width: 100%; padding: 0.92rem; border-radius: 5px;
      font-family: 'DM Sans', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
      border: none; cursor: pointer;
      box-shadow: 0 8px 28px rgba(200,16,46,0.35);
      transition: all 0.25s ease;
    }
    .btn-member:hover {
      background: #a00d25;
      transform: translateY(-2px);
      box-shadow: 0 14px 36px rgba(200,16,46,0.46);
    }
    .btn-member:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* Admin sign-in button — dark navy */
    .btn-admin {
      background: #03082e; color: white;
      width: 100%; padding: 0.92rem; border-radius: 5px;
      font-family: 'DM Sans', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
      border: none; cursor: pointer;
      box-shadow: 0 8px 28px rgba(3,8,46,0.3);
      transition: all 0.25s ease;
    }
    .btn-admin:hover {
      background: #060f45;
      transform: translateY(-2px);
      box-shadow: 0 14px 36px rgba(3,8,46,0.42);
    }
    .btn-admin:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .text-link {
      color: #C8102E; font-family: 'DM Sans', sans-serif;
      font-size: 0.88rem; font-weight: 600;
      text-decoration: none; transition: opacity 0.2s;
    }
    .text-link:hover { opacity: 0.75; }

    .divider-line { flex: 1; height: 1px; background: rgba(0,0,0,0.1); }

    /* ── Role toggle pill ── */
    .role-toggle {
      display: flex;
      background: #f0eff0;
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
      margin-bottom: 1.6rem;
    }
    .role-btn {
      flex: 1; padding: 0.55rem 0.5rem;
      border: none; border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; font-weight: 700;
      letter-spacing: 1.8px; text-transform: uppercase;
      cursor: pointer; transition: all 0.22s ease;
      background: transparent; color: #aaa;
    }
    .role-btn.active-member {
      background: white;
      color: #C8102E;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .role-btn.active-admin {
      background: #03082e;
      color: white;
      box-shadow: 0 2px 8px rgba(3,8,46,0.25);
    }

    @media (max-width: 768px) {
      .login-left { display: none !important; }
    }
  `}</style>
);

export default function LoginPage() {
  const [ready,    setReady]    = useState(false);
  const [role,     setRole]     = useState("member"); // "member" | "admin"
  const [form,     setForm]     = useState({ email: "", password: "" });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  const isAdmin = role === "admin";

  // Reset everything when switching role
  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setErrors({});
    setForm({ email: "", password: "" });
    setShowPass(false);
  };

  const anim = (delay) => ({
    opacity:    ready ? 1 : 0,
    transform:  ready ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password.trim()) e.password = "Password is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    // ── Replace this with your real auth call ─────────────────────────────────
    // After successful auth, redirect based on role:
    //   member → "/"       (homepage / member dashboard)
    //   admin  → "/admin"  (admin dashboard)
    // ─────────────────────────────────────────────────────────────────────────
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("fitpEmail", form.email);
      window.location.href = isAdmin ? "/admin" : "/dashboard";
    }, 1200);
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  return (
    <>
      <GlobalStyles />

      <div style={{ minHeight: "100vh", display: "flex" }}>

        {/* ── Left panel — dark branded side ── */}
        <div className="login-left" style={{
          flex: "0 0 45%", position: "relative",
          background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "3rem", overflow: "hidden",
        }}>
          {/* Grid texture */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.032,
            backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }} />
          {/* Red glow */}
          <div style={{
            position: "absolute", bottom: "-10%", right: "-10%",
            width: "60%", height: "60%", borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(200,16,46,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          {/* Blue glow */}
          <div style={{
            position: "absolute", top: "-10%", left: "-10%",
            width: "60%", height: "60%", borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,48,135,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          {/* Vertical accent — red for member, white for admin */}
          <div style={{
            position: "absolute", right: 0, top: "20%", bottom: "20%", width: 3,
            background: isAdmin
              ? "linear-gradient(to bottom,transparent,rgba(255,255,255,0.25) 30%,rgba(255,255,255,0.25) 70%,transparent)"
              : "linear-gradient(to bottom,transparent,#C8102E 30%,#C8102E 70%,transparent)",
            opacity: 0.6,
            transition: "background 0.4s ease",
          }} />

          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>

            {/* Logo */}
            <a href="/" style={{ textDecoration: "none" }}>
              <img
                src="https://static.wixstatic.com/media/8b5d4e_2037e3e1f5684f5a8941d1a13f747017~mv2.png/v1/fill/w_385,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BlueRed.png"
                alt="FITP UH"
                style={{
                  height: 110, objectFit: "contain",
                  display: "block", margin: "0 auto 2.5rem",
                  filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.4))",
                }}
              />
            </a>

            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 3.5vw, 3rem)",
              color: "white", letterSpacing: 2, lineHeight: 1,
              marginBottom: "0.75rem",
            }}>
              Welcome Back
            </h2>

            {/* Role badge — updates with toggle */}
            <div style={{
              display: "inline-block",
              padding: "0.28rem 1rem", borderRadius: 20,
              border: `1.5px solid ${isAdmin ? "rgba(255,255,255,0.18)" : "rgba(200,16,46,0.45)"}`,
              marginBottom: "1.4rem",
              transition: "border-color 0.35s ease",
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700,
                color: isAdmin ? "rgba(255,255,255,0.5)" : "#C8102E",
                transition: "color 0.35s ease",
              }}>
                {isAdmin ? "Admin Portal" : "Member Portal"}
              </span>
            </div>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.42)",
              fontSize: "0.9rem", lineHeight: 1.8,
              fontWeight: 300, maxWidth: 280, margin: "0 auto 2.5rem",
            }}>
              {isAdmin
                ? "Access the FITP UH admin dashboard to manage members, events, and content."
                : "Sign in to access your FITP UH member portal, events, and resources."
              }
            </p>

            {/* Quick nav */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "center" }}>
              {[
                { label: "About FITP",  href: "/about"      },
                { label: "Membership",  href: "/membership" },
                { label: "Contact Us",  href: "/contact"    },
              ].map((l, i) => (
                <a key={i} href={l.href} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11, letterSpacing: 2.5,
                  textTransform: "uppercase", fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "none", transition: "color 0.2s",
                }}
                  onMouseEnter={e => e.target.style.color = "#C8102E"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
                >{l.label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div style={{
          flex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#f8f7f5", padding: "3rem 2rem",
        }}>
          <div style={{ width: "100%", maxWidth: 420 }}>

            {/* Back to site */}
            <div style={{ ...anim(0.0), marginBottom: "2rem" }}>
              <a href="/" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                letterSpacing: 1.5, textTransform: "uppercase",
                color: "#aaa", textDecoration: "none", fontWeight: 700,
                transition: "color 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = "#C8102E"}
                onMouseLeave={e => e.currentTarget.style.color = "#aaa"}
              >
                <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to site
              </a>
            </div>

            {/* Header */}
            <div style={{ marginBottom: "1.5rem", ...anim(0.08) }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <span style={{ width: 24, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", color: "#C8102E",
                  fontSize: 11, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700,
                }}>FITP UH</span>
              </div>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.2rem, 4vw, 3rem)",
                color: "#03082e", letterSpacing: 2, lineHeight: 1,
              }}>Sign In</h1>
            </div>

            {/* Form card */}
            <div style={{
              background: "white", borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
              padding: "2.25rem 2rem",
              ...anim(0.16),
            }}>

              {/* ── Role toggle ── */}
              <div className="role-toggle">
                <button
                  className={`role-btn${role === "member" ? " active-member" : ""}`}
                  onClick={() => handleRoleSwitch("member")}
                >
                  Member
                </button>
                <button
                  className={`role-btn${role === "admin" ? " active-admin" : ""}`}
                  onClick={() => handleRoleSwitch("admin")}
                >
                  Admin
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

                {/* Email */}
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className={`form-input${errors.email ? " error" : ""}`}
                    type="email"
                    placeholder={isAdmin ? "admin@fitpuh.org" : "jane@example.com"}
                    value={form.email}
                    onChange={e => handleChange("email", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  {errors.email && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8102E", marginTop: 4, display: "block" }}>
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <a href="/forgot-password" className="text-link">Forgot password?</a>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      className={`form-input${errors.password ? " error" : ""}`}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => handleChange("password", e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      style={{ paddingRight: "2.8rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      style={{
                        position: "absolute", right: "0.75rem", top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#aaa", padding: 0, lineHeight: 1, transition: "color 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#C8102E"}
                      onMouseLeave={e => e.currentTarget.style.color = "#aaa"}
                      title={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? (
                        <svg viewBox="0 0 22 16" fill="none" width={18} height={18}>
                          <path d="M1 8S4.5 1 11 1s10 7 10 7-3.5 7-10 7S1 8 1 8z" stroke="currentColor" strokeWidth="1.6" />
                          <circle cx="11" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M2 2l18 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 22 16" fill="none" width={18} height={18}>
                          <path d="M1 8S4.5 1 11 1s10 7 10 7-3.5 7-10 7S1 8 1 8z" stroke="currentColor" strokeWidth="1.6" />
                          <circle cx="11" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8102E", marginTop: 4, display: "block" }}>
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Submit — color matches role */}
                <button
                  className={isAdmin ? "btn-admin" : "btn-member"}
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ marginTop: "0.3rem" }}
                >
                  {loading ? "Signing in…" : isAdmin ? "Sign In as Admin" : "Sign In"}
                </button>

              </div>

              {/* Membership nudge — member only */}
              {!isAdmin && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.6rem 0" }}>
                    <div className="divider-line" />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#ccc", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      New to FITP?
                    </span>
                    <div className="divider-line" />
                  </div>
                  <a href="/membership" style={{
                    display: "block", textAlign: "center",
                    padding: "0.82rem",
                    border: "1.5px solid rgba(0,0,0,0.12)",
                    borderRadius: 5,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                    fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
                    color: "#03082e", textDecoration: "none", transition: "all 0.22s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8102E"; e.currentTarget.style.color = "#C8102E"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.color = "#03082e"; }}
                  >
                    Become a Member
                  </a>
                </>
              )}

            </div>

            {/* Footer note */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, color: "#bbb", textAlign: "center",
              marginTop: "1.5rem", lineHeight: 1.7,
              ...anim(0.24),
            }}>
              ©2025 Future Information Technology Professionals<br />
              University of Houston – Sugar Land
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
