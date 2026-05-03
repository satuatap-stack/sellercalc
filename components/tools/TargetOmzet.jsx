import { useState, useMemo, useRef } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1) + "jt" : n >= 1000 ? (n/1000).toFixed(0) + "rb" : Math.round(n).toString();
const pct = (n) => n.toFixed(1) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

function calcUnit(targetProfit, hpp, hargaJual, fees, budgetIklan) {
  const totalFeePct = (fees.komisi + fees.dinamis + fees.cashback + fees.affiliasi) / 100;
  const iklanPct = budgetIklan / 100;
  const profitPerUnit = hargaJual * (1 - totalFeePct - iklanPct) - fees.pemrosesan - hpp;
  if (profitPerUnit <= 0) return null;
  const units = Math.ceil(targetProfit / profitPerUnit);
  const omzet = units * hargaJual;
  return { units, omzet, profitPerUnit };
}

function badge(color) {
  return { background: color + "18", border: `1px solid ${color}44`, color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" };
}

const SCENARIO_TARGETS = [1000000, 3000000, 5000000];

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [form, setForm] = useState({
    targetProfit: 5000000,
    hpp: 26000,
    hargaJual: 43000,
    budgetIklan: 6.81,
    hari: 30,
  });

  const [showBreakdownFee, setShowBreakdownFee] = useState(false);
  const resultRef = useRef(null);
  const f = fees[platform];
  const set = (k, v) => setForm(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const result = useMemo(() => calcUnit(form.targetProfit, form.hpp, form.hargaJual, f, form.budgetIklan), [form, f]);

  const scenarios = useMemo(() => SCENARIO_TARGETS.map(t => ({
    target: t,
    ...calcUnit(t, form.hpp, form.hargaJual, f, form.budgetIklan),
  })), [form, f]);

  const totalFeePct = (f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100;
  const iklanPct = form.budgetIklan / 100;
  const feePerUnit = form.hargaJual * totalFeePct + f.pemrosesan;
  const iklanPerUnit = form.hargaJual * iklanPct;
  const profitPerUnit = result ? result.profitPerUnit : 0;

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 8, padding: "10px 12px", color: "#000", fontWeight: 700, fontSize: 14, outline: "none" };
  const label = { fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 6 };
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e1e23", fontSize: 13 };

  const saveAsImage = () => {
    if (!resultRef.current) return;
    const el = resultRef.current;
    // Build a printable popup with the panel content
    const styles = `
      body { background: #0d0d0f; color: #f0eff4; font-family: 'DM Sans', Arial, sans-serif; margin: 0; padding: 20px; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `;
    const win = window.open("", "_blank", "width=720,height=600");
    if (!win) { alert("Popup diblokir. Izinkan popup di browser kamu."); return; }
    win.document.write(`
      <html><head>
        <title>Target Omzet — ${fmt(form.targetProfit)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>${styles}</style>
      </head><body>
        ${el.outerHTML}
        <script>setTimeout(() => { window.print(); }, 800);<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const saveAsText = () => {
    if (!result) return;
    const totalFeeAll = feePerUnit * result.units;
    const totalIklan = iklanPerUnit * result.units;
    const totalHPPAll = form.hpp * result.units;
    const lines = [
      "===== SELLERCALC — TARGET OMZET =====",
      `Platform     : ${platform.toUpperCase()}`,
      `Target Profit: ${fmt(form.targetProfit)}`,
      `Periode      : ${form.hari} hari`,
      "",
      "--- HASIL ---",
      `Omzet Dicapai  : ${fmt(result.omzet)}`,
      `Total Unit     : ${result.units} unit`,
      `Target/Hari    : ${Math.ceil(result.units / form.hari)} unit`,
      `Target/Minggu  : ${Math.ceil(result.units / (form.hari / 7))} unit`,
      "",
      "--- KOMPOSISI OMZET ---",
      `HPP Total        : ${fmt(totalHPPAll)}`,
      `Total Fee        : ${fmt(totalFeeAll)}`,
      `Total Iklan      : ${fmt(totalIklan)}`,
      `Profit Bersih    : ${fmt(form.targetProfit)}`,
      "=====================================",
    ];
    const text = lines.join("\n");
    // Try clipboard API first, fallback to textarea trick
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert("✓ Data berhasil disalin ke clipboard!"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      alert("✓ Data berhasil disalin ke clipboard!");
    } catch {
      // Last resort: show in prompt so user can manually copy
      window.prompt("Salin teks di bawah ini (Ctrl+A lalu Ctrl+C):", text);
    }
    document.body.removeChild(ta);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #f5a623; cursor: pointer; border: 2px solid #0d0d0f; }
        .platform-btn { border: 1.5px solid #2a2a32; background: transparent; border-radius: 8px; padding: 8px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.18s; }
        .platform-btn.shopee { background: rgba(238,77,45,0.12); border-color: #ee4d2d; color: #ee4d2d; }
        .platform-btn.tiktok { background: rgba(255,255,255,0.07); border-color: #aaa; color: #f0eff4; }
        .platform-btn.off { color: #6b6a78; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .sc-card { flex: 1; background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.18s; }
        .sc-card:hover { border-color: rgba(245,166,35,0.4); transform: translateY(-1px); }
        .metric-box { background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px 16px; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "16px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <button onClick={() => setShowFee(!showFee)} style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "6px 14px", color: "#6b6a78", fontSize: 12, cursor: "pointer" }}>
          ⚙️ Fee
        </button>
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
                  {[["komisi","Komisi Platform","%"],["dinamis","Komisi Dinamis","%"],["cashback","Cashback Bonus","%"],["pemrosesan","Biaya Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k, lbl, u]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "#6b6a78", flex: 1 }}>{lbl}</span>
                      <input type="number" step="0.01" value={fees[p][k]}
                        onChange={e => setFees(prev => ({ ...prev, [p]: { ...prev[p], [k]: parseFloat(e.target.value) || 0 } }))}
                        style={{ width: 72, background: "#0d0d0f", border: "1px solid #2a2a32", borderRadius: 6, padding: "4px 8px", color: "#fff", fontWeight: 600, fontSize: 13, textAlign: "right", outline: "none" }}
                      />
                      <span style={{ fontSize: 11, color: "#6b6a78", width: 18 }}>{u}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Platform */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          <button className={`platform-btn ${platform === "shopee" ? "shopee" : "off"}`} onClick={() => setPlatform("shopee")}>🛍 Shopee</button>
          <button className={`platform-btn ${platform === "tiktok" ? "tiktok" : "off"}`} onClick={() => setPlatform("tiktok")}>🎵 TikTok Shop</button>
        </div>

        {/* Target Profit */}
        <div style={{ ...card, border: "1px solid rgba(245,166,35,0.3)", background: "rgba(245,166,35,0.04)" }}>
          <label style={label}>🎯 Target Profit yang Ingin Dicapai</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
            <input type="number" style={{ ...inputStyle, paddingLeft: 36, fontSize: 20, fontWeight: 800 }}
              value={form.targetProfit} onChange={e => set("targetProfit", e.target.value)} />
          </div>
          {/* Quick pick */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[500000, 1000000, 3000000, 5000000, 10000000].map(t => (
              <button key={t} onClick={() => set("targetProfit", t)}
                style={{ background: form.targetProfit === t ? "rgba(245,166,35,0.2)" : "transparent", border: `1px solid ${form.targetProfit === t ? "#f5a623" : "#2a2a32"}`, borderRadius: 6, padding: "5px 12px", color: form.targetProfit === t ? "#f5a623" : "#6b6a78", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, transition: "all 0.15s" }}>
                {fmtK(t)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Produk & Periode */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Detail Produk & Periode</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["hpp", "HPP (Harga Pokok)", "Rp"],
              ["hargaJual", "Harga Jual", "Rp"],
            ].map(([k, lbl, u]) => (
              <div key={k}>
                <label style={label}>{lbl}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>{u}</span>
                  <input type="number" style={{ ...inputStyle, paddingLeft: 36 }}
                    value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              </div>
            ))}
            <div>
              <label style={label}>Budget Iklan / ACOS (%)</label>
              <div style={{ position: "relative" }}>
                <input type="number" step="0.01" style={{ ...inputStyle, paddingRight: 36 }}
                  value={form.budgetIklan} onChange={e => set("budgetIklan", e.target.value)} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>%</span>
              </div>
            </div>
            <div>
              <label style={label}>Periode Target — {form.hari} hari</label>
              <input type="range" min={7} max={90} step={1}
                value={form.hari} onChange={e => set("hari", e.target.value)}
                style={{ accentColor: "#f5a623", background: `linear-gradient(to right, #f5a623 ${(form.hari-7)/83*100}%, #2a2a32 ${(form.hari-7)/83*100}%)` }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a78", marginTop: 4 }}>
                <span>7 hari</span>
                <div style={{ display: "flex", gap: 12 }}>
                  {[7, 14, 30, 60, 90].map(d => (
                    <span key={d} onClick={() => set("hari", d)} style={{ cursor: "pointer", color: form.hari === d ? "#f5a623" : "#6b6a78", fontWeight: form.hari === d ? 700 : 400 }}>{d}h</span>
                  ))}
                </div>
                <span>90 hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown per unit */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Breakdown per Unit</div>
          <div style={rowStyle}><span style={{ color: "#aaa" }}>Harga Jual</span><span style={{ fontWeight: 600 }}>{fmt(form.hargaJual)}</span></div>
          <div style={rowStyle}><span style={{ color: "#aaa" }}>HPP</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(form.hpp)}</span></div>
          {/* Fee Marketplace with breakdown */}
          <div style={{ padding: "9px 0", borderBottom: "1px solid #1e1e23" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowBreakdownFee(!showBreakdownFee)}>
              <span style={{ fontSize: 13, color: "#aaa" }}>Fee Marketplace</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(feePerUnit)}</span>
                <span style={{ fontSize: 10, color: "#6b6a78" }}>{showBreakdownFee ? "▲" : "▼"} rincian</span>
              </div>
            </div>
            {showBreakdownFee && (
              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #2a2a32" }} className="animate">
                {[
                  [`Komisi Platform (${f.komisi}%)`, (form.hargaJual * f.komisi) / 100],
                  [`Komisi Dinamis (${f.dinamis}%)`, (form.hargaJual * f.dinamis) / 100],
                  [`Cashback Bonus (${f.cashback}%)`, (form.hargaJual * f.cashback) / 100],
                  [`Biaya Pemrosesan`, f.pemrosesan],
                  [`Affiliasi (${f.affiliasi}%)`, (form.hargaJual * f.affiliasi) / 100],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                    <span style={{ color: "#6b6a78" }}>{lbl}</span>
                    <span style={{ color: "#ef4444" }}>-{fmt(val)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 2px", fontSize: 12, borderTop: "1px dashed #2a2a32", marginTop: 4 }}>
                  <span style={{ color: "#aaa", fontWeight: 600 }}>Total</span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>-{fmt(feePerUnit)}</span>
                </div>
              </div>
            )}
          </div>
          <div style={rowStyle}><span style={{ color: "#aaa" }}>Biaya Iklan ({form.budgetIklan}%)</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(iklanPerUnit)}</span></div>
          <div style={{ ...rowStyle, borderBottom: "none", marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>Profit Bersih per Unit</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: profitPerUnit >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(profitPerUnit)}</span>
          </div>
        </div>

        {/* Hasil Utama */}
        {result ? (
          <div ref={resultRef} style={{ ...card, borderColor: "rgba(245,166,35,0.3)" }} className="animate">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Untuk Profit {fmt(form.targetProfit)} dalam {form.hari} Hari
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveAsText} title="Copy sebagai teks"
                  style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 6, padding: "5px 10px", color: "#6b6a78", fontSize: 12, cursor: "pointer", transition: "all 0.18s" }}
                  onMouseEnter={e => { e.target.style.borderColor="#f5a623"; e.target.style.color="#f5a623"; }}
                  onMouseLeave={e => { e.target.style.borderColor="#2a2a32"; e.target.style.color="#6b6a78"; }}>
                  📋
                </button>
                <button onClick={saveAsImage} title="Simpan sebagai gambar PNG"
                  style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 6, padding: "5px 10px", color: "#f5a623", fontSize: 12, cursor: "pointer", transition: "all 0.18s" }}
                  onMouseEnter={e => { e.target.style.background="rgba(245,166,35,0.2)"; }}
                  onMouseLeave={e => { e.target.style.background="rgba(245,166,35,0.1)"; }}>
                  📸
                </button>
              </div>
            </div>

            {/* 4 metrik utama */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Omzet Harus Dicapai", value: fmt(result.omzet), color: "#f5a623", sub: `${result.units} unit × ${fmt(form.hargaJual)}` },
                { label: "Total Unit Terjual", value: `${result.units.toLocaleString("id-ID")} unit`, color: "#4fc8a0", sub: `profit/unit ${fmt(result.profitPerUnit)}` },
                { label: "Target per Hari", value: `${Math.ceil(result.units / form.hari)} unit`, color: "#7c6fcd", sub: `omzet/hari ${fmt(result.omzet / form.hari)}` },
                { label: "Target per Minggu", value: `${Math.ceil(result.units / (form.hari / 7))} unit`, color: "#f59e0b", sub: `omzet/minggu ${fmt(result.omzet / (form.hari / 7))}` },
              ].map(m => (
                <div key={m.label} className="metric-box">
                  <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: m.color, lineHeight: 1.1 }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 4 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Breakdown omzet */}
            <div style={{ background: "#0d0d0f", borderRadius: 8, padding: "14px" }}>
              <div style={{ fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Komposisi Omzet {fmt(result.omzet)}</div>
              {(() => {
                const totalFeeAll = feePerUnit * result.units;
                const totalIklan = iklanPerUnit * result.units;
                const totalHPP = form.hpp * result.units;
                const items = [
                  { label: "HPP Total", val: totalHPP, color: "#ef4444" },
                  { label: "Total Fee Marketplace", val: totalFeeAll, color: "#f59e0b" },
                  { label: "Total Biaya Iklan", val: totalIklan, color: "#7c6fcd" },
                  { label: "Profit Bersih", val: form.targetProfit, color: "#22c55e" },
                ];
                return items.map(item => {
                  const w = (item.val / result.omzet) * 100;
                  return (
                    <div key={item.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "#aaa" }}>{item.label}</span>
                        <span style={{ color: item.color, fontWeight: 600 }}>{fmt(item.val)} ({pct(w)})</span>
                      </div>
                      <div style={{ height: 4, background: "#1e1e23", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${w}%`, background: item.color, borderRadius: 2, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div style={{ ...card, borderColor: "rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.04)" }}>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Profit per unit negatif</div>
              <div style={{ fontSize: 12, color: "#6b6a78" }}>Harga jual terlalu rendah atau fee terlalu besar. Naikkan harga jual atau kurangi biaya.</div>
            </div>
          </div>
        )}

        {/* Perbandingan 3 Skenario */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Perbandingan Skenario Target</div>
          <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 14 }}>Berapa unit & omzet yang dibutuhkan untuk 3 level target profit.</div>
          <div style={{ display: "flex", gap: 10 }}>
            {scenarios.map(s => (
              <div key={s.target} className="sc-card" onClick={() => set("targetProfit", s.target)}
                style={{ border: `1px solid ${form.targetProfit === s.target ? "rgba(245,166,35,0.5)" : "#2a2a32"}`, background: form.targetProfit === s.target ? "rgba(245,166,35,0.05)" : "#111115" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f5a623", marginBottom: 6 }}>{fmtK(s.target)}</div>
                {s ? (
                  <>
                    <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 2 }}>Omzet</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#4fc8a0", marginBottom: 6 }}>{fmtK(s.omzet)}</div>
                    <div style={{ width: "100%", height: 1, background: "#2a2a32", margin: "6px 0" }} />
                    <div style={{ fontSize: 11, color: "#6b6a78" }}>{s.units} unit</div>
                    <div style={{ fontSize: 11, color: "#7c6fcd", marginTop: 2 }}>{Math.ceil(s.units / form.hari)}/hari</div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: "#ef4444" }}>Profit/unit negatif</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 10, textAlign: "center" }}>Klik kartu untuk apply target</div>
        </div>

      </div>
    </div>
  );
}
