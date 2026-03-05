import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

// ─── GLOBAL STYLES (same as all other pages) ──────────────────────────────────
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

    .btn-outline-dark {
      background: transparent; color: #03082e;
      padding: 0.9rem 1.9rem; border-radius: 5px;
      border: 1.5px solid rgba(3,8,46,0.22);
      font-family: 'DM Sans', sans-serif; font-weight: 500;
      font-size: 13px; letter-spacing: 1.8px; text-transform: uppercase;
      text-decoration: none; display: inline-block;
      transition: all 0.25s ease;
    }
    .btn-outline-dark:hover {
      border-color: #03082e;
      background: rgba(3,8,46,0.04);
    }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .pdf-actions { flex-direction: column !important; align-items: stretch !important; }
      .pdf-actions a, .pdf-actions button { text-align: center !important; }
    }
  `}</style>
);


// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  return (
    <section style={{ position: "relative", width: "100%", height: 420, overflow: "hidden" }}>
      <img
        src="https://static.wixstatic.com/media/8b5d4e_bc9d48df28d5472ca3183caf266ee8a4~mv2.jpg/v1/fill/w_855,h_438,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/8b5d4e_bc9d48df28d5472ca3183caf266ee8a4~mv2.jpg"
        alt="FITP UH campus"
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
          <span className="section-tag">Partner With Us</span>
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(4rem, 10vw, 8rem)",
          color: "white", letterSpacing: 3, lineHeight: 0.9,
        }}>
          Sponsorships
        </h1>
      </div>
    </section>
  );
}

// ─── SPONSORSHIP PACKET (PDF viewer) ─────────────────────────────────────────
function SponsorshipPacket() {
  const PDF_PATH = "/sponsorship-packet.pdf";
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError]   = useState(false);

  return (
    <section style={{ background: "#f8f7f5", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">Documents</span>
          </div>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>Sponsorship Packet</h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.97rem",
            color: "#666", lineHeight: 1.85, fontWeight: 300, maxWidth: 620,
          }}>
            Interested in supporting FITP UH? View our sponsorship packet below to learn about
            partnership tiers, benefits, and how your organization can make an impact.
          </p>

          {/* Action buttons */}
          <div className="pdf-actions" style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <a
              href={PDF_PATH}
              download="FITP-UH-Sponsorship-Packet.pdf"
              className="btn-primary"
            >
              {/* Download icon */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                  <path d="M10 3v9M6 8l4 4 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Download Packet
              </span>
            </a>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-dark"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
                  <path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4" stroke="#03082e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Open in New Tab
              </span>
            </a>
          </div>
        </div>

        {/* PDF Viewer */}
        <div style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        }}>
          {/* Viewer toolbar */}
          <div style={{
            background: "#03082e",
            padding: "0.75rem 1.25rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {/* PDF icon */}
              <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" />
                <path d="M14 2v6h6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 13h1.5a1.5 1.5 0 010 3H9v-3zM9 16v2M14 13v5M14 15.5h2" stroke="#C8102E" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                color: "rgba(255,255,255,0.7)", letterSpacing: 1,
              }}>
                FITP-UH-Sponsorship-Packet.pdf
              </span>
            </div>
            <a
              href={PDF_PATH}
              download="FITP-UH-Sponsorship-Packet.pdf"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700,
                color: "#C8102E", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
                <path d="M8 2v8M5 7l3 3 3-3" stroke="#C8102E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#C8102E" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Download
            </a>
          </div>

          {/* iframe embed */}
          {!pdfError ? (
            <div style={{ position: "relative" }}>
              {/* Loading shimmer shown until iframe fires onLoad */}
              {!pdfLoaded && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 1,
                  background: "#f8f7f5",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "1rem",
                  minHeight: 640,
                }}>
                  <svg viewBox="0 0 48 48" fill="none" width={48} height={48} style={{ opacity: 0.2 }}>
                    <path d="M28 4H12a4 4 0 00-4 4v32a4 4 0 004 4h24a4 4 0 004-4V20L28 4z" stroke="#03082e" strokeWidth="2.5" />
                    <path d="M28 4v16h16" stroke="#03082e" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa", letterSpacing: 1 }}>
                    Loading document…
                  </span>
                </div>
              )}
              <iframe
                src={`${PDF_PATH}#toolbar=0&navpanes=0&scrollbar=1`}
                title="FITP UH Sponsorship Packet"
                width="100%"
                style={{
                  height: "80vh", minHeight: 640,
                  border: "none", display: "block",
                  opacity: pdfLoaded ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
                onLoad={() => setPdfLoaded(true)}
                onError={() => setPdfError(true)}
              />
            </div>
          ) : (
            /* Fallback if browser blocks iframe PDF */
            <div style={{
              padding: "4rem 2rem", textAlign: "center",
              minHeight: 320, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "1.2rem",
            }}>
              <svg viewBox="0 0 48 48" fill="none" width={52} height={52} style={{ opacity: 0.18 }}>
                <path d="M28 4H12a4 4 0 00-4 4v32a4 4 0 004 4h24a4 4 0 004-4V20L28 4z" stroke="#03082e" strokeWidth="2.5" />
                <path d="M28 4v16h16" stroke="#03082e" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "#888", lineHeight: 1.7 }}>
                Your browser couldn't display the PDF inline.<br />Use the buttons below to view it.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <a href={PDF_PATH} download="FITP-UH-Sponsorship-Packet.pdf" className="btn-primary">Download Packet</a>
                <a href={PDF_PATH} target="_blank" rel="noopener noreferrer" className="btn-outline-dark">Open in New Tab</a>
              </div>
            </div>
          )}
        </div>

        {/* Contact nudge below the PDF */}
        <div style={{
          marginTop: "2.5rem", padding: "1.5rem 2rem",
          background: "#03082e", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "1rem",
          borderLeft: "4px solid #C8102E",
        }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "white", letterSpacing: 1.5 }}>
              Ready to partner with us?
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: 300 }}>
              Reach out and we'll get back to you right away.
            </div>
          </div>
          <a href="/contact" className="btn-primary">Contact Us</a>
        </div>

      </div>
    </section>
  );
}

// ─── FOOTER (identical across all pages) ─────────────────────────────────────
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
export default function SponsorshipsPage() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Hero />
      <SponsorshipPacket />
      <Footer />
    </>
  );
}
