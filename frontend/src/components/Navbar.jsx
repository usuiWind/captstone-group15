import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── SHARED NAVBAR ────────────────────────────────────────────────────────────
// Import this into every page and pass the `active` prop:
//   <Navbar active="About" />
//   <Navbar active="Membership" />  etc.
//
// Valid active values:
//   "Home" | "About" | "Leadership" | "Gallery" | "Membership" | "Sponsorships" | "Contact"
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar({ active = "", alwaysSolid = false }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    navigate("/");
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const showSolid = alwaysSolid || scrolled;

  // "About" top-link is highlighted whenever user is on About, Leadership, or Gallery
  const aboutActive = ["About", "Leadership", "Gallery"].includes(active);

  const links = [
    { label: "Home",         href: "/" },
    { label: "About",        href: "/about", dropdown: [
        { label: "Leadership", href: "/officers" },
        { label: "Gallery",    href: "/gallery"  },
      ]
    },
    { label: "Membership",   href: "/membership"   },
    { label: "Sponsorships", href: "/sponsorships" },
    { label: "Contact",      href: "/contact"      },
  ];

  return (
    <>
      <style>{`
        .nav-link {
          color: rgba(255,255,255,0.82);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #C8102E; }
        .nav-link.nav-active { color: #C8102E; }

        .dropdown-item {
          display: block;
          padding: 10px 18px;
          color: #1a1a1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .dropdown-item:hover {
          background: rgba(200,16,46,0.06);
          color: #C8102E;
        }
        .dropdown-item.dropdown-active {
          color: #C8102E;
          font-weight: 700;
        }

        .btn-login {
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px; letter-spacing: 1.8px;
          text-transform: uppercase; font-weight: 700; color: white;
          border: 1.5px solid rgba(255,255,255,0.32); border-radius: 4;
          padding: 0.42rem 1rem; text-decoration: none; transition: all 0.2s;
          border-radius: 4px;
        }
        .btn-login:hover {
          background: #C8102E !important;
          border-color: #C8102E !important;
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: showSolid ? "rgba(3,8,46,0.97)" : "transparent",
        backdropFilter: showSolid ? "blur(14px)" : "none",
        borderBottom: showSolid ? "1px solid rgba(200,16,46,0.22)" : "none",
        transition: "all 0.35s ease",
      }}>
        <div style={{
          maxWidth: "100%", margin: "0 auto", padding: "0 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 68,
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none" }}>
            <img
              src="https://static.wixstatic.com/media/8b5d4e_2037e3e1f5684f5a8941d1a13f747017~mv2.png/v1/fill/w_385,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BlueRed.png"
              alt="FITP UH"
              style={{ height: 44, objectFit: "contain" }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2.2rem" }}>
            {links.map(l => (
              l.dropdown ? (
                /* ── About with dropdown ── */
                <div
                  key={l.label}
                  style={{ position: "relative" }}
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                >
                  <Link
                    to={l.href}
                    className={`nav-link${aboutActive ? " nav-active" : ""}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    {l.label}
                    {/* chevron */}
                    <svg
                      viewBox="0 0 10 6" fill="none" width={9} height={9}
                      style={{
                        transition: "transform 0.2s",
                        transform: aboutOpen ? "rotate(180deg)" : "rotate(0deg)",
                        opacity: 0.7,
                      }}
                    >
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>

                  {/* Dropdown panel */}
                  <div style={{
                    position: "absolute", top: "calc(100% + 0px)", left: "50%",
                    background: "white",
                    borderRadius: 8,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                    border: "1px solid rgba(0,0,0,0.07)",
                    borderTop: "3px solid #C8102E",
                    minWidth: 160,
                    overflow: "hidden",
                    // animate open/close
                    opacity: aboutOpen ? 1 : 0,
                    pointerEvents: aboutOpen ? "auto" : "none",
                    transform: aboutOpen
                      ? "translateX(-50%) translateY(0)"
                      : "translateX(-50%) translateY(-6px)",
                    transition: "opacity 0.18s ease, transform 0.18s ease",
                    transitionDelay: aboutOpen ? "0s" : "150ms",
                    zIndex: 300,
                  }}>
                    {l.dropdown.map(d => (
                      <Link
                        key={d.label}
                        to={d.href}
                        className={`dropdown-item${active === d.label ? " dropdown-active" : ""}`}
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={l.label}
                  to={l.href}
                  className={`nav-link${active === l.label ? " nav-active" : ""}`}
                >
                  {l.label}
                </Link>
              )
            ))}

            {/* Auth: dashboard/admin links + Log out, or Log In / Register */}
            {!authLoading && (
              isAuthenticated && user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Link to="/dashboard" className="nav-link" style={{ fontSize: 11 }}>
                    Dashboard
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link to="/admin" className="nav-link" style={{ fontSize: 11 }}>
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn-login"
                    onClick={handleSignOut}
                    style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.32)", borderRadius: 4, padding: "0.42rem 1rem", cursor: "pointer" }}
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-login" style={{
                    background: "transparent",
                    border: "1.5px solid rgba(255,255,255,0.32)",
                    borderRadius: 4, padding: "0.42rem 1rem",
                    textDecoration: "none",
                  }}>
                    Log In
                  </Link>
                  <Link to="/register" className="btn-login" style={{
                    background: "#C8102E", borderColor: "#C8102E",
                    borderRadius: 4, padding: "0.42rem 1rem",
                    textDecoration: "none",
                  }}>
                    Register
                  </Link>
                </>
              )
            )}
          </div>

          {/* Hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", flexDirection: "column", gap: 5, padding: 4 }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: "block", width: 24, height: 2, background: "white", borderRadius: 2 }} />
            ))}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "rgba(3,8,46,0.98)", padding: "1rem 2rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {links.map(l => (
              <div key={l.label}>
                <Link
                  to={l.href}
                  className="nav-link"
                  style={{ fontSize: 16, display: "block" }}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
                {/* Sub-links indented under About */}
                {l.dropdown && (
                  <div style={{ paddingLeft: "1.2rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {l.dropdown.map(d => (
                      <Link
                        key={d.label}
                        to={d.href}
                        className="nav-link"
                        style={{ fontSize: 13, opacity: 0.7 }}
                        onClick={() => setMenuOpen(false)}
                      >
                        — {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!authLoading && (
              isAuthenticated && user ? (
                <>
                  <Link to="/dashboard" className="nav-link" style={{ fontSize: 14 }} onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link to="/admin" className="nav-link" style={{ fontSize: 14 }} onClick={() => setMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{
                      background: "#C8102E", color: "white",
                      padding: "0.9rem 2.4rem", borderRadius: 5,
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                      fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
                      border: "none", cursor: "pointer", width: "100%",
                      boxShadow: "0 8px 28px rgba(200,16,46,0.38)",
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                    background: "transparent", color: "white",
                    padding: "0.9rem 2.4rem", borderRadius: 5,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                    fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
                    textDecoration: "none", textAlign: "center", border: "1.5px solid rgba(255,255,255,0.32)",
                  }}>Log In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} style={{
                    background: "#C8102E", color: "white",
                    padding: "0.9rem 2.4rem", borderRadius: 5,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                    fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
                    textDecoration: "none", textAlign: "center",
                    boxShadow: "0 8px 28px rgba(200,16,46,0.38)",
                  }}>Register</Link>
                </>
              )
            )}
          </div>
        )}
      </nav>
    </>
  );
}
