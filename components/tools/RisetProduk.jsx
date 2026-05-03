import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(1) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

const DEMAND_MULTIPLIER = { tinggi: 200, sedang: 80, rendah: 25 };
const KOMPETISI_FAKTOR = { rendah: 1.0, sedang: 0.7, tinggi: 0.4 };

const CHECKLIST_ITEMS = [
  "Sudah cek minimal 10 toko kompetitor di marketplace",
  "Sudah tahu range harga pasar (min & maks)",
  "Sudah dapat sampel produk dari supplier",
  "Sudah tahu MOQ (minimum order quantity) supplier",
  "Sudah hitung biaya packaging & ongkir rata-rata",
  "Sudah riset keyword pencarian produk ini",
  "Sudah lihat review negatif kompetitor untuk tahu gap",
  "Sudah tentukan unique selling point (USP) produk",
  "Sudah tentukan target segmen pembeli",
  "Sudah siapkan rencana konten/foto produk",
];

function calcKelayakan(form, fees) {
  const f = fees[form.platform === "keduanya" ? "tiktok" : form.platform];
  const totalFeePct = (f.komisi + f.dinamis + f.cashback + f.affiliasi) / 100;
  const feePerUnit = form.hargaJual * totalFeePct + f.pemrosesan;
  const profitPerUnit = form.hargaJual - form.hpp - feePerUnit;
  const margin = form.hargaJual > 0 ? (profitPerUnit / form.hargaJual) * 100 : 0;

  const estiUnitBulan = Math.floor(
    DEMAND_MULTIPLIER[form.demand] * KOMPETISI_FAKTOR[form.kompetisi]
  );
  const estiOmzet = estiUnitBulan * form.hargaJual;
  const estiProfit = estiUnitBulan * profitPerUnit;

  const stokAwal = form.modal > 0 ? Math.floor(form.modal / form.hpp) : 0;
  const bepUnit = profitPerUnit > 0 ? Math.ceil(form.modal / profitPerUnit) : 0;
  const bepBulan = estiUnitBulan > 0 ? (bepUnit / estiUnitBulan).toFixed(1) : "∞";

  // Skor kelayakan
  const skorMargin = Math.min(Math.max(margin, 0) / 40 * 35, 35);
  const skorDemand = { tinggi: 30, sedang: 18, rendah: 8 }[form.demand];
  const skorKompetisi = { rendah: 25, sedang: 15, tinggi: 5 }[form.kompetisi];
  const skorModal = form.modal >= form.hpp * 50 ? 10 : form.modal >= form.hpp * 20 ? 6 : 3;
  const skor = Math.round(skorMargin + skorDemand + skorKompetisi + skorModal);

  return { profitPerUnit, margin, feePerUnit, estiUnitBulan, estiOmzet, estiProfit, stokAwal, bepUnit, bepBulan, skor };
}

function getVerdict(skor, margin) {
  if (skor >= 70 && margin >= 15) return { label: "✅ Layak Dijual", color: "#22c55e", desc: "Produk ini memiliki potensi bisnis yang baik. Lanjutkan ke tahap sampling & supplier." };
  if (skor >= 50 || margin >= 10) return { label: "💡 Perlu Pertimbangan", color: "#f59e0b", desc: "Ada potensi tapi ada faktor risiko. Lakukan riset lebih dalam sebelum order stok besar." };
  return { label: "🛑 Tidak Layak Saat Ini", color: "#ef4444", desc: "Margin terlalu tipis atau kompetisi terlalu ketat. Cari produk atau supplier yang lebih baik." };
}

let rid = 0;
const newRiset = () => ({
  id: ++rid,
  nama: "",
  hpp: 0,
  hargaJual: 0,
  modal: 500000,
  demand: "sedang",
  kompetisi: "sedang",
  platform: "tiktok",
  checklist: [],
  catatan: "",
});

export default function App() {
  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [showFee, setShowFee] = useState(false);
  const [risetList, setRisetList] = useState([newRiset()]);
  const [activeId, setActiveId] = useState(risetList[0].id);
  const [activeTab, setActiveTab] = useState("form");

  const active = risetList.find(r => r.id === activeId) || risetList[0];

  const calc = useMemo(() => active ? calcKelayakan(active, fees) : null, [active, fees]);
  const verdict = calc ? getVerdict(calc.skor, calc.margin) : null;

  const update = (key, val) =>
    setRisetList(prev => prev.map(r => r.id === activeId ? { ...r, [key]: val } : r));

  const toggleChecklist = (item) => {
    const current = active.checklist || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    update("checklist", updated);
  };

  const addRiset = () => {
    const r = newRiset();
    setRisetList(prev => [...prev, r]);
    setActiveId(r.id);
    setActiveTab("form");
  };

  const removeRiset = (id) => {
    setRisetList(prev => prev.filter(r => r.id !== id));
    if (activeId === id) setActiveId(risetList.find(r => r.id !== id)?.id);
  };

  const card = { background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "#f0eff4", border: "1px solid #2a2a32", borderRadius: 8, padding: "10px 12px", color: "#000", fontWeight: 700, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const label = { fontSize: 11, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 6 };

  const ToggleGroup = ({ options, value, onChange }) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(([v, l, c]) => (
        <button key={v} onClick={() => onChange(v)}
          style={{ flex: 1, border: `1px solid ${value === v ? (c || "#f5a623") : "#2a2a32"}`, background: value === v ? (c || "#f5a623") + "18" : "transparent", borderRadius: 8, padding: "9px", color: value === v ? (c || "#f5a623") : "#6b6a78", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, transition: "all 0.15s" }}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=text], textarea, select { font-family: 'DM Sans', sans-serif; }
        textarea { resize: vertical; }
        .tab-btn { flex: 1; padding: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: none; background: transparent; transition: all 0.18s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #f5a623; border-bottom-color: #f5a623; }
        .tab-btn:not(.active) { color: #6b6a78; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; }
        .check-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid #2a2a32; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
        .check-item:hover { border-color: rgba(245,166,35,0.3); }
        .check-item.checked { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.04); }
        .riset-tab { padding: 8px 14px; border: 1px solid #2a2a32; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; background: transparent; color: #6b6a78; white-space: nowrap; }
        .riset-tab.active { border-color: #f5a623; color: #f5a623; background: rgba(245,166,35,0.08); }
        .skor-bar { height: 10px; background: #1e1e23; border-radius: 5px; overflow: hidden; }
        .skor-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "14px 20px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowFee(!showFee)} style={{ background: "transparent", border: "1px solid #2a2a32", borderRadius: 8, padding: "6px 12px", color: "#6b6a78", fontSize: 12, cursor: "pointer" }}>⚙️ Fee</button>
          <button onClick={addRiset} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "6px 14px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>+ Riset Baru</button>
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

      {/* Riset Tabs */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "12px 20px", background: "#0d0d0f", overflowX: "auto", display: "flex", gap: 8 }}>
        {risetList.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button className={`riset-tab ${activeId === r.id ? "active" : ""}`} onClick={() => setActiveId(r.id)}>
              {r.nama || "Produk Baru"}
            </button>
            {risetList.length > 1 && (
              <button onClick={() => removeRiset(r.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
            )}
          </div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e1e23", background: "#0d0d0f" }}>
        {[["form","Input Riset"],["hasil","Hasil & Verdict"],["checklist",`Checklist (${active?.checklist?.length||0}/${CHECKLIST_ITEMS.length})`]].map(([v,l]) => (
          <button key={v} className={`tab-btn ${activeTab===v?"active":""}`} onClick={() => setActiveTab(v)}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* ===== TAB FORM ===== */}
        {activeTab === "form" && active && (
          <div className="animate">
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Detail Produk</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={label}>Nama Produk yang Diriset</label>
                  <input type="text" style={inputStyle} value={active.nama} onChange={e => update("nama", e.target.value)} placeholder="Contoh: Buku Aktivitas Anak 3-5 Tahun" />
                </div>
                {[["hpp","HPP / Harga Beli Supplier"],["hargaJual","Estimasi Harga Jual di Marketplace"],["modal","Modal Awal yang Disiapkan"]].map(([k,l]) => (
                  <div key={k}>
                    <label style={label}>{l}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
                      <input type="number" style={{ ...inputStyle, paddingLeft: 36 }} value={active[k]} onChange={e => update(k, parseFloat(e.target.value)||0)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Estimasi Pasar</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={label}>Estimasi Demand / Permintaan Pasar</label>
                  <ToggleGroup
                    options={[["rendah","📉 Rendah","#ef4444"],["sedang","📊 Sedang","#f59e0b"],["tinggi","🚀 Tinggi","#22c55e"]]}
                    value={active.demand} onChange={v => update("demand", v)} />
                  <div style={{ fontSize: 11, color: "#6b6a78", marginTop: 6 }}>
                    Estimasi unit/bulan: <strong style={{ color: "#f5a623" }}>{Math.floor(DEMAND_MULTIPLIER[active.demand] * KOMPETISI_FAKTOR[active.kompetisi])} unit</strong>
                  </div>
                </div>
                <div>
                  <label style={label}>Level Kompetisi di Marketplace</label>
                  <ToggleGroup
                    options={[["rendah","😊 Rendah","#22c55e"],["sedang","😐 Sedang","#f59e0b"],["tinggi","😰 Tinggi","#ef4444"]]}
                    value={active.kompetisi} onChange={v => update("kompetisi", v)} />
                </div>
                <div>
                  <label style={label}>Platform Target</label>
                  <ToggleGroup
                    options={[["tiktok","🎵 TikTok","#aaa"],["shopee","🛍 Shopee","#ee4d2d"],["keduanya","Keduanya","#f5a623"]]}
                    value={active.platform} onChange={v => update("platform", v)} />
                </div>
              </div>
            </div>

            <div style={card}>
              <label style={label}>Catatan Riset</label>
              <textarea style={{ ...inputStyle, minHeight: 80 }} value={active.catatan} onChange={e => update("catatan", e.target.value)} placeholder="Catatan supplier, keunggulan produk, ide konten, dll..." />
            </div>
          </div>
        )}

        {/* ===== TAB HASIL ===== */}
        {activeTab === "hasil" && calc && verdict && (
          <div className="animate">

            {/* Skor Kelayakan */}
            <div style={{ ...card, borderColor: verdict.color + "44" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{active.nama || "Produk Baru"}</div>
                  <div style={{ fontSize: 11, color: "#6b6a78" }}>
                    {active.platform === "tiktok" ? "🎵 TikTok" : active.platform === "shopee" ? "🛍 Shopee" : "🎵🛍 Keduanya"} ·
                    Demand {active.demand} · Kompetisi {active.kompetisi}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 40, color: verdict.color, lineHeight: 1 }}>{calc.skor}</div>
                  <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>/ 100</div>
                </div>
              </div>
              <div className="skor-bar">
                <div className="skor-fill" style={{ width: `${calc.skor}%`, background: verdict.color }} />
              </div>
              <div style={{ marginTop: 14, padding: "14px 16px", background: verdict.color+"08", border: `1px solid ${verdict.color}33`, borderRadius: 10 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: verdict.color, marginBottom: 6 }}>{verdict.label}</div>
                <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{verdict.desc}</div>
              </div>
            </div>

            {/* Metrik Finansial */}
            <div style={card}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Estimasi Finansial</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Profit per Unit", value: fmt(calc.profitPerUnit), color: calc.profitPerUnit >= 0 ? "#22c55e" : "#ef4444" },
                  { label: "Margin", value: pct(calc.margin), color: calc.margin >= 20 ? "#22c55e" : calc.margin >= 10 ? "#f59e0b" : "#ef4444" },
                  { label: "Est. Unit/Bulan", value: calc.estiUnitBulan + " unit", color: "#4fc8a0" },
                  { label: "Est. Omzet/Bulan", value: fmt(calc.estiOmzet), color: "#f5a623" },
                  { label: "Est. Profit/Bulan", value: fmt(calc.estiProfit), color: calc.estiProfit >= 0 ? "#22c55e" : "#ef4444" },
                  { label: "Stok Awal (dari modal)", value: calc.stokAwal + " unit", color: "#7c6fcd" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#111115", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Break Even */}
              <div style={{ padding: "14px 16px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, color: "#f5a623", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Break-even Point</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 4 }}>Unit yang Harus Terjual</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#f5a623" }}>{calc.bepUnit}</div>
                    <div style={{ fontSize: 10, color: "#6b6a78" }}>unit untuk balik modal</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 4 }}>Estimasi Waktu BEP</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#f5a623" }}>{calc.bepBulan}</div>
                    <div style={{ fontSize: 10, color: "#6b6a78" }}>bulan</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perbandingan semua riset */}
            {risetList.length > 1 && (
              <div style={card}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Perbandingan Semua Produk Diriset</div>
                {risetList.map(r => {
                  const c = calcKelayakan(r, fees);
                  const v = getVerdict(c.skor, c.margin);
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1e1e23", cursor: "pointer" }}
                      onClick={() => { setActiveId(r.id); }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{r.nama || "Produk Baru"}</div>
                        <div className="skor-bar" style={{ height: 4 }}>
                          <div className="skor-fill" style={{ width: `${c.skor}%`, background: v.color }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: v.color }}>{c.skor}</div>
                        <div style={{ fontSize: 10, color: v.color }}>{v.label.split(" ").slice(1).join(" ")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB CHECKLIST ===== */}
        {activeTab === "checklist" && active && (
          <div className="animate">
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>Checklist Riset Produk</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: (active.checklist?.length||0) === CHECKLIST_ITEMS.length ? "#22c55e" : "#f5a623" }}>
                  {active.checklist?.length||0}/{CHECKLIST_ITEMS.length}
                </div>
              </div>
              <div style={{ height: 4, background: "#1e1e23", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", width: `${((active.checklist?.length||0)/CHECKLIST_ITEMS.length)*100}%`, background: "#22c55e", borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 16 }}>
                Centang semua item sebelum memutuskan order stok pertama.
              </div>
              {CHECKLIST_ITEMS.map((item, i) => {
                const checked = active.checklist?.includes(item);
                return (
                  <div key={i} className={`check-item ${checked?"checked":""}`} onClick={() => toggleChecklist(item)}>
                    <div style={{ width: 20, height: 20, border: `2px solid ${checked?"#22c55e":"#2a2a32"}`, borderRadius: 4, background: checked?"#22c55e":"transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", marginTop: 1 }}>
                      {checked && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: checked ? "#f0eff4" : "#aaa", lineHeight: 1.5 }}>{item}</span>
                  </div>
                );
              })}

              {(active.checklist?.length||0) === CHECKLIST_ITEMS.length && (
                <div style={{ marginTop: 16, padding: "14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#22c55e", marginBottom: 4 }}>Riset Lengkap!</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>Semua checklist sudah selesai. Kamu siap untuk keputusan order pertama.</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
