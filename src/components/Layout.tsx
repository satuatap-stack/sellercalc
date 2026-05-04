import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const MENU = [
  {
    group: "Beranda",
    items: [
      { label: "Dashboard", icon: "📊", path: "dashboard", premium: true },
    ]
  },
  {
    group: "🆓 Kalkulator Gratis",
    items: [
      { label: "Fee Marketplace", icon: "💰", path: "fee", premium: false },
      { label: "Simulasi Diskon", icon: "🏷️", path: "diskon", premium: false },
      { label: "Simulasi Bundle", icon: "📦", path: "bundle", premium: false },
    ]
  },
  {
    group: "👑 Tools Premium",
    items: [
      { label: "Target Omzet", icon: "🎯", path: "omzet", premium: true },
      { label: "Ads ROI", icon: "📈", path: "ads", premium: true },
      { label: "Komisi Afiliasi", icon: "🤝", path: "afiliasi", premium: true },
      { label: "Harga Pasar", icon: "🔍", path: "harga", premium: true },
      { label: "Riset Produk", icon: "🧪", path: "riset", premium: true },
      { label: "Profitability Ranker", icon: "🏆", path: "ranker", premium: true },
      { label: "Konversi Rate", icon: "📉", path: "konversi", premium: true },
      { label: "Marketplace Analyzer", icon: "📊", path: "analyzer", premium: true },
      { label: "Budget Iklan", icon: "💸", path: "budget", premium: true },
      { label: "Analisa Data", icon: "📈", path: "analist", premium: true },
    ]
  },
];

const BOTTOM_NAV = [
  { label: "Dashboard", icon: "📊", path: "dashboard" },
  { label: "Kalkulator", icon: "🧮", path: "fee" },
];

export interface LayoutProps {
  children: React.ReactNode;
  isPremium?: boolean;
  activePath?: string;
  onNavigate: (path: string) => void;
}

export default function Layout({ children, isPremium = false, activePath = "dashboard", onNavigate }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    const savedTheme = localStorage.getItem("theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    }
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const isActive = (path: string) => activePath === path;

  const vars = theme === "dark" ? {
    bg: "#0d0d0f",
    bgSidebar: "#0d0d10",
    bgCard: "#161619",
    textMain: "#f0eff4",
    textMuted: "#6b6a78",
    borderSubtle: "#1e1e23",
    borderStrong: "#2a2a32",
    accent: "#f5a623",
    navBg: "#111113"
  } : {
    bg: "#f8f9fa",
    bgSidebar: "#ffffff",
    bgCard: "#ffffff",
    textMain: "#1a1a1a",
    textMuted: "#6c757d",
    borderSubtle: "#edf2f7",
    borderStrong: "#e2e8f0",
    accent: "#f5a623",
    navBg: "#f1f3f5"
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: vars.bg,
      minHeight: "100vh",
      color: vars.textMain,
      display: "flex",
      transition: "background 0.3s ease, color 0.3s ease",
      // Set CSS variables for child components
      // @ts-ignore
      "--bg-base": vars.bg,
      "--bg-card": vars.bgCard,
      "--text-main": vars.textMain,
      "--text-muted": vars.textMuted,
      "--border-subtle": vars.borderSubtle,
      "--border-strong": vars.borderStrong,
      "--accent": vars.accent,
      "--nav-bg": vars.navBg,
      "--bg-sidebar": vars.bgSidebar
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--border-strong); }

        .sidebar { width: 220px; background: var(--bg-sidebar); border-right: 1px solid var(--border-subtle); height: 100vh; position: fixed; top: 0; left: 0; display: flex; flex-direction: column; z-index: 100; transition: transform 0.25s ease, background 0.3s ease; overflow-y: auto; }
        .main-content { margin-left: 220px; min-height: 100vh; flex: 1; padding-bottom: 0; width: calc(100% - 220px); transition: width 0.3s ease; }

        .bottom-nav { display: none; }

        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); width: 260px; }
          .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
          .main-content { margin-left: 0; padding-bottom: 70px; width: 100%; }
          .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: var(--nav-bg); border-top: 1px solid var(--border-subtle); z-index: 99; }
          .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        }

        .menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 8px; margin: 2px 8px; cursor: pointer; transition: all 0.15s; font-size: 13px; font-weight: 500; color: var(--text-muted); text-decoration: none; }
        .menu-item:hover { background: rgba(128,128,128,0.1); color: var(--text-main); }
        .menu-item.active { background: rgba(245,166,35,0.11); color: var(--accent); }
        .menu-item.locked { opacity: 0.5; cursor: default; }
        .bottom-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px; cursor: pointer; color: var(--text-muted); font-size: 10px; font-weight: 600; letter-spacing: 0.02em; border: none; background: transparent; transition: color 0.15s; gap: 3px; }
        .bottom-nav-item.active { color: var(--accent); }
        .bottom-nav-item span.icon { font-size: 20px; line-height: 1; }
        .premium-badge { font-size: 9px; background: rgba(245,166,35,0.15); color: var(--accent); border: 1px solid rgba(245,166,35,0.3); padding: 1px 5px; border-radius: 3px; font-family: 'Syne', sans-serif; font-weight: 700; margin-left: auto; }
        .free-badge { font-size: 9px; background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); padding: 1px 5px; border-radius: 3px; font-family: 'Syne', sans-serif; font-weight: 700; margin-left: auto; }
      `}</style>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div style={{ padding: "24px 16px 20px", borderBottom: `1px solid ${vars.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: vars.accent }}>Seller CUPU</div>
            <div style={{ fontSize: 10, color: vars.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Seller Assistant</div>
          </div>
          <button onClick={toggleTheme} style={{ background: "transparent", border: `1px solid ${vars.borderStrong}`, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: vars.textMuted }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div style={{ margin: "16px 16px", padding: "10px 12px", background: isPremium ? "rgba(245,166,35,0.08)" : "rgba(34,197,94,0.06)", border: `1px solid ${isPremium ? "rgba(245,166,35,0.25)" : "rgba(34,197,94,0.2)"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: isPremium ? vars.accent : "#22c55e" }}>{isPremium ? "👑 Premium" : "🆓 Gratis"} Plan</div>
            <div style={{ fontSize: 10, color: vars.textMuted, marginTop: 1 }}>{user?.email?.split("@")[0] || "Guest"}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {MENU.map(group => (
            <div key={group.group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: theme === "dark" ? "#45454d" : "#adb5bd", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 24px 6px", fontWeight: 700 }}>{group.group}</div>
              {group.items.map(item => {
                const active = isActive(item.path);
                return (
                  <div key={item.path}
                    className={`menu-item ${active ? "active" : ""}`}
                    onClick={() => { onNavigate(item.path); setSidebarOpen(false); }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.premium && <span className="premium-badge">👑</span>}
                    {!item.premium && !active && <span className="free-badge">FREE</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${vars.borderSubtle}` }}>
          <button onClick={() => signOut(auth)}
            style={{ width: "100%", background: "transparent", border: `1px solid ${vars.borderStrong}`, borderRadius: 8, padding: "9px", color: vars.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
            Keluar
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="hamburger" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${vars.borderSubtle}`, background: vars.bg, position: "sticky", top: 0, zIndex: 50, transition: "background 0.3s ease" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "transparent", border: `1px solid ${vars.borderStrong}`, borderRadius: 8, padding: "6px 12px", color: vars.textMain, cursor: "pointer", fontSize: 16 }}>☰</button>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: vars.accent }}>Seller CUPU</div>
          <button onClick={toggleTheme} style={{ background: "transparent", border: `1px solid ${vars.borderStrong}`, borderRadius: 8, padding: "6px 10px", color: vars.textMuted, cursor: "pointer", fontSize: 14 }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
        {children}
      </div>

      <div className="bottom-nav">
        {BOTTOM_NAV.map(item => (
          <button key={item.path} className={`bottom-nav-item ${isActive(item.path) ? "active" : ""}`}
            onClick={() => onNavigate(item.path)}>
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
