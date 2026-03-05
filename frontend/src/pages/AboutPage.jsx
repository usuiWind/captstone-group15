import { useState, useEffect } from "react";

// ─── GLOBAL STYLES (same as HomePage) ────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; width: 100%; }
    body { font-family: 'DM Sans', sans-serif; background: white; overflow-x: hidden; width: 100%; }
    #root { width: 100%; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }

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

    /* Value card hover */
    .value-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .value-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.12);
    }

    /* Achievement card hover */
    .ach-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .ach-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 18px 48px rgba(0,0,0,0.18);
    }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .two-col { grid-template-columns: 1fr !important; }
      .values-grid { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 480px) {
      .values-grid { grid-template-columns: 1fr !important; }
      .ach-row { flex-direction: column !important; align-items: center !important; }
    }
  `}</style>
);

// ─── NAVBAR (identical to HomePage) ──────────────────────────────────────────
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
              className={`nav-link${l.label === "About" ? " active" : ""}`}
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

// ─── HERO — campus photo banner + "About" title ───────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  return (
    <section style={{ position: "relative", width: "100%", height: 420, overflow: "hidden", marginTop: 0 }}>
      {/* The actual campus photo from the about page */}
      <img
        src="https://static.wixstatic.com/media/8b5d4e_bc9d48df28d5472ca3183caf266ee8a4~mv2.jpg/v1/fill/w_959,h_491,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/8b5d4e_bc9d48df28d5472ca3183caf266ee8a4~mv2.jpg"
        alt="FITP UH campus"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      {/* Dark overlay so text is readable */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(3,8,46,0.55) 0%, rgba(3,8,46,0.72) 100%)",
      }} />
      {/* Grid texture — same as HomePage hero */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035,
        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      {/* Vertical accent line — same as HomePage */}
      <div style={{
        position: "absolute", left: "7.5%", top: "15%", bottom: "15%", width: 3,
        background: "linear-gradient(to bottom,transparent,#C8102E 30%,#C8102E 70%,transparent)",
        opacity: 0.7,
      }} />

      {/* Title content */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        justifyContent: "center", paddingLeft: "clamp(2rem, 8vw, 7rem)",
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
          About
        </h1>
      </div>
    </section>
  );
}

// ─── WHAT IS FITP ─────────────────────────────────────────────────────────────
function WhatIsFITP() {
  return (
    <section style={{ background: "white", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem" }}>
          <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          <span className="section-tag">Our Organization</span>
          <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
        </div>
        <h2 className="section-title" style={{ marginBottom: "1.6rem" }}>What is FITP?</h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "1.08rem", color: "#555", lineHeight: 1.9, fontWeight: 300,
        }}>
          FITP is the <strong style={{ fontWeight: 700, color: "#03082e" }}>Future Information Technology Professionals</strong>.
          We are a student chapter of a national organization. Our mission is to provide our members with
          the opportunities and resources necessary to advance their IT careers.
        </p>
      </div>
    </section>
  );
}

// ─── CORE VALUES ──────────────────────────────────────────────────────────────
const CORE_VALUES = [
  {
    accentColor: "#003087",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={44} height={44}>
        <circle cx="26" cy="26" r="22" stroke="#003087" strokeWidth="2.5" />
        <path d="M15 26l8 8 14-14" stroke="#003087" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Integrity",
    desc: "We value professionalism and uphold the FITP Code of Ethics and Code of Conduct.",
  },
  {
    accentColor: "#C8102E",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={44} height={44}>
        <circle cx="26" cy="18" r="8" stroke="#C8102E" strokeWidth="2.5" />
        <path d="M10 46c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M36 22c4.418 0 8 3.582 8 8" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 22c-4.418 0-8 3.582-8 8" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Respect",
    desc: "We build an inclusive environment through mentoring, delivering on commitments, working together with trust, and enjoying the camaraderie between one another.",
  },
  {
    accentColor: "#003087",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={44} height={44}>
        <path d="M26 6l3.5 10.5H41L31.5 23l3.5 10.5L26 27l-9 6.5 3.5-10.5L11 16.5h11.5z"
          stroke="#003087" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M26 38v8M20 46h12" stroke="#003087" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Innovation",
    desc: "We learn, share insights, and encourage our members to make a difference today and for the future.",
  },
  {
    accentColor: "#C8102E",
    icon: (
      <svg viewBox="0 0 52 52" fill="none" width={44} height={44}>
        <path d="M26 6v10M18 10l5 8M34 10l-5 8" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="8" y="28" width="36" height="18" rx="4" stroke="#C8102E" strokeWidth="2.5" />
        <path d="M18 37h16" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Service",
    desc: "We stay up-to-date in technology, business, and academia. We contribute to the IT profession and society through strong leadership skills, sharp critical thinking skills, and effective decision making.",
  },
];

function CoreValues() {
  return (
    <section style={{ background: "#f8f7f5", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem" }}>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">What We Stand For</span>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          </div>
          <h2 className="section-title">Core Values</h2>
        </div>

        <div
          className="values-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {CORE_VALUES.map((v, i) => (
            <div key={i} className="value-card" style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.07)",
              borderTop: `4px solid ${v.accentColor}`,
              borderRadius: 10,
              padding: "2rem 1.6rem",
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", gap: "1rem",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: v.accentColor === "#003087" ? "rgba(0,48,135,0.08)" : "rgba(200,16,46,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {v.icon}
              </div>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.7rem", letterSpacing: 2,
                color: "#03082e", margin: 0,
              }}>{v.title}</h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9rem", color: "#666",
                lineHeight: 1.75, fontWeight: 300, margin: 0,
              }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── WHY JOIN ─────────────────────────────────────────────────────────────────
function WhyJoin() {
  const reasons = [
    "Access to member-only conferences with IT leaders of many Fortune 500 companies.",
    "Opportunity to expand your network with fellow IT professionals and others from the University of Houston.",
    "Opportunity to acquire helpful information from upperclassmen about your current coursework.",
  ];

  return (
    <section style={{ background: "white", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}
        >
          {/* The actual study group photo from the about page */}
          <div style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.13)" }}>
            <img
              src="https://static.wixstatic.com/media/11062b_83b5e9cb239542c59c17312ad925ad3d~mv2.jpg/v1/fill/w_625,h_417,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_83b5e9cb239542c59c17312ad925ad3d~mv2.jpg"
              alt="FITP Study Group"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          {/* Text */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
              <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
              <span className="section-tag">Membership Benefits</span>
            </div>
            <h2 className="section-title" style={{ marginBottom: "1.8rem" }}>Why Join FITP?</h2>

            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reasons.map((r, i) => (
                <li key={i} style={{
                  display: "flex", gap: "0.9rem", alignItems: "flex-start",
                  padding: "0.9rem 1.1rem",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderLeft: "3px solid #C8102E",
                  borderRadius: 6,
                  background: "#fafafa",
                }}>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1rem", color: "#C8102E",
                    minWidth: 20, lineHeight: 1.6,
                  }}>{i + 1}.</span>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.92rem", color: "#444",
                    lineHeight: 1.7, margin: 0, fontWeight: 400,
                  }}>{r}</p>
                </li>
              ))}
            </ul>

            <a href="/membership" className="btn-primary" style={{ marginTop: "2rem", display: "inline-block" }}>
              Join Today
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── HISTORY + ACHIEVEMENTS ───────────────────────────────────────────────────
function History() {
  return (
    <section style={{ background: "#f8f7f5", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* History header + paragraph */}
        <div style={{ marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.7rem" }}>
            <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">Our Story</span>
          </div>
          <h2 className="section-title" style={{ marginBottom: "1.4rem" }}>History</h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "1.02rem", color: "#555",
            lineHeight: 1.9, fontWeight: 300, maxWidth: 820,
          }}>
            Founded in <strong style={{ fontWeight: 700, color: "#03082e" }}>1999</strong>, and re-launched
            in <strong style={{ fontWeight: 700, color: "#03082e" }}>2007</strong>, FITP of UH has consistently
            maintained a high level of excellence. The Organization has represented the University of Houston as a
            top 3 overall school in 2009, 2010, 2013, 2014, 2016, 2021, 2022, and 2023 according to the AITP
            Region 3 Student Conference. FITP currently has over{" "}
            <strong style={{ fontWeight: 700, color: "#03082e" }}>200 active members</strong> and is growing each day.
          </p>
        </div>

        {/* Achievements */}
        <div>
          <h3 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            color: "#03082e", letterSpacing: 2,
            marginBottom: "2rem",
          }}>Achievements</h3>

          <div className="ach-row" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[
              { label: "2023 USITCC Regional" },
              { label: "2023 USITCC National" },
            ].map((a, i) => (
              <div key={i} className="ach-card" style={{
                flex: "1 1 300px",
                background: "white",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 6px 30px rgba(0,0,0,0.07)",
              }}>
                {/* Label bar */}
                <div style={{
                  background: i === 0 ? "#03082e" : "#C8102E",
                  padding: "0.6rem 1.2rem",
                }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: 2.5, textTransform: "uppercase",
                    color: "white",
                  }}>{a.label}</span>
                </div>
                {/* The actual achievement image from the about page */}
                <img
                  src="https://static.wixstatic.com/media/8b5d4e_0d4b7e0cc75c451085688a63359fe67c~mv2.png/v1/fill/w_403,h_302,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/8b5d4e_0d4b7e0cc75c451085688a63359fe67c~mv2.png"
                  alt={a.label}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SPONSORSHIP ──────────────────────────────────────────────────────────────
function Sponsorship() {
  return (
    <section style={{
      background: "linear-gradient(135deg, #C8102E 0%, #78091b 100%)",
      padding: "6rem 2rem", position: "relative", overflow: "hidden",
    }}>
      {/* Same diagonal pattern as HomePage MembershipCTA */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.05,
        backgroundImage: "repeating-linear-gradient(45deg,white 0,white 1px,transparent 1px,transparent 50%)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <span className="section-tag" style={{ color: "rgba(255,255,255,0.65)", display: "block", marginBottom: "0.9rem" }}>
          Partner With Us
        </span>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          color: "white", letterSpacing: 2,
          margin: "0 0 1.1rem", lineHeight: 1,
        }}>
          Sponsorship
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          color: "rgba(255,255,255,0.75)", fontSize: "1.02rem",
          lineHeight: 1.75, marginBottom: "2.2rem", fontWeight: 300,
        }}>
          Support the next generation of IT professionals at the University of Houston.
        </p>
        <a href="/sponsorships" style={{
          background: "white", color: "#C8102E",
          padding: "0.9rem 2.8rem", borderRadius: 5,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
          textDecoration: "none",
          boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
          transition: "all 0.25s", display: "inline-block",
        }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 14px 40px rgba(0,0,0,0.3)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 8px 28px rgba(0,0,0,0.22)"; }}
        >
          Click Here to Learn More
        </a>
      </div>
    </section>
  );
}

// ─── FOOTER (identical to HomePage) ──────────────────────────────────────────
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
export default function AboutPage() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Hero />
      <WhatIsFITP />
      <CoreValues />
      <WhyJoin />
      <History />
      <Sponsorship />
      <Footer />
    </>
  );
}
