import { useState, useEffect } from "react";

// ─── GLOBAL STYLES (same as HomePage + AboutPage) ─────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; width: 100%; }
    body { font-family: 'DM Sans', sans-serif; background: white; overflow-x: hidden; width: 100%; }
    #root { width: 100%; }

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
    .nav-link.active { color: #C8102E; }

    .section-tag {
      font-family: 'DM Sans', sans-serif;
      color: #C8102E; font-size: 11px;
      letter-spacing: 4px; text-transform: uppercase; font-weight: 700;
    }
    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2.2rem, 4.5vw, 3.4rem);
      color: #03082e; letter-spacing: 2px; line-height: 1;
    }

    .btn-primary {
      background: #C8102E; color: white;
      padding: 0.9rem 2.4rem; border-radius: 5px;
      font-family: 'DM Sans', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
      text-decoration: none; display: inline-block;
      box-shadow: 0 8px 28px rgba(200,16,46,0.38);
      transition: all 0.25s ease; border: none; cursor: pointer;
    }
    .btn-primary:hover {
      background: #a00d25;
      transform: translateY(-2px);
      box-shadow: 0 14px 36px rgba(200,16,46,0.46);
    }

    /* Membership action cards */
    .mem-card {
      transition: transform 0.28s ease, box-shadow 0.28s ease;
      cursor: pointer;
    }
    .mem-card:hover {
      transform: translateY(-7px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.13);
    }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .mem-cards { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─── NAVBAR (identical to HomePage / AboutPage) ───────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Home",         href: "/" },
    { label: "About",        href: "/about" },
    { label: "Membership",   href: "/membership" },
    { label: "Sponsorships", href: "/sponsorships" },
    { label: "Contact",      href: "/contact" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? "rgba(3,8,46,0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(200,16,46,0.22)" : "none",
      transition: "all 0.35s ease",
    }}>
      <div style={{
        maxWidth: "100%", margin: "0 auto", padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 68,
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img
            src="https://static.wixstatic.com/media/8b5d4e_2037e3e1f5684f5a8941d1a13f747017~mv2.png/v1/fill/w_385,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BlueRed.png"
            alt="FITP UH"
            style={{ height: 44, objectFit: "contain" }}
          />
        </a>

        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2.2rem" }}>
          {links.map(l => (
            <a
              key={l.label}
              href={l.href}
              className={`nav-link${l.label === "Membership" ? " active" : ""}`}
            >
              {l.label}
            </a>
          ))}
          <a href="/login" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, letterSpacing: 1.8,
            textTransform: "uppercase", fontWeight: 700, color: "white",
            border: "1.5px solid rgba(255,255,255,0.32)", borderRadius: 4,
            padding: "0.42rem 1rem", textDecoration: "none", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.target.style.background = "#C8102E"; e.target.style.borderColor = "#C8102E"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(255,255,255,0.32)"; }}
          >Log In</a>
        </div>

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

      {menuOpen && (
        <div style={{ background: "rgba(3,8,46,0.98)", padding: "1rem 2rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {links.map(l => (
            <a key={l.label} href={l.href} className="nav-link" style={{ fontSize: 16 }} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/login" className="btn-primary" style={{ textAlign: "center" }}>Log In</a>
        </div>
      )}
    </nav>
  );
}

// ─── HERO — skyline banner photo ──────────────────────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  return (
    <section style={{ position: "relative", width: "100%", height: 420, overflow: "hidden" }}>
      {/* Skyline photo from the real membership page */}
      <img
        src="https://static.wixstatic.com/media/8b5d4e_f57a8a9f0bc747c5bce221490f93ee35~mv2.jpg/v1/fill/w_980,h_404,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/8b5d4e_f57a8a9f0bc747c5bce221490f93ee35~mv2.jpg"
        alt="FITP UH Skyline"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(3,8,46,0.52) 0%, rgba(3,8,46,0.74) 100%)",
      }} />
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035,
        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      {/* Vertical accent */}
      <div style={{
        position: "absolute", left: "7.5%", top: "15%", bottom: "15%", width: 3,
        background: "linear-gradient(to bottom,transparent,#C8102E 30%,#C8102E 70%,transparent)",
        opacity: 0.7,
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center",
        paddingLeft: "clamp(2rem, 8vw, 7rem)",
        opacity: ready ? 1 : 0,
        transform: ready ? "translateY(0)" : "translateY(22px)",
        transition: "opacity 0.85s ease 0.1s, transform 0.85s ease 0.1s",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
          <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          <span className="section-tag">University of Houston · Sugar Land</span>
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(4rem, 10vw, 8rem)",
          color: "white", letterSpacing: 3, lineHeight: 0.9,
        }}>
          Membership
        </h1>
      </div>
    </section>
  );
}

// ─── BECOME A MEMBER ──────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    accentColor: "#C8102E",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={40} height={40}>
        <rect x="8" y="10" width="36" height="32" rx="4" stroke="#C8102E" strokeWidth="2.5" />
        <path d="M17 26h18M17 33h12" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M17 19h8" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="38" cy="38" r="8" fill="#C8102E" />
        <path d="M35 38l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Get Membership",
    sublabel: "Purchase your FITP membership",
    href: "https://www.fitpuh.org/merchandise",
    cta: "Purchase Membership",
    external: true,
  },
  {
    num: "02",
    accentColor: "#003087",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={40} height={40}>
        <path d="M26 10c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16S34.837 10 26 10z" stroke="#003087" strokeWidth="2.5" />
        <path d="M26 18v8l5 5" stroke="#003087" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 6l-4 4 4 4" stroke="#003087" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M38 6l4 4-4 4" stroke="#003087" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Complete Registration",
    sublabel: "Fill out the registration process",
    href: "https://docs.google.com/forms/d/1Bq76dx5Xr6_WWXwl0oYG2IplY5_pX2mpsJxZuI-ijzg/viewform?edit_requested=true",
    cta: "Complete Registration Process",
    external: true,
  },
  {
    num: "03",
    accentColor: "#C8102E",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={40} height={40}>
        <rect x="10" y="14" width="32" height="26" rx="4" stroke="#C8102E" strokeWidth="2.5" />
        <path d="M10 22h32" stroke="#C8102E" strokeWidth="2.5" />
        <path d="M18 10v8M34 10v8" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 30h4v4h-4z" fill="#C8102E" />
        <path d="M24 30h4v4h-4z" fill="rgba(200,16,46,0.4)" />
        <path d="M30 30h4v4h-4z" fill="rgba(200,16,46,0.2)" />
      </svg>
    ),
    label: "Access Registration Form",
    sublabel: "Complete your member profile",
    href: "/member-register-form",
    cta: "Access Registration Form",
    external: false,
  },
];

function BecomeAMember() {
  return (
    <section style={{ background: "white", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem" }}>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">Join the Community</span>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          </div>
          <h2 className="section-title" style={{ marginBottom: "1.2rem" }}>Become a Member</h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "1.05rem", color: "#555",
            lineHeight: 1.9, fontWeight: 300,
            maxWidth: 640, margin: "0 auto",
          }}>
            Become a member of FITP today and get access to the right mentorship, technical knowledge,
            and exclusive networking opportunities that you need to advance your IT career.
          </p>
        </div>

        {/* Step divider label */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            letterSpacing: 3, textTransform: "uppercase",
            color: "#aaa", fontWeight: 700, whiteSpace: "nowrap",
          }}>3 simple steps</span>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        </div>

        {/* Three action cards */}
        <div
          className="mem-cards"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.75rem",
          }}
        >
          {STEPS.map((s, i) => (
            <div key={i} className="mem-card" style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.07)",
              borderTop: `4px solid ${s.accentColor}`,
              borderRadius: 10,
              padding: "2rem 1.75rem 2.25rem",
              display: "flex", flexDirection: "column",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              {/* Step number + icon row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.4rem" }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "3.5rem", lineHeight: 1,
                  color: "rgba(0,0,0,0.06)", letterSpacing: 2,
                  userSelect: "none",
                }}>{s.num}</span>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: s.accentColor === "#C8102E" ? "rgba(200,16,46,0.07)" : "rgba(0,48,135,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {s.icon}
                </div>
              </div>

              {/* Label */}
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.65rem", letterSpacing: 1.5,
                color: "#03082e", marginBottom: "0.4rem",
              }}>{s.label}</h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.88rem", color: "#888",
                lineHeight: 1.6, fontWeight: 300,
                marginBottom: "1.75rem", flex: 1,
              }}>{s.sublabel}</p>

              {/* CTA button */}
              <a
                href={s.href}
                target={s.external ? "_blank" : "_self"}
                rel={s.external ? "noopener noreferrer" : undefined}
                style={{
                  display: "block", textAlign: "center",
                  padding: "0.78rem 1.2rem", borderRadius: 5,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  fontSize: 12, letterSpacing: 1.8, textTransform: "uppercase",
                  textDecoration: "none", transition: "all 0.25s",
                  background: s.accentColor === "#C8102E" ? "#C8102E" : "#03082e",
                  color: "white",
                  boxShadow: s.accentColor === "#C8102E"
                    ? "0 6px 20px rgba(200,16,46,0.3)"
                    : "0 6px 20px rgba(3,8,46,0.25)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = s.accentColor === "#C8102E"
                    ? "0 12px 32px rgba(200,16,46,0.42)"
                    : "0 12px 32px rgba(3,8,46,0.38)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = s.accentColor === "#C8102E"
                    ? "0 6px 20px rgba(200,16,46,0.3)"
                    : "0 6px 20px rgba(3,8,46,0.25)";
                }}
              >
                {s.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER (identical to HomePage / AboutPage) ───────────────────────────────
function Footer() {
  const cols = [
    { heading: "Navigate", links: [{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Leadership", href: "/officers" }, { label: "Gallery", href: "/gallery" }] },
    { heading: "Connect",  links: [{ label: "Membership", href: "/membership" }, { label: "Sponsorships", href: "/sponsorships" }, { label: "Contact", href: "/contact" }] },
  ];
  return (
    <footer style={{ background: "#03082e", color: "white", padding: "3.5rem 2rem", borderTop: "1px solid rgba(200,16,46,0.22)" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2.5rem", marginBottom: "2.5rem" }}>
          <div>
            <img
              src="https://static.wixstatic.com/media/8b5d4e_2037e3e1f5684f5a8941d1a13f747017~mv2.png/v1/fill/w_385,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BlueRed.png"
              alt="FITP UH"
              style={{ height: 54, objectFit: "contain", marginBottom: "0.75rem", display: "block" }}
            />
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.42)", fontSize: 13, lineHeight: 1.65, maxWidth: 240 }}>
              Future Information Technology Professionals<br />University of Houston – Sugar Land
            </p>
          </div>
          <div style={{ display: "flex", gap: "3.5rem", flexWrap: "wrap" }}>
            {cols.map(col => (
              <div key={col.heading}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase", color: "#C8102E", marginBottom: "1rem" }}>
                  {col.heading}
                </div>
                {col.links.map(l => (
                  <a key={l.label} href={l.href} style={{
                    display: "block", color: "rgba(255,255,255,0.47)", textDecoration: "none",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, marginBottom: "0.55rem", transition: "color 0.2s",
                  }}
                    onMouseEnter={e => e.target.style.color = "white"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.47)"}
                  >{l.label}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.26)", fontSize: 12 }}>©2025 Future Information Technology Professionals</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy Policy", "Terms"].map(t => (
              <a key={t} href="#" style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.26)", fontSize: 12, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.26)"}
              >{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function MembershipPage() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Hero />
      <BecomeAMember />
      <Footer />
    </>
  );
}
