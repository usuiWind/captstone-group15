import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMembership } from "../api/services/membershipService";
import { getAttendance } from "../api/services/attendanceService";

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  ACTIVE:    { bg: "rgba(34,197,94,0.12)",  text: "#16a34a", label: "Active"    },
  PENDING:   { bg: "rgba(234,179,8,0.12)",  text: "#ca8a04", label: "Pending"   },
  PAST_DUE:  { bg: "rgba(249,115,22,0.12)", text: "#ea580c", label: "Past Due"  },
  CANCELLED: { bg: "rgba(239,68,68,0.12)",  text: "#dc2626", label: "Cancelled" },
  EXPIRED:   { bg: "rgba(107,114,128,0.12)",text: "#6b7280", label: "Expired"   },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.EXPIRED;
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
      fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase",
      padding: "0.3rem 0.8rem", borderRadius: 20,
    }}>
      {c.label}
    </span>
  );
}

// ─── Days remaining helper ─────────────────────────────────────────────────────
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "white", borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      padding: "2rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
      fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase",
      color: "#C8102E", marginBottom: "1.2rem",
    }}>
      {children}
    </div>
  );
}

// ─── Membership card ───────────────────────────────────────────────────────────
function MembershipCard({ membership, loading }) {
  if (loading) return (
    <Card>
      <CardLabel>Membership</CardLabel>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 14 }}>Loading…</p>
    </Card>
  );

  if (!membership) return (
    <Card>
      <CardLabel>Membership</CardLabel>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#888", fontSize: 14, lineHeight: 1.7 }}>
        No active membership found.<br />
        <a href="/membership" style={{ color: "#C8102E", fontWeight: 600, textDecoration: "none" }}>
          Join today →
        </a>
      </p>
    </Card>
  );

  const days = daysUntil(membership.currentPeriodEnd);
  const isExpiringSoon = days <= 14 && membership.status === "ACTIVE";

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <CardLabel>Membership</CardLabel>
        <StatusBadge status={membership.status} />
      </div>

      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", color: "#03082e", letterSpacing: 2, lineHeight: 1, marginBottom: "0.4rem" }}>
        {membership.planName || "Standard Plan"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
        <Row label="Expires" value={formatDate(membership.currentPeriodEnd)} />
        <Row
          label="Days remaining"
          value={
            <span style={{ color: isExpiringSoon ? "#ea580c" : "#03082e", fontWeight: 700 }}>
              {days} {days === 1 ? "day" : "days"}
            </span>
          }
        />
        {membership.cancelAtPeriodEnd && (
          <Row label="Renewal" value={<span style={{ color: "#ea580c" }}>Will not renew</span>} />
        )}
      </div>

      {isExpiringSoon && (
        <div style={{
          marginTop: "1.5rem", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
          borderRadius: 8, padding: "0.75rem 1rem",
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#92400e",
        }}>
          Your membership expires soon. Contact an admin to renew.
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#03082e", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Points card ───────────────────────────────────────────────────────────────
function PointsCard({ attendance, loading }) {
  if (loading) return (
    <Card>
      <CardLabel>Meeting Points</CardLabel>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 14 }}>Loading…</p>
    </Card>
  );

  const { records = [], totalPoints = 0 } = attendance;

  return (
    <Card>
      <CardLabel>Meeting Points</CardLabel>

      {/* Big total */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.75rem" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3.5rem", color: "#C8102E", letterSpacing: 2, lineHeight: 1 }}>
          {totalPoints}
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888", fontWeight: 500 }}>
          total points
        </span>
      </div>

      {/* Recent records */}
      {records.length === 0 ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa" }}>
          No attendance records yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#aaa", fontWeight: 700, marginBottom: "0.75rem" }}>
            Recent meetings
          </div>
          {records.slice(0, 6).map((r, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.6rem 0", borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e", fontWeight: 600 }}>
                  {r.eventName || "Meeting"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                  {formatDate(r.date)}
                </div>
              </div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
                color: "#C8102E",
                background: "rgba(200,16,46,0.08)", borderRadius: 20,
                padding: "0.2rem 0.65rem",
              }}>
                +{r.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [attendance, setAttendance] = useState({ records: [], totalPoints: 0 });
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMembership()
      .then(d => { if (!cancelled) setMembership(d); })
      .catch(() => { if (!cancelled) setError("Could not load membership data."); })
      .finally(() => { if (!cancelled) setMembershipLoading(false); });

    getAttendance()
      .then(d => { if (!cancelled) setAttendance(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAttendanceLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f8f7f5; }
        @media (min-width: 768px) { .dash-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      <Navbar active="" alwaysSolid />

      <div style={{ paddingTop: 68, minHeight: "100vh", background: "#f8f7f5" }}>

        {/* Page header */}
        <div style={{ background: "linear-gradient(135deg, #03082e 0%, #0a1550 100%)", padding: "3rem 2rem 2.5rem", borderBottom: "3px solid #C8102E" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#C8102E", fontWeight: 700, marginBottom: "0.5rem" }}>
              Member Portal
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,6vw,4rem)", color: "white", letterSpacing: 3, lineHeight: 1 }}>
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: "0.5rem" }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.9rem 1.2rem", marginBottom: "1.5rem", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            <MembershipCard membership={membership} loading={membershipLoading} />
            <PointsCard attendance={attendance} loading={attendanceLoading} />
          </div>
        </div>
      </div>
    </>
  );
}
