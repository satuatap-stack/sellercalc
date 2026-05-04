import { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

// ============================================================
// MAPPING CONFIG — sesuai struktur file export asli
// ============================================================
const MAPPING = {
  shopee_income: {
    label: "Shopee Income",
    platform: "shopee",
    type: "income",
    headerRow: 5, // 0-indexed, row ke-6
    detect: (headers) => headers.some(h => h && h.includes("Harga Asli Produk")),
    fields: {
      orderId: "No. Pesanan",
      tanggal: "Waktu Pesanan Dibuat",
      tanggalRelease: "Tanggal Dana Dilepaskan",
      hargaProduk: "Harga Asli Produk",
      diskonProduk: "Total Diskon Produk",
      totalPenghasilan: "Total Penghasilan",
      biayaLayanan: "Biaya Layanan",
      biayaAdmin: "Biaya Administrasi",
      biayaKomisi: "Biaya Komisi AMS",
      refund: "Jumlah Pengembalian Dana ke Pembeli",
      metodeBayar: "Metode pembayaran pembeli",
    }
  },
  shopee_sales: {
    label: "Shopee Sales Overview",
    platform: "shopee",
    type: "sales",
    headerRow: 3, // row ke-4 (0-indexed)
    detect: (headers) => headers.some(h => h && h.includes("Total Pengunjung (Kunjungan)")) && headers.some(h => h && h.includes("Penjualan (Pesanan Dibuat)")),
    fields: {
      tanggal: "Tanggal",
      pengunjung: "Total Pengunjung (Kunjungan)",
      pembeli: "Total Pembeli (Pesanan Dibuat)",
      produkDipesan: "Total Produk Dipesan",
      omzet: "Penjualan (Pesanan Dibuat) (IDR)",
      konversi: "Tingkat Konversi (Pesanan Dibuat dibagi Kunjungan)",
      omzetSiap: "Penjualan (Pesanan Siap Dikirim) (IDR)",
    }
  },
  shopee_product: {
    label: "Shopee Product Overview",
    platform: "shopee",
    type: "product",
    headerRow: 0,
    detect: (headers) => headers.some(h => h && h.includes("Pengunjung Produk (Kunjungan)")) && headers.some(h => h && h.includes("Klik Pencarian")),
    fields: {
      tanggal: "Tanggal",
      pengunjung: "Pengunjung Produk (Kunjungan)",
      halamanDilihat: "Halaman Produk Dilihat",
      keranjang: "Dimasukkan ke Keranjang (Produk)",
      pembeli: "Total Pembeli (Pesanan Dibuat)",
      omzet: "Total Penjualan (Pesanan Dibuat) (IDR)",
      konversi: "Tingkat Konversi (Pesanan yang Dibuat)",
      klikPencarian: "Klik Pencarian",
    }
  },
  tiktok_income: {
    label: "TikTok Income",
    platform: "tiktok",
    type: "income",
    headerRow: 0,
    detect: (headers) => headers.some(h => h && h.includes("Order/adjustment ID")),
    fields: {
      orderId: "Order/adjustment ID",
      tanggal: "Order created time",
      tanggalSettle: "Order settled time",
      revenue: "Total Revenue",
      settlement: "Total settlement amount",
      totalFees: "Total Fees",
      komisi: "Platform commission fee",
      paymentFee: "Payment Fee",
      refund: "Refund subtotal after seller discounts",
      type: "Type",
    }
  },
  tiktok_analytics: {
    label: "TikTok Analytics",
    platform: "tiktok",
    type: "analytics",
    headerRow: 8, // row ke-9 (0-indexed)
    detect: (headers) => headers.some(h => h && h === "GMV") || headers.some(h => h && h.includes("Pendapatan bruto")),
    fields: {
      tanggal: "Tanggal",
      gmv: "GMV",
      pesanan: "Pesanan",
      pembeli: "Pembeli",
      produkTerjual: "Produk terjual",
      pendapatanBruto: "Pendapatan bruto",
      pengunjung: "Pengunjung",
      tayangan: "Tayangan halaman",
      konversi: "Persentase konversi",
      impresi: "Impresi produk",
      klikProduk: "Klik produk",
      aov: "AOV",
    }
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const fmt = (n) => {
  if (!n && n !== 0) return "-";
  const num = typeof n === "string" ? parseFloat(n.replace(/[.,]/g, m => m === "." && n.indexOf(",") > -1 ? "" : m === "," ? "." : ".")) : n;
  if (isNaN(num)) return "-";
  return "Rp " + Math.round(num).toLocaleString("id-ID");
};

const fmtNum = (n) => {
  if (!n && n !== 0) return "-";
  return Number(n).toLocaleString("id-ID");
};

const parseNum = (v) => {
  if (v === null || v === undefined || v === "-") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[Rp\s]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(s) || 0;
};

const parsePct = (v) => {
  if (!v) return 0;
  return parseFloat(String(v).replace("%", "").replace(",", ".")) || 0;
};

const parseDate = (v) => {
  if (!v) return null;
  const s = String(v);
  if (s.includes("/")) {
    const [d, m, y] = s.split("/");
    return `${y}-${m}-${d}`;
  }
  if (s.includes("-")) return s.substring(0, 10);
  return s;
};

function detectMapping(data) {
  for (const [key, config] of Object.entries(MAPPING)) {
    const headers = data[config.headerRow] || [];
    if (config.detect(headers)) return { key, config };
  }
  return null;
}

function parseExcelData(rawData, config) {
  const headerRow = rawData[config.headerRow];
  if (!headerRow) return [];

  const colIndex = {};
  headerRow.forEach((h, i) => {
    if (h) {
      Object.entries(config.fields).forEach(([fieldKey, fieldName]) => {
        if (String(h).trim() === fieldName.trim() || String(h).trim().includes(fieldName.trim())) {
          colIndex[fieldKey] = i;
        }
      });
    }
  });

  const result = [];
  for (let i = config.headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[colIndex.tanggal]) continue;
    const entry = { _row: i };
    Object.entries(colIndex).forEach(([key, idx]) => {
      entry[key] = row[idx];
    });
    result.push(entry);
  }
  return result;
}

// ============================================================
// STRATEGY ENGINE
// ============================================================
function generateInsights(datasets) {
  const insights = [];
  const shopee = datasets.filter(d => d.platform === "shopee");
  const tiktok = datasets.filter(d => d.platform === "tiktok");

  // CR Analysis
  const shopeeAnalytics = shopee.find(d => d.type === "sales" || d.type === "product");
  const tiktokAnalytics = tiktok.find(d => d.type === "analytics");

  if (shopeeAnalytics?.daily?.length > 0) {
    const avgCR = shopeeAnalytics.daily.reduce((s, d) => s + (d.konversi || 0), 0) / shopeeAnalytics.daily.length;
    if (avgCR < 2) {
      insights.push({ type: "warning", platform: "shopee", title: "Konversi Rate Shopee Rendah", desc: `CR rata-rata ${avgCR.toFixed(2)}% di bawah benchmark 2%. Optimalkan foto utama, judul produk, dan pastikan harga kompetitif.`, action: "Cek kualitas listing produk" });
    } else if (avgCR > 4) {
      insights.push({ type: "success", platform: "shopee", title: "Konversi Rate Shopee Sangat Baik", desc: `CR rata-rata ${avgCR.toFixed(2)}% — di atas benchmark. Pertimbangkan naikkan anggaran iklan untuk scale traffic.`, action: "Scale iklan" });
    }
  }

  if (tiktokAnalytics?.daily?.length > 0) {
    const avgCR = tiktokAnalytics.daily.reduce((s, d) => s + (parsePct(d.konversi) * 100 || 0), 0) / tiktokAnalytics.daily.length;
    if (avgCR < 1.5) {
      insights.push({ type: "warning", platform: "tiktok", title: "Konversi Rate TikTok Perlu Ditingkatkan", desc: `CR TikTok rata-rata ${avgCR.toFixed(2)}%. Coba perbaiki hook video pertama 3 detik dan tambahkan CTA yang lebih kuat.`, action: "Perbaiki konten video" });
    }
    // Traffic spike detection
    const gmvData = tiktokAnalytics.daily.filter(d => d.gmv > 0);
    if (gmvData.length > 3) {
      const maxDay = gmvData.reduce((a, b) => parseNum(a.gmv) > parseNum(b.gmv) ? a : b);
      insights.push({ type: "info", platform: "tiktok", title: "Hari Terbaik TikTok", desc: `GMV tertinggi pada ${maxDay.tanggal}: ${fmt(parseNum(maxDay.gmv))}. Jadwalkan live selling & konten baru di hari/jam serupa.`, action: "Optimalkan jadwal posting" });
    }
  }

  // Cross-platform comparison
  if (shopee.length > 0 && tiktok.length > 0) {
    insights.push({ type: "info", platform: "both", title: "Data Kedua Platform Tersedia", desc: "Kamu bisa bandingkan performa Shopee vs TikTok Shop secara berdampingan. Fokuskan budget iklan ke platform dengan CR lebih tinggi.", action: "Lihat tab Perbandingan" });
  }

  // Income analysis
  const shopeeIncome = shopee.find(d => d.type === "income");
  const tiktokIncome = tiktok.find(d => d.type === "income");
  if (shopeeIncome?.rows?.length > 0) {
    const totalNet = shopeeIncome.rows.reduce((s, r) => s + parseNum(r.totalPenghasilan), 0);
    const totalGross = shopeeIncome.rows.reduce((s, r) => s + parseNum(r.hargaProduk), 0);
    if (totalGross > 0) {
      const feeRatio = ((totalGross - totalNet) / totalGross) * 100;
      if (feeRatio > 20) {
        insights.push({ type: "warning", platform: "shopee", title: "Fee Shopee Cukup Tinggi", desc: `Total fee & potongan Shopee sekitar ${feeRatio.toFixed(1)}% dari omzet kotor. Pastikan harga jual sudah memperhitungkan semua potongan ini.`, action: "Review pricing strategy" });
      }
    }
  }

  if (insights.length === 0) {
    insights.push({ type: "info", platform: "both", title: "Upload lebih banyak file", desc: "Upload data dari kedua platform untuk mendapatkan insight yang lebih komprehensif.", action: "Upload file" });
  }

  return insights;
}

// ============================================================
// CUSTOM TOOLTIP
// ============================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e1e23", border: "1px solid #2a2a32", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#6b6a78", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value >= 1000 ? fmt(p.value) : p.value}</div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MarketplaceAnalytics() {
  const [datasets, setDatasets] = useState([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mappingOverride, setMappingOverride] = useState({});
  const [showManualMapping, setShowManualMapping] = useState(null);

  const dashboardRef = useRef(null);
  const trenRef = useRef(null);
  const incomeRef = useRef(null);
  const compareRef = useRef(null);
  const insightRef = useRef(null);

  const exportRefMap = {
    dashboard: dashboardRef,
    tren: trenRef,
    income: incomeRef,
    perbandingan: compareRef,
    insight: insightRef
  };

  const exportAsImage = async () => {
    const ref = exportRefMap[activeTab];
    if (!ref?.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: "#0d0d0f",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `cupu-${activeTab}-${Date.now()}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    const ref = exportRefMap[activeTab];
    if (!ref?.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: "#0d0d0f",
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "l" : "p",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      pdf.save(`cupu-${activeTab}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleFiles = useCallback(async (files) => {
    setUploading(true);
    const newDatasets = [];

    for (const file of files) {
      try {
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type: "array" });

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
          if (!raw || raw.length < 2) continue;

          const detected = detectMapping(raw);
          if (detected) {
            const { key, config } = detected;
            const rows = parseExcelData(raw, config);
            if (rows.length === 0) continue;

            // Build daily data
            const daily = rows.map(r => {
              const entry = { tanggal: parseDate(r.tanggal) };
              Object.keys(config.fields).forEach(k => {
                if (k === "tanggal") return;
                const v = r[k];
                if (String(v || "").includes("%")) entry[k] = parsePct(v);
                else entry[k] = parseNum(v);
              });
              return entry;
            }).filter(d => d.tanggal).sort((a, b) => a.tanggal?.localeCompare(b.tanggal));

            newDatasets.push({
              id: Date.now() + Math.random(),
              fileName: file.name,
              sheetName,
              platform: config.platform,
              type: config.type,
              label: config.label,
              mappingKey: key,
              rows,
              daily,
              rawHeaders: raw[config.headerRow] || [],
            });
          }
        }
      } catch (e) {
        console.error("Error reading file:", file.name, e);
      }
    }

    setDatasets(prev => [...prev, ...newDatasets]);
    setUploading(false);
    if (newDatasets.length > 0) setActiveTab("dashboard");
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"));
    if (files.length) handleFiles(files);
  };

  const removeDataset = (id) => setDatasets(prev => prev.filter(d => d.id !== id));

  // Aggregate data for charts
  const chartData = useMemo(() => {
    const shopeeAnalytics = datasets.find(d => d.platform === "shopee" && (d.type === "sales" || d.type === "product"));
    const tiktokAnalytics = datasets.find(d => d.platform === "tiktok" && d.type === "analytics");
    const shopeeIncome = datasets.find(d => d.platform === "shopee" && d.type === "income");
    const tiktokIncome = datasets.find(d => d.platform === "tiktok" && d.type === "income");

    // Combined daily trend
    const dateMap = {};
    if (shopeeAnalytics?.daily) {
      shopeeAnalytics.daily.forEach(d => {
        if (!dateMap[d.tanggal]) dateMap[d.tanggal] = { tanggal: d.tanggal };
        dateMap[d.tanggal].shopee_omzet = d.omzet || 0;
        dateMap[d.tanggal].shopee_pengunjung = d.pengunjung || 0;
        dateMap[d.tanggal].shopee_pembeli = d.pembeli || 0;
        dateMap[d.tanggal].shopee_konversi = d.konversi || 0;
      });
    }
    if (tiktokAnalytics?.daily) {
      tiktokAnalytics.daily.forEach(d => {
        if (!dateMap[d.tanggal]) dateMap[d.tanggal] = { tanggal: d.tanggal };
        dateMap[d.tanggal].tiktok_gmv = parseNum(d.gmv) || 0;
        dateMap[d.tanggal].tiktok_pengunjung = parseNum(d.pengunjung) || 0;
        dateMap[d.tanggal].tiktok_pesanan = parseNum(d.pesanan) || 0;
        dateMap[d.tanggal].tiktok_konversi = parsePct(d.konversi) * 100 || 0;
      });
    }

    const combined = Object.values(dateMap).sort((a, b) => a.tanggal?.localeCompare(b.tanggal));

    // Summary stats
    const shopeeOmzetTotal = shopeeAnalytics?.daily?.reduce((s, d) => s + (d.omzet || 0), 0) || 0;
    const tiktokGmvTotal = tiktokAnalytics?.daily?.reduce((s, d) => s + parseNum(d.gmv), 0) || 0;
    const shopeeNetTotal = shopeeIncome?.rows?.reduce((s, r) => s + parseNum(r.totalPenghasilan), 0) || 0;
    const tiktokNetTotal = tiktokIncome?.rows?.reduce((s, r) => s + parseNum(r.settlement), 0) || 0;
    const shopeeOrderCount = shopeeIncome?.rows?.length || 0;
    const tiktokOrderCount = tiktokIncome?.rows?.filter(r => r.type === "Order")?.length || tiktokIncome?.rows?.length || 0;
    const shopeeFeesTotal = shopeeIncome?.rows?.reduce((s, r) => s + (parseNum(r.hargaProduk) - parseNum(r.totalPenghasilan)), 0) || 0;
    const tiktokFeesTotal = tiktokIncome?.rows?.reduce((s, r) => s + Math.abs(parseNum(r.totalFees)), 0) || 0;

    // TikTok income by date
    if (tiktokIncome?.rows) {
      tiktokIncome.rows.forEach(r => {
        const tgl = parseDate(r.tanggalSettle || r.tanggal);
        if (!tgl) return;
        if (!dateMap[tgl]) dateMap[tgl] = { tanggal: tgl };
        dateMap[tgl].tiktok_net = (dateMap[tgl].tiktok_net || 0) + parseNum(r.settlement);
      });
    }

    // Method payment distribution (Shopee)
    const paymentDist = {};
    if (shopeeIncome?.rows) {
      shopeeIncome.rows.forEach(r => {
        const m = r.metodeBayar || "Lainnya";
        paymentDist[m] = (paymentDist[m] || 0) + 1;
      });
    }

    return {
      combined,
      shopeeOmzetTotal, tiktokGmvTotal,
      shopeeNetTotal, tiktokNetTotal,
      shopeeOrderCount, tiktokOrderCount,
      shopeeFeesTotal, tiktokFeesTotal,
      totalOmzet: shopeeOmzetTotal + tiktokGmvTotal,
      totalNet: shopeeNetTotal + tiktokNetTotal,
      paymentDist: Object.entries(paymentDist).map(([name, value]) => ({ name, value })),
    };
  }, [datasets]);

  const insights = useMemo(() => generateInsights(datasets), [datasets]);

  const COLORS = { shopee: "#ee4d2d", tiktok: "#f5a623", both: "#4fc8a0" };
  const PIE_COLORS = ["#f5a623", "#4fc8a0", "#7c6fcd", "#ee4d2d", "#aaa"];

  const tabBtn = (id, label, icon) => (
    <button onClick={() => setActiveTab(id)}
      style={{ padding: "10px 16px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", border: "none", background: "transparent", transition: "all 0.18s", borderBottom: `2px solid ${activeTab === id ? "#f5a623" : "transparent"}`, color: activeTab === id ? "#f5a623" : "#6b6a78" }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0eff4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 2px; }
        .animate { animation: up 0.3s ease forwards; }
        @keyframes up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        
        .glass-card {
          background: #161619;
          border: 1px solid #2a2a32;
          border-radius: 1.5rem;
          transition: all 0.2s ease;
        }
        .btn-fancy {
          background: #161619;
          border: 1px solid #2a2a32;
          border-radius: 10px;
          padding: 8px 16px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 11px;
          color: #6b6a78;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .btn-fancy:hover { border-color: #f5a623; color: #f5a623; }
        .btn-fancy.active { background: rgba(245,166,35,0.1); border-color: #f5a623; color: #f5a623; }
        
        .stat-card {
          background: #161619;
          border: 1px solid #2a2a32;
          border-radius: 1.25rem;
          padding: 20px;
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-3px); border-color: #3a3a42; }
        
        .drop-zone { 
          border: 2px dashed #2a2a32; 
          border-radius: 2rem; 
          padding: 60px 24px; 
          text-align: center; 
          transition: all 0.2s; 
          cursor: pointer; 
          background: rgba(22, 22, 25, 0.5);
        }
        .drop-zone:hover { border-color: #f5a623; background: rgba(245,166,35,0.04); }
        .platform-tag { 
          font-size: 9px; 
          font-weight: 800; 
          padding: 2px 8px; 
          border-radius: 4px; 
          font-family: 'Syne', sans-serif; 
          text-transform: uppercase;
          letter-spacing: 0.05em; 
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e23", padding: "18px 24px", background: "#0d0d0f", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "#f5a623", borderRadius: 8, display: "flex", alignItems: "center", justifyCenter: "center", fontWeight: 900, color: "black", fontSize: 18 }}>M</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f5a623", letterSpacing: "-0.02em" }}>Seller CUPU ANALYTICS</div>
            <div style={{ fontSize: 10, color: "#6b6a78", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Data Intelligence Hub</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {datasets.length > 0 && (
            <button
              onClick={() => { if(window.confirm('Hapus semua data input?')) setDatasets([]); setActiveTab("upload"); }}
              className="btn-fancy" style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }}
            >
              Reset
            </button>
          )}
          {datasets.length > 0 && (
            <div style={{ background: "rgba(79, 200, 160, 0.1)", border: "1px solid rgba(79, 200, 160, 0.2)", color: "#4fc8a0", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
              {datasets.length} Data Aktif
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e1e23", background: "#0d0d0f", padding: "0 12px" }}>
        {[
          {id: "upload", label: "Upload", icon: "📁"},
          {id: "dashboard", label: "Dashboard", icon: "📊"},
          {id: "tren", label: "Tren", icon: "📈"},
          {id: "income", label: "Keuangan", icon: "💰"},
          {id: "perbandingan", label: "Bandingkan", icon: "⚖️"},
          {id: "insight", label: `Insight (${insights.length})`, icon: "💡"},
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{ 
              padding: "16px 20px", 
              fontFamily: "'Syne', sans-serif", 
              fontWeight: 800, 
              fontSize: 11, 
              letterSpacing: "0.05em", 
              textTransform: "uppercase", 
              cursor: "pointer", 
              border: "none", 
              background: "transparent", 
              transition: "all 0.2s", 
              borderBottom: `2.5px solid ${activeTab === t.id ? "#f5a623" : "transparent"}`, 
              color: activeTab === t.id ? "#f5a623" : "#6b6a78" 
            }}
          >
            <span style={{ marginRight: 6, opacity: activeTab === t.id ? 1 : 0.5 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px 80px" }}>

        {/* Export Toolbar */}
        {activeTab !== "upload" && datasets.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 24 }}>
            <button disabled={exporting} onClick={exportAsImage} className="btn-fancy">
              🖼️ {exporting ? "..." : "JPG"}
            </button>
            <button disabled={exporting} onClick={exportAsPDF} className="btn-fancy">
              📄 {exporting ? "..." : "PDF"}
            </button>
          </div>
        )}

        {/* ===== UPLOAD TAB ===== */}
        {activeTab === "upload" && (
          <div className="animate">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Upload File Export</div>
              <div style={{ fontSize: 13, color: "#6b6a78" }}>Drag & drop atau klik untuk upload file .xlsx dari Shopee & TikTok Shop</div>
            </div>

            {/* Drop Zone */}
            <label className="drop-zone" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              <input type="file" accept=".xlsx,.xls,.csv" multiple style={{ display: "none" }} onChange={e => handleFiles(Array.from(e.target.files))} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                {uploading ? "Memproses file..." : "Drag & drop file di sini"}
              </div>
              <div style={{ fontSize: 12, color: "#6b6a78", marginBottom: 16 }}>atau klik untuk pilih file</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {["Shopee Income", "Shopee Sales Overview", "Shopee Product Overview", "TikTok Income", "TikTok Analytics"].map(t => (
                  <span key={t} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#6b6a78" }}>{t}</span>
                ))}
              </div>
            </label>

            {/* File guide */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
              {[
                { platform: "Shopee", color: "#ee4d2d", files: ["Income (Penghasilan) — dari Seller Centre → Keuangan", "Sales Overview — dari Insight → Tinjauan Penjualan", "Product Overview — dari Insight → Performa Produk"] },
                { platform: "TikTok Shop", color: "#f5a623", files: ["Income — dari Seller Centre → Finance → My Income", "Analytics — dari Seller Centre → Data → Shop Analytics"] },
              ].map(g => (
                <div key={g.platform} style={{ background: "#161619", border: `1px solid ${g.color}22`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: g.color, marginBottom: 10, textTransform: "uppercase" }}>
                    {g.platform === "Shopee" ? "🛍" : "🎵"} {g.platform}
                  </div>
                  {g.files.map(f => (
                    <div key={f} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#aaa" }}>
                      <span style={{ color: g.color, flexShrink: 0 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Uploaded datasets */}
            {datasets.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#4fc8a0" }}>✓ File Terdeteksi ({datasets.length})</div>
                {datasets.map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#161619", border: "1px solid #2a2a32", borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{d.platform === "shopee" ? "🛍" : "🎵"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: "#6b6a78" }}>{d.fileName} · {d.rows.length} baris data</div>
                    </div>
                    <span className="platform-tag" style={{ background: d.platform === "shopee" ? "rgba(238,77,45,0.1)" : "rgba(245,166,35,0.1)", color: d.platform === "shopee" ? "#ee4d2d" : "#f5a623", border: `1px solid ${d.platform === "shopee" ? "rgba(238,77,45,0.3)" : "rgba(245,166,35,0.3)"}` }}>
                      {d.platform.toUpperCase()}
                    </span>
                    <button onClick={() => removeDataset(d.id)} style={{ background: "transparent", border: "none", color: "#6b6a78", cursor: "pointer", fontSize: 18 }}>×</button>
                  </div>
                ))}
                <button onClick={() => setActiveTab("dashboard")}
                  style={{ width: "100%", marginTop: 8, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "12px", color: "#f5a623", fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                  Lihat Dashboard →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <div className="animate" ref={dashboardRef} style={{ padding: exporting ? "20px" : "0", background: exporting ? "#0d0d0f" : "transparent" }}>
            {datasets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 4 }}>Belum ada data</div>
                <button onClick={() => setActiveTab("upload")} style={{ marginTop: 12, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, padding: "10px 20px", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Upload File</button>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Total Omzet Gabungan", value: fmt(chartData.totalOmzet), sub: `Shopee ${fmt(chartData.shopeeOmzetTotal)} · TikTok ${fmt(chartData.tiktokGmvTotal)}`, color: "#f5a623" },
                    { label: "Total Net Diterima", value: fmt(chartData.totalNet), sub: `Shopee ${fmt(chartData.shopeeNetTotal)} · TikTok ${fmt(chartData.tiktokNetTotal)}`, color: "#22c55e" },
                    { label: "Total Pesanan", value: (chartData.shopeeOrderCount + chartData.tiktokOrderCount).toLocaleString("id-ID"), sub: `Shopee ${chartData.shopeeOrderCount} · TikTok ${chartData.tiktokOrderCount}`, color: "#4fc8a0" },
                    { label: "Total Fee Dipotong", value: fmt(chartData.shopeeFeesTotal + chartData.tiktokFeesTotal), sub: `Shopee ${fmt(chartData.shopeeFeesTotal)} · TikTok ${fmt(chartData.tiktokFeesTotal)}`, color: "#ef4444" },
                  ].map(m => (
                    <div key={m.label} className="stat-card">
                      <div style={{ fontSize: 10, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: m.color, marginBottom: 4 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "#6b6a78" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Omzet Chart */}
                {chartData.combined.length > 0 && (
                  <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Tren Omzet Harian</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData.combined}>
                        <defs>
                          <linearGradient id="shopeeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ee4d2d" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ee4d2d" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="tiktokGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" />
                        <XAxis dataKey="tanggal" tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v?.substring(5)} />
                        <YAxis tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+"jt" : v >= 1000 ? (v/1000).toFixed(0)+"rb" : v} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {datasets.some(d => d.platform === "shopee") && <Area type="monotone" dataKey="shopee_omzet" name="Shopee" stroke="#ee4d2d" fill="url(#shopeeGrad)" strokeWidth={2} dot={false} />}
                        {datasets.some(d => d.platform === "tiktok") && <Area type="monotone" dataKey="tiktok_gmv" name="TikTok GMV" stroke="#f5a623" fill="url(#tiktokGrad)" strokeWidth={2} dot={false} />}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Metode Pembayaran */}
                {chartData.paymentDist.length > 0 && (
                  <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Distribusi Metode Pembayaran (Shopee)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                      <PieChart width={160} height={160}>
                        <Pie data={chartData.paymentDist} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value">
                          {chartData.paymentDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                      <div style={{ flex: 1 }}>
                        {chartData.paymentDist.map((d, i) => (
                          <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e1e23", fontSize: 12 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                              {d.name}
                            </span>
                            <span style={{ fontWeight: 700, color: PIE_COLORS[i % PIE_COLORS.length] }}>{d.value} pesanan</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TREN HARIAN TAB ===== */}
        {activeTab === "tren" && (
          <div className="animate" ref={trenRef} style={{ padding: exporting ? "20px" : "0", background: exporting ? "#0d0d0f" : "transparent" }}>
            {chartData.combined.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Upload Sales Overview atau Analytics untuk melihat tren harian</div>
              </div>
            ) : (
              <>
                {/* Traffic Chart */}
                <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Tren Pengunjung Harian</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData.combined}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" />
                      <XAxis dataKey="tanggal" tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v?.substring(5)} />
                      <YAxis tick={{ fill: "#6b6a78", fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {datasets.some(d => d.platform === "shopee") && <Line type="monotone" dataKey="shopee_pengunjung" name="Shopee Pengunjung" stroke="#ee4d2d" strokeWidth={2} dot={false} />}
                      {datasets.some(d => d.platform === "tiktok") && <Line type="monotone" dataKey="tiktok_pengunjung" name="TikTok Pengunjung" stroke="#f5a623" strokeWidth={2} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Conversion Chart */}
                <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Tren Konversi Rate (%)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData.combined}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" />
                      <XAxis dataKey="tanggal" tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v?.substring(5)} />
                      <YAxis tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v + "%"} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {datasets.some(d => d.platform === "shopee") && <Line type="monotone" dataKey="shopee_konversi" name="Shopee CR%" stroke="#ee4d2d" strokeWidth={2} dot={false} />}
                      {datasets.some(d => d.platform === "tiktok") && <Line type="monotone" dataKey="tiktok_konversi" name="TikTok CR%" stroke="#f5a623" strokeWidth={2} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders/Buyers Bar Chart */}
                <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Pembeli Harian</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData.combined}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" />
                      <XAxis dataKey="tanggal" tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v?.substring(5)} />
                      <YAxis tick={{ fill: "#6b6a78", fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {datasets.some(d => d.platform === "shopee") && <Bar dataKey="shopee_pembeli" name="Shopee Pembeli" fill="#ee4d2d" opacity={0.8} radius={[3, 3, 0, 0]} />}
                      {datasets.some(d => d.platform === "tiktok") && <Bar dataKey="tiktok_pesanan" name="TikTok Pesanan" fill="#f5a623" opacity={0.8} radius={[3, 3, 0, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== INCOME & FEE TAB ===== */}
        {activeTab === "income" && (
          <div className="animate" ref={incomeRef} style={{ padding: exporting ? "20px" : "0", background: exporting ? "#0d0d0f" : "transparent" }}>
            {datasets.filter(d => d.type === "income").length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Upload file Income dari Shopee atau TikTok untuk analisis keuangan</div>
              </div>
            ) : (
              datasets.filter(d => d.type === "income").map(d => {
                const totalRevenue = d.rows.reduce((s, r) => s + parseNum(r.revenue || r.hargaProduk), 0);
                const totalNet = d.rows.reduce((s, r) => s + parseNum(r.settlement || r.totalPenghasilan), 0);
                const totalFees = totalRevenue - totalNet;
                const feeRatio = totalRevenue > 0 ? (totalFees / totalRevenue) * 100 : 0;

                return (
                  <div key={d.id} style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>{d.label}</div>
                      <span className="platform-tag" style={{ background: d.platform === "shopee" ? "rgba(238,77,45,0.1)" : "rgba(245,166,35,0.1)", color: d.platform === "shopee" ? "#ee4d2d" : "#f5a623", border: `1px solid ${d.platform === "shopee" ? "rgba(238,77,45,0.3)" : "rgba(245,166,35,0.3)"}` }}>
                        {d.platform.toUpperCase()} · {d.rows.length} pesanan
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {[
                        { label: "Total Revenue/Omzet", value: fmt(totalRevenue), color: "#f5a623" },
                        { label: "Total Net Diterima", value: fmt(totalNet), color: "#22c55e" },
                        { label: "Total Fee Dipotong", value: fmt(totalFees) + ` (${feeRatio.toFixed(1)}%)`, color: "#ef4444" },
                      ].map(m => (
                        <div key={m.label} style={{ background: "#0d0d0f", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: "#6b6a78", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Fee ratio visual */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 4 }}>Komposisi Revenue</div>
                      <div style={{ height: 8, background: "#1e1e23", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ display: "flex", height: "100%" }}>
                          <div style={{ width: `${100 - feeRatio}%`, background: "#22c55e", transition: "width 0.5s" }} />
                          <div style={{ width: `${feeRatio}%`, background: "#ef4444", transition: "width 0.5s" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b6a78", marginTop: 4 }}>
                        <span style={{ color: "#22c55e" }}>Net {(100 - feeRatio).toFixed(1)}%</span>
                        <span style={{ color: "#ef4444" }}>Fee {feeRatio.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Sample rows */}
                    <div style={{ fontSize: 11, color: "#6b6a78", marginBottom: 8 }}>5 Transaksi Terbaru</div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #2a2a32" }}>
                            {["Tanggal", "Order ID", "Revenue", "Fee", "Net"].map(h => (
                              <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#6b6a78", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.rows.slice(0, 5).map((r, i) => {
                            const rev = parseNum(r.revenue || r.hargaProduk);
                            const net = parseNum(r.settlement || r.totalPenghasilan);
                            const fee = rev - net;
                            return (
                              <tr key={i} style={{ borderBottom: "1px solid #1e1e23" }}>
                                <td style={{ padding: "8px", color: "#aaa" }}>{parseDate(r.tanggal)}</td>
                                <td style={{ padding: "8px", color: "#6b6a78", fontSize: 10 }}>{String(r.orderId || "").substring(0, 16)}...</td>
                                <td style={{ padding: "8px", color: "#f5a623", fontWeight: 600 }}>{fmt(rev)}</td>
                                <td style={{ padding: "8px", color: "#ef4444" }}>-{fmt(Math.abs(fee))}</td>
                                <td style={{ padding: "8px", color: "#22c55e", fontWeight: 700 }}>{fmt(net)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== PERBANDINGAN TAB ===== */}
        {activeTab === "perbandingan" && (
          <div className="animate" ref={compareRef} style={{ padding: exporting ? "20px" : "0", background: exporting ? "#0d0d0f" : "transparent" }}>
            {datasets.filter(d => d.platform === "shopee").length === 0 || datasets.filter(d => d.platform === "tiktok").length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⚖️</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Upload data dari kedua platform untuk perbandingan</div>
              </div>
            ) : (
              <>
                {/* Head-to-head */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[
                    { platform: "shopee", label: "🛍 Shopee", color: "#ee4d2d", omzet: chartData.shopeeOmzetTotal, net: chartData.shopeeNetTotal, orders: chartData.shopeeOrderCount, fees: chartData.shopeeFeesTotal },
                    { platform: "tiktok", label: "🎵 TikTok Shop", color: "#f5a623", omzet: chartData.tiktokGmvTotal, net: chartData.tiktokNetTotal, orders: chartData.tiktokOrderCount, fees: chartData.tiktokFeesTotal },
                  ].map(p => (
                    <div key={p.platform} style={{ background: "#161619", border: `1px solid ${p.color}33`, borderRadius: 12, padding: 20 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: p.color, marginBottom: 16 }}>{p.label}</div>
                      {[
                        { label: "Omzet / GMV", value: fmt(p.omzet), color: p.color },
                        { label: "Net Diterima", value: fmt(p.net), color: "#22c55e" },
                        { label: "Total Pesanan", value: p.orders + " order", color: "#4fc8a0" },
                        { label: "Total Fee", value: fmt(p.fees), color: "#ef4444" },
                        { label: "Fee Ratio", value: p.omzet > 0 ? ((p.fees / p.omzet) * 100).toFixed(1) + "%" : "-", color: "#f59e0b" },
                        { label: "Avg per Pesanan", value: p.orders > 0 ? fmt(p.omzet / p.orders) : "-", color: "#aaa" },
                      ].map(m => (
                        <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e1e23", fontSize: 12 }}>
                          <span style={{ color: "#6b6a78" }}>{m.label}</span>
                          <span style={{ color: m.color, fontWeight: 700 }}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Bar comparison chart */}
                {chartData.combined.length > 0 && (
                  <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Omzet Harian — Shopee vs TikTok</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData.combined}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e23" />
                        <XAxis dataKey="tanggal" tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v?.substring(5)} />
                        <YAxis tick={{ fill: "#6b6a78", fontSize: 10 }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+"jt" : v >= 1000 ? (v/1000).toFixed(0)+"rb" : v} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="shopee_omzet" name="Shopee" fill="#ee4d2d" opacity={0.85} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="tiktok_gmv" name="TikTok GMV" fill="#f5a623" opacity={0.85} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== INSIGHT TAB ===== */}
        {activeTab === "insight" && (
          <div className="animate" ref={insightRef} style={{ padding: exporting ? "20px" : "0", background: exporting ? "#0d0d0f" : "transparent" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>💡 Insight & Saran Strategi</div>
              <div style={{ fontSize: 12, color: "#6b6a78" }}>Analisis otomatis berdasarkan data yang diupload</div>
            </div>

            {datasets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b6a78" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💡</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Upload data untuk mendapatkan insight</div>
              </div>
            ) : (
              insights.map((ins, i) => {
                const colors = { warning: "#f59e0b", success: "#22c55e", info: "#4fc8a0", danger: "#ef4444" };
                const c = colors[ins.type] || "#4fc8a0";
                return (
                  <div key={i} className="insight-card" style={{ background: c + "08", border: `1px solid ${c}33` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ fontSize: 22, flexShrink: 0 }}>{ins.type === "warning" ? "⚠️" : ins.type === "success" ? "✅" : "💡"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: c }}>{ins.title}</span>
                          {ins.platform !== "both" && (
                            <span className="platform-tag" style={{ background: ins.platform === "shopee" ? "rgba(238,77,45,0.1)" : "rgba(245,166,35,0.1)", color: ins.platform === "shopee" ? "#ee4d2d" : "#f5a623", border: `1px solid ${ins.platform === "shopee" ? "rgba(238,77,45,0.3)" : "rgba(245,166,35,0.3)"}` }}>
                              {ins.platform.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6, marginBottom: 8 }}>{ins.desc}</div>
                        <div style={{ fontSize: 11, color: c, fontWeight: 700 }}>→ {ins.action}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Summary Stats from TikTok */}
            {datasets.find(d => d.type === "analytics") && (() => {
              const d = datasets.find(d => d.type === "analytics");
              const totalGmv = d.rows.reduce((s, r) => s + parseNum(r.gmv), 0);
              const totalPesanan = d.rows.reduce((s, r) => s + parseNum(r.pesanan), 0);
              const avgAov = totalPesanan > 0 ? totalGmv / totalPesanan : 0;
              const totalPengunjung = d.rows.reduce((s, r) => s + parseNum(r.pengunjung), 0);
              return (
                <div style={{ background: "#161619", border: "1px solid #2a2a32", borderRadius: 12, padding: 20, marginTop: 16 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#f5a623", marginBottom: 14 }}>🎵 Ringkasan TikTok Analytics</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Total GMV", value: fmt(totalGmv) },
                      { label: "Total Pesanan", value: fmtNum(totalPesanan) },
                      { label: "Rata-rata AOV", value: fmt(avgAov) },
                      { label: "Total Pengunjung", value: fmtNum(totalPengunjung) },
                    ].map(m => (
                      <div key={m.label} style={{ background: "#0d0d0f", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#6b6a78", marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#f5a623" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
