import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { postJson } from "../../backend";

// ─── GLOBAL STYLES (same as HomePage / AboutPage / MembershipPage) ────────────
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

    /* Form inputs */
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

    .form-label {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 0.45rem;
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
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .name-row { grid-template-columns: 1fr !important; }
      .contact-layout { grid-template-columns: 1fr !important; }
    }
  `}</style>
);


// ─── HERO — same campus photo as About page ───────────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  return (
    <section style={{ position: "relative", width: "100%", height: 420, overflow: "hidden" }}>
      <img
        src="https://static.wixstatic.com/media/8b5d4e_bc9d48df28d5472ca3183caf266ee8a4~mv2.jpg/v1/fill/w_762,h_390,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/8b5d4e_bc9d48df28d5472ca3183caf266ee8a4~mv2.jpg"
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
          <span className="section-tag">Get In Touch</span>
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(4rem, 10vw, 8rem)",
          color: "white", letterSpacing: 3, lineHeight: 0.9,
        }}>
          Contact Us
        </h1>
      </div>
    </section>
  );
}

// ─── CONTACT FORM + SIDE INFO ─────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email.trim())     e.email     = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim())   e.message   = "Required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setServerError("");

    postJson("/api/contact", {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      message: form.message,
    })
      .then(() => {
        setLoading(false);
        setSubmitted(true);
      })
      .catch((err) => {
        console.error("Contact submit failed", err);
        setLoading(false);
        setServerError(err.message || "Something went wrong. Please try again.");
      });
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  return (
    <section style={{ background: "#f8f7f5", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>

        <div
          className="contact-layout"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "4rem", alignItems: "start" }}
        >

          {/* ── Left: info panel ── */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
              <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
              <span className="section-tag">Reach Out</span>
            </div>
            <h2 className="section-title" style={{ marginBottom: "1.2rem" }}>Contact US</h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.97rem",
              color: "#666", lineHeight: 1.85, fontWeight: 300, marginBottom: "2.5rem",
            }}>
              Have a question, want to partner with us, or just want to learn more about FITP?
              Fill out the form and we'll get back to you as soon as possible.
            </p>

            {/* Contact info cards */}
            {[
              {
                color: "#C8102E",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" strokeWidth="1.8" />
                    <path d="M22 6l-10 7L2 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
                label: "Email",
                value: "fitpuh@gmail.com",
              },
              {
                color: "#003087",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="white" strokeWidth="1.8" />
                    <circle cx="12" cy="9" r="2.5" stroke="white" strokeWidth="1.8" />
                  </svg>
                ),
                label: "Location",
                value: "University of Houston – Sugar Land",
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                marginBottom: "1rem",
                background: "white", borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.07)",
                borderLeft: `3px solid ${item.color}`,
                padding: "0.9rem 1.1rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: item.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.92rem", color: "#03082e", fontWeight: 500, marginTop: 2 }}>{item.value}</div>
                </div>
              </div>
            ))}

            {/* Social links */}
            <div style={{ marginTop: "2rem" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#aaa", fontWeight: 700, marginBottom: "0.9rem" }}>
                Follow Us
              </div>
              <div style={{ display: "flex", gap: "0.7rem" }}>
                {[
                  {
                    label: "Instagram",
                    href: "https://www.instagram.com/fitpuh/",
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                      </svg>
                    ),
                  },
                  {
                    label: "LinkedIn",
                    href: "https://www.linkedin.com/company/fitp-uh/",
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
                        <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 10v7M7 7v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M11 17v-4c0-1.1.9-2 2-2s2 .9 2 2v4M11 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                    width: 40, height: 40, borderRadius: 8,
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#555", textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#C8102E"; e.currentTarget.style.borderColor = "#C8102E"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.color = "#555"; }}
                    title={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: the form ── */}
          <div style={{
            background: "white", borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            padding: "2.5rem 2.25rem",
          }}>

            {submitted ? (
              /* ── Success state ── */
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(200,16,46,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}>
                  <svg viewBox="0 0 48 48" fill="none" width={36} height={36}>
                    <circle cx="24" cy="24" r="20" stroke="#C8102E" strokeWidth="2.5" />
                    <path d="M14 24l7 7 13-14" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem",
                  letterSpacing: 2, color: "#03082e", marginBottom: "0.6rem",
                }}>Thanks for submitting!</h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.93rem",
                  color: "#777", lineHeight: 1.75, fontWeight: 300,
                }}>
                  We've received your message and will be in touch soon.
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: "1.75rem" }}
                  onClick={() => { setSubmitted(false); setForm({ firstName: "", lastName: "", email: "", message: "" }); }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              /* ── Form fields ── */
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* First + Last name row */}
                <div className="name-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">First name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Jane"
                      value={form.firstName}
                      onChange={e => handleChange("firstName", e.target.value)}
                      style={errors.firstName ? { borderColor: "#C8102E" } : {}}
                    />
                    {errors.firstName && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8102E", marginTop: 4, display: "block" }}>{errors.firstName}</span>}
                  </div>
                  <div>
                    <label className="form-label">Last name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={e => handleChange("lastName", e.target.value)}
                      style={errors.lastName ? { borderColor: "#C8102E" } : {}}
                    />
                    {errors.lastName && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8102E", marginTop: 4, display: "block" }}>{errors.lastName}</span>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={e => handleChange("email", e.target.value)}
                    style={errors.email ? { borderColor: "#C8102E" } : {}}
                  />
                  {errors.email && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8102E", marginTop: 4, display: "block" }}>{errors.email}</span>}
                </div>

                {/* Message */}
                <div>
                  <label className="form-label">Write a message</label>
                  <textarea
                    className="form-input"
                    placeholder="How can we help you?"
                    rows={6}
                    value={form.message}
                    onChange={e => handleChange("message", e.target.value)}
                    style={{
                      resize: "vertical", minHeight: 140,
                      ...(errors.message ? { borderColor: "#C8102E" } : {}),
                    }}
                  />
                  {errors.message && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8102E", marginTop: 4, display: "block" }}>{errors.message}</span>}
                </div>

                {/* Submit */}
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: "100%", textAlign: "center", marginTop: "0.25rem" }}
                >
                  {loading ? "Sending…" : "Submit"}
                </button>

                {serverError && (
                  <div style={{ marginTop: "0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C8102E", textAlign: "center" }}>
                    {serverError}
                  </div>
                )}
              </div>
            )}
          </div>
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
export default function ContactPage() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Hero />
      <ContactSection />
      <Footer />
    </>
  );
}
