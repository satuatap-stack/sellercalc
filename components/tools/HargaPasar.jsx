import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(1) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

function calcProfit(hpp, harga, fees) {
  const totalFeePct = (fees.komisi + fees.dinamis + fees.cashback + fees.affiliasi) / 100;
  const feeRp = harga * totalFeePct + fees.pemrosesan;
  const profit = harga - hpp - feeRp;
  const profitPct = harga > 0 ? (profit / harga) * 100 : 0;
  return { profit, profitPct, feeRp };
}

function badge(color) {
  return { background: color + "18", border: `1px solid ${color}44`, color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" };
}

function PosisBadge({ posisi }) {
  if (posisi === "murah") return <span style={badge("#4fc8a0")}>▼ Di Bawah Pasar</span>;
  if (posisi === "sesuai") return <span style={badge("#f5a623")}>= Sesuai Pasar</span>;
  return <span style={badge("#7c6fcd")}>▲ Di Atas Pasar</span>;
}

function RekoBadge({ posisi, margin }) {
  if (margin < 0) return { icon: "🛑", title: "Harga Terlalu Murah", desc: "Kamu sedang rugi per unit. Naikkan harga segera meski harus di atas pasar.", color: "#ef4444" };
  if (posisi === "murah" && margin < 15) return { icon: "⚠️", title: "Terlalu Murah", desc: "Harga kamu paling murah di pasar tapi margin tipis. Pertimbangkan naik bertahap.", color: "#f59e0b" };
  if (posisi === "murah" && margin >= 15) return { icon: "💡", title: "Ada Ruang Naik", desc: "Harga kamu di bawah pasar tapi masih profit. Coba naikkan bertahap untuk margin lebih baik.", color: "#4fc8a0" };
  if (posisi === "sesuai") return { icon: "✅", title: "Harga Kompetitif", desc: "Posisi harga kamu ideal — sesuai pasar dengan margin yang terjaga.", color: "#22c55e" };
  return { icon: "👑", title: "Posisi Premium", desc: "Harga di atas rata-rata pasar. Pastikan ada diferensiasi nilai (kualitas, packaging, branding).", color: "#7c6fcd" };
}

let kompId = 0;
const newKomp = (nama = "", harga = 0) => ({ id: ++kompId, nama, harga });

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [namaProduk, setNamaProduk] = useState("Buku Aktivitas Anak");
  const [hargaSeller, setHargaSeller] = useState(43000);
  const [hpp, setHpp] = useState(26000);
  const [kompetitor, setKompetitor] = useState([
    newKomp("Toko A", 39000),
    newKomp("Toko B", 45000),
    newKomp("Toko C", 41000),
    newKomp("Toko D", 50000),
  ]);
  const [editId, setEditId] = useState(null);

  const f = fees[platform];

  const addKomp = () => {
    const k = newKomp("Toko Baru", 0);
    setKompetitor(p => [...p, k]);
    setEditId(k.id);
  };
  const updateKomp = (id, key, val) => setKompetitor(p => p.map(k => k.id === id ? { ...k, [key]: key === "nama" ? val : parseFloat(val) || 0 } : k));
  const removeKomp = (id) => setKompetitor(p => p.filter(k => k.id !== id));

  const validKomp = kompetitor.filter(k => k.harga > 0);

  const stats = useMemo(() => {
    if (validKomp.length === 0) return null;
    const hargaList = validKomp.map(k => k.harga);
    const rataRata = hargaList.reduce((s, h) => s + h, 0) / hargaList.length;
    const hargaMin = Math.min(...hargaList);
    const hargaMax = Math.max(...hargaList);
    const selisihRp = hargaSeller - rataRata;
    const selisihPct = (selisihRp / rataRata) * 100;
    const posisi = selisihPct < -5 ? "murah" : selisihPct > 5 ? "mahal" : "sesuai";

    const profitSeller = calcProfit(hpp, hargaSeller, f);
    const profitRataRata = calcProfit(hpp, rataRata, f);
    const profitMin = calcProfit(hpp, hargaMin, f);
    const profitMax = calcProfit(hpp, hargaMax, f);

    return { rataRata, hargaMin, hargaMax, selisihRp, selisihPct, posisi, profitSeller, profitRataRata, profitMin, profitMax };
  }, [validKomp, hargaSeller, hpp, f]);

  const reko = stats ? RekoBadge({ posisi: stats.posisi, margin: stats.profitSeller.profitPct }) : null;

  // Semua harga untuk chart
  const allHarga = useMemo(() => {
    const list = [{ nama: "Kamu", harga: hargaSeller, isSeller: true }, ...validKomp.map(k => ({ nama: k.nama, harga: k.harga, isSeller: false }))];
    return list.sort((a, b) => a.harga - b.harga);
  }, [hargaSeller, validKomp]);

  const chartMax = allHarga.length > 0 ? Math.max(...allHarga.map(h => h.harga)) * 1.1 : 1;

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 8, padding: "10px 12px", color: "#000", fontWeight: 700, fontSize: 14, outline: "none" };
  const inputStyleSm = { ...inputStyle, fontSize: 13, padding: "7px 10px" };
  const label = { fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 6 };

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
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .komp-card { background: #111115; border: 1px solid #2a2a32; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; transition: border-color 0.2s; display: flex; align-items: center; gap: 10px; }
        .komp-card:hover { border-color: rgba(245,166,35,0.3); }
        .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .bar-track { flex: 1; height: 28px; background: #111115; border-radius: 6px; overflow: hidden; position: relative; }
        .bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 8px; font-size: 12px; font-weight: 700; transition: width 0.5s ease; white-space: nowrap; overflow: hidden; }
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
                  {[["komisi","Komisi Platform","%"],["dinamis","Komisi Dinamis","%"],["cashback","Cashback Bonus","%"],["pemrosesan","Biaya Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k, lbl, u]) => (
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

        {/* Platform */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          <button className={`platform-btn ${platform === "shopee" ? "shopee" : "off"}`} onClick={() => setPlatform("shopee")}>🛍 Shopee</button>
          <button className={`platform-btn ${platform === "tiktok" ? "tiktok" : "off"}`} onClick={() => setPlatform("tiktok")}>🎵 TikTok Shop</button>
        </div>

        {/* Input Produk Seller */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Produk Kamu</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={label}>Nama Produk</label>
              <input type="text" style={inputStyle} value={namaProduk} onChange={e => setNamaProduk(e.target.value)} placeholder="Nama produk..." />
            </div>
            <div>
              <label style={label}>HPP (Harga Pokok)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
                <input type="number" style={{ ...inputStyle, paddingLeft: 36 }} value={hpp} onChange={e => setHpp(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <label style={label}>Harga Jual Kamu</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
                <input type="number" style={{ ...inputStyle, paddingLeft: 36, fontSize: 18, fontWeight: 800 }} value={hargaSeller} onChange={e => setHargaSeller(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </div>

        {/* Input Kompetitor */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Harga Kompetitor ({validKomp.length} toko)
            </div>
            <button onClick={addKomp} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 6, padding: "5px 14px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              + Tambah
            </button>
          </div>

          {kompetitor.map(k => {
            const isEdit = editId === k.id;
            return (
              <div key={k.id} className="komp-card">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,166,35,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏪</div>
                {isEdit ? (
                  <>
                    <input type="text" value={k.nama} onChange={e => updateKomp(k.id, "nama", e.target.value)}
                      style={{ flex: 1, background: "transparent", border: "none", color: "#f0eff4", fontSize: 13, fontWeight: 500, outline: "none" }} placeholder="Nama toko" />
                    <div style={{ position: "relative", width: 130 }}>
                      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#6b6a78" }}>Rp</span>
                      <input type="number" style={{ ...inputStyleSm, paddingLeft: 28, width: "100%" }} value={k.harga} onChange={e => updateKomp(k.id, "harga", e.target.value)} />
                    </div>
                    <button onClick={() => setEditId(null)} style={{ background: "transparent", border: "none", color: "#22c55e", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✓</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{k.nama || "Toko"}</span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: k.harga > hargaSeller ? "#7c6fcd" : k.harga < hargaSeller ? "#4fc8a0" : "#f5a623" }}>{fmt(k.harga)}</span>
                    <button onClick={() => setEditId(k.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 12 }}>✏️</button>
                    <button onClick={() => removeKomp(k.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>
                  </>
                )}
              </div>
            );
          })}

          {kompetitor.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#6b6a78", fontSize: 12 }}>
              Belum ada kompetitor. Klik "+ Tambah" untuk mulai.
            </div>
          )}
        </div>

        {/* Hasil Benchmark */}
        {stats && (
          <>
            {/* Visualisasi Bar Chart */}
            <div style={card} className="animate">
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
                Peta Harga Pasar — {namaProduk}
              </div>

              {allHarga.map(item => {
                const barW = (item.harga / chartMax) * 100;
                const isSeller = item.isSeller;
                const isAboveAvg = item.harga > stats.rataRata;
                const barColor = isSeller ? "#f5a623" : isAboveAvg ? "#7c6fcd" : "#4fc8a0";
                return (
                  <div key={item.nama} className="bar-row">
                    <div style={{ width: 80, fontSize: 12, color: isSeller ? "#f5a623" : "#aaa", fontWeight: isSeller ? 700 : 400, textAlign: "right", flexShrink: 0 }}>{item.nama}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${barW}%`, background: barColor + (isSeller ? "" : "99"), color: isSeller ? "#000" : "#fff" }}>
                        {barW > 30 ? fmt(item.harga) : ""}
                      </div>
                      {barW <= 30 && <span style={{ position: "absolute", left: `${barW}%`, top: "50%", transform: "translateY(-50%)", paddingLeft: 6, fontSize: 12, fontWeight: 700, color: barColor }}>{fmt(item.harga)}</span>}
                    </div>
                  </div>
                );
              })}

              {/* Rata-rata line indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "8px 12px", background: "rgba(245,166,35,0.06)", borderRadius: 8, border: "1px dashed rgba(245,166,35,0.3)" }}>
                <span style={{ fontSize: 11, color: "#6b6a78" }}>Rata-rata pasar:</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#f5a623" }}>{fmt(stats.rataRata)}</span>
              </div>
            </div>

            {/* Ringkasan Posisi */}
            <div style={{ ...card, borderColor: reko.color + "44" }} className="animate">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>Posisi Harga Kamu</div>
                <PosisBadge posisi={stats.posisi} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Harga Kamu", value: fmt(hargaSeller), color: "#f5a623" },
                  { label: "Rata-rata Pasar", value: fmt(stats.rataRata), color: "#aaa" },
                  { label: "Selisih", value: `${stats.selisihRp >= 0 ? "+" : ""}${fmt(stats.selisihRp)}`, color: stats.selisihRp >= 0 ? "#7c6fcd" : "#4fc8a0" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#111115", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: m.color, lineHeight: 1.1 }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Harga Terendah", value: fmt(stats.hargaMin), sub: `Profit: ${fmt(stats.profitMin.profit)}`, color: "#4fc8a0" },
                  { label: "Rata-rata", value: fmt(stats.rataRata), sub: `Profit: ${fmt(stats.profitRataRata.profit)}`, color: "#f5a623" },
                  { label: "Harga Tertinggi", value: fmt(stats.hargaMax), sub: `Profit: ${fmt(stats.profitMax.profit)}`, color: "#7c6fcd" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#0d0d0f", borderRadius: 8, padding: "10px 12px", textAlign: "center", cursor: "pointer" }}
                    onClick={() => setHargaSeller(Math.round(m.label === "Rata-rata" ? stats.rataRata : m.label === "Harga Terendah" ? stats.hargaMin : stats.hargaMax))}>
                    <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>{m.sub}</div>
                    <div style={{ fontSize: 9, color: "#6b6a78", marginTop: 2 }}>klik apply</div>
                  </div>
                ))}
              </div>

              {/* Margin seller */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: stats.profitSeller.profit >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${stats.profitSeller.profit >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", marginBottom: 4 }}>Profit Kamu Saat Ini</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: stats.profitSeller.profit >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(stats.profitSeller.profit)}</div>
                  <div style={{ fontSize: 11, color: stats.profitSeller.profit >= 0 ? "#22c55e" : "#ef4444", marginTop: 2 }}>{pct(stats.profitSeller.profitPct)} margin</div>
                </div>
                <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", marginBottom: 4 }}>Profit di Harga Rata-rata</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#f5a623" }}>{fmt(stats.profitRataRata.profit)}</div>
                  <div style={{ fontSize: 11, color: "#f5a623", marginTop: 2 }}>{pct(stats.profitRataRata.profitPct)} margin</div>
                </div>
              </div>

              {/* Rekomendasi */}
              <div style={{ background: reko.color + "10", border: `1px solid ${reko.color}33`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{reko.icon}</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: reko.color }}>{reko.title}</span>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{reko.desc}</div>
              </div>
            </div>

            {/* Simulasi naik ke rata-rata */}
            {stats.posisi === "murah" && (
              <div style={{ ...card, borderColor: "rgba(79,200,160,0.3)" }} className="animate">
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#4fc8a0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                  💡 Simulasi: Naik ke Rata-rata Pasar
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Profit Sekarang", value: fmt(stats.profitSeller.profit), sub: pct(stats.profitSeller.profitPct), color: "#aaa" },
                    { label: "Profit di Rata-rata", value: fmt(stats.profitRataRata.profit), sub: pct(stats.profitRataRata.profitPct), color: "#4fc8a0" },
                    { label: "Tambahan Profit", value: `+${fmt(stats.profitRataRata.profit - stats.profitSeller.profit)}`, sub: `per unit`, color: "#22c55e" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#111115", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setHargaSeller(Math.round(stats.rataRata))}
                  style={{ width: "100%", marginTop: 12, background: "rgba(79,200,160,0.1)", border: "1px solid rgba(79,200,160,0.3)", borderRadius: 8, padding: "11px", color: "#4fc8a0", fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                  Apply Harga Rata-rata ({fmt(stats.rataRata)})
                </button>
              </div>
            )}
          </>
        )}

        {validKomp.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: "#6b6a78" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 4 }}>Tambahkan harga kompetitor</div>
            <div style={{ fontSize: 12 }}>Minimal 1 kompetitor untuk mulai benchmark</div>
          </div>
        )}

      </div>
    </div>
  );
}
