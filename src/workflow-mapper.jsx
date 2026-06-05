import { useState } from "react";
import logo from './logo.jpeg';

const ACCENT = "#00FF87";
const BG = "#0A0A0F";
const CARD = "#111118";
const BORDER = "#1E1E2E";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";

const Badge = ({ children, color = ACCENT }) => (
  <span style={{
    background: color + "18",
    color: color,
    border: `1px solid ${color}44`,
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    letterSpacing: "0.05em"
  }}>{children}</span>
);

const RankBadge = ({ rank }) => {
  const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#8B8BFF", "#FF6B9D"];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: colors[rank - 1] + "22",
      border: `2px solid ${colors[rank - 1]}88`,
      color: colors[rank - 1],
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700, fontSize: 14, flexShrink: 0
    }}>#{rank}</div>
  );
};

const BarMeter = ({ value, max, color = ACCENT, label }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 12, color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#1E1E2E", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: 3, transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
        }} />
      </div>
    </div>
  );
};

const WorkflowCard = ({ workflow, index, visible }) => {
  const [expanded, setExpanded] = useState(false);
  const delay = index * 120;

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
      cursor: "pointer",
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <RankBadge rank={workflow.rank} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {workflow.title}
            </span>
            <Badge>{workflow.category}</Badge>
          </div>
          <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>{workflow.description}</p>
        </div>
        <div style={{ color: MUTED, fontSize: 18, transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>▾</div>
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
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: ACCENT + "20",
                    border: `1px solid ${ACCENT}44`, color: ACCENT, fontSize: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, flexShrink: 0, marginTop: 1
                  }}>{i + 1}</div>
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
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: "50%", background: ACCENT,
        animation: `bounce 1.2s ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
  </div>
);

export default function WorkflowMapper() {
  const [niche, setNiche] = useState("");
  const [workflows, setWorkflows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState(null);

  const analyze = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setWorkflows(null);
    setSummary(null);
    setError("");
    setVisible(false);

    const prompt = `You are an automation strategist specializing in n8n + AI workflows.

A "${niche}" business wants to automate their top 5 manual daily workflows using n8n and AI.

Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "summary": {
    "totalHoursSaved": <number per week>,
    "totalMonthlySavings": <number in USD>,
    "topWin": "<one sentence biggest win>"
  },
  "workflows": [
    {
      "rank": 1,
      "title": "<workflow name>",
      "category": "<short tag like 'Sales' or 'Ops'>",
      "description": "<one sentence what this workflow does>",
      "hoursSaved": <number per week, realistic 2-35>,
      "costSaved": <monthly USD saved, realistic 200-4000>,
      "roi": <score 1-100>,
      "trigger": "<what triggers the n8n workflow>",
      "claudeRole": "<what AI specifically does in this workflow>",
      "steps": [
        "<step 1>",
        "<step 2>",
        "<step 3>",
        "<step 4>"
      ]
    }
  ]
}

Requirements:
- Rank by (hoursSaved * 0.6 + roi * 0.4) descending
- Be specific to the "${niche}" industry
- Make steps concrete and technical (mention real tools, APIs, integrations)
- AI role should be specific: classify, generate, extract, summarize, score, etc.
- Return exactly 5 workflows`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setSummary(parsed.summary);
      setWorkflows(parsed.workflows);
      setTimeout(() => setVisible(true), 50);
    } catch (e) {
      setError("Failed to analyze workflows. Please try again.");
    } finally {
      setLoading(false);
    }
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
        .glow-btn:active { transform: translateY(0); }
        .glow-btn { transition: all 0.2s; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ── HEADER with logo ── */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img
            src={logo}
            alt="Assyrian AI Logo"
            style={{
              width: 96, height: 96, borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #FFD70055",
              boxShadow: "0 0 24px #FFD70022",
              marginBottom: 16
            }}
          />
          <h1 style={{
            fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, margin: "0 0 6px",
            background: "linear-gradient(135deg, #E2E8F0 0%, #00FF87 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.1
          }}>Assyrian AI Automation</h1>
          <p style={{ color: MUTED, fontSize: 15, margin: "0 0 10px" }}>
            Discover the top 5 workflows your business runs manually — and what AI can save you
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: ACCENT + "12", border: `1px solid ${ACCENT}30`,
            borderRadius: 20, padding: "4px 14px"
          }}>
            <span style={{ color: ACCENT, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>n8n × AI Automation</span>
          </div>
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          <input
            value={niche}
            onChange={e => setNiche(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && analyze()}
            placeholder="e.g. dental clinic, SaaS startup, real estate agency…"
            style={{
              flex: 1, minWidth: 220,
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "14px 18px",
              color: TEXT, fontSize: 15,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "border-color 0.2s"
            }}
          />
          <button
            className="glow-btn"
            onClick={analyze}
            disabled={loading || !niche.trim()}
            style={{
              background: loading || !niche.trim() ? "#1a1a2a" : ACCENT,
              color: loading || !niche.trim() ? MUTED : "#0A0A0F",
              border: "none", borderRadius: 10,
              padding: "14px 24px", fontWeight: 700, fontSize: 15,
              cursor: loading || !niche.trim() ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: "nowrap"
            }}>
            {loading ? "Analyzing…" : "Map Workflows →"}
          </button>
        </div>

        {/* Quick chips */}
        {!workflows && !loading && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {["Law firm", "E-commerce store", "Marketing agency", "Medical clinic", "Accounting firm", "Recruitment agency"].map(tag => (
              <button key={tag} onClick={() => setNiche(tag)}
                style={{
                  background: "transparent", border: `1px solid ${BORDER}`,
                  borderRadius: 20, padding: "6px 14px", color: MUTED,
                  fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.target.style.borderColor = ACCENT + "66"; e.target.style.color = TEXT; }}
                onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = MUTED; }}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading && <LoadingDots />}

        {error && (
          <div style={{ background: "#FF000018", border: "1px solid #FF000044", borderRadius: 10, padding: "14px 18px", color: "#FF6B6B", fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Summary bar */}
        {summary && (
          <div style={{
            background: ACCENT + "0D", border: `1px solid ${ACCENT}30`,
            borderRadius: 12, padding: "16px 20px", marginBottom: 24,
            opacity: visible ? 1 : 0, transition: "opacity 0.5s",
            display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16
          }}>
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
        )}

        {/* Workflow cards */}
        {workflows && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {workflows.map((w, i) => (
              <WorkflowCard key={i} workflow={w} index={i} visible={visible} />
            ))}
            <p style={{ textAlign: "center", color: MUTED, fontSize: 12, marginTop: 8 }}>
              Click any card to expand automation details
            </p>
          </div>
        )}

      </div>
    </div>
  );
}