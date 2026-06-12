"use client";

import { Activity, AlertOctagon, AlertTriangle, ArrowLeftRight, ArrowRight, Beaker, Bell, Brain, Calendar, Check, CheckCircle2, ChevronRight, Cloud, Compass, Copy, Cpu, CreditCard, Database, Eye, EyeOff, GitBranch, Globe, HardDrive, HelpCircle, Key, Layers, LayoutGrid, Loader2, LogIn, LogOut, Mail, Menu, MessageSquare, Mic, Network, Paperclip, PieChart, Play, Power, RefreshCw, Rocket, Search, Send, Server, Settings, ShieldCheck, Sliders, SlidersHorizontal, Sparkles, Star, Terminal, TrendingDown, TrendingUp, UploadCloud, Users, Wallet, X, Zap } from 'lucide-react';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ExecutionLog {
  id: number;
  timestamp: string;
  model_id: string;
  status: string;
  latency: string;
  cost: number;
}

interface DiagnosisResult {
  deviation: string;
  recommendation: string;
  confidence: string;
  severity: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"layout" | "code">("layout");
  
  // Execution logs state
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Diagnosis holographic scan simulation states
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  // Scenario Simulation states
  const [childQtyMult, setChildQtyMult] = useState(1.0);
  const [childPriceMult, setChildPriceMult] = useState(1.0);
  const [parentQtyMult, setParentQtyMult] = useState(1.0);
  const [parentPriceMult, setParentPriceMult] = useState(1.0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);

  // Live Telemetry states
  const [telemetry, setTelemetry] = useState({ cpu: 0, ram: 0, latency: 0, active_requests: 0 });

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/telemetry");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTelemetry(data);
    };
    return () => ws.close();
  }, []);
  const fetchSimulation = async (cq: number, cp: number, pq: number, pp: number) => {
    setLoadingSimulation(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_qty_mult: cq,
          child_price_mult: cp,
          parent_qty_mult: pq,
          parent_price_mult: pp
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSimulationResult(data);
      }
    } catch (err) {
      console.warn("Failed to retrieve live simulation results.");
    } finally {
      setLoadingSimulation(false);
    }
  };

  useEffect(() => {
    fetchSimulation(childQtyMult, childPriceMult, parentQtyMult, parentPriceMult);
  }, [childQtyMult, childPriceMult, parentQtyMult, parentPriceMult]);

  // Fetch execution logs from FastAPI backend
  const fetchLogs = async (search: string, status: string) => {
    setLoadingLogs(true);
    try {
      let url = `http://127.0.0.1:8000/api/logs?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (status && status !== "All") url += `status=${encodeURIComponent(status)}&`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        throw new Error("Failed to fetch logs");
      }
    } catch {
      console.warn("Backend unavailable. Loading local mock logs.");
      // Fallback local execution logs for robust local operation
      const mockLogs: ExecutionLog[] = [
        { id: 1, timestamp: "12:04:12.441", model_id: "IF-GPT-4o-V2", status: "Success", latency: "122ms", cost: 0.0021 },
        { id: 2, timestamp: "12:04:10.923", model_id: "IF-LLAMA3-70B", status: "Success", latency: "842ms", cost: 0.0054 },
        { id: 3, timestamp: "12:04:08.115", model_id: "IF-GPT-4o-V2", status: "Failed", latency: "--", cost: 0.0000 },
        { id: 4, timestamp: "12:03:54.102", model_id: "IF-CLAUDE3.5-SONNET", status: "Success", latency: "412ms", cost: 0.0084 },
        { id: 5, timestamp: "12:03:12.894", model_id: "IF-GPT-4o-V2", status: "Success", latency: "145ms", cost: 0.0023 },
        { id: 6, timestamp: "12:02:44.201", model_id: "IF-MIXTRAL-8x7B", status: "Success", latency: "512ms", cost: 0.0008 },
        { id: 7, timestamp: "12:01:10.556", model_id: "IF-LLAMA3-70B", status: "Success", latency: "789ms", cost: 0.0052 },
        { id: 8, timestamp: "12:00:04.112", model_id: "IF-CLAUDE3.5-SONNET", status: "Success", latency: "388ms", cost: 0.0081 },
        { id: 9, timestamp: "11:58:32.409", model_id: "IF-GPT-4o-V2", status: "Success", latency: "130ms", cost: 0.0021 },
        { id: 10, timestamp: "11:57:12.991", model_id: "IF-LLAMA3-70B", status: "Failed", latency: "--", cost: 0.0000 },
      ];
      
      // Filter mock logs locally
      let filtered = mockLogs;
      if (search) {
        filtered = filtered.filter(l => l.model_id.toLowerCase().includes(search.toLowerCase()));
      }
      if (status && status !== "All") {
        filtered = filtered.filter(l => l.status === status);
      }
      setLogs(filtered);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/models/telemetry");
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (err) {
      console.warn("Failed to fetch model telemetry in analytics page");
    }
  };

  const getVelocityChartData = () => {
    const latestLogs = [...logs].slice(0, 12).reverse();
    const latencies = latestLogs.map(log => {
      if (log.status === "Failed" || !log.latency || log.latency === "--") {
        return 0;
      }
      const num = parseInt(log.latency.replace("ms", ""));
      return isNaN(num) ? 0 : num;
    });

    const defaultVals = [122, 145, 388, 412, 512, 789, 842, 130, 122, 145, 512, 842];
    while (latencies.length < 12) {
      latencies.unshift(defaultVals[12 - latencies.length - 1] || 100);
    }
    
    const maxVal = Math.max(...latencies, 100);
    return latencies.map(val => ({
      val,
      height: Math.max(5, Math.round((val / maxVal) * 90))
    }));
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchLogs(searchQuery, statusFilter), 0);
    return () => window.clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  // Initiate root cause analysis simulation
  const handleInitiateDiagnose = async () => {
    setIsDiagnosing(true);
    setScanSteps([]);
    setDiagnosisResult(null);

    const steps = [
      "Initializing virtual node network scan...",
      "Evaluating high-latency indicators on Frankfurt nodes...",
      "Profiling database transaction load patterns...",
      "Executing cyclic model prediction variance..."
    ];

    // Increment index to animate loading steps
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        setScanSteps(prev => [...prev, steps[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        // Call API backend for actual root cause results
        fetchDiagnosisResults();
      }
    }, 800);
  };

  const fetchDiagnosisResults = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/diagnose", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setDiagnosisResult(data.results);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback mock diagnosis result
      setDiagnosisResult({
        deviation: "14.2% cyclic variance in EU nodes",
        recommendation: "European response delay identified due to DB connection pools exhaustion. Deploying replica servers in Frankfurt and increasing pool limit to 100 recommended.",
        confidence: "92.4%",
        severity: "High"
      });
    }
  };

  const baselineModel = models.find(m => m.id === "gpt-4o-v2") || { name: "IF-GPT-4o-V2", accuracy: 88.2, latency: 122 };
  const tunedModel = models.find(m => m.id === "llama3-70b") || { name: "IF-LLAMA3-70B", accuracy: 94.7, latency: 842 };
  const accuracyDiff = (tunedModel.accuracy - baselineModel.accuracy).toFixed(1);
  const diffSign = parseFloat(accuracyDiff) >= 0 ? "+" : "";

  return (
    <div className="space-y-8 relative flex flex-col min-w-0">
      
      {/* Workspace Toolbar */}
      <section className="min-h-12 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-xs pb-sm sm:pb-0 shrink-0 select-none">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-2 py-1 bg-surface-container-highest/40 rounded border border-white/5">
            <span className="text-[10px] text-outline font-bold">Workspace:</span>
            <span className="text-[10px] text-on-surface font-extrabold">Enterprise_Telemetry</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-[10px] md:text-xs font-semibold tracking-wider uppercase text-outline flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Node Streams
          </span>
        </div>
        
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-white/5 select-none text-[11px] font-bold">
            <button 
              onClick={() => setViewMode("layout")}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === "layout" ? "bg-surface-container-highest text-on-surface" : "text-outline hover:text-on-surface"
              }`}
            >
              Layout View
            </button>
            <button 
              onClick={() => setViewMode("code")}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === "code" ? "bg-surface-container-highest text-on-surface" : "text-outline hover:text-on-surface"
              }`}
            >
              Code View
            </button>
          </div>
        </div>
      </section>

      {/* Main Content viewport */}
      <div className="space-y-6 pr-1">
        
        {viewMode === "layout" ? (
          <>
            {/* Bento Grid Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
              
              {/* Live Server Telemetry Widget */}
              <div className="col-span-1 lg:col-span-12 glass-panel rounded-2xl p-6 md:p-8 shrink-0 flex flex-col relative overflow-hidden group border border-primary/20">
                <div className="absolute top-0 right-0 p-4 opacity-5 flex gap-2 pointer-events-none">
                  <Server className="w-48 h-48 text-primary" />
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-primary/20 text-primary rounded-lg shadow-[0_0_15px_rgba(var(--primary-color),0.3)]">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">Live Server Telemetry</h3>
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 text-[9px] font-bold rounded uppercase tracking-wider ml-auto">
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl shadow-lg">
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">CPU Load</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl lg:text-3xl font-extrabold text-on-surface font-mono">{telemetry.cpu}%</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl shadow-lg">
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">Memory</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl lg:text-3xl font-extrabold text-on-surface font-mono">{telemetry.ram}%</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl shadow-lg">
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">Latency</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl lg:text-3xl font-extrabold text-on-surface font-mono">{telemetry.latency}ms</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl shadow-lg">
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">Active Requests</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl lg:text-3xl font-extrabold text-on-surface font-mono">{telemetry.active_requests}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Intelligence Velocity (Inferences) */}
              <div className="lg:col-span-8 glass-panel rounded-2xl p-6 md:p-8 md:p-10 flex flex-col justify-between min-h-[300px]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">Intelligence Velocity</h3>
                    <p className="text-[10px] md:text-xs font-semibold tracking-wider uppercase text-outline font-semibold">Real-time inference performance across node environments</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 text-[9px] font-bold rounded uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex items-end gap-2 px-2 h-44">
                  {getVelocityChartData().map((item, idx) => (
                    <div 
                      key={idx}
                      style={{ height: `${item.height}%` }}
                      className="flex-1 bg-primary/25 border-t border-primary/40 hover:bg-primary/50 hover:scale-[1.04] transition-all rounded-t-md relative group cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container border border-white/10 px-2 py-0.5 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {item.val > 0 ? `${item.val}ms` : "Failed"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6 pt-md border-t border-white/5 text-[10px] font-bold text-outline uppercase tracking-wider">
                  <span>00:00 UTC</span>
                  <span>06:00 UTC</span>
                  <span>12:00 UTC</span>
                  <span>18:00 UTC</span>
                  <span>23:59 UTC</span>
                </div>
              </div>

              {/* Anomaly Detected Card (Pulsing Alarm) */}
              <div className="lg:col-span-4 glass-panel rounded-2xl p-6 md:p-8 md:p-10 flex flex-col justify-between border-error/20 bg-error-container/5 relative overflow-hidden">
                
                {/* Alarm Pulsing Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent pointer-events-none animate-pulse"></div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-error/20 flex items-center justify-center text-error border border-error/30 animate-pulse">
                      <span className="material-symbols-outlined text-base md:text-lg text-zinc-400 font-normal" style={{ fontVariationSettings: "'FILL' 1" }}>
                        warning
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-error uppercase tracking-widest">Active Alarm</span>
                      <h3 className="text-md font-extrabold text-on-surface tracking-tight leading-none mt-0.5">Anomaly Detected</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 bg-surface-container rounded-xl border border-white/5 space-y-2">
                      <span className="text-[9px] text-outline uppercase font-bold">Metric Deviation</span>
                      <p className="text-xs md:text-sm font-medium font-bold text-on-surface">Cyclic Variance &gt; 14.2%</p>
                    </div>
                    
                    <div className="p-6 bg-surface-container rounded-xl border border-white/5 space-y-2">
                      <span className="text-[9px] text-outline uppercase font-bold">Severity Probability</span>
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-error w-[92.4%] shadow-[0_0_8px_rgba(255,180,171,0.5)]"></div>
                        </div>
                        <span className="text-[10px] md:text-xs font-semibold tracking-wider uppercase font-extrabold text-error">92.4%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleInitiateDiagnose}
                  className="w-full py-2.5 mt-6 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl text-[10px] md:text-xs font-semibold tracking-wider uppercase font-bold transition-all relative z-10 active:scale-[0.98]"
                >
                  Initiate Root Cause Analysis
                </button>

              </div>

            </div>

            {/* Scenario Simulation Sandbox Panel */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 md:p-10 space-y-6 border-primary/10">
              <div className="flex justify-between items-center border-b border-white/5 pb-sm">
                <div className="flex items-center gap-4">
                  <Beaker className="w-5 h-5 text-primary text-2xl" />
                  <div>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">Scenario Simulation Sandbox</h3>
                    <p className="text-[10px] md:text-xs font-semibold tracking-wider uppercase text-outline font-semibold">Simulate segment volume & price variations on active schemas (Palantir Decision Sandbox)</p>
                  </div>
                </div>
                {simulationResult?.verdict && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    simulationResult.verdict.severity === "Optimal" ? "bg-green-400/10 text-green-400 border border-green-400/25" :
                    simulationResult.verdict.severity === "High" ? "bg-red-400/10 text-red-400 border border-red-400/25" :
                    "bg-amber-400/10 text-amber-400 border border-amber-400/25"
                  }`}>
                    {simulationResult.verdict.severity} Risk Status
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Sliders Form */}
                <div className="lg:col-span-4 space-y-8 flex flex-col justify-between py-xs">
                  
                  {/* Parent Qty Multiplier */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                      <span className="text-outline">Parent Sports Volume</span>
                      <span className="text-primary font-bold">{parentQtyMult.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min={0.5} 
                      max={2.0} 
                      step={0.1} 
                      value={parentQtyMult}
                      onChange={(e) => setParentQtyMult(parseFloat(e.target.value))}
                      className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary border-none outline-none"
                    />
                  </div>

                  {/* Parent Price Multiplier */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                      <span className="text-outline">Parent Sports Price</span>
                      <span className="text-primary font-bold">{parentPriceMult.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min={0.5} 
                      max={2.0} 
                      step={0.1} 
                      value={parentPriceMult}
                      onChange={(e) => setParentPriceMult(parseFloat(e.target.value))}
                      className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary border-none outline-none"
                    />
                  </div>

                  {/* Child Qty Multiplier */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                      <span className="text-outline">Child Nutrition Volume</span>
                      <span className="text-secondary font-bold">{childQtyMult.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min={0.5} 
                      max={3.0} 
                      step={0.1} 
                      value={childQtyMult}
                      onChange={(e) => setChildQtyMult(parseFloat(e.target.value))}
                      className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary border-none outline-none"
                    />
                  </div>

                  {/* Child Price Multiplier */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                      <span className="text-outline">Child Nutrition Price</span>
                      <span className="text-secondary font-bold">{childPriceMult.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min={0.5} 
                      max={2.0} 
                      step={0.1} 
                      value={childPriceMult}
                      onChange={(e) => setChildPriceMult(parseFloat(e.target.value))}
                      className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary border-none outline-none"
                    />
                  </div>

                  {/* Reset Buttons */}
                  <button 
                    onClick={() => {
                      setParentQtyMult(1.0);
                      setParentPriceMult(1.0);
                      setChildQtyMult(1.0);
                      setChildPriceMult(1.0);
                    }}
                    className="w-full mt-2 py-2 border border-outline-variant hover:bg-white/5 rounded-xl text-[10px] md:text-xs font-semibold tracking-wider uppercase font-bold text-on-surface transition-all active:scale-[0.98]"
                  >
                    Reset Sandbox Parameters
                  </button>

                </div>

                {/* Simulation Summary & Chart */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-6 min-h-[300px]">
                  
                  {/* Results Indicators */}
                  {simulationResult && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                        <span className="text-[9px] text-outline uppercase font-bold">Simulated Revenue</span>
                        <p className="text-md font-extrabold text-on-surface mt-0.5">
                          ₹{(simulationResult.summary.simulated_revenue / 10000000).toFixed(2)}Cr
                        </p>
                      </div>
                      <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                        <span className="text-[9px] text-outline uppercase font-bold">Revenue Shift</span>
                        <p className={`text-md font-extrabold mt-0.5 ${
                          simulationResult.summary.revenue_diff >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {simulationResult.summary.revenue_diff_percent}%
                        </p>
                      </div>
                      <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                        <span className="text-[9px] text-outline uppercase font-bold">Simulated Net Profit</span>
                        <p className="text-md font-extrabold text-on-surface mt-0.5">
                          ₹{(simulationResult.summary.simulated_profit / 10000000).toFixed(2)}Cr
                        </p>
                      </div>
                      <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                        <span className="text-[9px] text-outline uppercase font-bold">Profit Shift</span>
                        <p className={`text-md font-extrabold mt-0.5 ${
                          simulationResult.summary.profit_diff >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {simulationResult.summary.profit_diff_percent}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Comparative Chart */}
                  <div className="flex-1 flex flex-col justify-end">
                    {simulationResult && (
                      <div className="flex items-end gap-3 px-2 h-40">
                        {simulationResult.charts.baseline.map((baseVal: number, idx: number) => {
                          const simVal = simulationResult.charts.simulated[idx];
                          const maxVal = Math.max(...simulationResult.charts.baseline, ...simulationResult.charts.simulated, 1);
                          
                          const baseHeight = Math.max(2, Math.round((baseVal / maxVal) * 90));
                          const simHeight = Math.max(2, Math.round((simVal / maxVal) * 90));

                          return (
                            <div key={idx} className="flex-1 flex items-end gap-1 group relative h-full">
                              {/* Baseline bar */}
                              <div 
                                style={{ height: `${baseHeight}%` }} 
                                className="flex-1 bg-primary/25 border-t border-primary/40 rounded-t-sm transition-all"
                              ></div>
                              {/* Simulated bar */}
                              <div 
                                style={{ height: `${simHeight}%` }} 
                                className="flex-1 bg-secondary/35 border-t border-secondary/50 rounded-t-sm transition-all shadow-[0_0_8px_rgba(210,187,255,0.1)]"
                              ></div>
                              
                              {/* Tooltip */}
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-container border border-white/10 p-2 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 space-y-0.5 pointer-events-none shadow-xl">
                                <p className="text-primary">Base: ₹{(baseVal / 100000).toFixed(1)}L</p>
                                <p className="text-secondary">Sim: ₹{(simVal / 100000).toFixed(1)}L</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Chart Labels */}
                    <div className="flex justify-between pt-sm border-t border-white/5 text-[9px] font-bold text-outline uppercase tracking-wider mt-1 select-none">
                      {simulationResult?.charts.labels.map((lbl: string, idx: number) => (
                        <span key={idx} className="flex-1 text-center">{lbl}</span>
                      ))}
                    </div>
                  </div>

                  {/* Verdict Recommendation alert */}
                  {simulationResult?.verdict && (
                    <div className={`p-6 rounded-xl border flex items-center gap-4 leading-snug font-semibold text-[11px] ${
                      simulationResult.verdict.severity === "Optimal" ? "bg-green-400/5 border-green-400/20 text-green-400" :
                      simulationResult.verdict.severity === "High" ? "bg-red-400/5 border-red-400/20 text-red-400" :
                      "bg-amber-400/5 border-amber-400/20 text-amber-400"
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {simulationResult.verdict.severity === "Optimal" ? "verified" : "info"}
                      </span>
                      <p>{simulationResult.verdict.message}</p>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Comparative Analysis */}
            <div className="glass-panel rounded-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-80 items-stretch">
              
              {/* Baseline standard */}
              <div className="min-w-0 flex-1 p-6 md:p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex min-w-0 justify-between items-start gap-6">
                  <div>
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded uppercase tracking-wider mb-1.5 inline-block">
                      Baseline Core
                    </span>
                    <h4 className="text-lg font-bold text-on-surface leading-none">{baselineModel.name}</h4>
                    <p className="text-[10px] text-outline mt-1 font-semibold">Standard enterprise general logic</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-on-surface">{baselineModel.accuracy}%</div>
                    <div className="text-[8px] text-outline font-bold uppercase tracking-widest mt-0.5">Accuracy Index</div>
                  </div>
                </div>

                <div className="bg-surface-container rounded-xl p-6 space-y-4 border border-white/5 mt-6">
                  <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                    <span className="text-outline w-10 text-right">CPU</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline w-[45%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                    <span className="text-outline w-10 text-right">RAM</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline w-[78%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                    <span className="text-outline w-10 text-right">IOPS</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline" style={{ width: `${Math.max(10, 100 - Math.min(90, Math.round(baselineModel.latency / 10)))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon compare separator */}
              <div className="w-12 bg-surface-container-lowest/30 flex items-center justify-center border-r border-white/5 select-none hidden md:flex">
                <ArrowLeftRight className="w-5 h-5 text-outline text-2xl" />
              </div>

              {/* Fine-tuned Enhanced model */}
              <div className="min-w-0 flex-1 p-6 md:p-8 md:p-10 flex flex-col justify-between bg-secondary-container/5">
                <div className="flex min-w-0 justify-between items-start gap-6">
                  <div>
                    <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/20 text-secondary text-[9px] font-bold rounded uppercase tracking-wider mb-1.5 inline-block">
                      Specialized Tuning
                    </span>
                    <h4 className="text-lg font-bold text-on-surface leading-none">{tunedModel.name}</h4>
                    <p className="text-[10px] text-outline mt-1 font-semibold">Fine-tuned with custom domain signals</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-secondary">{tunedModel.accuracy}%</div>
                    <div className="text-[8px] text-secondary/60 font-bold uppercase tracking-widest mt-0.5">Accuracy ({diffSign}{accuracyDiff}%)</div>
                  </div>
                </div>

                <div className="bg-surface-container rounded-xl p-6 space-y-4 border border-white/5 mt-6">
                  <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                    <span className="text-outline w-10 text-right">CPU</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[65%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                    <span className="text-outline w-10 text-right">RAM</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[62%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                    <span className="text-outline w-10 text-right">IOPS</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary shadow-[0_0_8px_rgba(210,187,255,0.4)]" style={{ width: `${Math.max(10, 100 - Math.min(90, Math.round(tunedModel.latency / 10)))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Execution logs list */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 md:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-md border-b border-white/5">
                <div>
                  <h4 className="text-lg font-bold text-on-surface tracking-tight leading-none">Historical Execution logs</h4>
                  <p className="text-[10px] text-outline mt-1 font-semibold">Search model runtimes, query latency, and compute costs</p>
                </div>
                
                {/* Search query input & filters */}
                <div className="flex flex-wrap items-center gap-4 select-none w-full sm:w-auto z-25 relative">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-5 h-5 absolute left-2.5 top-1/2 -translate-y-1/2  text-outline text-[16px]" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Model ID..."
                      className="bg-surface-container border-b-2 border-outline-variant focus:border-primary pl-8 pr-3 py-1.5 text-[10px] md:text-xs font-semibold tracking-wider uppercase text-on-surface outline-none rounded-t"
                    />
                  </div>

                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface-container border border-white/5 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-bold text-on-surface rounded px-sm py-1.5 focus:outline-none focus:ring-0 cursor-pointer pr-8"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Success">Success Only</option>
                    <option value="Failed">Failed Only</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto min-h-[200px]">
                {loadingLogs ? (
                  <div className="flex flex-col items-center justify-center py-16 md:py-24 text-outline font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight md:leading-none text-primary" />
                    <span className="mt-4 text-[10px] md:text-xs font-semibold tracking-wider uppercase">Querying Database Logs...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 md:py-24 text-outline font-bold">
                    <Database className="w-5 h-5 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight md:leading-none" />
                    <span className="mt-4 text-[10px] md:text-xs font-semibold tracking-wider uppercase">No telemetry records match query parameters.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-outline text-[10px] font-bold uppercase tracking-wider select-none border-b border-white/5">
                        <th className="pb-3">TIMESTAMP</th>
                        <th className="pb-3">MODEL TELEMETRY ID</th>
                        <th className="pb-3">GATEWAY STATUS</th>
                        <th className="pb-3">QUERY LATENCY</th>
                        <th className="pb-3 text-right">COMPUTE COST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-semibold">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-3.5 font-mono text-outline">{log.timestamp}</td>
                          <td className="py-3.5 text-on-surface font-bold">{log.model_id}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-2 ${
                              log.status === "Success" ? "text-green-400" : "text-red-400"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                log.status === "Success" ? "bg-green-400 animate-pulse" : "bg-red-400"
                              }`}></span>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono">{log.latency}</td>
                          <td className="py-3.5 text-right font-mono text-primary">${log.cost.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          /* CODE VIEW - IDE syntax breakdown of database entities */
          <div className="glass-panel rounded-2xl p-6 md:p-8 md:p-10 font-mono text-[10px] md:text-xs font-semibold tracking-wider uppercase overflow-hidden flex flex-col bg-surface-container-lowest/80 border-primary/20">
            <div className="flex justify-between items-center pb-sm border-b border-white/5 text-outline select-none">
              <span>query_synthesis_payload.json</span>
              <span className="text-[10px] text-primary uppercase font-bold">SQL Logs Raw Data</span>
            </div>
            
            <pre className="p-6 text-emerald-400 overflow-x-auto whitespace-pre-wrap select-text leading-relaxed select-all">
              {JSON.stringify({
                status: "optimal",
                cluster: "Frankfurt-Node-EU1",
                logs_searched: logs.length,
                timestamp: new Date().toISOString(),
                schema: {
                  execution_logs: {
                    id: "integer(primary_key)",
                    timestamp: "string",
                    model_id: "string(indexed)",
                    status: "string",
                    latency: "string",
                    cost: "float"
                  }
                },
                dataset: logs
              }, null, 2)}
            </pre>
          </div>
        )}

      </div>

      {/* STATEFUL HOLOGRAPHIC DIAGNOSTICS MODAL */}
      {isDiagnosing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-[640px] p-6 sm:p-8 rounded-2xl shadow-2xl relative border-primary/30 max-h-[calc(100vh-2rem)] overflow-y-auto">
            
            <button 
              onClick={() => {
                setIsDiagnosing(false);
                setScanSteps([]);
                setDiagnosisResult(null);
              }}
              className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors p-1"
            >
              <X className="w-5 h-5 text-base md:text-lg text-zinc-400 font-normal" />
            </button>

            <div className="text-center mb-6 border-b border-white/5 pb-md relative z-10">
              <span className="text-primary font-extrabold tracking-tighter text-2xl flex items-center justify-center gap-2">
                <span className={`material-symbols-outlined text-2xl ${!diagnosisResult ? 'animate-spin' : ''}`}>
                  {!diagnosisResult ? 'sync' : 'verified'}
                </span>
                Holographic Root Cause Analysis
              </span>
              <p className="text-[10px] text-outline uppercase tracking-widest mt-1">AI Diagnostic Verification Matrix</p>
            </div>

            {/* Steps execution console log */}
            <div className="bg-surface-container-lowest border border-white/5 p-6 rounded-xl font-mono text-[11px] text-on-surface-variant space-y-4 max-h-48 overflow-y-auto mb-6 relative z-10 select-text">
              {scanSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start leading-relaxed">
                  <span className="text-primary font-bold">[{idx + 1}]</span>
                  <p>{step}</p>
                </div>
              ))}
              
              {!diagnosisResult && (
                <div className="flex gap-4 items-center text-primary font-bold animate-pulse">
                  <span>&gt;</span>
                  <span>Compiling network matrices...</span>
                </div>
              )}
            </div>

            {/* Simulated report results */}
            {diagnosisResult ? (
              <div className="space-y-6 animate-fade-in relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container rounded-xl border border-white/5">
                    <span className="text-[9px] text-outline uppercase font-bold">ANOMALY SEVERITY</span>
                    <p className="text-xs md:text-sm font-medium font-extrabold text-error flex items-center gap-2 mt-0.5">
                      <span className="w-2.5 h-2.5 bg-error rounded-full animate-ping"></span>
                      {diagnosisResult.severity} Risk
                    </p>
                  </div>
                  
                  <div className="p-4 bg-surface-container rounded-xl border border-white/5">
                    <span className="text-[9px] text-outline uppercase font-bold">SCAN CONFIDENCE</span>
                    <p className="text-xs md:text-sm font-medium font-extrabold text-secondary flex items-center gap-2 mt-0.5">
                      <span className="material-symbols-outlined text-xs md:text-sm font-medium" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {diagnosisResult.confidence} Accuracy
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-surface-container rounded-xl border border-white/5 space-y-2">
                  <span className="text-[9px] text-outline uppercase font-bold">Anomaly Deviation</span>
                  <p className="text-xs md:text-sm font-medium font-bold text-on-surface">{diagnosisResult.deviation}</p>
                </div>

                <div className="p-6 bg-primary-container/10 border border-primary/25 rounded-xl space-y-2">
                  <span className="text-[9px] text-primary uppercase font-bold">AI Action Recommendation</span>
                  <p className="text-[11px] text-primary-fixed leading-relaxed font-semibold">
                    {diagnosisResult.recommendation}
                  </p>
                </div>

                <div className="flex gap-4 pt-md border-t border-white/5">
                  <button 
                    onClick={() => {
                      setIsDiagnosing(false);
                      setScanSteps([]);
                      setDiagnosisResult(null);
                    }}
                    className="flex-1 py-2 border border-outline-variant hover:bg-white/5 rounded-lg text-[10px] md:text-xs font-semibold tracking-wider uppercase font-bold text-on-surface transition-all"
                  >
                    Close Synthesis
                  </button>
                   <button 
                    onClick={() => {
                      setIsDiagnosing(false);
                      setScanSteps([]);
                      setDiagnosisResult(null);
                      router.push("/console/copilot");
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-extrabold rounded-lg text-[10px] md:text-xs font-semibold tracking-wider uppercase shadow-md hover:brightness-110 transition-all cursor-pointer"
                  >
                    Deploy Solution
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-outline font-bold animate-pulse">
                <Loader2 className="w-5 h-5 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight md:leading-none text-primary animate-spin" />
                <span className="mt-4 text-[10px] md:text-xs font-semibold tracking-wider uppercase font-bold uppercase tracking-wider text-primary">Running Holographic Scan...</span>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
