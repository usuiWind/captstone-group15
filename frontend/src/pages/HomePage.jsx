import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getJson } from "../../backend";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
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
    @keyframes scrollBounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50%       { transform: translateX(-50%) translateY(9px); }
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

    /* Pillar cards */
    .pillar-card {
      background: white;
      border: 1px solid rgba(0,0,0,0.07);
      border-radius: 10px;
      flex: 1 1 280px;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .pillar-card:hover {
      transform: translateY(-7px);
      box-shadow: 0 22px 60px rgba(0,0,0,0.12);
    }

    /* Photo strip */
    .photo-strip { overflow-x: auto; padding-bottom: 12px; }
    .photo-strip::-webkit-scrollbar { height: 5px; }
    .photo-strip::-webkit-scrollbar-track { background: #1a2340; border-radius: 10px; }
    .photo-strip::-webkit-scrollbar-thumb { background: #C8102E; border-radius: 10px; }

    .photo-item {
      flex: 0 0 260px;
      height: 320px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    .photo-item img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 0.5s ease, filter 0.3s ease;
      filter: brightness(0.86);
    }
    .photo-item:hover img { transform: scale(1.07); filter: brightness(1); }

    /* Calendar */
    .cal-day {
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-family: 'DM Sans', sans-serif;
      font-size: 13.5px;
      color: #1a1a2e;
      cursor: default;
      transition: background 0.15s, color 0.15s;
      position: relative;
      user-select: none;
    }
    .cal-day.other-month { color: rgba(0,0,0,0.22); }
    .cal-day.today { background: #C8102E !important; color: white !important; font-weight: 700; }
    .cal-day.has-event::after {
      content: '';
      position: absolute;
      bottom: 3px;
      width: 5px; height: 5px;
      background: #003087;
      border-radius: 50%;
    }
    .cal-day.today.has-event::after { background: rgba(255,255,255,0.8); }
    .cal-day.clickable { cursor: pointer; }
    .cal-day.clickable:not(.today):hover { background: rgba(200,16,46,0.1); }
    .cal-day.selected:not(.today) { background: rgba(200,16,46,0.15); outline: 2px solid #C8102E; font-weight: 700; }

    /* Sponsor */
    .sponsor-logo { filter: grayscale(100%) opacity(0.55); transition: filter 0.35s; cursor: default; }
    .sponsor-logo:hover { filter: grayscale(0%) opacity(1); }

    /* Buttons */
    .btn-primary {
      background: #C8102E; color: white;
      padding: 0.9rem 2.4rem; border-radius: 5px;
      font-family: 'DM Sans', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
      text-decoration: none; display: inline-block;
      box-shadow: 0 8px 28px rgba(200,16,46,0.38);
      transition: all 0.25s ease; border: none; cursor: pointer;
    }
    .btn-primary:hover { background: #a00d25; transform: translateY(-2px); box-shadow: 0 14px 36px rgba(200,16,46,0.46); }

    .btn-outline {
      background: transparent; color: white;
      padding: 0.9rem 1.9rem; border-radius: 5px;
      border: 1.5px solid rgba(255,255,255,0.32);
      font-family: 'DM Sans', sans-serif; font-weight: 500;
      font-size: 13px; letter-spacing: 1.8px; text-transform: uppercase;
      text-decoration: none; display: inline-block;
      transition: all 0.25s ease;
    }
    .btn-outline:hover { border-color: white; }

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
    .section-title-light {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2.2rem, 4.5vw, 3.4rem);
      color: white; letter-spacing: 2px; line-height: 1;
    }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .hero-indent { padding-left: 1.5rem !important; }
    }
    @media (max-width: 600px) {
      .photo-item { flex: 0 0 200px; height: 260px; }
    }
  `}</style>
);

// ─── DATA ──────────────────────────────────────────────────────────────────────
const PHOTOS = [
  "https://static.wixstatic.com/media/8b5d4e_c85f645a5f46460aa33400b9bfa4388f~mv2.png/v1/fill/w_480,h_640,fp_0.09_0.55,q_90,enc_avif,quality_auto/8b5d4e_c85f645a5f46460aa33400b9bfa4388f~mv2.png",
  "https://static.wixstatic.com/media/8b5d4e_dce5d6a0fb5344a8a998c9374fb36779~mv2.jpg/v1/fill/w_480,h_640,fp_0.48_0.51,q_90,enc_avif,quality_auto/8b5d4e_dce5d6a0fb5344a8a998c9374fb36779~mv2.jpg",
  "https://static.wixstatic.com/media/8b5d4e_2758ab87caf8406ba3b6f9ec0f78d35b~mv2.jpg/v1/fill/w_480,h_640,fp_0.48_0.64,q_90,enc_avif,quality_auto/8b5d4e_2758ab87caf8406ba3b6f9ec0f78d35b~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_a8c1ee549d0d4526aac787cfd216c8c3~mv2.jpg/v1/fill/w_480,h_640,fp_0.56_0.59,q_90,enc_avif,quality_auto/dc9d24_a8c1ee549d0d4526aac787cfd216c8c3~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_cd7affdb68ff44778c12572e70247ad9~mv2.jpg/v1/fill/w_480,h_640,fp_0.11_0.56,q_90,enc_avif,quality_auto/dc9d24_cd7affdb68ff44778c12572e70247ad9~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_b3e397c04f204ac0ab61fbe2a3fad785~mv2.jpg/v1/fill/w_480,h_640,fp_0.6_0.49,q_90,enc_avif,quality_auto/dc9d24_b3e397c04f204ac0ab61fbe2a3fad785~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_01b347df61224d44ab5426eea30999ae~mv2.jpg/v1/fill/w_480,h_640,fp_0.22_0.5,q_90,enc_avif,quality_auto/dc9d24_01b347df61224d44ab5426eea30999ae~mv2.jpg",
  "https://static.wixstatic.com/media/dc9d24_33635368592a4c0797b35b2e482724c4~mv2.jpg/v1/fit/w_480,h_640,q_90,enc_avif,quality_auto/dc9d24_33635368592a4c0797b35b2e482724c4~mv2.jpg",
];

const STATIC_SPONSORS = [
  { name: "Amazon Web Services", logo: "https://static.wixstatic.com/media/dc9d24_499ee539fb6f49a8818493644a057b6f~mv2.png/v1/fill/w_190,h_135,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Amazon_Web_Services-Logo_wine.png" },
  { name: "Shell",               logo: "https://static.wixstatic.com/media/8b5d4e_ea710734f75a49f1b6c531d6e44a01b7~mv2.png/v1/fill/w_149,h_118,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Shell-Logo-1971.png" },
  { name: "Sponsor",             logo: "https://static.wixstatic.com/media/24c087_23fa2f79893a4aeca376f779abed7bb0~mv2.jpg/v1/fill/w_207,h_157,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/og-share.jpg" },
  { name: "FITP Partner",        logo: "https://static.wixstatic.com/media/dc9d24_60670651d0a441a3b6dfa5c10edaacc6~mv2.png/v1/fill/w_190,h_144,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Untitled%20design.png" },
];

// Placeholder events — swap with real CMS/API data later
const EVENTS = [
  { date: new Date(2026, 2, 10), title: "Tech Talk: Cloud Fundamentals",      time: "6:00 PM" },
  { date: new Date(2026, 2, 18), title: "Career Fair Prep Workshop",           time: "5:30 PM" },
  { date: new Date(2026, 2, 25), title: "FITP Networking Social",              time: "7:00 PM" },
  { date: new Date(2026, 3, 3),  title: "AWS Certification Study Group",       time: "6:00 PM" },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];


// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  const anim = (delay) => ({
    opacity:    ready ? 1 : 0,
    transform:  ready ? "translateY(0)" : "translateY(26px)",
    transition: `opacity 0.85s ease ${delay}s, transform 0.85s ease ${delay}s`,
  });

  const animDown = (delay) => ({
    opacity:    ready ? 1 : 0,
    transform:  ready ? "translateY(0)" : "translateY(-26px)",
    transition: `opacity 0.85s ease ${delay}s, transform 0.85s ease ${delay}s`,
  });

  return (
    <section id="home" style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)",
    }}>
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.032,
        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      {/* Subtle red glow top-right */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: "50%", height: "70%", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(200,16,46,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {/* Subtle blue glow bottom-left */}
      <div style={{
        position: "absolute", bottom: "-10%", left: "-5%",
        width: "50%", height: "70%", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,48,135,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Centered content ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        padding: "0 2rem", width: "100%", marginTop: "-5rem",
      }}>

        {/* Logo */}
        <div style={{ ...anim(0.05) }}>
          <img
            src="https://static.wixstatic.com/media/8b5d4e_2037e3e1f5684f5a8941d1a13f747017~mv2.png/v1/fill/w_385,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BlueRed.png"
            alt="FITP UH"
            style={{
              height: "clamp(140px, 22vw, 260px)",
              objectFit: "contain",
              marginBottom: "0.1rem",
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.45))",
            }}
          />
        </div>

        {/* UH tag */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.4rem", ...anim(0.18) }}>
          <span style={{ width: 28, height: 2, background: "#C8102E", display: "block", borderRadius: 2 }} />
          <span className="section-tag">University of Houston · Sugar Land</span>
          <span style={{ width: 28, height: 2, background: "#C8102E", display: "block", borderRadius: 2 }} />
        </div>

        {/* Title — two lines, big and bold */}
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(2.8rem, 7vw, 6.2rem)",
          lineHeight: 1.0, letterSpacing: 3,
          margin: "0 0 1.6rem",
          ...anim(0.35),
        }}>
          <span style={{ color: "white" }}>Future </span>
          <span style={{ color: "#C8102E" }}>Information</span>
          <br />
          <span style={{ color: "#C8102E" }}>Technology </span>
          <span style={{ color: "white" }}>Professionals</span>
        </h1>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", ...animDown(0.55)  }}>
          <a href="/membership" className="btn-primary">Become a Member</a>
          <a href="#about"      className="btn-outline">Learn More</a>
        </div>

      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: "2rem", left: "50%",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
        opacity: ready ? 0.42 : 0, transition: "opacity 1s ease 1.3s",
        animation: "scrollBounce 2.2s ease-in-out infinite 2s",
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", color: "white", fontSize: 9, letterSpacing: 3.5, textTransform: "uppercase" }}>scroll</span>
        <div style={{ width: 1, height: 34, background: "linear-gradient(to bottom,white,transparent)" }} />
      </div>
    </section>
  );
}

// ─── WHAT WE DO — horizontal three-column row ─────────────────────────────────
function WhatWeDo() {
  const pillars = [
    {
      img:   "https://static.wixstatic.com/media/dc9d24_33248756a4784da2a11e495384ffdc33~mv2.jpg/v1/fill/w_480,h_340,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/dc9d24_33248756a4784da2a11e495384ffdc33~mv2.jpg",
      title: "Learn",
      desc:  "FITP will help provide you with the resources you need to succeed in the world of information technology.",
      color: "#003087",
    },
    {
      img:   "https://static.wixstatic.com/media/8b5d4e_2a41308e09884e97a1342f8218ca226d~mv2.jpg/v1/fill/w_480,h_340,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/8b5d4e_2a41308e09884e97a1342f8218ca226d~mv2.jpg",
      title: "Network",
      desc:  "FITP allows you to meet recruiters and fellow FITP UH members of past and present. Expand your network!",
      color: "#C8102E",
    },
    {
      img:   "https://static.wixstatic.com/media/dc9d24_4b66ef633f6f4239ad867d8b0dc30137~mv2.jpg/v1/fill/w_480,h_340,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/dc9d24_4b66ef633f6f4239ad867d8b0dc30137~mv2.jpg",
      title: "Compete",
      desc:  "Members can attend conferences and compete to win awards showcasing their knowledge in technical fields!",
      color: "#003087",
    },
  ];

  return (
    <section id="about" style={{ background: "#f8f7f5", padding: "6rem 2rem" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem" }}>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">Our Mission</span>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          </div>
          <h2 className="section-title">What We Do</h2>
        </div>

        {/* Three cards in a horizontal row */}
        <div style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          {pillars.map((p, i) => (
            <div key={i} className="pillar-card">
              {/* Top accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: p.color, zIndex: 1 }} />

              {/* Photo */}
              <div style={{ width: "100%", height: 190, overflow: "hidden" }}>
                <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              {/* Text */}
              <div style={{ padding: "1.5rem 1.6rem 1.75rem" }}>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.85rem", letterSpacing: 2, color: "#03082e", marginBottom: "0.6rem" }}>
                  {p.title}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", lineHeight: 1.72, fontSize: "0.91rem" }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── EVENTS / SOCIALS — horizontal scrollable photo strip ─────────────────────
function EventsGallery() {
  return (
    <section id="events" style={{ background: "#03082e", padding: "6rem 0" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 2rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem" }}>
          <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          <span className="section-tag">Community</span>
        </div>
        <h2 className="section-title-light">Events &amp; Socials</h2>
      </div>

      {/* Horizontally scrollable strip */}
      <div className="photo-strip" style={{ scrollbarColor: "#C8102E #1a2340" }}>
        <div style={{
          display: "flex",
          gap: "1rem",
          /* Left-align with page content while allowing strip to overflow right */
          padding: `0.25rem 2rem 0.25rem max(2rem, calc((100vw - 1280px) / 2 + 2rem))`,
          width: "max-content",
        }}>
          {PHOTOS.map((src, i) => (
            <div key={i} className="photo-item">
              <img src={src} alt={`FITP event ${i + 1}`} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top,rgba(3,8,46,0.55) 0%,transparent 45%)",
                pointerEvents: "none",
              }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── UPCOMING EVENTS + INTERACTIVE CALENDAR ────────────────────────────────────
function CalendarSection() {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null);
  const [events,    setEvents]    = useState(EVENTS);

  useEffect(() => {
    let cancelled = false;
    getJson('/api/events?all=true')
      .then(res => {
        if (cancelled || !res?.data?.length) return;
        setEvents(res.data.map(e => ({
          date:  new Date(e.eventDate),
          title: e.title,
          time:  e.description || '',
          points: e.pointsValue,
        })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const prevMonth = () => {
    setSelected(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelected(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build 42-cell grid (Mon–Sun)
  const firstDay    = new Date(viewYear, viewMonth, 1);
  const lastDay     = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // 0=Mon

  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--)
    cells.push({ date: new Date(viewYear, viewMonth, -i), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    cells.push({ date: new Date(viewYear, viewMonth, d), current: true });
  while (cells.length < 42)
    cells.push({ date: new Date(viewYear, viewMonth + 1, cells.length - lastDay.getDate() - startOffset + 1), current: false });

  const sameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  const isToday   = d => sameDay(d, today);
  const isSel     = d => sameDay(d, selected);
  const dayEvents = d => events.filter(e => sameDay(e.date, d));

  const monthEvents = events.filter(e =>
    e.date.getMonth() === viewMonth && e.date.getFullYear() === viewYear
  );

  const selEvents = selected ? dayEvents(selected) : [];

  return (
    <section id="calendar" style={{ background: "white", padding: "6rem 2rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem" }}>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">Schedule</span>
            <span style={{ width: 32, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
          </div>
          <h2 className="section-title">Upcoming Events</h2>
        </div>

        <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── Calendar widget ── */}
          <div style={{
            flex: "0 0 auto", width: "min(100%, 420px)",
            background: "white", border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14, boxShadow: "0 6px 40px rgba(0,0,0,0.08)",
            padding: "1.75rem", overflow: "hidden",
          }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <NavBtn onClick={prevMonth}>&#8249;</NavBtn>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.45rem", letterSpacing: 2, color: "#03082e" }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <NavBtn onClick={nextMonth}>&#8250;</NavBtn>
            </div>

            {/* Day of week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "0.4rem" }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{
                  textAlign: "center", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10.5, fontWeight: 700, letterSpacing: 1,
                  textTransform: "uppercase", color: "#bbb", padding: "0.2rem 0",
                }}>{d}</div>
              ))}
            </div>

            {/* Date cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((cell, i) => {
                const ev   = dayEvents(cell.date).length > 0;
                const td   = isToday(cell.date);
                const sel  = isSel(cell.date);
                const cls  = [
                  "cal-day",
                  !cell.current ? "other-month" : "clickable",
                  td  ? "today"    : "",
                  sel ? "selected" : "",
                  ev  ? "has-event": "",
                ].join(" ");

                return (
                  <div key={i} className={cls}
                    onClick={() => cell.current && setSelected(prev => sameDay(prev, cell.date) ? null : cell.date)}>
                    {cell.date.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: "1.5rem" }}>
              {[{ color: "#C8102E", label: "Today" }, { color: "#003087", label: "Event" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#999" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Event list ── */}
          <div style={{ flex: "1 1 300px" }}>

            {/* Selected day callout */}
            {selected && selEvents.length > 0 && (
              <div style={{
                background: "#03082e", borderRadius: 10, padding: "1.3rem 1.5rem",
                marginBottom: "1.5rem", borderLeft: "4px solid #C8102E",
              }}>
                <div className="section-tag" style={{ marginBottom: "0.4rem", fontSize: 10 }}>
                  {MONTH_NAMES[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}
                </div>
                {selEvents.map((ev, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "white", fontWeight: 700, fontSize: "0.97rem" }}>{ev.title}</div>
                    {ev.time && <div style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", marginTop: 2 }}>{ev.time}</div>}
                  </div>
                ))}
              </div>
            )}

            {selected && selEvents.length === 0 && (
              <div style={{
                background: "#f8f7f5", borderRadius: 10, padding: "1.1rem 1.4rem",
                marginBottom: "1.5rem", border: "1px dashed rgba(0,0,0,0.12)",
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: "0.88rem" }}>No events on this day.</span>
              </div>
            )}

            <h3 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem",
              letterSpacing: 2, color: "#03082e", marginBottom: "1.1rem",
            }}>
              {monthEvents.length > 0 ? `${MONTH_NAMES[viewMonth]} Events` : "No Events This Month"}
            </h3>

            {monthEvents.length === 0 && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: "0.88rem", lineHeight: 1.65 }}>
                No events scheduled yet. Check back soon or follow us on social media to stay up to date!
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {monthEvents.map((ev, i) => (
                <div key={i} style={{
                  background: "white", border: "1px solid rgba(0,0,0,0.07)",
                  borderLeft: "4px solid #C8102E",
                  borderRadius: 8, padding: "1rem 1.2rem",
                  display: "flex", alignItems: "center", gap: "1rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                  onClick={() => setSelected(prev => sameDay(prev, ev.date) ? null : ev.date)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}
                >
                  {/* Date badge */}
                  <div style={{
                    flexShrink: 0, width: 46, textAlign: "center",
                    background: "#03082e", borderRadius: 6, padding: "0.3rem 0.3rem 0.4rem",
                  }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase", color: "#C8102E", fontWeight: 700 }}>
                      {MONTH_NAMES[ev.date.getMonth()].slice(0, 3)}
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "white", letterSpacing: 1, lineHeight: 1 }}>
                      {ev.date.getDate()}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#03082e", fontSize: "0.93rem" }}>{ev.title}</div>
                    {ev.time && <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#999", fontSize: "0.79rem", marginTop: 2 }}>{ev.time}</div>}
                  </div>

                  <span style={{ fontSize: 14, color: "#ccc" }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Small reusable calendar nav button
function NavBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "1.5px solid rgba(0,0,0,0.12)",
      width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
      fontSize: 18, color: "#03082e",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s", lineHeight: 1,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#C8102E"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#C8102E"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#03082e"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; }}
    >{children}</button>
  );
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getJson('/api/events?all=true')
      .then(res => {
        if (cancelled) return;
        const evs = (res?.data ?? []).filter(e => e.description);
        setItems(evs);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section style={{ background: "#f8f7f5", padding: "5rem 2rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
            <span style={{ width: 28, height: 2.5, background: "#C8102E", display: "block", borderRadius: 2 }} />
            <span className="section-tag">Updates</span>
          </div>
          <h2 className="section-title">Announcements</h2>
        </div>

        {loading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: "0.9rem" }}>Loading…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.map((ev, i) => (
              <div key={ev.id ?? i} style={{
                background: "white", borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.07)",
                borderLeft: "4px solid #C8102E",
                padding: "1.2rem 1.5rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: 1.5, textTransform: "uppercase",
                      color: "#C8102E", background: "rgba(200,16,46,0.08)",
                      padding: "0.2rem 0.7rem", borderRadius: 10,
                    }}>Event</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#03082e", letterSpacing: 1 }}>
                      {ev.title}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#bbb" }}>
                    {new Date(ev.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.91rem", color: "#555", lineHeight: 1.75, fontWeight: 300, margin: 0 }}>
                  {ev.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── MEMBERSHIP CTA ───────────────────────────────────────────────────────────
function MembershipCTA() {
  return (
    <section id="membership" style={{
      background: "linear-gradient(135deg, #C8102E 0%, #78091b 100%)",
      padding: "6rem 2rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.05,
        backgroundImage: "repeating-linear-gradient(45deg,white 0,white 1px,transparent 1px,transparent 50%)",
        backgroundSize: "28px 28px",
      }} />
      <div style={{ maxWidth: "100%", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span className="section-tag" style={{ color: "rgba(255,255,255,0.65)", display: "block", marginBottom: "0.9rem" }}>
          Join FITP
        </span>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          color: "white", letterSpacing: 2, margin: "0 0 1.1rem", lineHeight: 1.0,
        }}>
          Start Your Journey<br />in Tech Today
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.78)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2.2rem", fontWeight: 300 }}>
          Gain access to exclusive events, mentorship from industry professionals,
          career resources, and a community of driven IT students.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/membership" style={{
            background: "white", color: "#C8102E",
            padding: "0.9rem 2.8rem", borderRadius: 5,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
            textDecoration: "none",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            transition: "all 0.25s",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 14px 40px rgba(0,0,0,0.3)"; }}
            onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 8px 28px rgba(0,0,0,0.22)"; }}
          >Become a Member</a>
          <a href="/about" className="btn-outline">Learn More</a>
        </div>
      </div>
    </section>
  );
}

// ─── SPONSORS ─────────────────────────────────────────────────────────────────
function Sponsors() {
  return (
    <section id="sponsorships" style={{ background: "#f8f7f5", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="section-tag" style={{ display: "block", marginBottom: "0.5rem" }}>Our Partner</span>
          <h2 className="section-title">Sponsors</h2>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "3.5rem" }}>
          {STATIC_SPONSORS.map((s, i) => (
            <div key={i} className="sponsor-logo" style={{ width: 155, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={s.logo} alt={s.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { heading: "Navigate", links: [{ label:"Home",href:"/"},{label:"About",href:"/about"},{label:"Leadership",href:"/officers"},{label:"Gallery",href:"/gallery"}]},
    { heading: "Connect",  links: [{ label:"Membership",href:"/membership"},{label:"Sponsorships",href:"/sponsorships"},{label:"Contact",href:"/contact"}]},
  ];
  return (
    <footer style={{ background: "#03082e", color: "white", padding: "3.5rem 2rem", borderTop: "1px solid rgba(200,16,46,0.22)" }}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2.5rem", marginBottom: "2.5rem" }}>
          <div>
            <img src="https://static.wixstatic.com/media/8b5d4e_2037e3e1f5684f5a8941d1a13f747017~mv2.png/v1/fill/w_385,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BlueRed.png"
              alt="FITP UH" style={{ height: 54, objectFit: "contain", marginBottom: "0.75rem", display: "block" }} />
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
            {["Privacy Policy","Terms"].map(t => (
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
export default function HomePage() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Hero />
      <WhatWeDo />
      <EventsGallery />
      <CalendarSection />
      <Announcements />
      <MembershipCTA />
      <Sponsors />
      <Footer />
    </>
  );
}
