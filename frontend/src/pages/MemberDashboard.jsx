import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMembership } from "../api/services/membershipService";
import { getAttendance } from "../api/services/attendanceService";
import { useAuth } from "../context/AuthContext";

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

    .stat-card {
      background: white;
      border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      padding: 1.5rem;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 32px rgba(0,0,0,0.1);
    }

    .event-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.06);
      border-left: 3px solid #C8102E;
      background: white;
      transition: transform 0.2s ease;
    }
    .event-row:hover { transform: translateX(4px); }

    .progress-track {
      width: 100%; height: 10px;
      background: #f0eff0; border-radius: 20px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 20px;
      background: linear-gradient(90deg, #C8102E, #03082e);
      transition: width 1s ease;
    }

    .announce-card {
      background: white; border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.07);
      border-left: 4px solid #C8102E;
      padding: 1.2rem 1.4rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    @media (max-width: 768px) {
      .dash-grid { grid-template-columns: 1fr !important; }
      .stats-row  { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 480px) {
      .stats-row { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─── APPS SCRIPT URL ──────────────────────────────────────────────────────────
const WEB_APP_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? "";

// ─── STATIC MOCK DATA (events/announcements — connect later) ─────────────────
const MOCK_EVENTS = [
  { date: "Apr 3, 2026",  name: "AWS Certification Study Group",  type: "Study Night",      points: 10 },
  { date: "Mar 25, 2026", name: "FITP Networking Social",         type: "Social",           points: 5  },
  { date: "Mar 18, 2026", name: "Career Fair Prep Workshop",      type: "Workshop",         points: 5  },
  { date: "Mar 10, 2026", name: "Tech Talk: Cloud Fundamentals",  type: "GBM",              points: 7  },
  { date: "Feb 20, 2026", name: "Industry Mentorship Session",    type: "Mentorship Event", points: 30 },
  { date: "Feb 5, 2026",  name: "FITP General Body Meeting",      type: "GBM",              points: 7  },
];

const MOCK_ANNOUNCEMENTS = [
  {
    date:  "Apr 5, 2026",
    title: "USITCC Regional Conference Registration Open",
    body:  "Registration for the 2026 USITCC Regional Conference is now open. Members with 50+ points get priority registration. Deadline is April 20th.",
    tag:   "Conference",
  },
  {
    date:  "Apr 1, 2026",
    title: "New Workshop Series Starting This Month",
    body:  "Join us for our April workshop series covering cloud certifications, resume reviews, and mock interviews. Check the events calendar for dates.",
    tag:   "Events",
  },
  {
    date:  "Mar 28, 2026",
    title: "FITP Mentorship Program — Apply Now",
    body:  "Applications for the Spring mentorship cohort are open. Members who complete 3+ sessions earn 90 bonus points. Apply by April 10th.",
    tag:   "Mentorship",
  },
];

const UPCOMING_EVENTS = [
  { date: "Apr 10", name: "Resume Review Workshop",      time: "6:00 PM", points: 5 },
  { date: "Apr 17", name: "Google Cloud Info Session",   time: "5:30 PM", points: 5 },
  { date: "Apr 24", name: "FITP End of Semester Social", time: "7:00 PM", points: 5 },
];

const EVENT_TYPE_COLORS = {
  "GBM":               "#003087",
  "Study Night":       "#1a7a4a",
  "Social":            "#7b3fa0",
  "Workshop":          "#b8600a",
  "Networking Event":  "#0a7d8c",
  "Mentorship Event":  "#C8102E",
  "PCI Event":         "#555",
  "Volunteering Event":"#2c7a2c",
};

// ─── STAT CARD COMPONENT ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = "#C8102E", icon }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: "#aaa", fontWeight: 700, marginBottom: "0.4rem" }}>
            {label}
          </div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "2.4rem", color: "#03082e", letterSpacing: 1, lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#aaa", marginTop: "0.3rem" }}>{sub}</div>}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── DATE HELPER ─────────────────────────────────────────────────────────────
function parseDateParts(dateVal) {
  const d = new Date(dateVal);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day:   String(d.getDate()),
    year:  String(d.getFullYear()),
  };
}

const STATUS_COLOR = {
  ACTIVE:   "#4caf50",
  PENDING:  "#ff9800",
  PAST_DUE: "#f44336",
  CANCELLED:"#aaa",
  EXPIRED:  "#aaa",
};

// ─── FALLBACK when Apps Script doesn't have the member yet ────────────────────
function buildFallbackMember(email, sessionUser) {
  const name  = sessionUser?.name || email || "Member";
  const parts = name.split(" ");
  return {
    firstName:        parts[0] || "Member",
    lastName:         parts.slice(1).join(" "),
    email:            email || sessionUser?.email || "",
    major:            "",
    classification:   "",
    membershipStatus: "Active",
    membershipType:   "Member",
    joinDate:         "",
    totalPoints:      0,
    pointsGoal:       100,
    eventsAttended:   0,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const [ready,      setReady]      = useState(false);
  const [member,     setMember]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [attendance, setAttendance] = useState([]);
  const [stripeMembership, setStripeMembership] = useState(null);

  const { user } = useAuth();

  // ── Fetch Stripe membership + real attendance records ──
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [membershipResult, attendanceResult] = await Promise.allSettled([
          getMembership(),
          getAttendance(),
        ]);
        if (membershipResult.status === "fulfilled" && membershipResult.value) {
          setStripeMembership(membershipResult.value);
        }
        if (attendanceResult.status === "fulfilled" && attendanceResult.value?.records) {
          setAttendance(attendanceResult.value.records);
        }
      } catch {
        // backend data is supplemental; Apps Script profile still loads
      }
    }
    loadBackendData();
  }, []);

  // ── Fetch member profile from Apps Script Web App ──
  useEffect(() => {
    setTimeout(() => setReady(true), 100);

    // Gets the logged-in member's email saved by LoginPage
    const userEmail = localStorage.getItem("fitpEmail") || "";

    if (!userEmail || !WEB_APP_URL) {
      setMember(buildFallbackMember(userEmail, user));
      setLoading(false);
      return;
    }

    fetch(`${WEB_APP_URL}?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data.found) {
          setMember({
            firstName:        data.firstName   || "",
            lastName:         data.lastName    || "",
            email:            data.email       || userEmail,
            major:            data.major       || "",
            classification:   data.classification || "",
            membershipStatus: data.status      || "Active",
            membershipType:   data.type        || "Full",
            joinDate:         data.joinDate    || "",
            totalPoints:      Number(data.totalPoints) || 0,
            pointsGoal:       100,
            eventsAttended:   Number(data.eventsAttended) || 0,
          });
        } else {
          // Not in Google Sheet yet — fall back to session data
          setMember(buildFallbackMember(userEmail, user));
        }
        setLoading(false);
      })
      .catch(() => {
        // Apps Script unreachable — fall back to session data
        setMember(buildFallbackMember(userEmail, user));
        setLoading(false);
      });
  }, []);

  const anim = (delay) => ({
    opacity:    ready ? 1 : 0,
    transform:  ready ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  // ── Loading state ──
  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#f8f7f5", flexDirection: "column", gap: "1rem",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid #f0eff0",
          borderTop: "3px solid #C8102E",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontFamily: "'DM Sans'", fontSize: "0.9rem", color: "#aaa", letterSpacing: 2, textTransform: "uppercase" }}>
          Loading your dashboard…
        </div>
      </div>
    </>
  );

  // ── Error / not found state ──
  if (error || !member) return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#f8f7f5",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Bebas Neue'", fontSize: "2.4rem",
            color: "#C8102E", letterSpacing: 2, marginBottom: "0.6rem",
          }}>
            Member Not Found
          </div>
          <p style={{ fontFamily: "'DM Sans'", color: "#aaa", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
            We couldn't find your account. Please log in again.
          </p>
          <a href="/login" style={{
            background: "#C8102E", color: "white",
            padding: "0.75rem 2rem", borderRadius: 6,
            fontFamily: "'DM Sans'", fontWeight: 700,
            fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
            textDecoration: "none",
          }}>
            Back to Login
          </a>
        </div>
      </div>
    </>
  );

  const progressPct = Math.min(100, Math.round((member.totalPoints / member.pointsGoal) * 100));

  return (
    <>
      <GlobalStyles />
      <Navbar active="" alwaysSolid />

      <div style={{ paddingTop: 68, minHeight: "100vh", background: "#f8f7f5" }}>

        {/* ── Header bar ── */}
        <div style={{
          background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)",
          padding: "2.5rem 2rem 2rem",
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
            background: "radial-gradient(ellipse, rgba(200,16,46,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>

              {/* Welcome text */}
              <div style={{ ...anim(0.05) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: 20, height: 2, background: "#C8102E", display: "block", borderRadius: 2 }} />
                  <span className="section-tag">Member Portal</span>
                </div>
                <h1 style={{
                  fontFamily: "'Bebas Neue'", fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  color: "white", letterSpacing: 2, lineHeight: 1,
                }}>
                  Welcome back, {member.firstName}
                </h1>
                <p style={{ fontFamily: "'DM Sans'", color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", marginTop: "0.3rem" }}>
                  {member.major} · {member.classification} · Member since {member.joinDate}
                </p>
              </div>

              {/* Points + Status badges */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", ...anim(0.12) }}>
                {/* Live points badge */}
                <div style={{
                  background: "rgba(200,16,46,0.15)",
                  border: "1px solid rgba(200,16,46,0.35)",
                  borderRadius: 10, padding: "0.9rem 1.4rem",
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                    Total Points
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#C8102E", letterSpacing: 1, lineHeight: 1 }}>
                    {member.totalPoints}
                  </div>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: "0.2rem" }}>
                    Goal: {member.pointsGoal}
                  </div>
                </div>

                {/* Membership status badge — Stripe data preferred */}
                <div style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10, padding: "0.9rem 1.4rem",
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.3rem" }}>
                    Membership
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue'", fontSize: "1.4rem", letterSpacing: 1,
                    color: stripeMembership
                      ? (STATUS_COLOR[stripeMembership.status] || "#4caf50")
                      : "#4caf50",
                  }}>
                    {stripeMembership ? stripeMembership.status : member.membershipStatus}
                  </div>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: "0.1rem" }}>
                    {stripeMembership ? stripeMembership.planName : member.membershipType} Member
                  </div>
                  {stripeMembership?.currentPeriodEnd && (
                    <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: "0.15rem" }}>
                      Renews {new Date(stripeMembership.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tab nav */}
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "1.8rem" }}>
              {["overview", "events", "announcements"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  background: activeTab === tab ? "#C8102E" : "rgba(255,255,255,0.07)",
                  border: "none", borderRadius: "6px 6px 0 0",
                  padding: "0.5rem 1.2rem", cursor: "pointer",
                  fontFamily: "'DM Sans'", fontWeight: 700,
                  fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase",
                  color: activeTab === tab ? "white" : "rgba(255,255,255,0.45)",
                  transition: "all 0.2s",
                }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <div>
              {/* Stats row */}
              <div className="stats-row" style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1.25rem", marginBottom: "2rem", ...anim(0.1),
              }}>
                <StatCard
                  label="Total Points"
                  value={member.totalPoints}
                  sub={`Goal: ${member.pointsGoal} pts`}
                  accent="#C8102E"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={20} height={20}><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" stroke="#C8102E" strokeWidth="1.8" strokeLinejoin="round"/></svg>}
                />
                <StatCard
                  label="Events Attended"
                  value={member.eventsAttended}
                  sub="This semester"
                  accent="#003087"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={20} height={20}><rect x="3" y="4" width="18" height="18" rx="3" stroke="#003087" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#003087" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                />
                <StatCard
                  label="Membership"
                  value={member.membershipType}
                  sub={member.membershipStatus}
                  accent="#1a7a4a"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={20} height={20}><circle cx="12" cy="8" r="4" stroke="#1a7a4a" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1a7a4a" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                />
                <StatCard
                  label="Progress"
                  value={`${progressPct}%`}
                  sub={`${member.pointsGoal - member.totalPoints} pts to goal`}
                  accent="#7b3fa0"
                  icon={<svg viewBox="0 0 24 24" fill="none" width={20} height={20}><circle cx="12" cy="12" r="9" stroke="#7b3fa0" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="#7b3fa0" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                />
              </div>

              {/* Points progress bar */}
              <div style={{
                background: "white", borderRadius: 10, padding: "1.5rem",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                marginBottom: "2rem", ...anim(0.18),
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans'", fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: "#aaa", fontWeight: 700 }}>
                      Points Progress
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.6rem", color: "#03082e", letterSpacing: 1, marginTop: "0.1rem" }}>
                      {member.totalPoints} / {member.pointsGoal} points
                    </div>
                  </div>
                  <div style={{
                    background: progressPct >= 100 ? "rgba(76,175,80,0.1)" : "rgba(200,16,46,0.08)",
                    border: `1.5px solid ${progressPct >= 100 ? "#4caf50" : "#C8102E"}`,
                    borderRadius: 20, padding: "0.25rem 0.9rem",
                  }}>
                    <span style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 12, color: progressPct >= 100 ? "#4caf50" : "#C8102E" }}>
                      {progressPct >= 100 ? "Goal Reached! 🎉" : `${progressPct}% to goal`}
                    </span>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#bbb" }}>0</span>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#bbb" }}>{member.pointsGoal} pts</span>
                </div>
              </div>

              <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", ...anim(0.22) }}>

                {/* Recent events */}
                <div style={{ background: "white", borderRadius: 10, padding: "1.5rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.4rem", color: "#03082e", letterSpacing: 1 }}>Recent Events</div>
                    <button onClick={() => setActiveTab("events")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#C8102E" }}>
                      View all →
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {(attendance.length > 0 ? attendance : MOCK_EVENTS).slice(0, 4).map((ev, i) => {
                      const parts = ev.date ? { month: ev.date.split(" ")[0], day: ev.date.split(" ")[1]?.replace(",","") } : parseDateParts(ev.createdAt || ev.date);
                      const name  = ev.name || ev.eventName || "Event";
                      const pts   = ev.points ?? 0;
                      return (
                        <div key={ev.id || i} className="event-row">
                          <div style={{
                            flexShrink: 0, width: 38, height: 38, borderRadius: 6,
                            background: "#03082e",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontFamily: "'DM Sans'", fontSize: 8, color: "#C8102E", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                              {parts.month}
                            </span>
                            <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "white", lineHeight: 1 }}>
                              {parts.day}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.86rem", color: "#03082e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {name}
                            </div>
                          </div>
                          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#C8102E", letterSpacing: 1, flexShrink: 0 }}>
                            +{pts}
                          </div>
                        </div>
                      );
                    })}
                    {attendance.length === 0 && (
                      <p style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#bbb", textAlign: "center", padding: "0.5rem 0" }}>
                        No attendance records yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Upcoming events */}
                <div style={{ background: "white", borderRadius: 10, padding: "1.5rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.4rem", color: "#03082e", letterSpacing: 1, marginBottom: "1.2rem" }}>
                    Upcoming Events
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    {UPCOMING_EVENTS.map((ev, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.9rem 1rem", borderRadius: 8,
                        background: "#f8f7f5", border: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        <div style={{
                          flexShrink: 0, background: "#C8102E", borderRadius: 6,
                          padding: "0.3rem 0.55rem", textAlign: "center",
                        }}>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 8, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                            {ev.date.split(" ")[0]}
                          </div>
                          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.2rem", color: "white", lineHeight: 1 }}>
                            {ev.date.split(" ")[1]}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.88rem", color: "#03082e" }}>{ev.name}</div>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa", marginTop: 1 }}>{ev.time}</div>
                        </div>
                        <div style={{
                          fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700,
                          color: "#1a7a4a", background: "rgba(26,122,74,0.1)",
                          padding: "0.2rem 0.6rem", borderRadius: 12, flexShrink: 0,
                        }}>
                          +{ev.points} pts
                        </div>
                      </div>
                    ))}
                  </div>

                  <a href="/contact" style={{
                    display: "block", textAlign: "center", marginTop: "1.2rem",
                    padding: "0.7rem", borderRadius: 6,
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 11,
                    letterSpacing: 1.8, textTransform: "uppercase",
                    color: "#03082e", textDecoration: "none", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8102E"; e.currentTarget.style.color = "#C8102E"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.color = "#03082e"; }}
                  >
                    Contact Us
                  </a>
                </div>

              </div>
            </div>
          )}

          {/* ══ EVENTS TAB ══ */}
          {activeTab === "events" && (
            <div style={{ ...anim(0.05) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <div className="section-tag" style={{ marginBottom: "0.4rem" }}>Attendance History</div>
                  <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#03082e", letterSpacing: 2 }}>
                    Events Attended
                  </h2>
                </div>
                <div style={{
                  background: "#03082e", borderRadius: 8, padding: "0.6rem 1.2rem",
                  fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "white", letterSpacing: 1,
                }}>
                  {member.totalPoints} Total Points
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {attendance.length === 0 ? (
                  <div style={{
                    background: "white", borderRadius: 10, padding: "2.5rem",
                    border: "1px solid rgba(0,0,0,0.07)", textAlign: "center",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.4rem", color: "#aaa", letterSpacing: 1, marginBottom: "0.4rem" }}>
                      No Events Yet
                    </div>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: "0.88rem", color: "#bbb" }}>
                      Attendance records will appear here after you check in to events.
                    </p>
                  </div>
                ) : (
                  attendance.map((ev) => {
                    const { month, day, year } = parseDateParts(ev.date);
                    return (
                      <div key={ev.id} style={{
                        background: "white", borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.07)",
                        borderLeft: "4px solid #C8102E",
                        padding: "1rem 1.4rem",
                        display: "flex", alignItems: "center", gap: "1.2rem",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                        transition: "transform 0.2s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateX(5px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = ""}
                      >
                        <div style={{
                          flexShrink: 0, width: 50, background: "#03082e",
                          borderRadius: 8, padding: "0.35rem 0.4rem", textAlign: "center",
                        }}>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 8, color: "#C8102E", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                            {month}
                          </div>
                          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.4rem", color: "white", lineHeight: 1 }}>
                            {day}
                          </div>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 }}>
                            {year}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.95rem", color: "#03082e" }}>
                            {ev.eventName || "Event"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Bebas Neue'", fontSize: "1.8rem", color: "#C8102E", letterSpacing: 1, lineHeight: 1 }}>
                            +{ev.points}
                          </div>
                          <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#aaa", letterSpacing: 1 }}>points</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ══ ANNOUNCEMENTS TAB ══ */}
          {activeTab === "announcements" && (
            <div style={{ ...anim(0.05) }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <div className="section-tag" style={{ marginBottom: "0.4rem" }}>From FITP Leadership</div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#03082e", letterSpacing: 2 }}>
                  Announcements
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {MOCK_ANNOUNCEMENTS.map((a, i) => (
                  <div key={i} className="announce-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                        <span style={{
                          fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 700,
                          letterSpacing: 1.5, textTransform: "uppercase",
                          color: "#C8102E", background: "rgba(200,16,46,0.08)",
                          padding: "0.2rem 0.7rem", borderRadius: 10,
                        }}>{a.tag}</span>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#03082e", letterSpacing: 1 }}>{a.title}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#bbb" }}>{a.date}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: "0.91rem", color: "#555", lineHeight: 1.75, fontWeight: 300 }}>
                      {a.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
