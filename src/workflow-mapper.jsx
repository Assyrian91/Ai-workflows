import { useState, useRef, useEffect } from "react";
import logo from './logo.jpeg';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import emailjs from "@emailjs/browser";
import { Redis } from "@upstash/redis";

const ACCENT = "#00FF87";
const BG = "#0A0A0F";
const CARD = "#111118";
const BORDER = "#1E1E2E";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";

const EJS_SERVICE        = import.meta.env.VITE_EJS_SERVICE;
const EJS_TEMPLATE       = import.meta.env.VITE_EJS_TEMPLATE;
const EJS_LOGIN_TEMPLATE = import.meta.env.VITE_EJS_LOGIN_TEMPLATE;
const EJS_KEY            = import.meta.env.VITE_EJS_KEY;
const ACCESS_PASSWORD    = import.meta.env.VITE_PASSWORD;
const ADMIN_PASSWORD     = "admin_" + import.meta.env.VITE_PASSWORD;

const SF_ACCOUNT  = import.meta.env.VITE_SNOWFLAKE_ACCOUNT;
const SF_USER     = import.meta.env.VITE_SNOWFLAKE_USERNAME;
const SF_PASSWORD = import.meta.env.VITE_SNOWFLAKE_PASSWORD;

const redis = new Redis({
  url: import.meta.env.VITE_KV_REST_API_URL,
  token: import.meta.env.VITE_KV_REST_API_TOKEN,
});

// ── Snowflake helpers ────────────────────────────────────────
async function getSnowflakeToken() {
  const res = await fetch(`https://${SF_ACCOUNT}.snowflakecomputing.com/session/v1/login-request?requestId=1&request_guid=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      data: {
        CLIENT_APP_ID: "JavaScript",
        CLIENT_APP_VERSION: "1.0",
        SVN_REVISION: "1",
        ACCOUNT_NAME: SF_ACCOUNT,
        LOGIN_NAME: SF_USER,
        PASSWORD: SF_PASSWORD,
      }
    })
  });
  const data = await res.json();
  return data?.data?.token;
}

async function insertToSnowflake(niche, visitorName, hoursSaved, savings, topWin) {
  try {
    const token = await getSnowflakeToken();
    if (!token) return;
    const sql = `INSERT INTO ASSYRIAN_AI.AUTOMATION.WORKFLOW_SEARCHES (NICHE, VISITOR_NAME, HOURS_SAVED, MONTHLY_SAVINGS, TOP_WIN) VALUES ('${niche.replace(/'/g,"\\'")}', '${visitorName.replace(/'/g,"\\'")}', ${hoursSaved}, ${savings}, '${topWin.replace(/'/g,"\\'")}')`;
    await fetch(`https://${SF_ACCOUNT}.snowflakecomputing.com/api/v2/statements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Snowflake Token="${token}"`,
        "X-Snowflake-Authorization-Token-Type": "OAUTH"
      },
      body: JSON.stringify({
        statement: sql,
        timeout: 60,
        database: "ASSYRIAN_AI",
        schema: "AUTOMATION",
        warehouse: "COMPUTE_WH"
      })
    });
  } catch { /* silent — don't block app if Snowflake fails */ }
}

// ── Analytics helpers ────────────────────────────────────────
async function trackSearch(niche, hoursSaved, savings) {
  try {
    await redis.incr("total_searches");
    await redis.incrbyfloat("total_hours", hoursSaved);
    await redis.incrbyfloat("total_savings", savings);
    await redis.zincrby("top_niches", 1, niche.toLowerCase().trim());
    await redis.lpush("recent_searches", JSON.stringify({
      niche, hoursSaved, savings, time: new Date().toISOString()
    }));
    await redis.ltrim("recent_searches", 0, 49);
  } catch { /* silent */ }
}

async function fetchAnalytics() {
  const [searches, hours, savings, niches, recent] = await Promise.all([
    redis.get("total_searches"),
    redis.get("total_hours"),
    redis.get("total_savings"),
    redis.zrange("top_niches", 0, 9, { rev: true, withScores: true }),
    redis.lrange("recent_searches", 0, 9)
  ]);
  return {
    searches: searches || 0,
    hours: Math.round(hours || 0),
    savings: Math.round(savings || 0),
    niches: niches || [],
    recent: (recent || []).map(r => typeof r === "string" ? JSON.parse(r) : r)
  };
}

// ── Login Gate ───────────────────────────────────────────────
function LoginGate({ onSuccess }) {
  const [name, setName]       = useState("");
  const [pass, setPass]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (pass !== ACCESS_PASSWORD && pass !== ADMIN_PASSWORD) { setError("Incorrect password. Try again."); return; }
    setLoading(true);
    try {
      await emailjs.send(EJS_SERVICE, EJS_LOGIN_TEMPLATE, {
        visitor_name: name.trim(),
        login_time: new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })
      }, EJS_KEY);
    } catch { /* silent */ }
    setLoading(false);
    onSuccess(name.trim(), pass === ADMIN_PASSWORD);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #2D2D42; }
        input:focus { outline: none; border-color: #00FF87 !important; }
        .login-btn:hover { box-shadow: 0 0 24px #00FF8755; transform: translateY(-1px); }
        .login-btn { transition: all 0.2s; }
      `}</style>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 0 60px #00FF8708" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={logo} alt="Assyrian AI" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid #FFD70055", boxShadow: "0 0 20px #FFD70018", marginBottom: 14 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", background: "linear-gradient(135deg, #E2E8F0 0%, #00FF87 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Assyrian AI Automation</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Enter your details to access the app</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={name} onChange={e => { setName(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && !loading && handleLogin()}
            placeholder="Your name"
            style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 16px", color: TEXT, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color 0.2s" }} />
          <input value={pass} onChange={e => { setPass(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && !loading && handleLogin()}
            placeholder="Password" type="password"
            style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 16px", color: TEXT, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color 0.2s" }} />
          {error && <div style={{ background: "#FF000018", border: "1px solid #FF000044", borderRadius: 8, padding: "10px 14px", color: "#FF6B6B", fontSize: 13 }}>{error}</div>}
          <button className="login-btn" onClick={handleLogin} disabled={loading}
            style={{ background: loading ? "#1a1a2a" : ACCENT, color: loading ? MUTED : "#0A0A0F", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4 }}>
            {loading ? "Verifying…" : "Access App →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Dashboard ──────────────────────────────────────
function AnalyticsDashboard({ onBack }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const topNiches = [];
  if (data?.niches) {
    for (let i = 0; i < data.niches.length; i += 2)
      topNiches.push({ name: data.niches[i], count: data.niches[i+1] });
  }
  const maxCount = topNiches[0]?.count || 1;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap'); *{box-sizing:border-box;}`}</style>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <button onClick={onBack} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 16px", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>← Back</button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #E2E8F0 0%, #00FF87 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analytics Dashboard</h1>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Live usage stats · Upstash + ❄️ Snowflake</p>
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", color: MUTED, padding: "60px 0" }}>Loading analytics…</div>}

        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "TOTAL SEARCHES", value: data.searches, color: ACCENT },
                { label: "HOURS FREED", value: `${data.hours}h`, color: "#8B8BFF" },
                { label: "SAVINGS CALCULATED", value: `$${data.savings.toLocaleString()}`, color: "#FF6B9D" }
              ].map(s => (
                <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: "0.08em" }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Snowflake badge */}
            <div style={{ background: "#1a2744", border: "1px solid #29B5E844", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>❄️</span>
              <div>
                <div style={{ fontSize: 13, color: "#29B5E8", fontWeight: 700 }}>Snowflake Connected</div>
                <div style={{ fontSize: 12, color: MUTED }}>Every search is saved to ASSYRIAN_AI.AUTOMATION.WORKFLOW_SEARCHES</div>
              </div>
            </div>

            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>🔥 Top Searched Niches</div>
              {topNiches.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No searches yet.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topNiches.map((n, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 20, fontSize: 12, color: MUTED, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>#{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: TEXT, textTransform: "capitalize" }}>{n.name}</span>
                        <span style={{ fontSize: 12, color: ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>{n.count}x</span>
                      </div>
                      <div style={{ height: 6, background: "#1E1E2E", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(n.count/maxCount)*100}%`, background: ACCENT, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px" }}>
              <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>🕐 Recent Searches</div>
              {data.recent.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No searches yet.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.recent.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: BG, borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: TEXT, textTransform: "capitalize" }}>{r.niche}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>{r.hoursSaved}h saved</span>
                      <span style={{ fontSize: 11, color: "#8B8BFF", fontFamily: "'JetBrains Mono', monospace" }}>${r.savings?.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>{new Date(r.time).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────
const Badge = ({ children, color = ACCENT }) => (
  <span style={{ background: color+"18", color, border: `1px solid ${color}44`, borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.05em" }}>{children}</span>
);
const RankBadge = ({ rank }) => {
  const colors = ["#FFD700","#C0C0C0","#CD7F32","#8B8BFF","#FF6B9D"];
  return <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors[rank-1]+"22", border: `2px solid ${colors[rank-1]}88`, color: colors[rank-1], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>#{rank}</div>;
};
const BarMeter = ({ value, max, color = ACCENT, label }) => {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 12, color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#1E1E2E", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
};
const WorkflowCard = ({ workflow, index, visible }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(20px)", transition: `opacity 0.5s ${index*120}ms, transform 0.5s ${index*120}ms`, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
      <div style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <RankBadge rank={workflow.rank} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{workflow.title}</span>
            <Badge>{workflow.category}</Badge>
          </div>
          <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>{workflow.description}</p>
        </div>
        <div style={{ color: MUTED, fontSize: 18, transition: "transform 0.3s", transform: expanded?"rotate(180deg)":"rotate(0deg)", flexShrink: 0 }}>▾</div>
      </div>
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 16 }}>
        <BarMeter value={workflow.hoursSaved} max={40} label="hrs/week saved" color={ACCENT} />
        <BarMeter value={workflow.costSaved} max={5000} label="$/month saved" color="#8B8BFF" />
        <BarMeter value={workflow.roi} max={100} label="ROI score" color="#FF6B9D" />
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 20px", background: "#0D0D16" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace" }}>N8N Trigger</div>
              <div style={{ fontSize: 13, color: TEXT }}>{workflow.trigger}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace" }}>AI Role</div>
              <div style={{ fontSize: 13, color: TEXT }}>{workflow.claudeRole}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace" }}>Automation Steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {workflow.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: ACCENT+"20", border: `1px solid ${ACCENT}44`, color: ACCENT, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                  <span style={{ fontSize: 13, color: "#A0AEC0", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const LoadingDots = () => (
  <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
    {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
    <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
  </div>
);

// ── Main App ─────────────────────────────────────────────────
export default function WorkflowMapper() {
  const [authed, setAuthed]       = useState(false);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [showDash, setShowDash]   = useState(false);
  const [visitor, setVisitor]     = useState("");
  const [niche, setNiche]         = useState("");
  const [workflows, setWorkflows] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState("");
  const [visible, setVisible]     = useState(false);
  const [summary, setSummary]     = useState(null);
  const [emailAddr, setEmailAddr] = useState("");
  const [sending, setSending]     = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const reportRef = useRef(null);

  if (!authed) return <LoginGate onSuccess={(name, admin) => { setVisitor(name); setIsAdmin(admin); setAuthed(true); }} />;
  if (showDash) return <AnalyticsDashboard onBack={() => setShowDash(false)} />;

  const analyze = async () => {
    if (!niche.trim()) return;
    setLoading(true); setWorkflows(null); setSummary(null); setError(""); setVisible(false); setEmailStatus("");
    const prompt = `You are an automation strategist specializing in n8n + AI workflows.
A "${niche}" business wants to automate their top 5 manual daily workflows using n8n and AI.
Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{"summary":{"totalHoursSaved":<number>,"totalMonthlySavings":<number>,"topWin":"<string>"},"workflows":[{"rank":1,"title":"<string>","category":"<string>","description":"<string>","hoursSaved":<number>,"costSaved":<number>,"roi":<number>,"trigger":"<string>","claudeRole":"<string>","steps":["<string>","<string>","<string>","<string>"]}]}
CRITICAL: Return ONLY the raw JSON object. No markdown, no backticks, no explanation before or after. Start your response with { and end with }. Rank by (hoursSaved*0.6+roi*0.4) desc, be specific to "${niche}", use concrete technical steps, return exactly 5 workflows.`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      const match = raw.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      const parsed = JSON.parse(match[0]);
      setSummary(parsed.summary); setWorkflows(parsed.workflows);
      setTimeout(() => setVisible(true), 50);
      // Track in both Upstash and Snowflake
      await Promise.all([
        trackSearch(niche, parsed.summary.totalHoursSaved, parsed.summary.totalMonthlySavings),
        insertToSnowflake(niche, visitor, parsed.summary.totalHoursSaved, parsed.summary.totalMonthlySavings, parsed.summary.topWin)
      ]);
    } catch { setError("Failed to analyze workflows. Please try again."); }
    finally { setLoading(false); }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: "#0A0A0F", scale: 2, useCORS: true, logging: false });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;
      while (y < imgH) { if (y > 0) pdf.addPage(); pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, -y, pageW, imgH); y += pageH; }
      pdf.save(`assyrian-ai-workflows-${niche.replace(/\s+/g,"-").toLowerCase()}.pdf`);
    } catch { alert("PDF export failed."); }
    finally { setExporting(false); }
  };

  const sendEmail = async () => {
    if (!emailAddr.trim()||!summary||!workflows) return;
    setSending(true); setEmailStatus("");
    try {
      const workflowsText = workflows.map(w => `#${w.rank} ${w.title} [${w.category}]\n${w.description}\n• Hours saved/week: ${w.hoursSaved}h\n• Monthly savings: $${w.costSaved}\n• ROI score: ${w.roi}/100\n• Trigger: ${w.trigger}\n• AI Role: ${w.claudeRole}\nSteps:\n${w.steps.map((s,i)=>`  ${i+1}. ${s}`).join("\n")}`).join("\n\n---\n\n");
      await emailjs.send(EJS_SERVICE, EJS_TEMPLATE, { to_email: emailAddr, niche, hours: summary.totalHoursSaved, savings: summary.totalMonthlySavings.toLocaleString(), top_win: summary.topWin, workflows: workflowsText }, EJS_KEY);
      setEmailStatus("sent"); setEmailAddr("");
    } catch { setEmailStatus("error"); }
    finally { setSending(false); }
  };

  const totalHours = summary?.totalHoursSaved ?? 0;
  const totalSavings = summary?.totalMonthlySavings ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #2D2D42; }
        input:focus { outline: none; border-color: #00FF87 !important; }
        .glow-btn:hover { box-shadow: 0 0 24px #00FF8755 !important; transform: translateY(-1px); }
        .glow-btn { transition: all 0.2s; }
        .pdf-btn:hover { box-shadow: 0 0 24px #8B8BFF55 !important; transform: translateY(-1px); }
        .pdf-btn { transition: all 0.2s; }
        .email-btn:hover { box-shadow: 0 0 24px #FF6B9D55 !important; transform: translateY(-1px); }
        .email-btn { transition: all 0.2s; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40, position: "relative" }}>
          {isAdmin && (
            <button onClick={() => setShowDash(true)}
              style={{ position: "absolute", right: 0, top: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 14px", color: ACCENT, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              📊 Analytics
            </button>
          )}
          <img src={logo} alt="Assyrian AI Logo" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "2px solid #FFD70055", boxShadow: "0 0 24px #FFD70022", marginBottom: 16 }} />
          <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, margin: "0 0 6px", background: "linear-gradient(135deg, #E2E8F0 0%, #00FF87 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>Assyrian AI Automation</h1>
          <p style={{ color: MUTED, fontSize: 15, margin: "0 0 10px" }}>
            Welcome, <span style={{ color: ACCENT, fontWeight: 700 }}>{visitor}</span> — discover what AI can automate for your business
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT+"12", border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: "4px 14px" }}>
            <span style={{ color: ACCENT, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>n8n × AI Automation</span>
          </div>
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          <input value={niche} onChange={e => setNiche(e.target.value)} onKeyDown={e => e.key==="Enter"&&!loading&&analyze()}
            placeholder="e.g. dental clinic, SaaS startup, real estate agency…"
            style={{ flex: 1, minWidth: 220, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px", color: TEXT, fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color 0.2s" }} />
          <button className="glow-btn" onClick={analyze} disabled={loading||!niche.trim()}
            style={{ background: loading||!niche.trim()?"#1a1a2a":ACCENT, color: loading||!niche.trim()?MUTED:"#0A0A0F", border: "none", borderRadius: 10, padding: "14px 24px", fontWeight: 700, fontSize: 15, cursor: loading||!niche.trim()?"not-allowed":"pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
            {loading ? "Analyzing…" : "Map Workflows →"}
          </button>
        </div>

        {/* Quick chips */}
        {!workflows && !loading && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {["Law firm","E-commerce store","Marketing agency","Medical clinic","Accounting firm","Recruitment agency"].map(tag => (
              <button key={tag} onClick={() => setNiche(tag)}
                style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 14px", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { e.target.style.borderColor=ACCENT+"66"; e.target.style.color=TEXT; }}
                onMouseLeave={e => { e.target.style.borderColor=BORDER; e.target.style.color=MUTED; }}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading && <LoadingDots />}
        {error && <div style={{ background: "#FF000018", border: "1px solid #FF000044", borderRadius: 10, padding: "14px 18px", color: "#FF6B6B", fontSize: 14, marginBottom: 24 }}>{error}</div>}

        {/* Report */}
        {summary && (
          <div ref={reportRef}>
            <div style={{ background: ACCENT+"0D", border: `1px solid ${ACCENT}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, opacity: visible?1:0, transition: "opacity 0.5s", display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>WEEKLY HOURS FREED</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: ACCENT }}>{totalHours}h</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>MONTHLY SAVINGS</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#8B8BFF" }}>${totalSavings.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>BIGGEST WIN</div>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{summary.topWin}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {workflows.map((w,i) => <WorkflowCard key={i} workflow={w} index={i} visible={visible} />)}
            </div>
            <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>Generated by Assyrian AI Automation</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {workflows && (
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <button className="pdf-btn" onClick={exportPDF} disabled={exporting}
                style={{ background: exporting?"#1a1a2a":"#8B8BFF", color: exporting?MUTED:"#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: exporting?"not-allowed":"pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {exporting ? "Exporting…" : "⬇ Download PDF Report"}
              </button>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px" }}>
              <div style={{ fontSize: 13, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>📧 Send Report by Email</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input value={emailAddr} onChange={e => { setEmailAddr(e.target.value); setEmailStatus(""); }} onKeyDown={e => e.key==="Enter"&&!sending&&sendEmail()}
                  placeholder="client@example.com" type="email"
                  style={{ flex: 1, minWidth: 200, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", color: TEXT, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color 0.2s" }} />
                <button className="email-btn" onClick={sendEmail} disabled={sending||!emailAddr.trim()}
                  style={{ background: sending||!emailAddr.trim()?"#1a1a2a":"#FF6B9D", color: sending||!emailAddr.trim()?MUTED:"#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: sending||!emailAddr.trim()?"not-allowed":"pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                  {sending ? "Sending…" : "Send Report ✉"}
                </button>
              </div>
              {emailStatus==="sent" && <div style={{ marginTop: 10, padding: "10px 14px", background: "#00FF8718", border: "1px solid #00FF8744", borderRadius: 8, color: ACCENT, fontSize: 13 }}>✅ Report sent successfully!</div>}
              {emailStatus==="error" && <div style={{ marginTop: 10, padding: "10px 14px", background: "#FF000018", border: "1px solid #FF000044", borderRadius: 8, color: "#FF6B6B", fontSize: 13 }}>❌ Failed to send. Please try again.</div>}
            </div>
            <p style={{ textAlign: "center", color: MUTED, fontSize: 12, margin: 0 }}>Click any card to expand automation details</p>
          </div>
        )}
      </div>
    </div>
  );
}