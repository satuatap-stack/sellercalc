import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"jt" : n >= 1000 ? (n/1000).toFixed(0)+"rb" : Math.round(n).toString();

// Benchmark CR per platform
const BENCHMARK = {
  shopee: { buruk: 1, cukup: 2.5, baik: 4, sangatBaik: 6 },
  tiktok: { buruk: 0.5, cukup: 1.5, baik: 3, sangatBaik: 5 },
};

function getCRStatus(cr, platform) {
  const b = BENCHMARK[platform];
  if (cr >= b.sangatBaik) return { label: "Sangat Baik", color: "#22c55e", icon: "🚀", skor: 4 };
  if (cr >= b.baik) return { label: "Baik", color: "#4fc8a0", icon: "✅", skor: 3 };
  if (cr >= b.cukup) return { label: "Cukup", color: "#f59e0b", icon: "⚡", skor: 2 };
  if (cr >= b.buruk) return { label: "Perlu Perbaikan", color: "#ef4444", icon: "⚠️", skor: 1 };
  return { label: "Kritis", color: "#dc2626", icon: "🛑", skor: 0 };
}

function getReko(status, platform) {
  const rekoMap = {
    0: ["Foto produk utama perlu diganti — gunakan foto lifestyle bukan putih polos", "Judul produk tidak relevan dengan kata kunci pencarian pembeli", "Harga terlalu jauh di atas kompetitor", "Deskripsi produk tidak menjawab kekhawatiran pembeli", "Review/rating terlalu rendah atau belum ada"],
    1: ["Optimalkan foto thumbnail — gunakan teks overlay harga atau promo", "Tambahkan video produk untuk meningkatkan kepercayaan", "Cek apakah harga sudah kompetitif vs toko serupa", "Aktifkan voucher toko untuk menarik klik pertama"],
    2: ["CR sudah cukup, fokus ke volume traffic untuk naikkan omzet", "A/B test judul produk dengan keyword berbeda", "Tambahkan bundle atau free gift untuk dorong konversi"],
    3: ["Pertahankan strategi yang sudah berjalan", "Scale traffic melalui iklan untuk maksimalkan CR yang sudah baik", "Coba replikasi strategi produk ini ke produk lain"],
    4: ["Performa luar biasa! Prioritaskan stok produk ini", "Naikkan harga secara bertahap — CR tinggi berarti ada ruang premium", "Jadikan produk ini sebagai flagship untuk iklan"],
  };
  return rekoMap[status.skor] || [];
}

function badge(color, text) {
  return <span style={{ background: color+"18", border: `1px solid ${color}44`, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: "'Syne', sans-serif" }}>{text}</span>;
}

let produkId = 0;
const newProduk = (nama="", views=0, pesanan=0, hargaJual=0, hpp=0, platform="tiktok") => ({
  id: ++produkId, nama, views, pesanan, hargaJual, hpp, platform,
});

export default function App() {
  const [produkList, setProdukList] = useState([
    newProduk("Buku Aktivitas A", 5000, 85, 43000, 26000, "tiktok"),
    newProduk("Buku Mewarnai B", 3200, 112, 35000, 20000, "shopee"),
    newProduk("Flash Card C", 8500, 62, 28000, 15000, "tiktok"),
  ]);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(produkList[0]?.id);

  const produkDenganCalc = useMemo(() =>
    produkList.map(p => {
      const cr = p.views > 0 ? (p.pesanan / p.views) * 100 : 0;
      const status = getCRStatus(cr, p.platform);
      const b = BENCHMARK[p.platform];
      const crTarget = b.baik;
      const pesananPotensi = Math.floor(p.views * crTarget / 100);
      const pesananHilang = Math.max(pesananPotensi - p.pesanan, 0);
      const revenueHilang = pesananHilang * p.hargaJual;
      const profitHilang = pesananHilang * (p.hargaJual - p.hpp);
      const reko = getReko(status, p.platform);
      return { ...p, cr, status, pesananPotensi, pesananHilang, revenueHilang, profitHilang, reko };
    }),
    [produkList]
  );

  const selected = produkDenganCalc.find(p => p.id === selectedId) || produkDenganCalc[0];
  const rankingCR = [...produkDenganCalc].sort((a, b) => b.cr - a.cr);

  const addProduk = () => {
    const p = newProduk();
    setProdukList(prev => [...prev, p]);
    setEditId(p.id);
    setSelectedId(p.id);
  };

  const updateProduk = (id, key, val) =>
    setProdukList(prev => prev.map(p => p.id === id ? { ...p, [key]: key === "nama" || key === "platform" ? val : parseFloat(val) || 0 } : p));

  const removeProduk = (id) => {
    setProdukList(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(produkList.find(p => p.id !== id)?.id);
  };

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
        .produk-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #2a2a32; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.18s; }
        .produk-item:hover { border-color: rgba(245,166,35,0.3); }
        .produk-item.active { border-color: #f5a623; background: rgba(245,166,35,0.05); }
        .cr-gauge { position: relative; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "14px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <button onClick={addProduk} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "6px 14px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>+ Produk</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Benchmark Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {["shopee", "tiktok"].map(pl => {
            const b = BENCHMARK[pl];
            return (
              <div key={pl} style={{ background: "#111115", border: `1px solid ${pl === "shopee" ? "rgba(238,77,45,0.2)" : "#2a2a32"}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: pl === "shopee" ? "#ee4d2d" : "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  {pl === "shopee" ? "🛍 Shopee" : "🎵 TikTok"} Benchmark
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  {[["Buruk", b.buruk, "#dc2626"], ["Cukup", b.cukup, "#f59e0b"], ["Baik", b.baik, "#4fc8a0"], ["Ideal", b.sangatBaik, "#22c55e"]].map(([lbl, val, clr]) => (
                    <div key={lbl} style={{ textAlign: "center" }}>
                      <div style={{ color: "#6b6a78", fontSize: 9, marginBottom: 2 }}>{lbl}</div>
                      <div style={{ color: clr, fontWeight: 700 }}>{val}%</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Daftar Produk */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            Produk ({produkList.length}) — Klik untuk detail
          </div>
          {produkDenganCalc.map(p => (
            <div key={p.id} className={`produk-item ${selectedId === p.id ? "active" : ""}`} onClick={() => setSelectedId(p.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === p.id ? (
                  <input type="text" value={p.nama} onChange={e => updateProduk(p.id, "nama", e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ background: "transparent", border: "none", color: "#f0eff4", fontSize: 13, fontWeight: 600, outline: "none", width: "100%" }} />
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nama || "Produk"}</div>
                )}
                <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>
                  {p.views.toLocaleString("id-ID")} views · {p.pesanan} pesanan · {p.platform === "shopee" ? "🛍" : "🎵"}
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: p.status.color }}>{p.cr.toFixed(2)}%</div>
                <div style={{ fontSize: 10 }}>{p.status.icon} {p.status.label}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={e => { e.stopPropagation(); setEditId(editId === p.id ? null : p.id); }}
                  style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 12 }}>{editId === p.id ? "✓" : "✏️"}</button>
                {produkList.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeProduk(p.id); }}
                    style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 16 }}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Produk Terpilih */}
        {selected && (
          <div className="animate">
            {/* Edit Form */}
            {editId === selected.id && (
              <div style={card}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Edit Produk</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["views","Jumlah Views"],["pesanan","Jumlah Pesanan"],["hargaJual","Harga Jual (Rp)"],["hpp","HPP (Rp)"]].map(([k, lbl]) => (
                    <div key={k}>
                      <label style={label}>{lbl}</label>
                      <input type="number" style={inputStyle} value={selected[k]} onChange={e => updateProduk(selected.id, k, e.target.value)} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={label}>Platform</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["tiktok","shopee"].map(pl => (
                        <button key={pl} onClick={() => updateProduk(selected.id, "platform", pl)}
                          style={{ flex: 1, border: `1px solid ${selected.platform === pl ? (pl==="shopee"?"#ee4d2d":"#aaa") : "#2a2a32"}`, background: selected.platform === pl ? (pl==="shopee"?"rgba(238,77,45,0.1)":"rgba(255,255,255,0.06)") : "transparent", borderRadius: 6, padding: "8px", color: selected.platform === pl ? (pl==="shopee"?"#ee4d2d":"#f0eff4") : "#6b6a78", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                          {pl==="shopee"?"🛍 Shopee":"🎵 TikTok"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CR Detail */}
            <div style={{ ...card, borderColor: selected.status.color + "44" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>{selected.nama}</div>
                  <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 2 }}>{selected.platform === "shopee" ? "🛍 Shopee" : "🎵 TikTok Shop"}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: selected.status.color, lineHeight: 1 }}>{selected.cr.toFixed(2)}%</div>
                  <div style={{ fontSize: 12, color: selected.status.color, marginTop: 4 }}>{selected.status.icon} {selected.status.label}</div>
                </div>
              </div>

              {/* CR Progress Bar vs Benchmark */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 6 }}>Posisi CR vs Benchmark {selected.platform === "shopee" ? "Shopee" : "TikTok"}</div>
                <div style={{ position: "relative", height: 8, background: "#1e1e23", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min((selected.cr / BENCHMARK[selected.platform].sangatBaik) * 100, 100)}%`, background: selected.status.color, borderRadius: 4, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#6b6a78", marginTop: 4 }}>
                  <span>0%</span>
                  <span style={{ color: "#dc2626" }}>{BENCHMARK[selected.platform].buruk}% Buruk</span>
                  <span style={{ color: "#f59e0b" }}>{BENCHMARK[selected.platform].cukup}% Cukup</span>
                  <span style={{ color: "#4fc8a0" }}>{BENCHMARK[selected.platform].baik}% Baik</span>
                  <span style={{ color: "#22c55e" }}>{BENCHMARK[selected.platform].sangatBaik}% Ideal</span>
                </div>
              </div>

              {/* Metrik */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Views", value: selected.views.toLocaleString("id-ID"), color: "#aaa" },
                  { label: "Pesanan", value: selected.pesanan, color: "#4fc8a0" },
                  { label: "CR Aktual", value: selected.cr.toFixed(2)+"%", color: selected.status.color },
                ].map(m => (
                  <div key={m.label} style={{ background: "#111115", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Potensi yang hilang */}
              {selected.pesananHilang > 0 && (
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 8 }}>📉 Potensi yang Hilang (jika CR naik ke benchmark Baik {BENCHMARK[selected.platform].baik}%)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Pesanan Hilang</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#ef4444" }}>{selected.pesananHilang} order</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 2 }}>Revenue Hilang</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#ef4444" }}>{fmt(selected.revenueHilang)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rekomendasi */}
              <div style={{ background: selected.status.color + "08", border: `1px solid ${selected.status.color}22`, borderRadius: 10, padding: "14px" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: selected.status.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                  💡 Rekomendasi Perbaikan
                </div>
                {selected.reko.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
                    <span style={{ color: selected.status.color, flexShrink: 0 }}>→</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranking CR Semua Produk */}
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Ranking CR Semua Produk</div>
              {rankingCR.map((p, i) => {
                const barW = Math.min((p.cr / BENCHMARK[p.platform].sangatBaik) * 100, 100);
                return (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: i === 0 ? "#f5a623" : "#6b6a78", width: 20 }}>#{i+1}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{p.nama}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: p.platform === "shopee" ? "#ee4d2d" : "#aaa" }}>{p.platform === "shopee" ? "🛍" : "🎵"}</span>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: p.status.color }}>{p.cr.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#111115", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barW}%`, background: p.status.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
