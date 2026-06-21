import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ---------------- Sample starter data ----------------
const STARTER_JOBS = [
  { id: 1, company: "Google", role: "Software Engineer", location: "Bangalore", status: "Interview", date: "2026-06-10", notes: "2nd round scheduled — system design focus" },
  { id: 2, company: "Zoho", role: "Member Technical Staff", location: "Chennai", status: "Offer", date: "2026-05-28", notes: "Offer accepted, joining next month" },
  { id: 3, company: "TCS", role: "Assistant System Engineer", location: "Mumbai", status: "Applied", date: "2026-06-14", notes: "Applied via campus placement portal" },
  { id: 4, company: "Amazon", role: "SDE I", location: "Hyderabad", status: "Rejected", date: "2026-05-20", notes: "Didn't clear the bar raiser round" },
  { id: 5, company: "Freshworks", role: "Software Engineer", location: "Chennai", status: "Interview", date: "2026-06-12", notes: "Technical round scheduled next week" },
  { id: 6, company: "Infosys", role: "System Engineer", location: "Pune", status: "Applied", date: "2026-06-15", notes: "" },
];

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const STATUS_STYLE = {
  Applied:   { color: "#6366f1", soft: "#6366f11f" },
  Interview: { color: "#f59e0b", soft: "#f59e0b1f" },
  Offer:     { color: "#10b981", soft: "#10b9811f" },
  Rejected:  { color: "#f43f5e", soft: "#f43f5e1f" },
};
const EMPTY_FORM = { company: "", role: "", location: "", status: "Applied", date: new Date().toISOString().split("T")[0], notes: "" };

export default function App() {
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem("jobtrack_jobs_v2");
    return saved ? JSON.parse(saved) : STARTER_JOBS;
  });
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { localStorage.setItem("jobtrack_jobs_v2", JSON.stringify(jobs)); }, [jobs]);

  const total = jobs.length;
  const countByStatus = (status) => jobs.filter(j => j.status === status).length;
  const responseRate = total > 0 ? Math.round(((countByStatus("Interview") + countByStatus("Offer")) / total) * 100) : 0;

  const openAddForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEditForm = (job) => { setForm(job); setEditingId(job.id); setShowForm(true); };

  const saveJob = (e) => {
    e.preventDefault();
    if (editingId) setJobs(jobs.map(j => j.id === editingId ? { ...form, id: editingId } : j));
    else setJobs([{ ...form, id: Date.now() }, ...jobs]);
    setShowForm(false);
  };

  const deleteJob = (id) => { if (window.confirm("Delete this application?")) setJobs(jobs.filter(j => j.id !== id)); };

  const filteredJobs = useMemo(() => jobs.filter(j => {
    const matchesSearch = j.company.toLowerCase().includes(search.toLowerCase()) || j.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || j.status === filter;
    return matchesSearch && matchesFilter;
  }), [jobs, search, filter]);

  return (
    <div style={s.app}>
      <Sidebar page={page} setPage={setPage} total={total} />
      <main style={s.main}>
        {page === "dashboard" && <Dashboard jobs={jobs} total={total} countByStatus={countByStatus} responseRate={responseRate} setPage={setPage} openAddForm={openAddForm} />}
        {page === "applications" && (
          <Applications jobs={filteredJobs} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter}
            openAddForm={openAddForm} openEditForm={openEditForm} deleteJob={deleteJob} />
        )}
        {page === "analytics" && <Analytics jobs={jobs} countByStatus={countByStatus} responseRate={responseRate} />}
      </main>
      {showForm && <JobFormModal form={form} setForm={setForm} editingId={editingId} onSave={saveJob} onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ============ SIDEBAR ============
function Sidebar({ page, setPage, total }) {
  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: <IconGrid/> },
    { key: "applications", label: "Applications", icon: <IconList/> },
    { key: "analytics", label: "Analytics", icon: <IconChart/> },
  ];
  return (
    <aside style={s.sidebar}>
      <div style={s.brandRow}>
        <div style={s.brandMark}>J</div>
        <div>
          <div style={s.brandName} className="display">JobTrack</div>
          <div style={s.brandSub}>{total} applications</div>
        </div>
      </div>
      <nav style={{ marginTop: 8 }}>
        {NAV.map(item => {
          const active = page === item.key;
          return (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}>
              <span style={{ opacity: active ? 1 : 0.55, display: "flex" }}>{item.icon}</span>
              {item.label}
              {active && <span style={s.navDot} />}
            </button>
          );
        })}
      </nav>
      <div style={s.sidebarFooter}>
        <div style={s.footerCard}>
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
            Your data is saved locally in this browser — private, no account needed.
          </div>
        </div>
      </div>
    </aside>
  );
}

// ============ DASHBOARD ============
function Dashboard({ jobs, total, countByStatus, responseRate, setPage, openAddForm }) {
  const cards = [
    { label: "Total Applications", value: total, accent: "#6366f1" },
    { label: "Interviews", value: countByStatus("Interview"), accent: "#f59e0b" },
    { label: "Offers", value: countByStatus("Offer"), accent: "#10b981" },
    { label: "Rejections", value: countByStatus("Rejected"), accent: "#f43f5e" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <PageHeader
        eyebrow="Overview"
        title="Your job search, at a glance"
        subtitle="Every application, interview, and offer — tracked in one place."
        action={<button style={s.btnPrimary} onClick={openAddForm}><IconPlus/> Add application</button>}
      />

      <div style={s.dashGrid}>
        {/* Signature element: response rate ring */}
        <div style={s.ringCard}>
          <ResponseRing value={responseRate} />
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>Response rate</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Interviews + offers ÷ total applications</div>
          </div>
        </div>

        <div style={s.statColumn}>
          {cards.map(c => (
            <div key={c.label} style={s.statCardRow}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans'" }}>{c.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{c.label}</div>
              </div>
              <div style={{ width: 4, height: 36, borderRadius: 4, background: c.accent }} />
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardHeaderRow}>
          <h3 style={s.cardHeading}>Recent activity</h3>
          <button onClick={() => setPage("applications")} style={s.linkBtn}>View all <IconArrow/></button>
        </div>
        {jobs.length === 0 ? <EmptyState onAdd={openAddForm} /> : jobs.slice(0, 5).map(job => (
          <div key={job.id} style={s.recentRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CompanyAvatar name={job.company} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{job.role}</div>
                <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 1 }}>{job.company} · {job.location}</div>
              </div>
            </div>
            <StatusPill status={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponseRing({ value }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Plus Jakarta Sans'" }}>{value}%</div>
      </div>
    </div>
  );
}

// ============ APPLICATIONS ============
function Applications({ jobs, search, setSearch, filter, setFilter, openAddForm, openEditForm, deleteJob }) {
  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <PageHeader
        eyebrow="Manage"
        title="Applications"
        subtitle={`${jobs.length} ${jobs.length === 1 ? "application" : "applications"} tracked`}
        action={<button style={s.btnPrimary} onClick={openAddForm}><IconPlus/> Add application</button>}
      />

      <div style={s.toolbar}>
        <div style={s.searchBox}>
          <IconSearch/>
          <input style={s.searchInput} placeholder="Search by company or role..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...STATUSES].map(st => (
            <button key={st} onClick={() => setFilter(st)} style={{ ...s.filterChip, ...(filter === st ? s.filterChipActive : {}) }}>
              {st}
            </button>
          ))}
        </div>
      </div>

      <div style={s.card}>
        {jobs.length === 0 ? <EmptyState onAdd={openAddForm} /> : jobs.map(job => (
          <div key={job.id} style={s.jobRow}>
            <CompanyAvatar name={job.company} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{job.role}</span>
                <StatusPill status={job.status} />
              </div>
              <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 3 }}>{job.company} · {job.location} · {formatDate(job.date)}</div>
              {job.notes && <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>{job.notes}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => openEditForm(job)} style={s.iconBtn}><IconEdit/></button>
              <button onClick={() => deleteJob(job.id)} style={{ ...s.iconBtn, color: "var(--rose)" }}><IconTrash/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ ANALYTICS ============
function Analytics({ jobs, countByStatus, responseRate }) {
  const pieData = STATUSES.map(st => ({ name: st, value: countByStatus(st) })).filter(d => d.value > 0);
  const monthly = {};
  jobs.forEach(j => { const m = new Date(j.date).toLocaleString("default", { month: "short" }); monthly[m] = (monthly[m] || 0) + 1; });
  const barData = Object.entries(monthly).map(([month, count]) => ({ month, count }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <PageHeader eyebrow="Insights" title="Analytics" subtitle="Visual breakdown of your job search performance" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Response rate", value: `${responseRate}%`, accent: "#6366f1" },
          { label: "Active interviews", value: countByStatus("Interview"), accent: "#f59e0b" },
          { label: "Offers received", value: countByStatus("Offer"), accent: "#10b981" },
        ].map(c => (
          <div key={c.label} style={s.miniStat}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Plus Jakarta Sans'", color: c.accent }}>{c.value}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={s.card}>
          <h3 style={s.cardHeading}>By status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={STATUS_STYLE[entry.name].color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={s.tooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_STYLE[d.name].color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardHeading}>Applications by month</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <XAxis dataKey="month" tick={{ fill: "#8b93a7", fontSize: 12 }} axisLine={{ stroke: "#232b3d" }} tickLine={false} />
              <YAxis tick={{ fill: "#8b93a7", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={s.tooltip} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============ SHARED PIECES ============
function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={s.pageHeader}>
      <div>
        <div style={s.eyebrow}>{eyebrow}</div>
        <h1 style={s.pageTitle} className="display">{title}</h1>
        <p style={s.pageSub}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 14 }}>No applications yet — add your first one to get started.</div>
      <button onClick={onAdd} style={s.btnPrimary}><IconPlus/> Add application</button>
    </div>
  );
}

function CompanyAvatar({ name, size = 38 }) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: `${colors[idx]}22`, color: colors[idx], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0, fontFamily: "'Plus Jakarta Sans'" }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function StatusPill({ status }) {
  const st = STATUS_STYLE[status];
  return <span style={{ background: st.soft, color: st.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{status}</span>;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ============ MODAL FORM ============
function JobFormModal({ form, setForm, editingId, onSave, onClose }) {
  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Plus Jakarta Sans'" }}>{editingId ? "Edit application" : "Add application"}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <form onSubmit={onSave} style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Company" value={form.company} onChange={v => setForm({ ...form, company: v })} required />
            <Field label="Role" value={form.role} onChange={v => setForm({ ...form, role: v })} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <Field label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} />
            <Field label="Date applied" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Status</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {STATUSES.map(st => (
                <button key={st} type="button" onClick={() => setForm({ ...form, status: st })}
                  style={{ ...s.statusOption, ...(form.status === st ? { background: STATUS_STYLE[st].soft, color: STATUS_STYLE[st].color, borderColor: STATUS_STYLE[st].color + "55" } : {}) }}>
                  {st}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Notes</label>
            <textarea style={{ ...s.input, resize: "vertical", marginTop: 6 }} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Interview details, contacts, follow-ups..." />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button type="button" onClick={onClose} style={s.btnGhost}>Cancel</button>
            <button type="submit" style={{ ...s.btnPrimary, flex: 1, justifyContent: "center" }}>{editingId ? "Save changes" : "Add application"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={{ ...s.input, marginTop: 6 }} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} />
    </div>
  );
}

// ============ ICONS (inline SVG, no deps) ============
const IconGrid = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/></svg>;
const IconList = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconChart = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 16l4-4 3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:0.5}}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconEdit = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTrash = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconArrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginLeft:2}}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ============ STYLES ============
const s = {
  app: { display: "flex", minHeight: "100vh" },
  sidebar: { width: 248, background: "rgba(17,22,35,0.6)", backdropFilter: "blur(20px)", borderRight: "1px solid var(--border-soft)", padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" },
  brandRow: { display: "flex", alignItems: "center", gap: 11, padding: "0 8px", marginBottom: 28 },
  brandMark: { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, fontFamily: "'Plus Jakarta Sans'", color: "#fff", flexShrink: 0 },
  brandName: { fontWeight: 800, fontSize: 16.5, letterSpacing: "-0.01em" },
  brandSub: { fontSize: 11.5, color: "var(--text-3)", marginTop: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "transparent", borderRadius: 10, marginBottom: 3, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--text-2)", position: "relative", transition: "all 0.15s" },
  navBtnActive: { background: "var(--surface-2)", color: "var(--text-1)" },
  navDot: { position: "absolute", right: 12, width: 5, height: 5, borderRadius: "50%", background: "var(--indigo)" },
  sidebarFooter: { marginTop: "auto" },
  footerCard: { background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: 14 },

  main: { flex: 1, padding: "36px 40px", maxWidth: 1100 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: 700, color: "var(--indigo)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  pageTitle: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 },
  pageSub: { color: "var(--text-2)", marginTop: 6, fontSize: 14.5 },

  dashGrid: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, marginBottom: 20 },
  ringCard: { background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: 18, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  statColumn: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statCardRow: { background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: 16, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },

  card: { background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: 18, padding: 22 },
  cardHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardHeading: { fontSize: 15.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans'" },

  recentRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--border-soft)" },
  jobRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 4px", borderBottom: "1px solid var(--border-soft)" },

  linkBtn: { background: "none", border: "none", color: "var(--indigo)", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center" },

  toolbar: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "10px 14px", minWidth: 260, flex: 1, maxWidth: 360 },
  searchInput: { background: "transparent", border: "none", outline: "none", color: "var(--text-1)", fontSize: 14, width: "100%" },
  filterChip: { padding: "9px 15px", border: "1px solid var(--border-soft)", background: "var(--surface-1)", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-2)", transition: "all 0.15s" },
  filterChipActive: { background: "var(--indigo-soft)", borderColor: "#6366f155", color: "#a5b4fc" },

  miniStat: { background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: 16, padding: "18px 20px" },
  tooltip: { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13 },

  iconBtn: { width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-soft)", background: "var(--surface-2)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", background: "var(--indigo)", color: "#fff", border: "none", borderRadius: 11, cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px #6366f140" },
  btnGhost: { padding: "11px 18px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border-soft)", borderRadius: 11, cursor: "pointer", fontWeight: 600, fontSize: 14 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(5,8,15,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" },
  modal: { background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 20, width: 480, maxHeight: "88vh", overflowY: "auto", animation: "scaleIn 0.2s ease" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-soft)" },
  closeBtn: { width: 28, height: 28, borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--text-2)", cursor: "pointer", fontSize: 13 },

  label: { display: "block", color: "var(--text-2)", fontSize: 12.5, fontWeight: 600 },
  input: { width: "100%", padding: "10px 13px", background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: 10, color: "var(--text-1)", fontSize: 14, outline: "none" },
  statusOption: { padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-soft)", background: "var(--bg)", color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
};
