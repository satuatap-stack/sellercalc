import { useState, useEffect, useCallback } from "react";

const DEFAULT_FEES = {
  shopee: {
    komisiPlatform: 4.00,
    komisiDinamis: 2.00,
    cashbackBonus: 3.50,
    biayaPemrosesan: 1000,
    affiliasi: 3.00,
    operasional: 0.00,
    reture: 0.00,
  },
  tiktok: {
    komisiPlatform: 8.00,
    komisiDinamis: 5.00,
    cashbackBonus: 3.50,
    biayaPemrosesan: 1250,
    affiliasi: 5.00,
    operasional: 0.00,
    reture: 0.00,
  },
};

const fmt = (n) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

const pct = (n) => n.toFixed(2) + "%";

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [feeSettings, setFeeSettings] = useState({ ...DEFAULT_FEES });
  const [showSettings, setShowSettings] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [savedResults, setSavedResults] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const [form, setForm] = useState({
    hpp: 26000,
    hargaJual: 43000,
    diskon: 0,
    budgetIklan: 6.81,
  });

  const [whatIfHarga, setWhatIfHarga] = useState(null);
  const [activeTab, setActiveTab] = useState("kalkulator");

  const fees = feeSettings[platform];

  const calc = useCallback((hargaJualOverride) => {
    const hj = hargaJualOverride ?? form.hargaJual;
    const hargaFinal = hj - form.diskon;
    const marginDasar = hargaFinal - form.hpp;
    const marginDasarPct = (marginDasar / hargaFinal) * 100;

    const komisiPlatformRp = (hargaFinal * fees.komisiPlatform) / 100;
    const komisiDinamisRp = (hargaFinal * fees.komisiDinamis) / 100;
    const cashbackBonusRp = (hargaFinal * fees.cashbackBonus) / 100;
    const biayaPemrosesanRp = fees.biayaPemrosesan;
    const affiliasiRp = (hargaFinal * fees.affiliasi) / 100;
    const operasionalRp = (hargaFinal * fees.operasional) / 100;
    const retureRp = (hargaFinal * fees.reture) / 100;

    const totalPotongan =
      komisiPlatformRp +
      komisiDinamisRp +
      cashbackBonusRp +
      biayaPemrosesanRp +
      affiliasiRp +
      operasionalRp +
      retureRp;

    const profitSebelumIklan = marginDasar - totalPotongan;
    const biayaIklanRp = (hargaFinal * form.budgetIklan) / 100;
    const profitBersih = profitSebelumIklan - biayaIklanRp;
    const profitBersihPct = (profitBersih / hargaFinal) * 100;

    // ROAS BEP = Harga Jual / Profit Sebelum Iklan
    // ROAS minimum agar iklan tidak memakan seluruh profit operasional
    const roasBep = profitSebelumIklan > 0 ? hargaFinal / profitSebelumIklan : 0;
    // Target ROAS Ideal = Harga Jual / Profit Bersih
    // Semakin besar budget iklan → profit bersih mengecil → Target ROAS makin tinggi (benar)
    const targetRoas = profitBersih > 0 ? hargaFinal / profitBersih : 0;

    const totalBiayaPerUnit = form.hpp + totalPotongan + biayaIklanRp;
    const hargaMin = totalBiayaPerUnit;
    const hargaTarget20 = form.hpp / (1 - 0.20 - (fees.komisiPlatform + fees.komisiDinamis + fees.cashbackBonus + fees.affiliasi + fees.operasional + form.budgetIklan) / 100) + biayaPemrosesanRp;
    const hargaIdeal30 = form.hpp / (1 - 0.30 - (fees.komisiPlatform + fees.komisiDinamis + fees.cashbackBonus + fees.affiliasi + fees.operasional + form.budgetIklan) / 100) + biayaPemrosesanRp;

    const bepUnit = biayaIklanRp > 0 ? Math.ceil(biayaIklanRp / Math.max(profitSebelumIklan, 1)) : 0;

    return {
      hargaFinal, marginDasar, marginDasarPct,
      komisiPlatformRp, komisiDinamisRp, cashbackBonusRp,
      biayaPemrosesanRp, affiliasiRp, operasionalRp, retureRp,
      totalPotongan, profitSebelumIklan, biayaIklanRp,
      profitBersih, profitBersihPct, roasBep, targetRoas,
      bepUnit, hargaMin, hargaTarget20, hargaIdeal30,
    };
  }, [form, fees]);

  const result = calc();
  const whatIfResult = whatIfHarga !== null ? calc(whatIfHarga) : null;

  const getStatus = (pct) => {
    if (pct < 10) return { label: "Margin Tipis", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "⚠️" };
    if (pct < 20) return { label: "Margin Cukup", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "⚡" };
    return { label: "Margin Sehat", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", icon: "✓" };
  };

  const status = getStatus(result.profitBersihPct);

  const handleSave = () => {
    const name = prompt("Nama produk / label simpanan:");
    if (!name) return;
    setSavedResults(prev => [...prev, {
      id: Date.now(), name, platform,
      hpp: form.hpp, hargaJual: form.hargaJual,
      profitBersih: result.profitBersih,
      profitBersihPct: result.profitBersihPct,
      status: status.label,
    }]);
  };

  const inputCls = "w-full border border-opacity-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f5a623] transition-colors";
  const inputStyle = { color: "var(--text-main)", fontWeight: 700, background: "var(--bg-base)" };
  const labelCls = "text-xs uppercase tracking-widest mb-1.5 block font-semibold";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-main)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #f5a623; cursor: pointer; border: 2px solid var(--bg-base); }
        .tab-btn { transition: all 0.2s; }
        .tab-btn.active { color: #f5a623; border-bottom: 2px solid #f5a623; }
        .tab-btn:not(.active) { color: var(--text-muted); border-bottom: 2px solid transparent; }
        .platform-btn { transition: all 0.2s; border-radius: 8px; padding: 8px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; cursor: pointer; border: 1.5px solid; }
        .platform-btn.active-shopee { background: rgba(238,77,45,0.15); border-color: #ee4d2d; color: #ee4d2d; }
        .platform-btn.inactive { background: transparent; border-color: var(--border-strong); color: var(--text-muted); }
        .platform-btn.active-tiktok { background: rgba(128,128,128,0.1); border-color: #aaa; color: var(--text-main); }
        .result-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); }
        .result-row:last-child { border-bottom: none; }
        .animate-in { animation: fadeUp 0.4s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card { background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .highlight-card { background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 10px; padding: 16px; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: var(--bg-base); } ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }
        input { border-color: var(--border-strong) !important; }
        label { color: var(--text-muted) !important; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-base)", zIndex: 50 }}>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSaved(!showSaved)} style={{ background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 14px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
            📁 Tersimpan {savedResults.length > 0 && `(${savedResults.length})`}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 14px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
            ⚙️ Fee Setting
          </button>
        </div>
      </div>

      {/* Fee Settings Panel */}
      {showSettings && (
        <div style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--border-strong)", padding: "20px", animate: "fadeUp" }} className="animate-in">
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>⚙️ Pengaturan Default Fee</span>
              <button onClick={() => { setFeeSettings({ ...DEFAULT_FEES }); }} style={{ fontSize: 11, color: "#f5a623", background: "transparent", border: "none", cursor: "pointer" }}>Reset ke Default</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {["shopee", "tiktok"].map(p => (
                <div key={p}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: p === "shopee" ? "#ee4d2d" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {p === "shopee" ? "🛍 Shopee" : "🎵 TikTok Shop"}
                  </div>
                  {[
                    ["komisiPlatform", "Komisi Platform", "%"],
                    ["komisiDinamis", "Komisi Dinamis", "%"],
                    ["cashbackBonus", "Cashback Bonus", "%"],
                    ["biayaPemrosesan", "Biaya Pemrosesan", "Rp"],
                    ["affiliasi", "Affiliasi", "%"],
                    ["operasional", "Operasional", "%"],
                    ["reture", "Reture", "%"],
                  ].map(([key, label, unit]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>{label}</span>
                      <input type="number" step="0.01"
                        value={feeSettings[p][key]}
                        onChange={e => setFeeSettings(prev => ({ ...prev, [p]: { ...prev[p], [key]: parseFloat(e.target.value) || 0 } }))}
                        style={{ width: 80, background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 6, padding: "4px 8px", color: "var(--text-main)", fontWeight: 600, fontSize: 13, textAlign: "right" }}
                      />
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 20 }}>{unit}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved Results Panel */}
      {showSaved && savedResults.length > 0 && (
        <div style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--border-strong)", padding: "16px 20px" }} className="animate-in">
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📁 Hasil Tersimpan</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {savedResults.map(r => (
                <div key={r.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "10px 14px", minWidth: 180 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.platform.toUpperCase()} · HPP {fmt(r.hpp)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: r.profitBersihPct >= 20 ? "#22c55e" : r.profitBersihPct >= 10 ? "#f59e0b" : "#ef4444", marginTop: 4 }}>
                    {fmt(r.profitBersih)} ({pct(r.profitBersihPct)})
                  </div>
                  <button onClick={() => setSavedResults(prev => prev.filter(x => x.id !== r.id))} style={{ fontSize: 10, color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", marginTop: 4 }}>hapus</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>

        {/* Platform Toggle */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, justifyContent: "center" }}>
          <button className={`platform-btn ${platform === "shopee" ? "active-shopee" : "inactive"}`} onClick={() => setPlatform("shopee")}>
            🛍 Shopee
          </button>
          <button className={`platform-btn ${platform === "tiktok" ? "active-tiktok" : "inactive"}`} onClick={() => setPlatform("tiktok")}>
            🎵 TikTok Shop
          </button>
        </div>

        {/* Input Form */}
        <div className="card">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16, color: "#f5a623", letterSpacing: "0.05em", textTransform: "uppercase" }}>Input Produk</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["hpp", "HPP (Harga Pokok)", "Rp"],
              ["hargaJual", "Harga Jual", "Rp"],
              ["diskon", "Diskon", "Rp"],
            ].map(([key, label, unit]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{unit}</span>
                  <input type="number" className={inputCls} style={{ paddingLeft: 36, ...inputStyle }}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            ))}
            <div>
              <label className={labelCls}>Budget Iklan / ACOS (%)</label>
              <div style={{ position: "relative" }}>
                <input type="number" step="0.01" className={inputCls} style={{ paddingRight: 36, ...inputStyle }}
                  value={form.budgetIklan}
                  onChange={e => setForm(f => ({ ...f, budgetIklan: parseFloat(e.target.value) || 0 }))}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)" }}>%</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
              <button onClick={() => { setForm({ hpp: 26000, hargaJual: 43000, diskon: 0, budgetIklan: 6.81 }); setWhatIfHarga(null); }}
                style={{ background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "11px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                🔄 Reset
              </button>
              <button onClick={handleSave}
                style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "11px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                💾 Simpan
              </button>
            </div>
          </div>
        </div>

        {/* Rekomendasi Harga */}
        <div className="card">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6b6a78" }}>💡 Rekomendasi Harga Jual</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Harga Minimum", desc: "Tidak rugi", value: result.hargaMin, color: "#ef4444" },
              { label: "Target 20%", desc: "Margin sehat", value: result.hargaTarget20, color: "#f59e0b" },
              { label: "Ideal 30%", desc: "Margin bagus", value: result.hargaIdeal30, color: "#22c55e" },
            ].map(r => (
              <div key={r.label} className="highlight-card" style={{ textAlign: "center", cursor: "pointer", border: `1px solid ${r.color}22` }}
                onClick={() => setForm(f => ({ ...f, hargaJual: Math.round(r.value) }))}>
                <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: r.color }}>{fmt(r.value)}</div>
                <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>{r.desc} · klik apply</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hasil Kalkulasi */}
        <div className="card animate-in">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16, color: "#f5a623", letterSpacing: "0.05em", textTransform: "uppercase" }}>Hasil Kalkulasi</div>

          <div className="result-row">
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Harga Final Setelah Diskon</span>
            <span style={{ fontWeight: 600 }}>{fmt(result.hargaFinal)}</span>
          </div>
          <div className="result-row">
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Margin Profit Dasar</span>
            <span style={{ fontWeight: 600, color: "#f5a623" }}>{pct(result.marginDasarPct)} ({fmt(result.marginDasar)})</span>
          </div>

          {/* Breakdown Potongan */}
          <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowBreakdown(!showBreakdown)}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Potongan Biaya</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, color: "#ef4444" }}>-{fmt(result.totalPotongan)}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{showBreakdown ? "▲" : "▼"} rincian</span>
              </div>
            </div>
            {showBreakdown && (
              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid var(--border-strong)" }} className="animate-in">
                {[
                  [`Komisi Platform (${fees.komisiPlatform}%)`, result.komisiPlatformRp],
                  [`Komisi Dinamis (${fees.komisiDinamis}%)`, result.komisiDinamisRp],
                  [`Cashback Bonus (${fees.cashbackBonus}%)`, result.cashbackBonusRp],
                  [`Biaya Pemrosesan`, result.biayaPemrosesanRp],
                  [`Affiliasi (${fees.affiliasi}%)`, result.affiliasiRp],
                  fees.operasional > 0 && [`Operasional (${fees.operasional}%)`, result.operasionalRp],
                  fees.reture > 0 && [`Reture (${fees.reture}%)`, result.retureRp],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ color: "#ef4444" }}>-{fmt(val)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 2px", fontSize: 12, borderTop: "1px dashed var(--border-strong)", marginTop: 4 }}>
                  <span style={{ color: "var(--text-main)", fontWeight: 600 }}>Total</span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>-{fmt(result.totalPotongan)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="result-row">
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Profit Sebelum Iklan</span>
            <span style={{ fontWeight: 600, color: result.profitSebelumIklan >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(result.profitSebelumIklan)}</span>
          </div>
          <div className="result-row">
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Biaya Iklan ({form.budgetIklan}%)</span>
            <span style={{ fontWeight: 600, color: "#ef4444" }}>-{fmt(result.biayaIklanRp)}</span>
          </div>

          {/* ROAS Box */}
          <div style={{ background: "var(--nav-bg)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "14px 16px", margin: "12px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "ROAS BEP / IMPAS", value: result.roasBep.toFixed(2), color: "#ef4444", hint: "Minimum" },
              { label: "ROAS SAAT INI", value: (form.budgetIklan > 0 ? result.hargaFinal / result.biayaIklanRp : 0).toFixed(2), color: "#f5a623", hint: "Aktual" },
              { label: "TARGET ROAS IDEAL", value: result.targetRoas.toFixed(2), color: "#22c55e", hint: "Target" },
            ].map(r => (
              <div key={r.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: r.color, lineHeight: 1.1 }}>{r.value}</div>
                <div style={{ fontSize: 9, color: r.color, opacity: 0.6, marginTop: 2 }}>{r.hint}</div>
              </div>
            ))}
          </div>

          {/* BEP Unit */}
          <div className="result-row">
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Break-even Point (unit)</span>
            <span style={{ fontWeight: 600, color: "#f5a623" }}>{result.bepUnit} unit</span>
          </div>

          {/* Profit Bersih + Status */}
          <div style={{ background: status.bg, border: `1px solid ${status.border}`, borderRadius: 10, padding: "16px", marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Potensi Keuntungan Bersih</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: status.color }}>{fmt(result.profitBersih)}</div>
                <div style={{ fontSize: 13, color: status.color, marginTop: 2 }}>Persentase: {pct(result.profitBersihPct)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20 }}>{status.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: status.color, marginTop: 4, fontFamily: "'Syne', sans-serif" }}>{status.label}</div>
                <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>
                  {result.profitBersihPct < 10 ? "Pertimbangkan ulang harga" :
                    result.profitBersihPct < 20 ? "Masih bisa dioptimasi" : "Pertahankan strategi ini"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What If Simulator */}
        <div className="card">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6b6a78" }}>🎛 Simulasi "What If" Harga Jual</div>
          <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 14 }}>Geser slider untuk lihat dampak perubahan harga ke profit — real-time.</div>

          <input type="range"
            min={Math.round(form.hpp * 1.0)}
            max={Math.round(form.hargaJual * 2)}
            step={1000}
            value={whatIfHarga ?? form.hargaJual}
            onChange={e => setWhatIfHarga(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#f5a623", background: `linear-gradient(to right, #f5a623 0%, #f5a623 ${((( whatIfHarga ?? form.hargaJual) - form.hpp) / (form.hargaJual * 2 - form.hpp)) * 100}%, #2a2a32 ${(((whatIfHarga ?? form.hargaJual) - form.hpp) / (form.hargaJual * 2 - form.hpp)) * 100}%, #2a2a32 100%)` }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: "#6b6a78" }}>Harga: <strong style={{ color: "#f5a623", fontSize: 14 }}>{fmt(whatIfHarga ?? form.hargaJual)}</strong></span>
            <button onClick={() => setWhatIfHarga(null)} style={{ fontSize: 11, color: "#6b6a78", background: "transparent", border: "none", cursor: "pointer" }}>Reset slider</button>
          </div>

          {whatIfResult && whatIfHarga !== form.hargaJual && (
            <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Profit Bersih", cur: result.profitBersih, wi: whatIfResult.profitBersih },
                { label: "Margin %", cur: result.profitBersihPct, wi: whatIfResult.profitBersihPct, isPct: true },
                { label: "ROAS BEP", cur: result.roasBep, wi: whatIfResult.roasBep, isRaw: true },
              ].map(r => {
                const diff = r.wi - r.cur;
                const isUp = diff >= 0;
                return (
                  <div key={r.label} className="highlight-card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: isUp ? "#22c55e" : "#ef4444" }}>
                      {r.isPct ? pct(r.wi) : r.isRaw ? r.wi.toFixed(2) : fmt(r.wi)}
                    </div>
                    <div style={{ fontSize: 10, color: isUp ? "#22c55e" : "#ef4444", marginTop: 2 }}>
                      {isUp ? "▲" : "▼"} {r.isPct ? pct(Math.abs(diff)) : r.isRaw ? Math.abs(diff).toFixed(2) : fmt(Math.abs(diff))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
