import React, { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { Upload, FileText, TrendingUp, DollarSign, Package, Settings, AlertCircle, Download, X, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MarketplaceAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [rawData, setRawData] = useState({ tiktok: [], shopee: [] });
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const dashboardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // Mapping Otomatis berdasarkan file yang Anda miliki
  const [columnMapping, setColumnMapping] = useState({
    shopee: {
      orderId: 'No. Pesanan',
      revenue: 'Total Harga Produk',
      status: 'Status Pesanan',
      date: 'Waktu Pesanan',
      sku: 'Nama Produk'
    },
    tiktok: {
      orderId: 'Order ID',
      revenue: 'Order Amount',
      status: 'Order Status',
      date: 'Created Time',
      sku: 'SKU'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processedData, setProcessedData] = useState({
    totalRevenue: 0,
    orderCount: 0,
    avgOrderValue: 0,
    shopeeShare: 0,
    tiktokShare: 0,
    chartData: [
      { name: 'Minggu 1', shopee: 0, tiktok: 0 },
      { name: 'Minggu 2', shopee: 0, tiktok: 0 },
      { name: 'Minggu 3', shopee: 0, tiktok: 0 },
      { name: 'Minggu 4', shopee: 0, tiktok: 0 },
    ],
    topProducts: [
      { name: 'Belum ada data', sales: 0 }
    ],
    aiStrategy: [
      { title: "Menunggu Data", desc: "Upload file Shopee dan TikTok untuk mendapatkan strategi AI." }
    ]
  });

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map(f => ({
      file: f,
      platform: f.name.toLowerCase().includes('shopee') ? 'shopee' : 
                f.name.toLowerCase().includes('tiktok') ? 'tiktok' : 'unknown'
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    const formData = new FormData();
    
    selectedFiles.forEach(item => {
      if (item.platform === 'shopee') formData.append('shopeeFiles', item.file);
      else if (item.platform === 'tiktok') formData.append('tiktokFiles', item.file);
      else formData.append('shopeeFiles', item.file); // Default to shopee if unknown
    });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        if (text.includes("Action required") || text.includes("Cookie check")) {
          throw new Error("Sesi diblokir oleh browser. Silakan buka aplikasi di Tab baru atau klik 'Authenticate' di preview.");
        }
        throw new Error(`Terjadi kesalahan komunikasi dengan server (Status: ${response.status}).`);
      }

      const result = await response.json();
      if (result.success) {
        setProcessedData(result.data);
        setSelectedFiles([]); // Clear after success
      } else {
        alert(result.error || "Gagal memproses file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message || "Terjadi kesalahan saat mengunggah file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Hapus semua data dan reset analisis?")) {
      setProcessedData({
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        shopeeShare: 0,
        tiktokShare: 0,
        chartData: [
          { name: 'Minggu 1', shopee: 0, tiktok: 0 },
          { name: 'Minggu 2', shopee: 0, tiktok: 0 },
          { name: 'Minggu 3', shopee: 0, tiktok: 0 },
          { name: 'Minggu 4', shopee: 0, tiktok: 0 },
        ],
        topProducts: [
          { name: 'Belum ada data', sales: 0 }
        ],
        aiStrategy: [
          { title: "Menunggu Data", desc: "Upload file Shopee dan TikTok untuk mendapatkan strategi AI." }
        ]
      });
      setSelectedFiles([]);
    }
  };

  const exportAsImage = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: "#0d0d0f",
        scale: 2,
        logging: false,
        useCORS: true
      });
      const link = document.createElement("a");
      link.download = `market-data-hub-${Date.now()}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: "#0d0d0f",
        scale: 2,
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "l" : "p",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      pdf.save(`market-data-hub-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#0d0d0f] text-[#f0eff4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        .glass-card {
          background: #161619;
          border: 1px solid #2a2a32;
          border-radius: 1.5rem;
          transition: all 0.2s ease;
        }
        .glass-card:hover { border-color: #3a3a42; }
        .accent-text { color: #f5a623; font-family: 'Syne', sans-serif; }
        .shopee-text { color: #ee4d2d; }
        .tiktok-text { color: #f0eff4; }
        
        .btn-action {
          background: #161619;
          border: 1px solid #2a2a32;
          border-radius: 10px;
          padding: 10px 18px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          color: #6b6a78;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .btn-action:hover { border-color: #f5a623; color: #f5a623; }
        .btn-primary {
          background: rgba(245, 166, 35, 0.1);
          border: 1px solid rgba(245, 166, 35, 0.3);
          color: #f5a623;
        }
        .btn-primary:hover { background: rgba(245, 166, 35, 0.15); border-color: #f5a623; }
        
        .stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #6b6a78;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 22px;
          line-height: 1.2;
        }
        .platform-tag {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center text-[#f5a623]">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-3xl font-syne font-extrabold tracking-tight">Market Data Hub</h1>
          </div>
          <p className="text-sm text-[#6b6a78] font-medium">Analisis cerdas data penjualan Shopee & TikTok Shop secara terintegrasi.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {processedData.orderCount > 0 && (
            <>
              <button 
                onClick={exportAsImage} 
                disabled={exporting}
                className="btn-action"
              >
                {exporting ? "..." : "JPG"}
              </button>
              <button 
                onClick={exportAsPDF} 
                disabled={exporting}
                className="btn-action"
              >
                {exporting ? "..." : "PDF"}
              </button>
              <button onClick={handleReset} className="btn-action border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10">
                Reset
              </button>
            </>
          )}
          <button onClick={() => setIsMappingOpen(!isMappingOpen)} className="btn-action">
             <Settings size={14} className="inline mr-2" /> Konfigurasi
          </button>
          
          <label className="btn-action cursor-pointer">
            <FileText size={14} className="inline mr-2" /> Pilih Data
            <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".xlsx,.xls,.csv" />
          </label>

          {selectedFiles.length > 0 && (
            <button 
              onClick={handleFileUpload}
              disabled={isLoading}
              className="btn-action btn-primary"
            >
              <Upload size={14} className="inline mr-2" /> 
              {isLoading ? "Memproses..." : `Analisis ${selectedFiles.length} File`}
            </button>
          )}
        </div>
      </header>

      {/* FILE QUEUE */}
      {selectedFiles.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2 p-4 rounded-2xl border border-dashed border-[#2a2a32] bg-[#161619]/30">
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2a2a32] border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${f.platform === 'shopee' ? 'bg-[#ee4d2d]' : f.platform === 'tiktok' ? 'bg-white' : 'bg-gray-500'}`} />
              <span className="text-[10px] font-bold text-[#f0eff4] truncate max-w-[120px]">{f.file.name}</span>
              <button onClick={() => removeFile(i)} className="text-[#6b6a78] hover:text-white ml-1">×</button>
            </div>
          ))}
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <div ref={dashboardRef} className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1">
        
        {/* STATS GROUP */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Omzet Gabungan", value: processedData.totalRevenue, icon: DollarSign, color: "#f5a623" },
            { label: "Volume Pesanan", value: processedData.orderCount, icon: Package, color: "#4fc8a0" },
            { label: "Nilai per Order", value: processedData.avgOrderValue, icon: TrendingUp, color: "#22c55e" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <div className="stat-label">{stat.label}</div>
                <stat.icon size={16} strokeWidth={2.5} style={{ color: stat.color }} />
              </div>
              <div>
                <h3 className="stat-value" style={{ color: stat.color }}>
                  {stat.label.includes("Omzet") || stat.label.includes("Nilai") 
                    ? `Rp ${Math.round(stat.value).toLocaleString('id-ID')}`
                    : `${stat.value.toLocaleString('id-ID')} unit`}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* AI STRATEGY BOX */}
        <div className="lg:row-span-2 glass-card p-8 bg-[#f5a623]/5 border-[#f5a623]/20 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
             <AlertCircle size={20} className="text-[#f5a623]" />
             <h3 className="text-lg font-syne font-extrabold uppercase tracking-tight">AI Insights</h3>
          </div>
          
          <div className="space-y-5 flex-1">
            {processedData.aiStrategy.map((strat, i) => (
              <div key={i} className="space-y-1">
                <h4 className="text-[10px] font-black uppercase text-[#f5a623] tracking-widest">{strat.title}</h4>
                <p className="text-xs text-[#aaa] leading-relaxed font-medium">{strat.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[#f5a623]/20">
             <button 
                onClick={() => window.print()}
                className="w-full py-3 rounded-xl bg-[#f5a623] text-black font-syne font-extrabold text-[11px] uppercase tracking-wider hover:opacity-90 transition active:scale-95"
             >
                Unduh Rekomendasi
             </button>
          </div>
        </div>

        {/* MAIN VISUALIZATION */}
        <div className="lg:col-span-3 glass-card p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex gap-1 p-1 bg-[#1e1e23] rounded-xl">
              {[
                { id: 'sales', label: 'Tren' },
                { id: 'financial', label: 'Margin' },
                { id: 'product', label: 'Produk' },
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-[#f5a623] text-black' : 'text-[#6b6a78] hover:text-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ee4d2d]" />
                <span className="text-[10px] font-bold text-[#6b6a78]">SHOPEE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-[10px] font-bold text-[#6b6a78]">TIKTOK</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'product' ? (
                <BarChart data={processedData.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e23" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b6a78', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6a78', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: 'white', opacity: 0.05 }} 
                    contentStyle={{ background: '#161619', border: '1px solid #2a2a32', borderRadius: '12px' }} 
                  />
                  <Bar dataKey="sales" fill="#f5a623" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              ) : (
                <LineChart data={processedData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e23" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b6a78', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6a78', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ background: '#161619', border: '1px solid #2a2a32', borderRadius: '16px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="shopee" name="Shopee" stroke="#ee4d2d" strokeWidth={4} dot={{ r: 4, fill: '#ee4d2d', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="tiktok" name="TikTok" stroke="#fff" strokeWidth={4} dot={{ r: 4, fill: '#fff', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* SHARE PIE */}
        <div className="glass-card p-8 flex flex-col justify-between">
           <div>
              <h3 className="font-syne font-bold text-base mb-1 tracking-tight">Dominasi Platform</h3>
              <p className="text-[10px] text-[#6b6a78] font-bold uppercase tracking-widest">Share Volume Pasar</p>
           </div>
           
           <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Shopee', value: processedData.shopeeShare || 1 },
                      { name: 'TikTok', value: processedData.tiktokShare || 1 }
                    ]}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#ee4d2d" stroke="none" />
                    <Cell fill="#ffffff" stroke="none" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#161619', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center font-syne font-black text-2xl text-[#f5a623]">
                 %
              </div>
           </div>

           <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded bg-[#ee4d2d]" />
                   <span className="text-[10px] font-bold text-[#6b6a78] uppercase">Shopee</span>
                 </div>
                 <span className="text-xs font-black">{Math.round(processedData.shopeeShare)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded bg-white" />
                   <span className="text-[10px] font-bold text-[#6b6a78] uppercase">TikTok</span>
                 </div>
                 <span className="text-xs font-black">{Math.round(processedData.tiktokShare)}%</span>
              </div>
           </div>
        </div>

        {/* TABLE LOG */}
        <div className="lg:col-span-3 glass-card p-8 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-syne font-bold text-lg tracking-tight">Eksplorasi Data Real-time</h3>
                <p className="text-[10px] text-[#6b6a78] font-bold uppercase tracking-widest">Detail data transaksi yang terdeteksi</p>
              </div>
              <button className="text-[10px] font-black uppercase text-[#6b6a78] hover:text-[#f5a623] tracking-widest transition">Export CSV</button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-[9px] uppercase font-black tracking-widest text-[#6b6a78] border-b border-[#2a2a32]">
                   <th className="pb-4 px-2">Platform</th>
                   <th className="pb-4 px-2">ID Trx / Nama</th>
                   <th className="pb-4 px-2">Status</th>
                   <th className="pb-4 px-2 text-right">Nilai Akhir</th>
                 </tr>
               </thead>
               <tbody className="text-xs">
                 {processedData.orderCount > 0 ? (
                   <tr className="hover:bg-white/[0.02] transition border-b border-[#1e1e23]/30">
                     <td className="py-4 px-2">
                       <span className="platform-tag bg-[#ee4d2d]/10 text-[#ee4d2d] border border-[#ee4d2d]/20">
                          SHOPEE
                       </span>
                     </td>
                     <td className="py-4 px-2 font-mono text-[10px] text-[#6b6a78]">
                        TRX-LIVE-001...
                     </td>
                     <td className="py-4 px-2">
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> 
                         <span className="text-[10px] font-bold text-[#22c55e]">VALID</span>
                       </div>
                     </td>
                     <td className="py-4 px-2 text-right font-black text-sm">
                       Rp {Math.round(processedData.totalRevenue / (processedData.orderCount || 1)).toLocaleString('id-ID')}
                     </td>
                   </tr>
                 ) : (
                   <tr>
                     <td colSpan={4} className="py-20 text-center text-[#6b6a78] font-syne font-bold uppercase tracking-widest text-[10px]">
                        Belum ada laporan yang dimuat
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
      {/* MAPPING MODAL */}
      {isMappingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl bg-[#0d0d0f] border-[#2a2a32] overflow-hidden animate">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a32]">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-[#f5a623]" />
                <h3 className="font-syne font-extrabold text-lg uppercase tracking-tight">Konfigurasi Mapping Kolom</h3>
              </div>
              <button onClick={() => setIsMappingOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {['shopee', 'tiktok'].map(platform => (
                <div key={platform} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${platform === 'shopee' ? 'bg-[#ee4d2d]' : 'bg-white'}`} />
                    <h4 className="font-syne font-bold uppercase text-xs tracking-widest">{platform} Column Setup</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(columnMapping[platform]).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#6b6a78] uppercase tracking-wider">{key}</label>
                        <input 
                          type="text" 
                          value={value} 
                          onChange={(e) => {
                            const newMapping = {...columnMapping};
                            newMapping[platform][key] = e.target.value;
                            setColumnMapping(newMapping);
                          }}
                          className="w-full bg-[#161619] border border-[#2a2a32] rounded-xl px-4 py-3 text-xs focus:border-[#f5a623] outline-none transition transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-[#2a2a32] flex justify-end">
               <button 
                onClick={() => {
                  alert("Konfigurasi disimpan secara lokal.");
                  setIsMappingOpen(false);
                }}
                className="btn-action btn-primary"
               >
                 Simpan Konfigurasi
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default MarketplaceAnalyzer;