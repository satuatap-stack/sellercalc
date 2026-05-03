import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(2) + "%";

const DEFAULT_FEES = {
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 0 },
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 0 },
};

const SCENARIOS = [5, 10, 15];

function calcAfiliasi(hpp, hargaJual, komisiPct, fees, unit = 1) {
  const totalFeePct = (fees.komisi + fees.dinamis + fees.cashback) / 100;
  const totalFeeRp = hargaJual * totalFeePct + fees.pemrosesan;
  const komisiRp = (hargaJual * komisiPct) / 100;
  const profitPerUnit = hargaJual - hpp - totalFeeRp - komisiRp;
  const profitPct = (profitPerUnit / hargaJual) * 100;
  const totalKomisi = komisiRp * unit;
  const totalProfit = profitPerUnit * unit;
  const totalOmzet = hargaJual * unit;
  return { komisiRp, totalFeeRp, profitPerUnit, profitPct, totalKomisi, totalProfit, totalOmzet };
}

function badge(color) {
  return { background: color + "18", border: `1px solid ${color}44`, color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" };
}

function MarginBadge({ p }) {
  if (p >= 20) return <span style={badge("#22c55e")}>✓ Aman</span>;
  if (p >= 10) return <span style={badge("#f59e0b")}>⚡ Hati-hati</span>;
  if (p >= 0)  return <span style={badge("#ef4444")}>⚠️ Tipis</span>;
  return <span style={badge("#dc2626")}>✕ Rugi</span>;
}

let kreatorId = 0;
const newKreator = (name = "Kreator Baru", komisi = 10, unit = 100) => ({
  id: ++kreatorId, name, komisi, unit,
});

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [form, setForm] = useState({ hpp: 26000, hargaJual: 43000, komisi: 10, unit: 100 });
  const [kreators, setKreators] = useState([
    newKreator("Kreator A", 10, 150),
    newKreator("Kreator B", 15, 80),
  ]);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("kalkulator");

  const f = fees[platform];
  const set = (k, v) => setForm(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const result = useMemo(() => calcAfiliasi(form.hpp, form.hargaJual, form.komisi, f, form.unit), [form, f]);
  const scenarios = useMemo(() => SCENARIOS.map(s => ({ pct: s, ...calcAfiliasi(form.hpp, form.hargaJual, s, f, form.unit) })), [form, f]);

  // Maks komisi yang masih profit (profitPerUnit >= 0)
  const maxKomisi = useMemo(() => {
    for (let k = 99; k >= 0; k--) {
      const r = calcAfiliasi(form.hpp, form.hargaJual, k, f, 1);
      if (r.profitPerUnit >= 0) return k;
    }
    return 0;
  }, [form, f]);

  const addKreator = () => {
    const k = newKreator();
    setKreators(p => [...p, k]);
    setEditId(k.id);
  };

  const updateKreator = (id, key, val) => setKreators(p => p.map(k => k.id === id ? { ...k, [key]: key === "name" ? val : parseFloat(val) || 0 } : k));
  const removeKreator = (id) => setKreators(p => p.filter(k => k.id !== id));

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
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #f5a623; cursor: pointer; border: 2px solid #0d0d0f; }
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
        .kreator-card { background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px; margin-bottom: 10px; transition: border-color 0.2s; }
        .kreator-card:hover { border-color: rgba(245,166,35,0.3); }
        .sc-card { flex: 1; background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px; transition: all 0.2s; }
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
              {["shopee", "tiktok"].map(p => (
                <div key={p}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p === "shopee" ? "#ee4d2d" : "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    {p === "shopee" ? "🛍 Shopee" : "🎵 TikTok Shop"}
                  </div>
                  {[["komisi","Komisi Platform","%"],["dinamis","Komisi Dinamis","%"],["cashback","Cashback Bonus","%"],["pemrosesan","Biaya Pemrosesan","Rp"]].map(([k, lbl, u]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "#6b6a78", flex: 1 }}>{lbl}</span>
                      <input type="number" step="0.01" value={fees[p][k]}
                        onChange={e => setFees(prev => ({ ...prev, [p]: { ...prev[p], [k]: parseFloat(e.target.value) || 0 } }))}
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
        <button className={`tab-btn ${activeTab === "kalkulator" ? "active" : ""}`} onClick={() => setActiveTab("kalkulator")}>Kalkulator</button>
        <button className={`tab-btn ${activeTab === "kreator" ? "active" : ""}`} onClick={() => setActiveTab("kreator")}>Kreator Tracker</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* ===== TAB KALKULATOR ===== */}
        {activeTab === "kalkulator" && (
          <div className="animate">

            {/* Platform */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              <button className={`platform-btn ${platform === "shopee" ? "shopee" : "off"}`} onClick={() => setPlatform("shopee")}>🛍 Shopee</button>
              <button className={`platform-btn ${platform === "tiktok" ? "tiktok" : "off"}`} onClick={() => setPlatform("tiktok")}>🎵 TikTok Shop</button>
            </div>

            {/* Input Produk */}
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Input Produk</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["hpp","HPP (Harga Pokok)","Rp"],["hargaJual","Harga Jual","Rp"]].map(([k, lbl, u]) => (
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

            {/* Pengaturan Komisi */}
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Pengaturan Komisi Kreator</div>

              <label style={label}>Komisi Kreator — {form.komisi}%</label>
              <input type="range" min={0} max={50} step={0.5}
                value={form.komisi} onChange={e => set("komisi", e.target.value)}
                style={{ accentColor: "#f5a623", background: `linear-gradient(to right, #f5a623 ${form.komisi/50*100}%, #2a2a32 ${form.komisi/50*100}%)`, marginBottom: 4 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a78", marginBottom: 14 }}>
                <span>0%</span>
                <span style={{ color: "#f5a623", fontWeight: 700 }}>{form.komisi}% = {fmt(result.komisiRp)}/unit</span>
                <span>50%</span>
              </div>

              {/* Quick pick komisi */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {[3, 5, 8, 10, 15, 20].map(v => (
                  <button key={v} onClick={() => set("komisi", v)}
                    style={{ background: form.komisi === v ? "rgba(245,166,35,0.2)" : "transparent", border: `1px solid ${form.komisi === v ? "#f5a623" : "#2a2a32"}`, borderRadius: 6, padding: "5px 12px", color: form.komisi === v ? "#f5a623" : "#6b6a78", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, transition: "all 0.15s" }}>
                    {v}%
                  </button>
                ))}
              </div>

              <label style={label}>Estimasi Unit Terjual dari Kreator</label>
              <input type="number" style={inputStyle} value={form.unit} onChange={e => set("unit", e.target.value)} />

              {/* Maks komisi info */}
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>💡 Maksimum Komisi yang Masih Profit</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f5a623" }}>{maxKomisi}%</div>
                </div>
                <div style={{ fontSize: 12, color: "#6b6a78", textAlign: "right", maxWidth: 160 }}>
                  Di atas {maxKomisi}% seller mulai rugi per unit
                </div>
              </div>
            </div>

            {/* Hasil Kalkulasi */}
            <div style={{ ...card, borderColor: result.profitPerUnit >= 0 ? (result.profitPct >= 20 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)") : "rgba(220,38,38,0.4)" }} className="animate">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hasil Kalkulasi</div>
                <MarginBadge p={result.profitPct} />
              </div>

              <div style={rowStyle}><span style={{ color: "#aaa" }}>Harga Jual</span><span style={{ fontWeight: 600 }}>{fmt(form.hargaJual)}</span></div>
              <div style={rowStyle}><span style={{ color: "#aaa" }}>HPP</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(form.hpp)}</span></div>

              {/* Fee Breakdown */}
              <div style={{ padding: "9px 0", borderBottom: "1px solid #1e1e23" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowBreakdown(!showBreakdown)}>
                  <span style={{ fontSize: 13, color: "#aaa" }}>Fee Marketplace</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(result.totalFeeRp)}</span>
                    <span style={{ fontSize: 10, color: "#6b6a78" }}>{showBreakdown ? "▲" : "▼"} rincian</span>
                  </div>
                </div>
                {showBreakdown && (
                  <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #2a2a32" }} className="animate">
                    {[
                      [`Komisi Platform (${f.komisi}%)`, (form.hargaJual * f.komisi) / 100],
                      [`Komisi Dinamis (${f.dinamis}%)`, (form.hargaJual * f.dinamis) / 100],
                      [`Cashback Bonus (${f.cashback}%)`, (form.hargaJual * f.cashback) / 100],
                      [`Biaya Pemrosesan`, f.pemrosesan],
                    ].map(([lbl, val]) => (
                      <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                        <span style={{ color: "#6b6a78" }}>{lbl}</span>
                        <span style={{ color: "#ef4444" }}>-{fmt(val)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 2px", fontSize: 12, borderTop: "1px dashed #2a2a32", marginTop: 4 }}>
                      <span style={{ color: "#aaa", fontWeight: 600 }}>Total</span>
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>-{fmt(result.totalFeeRp)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={rowStyle}>
                <span style={{ color: "#aaa" }}>Komisi Kreator ({form.komisi}%)</span>
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>-{fmt(result.komisiRp)}</span>
              </div>

              {/* Profit per unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div style={{ background: result.profitPerUnit >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${result.profitPerUnit >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profit per Unit</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: result.profitPerUnit >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(result.profitPerUnit)}</div>
                  <div style={{ fontSize: 11, color: result.profitPerUnit >= 0 ? "#22c55e" : "#ef4444", marginTop: 2 }}>{pct(result.profitPct)} margin</div>
                </div>
                <div style={{ background: "#111115", border: "1px solid #2a2a32", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total Komisi Kreator</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#f59e0b" }}>{fmt(result.totalKomisi)}</div>
                  <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 2 }}>{form.unit} unit × {fmt(result.komisiRp)}</div>
                </div>
              </div>

              {/* Total profit */}
              <div style={{ marginTop: 10, padding: "14px 16px", background: result.totalProfit >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${result.totalProfit >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total Profit Seller ({form.unit} unit)</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: result.totalProfit >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(result.totalProfit)}</div>
                <div style={{ fontSize: 12, color: "#6b6a78", marginTop: 4 }}>Omzet {fmt(result.totalOmzet)} · Komisi kreator {fmt(result.totalKomisi)}</div>
              </div>
            </div>

            {/* Perbandingan Skenario */}
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Perbandingan Skenario Komisi</div>
              <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 14 }}>Dampak komisi 5%, 10%, 15% ke profit seller.</div>
              <div style={{ display: "flex", gap: 10 }}>
                {scenarios.map(s => {
                  const clr = s.profitPct >= 20 ? "#22c55e" : s.profitPct >= 10 ? "#f59e0b" : s.profitPct >= 0 ? "#ef4444" : "#dc2626";
                  return (
                    <div key={s.pct} className="sc-card" style={{ border: `1px solid ${form.komisi === s.pct ? "rgba(245,166,35,0.5)" : "#2a2a32"}`, cursor: "pointer" }}
                      onClick={() => set("komisi", s.pct)}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#f5a623", marginBottom: 4 }}>{s.pct}%</div>
                      <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 2 }}>Komisi/unit: {fmt(s.komisiRp)}</div>
                      <div style={{ width: "100%", height: 1, background: "#2a2a32", margin: "8px 0" }} />
                      <div style={{ fontSize: 10, color: "#6b6a78" }}>Profit/unit</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: clr }}>{fmt(s.profitPerUnit)}</div>
                      <div style={{ fontSize: 11, color: clr, marginTop: 2 }}>{pct(s.profitPct)}</div>
                      <div style={{ marginTop: 8 }}><MarginBadge p={s.profitPct} /></div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 10, textAlign: "center" }}>Klik kartu untuk apply komisi</div>
            </div>
          </div>
        )}

        {/* ===== TAB KREATOR TRACKER ===== */}
        {activeTab === "kreator" && (
          <div className="animate">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6b6a78" }}>{kreators.length} kreator terdaftar</div>
              <button onClick={addKreator} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "7px 16px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                + Tambah Kreator
              </button>
            </div>

            {kreators.map(k => {
              const kr = calcAfiliasi(form.hpp, form.hargaJual, k.komisi, f, k.unit);
              const isEdit = editId === k.id;
              const clr = kr.profitPct >= 20 ? "#22c55e" : kr.profitPct >= 10 ? "#f59e0b" : kr.profitPct >= 0 ? "#ef4444" : "#dc2626";

              return (
                <div key={k.id} className="kreator-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    {isEdit ? (
                      <input type="text" value={k.name} onChange={e => updateKreator(k.id, "name", e.target.value)}
                        style={{ background: "transparent", border: "none", color: "#f0eff4", fontSize: 14, fontWeight: 600, outline: "none", flex: 1 }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>🎬 {k.name}</span>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditId(isEdit ? null : k.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 13 }}>{isEdit ? "✓ Simpan" : "✏️"}</button>
                      <button onClick={() => removeKreator(k.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  </div>

                  {isEdit ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div>
                        <label style={{ ...label, fontSize: 9 }}>Komisi (%)</label>
                        <div style={{ position: "relative" }}>
                          <input type="number" step="0.5" style={{ ...inputStyleSm, paddingRight: 28 }} value={k.komisi} onChange={e => updateKreator(k.id, "komisi", e.target.value)} />
                          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#6b6a78" }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ ...label, fontSize: 9 }}>Estimasi Unit</label>
                        <input type="number" style={inputStyleSm} value={k.unit} onChange={e => updateKreator(k.id, "unit", e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Komisi</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f5a623" }}>{k.komisi}%</div>
                        <div style={{ fontSize: 11, color: "#6b6a78" }}>{fmt(kr.komisiRp)}/unit</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Estimasi Unit</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#4fc8a0" }}>{k.unit} unit</div>
                        <div style={{ fontSize: 11, color: "#6b6a78" }}>omzet {fmt(kr.totalOmzet)}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                    <div style={{ background: "#0d0d0f", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>Komisi Total</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#f59e0b" }}>{fmt(kr.totalKomisi)}</div>
                    </div>
                    <div style={{ background: "#0d0d0f", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>Profit/unit</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: clr }}>{fmt(kr.profitPerUnit)}</div>
                    </div>
                    <div style={{ background: "#0d0d0f", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>Total Profit</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: clr }}>{fmt(kr.totalProfit)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#6b6a78" }}>Margin: {pct(kr.profitPct)}</span>
                    <MarginBadge p={kr.profitPct} />
                  </div>
                </div>
              );
            })}

            {kreators.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 4 }}>Belum ada kreator</div>
                <div style={{ fontSize: 12 }}>Klik "+ Tambah Kreator" untuk mulai tracking</div>
              </div>
            )}

            {/* Ringkasan semua kreator */}
            {kreators.length > 1 && (
              <div style={{ ...card, marginTop: 8 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Ringkasan Semua Kreator</div>
                {(() => {
                  const totalUnit = kreators.reduce((s, k) => s + k.unit, 0);
                  const totalKomisi = kreators.reduce((s, k) => s + calcAfiliasi(form.hpp, form.hargaJual, k.komisi, f, k.unit).totalKomisi, 0);
                  const totalProfit = kreators.reduce((s, k) => s + calcAfiliasi(form.hpp, form.hargaJual, k.komisi, f, k.unit).totalProfit, 0);
                  const totalOmzet = kreators.reduce((s, k) => s + calcAfiliasi(form.hpp, form.hargaJual, k.komisi, f, k.unit).totalOmzet, 0);
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Total Unit", value: totalUnit + " unit", color: "#4fc8a0" },
                        { label: "Total Omzet", value: fmt(totalOmzet), color: "#f5a623" },
                        { label: "Total Komisi Kreator", value: fmt(totalKomisi), color: "#f59e0b" },
                        { label: "Total Profit Seller", value: fmt(totalProfit), color: totalProfit >= 0 ? "#22c55e" : "#ef4444" },
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
