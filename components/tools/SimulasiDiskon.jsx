import { useState, useMemo } from "react";

const fmt = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pct = (n) => n.toFixed(2) + "%";

const DEFAULT_FEES = {
  shopee: { komisi: 4, dinamis: 2, cashback: 3.5, pemrosesan: 1000, affiliasi: 3 },
  tiktok: { komisi: 8, dinamis: 5, cashback: 3.5, pemrosesan: 1250, affiliasi: 5 },
};

const SCENARIOS = [10, 20, 30];

function calcProfit(hpp, hargaJual, diskonRp, tanggungan, fees, voucherOngkir, nominalVoucher = 10000) {
  const sellerDiskon = tanggungan === "seller" ? diskonRp
    : tanggungan === "split" ? diskonRp * 0.5
    : tanggungan === "marketplace" ? 0
    : 0;

  const hargaFinal = hargaJual - diskonRp;
  const baseCalc = tanggungan === "marketplace" ? hargaJual : hargaFinal;

  const komisiRp = (baseCalc * fees.komisi) / 100;
  const dinamisRp = (baseCalc * fees.dinamis) / 100;
  const cashbackRp = (baseCalc * fees.cashback) / 100;
  const pemrosesanRp = fees.pemrosesan;
  const affiliasiRp = (baseCalc * fees.affiliasi) / 100;

  const totalFeePct = fees.komisi + fees.dinamis + fees.cashback + fees.affiliasi;
  const totalFeeRp = (baseCalc * totalFeePct) / 100 + fees.pemrosesan;
  const voucherRp = voucherOngkir ? nominalVoucher : 0;

  const pendapatanBersih = hargaFinal - sellerDiskon;
  const profit = pendapatanBersih - hpp - totalFeeRp - voucherRp;
  const profitPct = hargaFinal > 0 ? (profit / hargaFinal) * 100 : 0;
  const profitTanpaDiskon = hargaJual - hpp - ((hargaJual * totalFeePct) / 100 + fees.pemrosesan) - voucherRp;

  return {
    hargaFinal, sellerDiskon, totalFeeRp, voucherRp,
    profit, profitPct, profitTanpaDiskon,
    pendapatanBersih,
    dampak: profit - profitTanpaDiskon,
    komisiRp, dinamisRp, cashbackRp, pemrosesanRp, affiliasiRp,
  };
}

function StatusBadge({ profitPct }) {
  if (profitPct >= 20) return <span style={badgeStyle("#22c55e")}>✓ Aman</span>;
  if (profitPct >= 10) return <span style={badgeStyle("#f59e0b")}>⚡ Hati-hati</span>;
  if (profitPct >= 0)  return <span style={badgeStyle("#ef4444")}>⚠️ Tipis</span>;
  return <span style={badgeStyle("#dc2626")}>✕ Rugi</span>;
}

function badgeStyle(color) {
  return {
    background: color + "18",
    border: `1px solid ${color}44`,
    color,
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 4,
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.05em",
  };
}

export default function App() {
  const [platform, setPlatform] = useState("tiktok");
  const [form, setForm] = useState({ hpp: 26000, hargaJual: 43000 });
  const [tipeDiskon, setTipeDiskon] = useState("persen"); // persen | nominal
  const [nilaiDiskon, setNilaiDiskon] = useState(20);
  const [tanggungan, setTanggungan] = useState("seller"); // seller | marketplace | split
  const [voucherOngkir, setVoucherOngkir] = useState(false);
  const [nominalVoucher, setNominalVoucher] = useState(10000);
  const [showFee, setShowFee] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [fees, setFees] = useState({ ...DEFAULT_FEES });

  const f = fees[platform];

  const diskonRp = useMemo(() => {
    return tipeDiskon === "persen"
      ? (form.hargaJual * nilaiDiskon) / 100
      : nilaiDiskon;
  }, [tipeDiskon, nilaiDiskon, form.hargaJual]);

  const result = useMemo(() =>
    calcProfit(form.hpp, form.hargaJual, diskonRp, tanggungan, f, voucherOngkir, nominalVoucher),
    [form, diskonRp, tanggungan, f, voucherOngkir, nominalVoucher]
  );

  const scenarios = useMemo(() =>
    SCENARIOS.map(p => {
      const dRp = (form.hargaJual * p) / 100;
      return { pct: p, dRp, ...calcProfit(form.hpp, form.hargaJual, dRp, tanggungan, f, voucherOngkir, nominalVoucher) };
    }),
    [form, tanggungan, f, voucherOngkir, nominalVoucher]
  );

  // Hitung maks diskon yang masih profit (profit >= 0)
  const maxDiskon = useMemo(() => {
    for (let d = 99; d >= 0; d--) {
      const dRp = (form.hargaJual * d) / 100;
      const r = calcProfit(form.hpp, form.hargaJual, dRp, tanggungan, f, voucherOngkir, nominalVoucher);
      if (r.profit >= 0) return { pct: d, rp: dRp };
    }
    return { pct: 0, rp: 0 };
  }, [form, tanggungan, f, voucherOngkir, nominalVoucher]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));
  const card = { background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: 20, marginBottom: 16 };
  const inputStyle = { width: "100%", background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "10px 12px", color: "var(--text-main)", fontWeight: 700, fontSize: 14, outline: "none" };
  const label = { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 6 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-main)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #f5a623; cursor: pointer; border: 2px solid var(--bg-base); }
        .toggle-btn { border: 1.5px solid var(--border-strong); background: transparent; color: var(--text-muted); border-radius: 8px; padding: 8px 16px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.18s; letter-spacing: 0.04em; }
        .toggle-btn.active { background: rgba(245,166,35,0.12); border-color: #f5a623; color: #f5a623; }
        .platform-btn { border: 1.5px solid var(--border-strong); background: transparent; border-radius: 8px; padding: 8px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.18s; }
        .platform-btn.shopee { background: rgba(238,77,45,0.12); border-color: #ee4d2d; color: #ee4d2d; }
        .platform-btn.tiktok { background: rgba(128,128,128,0.1); border-color: #aaa; color: var(--text-main); }
        .platform-btn.off { color: var(--text-muted); }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
        .row:last-child { border-bottom: none; }
        .animate { animation: up 0.35s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--border-strong); }
        .sc-card { background: var(--nav-bg); border: 1px solid var(--border-strong); border-radius: 10px; padding: 14px; flex: 1; min-width: 0; transition: border-color 0.2s; }
        .sc-card.rugi { border-color: rgba(220,38,38,0.4); }
        .sc-card.tipis { border-color: rgba(245,158,11,0.3); }
        .sc-card.aman { border-color: rgba(34,197,94,0.3); }
        .checkbox-row { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px 14px; border: 1.5px solid var(--border-strong); border-radius: 8px; transition: all 0.18s; }
        .checkbox-row:hover { border-color: #f5a62366; }
        .checkbox-row.on { border-color: #f5a623; background: rgba(245,166,35,0.06); }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "16px 20px", background: "var(--bg-base)", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <button onClick={() => setShowFee(!showFee)} style={{ background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 14px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
          ⚙️ Fee Setting
        </button>
      </div>

      {/* Fee Setting */}
      {showFee && (
        <div style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--border-strong)", padding: "20px" }} className="animate">
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>⚙️ Fee Default</span>
              <button onClick={() => setFees({ ...DEFAULT_FEES })} style={{ fontSize: 11, color: "#f5a623", background: "none", border: "none", cursor: "pointer" }}>Reset</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {["shopee", "tiktok"].map(p => (
                <div key={p}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p === "shopee" ? "#ee4d2d" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    {p === "shopee" ? "🛍 Shopee" : "🎵 TikTok Shop"}
                  </div>
                  {[["komisi","Komisi Platform","%"],["dinamis","Komisi Dinamis","%"],["cashback","Cashback Bonus","%"],["pemrosesan","Biaya Pemrosesan","Rp"],["affiliasi","Affiliasi","%"]].map(([k, lbl, u]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>{lbl}</span>
                      <input type="number" step="0.01" value={fees[p][k]}
                        onChange={e => setFees(prev => ({ ...prev, [p]: { ...prev[p], [k]: parseFloat(e.target.value) || 0 } }))}
                        style={{ width: 72, background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 6, padding: "4px 8px", color: "var(--text-main)", fontWeight: 600, fontSize: 13, textAlign: "right", outline: "none" }}
                      />
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 18 }}>{u}</span>
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

        {/* Input Produk */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Input Produk</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["hpp", "HPP (Harga Pokok)"], ["hargaJual", "Harga Jual Normal"]].map(([k, lbl]) => (
              <div key={k}>
                <label style={label}>{lbl}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
                  <input type="number" style={{ ...inputStyle, paddingLeft: 36 }} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pengaturan Diskon */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Pengaturan Diskon</div>

          {/* Tipe diskon */}
          <label style={label}>Tipe Diskon</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className={`toggle-btn ${tipeDiskon === "persen" ? "active" : ""}`} onClick={() => setTipeDiskon("persen")}>Persentase (%)</button>
            <button className={`toggle-btn ${tipeDiskon === "nominal" ? "active" : ""}`} onClick={() => setTipeDiskon("nominal")}>Nominal (Rp)</button>
          </div>

          {/* Nilai diskon */}
          <label style={label}>{tipeDiskon === "persen" ? `Besar Diskon — ${nilaiDiskon}%` : "Besar Diskon"}</label>
          {tipeDiskon === "persen" ? (
            <>
              <input type="range" min={0} max={80} step={1}
                value={nilaiDiskon}
                onChange={e => setNilaiDiskon(parseInt(e.target.value))}
                style={{ accentColor: "#f5a623", background: `linear-gradient(to right, #f5a623 ${nilaiDiskon/80*100}%, #2a2a32 ${nilaiDiskon/80*100}%)` }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a78", marginTop: 4, marginBottom: 8 }}>
                <span>0%</span><span style={{ color: "#f5a623", fontWeight: 700 }}>{nilaiDiskon}% = {fmt(diskonRp)}</span><span>80%</span>
              </div>
            </>
          ) : (
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
              <input type="number" style={{ ...inputStyle, paddingLeft: 36 }} value={nilaiDiskon} onChange={e => setNilaiDiskon(parseFloat(e.target.value) || 0)} />
            </div>
          )}

          {/* Tanggungan */}
          <label style={{ ...label, marginTop: 12 }}>Diskon Ditanggung Oleh</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {[["seller","Seller"], ["marketplace","Marketplace"], ["split","Split 50/50"]].map(([v, lbl]) => (
              <button key={v} className={`toggle-btn ${tanggungan === v ? "active" : ""}`} onClick={() => setTanggungan(v)}>{lbl}</button>
            ))}
          </div>

          {/* Voucher ongkir */}
          <div className={`checkbox-row ${voucherOngkir ? "on" : ""}`} onClick={() => setVoucherOngkir(v => !v)}>
            <div style={{ width: 18, height: 18, border: `2px solid ${voucherOngkir ? "#f5a623" : "#2a2a32"}`, borderRadius: 4, background: voucherOngkir ? "#f5a623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}>
              {voucherOngkir && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Voucher Gratis Ongkir (Seller Tanggung)</div>
              <div style={{ fontSize: 11, color: "#6b6a78" }}>Centang untuk aktifkan, isi nominal di bawah</div>
            </div>
          </div>
          {voucherOngkir && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8 }} className="animate">
              <span style={{ fontSize: 12, color: "#6b6a78", whiteSpace: "nowrap" }}>Nominal Ongkir</span>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#6b6a78" }}>Rp</span>
                <input
                  type="number"
                  onClick={e => e.stopPropagation()}
                  value={nominalVoucher}
                  onChange={e => setNominalVoucher(parseFloat(e.target.value) || 0)}
                  style={{ width: "100%", background: "#f0eff4", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "#000", fontWeight: 700, fontSize: 14, outline: "none" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hasil Simulasi Diskon Aktif */}
        <div style={{ ...card, borderColor: result.profit >= 0 ? (result.profitPct >= 20 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)") : "rgba(220,38,38,0.4)" }} className="animate">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hasil Simulasi</div>
            <StatusBadge profitPct={result.profitPct} />
          </div>

          <div className="row"><span style={{ color: "#aaa" }}>Harga Jual Normal</span><span style={{ fontWeight: 600 }}>{fmt(form.hargaJual)}</span></div>
          <div className="row"><span style={{ color: "#aaa" }}>Diskon ({tipeDiskon === "persen" ? nilaiDiskon + "%" : fmt(nilaiDiskon)})</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(diskonRp)}</span></div>
          {tanggungan !== "seller" && <div className="row"><span style={{ color: "#aaa" }}>Beban Diskon ke Seller</span><span style={{ color: "#f59e0b", fontWeight: 600 }}>-{fmt(result.sellerDiskon)}</span></div>}
          <div className="row"><span style={{ color: "#aaa" }}>Harga Final Pembeli Bayar</span><span style={{ fontWeight: 600 }}>{fmt(result.hargaFinal)}</span></div>
          {/* Total Fee Marketplace dengan rincian */}
          <div style={{ padding: "9px 0", borderBottom: "1px solid #1e1e23" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowBreakdown(!showBreakdown)}>
              <span style={{ fontSize: 13, color: "#aaa" }}>Total Fee Marketplace</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(result.totalFeeRp)}</span>
                <span style={{ fontSize: 10, color: "#6b6a78" }}>{showBreakdown ? "▲" : "▼"} rincian</span>
              </div>
            </div>
            {showBreakdown && (
              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #2a2a32" }} className="animate">
                {[
                  [`Komisi Platform (${f.komisi}%)`, result.komisiRp],
                  [`Komisi Dinamis (${f.dinamis}%)`, result.dinamisRp],
                  [`Cashback Bonus (${f.cashback}%)`, result.cashbackRp],
                  [`Biaya Pemrosesan`, result.pemrosesanRp],
                  [`Affiliasi (${f.affiliasi}%)`, result.affiliasiRp],
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
          {voucherOngkir && <div className="row"><span style={{ color: "#aaa" }}>Beban Voucher Ongkir</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(result.voucherRp)}</span></div>}
          <div className="row"><span style={{ color: "#aaa" }}>HPP</span><span style={{ color: "#ef4444", fontWeight: 600 }}>-{fmt(form.hpp)}</span></div>

          {/* Profit tanpa diskon vs dengan diskon */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div style={{ background: "#111115", borderRadius: 10, padding: "12px 14px", border: "1px solid #2a2a32" }}>
              <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profit Tanpa Diskon</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#aaa" }}>{fmt(result.profitTanpaDiskon)}</div>
              <div style={{ fontSize: 10, color: "#6b6a78", marginTop: 2 }}>{pct(result.profitTanpaDiskon / form.hargaJual * 100)} margin</div>
            </div>
            <div style={{ background: result.profit >= 0 ? "rgba(34,197,94,0.06)" : "rgba(220,38,38,0.06)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${result.profit >= 0 ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}` }}>
              <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profit Setelah Diskon</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: result.profit >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(result.profit)}</div>
              <div style={{ fontSize: 10, color: result.profit >= 0 ? "#22c55e" : "#ef4444", marginTop: 2 }}>{pct(result.profitPct)} margin</div>
            </div>
          </div>

          {/* Dampak */}
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#0d0d0f", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b6a78" }}>Dampak Diskon ke Profit</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: result.dampak >= 0 ? "#22c55e" : "#ef4444" }}>
              {result.dampak >= 0 ? "+" : ""}{fmt(result.dampak)}
            </span>
          </div>

          {/* Maks diskon */}
          <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 2 }}>💡 Maksimum Diskon yang Masih Profit</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#f5a623" }}>
              {maxDiskon.pct}% ({fmt(maxDiskon.rp)})
            </div>
          </div>
        </div>

        {/* Perbandingan 3 Skenario */}
        <div style={card}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f5a623", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Perbandingan Skenario</div>
          <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 16 }}>Simulasi diskon 10%, 20%, 30% dengan pengaturan tanggungan saat ini.</div>
          <div style={{ display: "flex", gap: 10 }}>
            {scenarios.map(s => {
              const cls = s.profitPct >= 20 ? "aman" : s.profitPct >= 0 ? "tipis" : "rugi";
              const clr = s.profitPct >= 20 ? "#22c55e" : s.profitPct >= 10 ? "#f59e0b" : s.profitPct >= 0 ? "#ef4444" : "#dc2626";
              return (
                <div key={s.pct} className={`sc-card ${cls}`}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: clr, marginBottom: 4 }}>{s.pct}%</div>
                  <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 2 }}>-{fmt(s.dRp)}</div>
                  <div style={{ width: "100%", height: 1, background: "#2a2a32", margin: "8px 0" }} />
                  <div style={{ fontSize: 11, color: "#6b6a78" }}>Profit</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: clr }}>{fmt(s.profit)}</div>
                  <div style={{ fontSize: 11, color: clr, marginTop: 2 }}>{pct(s.profitPct)}</div>
                  <div style={{ marginTop: 8 }}><StatusBadge profitPct={s.profitPct} /></div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
