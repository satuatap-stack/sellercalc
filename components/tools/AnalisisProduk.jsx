import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(1) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

function calcProfitProduk(hpp, hargaJual, unit, fees) {
  const totalFeePct = (fees.komisi + fees.dinamis + fees.cashback + fees.affiliasi) / 100;
  const feePerUnit = hargaJual * totalFeePct + fees.pemrosesan;
  const profitPerUnit = hargaJual - hpp - feePerUnit;
  const totalProfit = profitPerUnit * unit;
  const totalOmzet = hargaJual * unit;
  const margin = hargaJual > 0 ? (profitPerUnit / hargaJual) * 100 : 0;
  return { profitPerUnit, totalProfit, totalOmzet, feePerUnit, margin };
}

function badge(color, text) {
  return (
    <span style={{ background: color + "18", border: `1px solid ${color}44`, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" }}>
      {text}
    </span>
  );
}

let produkId = 0;
const newProduk = (nama = "", hpp = 0, hargaJual = 0, unit = 0, platform = "tiktok") => ({
  id: ++produkId, nama, hpp, hargaJual, unit, platform,
});

export default function App() {
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [produkList, setProdukList] = useState([
    newProduk("Buku Aktivitas A", 26000, 43000, 150, "tiktok"),
    newProduk("Buku Mewarnai B", 20000, 35000, 280, "shopee"),
    newProduk("Buku Edukasi C", 32000, 55000, 90, "tiktok"),
    newProduk("Flash Card D", 15000, 28000, 320, "shopee"),
  ]);
  const [editId, setEditId] = useState(null);
  const [activeView, setActiveView] = useState("kartu"); // kartu | tabel

  const produkDenganCalc = useMemo(() =>
    produkList.map(p => ({
      ...p,
      ...calcProfitProduk(p.hpp, p.hargaJual, p.unit, fees[p.platform]),
    })),
    [produkList, fees]
  );

  // Ranking berdasarkan unit (terlaris)
  const rankingLaris = useMemo(() =>
    [...produkDenganCalc].sort((a, b) => b.unit - a.unit),
    [produkDenganCalc]
  );

  // Ranking berdasarkan total profit (terprofitable)
  const rankingProfit = useMemo(() =>
    [...produkDenganCalc].sort((a, b) => b.totalProfit - a.totalProfit),
    [produkDenganCalc]
  );

  // Produk yang posisi larisnya jauh dari posisi profitnya
  const anomali = useMemo(() =>
    produkDenganCalc.filter(p => {
      const posLaris = rankingLaris.findIndex(r => r.id === p.id);
      const posProfit = rankingProfit.findIndex(r => r.id === p.id);
      return Math.abs(posLaris - posProfit) >= 2;
    }),
    [produkDenganCalc, rankingLaris, rankingProfit]
  );

  const totalOmzet = produkDenganCalc.reduce((s, p) => s + p.totalOmzet, 0);
  const totalProfit = produkDenganCalc.reduce((s, p) => s + p.totalProfit, 0);
  const totalUnit = produkDenganCalc.reduce((s, p) => s + p.unit, 0);

  const addProduk = () => {
    const p = newProduk();
    setProdukList(prev => [...prev, p]);
    setEditId(p.id);
  };

  const updateProduk = (id, key, val) =>
    setProdukList(prev => prev.map(p => p.id === id ? { ...p, [key]: key === "nama" || key === "platform" ? val : parseFloat(val) || 0 } : p));

  const removeProduk = (id) => setProdukList(prev => prev.filter(p => p.id !== id));

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 8, padding: "8px 10px", color: "#000", fontWeight: 700, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const label = { fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 4 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=text], select { font-family: 'DM Sans', sans-serif; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .tab-btn { flex: 1; padding: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: none; background: transparent; transition: all 0.18s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #f5a623; border-bottom-color: #f5a623; }
        .tab-btn:not(.active) { color: #6b6a78; }
        .produk-card { background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px; margin-bottom: 10px; transition: border-color 0.2s; }
        .produk-card:hover { border-color: rgba(245,166,35,0.3); }
        .rank-num { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; flex-shrink: 0; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "14px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

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
                  {[["komisi","Komisi","%"],["dinamis","Dinamis","%"],["cashback","Cashback","%"],["pemrosesan","Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k, lbl, u]) => (
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

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Summary Total */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total Omzet", value: fmt(totalOmzet), color: "#f5a623" },
            { label: "Total Profit", value: fmt(totalProfit), color: totalProfit >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Total Unit", value: totalUnit + " unit", color: "#4fc8a0" },
          ].map(m => (
            <div key={m.label} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Daftar Produk */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Data Produk ({produkList.length})
            </div>
            <button onClick={addProduk} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 6, padding: "5px 14px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              + Tambah Produk
            </button>
          </div>

          {produkList.map(p => {
            const calc = produkDenganCalc.find(x => x.id === p.id);
            const isEdit = editId === p.id;
            const posLaris = rankingLaris.findIndex(r => r.id === p.id) + 1;
            const posProfit = rankingProfit.findIndex(r => r.id === p.id) + 1;
            const isAnom = anomali.find(a => a.id === p.id);

            return (
              <div key={p.id} className="produk-card" style={{ borderColor: isAnom ? "rgba(245,158,11,0.3)" : "#2a2a32" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  {isEdit ? (
                    <input type="text" value={p.nama} onChange={e => updateProduk(p.id, "nama", e.target.value)}
                      style={{ flex: 1, background: "transparent", border: "none", color: "#f0eff4", fontSize: 14, fontWeight: 600, outline: "none" }} placeholder="Nama produk" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.nama || "Produk"}</span>
                      {posLaris === 1 && badge("#f5a623", "🏆 Terlaris")}
                      {posProfit === 1 && badge("#22c55e", "💰 Terprofitable")}
                      {isAnom && badge("#f59e0b", "⚠️ Perhatian")}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setEditId(isEdit ? null : p.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 12 }}>{isEdit ? "✓ Done" : "✏️"}</button>
                    {produkList.length > 1 && <button onClick={() => removeProduk(p.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>}
                  </div>
                </div>

                {isEdit ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["hpp","HPP"],["hargaJual","Harga Jual"],["unit","Unit Terjual"]].map(([k, lbl]) => (
                      <div key={k} style={{ gridColumn: k === "unit" ? "1 / -1" : "auto" }}>
                        <label style={label}>{lbl}</label>
                        <div style={{ position: "relative" }}>
                          {k !== "unit" && <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#6b6a78" }}>Rp</span>}
                          <input type="number" style={{ ...inputStyle, paddingLeft: k !== "unit" ? 28 : 10 }}
                            value={p[k]} onChange={e => updateProduk(p.id, k, e.target.value)} />
                        </div>
                      </div>
                    ))}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={label}>Platform</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {["tiktok", "shopee"].map(pl => (
                          <button key={pl} onClick={() => updateProduk(p.id, "platform", pl)}
                            style={{ flex: 1, border: `1px solid ${p.platform === pl ? (pl === "shopee" ? "#ee4d2d" : "#aaa") : "#2a2a32"}`, background: p.platform === pl ? (pl === "shopee" ? "rgba(238,77,45,0.1)" : "rgba(255,255,255,0.06)") : "transparent", borderRadius: 6, padding: "8px", color: p.platform === pl ? (pl === "shopee" ? "#ee4d2d" : "#f0eff4") : "#6b6a78", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                            {pl === "shopee" ? "🛍 Shopee" : "🎵 TikTok"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Unit", value: p.unit + " unit", color: "#4fc8a0" },
                      { label: "Profit/unit", value: fmt(calc?.profitPerUnit || 0), color: (calc?.profitPerUnit || 0) >= 0 ? "#22c55e" : "#ef4444" },
                      { label: "Total Profit", value: fmt(calc?.totalProfit || 0), color: (calc?.totalProfit || 0) >= 0 ? "#22c55e" : "#ef4444" },
                      { label: "Margin", value: pct(calc?.margin || 0), color: (calc?.margin || 0) >= 20 ? "#22c55e" : (calc?.margin || 0) >= 10 ? "#f59e0b" : "#ef4444" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "#0d0d0f", borderRadius: 6, padding: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!isEdit && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: "#6b6a78" }}>Rank Laris: <span style={{ color: "#f5a623", fontWeight: 700 }}>#{posLaris}</span></div>
                    <div style={{ fontSize: 10, color: "#6b6a78" }}>Rank Profit: <span style={{ color: "#22c55e", fontWeight: 700 }}>#{posProfit}</span></div>
                    <div style={{ fontSize: 10, color: p.platform === "shopee" ? "#ee4d2d" : "#aaa" }}>{p.platform === "shopee" ? "🛍 Shopee" : "🎵 TikTok"}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Anomali Warning */}
        {anomali.length > 0 && (
          <div style={{ ...card, borderColor: "rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.04)" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f59e0b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              ⚠️ Produk yang Perlu Diperhatikan
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>
              Produk ini penjualannya tinggi tapi ranking profitnya jauh lebih rendah — kemungkinan margin terlalu tipis.
            </div>
            {anomali.map(p => {
              const posLaris = rankingLaris.findIndex(r => r.id === p.id) + 1;
              const posProfit = rankingProfit.findIndex(r => r.id === p.id) + 1;
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#111115", borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.nama}</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: "#f5a623" }}>Laris #{posLaris}</span>
                    <span style={{ color: "#22c55e" }}>Profit #{posProfit}</span>
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>Selisih {Math.abs(posLaris - posProfit)} posisi</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ranking Side by Side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Ranking Terlaris */}
          <div style={card}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>🏆 Ranking Terlaris</div>
            {rankingLaris.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < rankingLaris.length - 1 ? "1px solid #1e1e23" : "none" }}>
                <div className="rank-num" style={{ background: i === 0 ? "rgba(245,166,35,0.2)" : "#0d0d0f", color: i === 0 ? "#f5a623" : "#6b6a78" }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nama}</div>
                  <div style={{ fontSize: 10, color: "#4fc8a0" }}>{p.unit} unit</div>
                </div>
              </div>
            ))}
          </div>

          {/* Ranking Terprofitable */}
          <div style={card}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>💰 Ranking Profit</div>
            {rankingProfit.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < rankingProfit.length - 1 ? "1px solid #1e1e23" : "none" }}>
                <div className="rank-num" style={{ background: i === 0 ? "rgba(34,197,94,0.15)" : "#0d0d0f", color: i === 0 ? "#22c55e" : "#6b6a78" }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nama}</div>
                  <div style={{ fontSize: 10, color: "#22c55e" }}>{fmt(p.totalProfit)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
