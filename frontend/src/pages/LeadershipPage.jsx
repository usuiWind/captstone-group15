import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; width: 100%; }
    body { font-family: 'DM Sans', sans-serif; background: white; overflow-x: hidden; width: 100%; }
    #root { width: 100%; }

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

    /* Member card */
    .member-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: transform 0.28s ease;
    }
    .member-card:hover { transform: translateY(-5px); }
    .member-card:hover .member-img { box-shadow: 0 16px 40px rgba(0,0,0,0.18); }
    .member-card:hover .member-img-inner { transform: scale(1.04); }

    .member-img {
      width: 160px; height: 160px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #C8102E, #003087) border-box;
      box-shadow: 0 6px 24px rgba(0,0,0,0.1);
      transition: box-shadow 0.28s ease;
      flex-shrink: 0;
    }
    .member-img-inner {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    /* Faculty card is slightly smaller */
    .faculty-card .member-img { width: 136px; height: 136px; }

    /* Section divider label */
    .group-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px; font-weight: 700;
      letter-spacing: 4px; text-transform: uppercase;
      color: #C8102E;
      display: inline-block;
      padding: 0.3rem 1rem;
      border: 1.5px solid rgba(200,16,46,0.3);
      border-radius: 20px;
    }

    @media (max-width: 768px) {
      .officers-grid  { grid-template-columns: repeat(2, 1fr) !important; }
      .coords-grid    { grid-template-columns: repeat(2, 1fr) !important; }
      .faculty-grid   { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
      .officers-grid  { grid-template-columns: 1fr !important; }
      .coords-grid    { grid-template-columns: 1fr !important; }
      .faculty-grid   { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─── DATA ─────────────────────────────────────────────────────────────────────
const OFFICERS = [
  {
    name: "Omair Siddiqui",
    role: "President",
    img: "https://static.wixstatic.com/media/8b5d4e_701a8ac4ae494d1589a0fa1c138a042f~mv2.jpg/v1/crop/x_0,y_195,w_2313,h_2312/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Omair%20Headshot.jpg",
  },
  {
    name: "Krishna Patel",
    role: "Vice President",
    img: "https://static.wixstatic.com/media/8b5d4e_bb8610dd41e74bb6859e201adeeffede~mv2.jpeg/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_6456.jpeg",
  },
  {
    name: "Aruba Noor",
    role: "Operations Officer",
    img: "https://static.wixstatic.com/media/8b5d4e_625366d9ea8a4699830316a40d85d363~mv2.jpeg/v1/crop/x_235,y_592,w_1218,h_1217/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_4198.jpeg",
  },
  {
    name: "Orlando Garay",
    role: "Treasurer",
    img: "https://static.wixstatic.com/media/8b5d4e_878a0cee9a1242cc809d6491b4d3b2e7~mv2.jpeg/v1/crop/x_267,y_0,w_558,h_558/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_3593.jpeg",
  },
  {
    name: "Daniel Luciano",
    role: "Member Relations Officer",
    img: "https://static.wixstatic.com/media/8b5d4e_d229e9a11b9d4ad6b9d7c8eb4c3741be~mv2.jpeg/v1/crop/x_0,y_119,w_3840,h_3834/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Daniel_Luciano_0068_2.jpeg",
  },
  {
    name: "Zaid Muhammad",
    role: "Professional Development Officer",
    img: "https://static.wixstatic.com/media/8b5d4e_995013eb8a984cf8a1a7f549af94c60c~mv2.jpg/v1/crop/x_48,y_47,w_345,h_345/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Untitled%20design_edited_edited.jpg",
  },
  {
    name: "Albina Aldreen",
    role: "Marketing Officer",
    img: "https://static.wixstatic.com/media/8b5d4e_6f9a41ce2ee94073a349b2740d4d8e38~mv2.jpg/v1/crop/x_0,y_242,w_801,h_801/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_6721_JPG.jpg",
  },
];

const COORDINATORS = [
  {
    name: "Jessica Umunnakwe",
    role: "Professional Development Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_0d0eb43582c74a858d43ab5000232212~mv2.jpg/v1/crop/x_0,y_72,w_2321,h_2323/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Headshot%20copy.jpg",
  },
  {
    name: "Anthony Moss",
    role: "Professional Development Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_f34def5620f542efaa8e4b9aa1d09abe~mv2.jpeg/v1/crop/x_330,y_0,w_592,h_591/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_5308.jpeg",
  },
  {
    name: "Waseem Sayyedahmad",
    role: "Professional Development Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_85221b9c2f4c413aad96b2d57add9307~mv2.jpeg/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/prof.jpeg",
  },
  {
    name: "Quincy Britton",
    role: "Professional Development Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_f250f99c28584aa99e8437e9593e17d3~mv2.jpg/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1757662786225_edited.jpg",
  },
  {
    name: "Jose Martinez",
    role: "Member Relations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_2539b530960a40afb5d9dddd36d86b12~mv2.jpg/v1/crop/x_370,y_58,w_541,h_541/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_6578_JPG.jpg",
  },
  {
    name: "Nicholas Ortegon Terreros",
    role: "Member Relations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_0c1e1aec56dc4e4c9fd6d7a023b50e76~mv2.jpeg/v1/crop/x_0,y_19,w_597,h_598/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/original-EC81A92D-2ADE-4AFD-97AF-4CCCCB207C51.jpeg",
  },
  {
    name: "Ridha Aliyar",
    role: "Member Relations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_1ade6324567745f18be436d375b636e6~mv2.jpg/v1/crop/x_0,y_36,w_2675,h_2676/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Professional_Pic-%20Ridha%20Aliyar.jpg",
  },
  {
    name: "Khang Nguyen",
    role: "Member Relations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_3044619260e24e2a8e27a88b87ee325f~mv2.jpeg/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Khang%20headshot.jpeg",
  },
  {
    name: "Faisal Khandhia",
    role: "Marketing Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_d97ea990ba104a85b5bcab05827474e8~mv2.jpeg/v1/crop/x_617,y_217,w_860,h_860/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_8238.jpeg",
  },
  {
    name: "Amna Ahmed",
    role: "Marketing Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_8e897a286cac4d9587d653bcd9160bac~mv2.jpg/v1/crop/x_78,y_0,w_622,h_622/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1b5afa5d-c03c-4e31-92dd-9096b0b3d62c_JPG.jpg",
  },
  {
    name: "Hiab Negash",
    role: "Operations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_8f64046dd2ed4391a362b009d3ce9f54~mv2.jpg/v1/crop/x_766,y_881,w_1874,h_1874/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/headshot.jpg",
  },
  {
    name: "Aliya Simon",
    role: "Operations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_b6b6799dc75941a8a2b722c8e20e0f32~mv2.jpeg/v1/crop/x_8,y_0,w_920,h_920/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_4986.jpeg",
  },
  {
    name: "Bolaji Adegbuyi",
    role: "Operations Coordinator",
    img: "https://static.wixstatic.com/media/8b5d4e_e7674a418fa94aab96864e8dc47e9c47~mv2.jpeg/v1/crop/x_393,y_813,w_1672,h_1671/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_2025_02_06-13_56_13_7340_F91DB9D1.jpeg",
  },
];

const FACULTY = [
  {
    name: "Jose Martinez",
    role: "CIS Faculty Advisor",
    img: "https://static.wixstatic.com/media/8b5d4e_93bfb036561043979240e47e9ba6f3fc~mv2.jpg/v1/fill/w_207,h_207,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/martinez-jose.jpg",
  },
  {
    name: "Suresh Kumar",
    role: "CIS Faculty Advisor",
    img: "https://static.wixstatic.com/media/8b5d4e_14ccc550875a4b948696d17126b37f2f~mv2.jpeg/v1/crop/x_320,y_307,w_366,h_366/fill/w_207,h_207,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1525353502460.jpeg",
  },
];

// ─── MEMBER CARD ──────────────────────────────────────────────────────────────
function MemberCard({ name, role, img, small = false }) {
  return (
    <div className={`member-card${small ? " faculty-card" : ""}`}>
      <div className="member-img">
        <img src={img} alt={name} className="member-img-inner" />
      </div>
      <div style={{ marginTop: "0.9rem" }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700, fontSize: small ? "0.92rem" : "0.97rem",
          color: "#03082e", marginBottom: "0.2rem",
        }}>{name}</div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: small ? "0.78rem" : "0.82rem",
          color: "#C8102E", fontWeight: 500,
          letterSpacing: 0.4,
        }}>{role}</div>
      </div>
    </div>
  );
}

// ─── SECTION GROUP ────────────────────────────────────────────────────────────
function GroupSection({ label, members, gridClass, small }) {
  return (
    <div style={{ marginBottom: "4.5rem" }}>
      {/* Group label pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", marginBottom: "2.5rem" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        <span className="group-label">{label}</span>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
      </div>

      <div
        className={gridClass}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${small ? 4 : 4}, 1fr)`,
          gap: "2.5rem 1.5rem",
          justifyItems: "center",
        }}
      >
        {members.map((m, i) => (
          <MemberCard key={i} {...m} small={small} />
        ))}
      </div>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
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
export default function LeadershipPage() {
  return (
    <>
      <GlobalStyles />
      <Navbar active="Leadership" alwaysSolid />

      {/* Page content starts below fixed navbar */}
      <div style={{ paddingTop: 68 }}>

        {/* ── Page header ── */}
        <section style={{
          background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)",
          padding: "5rem 2rem 4.5rem",
          position: "relative", overflow: "hidden",
        }}>
          {/* Grid texture */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.032,
            backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }} />
          {/* Vertical accent */}
          <div style={{
            position: "absolute", left: "7.5%", top: "10%", bottom: "10%", width: 3,
            background: "linear-gradient(to bottom,transparent,#C8102E 30%,#C8102E 70%,transparent)",
            opacity: 0.65,
          }} />

          <div style={{ position: "relative", zIndex: 1, paddingLeft: "clamp(2rem, 8vw, 7rem)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
              <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
              <span className="section-tag">The People Behind FITP</span>
            </div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(4rem, 10vw, 8rem)",
              color: "white", letterSpacing: 3, lineHeight: 0.9,
            }}>
              Meet the Team
            </h1>
          </div>
        </section>

        {/* ── Team sections ── */}
        <section style={{ background: "white", padding: "5rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            <GroupSection
              label="Officers"
              members={OFFICERS}
              gridClass="officers-grid"
              small={false}
            />

            <GroupSection
              label="Coordinators"
              members={COORDINATORS}
              gridClass="coords-grid"
              small={false}
            />

            <GroupSection
              label="Faculty Advisors"
              members={FACULTY}
              gridClass="faculty-grid"
              small={true}
            />

          </div>
        </section>

      </div>

      <Footer />
    </>
  );
}
