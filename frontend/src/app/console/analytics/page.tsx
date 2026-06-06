"use client";

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
    <div className="space-y-lg flex-1 relative flex flex-col min-h-0 min-w-0">
      
      {/* Workspace Toolbar */}
      <section className="min-h-12 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-sm px-xs pb-sm sm:pb-0 shrink-0 select-none">
        <div className="flex items-center gap-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-xs px-2 py-1 bg-surface-container-highest/40 rounded border border-white/5">
            <span className="text-[10px] text-outline font-bold">Workspace:</span>
            <span className="text-[10px] text-on-surface font-extrabold">Enterprise_Telemetry</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-label-sm text-outline flex items-center gap-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Node Streams
          </span>
        </div>
        
        <div className="flex shrink-0 items-center gap-sm">
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
      <div className="flex-1 overflow-y-auto space-y-md min-h-0 pr-1">
        
        {viewMode === "layout" ? (
          <>
            {/* Bento Grid Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-stretch">
              
              {/* Intelligence Velocity (Inferences) */}
              <div className="lg:col-span-8 glass-panel rounded-2xl p-md md:p-lg flex flex-col justify-between min-h-[300px]">
                <div className="flex justify-between items-start mb-md">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">Intelligence Velocity</h3>
                    <p className="text-label-sm text-outline font-semibold">Real-time inference performance across node environments</p>
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

                <div className="flex justify-between mt-md pt-md border-t border-white/5 text-[10px] font-bold text-outline uppercase tracking-wider">
                  <span>00:00 UTC</span>
                  <span>06:00 UTC</span>
                  <span>12:00 UTC</span>
                  <span>18:00 UTC</span>
                  <span>23:59 UTC</span>
                </div>
              </div>

              {/* Anomaly Detected Card (Pulsing Alarm) */}
              <div className="lg:col-span-4 glass-panel rounded-2xl p-md md:p-lg flex flex-col justify-between border-error/20 bg-error-container/5 relative overflow-hidden">
                
                {/* Alarm Pulsing Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent pointer-events-none animate-pulse"></div>
                
                <div className="relative z-10 space-y-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-full bg-error/20 flex items-center justify-center text-error border border-error/30 animate-pulse">
                      <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        warning
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-error uppercase tracking-widest">Active Alarm</span>
                      <h3 className="text-md font-extrabold text-on-surface tracking-tight leading-none mt-0.5">Anomaly Detected</h3>
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                      <span className="text-[9px] text-outline uppercase font-bold">Metric Deviation</span>
                      <p className="text-label-md font-bold text-on-surface">Cyclic Variance &gt; 14.2%</p>
                    </div>
                    
                    <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                      <span className="text-[9px] text-outline uppercase font-bold">Severity Probability</span>
                      <div className="flex items-center justify-between gap-sm mt-1">
                        <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-error w-[92.4%] shadow-[0_0_8px_rgba(255,180,171,0.5)]"></div>
                        </div>
                        <span className="text-label-sm font-extrabold text-error">92.4%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleInitiateDiagnose}
                  className="w-full py-2.5 mt-md bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl text-label-sm font-bold transition-all relative z-10 active:scale-[0.98]"
                >
                  Initiate Root Cause Analysis
                </button>

              </div>

            </div>

            {/* Comparative Analysis */}
            <div className="glass-panel rounded-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-80 items-stretch">
              
              {/* Baseline standard */}
              <div className="min-w-0 flex-1 p-md md:p-lg flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex min-w-0 justify-between items-start gap-md">
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

                <div className="bg-surface-container rounded-xl p-md space-y-sm border border-white/5 mt-md">
                  <div className="flex items-center gap-md text-label-sm font-semibold">
                    <span className="text-outline w-10 text-right">CPU</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline w-[45%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md text-label-sm font-semibold">
                    <span className="text-outline w-10 text-right">RAM</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline w-[78%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md text-label-sm font-semibold">
                    <span className="text-outline w-10 text-right">IOPS</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline" style={{ width: `${Math.max(10, 100 - Math.min(90, Math.round(baselineModel.latency / 10)))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon compare separator */}
              <div className="w-12 bg-surface-container-lowest/30 flex items-center justify-center border-r border-white/5 select-none hidden md:flex">
                <span className="material-symbols-outlined text-outline text-2xl">compare_arrows</span>
              </div>

              {/* Fine-tuned Enhanced model */}
              <div className="min-w-0 flex-1 p-md md:p-lg flex flex-col justify-between bg-secondary-container/5">
                <div className="flex min-w-0 justify-between items-start gap-md">
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

                <div className="bg-surface-container rounded-xl p-md space-y-sm border border-white/5 mt-md">
                  <div className="flex items-center gap-md text-label-sm font-semibold">
                    <span className="text-outline w-10 text-right">CPU</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[65%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md text-label-sm font-semibold">
                    <span className="text-outline w-10 text-right">RAM</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[62%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md text-label-sm font-semibold">
                    <span className="text-outline w-10 text-right">IOPS</span>
                    <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary shadow-[0_0_8px_rgba(210,187,255,0.4)]" style={{ width: `${Math.max(10, 100 - Math.min(90, Math.round(tunedModel.latency / 10)))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Execution logs list */}
            <div className="glass-panel rounded-2xl p-md md:p-lg space-y-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md pb-md border-b border-white/5">
                <div>
                  <h4 className="text-lg font-bold text-on-surface tracking-tight leading-none">Historical Execution logs</h4>
                  <p className="text-[10px] text-outline mt-1 font-semibold">Search model runtimes, query latency, and compute costs</p>
                </div>
                
                {/* Search query input & filters */}
                <div className="flex flex-wrap items-center gap-sm select-none w-full sm:w-auto z-25 relative">
                  <div className="relative flex-1 sm:flex-none">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[16px]">search</span>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Model ID..."
                      className="bg-surface-container border-b-2 border-outline-variant focus:border-primary pl-8 pr-3 py-1.5 text-label-sm text-on-surface outline-none rounded-t"
                    />
                  </div>

                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface-container border border-white/5 text-label-sm font-bold text-on-surface rounded px-sm py-1.5 focus:outline-none focus:ring-0 cursor-pointer pr-8"
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
                  <div className="flex flex-col items-center justify-center py-xl text-outline font-bold">
                    <span className="material-symbols-outlined animate-spin text-headline-xl text-primary">sync</span>
                    <span className="mt-sm text-label-sm">Querying Database Logs...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-xl text-outline font-bold">
                    <span className="material-symbols-outlined text-headline-xl">database_off</span>
                    <span className="mt-sm text-label-sm">No telemetry records match query parameters.</span>
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
                    <tbody className="divide-y divide-white/5 text-label-sm font-semibold">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-3.5 font-mono text-outline">{log.timestamp}</td>
                          <td className="py-3.5 text-on-surface font-bold">{log.model_id}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-xs ${
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
          <div className="glass-panel rounded-2xl p-md md:p-lg font-mono text-label-sm overflow-hidden flex flex-col bg-surface-container-lowest/80 border-primary/20">
            <div className="flex justify-between items-center pb-sm border-b border-white/5 text-outline select-none">
              <span>query_synthesis_payload.json</span>
              <span className="text-[10px] text-primary uppercase font-bold">SQL Logs Raw Data</span>
            </div>
            
            <pre className="p-md text-emerald-400 overflow-x-auto whitespace-pre-wrap select-text leading-relaxed select-all">
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
              <span className="material-symbols-outlined text-body-lg">close</span>
            </button>

            <div className="text-center mb-md border-b border-white/5 pb-md relative z-10">
              <span className="text-primary font-extrabold tracking-tighter text-2xl flex items-center justify-center gap-xs">
                <span className={`material-symbols-outlined text-2xl ${!diagnosisResult ? 'animate-spin' : ''}`}>
                  {!diagnosisResult ? 'sync' : 'verified'}
                </span>
                Holographic Root Cause Analysis
              </span>
              <p className="text-[10px] text-outline uppercase tracking-widest mt-1">AI Diagnostic Verification Matrix</p>
            </div>

            {/* Steps execution console log */}
            <div className="bg-surface-container-lowest border border-white/5 p-md rounded-xl font-mono text-[11px] text-on-surface-variant space-y-sm max-h-48 overflow-y-auto mb-md relative z-10 select-text">
              {scanSteps.map((step, idx) => (
                <div key={idx} className="flex gap-sm items-start leading-relaxed">
                  <span className="text-primary font-bold">[{idx + 1}]</span>
                  <p>{step}</p>
                </div>
              ))}
              
              {!diagnosisResult && (
                <div className="flex gap-sm items-center text-primary font-bold animate-pulse">
                  <span>&gt;</span>
                  <span>Compiling network matrices...</span>
                </div>
              )}
            </div>

            {/* Simulated report results */}
            {diagnosisResult ? (
              <div className="space-y-md animate-fade-in relative z-10">
                <div className="grid grid-cols-2 gap-sm">
                  <div className="p-sm bg-surface-container rounded-xl border border-white/5">
                    <span className="text-[9px] text-outline uppercase font-bold">ANOMALY SEVERITY</span>
                    <p className="text-label-md font-extrabold text-error flex items-center gap-xs mt-0.5">
                      <span className="w-2.5 h-2.5 bg-error rounded-full animate-ping"></span>
                      {diagnosisResult.severity} Risk
                    </p>
                  </div>
                  
                  <div className="p-sm bg-surface-container rounded-xl border border-white/5">
                    <span className="text-[9px] text-outline uppercase font-bold">SCAN CONFIDENCE</span>
                    <p className="text-label-md font-extrabold text-secondary flex items-center gap-xs mt-0.5">
                      <span className="material-symbols-outlined text-label-md" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {diagnosisResult.confidence} Accuracy
                    </p>
                  </div>
                </div>

                <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                  <span className="text-[9px] text-outline uppercase font-bold">Anomaly Deviation</span>
                  <p className="text-label-md font-bold text-on-surface">{diagnosisResult.deviation}</p>
                </div>

                <div className="p-md bg-primary-container/10 border border-primary/25 rounded-xl space-y-xs">
                  <span className="text-[9px] text-primary uppercase font-bold">AI Action Recommendation</span>
                  <p className="text-[11px] text-primary-fixed leading-relaxed font-semibold">
                    {diagnosisResult.recommendation}
                  </p>
                </div>

                <div className="flex gap-sm pt-md border-t border-white/5">
                  <button 
                    onClick={() => {
                      setIsDiagnosing(false);
                      setScanSteps([]);
                      setDiagnosisResult(null);
                    }}
                    className="flex-1 py-2 border border-outline-variant hover:bg-white/5 rounded-lg text-label-sm font-bold text-on-surface transition-all"
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
                    className="flex-1 py-2 bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-extrabold rounded-lg text-label-sm shadow-md hover:brightness-110 transition-all cursor-pointer"
                  >
                    Deploy Solution
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-md text-outline font-bold animate-pulse">
                <span className="material-symbols-outlined text-headline-xl text-primary animate-spin">cyclone</span>
                <span className="mt-sm text-label-sm font-bold uppercase tracking-wider text-primary">Running Holographic Scan...</span>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
