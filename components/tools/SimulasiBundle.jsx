import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(2) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

let idCounter = 0;
const newItem = (name = "", hpp = 0, hargaSatuan = 0) => ({
  id: ++idCounter, name, hpp, hargaSatuan,
});

function calcFee(harga, fees) {
  const totalPct = fees.komisi + fees.dinamis + fees.cashback + fees.affiliasi;
  return (harga * totalPct) / 100 + fees.pemrosesan;
}

function StatusBadge({ val }) {
  if (val > 0) return <span style={badge("#22c55e")}>▲ Lebih Untung</span>;
  if (val === 0) return <span style={badge("#6b6a78")}>= Sama</span>;
  return <span style={badge("#ef4444")}>▼ Lebih Rugi</span>;
}

function MarginBadge({ p }) {
  if (p >= 20) return <span style={badge("#22c55e")}>✓ Aman</span>;
  if (p >= 10) return <span style={badge("#f59e0b")}>⚡ Hati-hati</span>;
  if (p >= 0)  return <span style={badge("#ef4444")}>⚠️ Tipis</span>;
  return <span style={badge("#dc2626")}>✕ Rugi</span>;
}

function badge(color) {
  return {
    background: color + "18", border: `1px solid ${color}44`, color,
    fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4,
    fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em",
  };
}

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [items, setItems] = useState([
    newItem("Produk A", 26000, 43000),
    newItem("Produk B", 26000, 43000),
  ]);
  const [hargaBundle, setHargaBundle] = useState(75000);
  const [savedResults, setSavedResults] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const f = fees[platform];

  const totalHPP = useMemo(() => items.reduce((s, i) => s + i.hpp, 0), [items]);
  const totalHargaSatuan = useMemo(() => items.reduce((s, i) => s + i.hargaSatuan, 0), [items]);

  // Profit jual satuan (masing-masing item dijual sendiri, fee per item)
  const profitSatuan = useMemo(() => items.reduce((s, i) => {
    const fee = calcFee(i.hargaSatuan, f);
    return s + (i.hargaSatuan - i.hpp - fee);
  }, 0), [items, f]);
  const profitSatuanPct = totalHargaSatuan > 0 ? (profitSatuan / totalHargaSatuan) * 100 : 0;

  // Profit jual bundle
  const feeBundle = useMemo(() => calcFee(hargaBundle, f), [hargaBundle, f]);
  const profitBundle = hargaBundle - totalHPP - feeBundle;
  const profitBundlePct = hargaBundle > 0 ? (profitBundle / hargaBundle) * 100 : 0;

  // Profit per item dalam bundle
  const profitPerItem = items.length > 0 ? profitBundle / items.length : 0;

  // Selisih bundle vs satuan
  const selisih = profitBundle - profitSatuan;
  const selisihPct = profitSatuan !== 0 ? (selisih / Math.abs(profitSatuan)) * 100 : 0;

  // Harga bundle minimum agar profit >= 0
  const hargaBundleMin = useMemo(() => {
    const totalPct = (f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100;
    return (totalHPP + f.pemrosesan) / (1 - totalPct);
  }, [totalHPP, f]);

  // Harga bundle target 20% margin
  const hargaBundleTarget = useMemo(() => {
    const totalPct = (f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100;
    return (totalHPP + f.pemrosesan) / (1 - totalPct - 0.20);
  }, [totalHPP, f]);

  const addItem = () => setItems(prev => [...prev, newItem(`Produk ${String.fromCharCode(65 + prev.length)}`)]);
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id, key, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: parseFloat(val) || 0 } : i));
  const updateName = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, name: val } : i));

  const handleSave = () => {
    const name = prompt("Nama bundle ini:");
    if (!name) return;
    setSavedResults(prev => [...prev, {
      id: Date.now(), name, platform,
      items: items.length, hargaBundle,
      profitBundle, profitBundlePct,
      selisih,
    }]);
  };

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 8, padding: "9px 12px", color: "#000", fontWeight: 700, fontSize: 14, outline: "none" };
  const inputStyleSm = { ...inputStyle, fontSize: 13, padding: "8px 10px" };
  const label = { fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 6 };
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e1e23", fontSize: 13 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        .platform-btn { border: 1.5px solid #2a2a32; background: transparent; border-radius: 8px; padding: 8px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.18s; }
        .platform-btn.shopee { background: rgba(238,77,45,0.12); border-color: #ee4d2d; color: #ee4d2d; }
        .platform-btn.tiktok { background: rgba(255,255,255,0.07); border-color: #aaa; color: #f0eff4; }
        .platform-btn.off { color: #6b6a78; }
        .item-card { background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 14px; margin-bottom: 10px; transition: border-color 0.2s; }
        .item-card:hover { border-color: rgba(245,166,35,0.3); }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .compare-card { flex: 1; background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 16px; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        input[type=text] { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "16px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSaved(!showSaved)} style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "6px 14px", color: "#6b6a78", fontSize: 12, cursor: "pointer" }}>
            📁 {savedResults.length > 0 ? `(${savedResults.length})` : "Tersimpan"}
          </button>
          <button onClick={() => setShowFee(!showFee)} style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "6px 14px", color: "#6b6a78", fontSize: 12, cursor: "pointer" }}>
            ⚙️ Fee
          </button>
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

      {/* Saved */}
      {showSaved && savedResults.length > 0 && (
        <div style={{ background: "#111113", borderBottom: "1px solid #2a2a32", padding: "16px 20px" }} className="animate">
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📁 Bundle Tersimpan</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {savedResults.map(r => (
                <div key={r.id} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 8, padding: "10px 14px", minWidth: 160 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "#6b6a78" }}>{r.platform.toUpperCase()} · {r.items} item · {fmt(r.hargaBundle)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: r.profitBundlePct >= 20 ? "#22c55e" : r.profitBundlePct >= 10 ? "#f59e0b" : "#ef4444", marginTop: 4 }}>
                    {fmt(r.profitBundle)} ({pct(r.profitBundlePct)})
                  </div>
                  <div style={{ fontSize: 11, color: r.selisih >= 0 ? "#22c55e" : "#ef4444", marginTop: 2 }}>
                    vs satuan: {r.selisih >= 0 ? "+" : ""}{fmt(r.selisih)}
                  </div>
                  <button onClick={() => setSavedResults(prev => prev.filter(x => x.id !== r.id))} style={{ fontSize: 10, color: "#6b6a78", background: "transparent", border: "none", cursor: "pointer", marginTop: 4 }}>hapus</button>
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

        {/* Daftar Item Bundle */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Item dalam Bundle ({items.length} produk)
            </div>
            <button onClick={addItem} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 6, padding: "5px 14px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              + Tambah Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="item-card animate">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(245,166,35,0.15)", color: "#f5a623", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateName(item.id, e.target.value)}
                    placeholder="Nama produk"
                    style={{ background: "transparent", border: "none", color: "#f0eff4", fontSize: 13, fontWeight: 500, outline: "none", width: 150 }}
                  />
                </div>
                {items.length > 2 && (
                  <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ ...label, fontSize: 10 }}>HPP</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#6b6a78" }}>Rp</span>
                    <input type="number" style={{ ...inputStyleSm, paddingLeft: 32 }}
                      value={item.hpp} onChange={e => updateItem(item.id, "hpp", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ ...label, fontSize: 10 }}>Harga Jual Satuan</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#6b6a78" }}>Rp</span>
                    <input type="number" style={{ ...inputStyleSm, paddingLeft: 32 }}
                      value={item.hargaSatuan} onChange={e => updateItem(item.id, "hargaSatuan", e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Profit satuan per item */}
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a78" }}>
                <span>Profit jual satuan:</span>
                <span style={{ color: (() => { const p = item.hargaSatuan - item.hpp - calcFee(item.hargaSatuan, f); return p >= 0 ? "#22c55e" : "#ef4444"; })(), fontWeight: 600 }}>
                  {(() => { const p = item.hargaSatuan - item.hpp - calcFee(item.hargaSatuan, f); return (p >= 0 ? "" : "") + fmt(p); })()}
                </span>
              </div>
            </div>
          ))}

          {/* Ringkasan total item */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <div style={{ background: "#0d0d0f", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Total HPP</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#ef4444" }}>{fmt(totalHPP)}</div>
            </div>
            <div style={{ background: "#0d0d0f", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Total Harga Satuan</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#aaa" }}>{fmt(totalHargaSatuan)}</div>
            </div>
          </div>
        </div>

        {/* Harga Bundle */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Harga Jual Bundle</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
            <input type="number" style={{ ...inputStyle, paddingLeft: 36, fontSize: 18 }}
              value={hargaBundle} onChange={e => setHargaBundle(parseFloat(e.target.value) || 0)} />
          </div>
          {/* Rekomendasi harga bundle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            {[
              { label: "Harga Minimum", desc: "Tidak rugi", value: hargaBundleMin, color: "#ef4444" },
              { label: "Target 20% Margin", desc: "Margin sehat", value: hargaBundleTarget, color: "#22c55e" },
            ].map(r => (
              <div key={r.label} style={{ background: "#111115", border: `1px solid ${r.color}22`, borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}
                onClick={() => setHargaBundle(Math.round(r.value))}>
                <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: r.color }}>{fmt(r.value)}</div>
                <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>{r.desc} · klik apply</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hasil Simulasi */}
        <div style={{ ...card, borderColor: profitBundle >= 0 ? (profitBundlePct >= 20 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)") : "rgba(220,38,38,0.4)" }} className="animate">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hasil Simulasi Bundle</div>
            <MarginBadge p={profitBundlePct} />
          </div>

          <div style={rowStyle}><span style={{ color: "#aaa" }}>Harga Jual Bundle</span><span style={{ fontWeight: 600 }}>{fmt(hargaBundle)}</span></div>
          <div style={rowStyle}><span style={{ color: "#aaa" }}>Total HPP ({items.length} item)</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(totalHPP)}</span></div>

          {/* Fee breakdown */}
          <div style={{ padding: "9px 0", borderBottom: "1px solid #1e1e23" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowBreakdown(!showBreakdown)}>
              <span style={{ fontSize: 13, color: "#aaa" }}>Total Fee Marketplace</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(feeBundle)}</span>
                <span style={{ fontSize: 10, color: "#6b6a78" }}>{showBreakdown ? "▲" : "▼"} rincian</span>
              </div>
            </div>
            {showBreakdown && (
              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #2a2a32" }} className="animate">
                {[
                  [`Komisi Platform (${f.komisi}%)`, (hargaBundle * f.komisi) / 100],
                  [`Komisi Dinamis (${f.dinamis}%)`, (hargaBundle * f.dinamis) / 100],
                  [`Cashback Bonus (${f.cashback}%)`, (hargaBundle * f.cashback) / 100],
                  [`Biaya Pemrosesan`, f.pemrosesan],
                  [`Affiliasi (${f.affiliasi}%)`, (hargaBundle * f.affiliasi) / 100],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                    <span style={{ color: "#6b6a78" }}>{lbl}</span>
                    <span style={{ color: "#ef4444" }}>-{fmt(val)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 2px", fontSize: 12, borderTop: "1px dashed #2a2a32", marginTop: 4 }}>
                  <span style={{ color: "#aaa", fontWeight: 600 }}>Total</span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>-{fmt(feeBundle)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Profit bundle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div style={{ background: "#111115", borderRadius: 10, padding: "12px 14px", border: "1px solid #2a2a32" }}>
              <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profit Jual Satuan</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: profitSatuan >= 0 ? "#aaa" : "#ef4444" }}>{fmt(profitSatuan)}</div>
              <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>{pct(profitSatuanPct)} margin</div>
            </div>
            <div style={{ background: profitBundle >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${profitBundle >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}` }}>
              <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profit Jual Bundle</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: profitBundle >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(profitBundle)}</div>
              <div style={{ fontSize: 10, color: profitBundle >= 0 ? "#22c55e" : "#ef4444", marginTop: 2 }}>{pct(profitBundlePct)} margin</div>
            </div>
          </div>

          {/* Profit per item */}
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#0d0d0f", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b6a78" }}>Profit per Item dalam Bundle</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: profitPerItem >= 0 ? "#f5a623" : "#ef4444" }}>{fmt(profitPerItem)}</span>
          </div>

          {/* Selisih vs satuan */}
          <div style={{ marginTop: 10, padding: "12px 14px", background: selisih >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${selisih >= 0 ? "rgba(34,197,94,0.25)" : "rgba(220,38,38,0.25)"}`, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 3 }}>Bundle vs Jual Satuan</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: selisih >= 0 ? "#22c55e" : "#ef4444" }}>
                  {selisih >= 0 ? "+" : ""}{fmt(selisih)}
                </div>
                <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 2 }}>{selisih >= 0 ? "+" : ""}{pct(selisihPct)} dari profit satuan</div>
              </div>
              <StatusBadge val={selisih} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <button onClick={() => { setItems([newItem("Produk A", 26000, 43000), newItem("Produk B", 26000, 43000)]); setHargaBundle(75000); }}
              style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "11px", color: "#6b6a78", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
              🔄 Reset
            </button>
            <button onClick={handleSave}
              style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "11px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
              💾 Simpan Bundle
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
