import { useState, useEffect, useCallback } from "react";
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

    /* Masonry columns */
    .masonry {
      columns: 2;
      column-gap: 14px;
    }
    @media (max-width: 600px)  { .masonry { columns: 1; } }

    /* Each photo tile */
    .gallery-tile {
      break-inside: avoid;
      margin-bottom: 14px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      display: block;
    }
    .gallery-tile img {
      width: 100%;
      height: auto;
      display: block;
      transition: transform 0.45s ease, filter 0.3s ease;
      filter: brightness(0.92);
    }
    .gallery-tile:hover img {
      transform: scale(1.04);
      filter: brightness(1);
    }
    .gallery-tile .tile-overlay {
      position: absolute; inset: 0;
      background: rgba(3,8,46,0);
      transition: background 0.3s ease;
      display: flex; align-items: center; justify-content: center;
    }
    .gallery-tile:hover .tile-overlay {
      background: rgba(3,8,46,0.28);
    }
    .gallery-tile .tile-icon {
      opacity: 0;
      transform: scale(0.7);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .gallery-tile:hover .tile-icon {
      opacity: 1;
      transform: scale(1);
    }

    /* Lightbox */
    .lightbox-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(2,6,25,0.95);
      display: flex; align-items: center; justify-content: center;
      animation: lbFadeIn 0.2s ease;
    }
    @keyframes lbFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .lightbox-img {
      max-width: min(90vw, 1000px);
      max-height: 88vh;
      object-fit: contain;
      border-radius: 6px;
      box-shadow: 0 32px 96px rgba(0,0,0,0.6);
      animation: lbImgIn 0.22s ease;
      display: block;
    }
    @keyframes lbImgIn {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }
    .lb-btn {
      position: fixed;
      top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 50%;
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: white; font-size: 22px;
      transition: background 0.2s, border-color 0.2s;
      z-index: 1001;
    }
    .lb-btn:hover {
      background: #C8102E;
      border-color: #C8102E;
    }
    .lb-close {
      position: fixed; top: 1.25rem; right: 1.5rem;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 50%;
      width: 42px; height: 42px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: white;
      transition: background 0.2s, border-color 0.2s;
      z-index: 1001;
    }
    .lb-close:hover { background: #C8102E; border-color: #C8102E; }

    .lb-counter {
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; letter-spacing: 2.5px; text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      z-index: 1001;
    }
  `}</style>
);

// ─── ALL 22 PHOTOS (exact URLs from fitpuh.org/gallery) ──────────────────────
const PHOTOS = [
  "https://static.wixstatic.com/media/8b5d4e_dce5d6a0fb5344a8a998c9374fb36779~mv2.jpg/v1/fill/w_715,h_490,q_90,enc_avif,quality_auto/8b5d4e_dce5d6a0fb5344a8a998c9374fb36779~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_33635368592a4c0797b35b2e482724c4~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_33635368592a4c0797b35b2e482724c4~mv2.jpg",
  "https://static.wixstatic.com/media/8b5d4e_2758ab87caf8406ba3b6f9ec0f78d35b~mv2.jpg/v1/fill/w_715,h_422,q_90,enc_avif,quality_auto/8b5d4e_2758ab87caf8406ba3b6f9ec0f78d35b~mv2.jpg",
  "https://static.wixstatic.com/media/8b5d4e_c85f645a5f46460aa33400b9bfa4388f~mv2.png/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/8b5d4e_c85f645a5f46460aa33400b9bfa4388f~mv2.png",
  "https://static.wixstatic.com/media/dc9d24_6e9d83ea7ad14896ae428e4c2b7d568e~mv2.jpg/v1/fill/w_715,h_953,q_90,enc_avif,quality_auto/dc9d24_6e9d83ea7ad14896ae428e4c2b7d568e~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_dcd400fe3b024a59b283376efdcd43fe~mv2.jpg/v1/fill/w_715,h_953,q_90,enc_avif,quality_auto/dc9d24_dcd400fe3b024a59b283376efdcd43fe~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_ac04383270be4c32bfb9b5cc99b653db~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_ac04383270be4c32bfb9b5cc99b653db~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_cd7affdb68ff44778c12572e70247ad9~mv2.jpg/v1/fill/w_715,h_953,q_90,enc_avif,quality_auto/dc9d24_cd7affdb68ff44778c12572e70247ad9~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_a9ad40e4d2b441e9a4ec842d2d1cf763~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_a9ad40e4d2b441e9a4ec842d2d1cf763~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_7ce619cbff5446859568574c578a9c6e~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_7ce619cbff5446859568574c578a9c6e~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_01b347df61224d44ab5426eea30999ae~mv2.jpg/v1/fill/w_715,h_953,q_90,enc_avif,quality_auto/dc9d24_01b347df61224d44ab5426eea30999ae~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_e479bd1a78ca4bbc9ae634cb82bfa789~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_e479bd1a78ca4bbc9ae634cb82bfa789~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_b8a1c52b14ee4ba4ac437fedab8017d3~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_b8a1c52b14ee4ba4ac437fedab8017d3~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_d51b764d1a044c929dbcced8d9342bff~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_d51b764d1a044c929dbcced8d9342bff~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_b3e397c04f204ac0ab61fbe2a3fad785~mv2.jpg/v1/fill/w_715,h_953,q_90,enc_avif,quality_auto/dc9d24_b3e397c04f204ac0ab61fbe2a3fad785~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_6634287da70e4e2293b31c1df15b7c19~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_6634287da70e4e2293b31c1df15b7c19~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_005f4b74a26c4603a7580f52363d2ffc~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_005f4b74a26c4603a7580f52363d2ffc~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_a8c1ee549d0d4526aac787cfd216c8c3~mv2.jpg/v1/fill/w_715,h_538,q_90,enc_avif,quality_auto/dc9d24_a8c1ee549d0d4526aac787cfd216c8c3~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_46b56adf4f524e0db2c23c6985ab7e0b~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_46b56adf4f524e0db2c23c6985ab7e0b~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_e012971eee8347a985b4997abebeb09f~mv2.jpg/v1/fill/w_715,h_536,q_90,enc_avif,quality_auto/dc9d24_e012971eee8347a985b4997abebeb09f~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_29f589d383e34931b326619828bb03d9~mv2.jpg/v1/fill/w_715,h_538,q_90,enc_avif,quality_auto/dc9d24_29f589d383e34931b326619828bb03d9~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_99aa925650dd4ad0af944167bbfbef68~mv2.jpg/v1/fill/w_715,h_538,q_90,enc_avif,quality_auto/dc9d24_99aa925650dd4ad0af944167bbfbef68~mv2.jpg",
];

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
function Lightbox({ index, onClose, onPrev, onNext }) {
  // Close on Escape, navigate with arrow keys
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
    >
      {/* Close */}
      <button className="lb-close" onClick={onClose} title="Close">
        <svg viewBox="0 0 18 18" fill="none" width={16} height={16}>
          <path d="M2 2l14 14M16 2L2 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Prev */}
      <button
        className="lb-btn"
        style={{ left: "1rem" }}
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        title="Previous"
      >
        ‹
      </button>

      {/* Image — stopPropagation so clicking the image doesn't close */}
      <img
        key={index}
        src={PHOTOS[index]}
        alt={`FITP gallery ${index + 1}`}
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      <button
        className="lb-btn"
        style={{ right: "1rem" }}
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        title="Next"
      >
        ›
      </button>

      {/* Counter */}
      <div className="lb-counter">{index + 1} / {PHOTOS.length}</div>
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
export default function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openAt  = (i) => setLightboxIndex(i);
  const close   = useCallback(() => setLightboxIndex(null), []);
  const prev    = useCallback(() => setLightboxIndex(i => (i - 1 + PHOTOS.length) % PHOTOS.length), []);
  const next    = useCallback(() => setLightboxIndex(i => (i + 1) % PHOTOS.length), []);

  return (
    <>
      <GlobalStyles />
      <Navbar active="Gallery" alwaysSolid />

      <div style={{ paddingTop: 68 }}>

        {/* ── Page header — same dark style as Leadership ── */}
        <section style={{
          background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)",
          padding: "5rem 2rem 4.5rem",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.032,
            backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }} />
          <div style={{
            position: "absolute", left: "7.5%", top: "10%", bottom: "10%", width: 3,
            background: "linear-gradient(to bottom,transparent,#C8102E 30%,#C8102E 70%,transparent)",
            opacity: 0.65,
          }} />
          <div style={{ position: "relative", zIndex: 1, paddingLeft: "clamp(2rem, 8vw, 7rem)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
              <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
              <span className="section-tag">Events &amp; Community</span>
            </div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(4rem, 10vw, 8rem)",
              color: "white", letterSpacing: 3, lineHeight: 0.9,
            }}>
              Captured Memories
            </h1>
          </div>
        </section>

        {/* ── Masonry photo grid ── */}
        <section style={{ background: "white", padding: "4rem 2rem 5rem" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Photo count tag */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                letterSpacing: 3, textTransform: "uppercase",
                color: "#aaa", fontWeight: 700, whiteSpace: "nowrap",
              }}>{PHOTOS.length} photos</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
            </div>

            {/* Masonry grid */}
            <div className="masonry">
              {PHOTOS.map((src, i) => (
                <div
                  key={i}
                  className="gallery-tile"
                  onClick={() => openAt(i)}
                  title={`View photo ${i + 1}`}
                >
                  <img src={src} alt={`FITP event ${i + 1}`} loading="lazy" />
                  <div className="tile-overlay">
                    <div className="tile-icon">
                      <svg viewBox="0 0 32 32" fill="none" width={36} height={36}>
                        <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" />
                        <path d="M11 16h10M16 11v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </div>

      <Footer />

      {/* ── Lightbox (rendered outside normal flow) ── */}
      {lightboxIndex !== null && (
        <Lightbox
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
