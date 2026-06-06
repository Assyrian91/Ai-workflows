export default function PricingPage({ onBack }) {
  const ACCENT = "#00FF87";
  const BG = "#0A0A0F";
  const CARD = "#111118";
  const BORDER = "#1E1E2E";
  const TEXT = "#E2E8F0";
  const MUTED = "#64748B";

  const plans = [
    {
      name: "Starter",
      price: "1,500",
      period: "one-time",
      color: "#8B8BFF",
      tag: "Most Popular",
      description: "Perfect for small businesses ready to automate their first workflows.",
      includes: [
        "3 custom automations built in n8n",
        "AI integration (Groq / OpenAI)",
        "1 round of revisions",
        "Handover + documentation",
        "2 weeks post-launch support",
      ],
      notIncluded: [
        "Ongoing maintenance",
        "Monthly new workflows",
      ]
    },
    {
      name: "Growth",
      price: "3,500",
      period: "one-time",
      color: ACCENT,
      tag: "Best Value",
      description: "For businesses that want full automation coverage across their operations.",
      includes: [
        "5 custom automations built in n8n",
        "AI integration (Groq / OpenAI)",
        "CRM, email & API integrations",
        "2 rounds of revisions",
        "Handover + full documentation",
        "4 weeks post-launch support",
      ],
      notIncluded: []
    },
    {
      name: "Retainer",
      price: "800",
      period: "per month",
      color: "#FF6B9D",
      tag: "Ongoing",
      description: "Continuous automation support — we maintain, optimise and expand every month.",
      includes: [
        "1 new automation per month",
        "Monitoring & maintenance",
        "Priority support (24h response)",
        "Monthly performance report",
        "Snowflake analytics dashboard",
        "Unlimited small tweaks",
      ],
      notIncluded: []
    }
  ];

  const faqs = [
    { q: "What tools do you use?", a: "We build automations using n8n, integrated with AI models like Groq and OpenAI. We can also connect to your existing CRM, email, Slack, Google Workspace, and more." },
    { q: "How long does it take?", a: "Starter projects typically take 5–7 business days. Growth projects take 10–14 business days. We'll give you a clear timeline before we start." },
    { q: "Do I need any technical knowledge?", a: "None at all. We handle everything — build, test, and hand over. You just tell us what's taking too much time." },
    { q: "What if I'm not happy with the result?", a: "We include revision rounds in every package. We don't consider a project done until you're satisfied with how it works." },
    { q: "Can I upgrade from Starter to Retainer later?", a: "Absolutely. Most clients start with Starter or Growth, then move onto the Retainer once they see the results." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px #00000044; }
        .plan-card { transition: all 0.25s; }
        .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .cta-btn { transition: all 0.2s; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Back button */}
        <button onClick={onBack} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 16px", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 40 }}>← Back</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT+"12", border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ color: ACCENT, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Simple, transparent pricing</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, margin: "0 0 12px", background: "linear-gradient(135deg, #E2E8F0 0%, #00FF87 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Invest once. Save forever.
          </h1>
          <p style={{ color: MUTED, fontSize: 16, margin: 0, maxWidth: 520, marginInline: "auto" }}>
            Every package is built around your specific business. No templates, no shortcuts — just automations that actually work.
          </p>
        </div>

        {/* Pricing cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 64 }}>
          {plans.map((plan, i) => (
            <div key={i} className="plan-card" style={{
              background: CARD, border: `1px solid ${plan.color}44`,
              borderRadius: 16, padding: "28px 24px", position: "relative",
              boxShadow: i === 1 ? `0 0 40px ${ACCENT}18` : "none"
            }}>
              {/* Tag */}
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: i === 1 ? "#0A0A0F" : "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                {plan.tag}
              </div>

              {/* Plan name */}
              <div style={{ fontSize: 13, color: plan.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{plan.name}</div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>AUD $</span>
                <span style={{ fontSize: 40, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>/ {plan.period}</span>
              </div>

              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>{plan.description}</p>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>What's included</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.includes.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: ACCENT, fontSize: 14, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: MUTED, fontSize: 14, flexShrink: 0 }}>✕</span>
                      <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a href="mailto:contact@assyrianai.com" className="cta-btn" style={{
                display: "block", textAlign: "center", background: plan.color,
                color: i === 1 ? "#0A0A0F" : "#fff", borderRadius: 10,
                padding: "13px", fontWeight: 700, fontSize: 14,
                textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                Get Started →
              </a>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 64 }}>
          {[
            { icon: "🇦🇺", label: "Australia Based" },
            { icon: "⚡", label: "5–14 Day Delivery" },
            { icon: "🔒", label: "Secure & Private" },
            { icon: "♾️", label: "Revision Guarantee" },
          ].map((t, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 13, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 24px", color: TEXT }}>Common Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{faq.q}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ background: ACCENT+"0D", border: `1px solid ${ACCENT}30`, borderRadius: 16, padding: "32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: TEXT }}>Not sure which plan is right for you?</h2>
          <p style={{ color: MUTED, fontSize: 14, margin: "0 0 20px" }}>Book a free 30-minute call and we'll recommend the best fit for your business.</p>
          <a href="mailto:khoshabayalda91@gmail.com" className="cta-btn" style={{
            display: "inline-block", background: ACCENT, color: "#0A0A0F",
            borderRadius: 10, padding: "14px 32px", fontWeight: 700,
            fontSize: 15, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Book a Free Call →
          </a>
        </div>

      </div>
    </div>
  );
}