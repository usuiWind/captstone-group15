import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { getAllMembers, recordAttendance } from "../api/services/adminService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000));
}

const STATUS_STYLE = {
  ACTIVE:    { color: "#16a34a", bg: "rgba(34,197,94,0.1)"   },
  PENDING:   { color: "#ca8a04", bg: "rgba(234,179,8,0.1)"   },
  PAST_DUE:  { color: "#ea580c", bg: "rgba(249,115,22,0.1)"  },
  CANCELLED: { color: "#dc2626", bg: "rgba(239,68,68,0.1)"   },
  EXPIRED:   { color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.EXPIRED;
  return (
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10,
      letterSpacing: 1.5, textTransform: "uppercase",
      color: s.color, background: s.bg,
      padding: "0.25rem 0.6rem", borderRadius: 20,
    }}>
      {status?.replace("_", " ") ?? "None"}
    </span>
  );
}

// ─── Tab button ────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12,
        letterSpacing: 2, textTransform: "uppercase",
        background: "none", border: "none", cursor: "pointer",
        padding: "0.75rem 1.5rem",
        color: active ? "#C8102E" : "#888",
        borderBottom: active ? "2.5px solid #C8102E" : "2.5px solid transparent",
        transition: "color 0.2s",
      }}
    >
      {label}
    </button>
  );
}

// ─── MEMBERS TAB ───────────────────────────────────────────────────────────────
function MembersTab({ members, loading }) {
  const [filter, setFilter] = useState("");

  const filtered = members.filter(m =>
    !filter ||
    m.name?.toLowerCase().includes(filter.toLowerCase()) ||
    m.email?.toLowerCase().includes(filter.toLowerCase())
  );

  const thStyle = {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10,
    letterSpacing: 2.5, textTransform: "uppercase", color: "#888",
    padding: "0.75rem 1rem", textAlign: "left",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e",
    padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)",
    verticalAlign: "middle",
  };

  return (
    <div>
      {/* Search + stats row */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search name or email…"
          style={{
            flex: 1, minWidth: 220,
            padding: "0.7rem 1rem", borderRadius: 6,
            border: "1.5px solid rgba(0,0,0,0.12)",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
          }}
        />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 14 }}>Loading members…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 14 }}>No members found.</p>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", background: "white" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8f7f5" }}>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Expires</th>
                <th style={thStyle}>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const days = daysLeft(m.membership?.currentPeriodEnd);
                const expiring = days !== null && days <= 14 && m.membership?.status === "ACTIVE";
                return (
                  <tr key={m.id} style={{ transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{m.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{m.role === "ADMIN" ? "Admin" : "Member"}</div>
                    </td>
                    <td style={{ ...tdStyle, color: "#555" }}>{m.email}</td>
                    <td style={tdStyle}>
                      <Badge status={m.membership?.status ?? "NONE"} />
                    </td>
                    <td style={{ ...tdStyle, color: "#555" }}>{m.membership?.planName || "—"}</td>
                    <td style={{ ...tdStyle, color: "#555" }}>{fmt(m.membership?.currentPeriodEnd)}</td>
                    <td style={tdStyle}>
                      {days !== null
                        ? <span style={{ color: expiring ? "#ea580c" : "#03082e", fontWeight: expiring ? 700 : 400 }}>{days}d</span>
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── ATTENDANCE TAB ────────────────────────────────────────────────────────────
function AttendanceTab({ members }) {
  const [form, setForm] = useState({ userId: "", eventName: "", date: new Date().toISOString().split("T")[0], points: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem", borderRadius: 6,
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#555",
    marginBottom: "0.4rem",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId) { setError("Please select a member."); return; }
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      await recordAttendance({ ...form, points: Number(form.points) });
      setSuccess(`Attendance recorded for ${members.find(m => m.id === form.userId)?.name || "member"}.`);
      setForm(f => ({ ...f, userId: "", eventName: "" }));
    } catch (err) {
      setError(err.message || "Failed to record attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", marginBottom: "1.75rem", lineHeight: 1.7 }}>
        Manually record meeting attendance for a member. Points are added to their total.
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={labelStyle}>Member</label>
          <select
            value={form.userId}
            onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
            style={{ ...inputStyle, background: "white" }}
            required
          >
            <option value="">Select a member…</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name || m.email} {m.membership?.status ? `(${m.membership.status})` : "(no membership)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Event / Meeting Name</label>
          <input
            value={form.eventName}
            onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
            placeholder="e.g. Weekly Meeting — Week 5"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Points</label>
            <input
              type="number"
              min={1} max={100}
              value={form.points}
              onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>
        </div>

        {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>{error}</p>}
        {success && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? "#ccc" : "#C8102E", color: "white",
            padding: "0.85rem 2rem", borderRadius: 5, border: "none", cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12,
            letterSpacing: 2, textTransform: "uppercase",
            boxShadow: submitting ? "none" : "0 6px 20px rgba(200,16,46,0.3)",
            transition: "all 0.25s",
          }}
        >
          {submitting ? "Recording…" : "Record Attendance"}
        </button>
      </form>
    </div>
  );
}

// ─── ANALYTICS TAB ─────────────────────────────────────────────────────────────
function AnalyticsTab({ members }) {
  const total   = members.length;
  const active  = members.filter(m => m.membership?.status === "ACTIVE").length;
  const pastDue = members.filter(m => m.membership?.status === "PAST_DUE").length;
  const noMem   = members.filter(m => !m.membership).length;
  const expiring = members.filter(m => {
    const d = daysLeft(m.membership?.currentPeriodEnd);
    return d !== null && d <= 14 && m.membership?.status === "ACTIVE";
  }).length;

  const stats = [
    { label: "Total Members",    value: total,   color: "#03082e" },
    { label: "Active",           value: active,  color: "#16a34a" },
    { label: "Past Due",         value: pastDue, color: "#ea580c" },
    { label: "No Membership",    value: noMem,   color: "#6b7280" },
    { label: "Expiring (14 days)", value: expiring, color: "#ca8a04" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: "white", borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            padding: "1.25rem 1.5rem",
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: s.color, letterSpacing: 2, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", fontWeight: 700, marginTop: "0.4rem" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Expiring soon list */}
      {expiring > 0 && (
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#ea580c", marginBottom: "0.75rem" }}>
            Expiring within 14 days
          </div>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
            {members
              .map(m => ({ m, d: daysLeft(m.membership?.currentPeriodEnd) }))
              .filter(({ m, d }) => d !== null && d <= 14 && m.membership?.status === "ACTIVE")
              .sort((a, b) => a.d - b.d)
              .map(({ m, d }, i, arr) => (
                <div key={m.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.85rem 1.25rem",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#03082e" }}>{m.name || m.email}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>{m.email}</div>
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#ea580c" }}>
                    {d}d left
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMembers = useCallback(() => {
    setLoading(true);
    getAllMembers()
      .then(setMembers)
      .catch(() => setError("Failed to load members."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const TABS = [
    { key: "members",    label: "Members"    },
    { key: "attendance", label: "Attendance" },
    { key: "analytics",  label: "Analytics"  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8f7f5; }
        input:focus, select:focus { border-color: #C8102E !important; box-shadow: 0 0 0 3px rgba(200,16,46,0.1); }
      `}</style>

      <Navbar active="" alwaysSolid />

      <div style={{ paddingTop: 68, minHeight: "100vh", background: "#f8f7f5" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #03082e 0%, #0a1550 100%)", padding: "3rem 2rem 2.5rem", borderBottom: "3px solid #C8102E" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#C8102E", fontWeight: 700, marginBottom: "0.5rem" }}>
              Admin Portal
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,6vw,4rem)", color: "white", letterSpacing: 3, lineHeight: 1 }}>
              Admin Dashboard
            </h1>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem", display: "flex", gap: 0 }}>
            {TABS.map(t => (
              <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.9rem 1.2rem", marginBottom: "1.5rem", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {tab === "members"    && <MembersTab members={members} loading={loading} />}
          {tab === "attendance" && <AttendanceTab members={members} />}
          {tab === "analytics"  && <AnalyticsTab members={members} />}
        </div>
      </div>
    </>
  );
}
