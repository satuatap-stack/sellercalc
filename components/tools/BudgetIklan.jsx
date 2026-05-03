import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"jt" : n >= 1000 ? (n/1000).toFixed(0)+"rb" : Math.round(n).toString();
const pct = (n) => n.toFixed(1) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

function calcAlokasi(produkList, totalBudget, fees) {
  if (produkList.length === 0 || totalBudget <= 0) return [];

  return produkList.map(p => {
    const f = fees[p.platform];
    const totalFeePct = (f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100;
    const feePerUnit = p.hargaJual * totalFeePct + f.pemrosesan;
    const profitPerUnit = p.hargaJual - p.hpp - feePerUnit;
    const margin = p.hargaJual > 0 ? (profitPerUnit / p.hargaJual) * 100 : 0;

    // Skor alokasi: gabungan margin + ROAS historis + prioritas manual
    const skorMargin = Math.max(margin, 0) / 50;
    const skorRoas = Math.min(p.roasHistoris / 10, 1);
    const skorPrioritas = p.prioritas / 5;
    const skorTotal = (skorMargin * 0.4) + (skorRoas * 0.4) + (skorPrioritas * 0.2);

    return { ...p, profitPerUnit, margin, feePerUnit, skorTotal };
  });
}

function getRekoIklan(margin, roas, prioritas) {
  if (margin < 5) return { label: "Tidak Disarankan", color: "#ef4444", icon: "🛑", desc: "Margin terlalu tipis untuk diiklankan. Iklan akan memperburuk profit." };
  if (roas < 3 && margin < 15) return { label: "Hati-hati", color: "#f59e0b", icon: "⚠️", desc: "ROAS historis rendah. Alokasikan minimum budget dan monitor ketat." };
  if (margin >= 25 && roas >= 5) return { label: "Prioritas Tinggi", color: "#22c55e", icon: "🚀", desc: "Margin tebal dan ROAS bagus. Layak dapat porsi budget terbesar." };
  if (margin >= 15) return { label: "Layak Diiklankan", color: "#4fc8a0", icon: "✅", desc: "Margin cukup untuk menutupi biaya iklan dengan profit wajar." };
  return { label: "Pertimbangkan", color: "#f5a623", icon: "💡", desc: "Iklankan dengan budget terbatas dan optimalkan targeting." };
}

let pid = 0;
const newProduk = (nama="", hpp=0, hargaJual=0, roasHistoris=5, prioritas=3, platform="tiktok") => ({
  id: ++pid, nama, hpp, hargaJual, roasHistoris, prioritas, platform,
});

export default function App() {
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [totalBudget, setTotalBudget] = useState(1000000);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("alokasi");
  const [simulasiMultiplier, setSimulasiMultiplier] = useState(2);

  const [produkList, setProdukList] = useState([
    newProduk("Buku Aktivitas A", 26000, 43000, 8, 5, "tiktok"),
    newProduk("Buku Mewarnai B", 20000, 35000, 5, 3, "shopee"),
    newProduk("Buku Edukasi C", 32000, 55000, 7, 4, "tiktok"),
    newProduk("Flash Card D", 15000, 28000, 3, 2, "shopee"),
  ]);

  const produkCalc = useMemo(() => calcAlokasi(produkList, totalBudget, fees), [produkList, totalBudget, fees]);

  const totalSkor = produkCalc.reduce((s, p) => s + p.skorTotal, 0);

  const alokasi = useMemo(() => produkCalc.map(p => {
    const porsi = totalSkor > 0 ? p.skorTotal / totalSkor : 1 / produkCalc.length;
    const budgetAlokasi = totalBudget * porsi;
    const estiUnit = p.hargaJual > 0 ? Math.floor(budgetAlokasi * p.roasHistoris / p.hargaJual) : 0;
    const estiOmzet = estiUnit * p.hargaJual;
    const estiProfit = estiUnit * p.profitPerUnit - budgetAlokasi;
    const reko = getRekoIklan(p.margin, p.roasHistoris, p.prioritas);
    return { ...p, porsi, budgetAlokasi, estiUnit, estiOmzet, estiProfit, reko };
  }), [produkCalc, totalBudget, totalSkor]);

  const simulasi = useMemo(() => alokasi.map(p => {
    const budgetSim = p.budgetAlokasi * simulasiMultiplier;
    const estiUnitSim = p.hargaJual > 0 ? Math.floor(budgetSim * p.roasHistoris / p.hargaJual) : 0;
    const estiOmzetSim = estiUnitSim * p.hargaJual;
    const estiProfitSim = estiUnitSim * p.profitPerUnit - budgetSim;
    return { ...p, budgetSim, estiUnitSim, estiOmzetSim, estiProfitSim };
  }), [alokasi, simulasiMultiplier]);

  const totalEstiOmzet = alokasi.reduce((s, p) => s + p.estiOmzet, 0);
  const totalEstiProfit = alokasi.reduce((s, p) => s + p.estiProfit, 0);
  const totalROAS = totalBudget > 0 ? totalEstiOmzet / totalBudget : 0;

  const addProduk = () => {
    const p = newProduk();
    setProdukList(prev => [...prev, p]);
    setEditId(p.id);
  };

  const update = (id, key, val) =>
    setProdukList(prev => prev.map(p => p.id === id ? { ...p, [key]: key === "nama" || key === "platform" ? val : parseFloat(val) || 0 } : p));

  const remove = (id) => setProdukList(prev => prev.filter(p => p.id !== id));

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputSm = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 6, padding: "7px 10px", color: "#000", fontWeight: 700, fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const lbl = { fontSize: 9, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 3 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #f5a623; cursor: pointer; border: 2px solid #0d0d0f; }
        input[type=text], select { font-family: 'DM Sans', sans-serif; }
        .tab-btn { flex: 1; padding: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: none; background: transparent; transition: all 0.18s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #f5a623; border-bottom-color: #f5a623; }
        .tab-btn:not(.active) { color: #6b6a78; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .alloc-bar { height: 8px; background: #1e1e23; border-radius: 4px; overflow: hidden; margin-top: 4px; }
        .alloc-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "14px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowFee(!showFee)} style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "6px 12px", color: "#6b6a78", fontSize: 12, cursor: "pointer" }}>⚙️ Fee</button>
          <button onClick={addProduk} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "6px 14px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>+ Produk</button>
        </div>
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
              {["shopee","tiktok"].map(pl => (
                <div key={pl}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: pl==="shopee"?"#ee4d2d":"#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{pl==="shopee"?"🛍 Shopee":"🎵 TikTok"}</div>
                  {[["komisi","Komisi","%"],["dinamis","Dinamis","%"],["cashback","Cashback","%"],["pemrosesan","Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k,l,u]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "#6b6a78", flex: 1 }}>{l}</span>
                      <input type="number" step="0.01" value={fees[pl][k]} onChange={e => setFees(prev => ({ ...prev, [pl]: { ...prev[pl], [k]: parseFloat(e.target.value)||0 } }))}
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
        {[["alokasi","Alokasi Budget"],["simulasi","Simulasi"],["produk","Data Produk"]].map(([v,l]) => (
          <button key={v} className={`tab-btn ${activeTab===v?"active":""}`} onClick={() => setActiveTab(v)}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Total Budget Input */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Total Budget Iklan</div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
            <input type="number" style={{ width: "100%", background: "#f0eff4", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "12px 12px 12px 36px", color: "#000", fontWeight: 800, fontSize: 20, outline: "none" }}
              value={totalBudget} onChange={e => setTotalBudget(parseFloat(e.target.value)||0)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[100000,250000,500000,1000000,2000000,5000000].map(v => (
              <button key={v} onClick={() => setTotalBudget(v)}
                style={{ background: totalBudget===v?"rgba(245,166,35,0.2)":"transparent", border: `1px solid ${totalBudget===v?"#f5a623":"#2a2a32"}`, borderRadius: 6, padding: "5px 12px", color: totalBudget===v?"#f5a623":"#6b6a78", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, transition: "all 0.15s" }}>
                {fmtK(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Return */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Est. Omzet", value: fmt(totalEstiOmzet), color: "#f5a623" },
            { label: "Est. Profit", value: fmt(totalEstiProfit), color: totalEstiProfit >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Est. ROAS", value: totalROAS.toFixed(1)+"x", color: totalROAS >= 5 ? "#22c55e" : totalROAS >= 3 ? "#f59e0b" : "#ef4444" },
          ].map(m => (
            <div key={m.label} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 10, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* ===== TAB ALOKASI ===== */}
        {activeTab === "alokasi" && (
          <div className="animate">
            {alokasi.sort((a,b) => b.porsi - a.porsi).map((p, i) => (
              <div key={p.id} style={{ background: "#161619", border: `1px solid ${p.reko.color}33`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.nama}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: p.reko.color+"18", border: `1px solid ${p.reko.color}44`, color: p.reko.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: "'Syne', sans-serif" }}>
                        {p.reko.icon} {p.reko.label}
                      </span>
                      <span style={{ fontSize: 10, color: p.platform==="shopee"?"#ee4d2d":"#aaa" }}>{p.platform==="shopee"?"🛍":"🎵"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#f5a623" }}>{fmt(p.budgetAlokasi)}</div>
                    <div style={{ fontSize: 11, color: "#6b6a78" }}>{pct(p.porsi*100)} dari budget</div>
                  </div>
                </div>

                {/* Alokasi bar */}
                <div className="alloc-bar">
                  <div className="alloc-fill" style={{ width: `${p.porsi*100}%`, background: p.reko.color }} />
                </div>

                {/* Estimasi return */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                  {[
                    { label: "Est. Unit", value: p.estiUnit+" unit", color: "#4fc8a0" },
                    { label: "Est. Omzet", value: fmt(p.estiOmzet), color: "#f5a623" },
                    { label: "Est. Profit", value: fmt(p.estiProfit), color: p.estiProfit>=0?"#22c55e":"#ef4444" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#0d0d0f", borderRadius: 6, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Reko desc */}
                <div style={{ marginTop: 10, padding: "8px 12px", background: p.reko.color+"08", borderRadius: 6, fontSize: 11, color: "#aaa", lineHeight: 1.5 }}>
                  <span style={{ color: p.reko.color, fontWeight: 700 }}>→ </span>{p.reko.desc}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== TAB SIMULASI ===== */}
        {activeTab === "simulasi" && (
          <div className="animate">
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Simulasi Budget × {simulasiMultiplier}
              </div>
              <input type="range" min={1} max={5} step={0.5}
                value={simulasiMultiplier} onChange={e => setSimulasiMultiplier(parseFloat(e.target.value))}
                style={{ accentColor: "#f5a623", background: `linear-gradient(to right, #f5a623 ${(simulasiMultiplier-1)/4*100}%, #2a2a32 ${(simulasiMultiplier-1)/4*100}%)`, marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a78", marginBottom: 16 }}>
                <span>1x</span>
                <span style={{ color: "#f5a623", fontWeight: 700 }}>Budget: {fmt(totalBudget * simulasiMultiplier)}</span>
                <span>5x</span>
              </div>

              {/* Perbandingan sebelum vs sesudah */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Sekarang", budget: totalBudget, omzet: totalEstiOmzet, profit: totalEstiProfit, color: "#6b6a78" },
                  { label: `Simulasi ${simulasiMultiplier}x`, budget: totalBudget*simulasiMultiplier, omzet: simulasi.reduce((s,p)=>s+p.estiOmzetSim,0), profit: simulasi.reduce((s,p)=>s+p.estiProfitSim,0), color: "#f5a623" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#111115", border: `1px solid ${s.color}33`, borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{s.label}</div>
                    {[["Budget",fmt(s.budget),"#aaa"],["Est. Omzet",fmt(s.omzet),"#f5a623"],["Est. Profit",fmt(s.profit),s.profit>=0?"#22c55e":"#ef4444"]].map(([l,v,c]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e1e23", fontSize: 12 }}>
                        <span style={{ color: "#6b6a78" }}>{l}</span>
                        <span style={{ color: c, fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Per produk simulasi */}
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Detail Per Produk</div>
              {simulasi.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#111115", borderRadius: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nama}</div>
                    <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 2 }}>
                      {fmt(p.budgetAlokasi)} → <span style={{ color: "#f5a623" }}>{fmt(p.budgetSim)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#4fc8a0" }}>{p.estiUnitSim} unit</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: p.estiProfitSim>=0?"#22c55e":"#ef4444" }}>{fmt(p.estiProfitSim)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TAB DATA PRODUK ===== */}
        {activeTab === "produk" && (
          <div className="animate">
            {produkList.map(p => {
              const isEdit = editId === p.id;
              return (
                <div key={p.id} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    {isEdit ? (
                      <input type="text" value={p.nama} onChange={e => update(p.id,"nama",e.target.value)}
                        style={{ flex: 1, background: "transparent", border: "none", color: "#f0eff4", fontSize: 14, fontWeight: 600, outline: "none" }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.nama || "Produk"}</span>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditId(isEdit?null:p.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 12 }}>{isEdit?"✓ Done":"✏️"}</button>
                      {produkList.length > 1 && <button onClick={() => remove(p.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>}
                    </div>
                  </div>
                  {isEdit ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[["hpp","HPP (Rp)"],["hargaJual","Harga Jual (Rp)"],["roasHistoris","ROAS Historis"],["prioritas","Prioritas (1-5)"]].map(([k,l]) => (
                        <div key={k}>
                          <label style={lbl}>{l}</label>
                          <input type="number" step={k==="roasHistoris"?"0.1":"1"} style={inputSm} value={p[k]} onChange={e => update(p.id,k,e.target.value)} />
                        </div>
                      ))}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={lbl}>Platform</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {["tiktok","shopee"].map(pl => (
                            <button key={pl} onClick={() => update(p.id,"platform",pl)}
                              style={{ flex: 1, border: `1px solid ${p.platform===pl?(pl==="shopee"?"#ee4d2d":"#aaa"):"#2a2a32"}`, background: p.platform===pl?(pl==="shopee"?"rgba(238,77,45,0.1)":"rgba(255,255,255,0.06)"):"transparent", borderRadius: 6, padding: "8px", color: p.platform===pl?(pl==="shopee"?"#ee4d2d":"#f0eff4"):"#6b6a78", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                              {pl==="shopee"?"🛍 Shopee":"🎵 TikTok"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { l:"HPP", v:fmt(p.hpp), c:"#ef4444" },
                        { l:"Harga Jual", v:fmt(p.hargaJual), c:"#f5a623" },
                        { l:"ROAS Hist.", v:p.roasHistoris+"x", c:"#4fc8a0" },
                        { l:"Prioritas", v:p.prioritas+"/5", c:"#7c6fcd" },
                      ].map(m => (
                        <div key={m.l} style={{ background: "#0d0d0f", borderRadius: 6, padding: "8px", textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>{m.l}</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: m.c }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
