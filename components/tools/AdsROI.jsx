import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"jt" : n >= 1000 ? (n/1000).toFixed(0)+"rb" : Math.round(n).toString();
const pct = (n) => n.toFixed(2) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

let campId = 0;
const newCampaign = (name="Campaign Baru", spend=0, omzet=0) => ({
  id: ++campId, name, spend, omzet, platform: "tiktok",
});

function calcAds(hpp, hargaJual, spend, omzet, fees) {
  if (omzet <= 0 || hargaJual <= 0) return null;
  const totalFeePct = (fees.komisi + fees.dinamis + fees.cashback + fees.affiliasi) / 100;
  const feePerUnit = hargaJual * totalFeePct + fees.pemrosesan;
  const unitsTerjual = omzet / hargaJual;
  const totalHPP = hpp * unitsTerjual;
  const totalFee = feePerUnit * unitsTerjual;
  const profitKotor = omzet - totalHPP - totalFee;
  const profitBersih = profitKotor - spend;
  const profitBersihPct = (profitBersih / omzet) * 100;
  const roas = spend > 0 ? omzet / spend : 0;
  const roasBep = profitKotor > 0 ? omzet / profitKotor : 0;
  const acos = spend > 0 ? (spend / omzet) * 100 : 0;
  const cpa = unitsTerjual > 0 ? spend / unitsTerjual : 0;
  return {
    unitsTerjual, totalHPP, totalFee, profitKotor,
    profitBersih, profitBersihPct, roas, roasBep, acos, cpa,
  };
}

function StatusBadge({ roas, roasBep }) {
  if (roasBep <= 0) return null;
  if (roas >= roasBep * 1.5) return <span style={badge("#22c55e")}>🚀 Sangat Profit</span>;
  if (roas >= roasBep) return <span style={badge("#4fc8a0")}>✓ Profit</span>;
  if (roas >= roasBep * 0.8) return <span style={badge("#f59e0b")}>⚡ Mendekati BEP</span>;
  return <span style={badge("#ef4444")}>✕ Rugi</span>;
}

function RekoBox({ roas, roasBep }) {
  if (roasBep <= 0) return null;
  const ratio = roas / roasBep;
  let icon, title, desc, color;
  if (ratio >= 1.5) { icon="🚀"; title="Naikkan Budget"; desc="Iklan sangat efisien. Tingkatkan spend untuk scale omzet."; color="#22c55e"; }
  else if (ratio >= 1.0) { icon="✅"; title="Pertahankan"; desc="Iklan profit. Pantau terus dan optimalkan creative secara berkala."; color="#4fc8a0"; }
  else if (ratio >= 0.8) { icon="⚠️"; title="Optimasi Segera"; desc="Hampir BEP. Coba ubah creative, audience, atau turunkan bid."; color="#f59e0b"; }
  else { icon="🛑"; title="Stop / Pause Iklan"; desc="ROAS di bawah BEP. Iklan sedang rugi. Evaluasi atau hentikan sementara."; color="#ef4444"; }
  return (
    <div style={{ background: color+"10", border: `1px solid ${color}33`, borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function badge(color) {
  return { background: color+"18", border: `1px solid ${color}44`, color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" };
}

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState("kalkulator"); // kalkulator | tracker
  const [form, setForm] = useState({ hpp: 26000, hargaJual: 43000, spend: 500000, omzet: 3000000 });
  const [campaigns, setCampaigns] = useState([
    { ...newCampaign("Campaign A", 500000, 3000000), platform: "tiktok" },
    { ...newCampaign("Campaign B", 300000, 1200000), platform: "shopee" },
  ]);
  const [editId, setEditId] = useState(null);

  const f = fees[platform];
  const set = (k, v) => setForm(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const result = useMemo(() => calcAds(form.hpp, form.hargaJual, form.spend, form.omzet, f), [form, f]);

  const feePerUnit = form.hargaJual * ((f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100) + f.pemrosesan;

  const addCampaign = () => {
    const c = newCampaign();
    setCampaigns(p => [...p, c]);
    setEditId(c.id);
  };

  const updateCamp = (id, key, val) => setCampaigns(p => p.map(c => c.id === id ? { ...c, [key]: key === "name" ? val : parseFloat(val) || 0 } : c));
  const removeCamp = (id) => setCampaigns(p => p.filter(c => c.id !== id));

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 8, padding: "10px 12px", color: "#000", fontWeight: 700, fontSize: 14, outline: "none" };
  const inputStyleSm = { ...inputStyle, fontSize: 13, padding: "7px 10px" };
  const label = { fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 6 };
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e1e23", fontSize: 13 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=text] { font-family: 'DM Sans', sans-serif; }
        .platform-btn { border: 1.5px solid #2a2a32; background: transparent; border-radius: 8px; padding: 8px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.18s; }
        .platform-btn.shopee { background: rgba(238,77,45,0.12); border-color: #ee4d2d; color: #ee4d2d; }
        .platform-btn.tiktok { background: rgba(255,255,255,0.07); border-color: #aaa; color: #f0eff4; }
        .platform-btn.off { color: #6b6a78; }
        .tab-btn { flex: 1; padding: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: none; background: transparent; transition: all 0.18s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #f5a623; border-bottom-color: #f5a623; }
        .tab-btn:not(.active) { color: #6b6a78; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .camp-card { background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px; margin-bottom: 10px; transition: border-color 0.2s; }
        .camp-card:hover { border-color: rgba(245,166,35,0.3); }
        .roas-bar { height: 6px; border-radius: 3px; background: #1e1e23; overflow: hidden; margin-top: 6px; }
        .roas-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "16px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <button onClick={() => setShowFee(!showFee)} style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "6px 14px", color: "#6b6a78", fontSize: 12, cursor: "pointer" }}>⚙️ Fee</button>
      </div>

      {/* Fee Setting */}
      {showFee && (
        <div style={{ background: "#111113", borderBottom: "1px solid #2a2a32", padding: "20px" }} className="animate">
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>⚙️ Fee Default</span>
              <button onClick={() => setFees({ ...DEFAULT_FEES })} style={{ fontSize: 11, color: "#f5a623", background: "none", border: "none", cursor: "pointer" }}>Reset</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {["shopee","tiktok"].map(p => (
                <div key={p}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p==="shopee"?"#ee4d2d":"#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{p==="shopee"?"🛍 Shopee":"🎵 TikTok Shop"}</div>
                  {[["komisi","Komisi Platform","%"],["dinamis","Komisi Dinamis","%"],["cashback","Cashback Bonus","%"],["pemrosesan","Biaya Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k,lbl,u]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "#6b6a78", flex: 1 }}>{lbl}</span>
                      <input type="number" step="0.01" value={fees[p][k]} onChange={e => setFees(prev => ({ ...prev, [p]: { ...prev[p], [k]: parseFloat(e.target.value)||0 } }))}
                        style={{ width: 72, background: "#0d0d0f", border: "1px solid #2a2a32", borderRadius: 6, padding: "4px 8px", color: "#fff", fontWeight: 600, fontSize: 13, textAlign: "right", outline: "none" }} />
                      <span style={{ fontSize: 11, color: "#6b6a78", width: 18 }}>{u}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e1e23", background: "#0d0d0f" }}>
        <button className={`tab-btn ${activeTab==="kalkulator"?"active":""}`} onClick={() => setActiveTab("kalkulator")}>Kalkulator</button>
        <button className={`tab-btn ${activeTab==="tracker"?"active":""}`} onClick={() => setActiveTab("tracker")}>Campaign Tracker</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* ===== TAB KALKULATOR ===== */}
        {activeTab === "kalkulator" && (
          <div className="animate">
            {/* Platform */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              <button className={`platform-btn ${platform==="shopee"?"shopee":"off"}`} onClick={() => setPlatform("shopee")}>🛍 Shopee Ads</button>
              <button className={`platform-btn ${platform==="tiktok"?"tiktok":"off"}`} onClick={() => setPlatform("tiktok")}>🎵 TikTok Ads</button>
            </div>

            {/* Input */}
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Input Produk & Iklan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["hpp","HPP (Harga Pokok)","Rp"],["hargaJual","Harga Jual","Rp"],["spend","Total Spend Iklan","Rp"],["omzet","Total Omzet dari Iklan","Rp"]].map(([k,lbl,u]) => (
                  <div key={k}>
                    <label style={label}>{lbl}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>{u}</span>
                      <input type="number" style={{ ...inputStyle, paddingLeft: 36 }} value={form[k]} onChange={e => set(k, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hasil */}
            {result && (
              <div style={{ ...card, borderColor: result.profitBersih >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.4)" }} className="animate">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hasil Kalkulasi</div>
                  <StatusBadge roas={result.roas} roasBep={result.roasBep} />
                </div>

                {/* ROAS Visual */}
                <div style={{ background: "#111115", border: "1px solid #2a2a32", borderRadius: 10, padding: "16px", marginBottom: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                    {[
                      { label: "ROAS BEP", value: result.roasBep.toFixed(2), color: "#ef4444" },
                      { label: "ROAS AKTUAL", value: result.roas.toFixed(2), color: result.roas >= result.roasBep ? "#22c55e" : "#ef4444" },
                      { label: "ACOS", value: pct(result.acos), color: result.acos < 20 ? "#22c55e" : result.acos < 40 ? "#f59e0b" : "#ef4444" },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: m.color, lineHeight: 1 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* ROAS progress bar */}
                  <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 4 }}>ROAS Aktual vs BEP</div>
                  <div className="roas-bar">
                    <div className="roas-fill" style={{
                      width: `${Math.min((result.roas / (result.roasBep * 2)) * 100, 100)}%`,
                      background: result.roas >= result.roasBep ? "#22c55e" : "#ef4444"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b6a78", marginTop: 3 }}>
                    <span>0</span>
                    <span style={{ color: "#ef4444" }}>BEP {result.roasBep.toFixed(1)}</span>
                    <span>{(result.roasBep * 2).toFixed(1)}</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div style={rowStyle}><span style={{ color: "#aaa" }}>Total Omzet dari Iklan</span><span style={{ fontWeight: 600 }}>{fmt(form.omzet)}</span></div>
                <div style={rowStyle}><span style={{ color: "#aaa" }}>Unit Terjual (estimasi)</span><span style={{ fontWeight: 600 }}>{result.unitsTerjual.toFixed(1)} unit</span></div>
                <div style={rowStyle}><span style={{ color: "#aaa" }}>Total HPP</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(result.totalHPP)}</span></div>

                {/* Fee breakdown */}
                <div style={{ padding: "9px 0", borderBottom: "1px solid #1e1e23" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowBreakdown(!showBreakdown)}>
                    <span style={{ fontSize: 13, color: "#aaa" }}>Total Fee Marketplace</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(result.totalFee)}</span>
                      <span style={{ fontSize: 10, color: "#6b6a78" }}>{showBreakdown ? "▲" : "▼"} rincian</span>
                    </div>
                  </div>
                  {showBreakdown && (
                    <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #2a2a32" }} className="animate">
                      {[
                        [`Komisi Platform (${f.komisi}%)`, (form.hargaJual * f.komisi / 100) * result.unitsTerjual],
                        [`Komisi Dinamis (${f.dinamis}%)`, (form.hargaJual * f.dinamis / 100) * result.unitsTerjual],
                        [`Cashback Bonus (${f.cashback}%)`, (form.hargaJual * f.cashback / 100) * result.unitsTerjual],
                        [`Biaya Pemrosesan`, f.pemrosesan * result.unitsTerjual],
                        [`Affiliasi (${f.affiliasi}%)`, (form.hargaJual * f.affiliasi / 100) * result.unitsTerjual],
                      ].map(([lbl, val]) => (
                        <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                          <span style={{ color: "#6b6a78" }}>{lbl}</span>
                          <span style={{ color: "#ef4444" }}>-{fmt(val)}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 2px", fontSize: 12, borderTop: "1px dashed #2a2a32", marginTop: 4 }}>
                        <span style={{ color: "#aaa", fontWeight: 600 }}>Total</span>
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>-{fmt(result.totalFee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={rowStyle}><span style={{ color: "#aaa" }}>Profit Kotor (sebelum iklan)</span><span style={{ color: "#f5a623", fontWeight: 600 }}>{fmt(result.profitKotor)}</span></div>
                <div style={rowStyle}><span style={{ color: "#aaa" }}>Spend Iklan</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(form.spend)}</span></div>
                <div style={rowStyle}><span style={{ color: "#aaa" }}>CPA (Cost per Acquisition)</span><span style={{ fontWeight: 600 }}>{fmt(result.cpa)}</span></div>

                {/* Profit bersih */}
                <div style={{ background: result.profitBersih >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${result.profitBersih >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profit Bersih Setelah Iklan</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: result.profitBersih >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(result.profitBersih)}</div>
                  <div style={{ fontSize: 12, color: result.profitBersih >= 0 ? "#22c55e" : "#ef4444", marginTop: 2 }}>{pct(result.profitBersihPct)} dari omzet</div>
                </div>

                <RekoBox roas={result.roas} roasBep={result.roasBep} />
              </div>
            )}
          </div>
        )}

        {/* ===== TAB TRACKER ===== */}
        {activeTab === "tracker" && (
          <div className="animate">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6b6a78" }}>{campaigns.length} campaign terdaftar</div>
              <button onClick={addCampaign} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "7px 16px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                + Tambah Campaign
              </button>
            </div>

            {campaigns.map(c => {
              const cf = fees[c.platform];
              const cr = calcAds(form.hpp, form.hargaJual, c.spend, c.omzet, cf);
              const isEdit = editId === c.id;
              const roasColor = cr ? (cr.roas >= cr.roasBep ? "#22c55e" : "#ef4444") : "#6b6a78";
              const barW = cr ? Math.min((cr.roas / (cr.roasBep * 2)) * 100, 100) : 0;

              return (
                <div key={c.id} className="camp-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    {isEdit ? (
                      <input type="text" value={c.name} onChange={e => updateCamp(c.id, "name", e.target.value)}
                        style={{ background: "transparent", border: "none", color: "#f0eff4", fontSize: 14, fontWeight: 600, outline: "none", flex: 1 }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                    )}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: c.platform === "shopee" ? "#ee4d2d" : "#aaa", background: c.platform === "shopee" ? "rgba(238,77,45,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${c.platform === "shopee" ? "rgba(238,77,45,0.3)" : "#2a2a32"}`, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        {c.platform === "shopee" ? "Shopee" : "TikTok"}
                      </span>
                      <button onClick={() => setEditId(isEdit ? null : c.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 13 }}>{isEdit ? "✓" : "✏️"}</button>
                      <button onClick={() => removeCamp(c.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  </div>

                  {isEdit ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      {[["spend","Spend Iklan"],["omzet","Omzet dari Iklan"]].map(([k,lbl]) => (
                        <div key={k}>
                          <label style={{ ...label, fontSize: 9 }}>{lbl}</label>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#6b6a78" }}>Rp</span>
                            <input type="number" style={{ ...inputStyleSm, paddingLeft: 28 }} value={c[k]} onChange={e => updateCamp(c.id, k, e.target.value)} />
                          </div>
                        </div>
                      ))}
                      <div>
                        <label style={{ ...label, fontSize: 9 }}>Platform</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["shopee","tiktok"].map(p => (
                            <button key={p} onClick={() => updateCamp(c.id, "platform", p)}
                              style={{ flex: 1, border: `1px solid ${c.platform===p ? (p==="shopee"?"#ee4d2d":"#aaa") : "#2a2a32"}`, background: c.platform===p ? (p==="shopee"?"rgba(238,77,45,0.1)":"rgba(255,255,255,0.06)") : "transparent", borderRadius: 6, padding: "6px", color: c.platform===p ? (p==="shopee"?"#ee4d2d":"#f0eff4") : "#6b6a78", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
                              {p==="shopee"?"🛍":"🎵"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Spend</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(c.spend)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Omzet</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(c.omzet)}</div>
                      </div>
                    </div>
                  )}

                  {cr && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div style={{ textAlign: "center", background: "#0d0d0f", borderRadius: 8, padding: "8px" }}>
                          <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>ROAS</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: roasColor }}>{cr.roas.toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: "center", background: "#0d0d0f", borderRadius: 8, padding: "8px" }}>
                          <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>ACOS</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: cr.acos < 20 ? "#22c55e" : cr.acos < 40 ? "#f59e0b" : "#ef4444" }}>{pct(cr.acos)}</div>
                        </div>
                        <div style={{ textAlign: "center", background: "#0d0d0f", borderRadius: 8, padding: "8px" }}>
                          <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>Profit</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: cr.profitBersih >= 0 ? "#22c55e" : "#ef4444" }}>{fmtK(cr.profitBersih)}</div>
                        </div>
                      </div>
                      <div className="roas-bar" style={{ marginTop: 10 }}>
                        <div className="roas-fill" style={{ width: `${barW}%`, background: roasColor }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b6a78", marginTop: 3 }}>
                        <span>BEP: {cr.roasBep.toFixed(1)}</span>
                        <StatusBadge roas={cr.roas} roasBep={cr.roasBep} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {campaigns.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 4 }}>Belum ada campaign</div>
                <div style={{ fontSize: 12 }}>Klik "+ Tambah Campaign" untuk mulai tracking</div>
              </div>
            )}

            {campaigns.length > 1 && (
              <div style={{ ...card, marginTop: 8 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Ringkasan Semua Campaign</div>
                {(() => {
                  const totalSpend = campaigns.reduce((s,c) => s + c.spend, 0);
                  const totalOmzet = campaigns.reduce((s,c) => s + c.omzet, 0);
                  const avgRoas = totalSpend > 0 ? totalOmzet / totalSpend : 0;
                  const totalProfit = campaigns.reduce((s,c) => {
                    const cr = calcAds(form.hpp, form.hargaJual, c.spend, c.omzet, fees[c.platform]);
                    return s + (cr ? cr.profitBersih : 0);
                  }, 0);
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Total Spend", value: fmt(totalSpend), color: "#ef4444" },
                        { label: "Total Omzet", value: fmt(totalOmzet), color: "#f5a623" },
                        { label: "Avg ROAS", value: avgRoas.toFixed(2), color: "#4fc8a0" },
                        { label: "Total Profit Bersih", value: fmt(totalProfit), color: totalProfit >= 0 ? "#22c55e" : "#ef4444" },
                      ].map(m => (
                        <div key={m.label} style={{ background: "#111115", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
