"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Activity {
  id: number;
  entity_name: string;
  tier: string;
  status: string;
  value: string;
  confidence: number;
}

interface DashboardStats {
  region: string;
  days: number;
  total_revenue: string;
  revenue_growth: string;
  net_profit: string;
  profit_growth: string;
  active_users: string;
  user_growth: string;
  growth_rate: string;
  growth_change: string;
  chart_data: {
    actual: number[];
    forecast: number[];
  };
  region_data: Record<string, number>;
  recent_activities: Activity[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [region, setRegion] = useState("Global");
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Fetch stats from FastAPI backend
  const fetchStats = async (r: string, d: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/dashboard-stats?region=${encodeURIComponent(r)}&days=${d}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error("Failed to fetch statistics");
      }
    } catch {
      console.warn("Backend unavailable. Initializing mock frontend fallback data.");
      // Fallback local dataset for robust client-only demo operation
      const mockData: DashboardStats = {
        region: r,
        days: d,
        total_revenue: r === "Global" ? "$2.4M" : r === "North America" ? "$1.2M" : r === "Europe" ? "$0.7M" : "$0.5M",
        revenue_growth: r === "Europe" ? "+10%" : "+12%",
        net_profit: r === "Global" ? "$842k" : r === "North America" ? "$430k" : r === "Europe" ? "$250k" : "$162k",
        profit_growth: "+8.4%",
        active_users: r === "Global" ? "18,294" : r === "North America" ? "9,410" : r === "Europe" ? "5,220" : "3,664",
        user_growth: "+21%",
        growth_rate: "4.2%",
        growth_change: "-0.5%",
        chart_data: {
          actual: [40, 65, 50, 85, 70, 95, 80],
          forecast: [20, 45, 30, 55, 40, 65, 50]
        },
        region_data: r === "Global" ? { "N. America": 85, "Europe": 62, "APAC": 44, "LATAM": 28 } : { [r]: 100 },
        recent_activities: [
          { id: 1, entity_name: "TechVanguard Corp", tier: "Enterprise Tier", status: "Verified", value: "$82,400.00", confidence: 98 },
          { id: 2, entity_name: "BioLink Systems", tier: "Standard Tier", status: "Processing", value: "$12,150.00", confidence: 84 },
          { id: 3, entity_name: "OmniRetail Inc", tier: "Enterprise Tier", status: "Verified", value: "$142,000.00", confidence: 95 },
          { id: 4, entity_name: "AeroDynamics Group", tier: "Startup Tier", status: "Verified", value: "$4,900.00", confidence: 99 },
          { id: 5, entity_name: "AlphaFinance Ltd", tier: "Enterprise Tier", status: "Processing", value: "$64,200.00", confidence: 91 },
          { id: 6, entity_name: "CloudScale Systems", tier: "Standard Tier", status: "Failed", value: "$0.00", confidence: 10 }
        ]
      };
      setStats(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => fetchStats(region, days), 0);
    return () => window.clearTimeout(timer);
  }, [region, days]);

  // Dynamic SVG path generator based on chart array coordinates
  const generateSvgPath = (points: number[]) => {
    if (points.length === 0) return "";
    const width = 100;
    const height = 20;
    const segmentWidth = width / (points.length - 1);
    
    // Scale coordinate points so max element fits inside 20 height viewbox
    const maxVal = Math.max(...points, 10);
    const scaledPoints = points.map(p => height - (p / maxVal) * 16 - 2);

    return scaledPoints.reduce((path, y, i) => {
      const x = i * segmentWidth;
      return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, "");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified": return "bg-green-400/10 border border-green-400/25 text-green-400";
      case "Processing": return "bg-amber-400/10 border border-amber-400/25 text-amber-400";
      case "Failed": return "bg-red-400/10 border border-red-400/25 text-red-400";
      default: return "bg-white/5 border border-white/10 text-on-surface";
    }
  };

  return (
    <div className="space-y-lg flex-1 min-w-0">
      
      {/* Dynamic Header Filter Bar */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-sm tracking-tight leading-none">
            Main Dashboard
          </h1>
          <p className="text-body-md text-outline mt-1.5">Real-time enterprise intelligence and telemetry aggregates.</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-sm bg-surface-container-low/60 backdrop-blur p-2 rounded-xl border border-white/5 relative z-20 sm:w-auto">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-outline text-label-md pl-1">calendar_today</span>
            <select 
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent border-none text-label-sm font-bold text-on-surface focus:ring-0 focus:outline-none cursor-pointer pr-8"
            >
              <option value={30} className="bg-surface-container-high text-on-surface">Last 30 Days</option>
              <option value={90} className="bg-surface-container-high text-on-surface">Last 90 Days</option>
              <option value={365} className="bg-surface-container-high text-on-surface">Last 365 Days</option>
            </select>
          </div>
          
          <div className="hidden sm:block h-5 w-[1px] bg-white/10"></div>
          
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-outline text-label-md pl-1">public</span>
            <select 
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-transparent border-none text-label-sm font-bold text-on-surface focus:ring-0 focus:outline-none cursor-pointer pr-8"
            >
              <option value="Global" className="bg-surface-container-high text-on-surface">Global Regions</option>
              <option value="North America" className="bg-surface-container-high text-on-surface">North America</option>
              <option value="Europe" className="bg-surface-container-high text-on-surface">Europe</option>
              <option value="APAC" className="bg-surface-container-high text-on-surface">APAC</option>
            </select>
          </div>
          
          <button 
            onClick={() => fetchStats(region, days)}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap bg-primary hover:bg-primary-fixed text-on-primary px-md rounded-lg text-label-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Sync Node"}
          </button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        
        {/* Revenue KPI */}
        <div className="glass-panel p-md rounded-2xl hover:scale-[1.02] transition-transform duration-300 min-h-[176px] flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-start mb-base">
            <span className="text-label-sm text-outline font-bold uppercase tracking-wider">Total Revenue</span>
            <span className="text-primary text-[20px] material-symbols-outlined">payments</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="text-3xl font-extrabold text-on-surface">{stats?.total_revenue || "$0.0M"}</span>
            <span className="text-label-sm text-green-400 font-extrabold">{stats?.revenue_growth || "+0%"}</span>
          </div>
          <div className="mt-md h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path 
                d={generateSvgPath(stats?.chart_data.actual || [40, 65, 50, 85, 70, 95, 80])} 
                fill="none" 
                stroke="#c3c0ff" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>

        {/* Net Profit KPI */}
        <div className="glass-panel p-md rounded-2xl hover:scale-[1.02] transition-transform duration-300 min-h-[176px] flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-start mb-base">
            <span className="text-label-sm text-outline font-bold uppercase tracking-wider">Net Profit</span>
            <span className="text-secondary text-[20px] material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="text-3xl font-extrabold text-on-surface">{stats?.net_profit || "$0k"}</span>
            <span className="text-label-sm text-green-400 font-extrabold">{stats?.profit_growth || "+0%"}</span>
          </div>
          <div className="mt-md h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path 
                d={generateSvgPath(stats?.chart_data.forecast || [20, 45, 30, 55, 40, 65, 50])} 
                fill="none" 
                stroke="#d2bbff" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>

        {/* Active Users KPI */}
        <div className="glass-panel p-md rounded-2xl hover:scale-[1.02] transition-transform duration-300 min-h-[176px] flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-start mb-base">
            <span className="text-label-sm text-outline font-bold uppercase tracking-wider">Active Users</span>
            <span className="text-primary text-[20px] material-symbols-outlined">group</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="text-3xl font-extrabold text-on-surface">{stats?.active_users || "0"}</span>
            <span className="text-label-sm text-green-400 font-extrabold">{stats?.user_growth || "+0%"}</span>
          </div>
          <div className="mt-md h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path 
                d={generateSvgPath([30, 45, 35, 60, 50, 80, 95])} 
                fill="none" 
                stroke="#c3c0ff" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>

        {/* Growth Rate KPI */}
        <div className="glass-panel p-md rounded-2xl hover:scale-[1.02] transition-transform duration-300 min-h-[176px] flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-start mb-base">
            <span className="text-label-sm text-outline font-bold uppercase tracking-wider">Growth Rate</span>
            <span className="text-secondary text-[20px] material-symbols-outlined">trending_up</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="text-3xl font-extrabold text-on-surface">{stats?.growth_rate || "0%"}</span>
            <span className={`text-label-sm font-extrabold ${stats?.growth_change.startsWith("-") ? 'text-red-400' : 'text-green-400'}`}>
              {stats?.growth_change || "0%"}
            </span>
          </div>
          <div className="mt-md h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path 
                d={generateSvgPath([80, 75, 70, 72, 75, 80, 85])} 
                fill="none" 
                stroke="#d2bbff" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Visual Analytics Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        
        {/* Revenue Trends Bar Grid (Bento Style) */}
        <div className="lg:col-span-2 glass-panel p-md md:p-lg rounded-2xl min-h-[380px] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-md mb-md">
            <div>
              <h3 className="text-xl font-bold text-on-surface tracking-tight">Revenue Trend Matrices</h3>
              <button 
                onClick={() => router.push("/console/analytics")}
                className="text-[11px] font-bold text-primary hover:underline hover:opacity-85 mt-1 flex items-center gap-xs cursor-pointer border-none bg-transparent p-0 text-left outline-none"
              >
                Open Analytics Workspace <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-sm">
              <div className="flex items-center gap-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-label-sm text-outline font-semibold">Direct Telemetry</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="text-label-sm text-outline font-semibold">Forecast Node</span>
              </div>
            </div>
          </div>

          <div className="w-full h-56 mt-lg relative">
            
            {/* Grid Line Markers */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
              <div className="border-t border-white w-full"></div>
              <div className="border-t border-white w-full"></div>
              <div className="border-t border-white w-full"></div>
              <div className="border-t border-white w-full"></div>
            </div>

            {/* Direct Bars */}
            <div className="absolute inset-x-0 bottom-0 top-2 flex items-end justify-between gap-base px-2">
              {(stats?.chart_data.actual || [40, 65, 50, 85, 70, 95, 80]).map((val, idx) => (
                <div 
                  key={`actual-${idx}`}
                  style={{ height: `${val}%` }}
                  className="w-full bg-primary/20 border-t border-primary/45 rounded-t-lg hover:bg-primary/40 hover:scale-[1.03] transition-all duration-300 relative group cursor-pointer"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-container border border-white/10 rounded text-[9px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                    Direct: {val}%
                  </div>
                </div>
              ))}
            </div>

            {/* Forecast Bars overlay */}
            <div className="absolute inset-x-0 bottom-0 top-2 flex items-end justify-between gap-base px-2 pointer-events-none">
              {(stats?.chart_data.forecast || [20, 45, 30, 55, 40, 65, 50]).map((val, idx) => (
                <div 
                  key={`forecast-${idx}`}
                  style={{ height: `${val}%` }}
                  className="w-full bg-secondary/35 border-t border-secondary/50 rounded-t-lg opacity-80"
                ></div>
              ))}
            </div>

          </div>

          <div className="flex justify-between mt-md px-sm">
            {["W1", "W2", "W3", "W4", "W5", "W6", "W7"].map((label) => (
              <span key={label} className="text-label-sm font-semibold text-outline">{label}</span>
            ))}
          </div>
        </div>

        {/* Region Sales heatmap progress bars */}
        <div className="glass-panel p-md md:p-lg rounded-2xl flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="text-xl font-bold text-on-surface tracking-tight mb-lg">Sales by Region</h3>
            <div className="space-y-md">
              {stats?.region_data && Object.entries(stats.region_data).map(([rName, rVal]) => (
                <div key={rName} className="space-y-xs">
                  <div className="flex justify-between items-center text-label-sm font-semibold">
                    <span>{rName}</span>
                    <span className="text-primary">{rVal}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden border border-white/5">
                    <div 
                      style={{ width: `${rVal}%` }}
                      className="h-full bg-gradient-to-r from-primary-container to-secondary-container transition-all duration-[1200ms]"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-lg border-t border-white/5 mt-lg space-y-sm">
            <div className="flex justify-between items-center text-label-sm font-semibold">
              <span className="text-outline">Live Node Sync Mode</span>
              <span className="text-emerald-400 flex items-center gap-xs font-bold">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                Verifying (98% Conf)
              </span>
            </div>
            <div className="flex justify-between items-center text-label-sm font-semibold">
              <span className="text-outline">Avg. Processing Latency</span>
              <span className="text-primary font-bold">122ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* Global Activities table viewport */}
      <section className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-md md:p-lg border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm bg-surface-container-lowest/20">
          <div>
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Recent Global Telemetry</h3>
            <p className="text-[11px] text-outline mt-1"> live verification transactions captured across node environments.</p>
          </div>
          <button 
            onClick={() => setRegion("Global")}
            className="text-label-sm font-bold text-primary hover:underline hover:opacity-85"
          >
            Reset Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/10 text-outline border-b border-white/5 select-none">
                <th className="px-md py-sm text-[10px] uppercase font-bold tracking-wider">Entity Client</th>
                <th className="px-md py-sm text-[10px] uppercase font-bold tracking-wider">License Segment</th>
                <th className="px-md py-sm text-[10px] uppercase font-bold tracking-wider">Gateway Status</th>
                <th className="px-md py-sm text-[10px] uppercase font-bold tracking-wider">Captured Value</th>
                <th className="px-md py-sm text-[10px] uppercase font-bold tracking-wider">AI Conf Score</th>
                <th className="px-md py-sm text-[10px] uppercase font-bold tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recent_activities.map((act) => (
                <tr 
                  key={act.id} 
                  onClick={() => setSelectedActivity(act)}
                  className="hover:bg-white/2 transition-colors cursor-pointer"
                >
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-md">
                      <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                      </div>
                      <span className="text-label-md font-bold text-on-surface whitespace-nowrap">{act.entity_name}</span>
                    </div>
                  </td>
                  
                  <td className="px-md py-sm text-label-sm text-outline font-semibold whitespace-nowrap">
                    {act.tier}
                  </td>
                  
                  <td className="px-md py-sm">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase whitespace-nowrap ${getStatusColor(act.status)}`}>
                      {act.status}
                    </span>
                  </td>
                  
                  <td className="px-md py-sm text-label-sm font-bold text-primary whitespace-nowrap">
                    {act.value}
                  </td>
                  
                  <td className="px-md py-sm text-label-sm font-bold whitespace-nowrap">
                    <div className="flex items-center gap-xs text-primary">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span>{act.confidence}%</span>
                    </div>
                  </td>

                  <td className="px-md py-sm text-right">
                    <span className="material-symbols-outlined text-outline hover:text-on-surface">chevron_right</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dynamic Glassmorphic Activity Details Overlay Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-[640px] p-6 sm:p-8 rounded-2xl shadow-2xl relative border-primary/25 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="crystalline absolute inset-0 rounded-2xl"></div>
            
            <button 
              onClick={() => setSelectedActivity(null)}
              className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors p-1"
            >
              <span className="material-symbols-outlined text-body-lg">close</span>
            </button>

            <div className="flex items-center gap-md mb-lg">
              <div className="w-12 h-12 bg-primary-container/20 border border-primary/45 rounded-xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">database</span>
              </div>
              <div>
                <span className="text-[10px] text-primary uppercase font-extrabold tracking-widest">{selectedActivity.tier}</span>
                <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">{selectedActivity.entity_name}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md relative z-10">
              
              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                <span className="text-[9px] text-outline uppercase font-bold">Transaction Value</span>
                <p className="text-xl font-extrabold text-primary">{selectedActivity.value}</p>
              </div>

              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                <span className="text-[9px] text-outline uppercase font-bold">Verification Index</span>
                <p className="text-xl font-extrabold text-secondary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">star</span>
                  {selectedActivity.confidence}%
                </p>
              </div>

              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs sm:col-span-2">
                <span className="text-[9px] text-outline uppercase font-bold">Gateway Validation Status</span>
                <div className="flex items-center justify-between mt-1">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${getStatusColor(selectedActivity.status)}`}>
                    {selectedActivity.status}
                  </span>
                  <span className="text-[10px] text-outline">Verified on: Frankfurt Node EU-1</span>
                </div>
              </div>

              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs sm:col-span-2">
                <span className="text-[9px] text-outline uppercase font-bold">AI Diagnostics Verification Synthesis</span>
                <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold">
                  This transaction is categorized under {selectedActivity.tier} parameters. The neural scoring model verifies that telemetry payload matches standard user traffic profiles with a confidence rating of {selectedActivity.confidence}%. No security anomalies detected.
                </p>
              </div>

            </div>

            <div className="mt-lg pt-lg border-t border-white/5 flex gap-sm relative z-10">
              <button 
                onClick={() => setSelectedActivity(null)}
                className="flex-1 py-2 border border-outline-variant hover:bg-white/5 text-on-surface rounded-lg text-label-sm font-bold transition-all"
              >
                Close Synthesis
              </button>
              <button 
                onClick={() => {
                  setSelectedActivity(null);
                  // Quick shortcut to console logs
                  router.push("/console/analytics");
                }}
                className="flex-1 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-extrabold hover:brightness-110 transition-all shadow-md"
              >
                View Node Telemetry
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
