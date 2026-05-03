import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(1) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

function calcProduk(p, fees) {
  const f = fees[p.platform];
  const totalFeePct = (f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100;
  const feePerUnit = p.hargaJual * totalFeePct + f.pemrosesan;
  const iklanPerUnit = p.biayaIklan / Math.max(p.unit, 1);
  const profitPerUnit = p.hargaJual - p.hpp - feePerUnit - iklanPerUnit;
  const totalProfit = profitPerUnit * p.unit;
  const totalOmzet = p.hargaJual * p.unit;
  const margin = p.hargaJual > 0 ? (profitPerUnit / p.hargaJual) * 100 : 0;
  const roi = p.hpp > 0 ? (profitPerUnit / p.hpp) * 100 : 0;
  return { profitPerUnit, totalProfit, totalOmzet, margin, roi, feePerUnit, iklanPerUnit };
}

function getSkor(p, allProfit, allUnit) {
  const maxProfit = Math.max(...allProfit, 1);
  const maxUnit = Math.max(...allUnit, 1);
  const skorMargin = Math.max(p.margin, 0) / 50 * 40; // max 40 poin
  const skorVolume = (p.unit / maxUnit) * 30; // max 30 poin
  const skorProfit = Math.max(p.totalProfit, 0) / maxProfit * 30; // max 30 poin
  return Math.min(Math.round(skorMargin + skorVolume + skorProfit), 100);
}

function getLabel(skor, margin, totalProfit) {
  if (skor >= 70 && margin >= 15) return { icon: "🌟", label: "Prioritas Utama", color: "#22c55e", aksi: "Naikkan stok & budget iklan. Produk ini adalah mesin profit utama." };
  if (skor >= 50 && margin >= 10) return { icon: "✅", label: "Pertahankan", color: "#4fc8a0", aksi: "Pertahankan strategi saat ini. Optimalkan iklan secara bertahap." };
  if (skor >= 30 || margin >= 5) return { icon: "⚠️", label: "Evaluasi", color: "#f59e0b", aksi: "Cek apakah harga bisa dinaikkan atau HPP bisa ditekan. Kurangi iklan sementara." };
  return { icon: "🛑", label: "Pertimbangkan Stop", color: "#ef4444", aksi: "Margin terlalu tipis atau volume terlalu rendah. Pertimbangkan stop atau reformulasi produk." };
}

function getKuadran(margin, unit, avgMargin, avgUnit) {
  const tinggiMargin = margin >= avgMargin;
  const tinggiUnit = unit >= avgUnit;
  if (tinggiMargin && tinggiUnit) return { label: "⭐ Star", color: "#22c55e", desc: "Profit tinggi & laris" };
  if (tinggiMargin && !tinggiUnit) return { label: "💎 Cash Cow", color: "#4fc8a0", desc: "Profit tinggi, volume rendah" };
  if (!tinggiMargin && tinggiUnit) return { label: "❓ Question", color: "#f59e0b", desc: "Laris tapi margin tipis" };
  return { label: "🐕 Dog", color: "#ef4444", desc: "Margin rendah & kurang laris" };
}

let pid = 0;
const newProduk = (nama="", hpp=0, hargaJual=0, unit=0, biayaIklan=0, platform="tiktok") => ({
  id: ++pid, nama, hpp, hargaJual, unit, biayaIklan, platform,
});

export default function App() {
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeView, setActiveView] = useState("ranking"); // ranking | matrix
  const [produkList, setProdukList] = useState([
    newProduk("Buku Aktivitas A", 26000, 43000, 150, 50000, "tiktok"),
    newProduk("Buku Mewarnai B", 20000, 35000, 280, 80000, "shopee"),
    newProduk("Buku Edukasi C", 32000, 55000, 90, 30000, "tiktok"),
    newProduk("Flash Card D", 15000, 28000, 320, 120000, "shopee"),
    newProduk("Puzzle Anak E", 28000, 42000, 45, 20000, "tiktok"),
  ]);

  const produkDenganCalc = useMemo(() => {
    const calced = produkList.map(p => ({ ...p, ...calcProduk(p, fees) }));
    const allProfit = calced.map(p => p.totalProfit);
    const allUnit = calced.map(p => p.unit);
    const avgMargin = calced.reduce((s, p) => s + p.margin, 0) / calced.length;
    const avgUnit = calced.reduce((s, p) => s + p.unit, 0) / calced.length;
    return calced.map(p => {
      const skor = getSkor(p, allProfit, allUnit);
      const label = getLabel(skor, p.margin, p.totalProfit);
      const kuadran = getKuadran(p.margin, p.unit, avgMargin, avgUnit);
      return { ...p, skor, label, kuadran };
    });
  }, [produkList, fees]);

  const ranking = useMemo(() => [...produkDenganCalc].sort((a, b) => b.skor - a.skor), [produkDenganCalc]);

  const totalOmzet = produkDenganCalc.reduce((s, p) => s + p.totalOmzet, 0);
  const totalProfit = produkDenganCalc.reduce((s, p) => s + p.totalProfit, 0);

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
        input[type=text], select { font-family: 'DM Sans', sans-serif; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .tab-btn { flex: 1; padding: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: none; background: transparent; transition: all 0.18s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #f5a623; border-bottom-color: #f5a623; }
        .tab-btn:not(.active) { color: #6b6a78; }
        .skor-bar { height: 6px; background: #1e1e23; border-radius: 3px; overflow: hidden; margin-top: 4px; }
        .skor-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
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
              {["shopee","tiktok"].map(p => (
                <div key={p}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p==="shopee"?"#ee4d2d":"#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{p==="shopee"?"🛍 Shopee":"🎵 TikTok"}</div>
                  {[["komisi","Komisi","%"],["dinamis","Dinamis","%"],["cashback","Cashback","%"],["pemrosesan","Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k,l,u]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "#6b6a78", flex: 1 }}>{l}</span>
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
        <button className={`tab-btn ${activeView==="ranking"?"active":""}`} onClick={() => setActiveView("ranking")}>Ranking</button>
        <button className={`tab-btn ${activeView==="matrix"?"active":""}`} onClick={() => setActiveView("matrix")}>Matrix 2×2</button>
        <button className={`tab-btn ${activeView==="data"?"active":""}`} onClick={() => setActiveView("data")}>Data Produk</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total Omzet", value: fmt(totalOmzet), color: "#f5a623" },
            { label: "Total Profit", value: fmt(totalProfit), color: totalProfit >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Produk", value: produkList.length + " SKU", color: "#4fc8a0" },
          ].map(m => (
            <div key={m.label} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 10, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* ===== TAB RANKING ===== */}
        {activeView === "ranking" && (
          <div className="animate">
            {ranking.map((p, i) => (
              <div key={p.id} style={{ background: "#161619", border: `1px solid ${i === 0 ? p.label.color + "44" : "#2a2a32"}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: i === 0 ? "rgba(245,166,35,0.15)" : "#111115", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: i === 0 ? "#f5a623" : "#6b6a78", flexShrink: 0 }}>
                    #{i+1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.nama}</span>
                      <span style={{ background: p.label.color+"18", border: `1px solid ${p.label.color}44`, color: p.label.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: "'Syne', sans-serif" }}>
                        {p.label.icon} {p.label.label}
                      </span>
                      <span style={{ fontSize: 10, color: p.platform==="shopee"?"#ee4d2d":"#aaa" }}>{p.platform==="shopee"?"🛍":"🎵"}</span>
                    </div>
                    {/* Skor bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div className="skor-bar">
                          <div className="skor-fill" style={{ width: `${p.skor}%`, background: p.label.color }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: p.label.color, width: 40 }}>{p.skor}/100</span>
                    </div>
                  </div>
                </div>

                {/* Metrik grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Margin", value: pct(p.margin), color: p.margin >= 20 ? "#22c55e" : p.margin >= 10 ? "#f59e0b" : "#ef4444" },
                    { label: "Profit/unit", value: fmt(p.profitPerUnit), color: p.profitPerUnit >= 0 ? "#4fc8a0" : "#ef4444" },
                    { label: "Total Profit", value: fmt(p.totalProfit), color: p.totalProfit >= 0 ? "#22c55e" : "#ef4444" },
                    { label: "Volume", value: p.unit+" unit", color: "#aaa" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#0d0d0f", borderRadius: 6, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: "#6b6a78", textTransform: "uppercase", marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Rekomendasi aksi */}
                <div style={{ padding: "10px 12px", background: p.label.color+"08", border: `1px solid ${p.label.color}22`, borderRadius: 8, fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
                  <span style={{ color: p.label.color, fontWeight: 700 }}>→ </span>{p.label.aksi}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== TAB MATRIX ===== */}
        {activeView === "matrix" && (
          <div className="animate">
            <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 16, lineHeight: 1.6 }}>
              Matrix 2×2 berdasarkan <strong style={{ color: "#f5a623" }}>Margin</strong> (sumbu Y) vs <strong style={{ color: "#4fc8a0" }}>Volume</strong> (sumbu X).
            </div>

            {/* 4 kuadran */}
            {[
              { filter: (p) => p.kuadran.label.includes("Star"), title: "⭐ Star — Profit Tinggi & Laris", color: "#22c55e", desc: "Prioritaskan stok & iklan produk ini" },
              { filter: (p) => p.kuadran.label.includes("Cash"), title: "💎 Cash Cow — Profit Tinggi, Volume Rendah", color: "#4fc8a0", desc: "Naikkan traffic untuk produk ini" },
              { filter: (p) => p.kuadran.label.includes("Question"), title: "❓ Question Mark — Laris tapi Margin Tipis", color: "#f59e0b", desc: "Cek apakah harga bisa dinaikkan" },
              { filter: (p) => p.kuadran.label.includes("Dog"), title: "🐕 Dog — Margin Rendah & Kurang Laris", color: "#ef4444", desc: "Evaluasi apakah layak dilanjutkan" },
            ].map(q => {
              const items = produkDenganCalc.filter(q.filter);
              if (items.length === 0) return null;
              return (
                <div key={q.title} style={{ background: "#161619", border: `1px solid ${q.color}33`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: q.color, marginBottom: 4 }}>{q.title}</div>
                  <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 12 }}>{q.desc}</div>
                  {items.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#0d0d0f", borderRadius: 8, marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.nama}</span>
                        <span style={{ fontSize: 10, color: p.platform==="shopee"?"#ee4d2d":"#aaa", marginLeft: 8 }}>{p.platform==="shopee"?"🛍":"🎵"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                        <span style={{ color: "#f5a623" }}>Margin {pct(p.margin)}</span>
                        <span style={{ color: "#4fc8a0" }}>{p.unit} unit</span>
                        <span style={{ color: p.totalProfit>=0?"#22c55e":"#ef4444", fontWeight: 700 }}>{fmt(p.totalProfit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== TAB DATA PRODUK ===== */}
        {activeView === "data" && (
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
                      <button onClick={() => setEditId(isEdit ? null : p.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 12 }}>{isEdit?"✓ Done":"✏️"}</button>
                      {produkList.length > 1 && <button onClick={() => remove(p.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>}
                    </div>
                  </div>
                  {isEdit ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[["hpp","HPP (Rp)"],["hargaJual","Harga Jual (Rp)"],["unit","Unit Terjual"],["biayaIklan","Biaya Iklan Total (Rp)"]].map(([k,l]) => (
                        <div key={k}>
                          <label style={lbl}>{l}</label>
                          <input type="number" style={inputSm} value={p[k]} onChange={e => update(p.id,k,e.target.value)} />
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { l: "HPP", v: fmt(p.hpp), c: "#ef4444" },
                        { l: "Harga Jual", v: fmt(p.hargaJual), c: "#f5a623" },
                        { l: "Unit", v: p.unit+" unit", c: "#4fc8a0" },
                        { l: "Biaya Iklan", v: fmt(p.biayaIklan), c: "#7c6fcd" },
                        { l: "Platform", v: p.platform==="shopee"?"🛍 Shopee":"🎵 TikTok", c: p.platform==="shopee"?"#ee4d2d":"#aaa" },
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
