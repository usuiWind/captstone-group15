import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import {
  getAllMembers,
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
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAllSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
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
function MembersTab({ members, loading, onRefresh }) {
  const [filter, setFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [working, setWorking] = useState(null);
  const [actionError, setActionError] = useState("");

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

  const thStyle = {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10,
    letterSpacing: 2.5, textTransform: "uppercase", color: "#888",
    padding: "0.75rem 1rem", textAlign: "left",
    borderBottom: "1px solid rgba(0,0,0,0.08)", whiteSpace: "nowrap",
  };
  const tdStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e",
    padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)",
    verticalAlign: "middle",
  };
  const btnBase = {
    border: "none", borderRadius: 4, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10,
    letterSpacing: 1.5, textTransform: "uppercase", padding: "0.3rem 0.7rem",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search name or email…"
          style={{
            flex: 1, minWidth: 220, padding: "0.7rem 1rem", borderRadius: 6,
            border: "1.5px solid rgba(0,0,0,0.12)",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
          }}
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
                    <td style={tdStyle}><Badge status={m.membership?.status ?? "NONE"} /></td>
                    <td style={{ ...tdStyle, color: "#555" }}>{m.membership?.planName || "—"}</td>
                    <td style={{ ...tdStyle, color: "#555" }}>{fmt(m.membership?.currentPeriodEnd)}</td>
                    <td style={tdStyle}>
                      {days !== null
                        ? <span style={{ color: expiring ? "#ea580c" : "#03082e", fontWeight: expiring ? 700 : 400 }}>{days}d</span>
                        : "—"}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {isActive && (
                          <button
                            disabled={!!working}
                            onClick={() => handleRevoke(m)}
                            style={{ ...btnBase, background: "rgba(249,115,22,0.1)", color: "#ea580c" }}
                          >
                            {working === m.id + "_revoke" ? "…" : "Revoke"}
                          </button>
                        )}
                        {confirmDelete === m.id ? (
                          <>
                            <button
                              disabled={!!working}
                              onClick={() => handleDelete(m.id)}
                              style={{ ...btnBase, background: "#dc2626", color: "white" }}
                            >
                              {working === m.id + "_delete" ? "…" : "Confirm"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={!!working}
                            onClick={() => setConfirmDelete(m.id)}
                            style={{ ...btnBase, background: "rgba(239,68,68,0.08)", color: "#dc2626" }}
                          >
                            Delete
                          </button>
                        )}
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
function AttendanceTab({ members }) {
  const [form, setForm] = useState({ userId: "", eventName: "", date: new Date().toISOString().split("T")[0], points: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Per-member record view
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

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem", borderRadius: 6,
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
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
      await recordAttendance({ ...form, points: Number(form.points), date: new Date(form.date).toISOString() });
      setSuccess(`Attendance recorded for ${members.find(m => m.id === form.userId)?.name || "member"}.`);
      setForm(f => ({ ...f, eventName: "" }));
      // Refresh records
      const d = await getMemberAttendance(form.userId);
      setRecords(d.records ?? []); setTotalPoints(d.totalPoints ?? 0);
    } catch (err) {
      setError(err.message || "Failed to record attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  async function handleEdit(record) {
    try {
      await updateAttendance({ id: record.id, points: Number(editPoints) });
      const d = await getMemberAttendance(form.userId);
      setRecords(d.records ?? []); setTotalPoints(d.totalPoints ?? 0);
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to update record.");
    }
  }

  async function handleDelete(id) {
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

  const thStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#888", padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.08)" };
  const tdStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#03082e", padding: "0.65rem 0.75rem", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
      {/* Left: create form */}
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: "1.25rem" }}>
          Record Attendance
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
            <input value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} placeholder="e.g. Weekly Meeting — Week 5" style={inputStyle} />
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
          {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{success}</p>}
          <button
            type="submit" disabled={submitting}
            style={{
              background: submitting ? "#ccc" : "#C8102E", color: "white",
              padding: "0.85rem 2rem", borderRadius: 5, border: "none", cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12,
              letterSpacing: 2, textTransform: "uppercase",
              boxShadow: submitting ? "none" : "0 6px 20px rgba(200,16,46,0.3)",
            }}
          >
            {submitting ? "Recording…" : "Record Attendance"}
          </button>
        </form>
      </div>

      {/* Right: record list */}
      <div>
        {form.userId && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888" }}>
                Records — {members.find(m => m.id === form.userId)?.name || "Member"}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#C8102E", letterSpacing: 2 }}>
                {totalPoints} pts
              </div>
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
                            <input
                              type="number" min={0} max={100}
                              value={editPoints}
                              onChange={e => setEditPoints(e.target.value)}
                              style={{ width: 52, padding: "0.2rem 0.4rem", border: "1.5px solid #C8102E", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
                              autoFocus
                            />
                          ) : r.points}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          {editingId === r.id ? (
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button onClick={() => handleEdit(r)} style={{ border: "none", borderRadius: 3, background: "#16a34a", color: "white", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>Save</button>
                              <button onClick={() => setEditingId(null)} style={{ border: "none", borderRadius: 3, background: "rgba(0,0,0,0.06)", color: "#555", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button onClick={() => { setEditingId(r.id); setEditPoints(String(r.points)); }} style={{ border: "none", borderRadius: 3, background: "rgba(0,0,0,0.06)", color: "#555", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>Edit</button>
                              <button disabled={deletingId === r.id} onClick={() => handleDelete(r.id)} style={{ border: "none", borderRadius: 3, background: "rgba(239,68,68,0.08)", color: "#dc2626", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: "0.25rem 0.5rem", cursor: "pointer" }}>
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
        )}
        {!form.userId && (
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
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      eventDate: new Date(ev.eventDate).toISOString().split("T")[0],
      pointsValue: ev.pointsValue,
    });
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
      const payload = {
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
        pointsValue: Number(form.pointsValue),
      };
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

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem", borderRadius: 6,
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
  };
  const labelStyle = {
    display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#555",
    marginBottom: "0.4rem",
  };
  const thStyle = {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10,
    letterSpacing: 2, textTransform: "uppercase", color: "#888",
    padding: "0.75rem 1rem", textAlign: "left",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  };
  const tdStyle = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e",
    padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)",
    verticalAlign: "middle",
  };
  const btnBase = {
    border: "none", borderRadius: 4, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10,
    letterSpacing: 1.5, textTransform: "uppercase", padding: "0.3rem 0.7rem",
  };

  const upcoming = events.filter(e => new Date(e.eventDate) >= new Date());
  const past = events.filter(e => new Date(e.eventDate) < new Date());

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "2.5rem", alignItems: "start" }}>
      {/* Left: form */}
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

      {/* Right: calendar list */}
      <div>
        {/* Upcoming */}
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
                            <button disabled={!!deletingId} onClick={() => handleDelete(ev.id)} style={{ ...btnBase, background: "#dc2626", color: "white" }}>
                              {deletingId === ev.id ? "…" : "Confirm"}
                            </button>
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

        {/* Past */}
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
                    <tr key={ev.id} onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#aaa", fontSize: 12 }}>{fmt(ev.eventDate)}</td>
                      <td style={{ ...tdStyle, color: "#aaa" }}>{ev.title}</td>
                      <td style={{ ...tdStyle, color: "#aaa" }}>{ev.pointsValue}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => startEdit(ev)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>Edit</button>
                          {confirmDelete === ev.id ? (
                            <>
                              <button disabled={!!deletingId} onClick={() => handleDelete(ev.id)} style={{ ...btnBase, background: "#dc2626", color: "white" }}>
                                {deletingId === ev.id ? "…" : "Confirm"}
                              </button>
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
          </>
        )}
      </div>
    </div>
  );
}

// ─── STAFF TAB ─────────────────────────────────────────────────────────────────
function StaffTab() {
  const blankForm = { name: "", role: "", bio: "", email: "", order: 1, isActive: true };
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getAllStaff()
      .then(setStaff)
      .catch(() => setError("Failed to load staff."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(s) {
    setEditingId(s.id);
    setForm({ name: s.name, role: s.role, bio: s.bio ?? "", email: s.email ?? "", order: s.order, isActive: s.isActive });
    setImageFile(null);
    setError(""); setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setImageFile(null);
    setError(""); setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      if (editingId) {
        await updateStaff(editingId, form, imageFile ?? undefined);
        setSuccess("Staff member updated.");
        setEditingId(null);
      } else {
        await createStaff(form, imageFile ?? undefined);
        setSuccess("Staff member created.");
      }
      setForm(blankForm);
      setImageFile(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to save staff member.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteStaff(id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to delete staff member.");
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem", borderRadius: 6,
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
  };
  const labelStyle = {
    display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#555",
    marginBottom: "0.4rem",
  };
  const thStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#888", padding: "0.75rem 1rem", textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.08)" };
  const tdStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e", padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" };
  const btnBase = { border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "0.3rem 0.7rem" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "2.5rem", alignItems: "start" }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: "1.25rem" }}>
          {editingId ? "Edit Staff Member" : "New Staff Member"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" style={inputStyle} required maxLength={200} />
          </div>
          <div>
            <label style={labelStyle}>Title / Role *</label>
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. President" style={inputStyle} required maxLength={100} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short bio…" rows={3} style={{ ...inputStyle, resize: "vertical" }} maxLength={1000} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Display Order *</label>
              <input type="number" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} style={inputStyle} required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "0.1rem" }}>
              <label style={{ ...labelStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 0 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Photo</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0] ?? null)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
          </div>

          {error   && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{success}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, background: submitting ? "#ccc" : "#C8102E", color: "white", padding: "0.85rem", borderRadius: 5, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", boxShadow: submitting ? "none" : "0 6px 20px rgba(200,16,46,0.3)" }}>
              {submitting ? "Saving…" : editingId ? "Update Member" : "Add Member"}
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
          Staff ({staff.length})
        </div>
        {loading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13 }}>Loading…</p>
        ) : staff.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13 }}>No staff members yet.</p>
        ) : (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8f7f5" }}>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.email && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{s.email}</div>}
                    </td>
                    <td style={{ ...tdStyle, color: "#555" }}>{s.role}</td>
                    <td style={{ ...tdStyle, color: "#555" }}>{s.order}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: s.isActive ? "#16a34a" : "#aaa" }}>
                        {s.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => startEdit(s)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>Edit</button>
                        {confirmDelete === s.id ? (
                          <>
                            <button disabled={!!deletingId} onClick={() => handleDelete(s.id)} style={{ ...btnBase, background: "#dc2626", color: "white" }}>
                              {deletingId === s.id ? "…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(s.id)} style={{ ...btnBase, background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SPONSORS TAB ──────────────────────────────────────────────────────────────
const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

function SponsorsTab() {
  const blankForm = { name: "", websiteUrl: "", tier: "GOLD", order: 1, isActive: true, startDate: "", endDate: "" };
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [logoFile, setLogoFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getAllSponsors()
      .then(setSponsors)
      .catch(() => setError("Failed to load sponsors."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(sp) {
    setEditingId(sp.id);
    setForm({
      name: sp.name,
      websiteUrl: sp.websiteUrl ?? "",
      tier: sp.tier,
      order: sp.order,
      isActive: sp.isActive,
      startDate: sp.startDate ? new Date(sp.startDate).toISOString().split("T")[0] : "",
      endDate: sp.endDate ? new Date(sp.endDate).toISOString().split("T")[0] : "",
    });
    setLogoFile(null);
    setError(""); setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setLogoFile(null);
    setError(""); setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingId && !logoFile) { setError("Logo image is required."); return; }
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const fields = { ...form, isActive: String(form.isActive), order: String(form.order) };
      if (editingId) {
        await updateSponsor(editingId, fields, logoFile ?? undefined);
        setSuccess("Sponsor updated.");
        setEditingId(null);
      } else {
        await createSponsor(fields, logoFile);
        setSuccess("Sponsor created.");
      }
      setForm(blankForm);
      setLogoFile(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to save sponsor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteSponsor(id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to delete sponsor.");
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem", borderRadius: 6,
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
  };
  const labelStyle = {
    display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#555",
    marginBottom: "0.4rem",
  };
  const thStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#888", padding: "0.75rem 1rem", textAlign: "left", borderBottom: "1px solid rgba(0,0,0,0.08)" };
  const tdStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#03082e", padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" };
  const btnBase = { border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "0.3rem 0.7rem" };
  const TIER_COLOR = { PLATINUM: "#6b7280", GOLD: "#ca8a04", SILVER: "#9ca3af", BRONZE: "#b45309" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "2.5rem", alignItems: "start" }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: "1.25rem" }}>
          {editingId ? "Edit Sponsor" : "New Sponsor"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" style={inputStyle} required maxLength={200} />
          </div>
          <div>
            <label style={labelStyle}>Website URL</label>
            <input type="url" value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://example.com" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Tier *</label>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} style={{ ...inputStyle, background: "white" }} required>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Display Order *</label>
              <input type="number" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} style={inputStyle} required />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" id="sp-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="sp-active" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>Active</label>
          </div>
          <div>
            <label style={labelStyle}>Logo Image {!editingId && "*"}</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0] ?? null)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
            {editingId && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Leave empty to keep current logo.</div>}
          </div>

          {error   && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>{success}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, background: submitting ? "#ccc" : "#C8102E", color: "white", padding: "0.85rem", borderRadius: 5, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", boxShadow: submitting ? "none" : "0 6px 20px rgba(200,16,46,0.3)" }}>
              {submitting ? "Saving…" : editingId ? "Update Sponsor" : "Add Sponsor"}
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
          Sponsors ({sponsors.length})
        </div>
        {loading ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13 }}>Loading…</p>
        ) : sponsors.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13 }}>No sponsors yet.</p>
        ) : (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8f7f5" }}>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Tier</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map(sp => (
                  <tr key={sp.id} onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{sp.name}</div>
                      {sp.websiteUrl && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{sp.websiteUrl}</div>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: TIER_COLOR[sp.tier] ?? "#555", letterSpacing: 1 }}>{sp.tier}</span>
                    </td>
                    <td style={{ ...tdStyle, color: "#555" }}>{sp.order}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: sp.isActive ? "#16a34a" : "#aaa" }}>
                        {sp.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => startEdit(sp)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>Edit</button>
                        {confirmDelete === sp.id ? (
                          <>
                            <button disabled={!!deletingId} onClick={() => handleDelete(sp.id)} style={{ ...btnBase, background: "#dc2626", color: "white" }}>
                              {deletingId === sp.id ? "…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)} style={{ ...btnBase, background: "rgba(0,0,0,0.06)", color: "#555" }}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(sp.id)} style={{ ...btnBase, background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div key={s.label} style={{
            background: "white", borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            padding: "1.25rem 1.5rem",
            borderTop: `3px solid ${s.color}`,
          }}>
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
                <div key={m.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.85rem 1.25rem",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}>
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
    { key: "events",     label: "Events"     },
    { key: "analytics",  label: "Analytics"  },
    { key: "staff",      label: "Staff"      },
    { key: "sponsors",   label: "Sponsors"   },
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
        <div style={{ background: "linear-gradient(135deg, #03082e 0%, #0a1550 100%)", padding: "3rem 2rem 2.5rem", borderBottom: "3px solid #C8102E" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#C8102E", fontWeight: 700, marginBottom: "0.5rem" }}>Admin Portal</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,6vw,4rem)", color: "white", letterSpacing: 3, lineHeight: 1 }}>Admin Dashboard</h1>
          </div>
        </div>

        <div style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem", display: "flex", gap: 0 }}>
            {TABS.map(t => (
              <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.9rem 1.2rem", marginBottom: "1.5rem", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}
          {tab === "members"    && <MembersTab members={members} loading={loading} onRefresh={loadMembers} />}
          {tab === "attendance" && <AttendanceTab members={members} />}
          {tab === "events"     && <EventsTab />}
          {tab === "analytics"  && <AnalyticsTab members={members} />}
          {tab === "staff"      && <StaffTab />}
          {tab === "sponsors"   && <SponsorsTab />}
        </div>
      </div>
    </>
  );
}
