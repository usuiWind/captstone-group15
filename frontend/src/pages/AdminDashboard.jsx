import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAllMembers, getAllEvents } from "../api/services/adminService";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; width: 100%; }
    body { font-family: 'DM Sans', sans-serif; background: #f8f7f5; overflow-x: hidden; width: 100%; }
    #root { width: 100%; }

    .section-tag {
      font-family: 'DM Sans', sans-serif;
      color: #C8102E; font-size: 11px;
      letter-spacing: 4px; text-transform: uppercase; font-weight: 700;
    }

    .admin-stat-card {
      background: white; border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      padding: 1.4rem 1.5rem;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .admin-stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.1);
    }

    /* Member table rows */
    .member-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 80px;
      align-items: center;
      padding: 0.85rem 1.2rem;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      transition: background 0.15s;
      gap: 0.5rem;
    }
    .member-row:hover { background: #fafafa; }
    .member-row:last-child { border-bottom: none; }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 80px;
      align-items: center;
      padding: 0.7rem 1.2rem;
      gap: 0.5rem;
      background: #03082e;
      border-radius: "8px 8px 0 0";
    }

    /* Status badges */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.65rem; border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 10px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
    }
    .badge-active   { background: rgba(76,175,80,0.12);  color: #2e7d32; }
    .badge-inactive { background: rgba(255,193,7,0.15);  color: #b8600a; }
    .badge-pending  { background: rgba(200,16,46,0.1);   color: #C8102E; }

    /* Search input */
    .search-input {
      padding: 0.65rem 1rem 0.65rem 2.5rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
      border: 1.5px solid rgba(0,0,0,0.1); border-radius: 6px;
      outline: none; background: white; width: 260px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-input:focus {
      border-color: #C8102E;
      box-shadow: 0 0 0 3px rgba(200,16,46,0.1);
    }

    /* Tab buttons */
    .admin-tab-btn {
      background: rgba(255,255,255,0.07);
      border: none; border-radius: 6px 6px 0 0;
      padding: 0.5rem 1.2rem; cursor: pointer;
      font-family: 'DM Sans'; font-weight: 700;
      font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase;
      color: rgba(255,255,255,0.45); transition: all 0.2s;
    }
    .admin-tab-btn.active {
      background: #C8102E; color: white;
    }

    /* Announce form inputs */
    .form-input {
      width: 100%; padding: 0.75rem 1rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
      color: #03082e; background: white;
      border: 1.5px solid rgba(0,0,0,0.12); border-radius: 6px;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus {
      border-color: #C8102E;
      box-shadow: 0 0 0 3px rgba(200,16,46,0.1);
    }

    @media (max-width: 900px) {
      .member-row, .table-header { grid-template-columns: 2fr 1fr 1fr 80px !important; }
      .hide-mobile { display: none !important; }
      .admin-stats { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 480px) {
      .admin-stats { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// Announcements remain local-only (no backend API yet).

const MOCK_ANNOUNCEMENTS = [
  { id: 1, date: "Apr 5, 2026", title: "USITCC Regional Conference Registration Open", tag: "Conference", body: "Registration for the 2026 USITCC Regional Conference is now open. Members with 50+ points get priority registration. Deadline is April 20th." },
  { id: 2, date: "Apr 1, 2026", title: "New Workshop Series Starting This Month",      tag: "Events",     body: "Join us for our April workshop series covering cloud certifications, resume reviews, and mock interviews." },
  { id: 3, date: "Mar 28, 2026", title: "FITP Mentorship Program — Apply Now",         tag: "Mentorship", body: "Applications for the Spring mentorship cohort are open. Members who complete 3+ sessions earn 90 bonus points." },
];

const EVENT_TYPE_COLORS = {
  "GBM":              "#003087",
  "Study Night":      "#1a7a4a",
  "Social":           "#7b3fa0",
  "Workshop":         "#b8600a",
  "Networking Event": "#0a7d8c",
  "Mentorship Event": "#C8102E",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function AdminStatCard({ label, value, sub, accent = "#C8102E", icon }) {
  return (
    <div className="admin-stat-card" style={{ borderTop: `4px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#aaa", fontWeight: 700, marginBottom: "0.35rem" }}>
            {label}
          </div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "2.2rem", color: "#03082e", letterSpacing: 1, lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa", marginTop: "0.3rem" }}>{sub}</div>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [ready, setReady]           = useState(false);
  const [activeTab, setActiveTab]   = useState("overview");
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("All");
  const [selectedMember, setSelected] = useState(null);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [newAnnounce, setNewAnnounce]     = useState({ title: "", tag: "", body: "" });
  const [showAnnounceForm, setShowForm]   = useState(false);
  const [members, setMembers]   = useState([]);
  const [events, setEvents]     = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setReady(true), 100);
    Promise.all([getAllMembers(), getAllEvents()])
      .then(([m, e]) => { setMembers(m); setEvents(e); })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, []);

  const anim = (delay) => ({
    opacity:    ready ? 1 : 0,
    transform:  ready ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  // Helpers for real data shape
  const memberStatus = (m) => (m.membership?.status ?? "UNKNOWN").toLowerCase();
  const memberInitials = (m) => (m.name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // Derived stats from real data
  const activeCount = members.filter(m => memberStatus(m) === "active").length;

  // Filtered members
  const filtered = members.filter(m => {
    const matchSearch = search === "" ||
      `${m.name ?? ""} ${m.email ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" ||
      memberStatus(m) === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleAddAnnouncement = () => {
    if (!newAnnounce.title.trim() || !newAnnounce.body.trim()) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setAnnouncements(prev => [{ id: Date.now(), date: today, ...newAnnounce }, ...prev]);
    setNewAnnounce({ title: "", tag: "", body: "" });
    setShowForm(false);
  };

  const handleDeleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      <GlobalStyles />
      <Navbar active="" alwaysSolid />

      <div style={{ paddingTop: 68, minHeight: "100vh", background: "#f8f7f5" }}>

        {/* ── Header bar ── */}
        <div style={{
          background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)",
          padding: "2.5rem 2rem 0",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.032,
            backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }} />
          <div style={{
            position: "absolute", right: "-5%", top: "-20%",
            width: "40%", height: "150%", borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,48,135,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.8rem" }}>
              <div style={{ ...anim(0.05) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: 20, height: 2, background: "#C8102E", display: "block", borderRadius: 2 }} />
                  <span className="section-tag">Admin Portal</span>
                </div>
                <h1 style={{
                  fontFamily: "'Bebas Neue'", fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  color: "white", letterSpacing: 2, lineHeight: 1,
                }}>
                  FITP UH Admin Dashboard
                </h1>
                <p style={{ fontFamily: "'DM Sans'", color: "rgba(255,255,255,0.4)", fontSize: "0.88rem", marginTop: "0.3rem" }}>
                  Manage members, points, events, and announcements
                </p>
              </div>

              {/* Quick actions */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a href="/membership" style={{
                  background: "#C8102E", color: "white",
                  padding: "0.75rem 1.5rem", borderRadius: 6,
                  fontFamily: "'DM Sans'", fontWeight: 700,
                  fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(200,16,46,0.35)",
                  transition: "all 0.2s", ...anim(0.1),
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#a00d25"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#C8102E"; e.currentTarget.style.transform = ""; }}
                >
                  + Add Member
                </a>
                <a href="/admin/manage" style={{
                  background: "rgba(255,255,255,0.1)", color: "white",
                  padding: "0.75rem 1.5rem", borderRadius: 6,
                  fontFamily: "'DM Sans'", fontWeight: 700,
                  fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                  textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.2)",
                  transition: "all 0.2s", ...anim(0.12),
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                >
                  Manage
                </a>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {["overview", "members", "events", "announcements"].map(tab => (
                <button key={tab} className={`admin-tab-btn${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <div>
              {/* Stats */}
              <div className="admin-stats" style={{
                display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                gap: "1.25rem", marginBottom: "2rem", ...anim(0.08),
              }}>
                <AdminStatCard label="Total Members"  value={dataLoading ? "…" : members.length} sub={`${activeCount} active`} accent="#C8102E"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><circle cx="9" cy="7" r="4" stroke="#C8102E" strokeWidth="1.8"/><path d="M3 21v-1a6 6 0 0112 0v1M16 11a4 4 0 010 8" stroke="#C8102E" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
                <AdminStatCard label="Total Events" value={dataLoading ? "…" : events.length} sub="In system" accent="#003087"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" stroke="#003087" strokeWidth="1.8" strokeLinejoin="round"/></svg>} />
                <AdminStatCard label="Active Members" value={dataLoading ? "…" : activeCount} sub={`of ${members.length} total`} accent="#1a7a4a"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><path d="M3 17l5-8 4 5 3-4 5 7" stroke="#1a7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
                <AdminStatCard label="Pending" value={dataLoading ? "…" : members.filter(m => memberStatus(m) === "pending").length} sub="Awaiting activation" accent="#7b3fa0"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><path d="M8 21h8M12 21v-4M5 8l1 4h12l1-4M8 8V4h8v4" stroke="#7b3fa0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
              </div>

              {/* Two-column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", ...anim(0.14) }}>

                {/* Points leaderboard */}
                <div style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ background: "#03082e", padding: "1rem 1.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "white", letterSpacing: 1 }}>Points Leaderboard</span>
                    <button onClick={() => setActiveTab("members")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#C8102E" }}>
                      View all →
                    </button>
                  </div>
                  <div style={{ padding: "0.5rem 0" }}>
                    {dataLoading ? (
                      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>Loading…</div>
                    ) : members.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>No members yet.</div>
                    ) : members.slice(0, 8).map((m, i) => (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.75rem 1.4rem",
                        borderBottom: i < members.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{
                          fontFamily: "'Bebas Neue'", fontSize: "1.2rem",
                          color: i === 0 ? "#C8102E" : i === 1 ? "#7b3fa0" : i === 2 ? "#b8600a" : "#ccc",
                          minWidth: 24, letterSpacing: 1,
                        }}>{i + 1}</span>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "linear-gradient(135deg,#03082e,#C8102E)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <span style={{ fontFamily: "'Bebas Neue'", color: "white", fontSize: "1rem" }}>
                            {memberInitials(m)}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.9rem", color: "#03082e" }}>
                            {m.name}
                          </div>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa" }}>{m.membership?.planName ?? "No plan"}</div>
                        </div>
                        <span className={`badge badge-${memberStatus(m)}`}>{(m.membership?.status ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent events summary */}
                <div style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ background: "#03082e", padding: "1rem 1.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "white", letterSpacing: 1 }}>Recent Events</span>
                    <button onClick={() => setActiveTab("events")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#C8102E" }}>
                      View all →
                    </button>
                  </div>
                  <div style={{ padding: "0.5rem 0" }}>
                    {dataLoading ? (
                      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>Loading…</div>
                    ) : events.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>No events yet.</div>
                    ) : events.slice(0, 5).map((ev, i) => (
                      <div key={ev.id} style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.85rem 1.4rem",
                        borderBottom: i < Math.min(events.length, 5) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                        borderLeft: "3px solid #C8102E",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.88rem", color: "#03082e" }}>{ev.title}</div>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                            {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "#03082e", letterSpacing: 1 }}>{ev.pointsValue ?? 0}</div>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#aaa", letterSpacing: 1 }}>pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MEMBERS TAB ══ */}
          {activeTab === "members" && (
            <div style={{ ...anim(0.05) }}>
              {/* Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div className="section-tag" style={{ marginBottom: "0.3rem" }}>Roster</div>
                  <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#03082e", letterSpacing: 2 }}>
                    All Members
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} viewBox="0 0 16 16" fill="none" width={14} height={14}>
                      <circle cx="6.5" cy="6.5" r="5" stroke="#aaa" strokeWidth="1.5"/>
                      <path d="M10 10l3.5 3.5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input className="search-input" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {/* Filter */}
                  {["All", "Active", "Inactive", "Pending"].map(s => (
                    <button key={s} onClick={() => setFilter(s)} style={{
                      background: filterStatus === s ? "#03082e" : "white",
                      color: filterStatus === s ? "white" : "#555",
                      border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                      padding: "0.5rem 1rem", cursor: "pointer",
                      fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
                      transition: "all 0.2s",
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {/* Header */}
                <div className="table-header" style={{ borderRadius: "10px 10px 0 0" }}>
                  {["Member", "Email", "Role", "Status", "Plan", "", ""].map((h, i) => (
                    <span key={i} style={{
                      fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 700,
                      letterSpacing: 2, textTransform: "uppercase",
                      color: "rgba(255,255,255,0.5)",
                    }} className={i >= 2 && i <= 4 ? "hide-mobile" : ""}>
                      {h}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {dataLoading ? (
                  <div style={{ padding: "3rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>Loading members…</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>
                    No members match your search.
                  </div>
                ) : filtered.map(m => (
                  <div key={m.id} className="member-row">
                    {/* Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#03082e,#C8102E)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: "'Bebas Neue'", color: "white", fontSize: "0.95rem" }}>
                          {memberInitials(m)}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.9rem", color: "#03082e" }}>{m.name}</div>
                        <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa" }}>{m.id.slice(0, 8)}…</div>
                      </div>
                    </div>

                    {/* Email */}
                    <div style={{ fontFamily: "'DM Sans'", fontSize: "0.82rem", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </div>

                    {/* Role */}
                    <div className="hide-mobile" style={{ fontFamily: "'DM Sans'", fontSize: "0.85rem", color: "#555" }}>{m.role}</div>

                    {/* Status badge */}
                    <div>
                      <span className={`badge badge-${memberStatus(m)}`}>{m.membership?.status ?? "—"}</span>
                    </div>

                    {/* Plan */}
                    <div className="hide-mobile" style={{ fontFamily: "'DM Sans'", fontSize: "0.85rem", color: "#555" }}>{m.membership?.planName ?? "—"}</div>

                    {/* View button */}
                    <button onClick={() => setSelected(m)} style={{
                      background: "none", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 6,
                      padding: "0.35rem 0.75rem", cursor: "pointer",
                      fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
                      textTransform: "uppercase", color: "#03082e", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8102E"; e.currentTarget.style.color = "#C8102E"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.color = "#03082e"; }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#bbb", marginTop: "0.75rem", textAlign: "right" }}>
                Showing {filtered.length} of {members.length} members
              </div>
            </div>
          )}

          {/* ══ EVENTS TAB ══ */}
          {activeTab === "events" && (
            <div style={{ ...anim(0.05) }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <div className="section-tag" style={{ marginBottom: "0.3rem" }}>Event History</div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#03082e", letterSpacing: 2 }}>Recent Events</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {dataLoading ? (
                  <div style={{ padding: "3rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>Loading events…</div>
                ) : events.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>No events yet.</div>
                ) : events.map((ev) => (
                  <div key={ev.id} style={{
                    background: "white", borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.07)",
                    borderLeft: "4px solid #C8102E",
                    padding: "1.2rem 1.5rem",
                    display: "flex", alignItems: "center", gap: "1.5rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "#03082e", letterSpacing: 1 }}>{ev.title}</div>
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem", alignItems: "center" }}>
                        <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa" }}>
                          {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </span>
                      </div>
                      {ev.description && (
                        <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#888", marginTop: "0.4rem" }}>{ev.description}</div>
                      )}
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: "2.4rem", color: "#03082e", letterSpacing: 1, lineHeight: 1 }}>{ev.pointsValue ?? 0}</div>
                      <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase" }}>Points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ANNOUNCEMENTS TAB ══ */}
          {activeTab === "announcements" && (
            <div style={{ ...anim(0.05) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div className="section-tag" style={{ marginBottom: "0.3rem" }}>Member Communications</div>
                  <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#03082e", letterSpacing: 2 }}>Announcements</h2>
                </div>
                <button onClick={() => setShowForm(f => !f)} style={{
                  background: "#C8102E", color: "white",
                  border: "none", borderRadius: 6,
                  padding: "0.75rem 1.5rem", cursor: "pointer",
                  fontFamily: "'DM Sans'", fontWeight: 700,
                  fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                  boxShadow: "0 6px 20px rgba(200,16,46,0.3)",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#a00d25"}
                  onMouseLeave={e => e.currentTarget.style.background = "#C8102E"}
                >
                  {showAnnounceForm ? "Cancel" : "+ New Announcement"}
                </button>
              </div>

              {/* New announcement form */}
              {showAnnounceForm && (
                <div style={{
                  background: "white", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderTop: "4px solid #C8102E",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  padding: "1.75rem", marginBottom: "1.5rem",
                }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.4rem", color: "#03082e", letterSpacing: 1, marginBottom: "1.2rem" }}>
                    New Announcement
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" }}>Title</label>
                        <input className="form-input" placeholder="Announcement title…" value={newAnnounce.title} onChange={e => setNewAnnounce(a => ({ ...a, title: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" }}>Tag</label>
                        <input className="form-input" placeholder="e.g. Events, Conference…" value={newAnnounce.tag} onChange={e => setNewAnnounce(a => ({ ...a, tag: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" }}>Body</label>
                      <textarea className="form-input" rows={4} placeholder="Write your announcement…" value={newAnnounce.body} onChange={e => setNewAnnounce(a => ({ ...a, body: e.target.value }))} style={{ resize: "vertical", minHeight: 100 }} />
                    </div>
                    <button onClick={handleAddAnnouncement} style={{
                      background: "#03082e", color: "white", border: "none", borderRadius: 6,
                      padding: "0.8rem 2rem", cursor: "pointer", alignSelf: "flex-start",
                      fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                      transition: "background 0.2s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#060f45"}
                      onMouseLeave={e => e.currentTarget.style.background = "#03082e"}
                    >
                      Publish Announcement
                    </button>
                  </div>
                </div>
              )}

              {/* Announcement list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {announcements.map(a => (
                  <div key={a.id} style={{
                    background: "white", borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.07)",
                    borderLeft: "4px solid #C8102E",
                    padding: "1.2rem 1.4rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap" }}>
                        {a.tag && (
                          <span style={{
                            fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 700,
                            letterSpacing: 1.5, textTransform: "uppercase",
                            color: "#C8102E", background: "rgba(200,16,46,0.08)",
                            padding: "0.2rem 0.7rem", borderRadius: 10,
                          }}>{a.tag}</span>
                        )}
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.15rem", color: "#03082e", letterSpacing: 1 }}>{a.title}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#bbb" }}>{a.date}</span>
                        <button onClick={() => handleDeleteAnnouncement(a.id)} style={{
                          background: "none", border: "1.5px solid rgba(200,16,46,0.2)", borderRadius: 6,
                          padding: "0.25rem 0.65rem", cursor: "pointer",
                          fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 10,
                          letterSpacing: 1.5, textTransform: "uppercase", color: "#C8102E",
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#C8102E"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#C8102E"; }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: "0.9rem", color: "#555", lineHeight: 1.75, fontWeight: 300 }}>
                      {a.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Member detail modal ── */}
      {selectedMember && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(2,6,25,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1.5rem",
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: "white", borderRadius: 14,
            width: "100%", maxWidth: 520,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
            animation: "none",
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{
              background: "linear-gradient(135deg,#03082e,#1b040a)",
              padding: "1.5rem 1.75rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#C8102E,#03082e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.15)",
                }}>
                  <span style={{ fontFamily: "'Bebas Neue'", color: "white", fontSize: "1.3rem" }}>
                    {memberInitials(selectedMember)}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.5rem", color: "white", letterSpacing: 1 }}>
                    {selectedMember.name}
                  </div>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {selectedMember.role}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{
                background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
                width: 32, height: 32, cursor: "pointer", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "1.75rem" }}>
              {/* Points highlight */}
              <div style={{
                background: "linear-gradient(135deg,rgba(200,16,46,0.06),rgba(3,8,46,0.04))",
                border: "1px solid rgba(200,16,46,0.15)",
                borderRadius: 10, padding: "1.2rem",
                display: "flex", justifyContent: "space-around",
                marginBottom: "1.5rem", textAlign: "center",
              }}>
                {[
                  { label: "Status",  value: selectedMember.membership?.status ?? "—" },
                  { label: "Plan",    value: selectedMember.membership?.planName ?? "—" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "2.4rem", color: "#C8102E", letterSpacing: 1, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#aaa", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                {[
                  { label: "Email",    value: selectedMember.email },
                  { label: "Role",     value: selectedMember.role  },
                  { label: "Plan",     value: selectedMember.membership?.planName ?? "—" },
                  { label: "Status",   value: selectedMember.membership?.status  ?? "—" },
                  { label: "Member since", value: selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : "—" },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: "#f8f7f5", borderRadius: 8, padding: "0.75rem 1rem",
                    gridColumn: i === 0 ? "1 / -1" : "auto",
                  }}>
                    <div style={{ fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: "0.2rem" }}>{f.label}</div>
                    <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.9rem", color: "#03082e" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
