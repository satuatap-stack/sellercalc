/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import Layout from './components/Layout';
import { Layout as LayoutIcon, Package, Calculator, TrendingUp, Search, Award, BarChart3, Wallet, BadgePercent, Target, Zap } from 'lucide-react';

// Import tools
import AdsROI from '../components/tools/AdsROI';
import AnalisisProduk from '../components/tools/AnalisisProduk';
import BudgetIklan from '../components/tools/BudgetIklan';
import HargaPasar from '../components/tools/HargaPasar';
import KalkulatorFee from '../components/tools/KalkulatorFee';
import KomisiAfiliasi from '../components/tools/KomisiAfiliasi';
import KonversiRate from '../components/tools/KonversiRate';
import ProfitabilityRanker from '../components/tools/ProfitabilityRanker';
import RisetProduk from '../components/tools/RisetProduk';
import SimulasiBundle from '../components/tools/SimulasiBundle';
import SimulasiDiskon from '../components/tools/SimulasiDiskon';
import TargetOmzet from '../components/tools/TargetOmzet';

const TOOLS: Record<string, { component: any; label: string; icon: any; color: string; desc: string }> = {
  fee: { component: KalkulatorFee, label: "Kalkulator Fee", icon: Calculator, color: "bg-blue-500", desc: "Hitung fee marketplace Shopee & TikTok" },
  diskon: { component: SimulasiDiskon, label: "Simulasi Diskon", icon: BadgePercent, color: "bg-red-500", desc: "Cek profit setelah diskon & voucher" },
  bundle: { component: SimulasiBundle, label: "Simulasi Bundle", icon: Package, color: "bg-orange-500", desc: "Simulasi paket produk lebih menguntungkan" },
  omzet: { component: TargetOmzet, label: "Target Omzet", icon: Target, color: "bg-emerald-500", desc: "Breakdown target ke jumlah order harian" },
  ads: { component: AdsROI, label: "Ads ROI", icon: TrendingUp, color: "bg-indigo-500", desc: "Analisis performa iklan & ROAS" },
  afiliasi: { component: KomisiAfiliasi, label: "Komisi Afiliasi", icon: Wallet, color: "bg-pink-500", desc: "Tracking komisi kreator & profit sisa" },
  harga: { component: HargaPasar, label: "Harga Pasar", icon: Search, color: "bg-cyan-500", desc: "Bandingkan harga dengan kompetitor" },
  riset: { component: RisetProduk, label: "Riset Produk", icon: Zap, color: "bg-yellow-500", desc: "Analisis kelayakan produk baru" },
  ranker: { component: ProfitabilityRanker, label: "Profit Ranker", icon: Award, color: "bg-amber-500", desc: "Ranking produk paling cuan Anda" },
  konversi: { component: KonversiRate, label: "Konversi Rate", icon: BarChart3, color: "bg-teal-500", desc: "Analisis & benchmark CR toko" },
  budget: { component: BudgetIklan, label: "Budget Iklan", icon: LayoutIcon, color: "bg-violet-500", desc: "Alokasi budget iklan per produk" },
};

function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="p-6 md:p-10 space-y-10">
      <header>
        <h1 className="font-syne text-3xl font-extrabold mb-2" style={{ color: 'var(--text-main)' }}>Pusat Seller Assistant</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selamat datang kembali! Pilih alat untuk membantu bisnis Anda.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(TOOLS).map(([id, tool]) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex items-start gap-5 p-6 rounded-3xl border hover:border-[#f5a62344] transition-all text-left group"
            style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tool.color} bg-opacity-10 text-white`}>
              <tool.icon className={`h-6 w-6 ${tool.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <h3 className="font-syne font-bold mb-1 group-hover:text-[#f5a623] transition-colors" style={{ color: 'var(--text-main)' }}>{tool.label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tool.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border p-8 mt-10" style={{ 
        background: 'var(--bg-card)', 
        borderColor: 'var(--border-strong)',
      }}>
        <h3 className="font-syne font-bold text-lg mb-4" style={{ color: 'var(--text-main)' }}>Tips Hari Ini</h3>
        <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>
          "Pastikan margin bersih setelah fee dan iklan minimal di atas 15% untuk menjaga kesehatan arus kas bisnis Anda."
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [activePath, setActivePath] = useState("dashboard");

  const ActiveTool = useMemo(() => {
    if (activePath === "dashboard") return null;
    return TOOLS[activePath]?.component || null;
  }, [activePath]);

  return (
    <Layout activePath={activePath} onNavigate={setActivePath}>
      {activePath === "dashboard" ? (
        <Dashboard onNavigate={setActivePath} />
      ) : ActiveTool ? (
        <ActiveTool />
      ) : (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h2>
            <button onClick={() => setActivePath("dashboard")} className="text-[#f5a623] font-bold">Kembali ke Dashboard</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

