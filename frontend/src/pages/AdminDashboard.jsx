import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import {
  getAllMembers,
  createMember,
  updateMember,
  deleteMember,
  getMemberAttendance,
  recordAttendance,
  updateAttendance,
  deleteAttendance,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../api/services/adminService";

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

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12,
        letterSpacing: 2, textTransform: "uppercase",
        background: "none", border: "none", cursor: "pointer",
        padding: "0.75rem 1.5rem", whiteSpace: "nowrap",
        color: active ? "#C8102E" : "#888",
        borderBottom: active ? "2.5px solid #C8102E" : "2.5px solid transparent",
        transition: "color 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function AdminStatCard({ label, value, sub, accent = "#C8102E", icon }) {
  return (
    <div
      style={{
        background: "white", borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        padding: "1.4rem 1.5rem",
        borderTop: `4px solid ${accent}`,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)"; }}
    >
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
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `${accent}18`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({ members, events, loading, onTabChange }) {
  const memberInitials = (m) => (m.name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const memberStatus  = (m) => (m.membership?.status ?? "UNKNOWN").toLowerCase();
  const activeCount   = members.filter(m => memberStatus(m) === "active").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter(e => new Date(e.eventDate).toISOString().split("T")[0] >= todayStr);

  return (
    <div>
      <div className="admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
        <AdminStatCard label="Total Members" value={loading ? "…" : members.length} sub={`${activeCount} active`} accent="#C8102E"
          icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><circle cx="9" cy="7" r="4" stroke="#C8102E" strokeWidth="1.8"/><path d="M3 21v-1a6 6 0 0112 0v1M16 11a4 4 0 010 8" stroke="#C8102E" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
        <AdminStatCard label="Active Members" value={loading ? "…" : activeCount} sub={`of ${members.length} total`} accent="#16a34a"
          icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><path d="M3 17l5-8 4 5 3-4 5 7" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        <AdminStatCard label="Upcoming Events" value={loading ? "…" : upcomingEvents.length} sub="Scheduled" accent="#003087"
          icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><rect x="3" y="4" width="18" height="18" rx="2" stroke="#003087" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#003087" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
        <AdminStatCard label="Pending" value={loading ? "…" : members.filter(m => memberStatus(m) === "pending").length} sub="Awaiting activation" accent="#7b3fa0"
          icon={<svg viewBox="0 0 24 24" fill="none" width={18} height={18}><circle cx="12" cy="12" r="9" stroke="#7b3fa0" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="#7b3fa0" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
        {/* Points leaderboard */}
        <div style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ background: "#03082e", padding: "1rem 1.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "white", letterSpacing: 1 }}>Points Leaderboard</span>
            <button onClick={() => onTabChange("members")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#C8102E" }}>
              View all →
            </button>
          </div>
          <div style={{ padding: "0.5rem 0" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>Loading…</div>
            ) : members.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>No members yet.</div>
            ) : [...members].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).slice(0, 8).map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.4rem", borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.2rem", color: i === 0 ? "#C8102E" : i === 1 ? "#7b3fa0" : i === 2 ? "#b8600a" : "#ccc", minWidth: 24, letterSpacing: 1 }}>{i + 1}</span>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#03082e,#C8102E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Bebas Neue'", color: "white", fontSize: "1rem" }}>{memberInitials(m)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.9rem", color: "#03082e" }}>{m.name}</div>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa" }}>{m.membership?.planName ?? "No plan"}</div>
                </div>
                <Badge status={m.membership?.status ?? "NONE"} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ background: "#03082e", padding: "1rem 1.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.3rem", color: "white", letterSpacing: 1 }}>Upcoming Events</span>
            <button onClick={() => onTabChange("events")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#C8102E" }}>
              Manage →
            </button>
          </div>
          <div style={{ padding: "0.5rem 0" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>Loading…</div>
            ) : upcomingEvents.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'DM Sans'", color: "#bbb" }}>No upcoming events.</div>
            ) : upcomingEvents.slice(0, 6).map((ev, i, arr) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.4rem", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", borderLeft: "3px solid #C8102E" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: "0.88rem", color: "#03082e" }}>{ev.title}</div>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#aaa", marginTop: 2 }}>{fmt(ev.eventDate)} · {ev.pointsValue} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MEMBERS TAB ───────────────────────────────────────────────────────────────
function MembersTab({ members, loading, onRefresh }) {
  const [filter, setFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [working, setWorking] = useState(null);
  const [actionError, setActionError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", name: "", password: "", role: "MEMBER", membershipStatus: "", planName: "", startDate: "", endDate: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "MEMBER" });

  const filtered = members.filter(m =>
    !filter ||
    m.name?.toLowerCase().includes(filter.toLowerCase()) ||
    m.email?.toLowerCase().includes(filter.toLowerCase())
  );

  async function handleRevoke(member) {
    setWorking(member.id + "_revoke");
    setActionError("");
    try {
      await updateMember({ id: member.id, revokeAccess: true });
      onRefresh();
    } catch (e) {
      setActionError(e.message || "Failed to revoke access.");
    } finally {
      setWorking(null);
    }
  }

  async function handleDelete(id) {
    setWorking(id + "_delete");
    setActionError("");
    try {
      await deleteMember(id);
      setConfirmDelete(null);
      onRefresh();
    } catch (e) {
      setActionError(e.message || "Failed to delete member.");
    } finally {
      setWorking(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError(""); setCreateSuccess(""); setCreating(true);
    try {
      await createMember(createForm);
      setCreateSuccess("Member created successfully.");
      setCreateForm({ email: "", name: "", password: "", role: "MEMBER", membershipStatus: "", planName: "", startDate: "", endDate: "" });
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      setCreateError(err.message || "Failed to create member.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(m) {
    setEditingId(m.id);
    setEditForm({ name: m.name || "", role: m.role || "MEMBER" });
    setActionError("");
  }

  async function handleEditSave(id) {
    setWorking(id + "_edit");
    setActionError("");
    try {
      await updateMember({ id, name: editForm.name, role: editForm.role });
      setEditingId(null);
      onRefresh();
    } catch (e) {
      setActionError(e.message || "Failed to update member.");
    } finally {
      setWorking(null);
    }
  }

  const thStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#888", padding: "0.75rem 1rem", textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.08)", whiteSpace: "nowrap" };
  const tdStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e", padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" };
  const btnBase = { border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "0.3rem 0.7rem" };
  const inputStyle = { width: "100%", padding: "0.65rem 0.9rem", borderRadius: 6, border: "1.5px solid rgba(0,0,0,0.12)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" };

  return (
    <div>
      {/* Create Member */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={() => { setShowCreate(v => !v); setCreateError(""); setCreateSuccess(""); }}
          style={{ ...btnBase, background: "#C8102E", color: "white", padding: "0.55rem 1.2rem", fontSize: 11, letterSpacing: 2 }}>
          {showCreate ? "✕ Cancel" : "+ Create Member"}
        </button>
        {createSuccess && <span style={{ marginLeft: "1rem", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{createSuccess}</span>}
        {showCreate && (
          <form onSubmit={handleCreate} style={{ marginTop: "1rem", background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Row 1: identity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Email *</label>
                <input type="email" required value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="member@email.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Name</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Password</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Optional" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Role</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, background: "white" }}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            {/* Row 2: membership (optional) */}
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "0.75rem" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", marginBottom: "0.5rem" }}>Membership (optional)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Status</label>
                  <select value={createForm.membershipStatus} onChange={e => setCreateForm(f => ({ ...f, membershipStatus: e.target.value }))} style={{ ...inputStyle, background: "white" }}>
                    <option value="">— None —</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Plan Name</label>
                  <input value={createForm.planName} onChange={e => setCreateForm(f => ({ ...f, planName: e.target.value }))} placeholder="e.g. Annual Membership" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Start Date</label>
                  <input type="date" value={createForm.startDate} onChange={e => setCreateForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>End Date</label>
                  <input type="date" value={createForm.endDate} onChange={e => setCreateForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button type="submit" disabled={creating} style={{ ...btnBase, background: creating ? "#ccc" : "#03082e", color: "white", padding: "0.65rem 1.4rem", fontSize: 11 }}>
                {creating ? "Creating…" : "Create Member"}
              </button>
              {createError && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#dc2626" }}>{createError}</span>}
            </div>
          </form>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search name or email…"
          style={{ flex: 1, minWidth: 220, padding: "0.7rem 1rem", borderRadius: 6, border: "1.5px solid rgba(0,0,0,0.12)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" }}
        />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {actionError && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "0.7rem 1rem", marginBottom: "1rem", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>
          {actionError}
        </div>
      )}

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
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const days = daysLeft(m.membership?.currentPeriodEnd);
                const expiring = days !== null && days <= 14 && m.membership?.status === "ACTIVE";
                const isActive = ["ACTIVE", "PAST_DUE"].includes(m.membership?.status);
                const isEditing = editingId === m.id;
                return (
                  <tr key={m.id}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={tdStyle}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <input
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Full name"
                            style={{ padding: "0.3rem 0.5rem", borderRadius: 4, border: "1.5px solid #C8102E", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none", width: 140 }}
                          />
                          <select
                            value={editForm.role}
                            onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                            style={{ padding: "0.3rem 0.5rem", borderRadius: 4, border: "1.5px solid rgba(0,0,0,0.15)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: "white" }}
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600 }}>{m.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{m.role === "ADMIN" ? "Admin" : "Member"}</div>
                        </>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: "#555" }}>{m.email}</td>
                    <td style={tdStyle}><Badge status={m.membership?.status ?? "NONE"} /></td>
                    <td style={{ ...tdStyle, color: "#555" }}>{m.membership?.planName || "—"}</td>
                    <td style={{ ...tdStyle, color: "#555" }}>{fmt(m.membership?.currentPeriodEnd)}</td>
                    <td style={tdStyle}>
                      {days !== null
                        ? <span style={{ color: expiring ? "#ea580c" : "#03082e", fontWeight: expiring ? 700 : 400 }}>{days}d</span>
                        : "—"}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {isEditing ? (
                          <>
                            <button disabled={working === m.id + "_edit"} onClick={() => handleEditSave(m.id)} style={{ ...btnBase, background: "#16a34a", color: "white" }}>
                              {working === m.id + "_edit" ? "…" : "Save"}
                            </button>
                            <button onClick={() => setEditingId(null)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>✕</button>
                          </>
                        ) : (
                          <button disabled={!!working} onClick={() => startEdit(m)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>Edit</button>
                        )}
                        {!isEditing && isActive && (
                          <button disabled={!!working} onClick={() => handleRevoke(m)} style={{ ...btnBase, background: "rgba(249,115,22,0.1)", color: "#ea580c" }}>
                            {working === m.id + "_revoke" ? "…" : "Revoke"}
                          </button>
                        )}
                        {!isEditing && (confirmDelete === m.id ? (
                          <>
                            <button disabled={!!working} onClick={() => handleDelete(m.id)} style={{ ...btnBase, background: "#dc2626", color: "white" }}>
                              {working === m.id + "_delete" ? "…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>Cancel</button>
                          </>
                        ) : (
                          <button disabled={!!working} onClick={() => setConfirmDelete(m.id)} style={{ ...btnBase, background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>Delete</button>
                        ))}
                      </div>
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
function AttendanceTab({ members, events }) {
  const [form, setForm] = useState({ userId: "", eventName: "", date: new Date().toISOString().split("T")[0], points: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPoints, setEditPoints] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!form.userId) { setRecords([]); setTotalPoints(0); return; }
    setLoadingRecords(true);
    getMemberAttendance(form.userId)
      .then(d => { setRecords(d.records ?? []); setTotalPoints(d.totalPoints ?? 0); })
      .catch(() => {})
      .finally(() => setLoadingRecords(false));
  }, [form.userId]);

  const inputStyle = { width: "100%", padding: "0.75rem 1rem", borderRadius: 6, border: "1.5px solid rgba(0,0,0,0.12)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" };
  const labelStyle = { display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#555", marginBottom: "0.4rem" };
  const thStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#888", padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.08)" };
  const tdStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#03082e", padding: "0.65rem 0.75rem", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId) { setError("Please select a member."); return; }
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      await recordAttendance({ ...form, points: Number(form.points), date: new Date(form.date).toISOString() });
      setSuccess(`Attendance recorded for ${members.find(m => m.id === form.userId)?.name || "member"}.`);
      setForm(f => ({ ...f, eventName: "" }));
      const d = await getMemberAttendance(form.userId);
      setRecords(d.records ?? []); setTotalPoints(d.totalPoints ?? 0);
    } catch (err) {
      setError(err.message || "Failed to record attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  async function handleEditSave(record) {
    try {
      await updateAttendance({ id: record.id, points: Number(editPoints) });
      const d = await getMemberAttendance(form.userId);
      setRecords(d.records ?? []); setTotalPoints(d.totalPoints ?? 0);
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to update record.");
    }
  }

  async function handleDeleteRecord(id) {
    setDeletingId(id);
    try {
      await deleteAttendance(id);
      const d = await getMemberAttendance(form.userId);
      setRecords(d.records ?? []); setTotalPoints(d.totalPoints ?? 0);
    } catch (err) {
      setError(err.message || "Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: "1.25rem" }}>Record Attendance</div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Member</label>
            <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} style={{ ...inputStyle, background: "white" }} required>
              <option value="">Select a member…</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name || m.email} {m.membership?.status ? `(${m.membership.status})` : "(no membership)"}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Event / Meeting Name</label>
            <input
              list="event-options"
              value={form.eventName}
              onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
              placeholder="Select or type event name…"
              style={inputStyle}
            />
            <datalist id="event-options">
              {(events ?? []).map(ev => (
                <option key={ev.id} value={ev.title} />
              ))}
            </datalist>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Points</label>
              <input type="number" min={1} max={100} value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} style={inputStyle} required />
            </div>
          </div>
          {error   && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{success}</p>}
          <button type="submit" disabled={submitting} style={{ background: submitting ? "#ccc" : "#C8102E", color: "white", padding: "0.85rem 2rem", borderRadius: 5, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", boxShadow: submitting ? "none" : "0 6px 20px rgba(200,16,46,0.3)" }}>
            {submitting ? "Recording…" : "Record Attendance"}
          </button>
        </form>
      </div>

      <div>
        {form.userId ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888" }}>
                Records — {members.find(m => m.id === form.userId)?.name || "Member"}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#C8102E", letterSpacing: 2 }}>{totalPoints} pts</div>
            </div>
            {loadingRecords ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa" }}>Loading…</p>
            ) : records.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa" }}>No records yet.</p>
            ) : (
              <div style={{ background: "white", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f8f7f5" }}>
                    <tr>
                      <th style={thStyle}>Event</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Pts</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id}>
                        <td style={tdStyle}>{r.eventName || "—"}</td>
                        <td style={tdStyle}>{fmt(r.date)}</td>
                        <td style={tdStyle}>
                          {editingId === r.id ? (
                            <input type="number" min={0} max={100} value={editPoints} onChange={e => setEditPoints(e.target.value)}
                              style={{ width: 52, padding: "0.2rem 0.4rem", border: "1.5px solid #C8102E", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} autoFocus />
                          ) : r.points}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          {editingId === r.id ? (
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button onClick={() => handleEditSave(r)} style={{ border: "none", borderRadius: 3, background: "#16a34a", color: "white", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>Save</button>
                              <button onClick={() => setEditingId(null)} style={{ border: "none", borderRadius: 3, background: "rgba(0,0,0,0.06)", color: "#555", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button onClick={() => { setEditingId(r.id); setEditPoints(String(r.points)); }} style={{ border: "none", borderRadius: 3, background: "rgba(0,0,0,0.06)", color: "#555", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>Edit</button>
                              <button disabled={deletingId === r.id} onClick={() => handleDeleteRecord(r.id)} style={{ border: "none", borderRadius: 3, background: "rgba(239,68,68,0.08)", color: "#dc2626", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>
                                {deletingId === r.id ? "…" : "Del"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#bbb", marginTop: "2rem" }}>
            Select a member to view their attendance records.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EVENTS TAB ────────────────────────────────────────────────────────────────
function EventsTab() {
  const blankForm = { title: "", description: "", eventDate: new Date().toISOString().split("T")[0], pointsValue: 1 };
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getAllEvents()
      .then(setEvents)
      .catch(() => setError("Failed to load events."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(ev) {
    setEditingId(ev.id);
    setForm({ title: ev.title, description: ev.description ?? "", eventDate: new Date(ev.eventDate).toISOString().split("T")[0], pointsValue: ev.pointsValue });
    setError(""); setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setError(""); setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const payload = { ...form, eventDate: new Date(form.eventDate).toISOString(), pointsValue: Number(form.pointsValue) };
      if (editingId) {
        await updateEvent({ id: editingId, ...payload });
        setSuccess("Event updated.");
        setEditingId(null);
      } else {
        await createEvent(payload);
        setSuccess("Event created.");
      }
      setForm(blankForm);
      load();
    } catch (err) {
      setError(err.message || "Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteEvent(id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = { width: "100%", padding: "0.75rem 1rem", borderRadius: 6, border: "1.5px solid rgba(0,0,0,0.12)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" };
  const labelStyle = { display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#555", marginBottom: "0.4rem" };
  const thStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#888", padding: "0.75rem 1rem", textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.08)" };
  const tdStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e", padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" };
  const btnBase = { border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "0.3rem 0.7rem" };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = events.filter(e => new Date(e.eventDate).toISOString().split("T")[0] >= todayStr);
  const past     = events.filter(e => new Date(e.eventDate).toISOString().split("T")[0] <  todayStr);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "2.5rem", alignItems: "start" }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: "1.25rem" }}>
          {editingId ? "Edit Event" : "New Event"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekly Meeting — Week 5" style={inputStyle} required maxLength={200} />
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Location, agenda, etc." rows={3} style={{ ...inputStyle, resize: "vertical" }} maxLength={2000} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Points</label>
              <input type="number" min={0} max={100} value={form.pointsValue} onChange={e => setForm(f => ({ ...f, pointsValue: e.target.value }))} style={inputStyle} required />
            </div>
          </div>
          {error   && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{success}</p>}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, background: submitting ? "#ccc" : "#C8102E", color: "white", padding: "0.85rem", borderRadius: 5, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", boxShadow: submitting ? "none" : "0 6px 20px rgba(200,16,46,0.3)" }}>
              {submitting ? "Saving…" : editingId ? "Update Event" : "Create Event"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: "0.85rem 1.2rem", borderRadius: 5, border: "1.5px solid rgba(0,0,0,0.12)", background: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#555" }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: "0.75rem" }}>
          Upcoming ({upcoming.length})
        </div>
        {loading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13, marginBottom: "1.5rem" }}>Loading…</p>
        ) : upcoming.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13, marginBottom: "1.5rem" }}>No upcoming events.</p>
        ) : (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "2rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8f7f5" }}>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Pts</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(ev => (
                  <tr key={ev.id} onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#555", fontSize: 12 }}>{fmt(ev.eventDate)}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{ev.title}</div>
                      {ev.description && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{ev.description}</div>}
                    </td>
                    <td style={{ ...tdStyle, color: "#C8102E", fontWeight: 700 }}>{ev.pointsValue}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => startEdit(ev)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>Edit</button>
                        {confirmDelete === ev.id ? (
                          <>
                            <button disabled={!!deletingId} onClick={() => handleDelete(ev.id)} style={{ ...btnBase, background: "#dc2626", color: "white" }}>{deletingId === ev.id ? "…" : "Confirm"}</button>
                            <button onClick={() => setConfirmDelete(null)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(ev.id)} style={{ ...btnBase, background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {past.length > 0 && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", marginBottom: "0.75rem" }}>
              Past ({past.length})
            </div>
            <div style={{ background: "white", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8f7f5" }}>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Pts</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {past.slice(0, 10).map(ev => (
                    <tr key={ev.id}>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#aaa", fontSize: 12 }}>{fmt(ev.eventDate)}</td>
                      <td style={{ ...tdStyle, color: "#aaa" }}>{ev.title}</td>
                      <td style={{ ...tdStyle, color: "#aaa" }}>{ev.pointsValue}</td>
                      <td style={tdStyle} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ─── ANALYTICS TAB ─────────────────────────────────────────────────────────────
function AnalyticsTab({ members }) {
  const total    = members.length;
  const active   = members.filter(m => m.membership?.status === "ACTIVE").length;
  const pastDue  = members.filter(m => m.membership?.status === "PAST_DUE").length;
  const noMem    = members.filter(m => !m.membership).length;
  const expiring = members.filter(m => {
    const d = daysLeft(m.membership?.currentPeriodEnd);
    return d !== null && d <= 14 && m.membership?.status === "ACTIVE";
  }).length;

  const stats = [
    { label: "Total Members",      value: total,    color: "#03082e" },
    { label: "Active",             value: active,   color: "#16a34a" },
    { label: "Past Due",           value: pastDue,  color: "#ea580c" },
    { label: "No Membership",      value: noMem,    color: "#6b7280" },
    { label: "Expiring (14 days)", value: expiring, color: "#ca8a04" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.25rem 1.5rem", borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: s.color, letterSpacing: 2, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", fontWeight: 700, marginTop: "0.4rem" }}>{s.label}</div>
          </div>
        ))}
      </div>
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
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#03082e" }}>{m.name || m.email}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>{m.email}</div>
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#ea580c" }}>{d}d left</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([getAllMembers(), getAllEvents()])
      .then(([m, e]) => { setMembers(m); setEvents(e); })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS = [
    { key: "overview",   label: "Overview"   },
    { key: "members",    label: "Members"    },
    { key: "attendance", label: "Attendance" },
    { key: "events",     label: "Events"     },
    { key: "analytics",  label: "Analytics"  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; width: 100%; }
        body { font-family: 'DM Sans', sans-serif; background: #f8f7f5; overflow-x: hidden; width: 100%; }
        #root { width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #C8102E !important; box-shadow: 0 0 0 3px rgba(200,16,46,0.1); }
        @media (max-width: 900px)  { .admin-stats { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px)  { .admin-stats { grid-template-columns: 1fr !important; } }
      `}</style>

      <Navbar active="" alwaysSolid />

      <div style={{ paddingTop: 68, minHeight: "100vh", background: "#f8f7f5" }}>
        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(152deg, #020619 0%, #04124a 55%, #1b040a 100%)", padding: "2.5rem 2rem 2rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.032, backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
          <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ width: 20, height: 2, background: "#C8102E", display: "block", borderRadius: 2 }} />
                <span style={{ fontFamily: "'DM Sans'", color: "#C8102E", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700 }}>Admin Portal</span>
              </div>
              <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "white", letterSpacing: 2, lineHeight: 1 }}>
                FITP UH Admin Dashboard
              </h1>
              <p style={{ fontFamily: "'DM Sans'", color: "rgba(255,255,255,0.4)", fontSize: "0.88rem", marginTop: "0.3rem" }}>
                Manage members, events, attendance, staff, and sponsors
              </p>
            </div>
            <a href="/membership" style={{ background: "#C8102E", color: "white", padding: "0.75rem 1.5rem", borderRadius: 6, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", boxShadow: "0 6px 20px rgba(200,16,46,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#a00d25"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#C8102E"; e.currentTarget.style.transform = ""; }}
            >
              + Add Member
            </a>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 68, zIndex: 10 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", display: "flex", overflowX: "auto" }}>
            {TABS.map(t => <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />)}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 2rem" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.9rem 1.2rem", marginBottom: "1.5rem", fontFamily: "'DM Sans'", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}
          {tab === "overview"   && <OverviewTab members={members} events={events} loading={loading} onTabChange={setTab} />}
          {tab === "members"    && <MembersTab members={members} loading={loading} onRefresh={loadData} />}
          {tab === "attendance" && <AttendanceTab members={members} events={events} />}
          {tab === "events"     && <EventsTab />}
          {tab === "analytics"  && <AnalyticsTab members={members} />}
        </div>
      </div>
    </>
  );
}
