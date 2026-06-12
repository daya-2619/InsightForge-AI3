"use client";

import { usePathname, useRouter } from "next/navigation";
import { Activity, AlertOctagon, AlertTriangle, ArrowLeftRight, ArrowRight, Beaker, Bell, Brain, Calendar, Check, CheckCircle2, ChevronRight, Cloud, Compass, Copy, Cpu, CreditCard, Database, Eye, EyeOff, GitBranch, Globe, HardDrive, HelpCircle, Key, Layers, LayoutGrid, Loader2, LogIn, LogOut, Mail, Menu, MessageSquare, Network, PieChart, Play, Power, RefreshCw, Rocket, Search, Send, Server, Settings, ShieldCheck, Sliders, SlidersHorizontal, Sparkles, Star, Terminal, TrendingUp, Users, Wallet, X, Zap } from 'lucide-react';
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  desc: string;
}

export default function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: session } = useSession();

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      path: "/console/dashboard",
      icon: LayoutGrid,
      desc: "Live Revenue & Performance KPIs",
    },
    {
      name: "Analytics Workspace",
      path: "/console/analytics",
      icon: Activity,
      desc: "Telemetry Logs & Root Cause Analysis",
    },
    {
      name: "Models",
      path: "/console/models",
      icon: Network,
      desc: "Parameters & Neural Benchmarks",
    },
    {
      name: "Datasets",
      path: "/console/datasets",
      icon: Database,
      desc: "NeonDB Schema & Live Tables",
    },
    {
      name: "AI Copilot",
      path: "/console/copilot",
      icon: Sparkles,
      desc: "Conversational SQL & Metric Charts",
    },
  ];

  return (
    <div className="min-h-screen bg-[#13121b] text-[#e4e1ee] flex min-w-0 flex-col font-sans relative overflow-x-hidden select-none">
      
      {/* Dynamic Background Noise Texture overlay */}
      <div className="crystalline absolute inset-0 z-0 pointer-events-none opacity-[0.02]"></div>

      {/* Top Header Navigation Bar */}
      <header className="bg-surface/50 backdrop-blur-xl border-b border-white/5 flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-30">
        <div className="flex min-w-0 items-center gap-6">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center cursor-pointer"
            title="Open Navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => router.push("/")}
            className="min-w-0 flex items-center gap-2 text-xl md:text-xl md:text-2xl font-bold tracking-tight font-extrabold text-primary tracking-normal hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <svg className="w-8 h-8 shrink-0" viewBox="110 70 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="consoleHeaderLogoPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#F8FAFC" />
                </linearGradient>
                <linearGradient id="consoleHeaderLogoAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0D9488" />
                  <stop offset="100%" stopColor="#2DD4BF" />
                </linearGradient>
              </defs>
              <g transform="translate(140, 80)">
                <path d="M0 40 C 0 10, 30 0, 60 0 L 120 0 L 120 30 L 60 30 C 45 30, 40 35, 40 45 L 40 70 L 10 70 L 10 40 Z" fill="url(#consoleHeaderLogoPrimaryGrad)" />
                <path d="M120 120 C 120 150, 90 160, 60 160 L 0 160 L 0 130 L 60 130 C 75 130, 80 125, 80 115 L 80 90 L 110 90 L 110 120 Z" fill="url(#consoleHeaderLogoPrimaryGrad)" />
                <rect x="35" y="75" width="50" height="10" rx="5" fill="url(#consoleHeaderLogoAccentGrad)" />
              </g>
            </svg>
            <span>Sturvixa <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</span></span>
          </button>
          
          <span className="hidden md:inline-block text-[10px] uppercase font-bold text-outline-variant px-sm py-1 bg-white/5 border border-white/10 rounded-full tracking-widest">
            Enterprise Console
          </span>
        </div>

        {/* Action icons */}
        <div className="flex shrink-0 items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-4 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5"
            >
              <Search className="w-5 h-5 text-zinc-400" />
            </button>
            
            {searchOpen && (
              <div className="absolute right-0 top-12 w-64 p-2 bg-surface-container border border-white/10 rounded-lg shadow-xl z-50">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs, metrics..."
                  className="w-full bg-surface-container-lowest border-b border-outline px-2 py-1.5 text-[10px] md:text-xs font-semibold tracking-wider uppercase text-on-surface outline-none rounded"
                />
              </div>
            )}
          </div>
          
          <button className="p-4 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5 relative">
            <Bell className="w-5 h-5 text-zinc-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          
          <button 
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("is_authenticated");
              }
              router.push("/");
            }}
            className="p-4 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5"
            title="Return to Main Landing Page"
          >
            <LogOut className="w-5 h-5 text-zinc-400" />
          </button>

          {/* User profile dropdown drawer */}
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 rounded-full border border-white/10 overflow-hidden ml-sm cursor-pointer hover:border-primary/50 transition-colors"
            >
              <img 
                alt="Dayamay Das profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBliHfxAgSkrnilnO_mr2EtqlHRD1NNnmQf1XOfHu_menIuZ6VUT7m4fJhWcGiDmi0PxZjbk_Ok4fXib1IepMeQBecyJy9-gX_c7njIDlkw9LhcibNMURIhl0yrsCzbuddGiqdBinoPPMGKORP7ZrmQObCcb4W8SE8-FYwg_qcjYdVeVAk4SCx4FmgI8ou132nzpXX8imzivIiWqy0vQgqkulPEhCC_VNlBiDpxhxXGrlQhyt1loQ5dNa4kiOFcTPJVZhb79XW1OE0G"
              />
            </button>
            
            {profileOpen && (
              <div className="absolute right-0 top-10 w-56 p-6 bg-surface-container-high border border-white/10 rounded-xl shadow-2xl z-50 animate-fade-in text-left">
                <p className="font-bold text-on-surface text-xs md:text-sm font-medium">{session?.user?.name || "Dayamay Das"}</p>
                <p className="text-[10px] text-outline uppercase tracking-wider">{((session?.user as any)?.role || "Chief Data Officer").toUpperCase()}</p>
                <div className="border-t border-white/5 my-sm"></div>
                <button 
                  onClick={async () => {
                    setProfileOpen(false);
                    await signOut({ redirect: false });
                    router.push("/");
                  }}
                  className="w-full text-left py-1 text-[10px] md:text-xs font-semibold tracking-wider uppercase text-error hover:brightness-110 flex items-center gap-2 font-bold"
                >
                  <Power className="w-4 h-4 text-error" />
                  Terminate Session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Inner Section */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row relative z-10">
        
        {/* Glassmorphic Side Navigation */}
        <aside className="hidden md:flex w-80 shrink-0 border-r border-white/5 bg-surface-container-lowest/30 p-6 flex-col justify-between">
          <div className="space-y-8">
            <div>
              <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest px-sm">
                Primary Workspace
              </span>
              <p className="text-xs md:text-sm font-medium font-extrabold text-on-surface px-sm mt-xs flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Node Cluster - Active
              </p>
            </div>

            <nav className="space-y-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full text-left p-6 rounded-xl transition-all relative flex gap-6 items-center group overflow-hidden ${
                      isActive 
                        ? "bg-primary/10 border border-primary/25 text-primary" 
                        : "border border-white/0 hover:border-white/5 hover:bg-white/5 text-on-surface-variant"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></span>
                    )}
                    
                    <item.icon 
                      className={`w-6 h-6 shrink-0 group-hover:scale-105 transition-transform ${
                        isActive ? "text-primary" : "text-outline"
                      }`}
                    />
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs md:text-sm font-medium leading-tight truncate">{item.name}</p>
                      <p className={`text-[10px] mt-xs font-semibold leading-tight ${isActive ? "text-primary/70" : "text-outline/70"}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Telemetry Footer */}
          <div className="p-6 bg-surface-container-lowest border border-white/5 rounded-xl space-y-4 mt-auto">
            <div className="flex justify-between items-center text-[10px] font-bold text-outline">
              <span>SQL LOG LATENCY</span>
              <span className="text-primary">122ms AVG</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="w-[85%] bg-primary h-full rounded-full"></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-outline">
              <span>CPU COMPUTE UTIL</span>
              <span className="text-secondary">42.4%</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="w-[42%] bg-secondary h-full rounded-full"></div>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer (Glassmorphic) */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Overlay */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200"
              onClick={() => setMobileSidebarOpen(false)}
            ></div>
            
            {/* Drawer Content */}
            <aside className="relative w-80 max-w-[85vw] h-full bg-[#13121bf2] backdrop-blur-2xl border-r border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-slide-in">
              <div className="space-y-8 flex flex-col h-full overflow-y-auto">
                <div className="flex justify-between items-center pb-sm border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest px-sm">
                      Primary Workspace
                    </span>
                    <p className="text-xs md:text-sm font-medium font-extrabold text-on-surface px-sm mt-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Node Cluster - Active
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-2 text-outline hover:text-primary transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="space-y-4">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          router.push(item.path);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full text-left p-6 rounded-xl transition-all relative flex gap-6 items-center group overflow-hidden ${
                          isActive 
                            ? "bg-primary/10 border border-primary/25 text-primary" 
                            : "border border-white/0 hover:border-white/5 hover:bg-white/5 text-on-surface-variant"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></span>
                        )}
                        
                        <item.icon 
                          className={`w-6 h-6 shrink-0 transition-transform ${
                            isActive ? "text-primary" : "text-outline"
                          }`}
                        />
                        
                        <div className="flex-1">
                          <p className="font-bold text-xs md:text-sm font-medium leading-none">{item.name}</p>
                          <p className={`text-[10px] mt-xs font-semibold leading-none ${isActive ? "text-primary/70" : "text-outline/70"}`}>
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Telemetry Footer */}
              <div className="p-6 bg-surface-container-lowest border border-white/5 rounded-xl space-y-4 mt-auto">
                <div className="flex justify-between items-center text-[10px] font-bold text-outline">
                  <span>SQL LOG LATENCY</span>
                  <span className="text-primary">122ms AVG</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="w-[85%] bg-primary h-full rounded-full"></div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-outline">
                  <span>CPU COMPUTE UTIL</span>
                  <span className="text-secondary">42.4%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="w-[42%] bg-secondary h-full rounded-full"></div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Nested Viewport Content Area */}
        <main className="min-w-0 flex-1 flex flex-col p-6 md:p-8 md:p-10 overflow-y-auto md:max-h-[calc(100vh-64px)]">
          {children}
        </main>

      </div>
    </div>
  );
}
