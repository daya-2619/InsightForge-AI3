"use client";

import { useState, useEffect } from "react";

interface DBTable {
  name: string;
  records: number;
  size: string;
  status: "Synchronized" | "Out of Sync" | "Syncing";
  columns: string[];
}

export default function DatasetsPage() {
  const [dbType, setDbType] = useState<"SQLite" | "NeonDB">("SQLite");
  const [host, setHost] = useState("ep-glassy-galaxy-a5v6qdg7.us-east-2.aws.neon.tech");
  const [dbName, setDbName] = useState("insightforge_enterprise");
  const [username, setUsername] = useState("dayamay.das_admin");
  const [password, setPassword] = useState("********************");
  const [showPassword, setShowPassword] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<"Connected" | "Disconnected" | "Connecting">("Connected");
  const [syncProgress, setSyncProgress] = useState(100);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState("Just now");

  const [tables, setTables] = useState<DBTable[]>([
    { name: "execution_logs", records: 14294, size: "1.4 MB", status: "Synchronized", columns: ["id", "timestamp", "model_id", "status", "latency", "cost"] },
    { name: "activities", records: 1842, size: "284 KB", status: "Synchronized", columns: ["id", "entity_name", "tier", "status", "value", "confidence"] },
    { name: "kpi_records", records: 12, size: "16 KB", status: "Synchronized", columns: ["id", "region", "days", "total_revenue", "revenue_growth", "net_profit", "profit_growth", "active_users", "user_growth", "growth_rate", "growth_change", "revenue_chart_data", "region_data"] },
    { name: "financial_records", records: 34910, size: "4.8 MB", status: "Synchronized", columns: ["id", "quarter", "region", "revenue", "growth", "week"] },
    { name: "user_churn_events", records: 2104, size: "320 KB", status: "Synchronized", columns: ["id", "user_id", "segment", "reason", "date"] }
  ]);

  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);

  const logDatabase = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulatedLogs(prev => [`[${timestamp}] DB: ${text}`, ...prev.slice(0, 15)]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      logDatabase("Database orchestrator active. Current engine: SQLite (Zero-config fallback).");
      logDatabase("Verifying table integrity: 5 core schema matrices found.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleConnectNeon = (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionStatus("Connecting");
    logDatabase(`Attempting TCP handshake with NeonDB cluster: ${host}...`);

    setTimeout(() => {
      setDbType("NeonDB");
      setConnectionStatus("Connected");
      setSyncProgress(85);
      logDatabase("NeonDB cluster handshook successfully! Secure SSL pipeline established.");
      logDatabase("Schema validation: Neon database reports 5 tables. 2 are currently out of sync.");
      setTables(prev => prev.map(t => {
        if (t.name === "financial_records" || t.name === "user_churn_events") {
          return { ...t, status: "Out of Sync" };
        }
        return t;
      }));
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnectionStatus("Connecting");
    logDatabase("Closing secure NeonDB SSL pipeline...");
    
    setTimeout(() => {
      setDbType("SQLite");
      setConnectionStatus("Connected");
      setSyncProgress(100);
      logDatabase("Reverted active engine to SQLite Local Backup.");
      setTables(prev => prev.map(t => ({ ...t, status: "Synchronized" })));
    }, 1000);
  };

  const runSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    logDatabase("Initiating NeonDB schema synchronization protocol...");
    
    setTables(prev => prev.map(t => {
      if (t.status === "Out of Sync") {
        return { ...t, status: "Syncing" };
      }
      return t;
    }));

    // Trigger API call to backend to re-seed/sync database if backend is alive
    fetch("http://127.0.0.1:8000/api/health")
      .then(res => {
        if (res.ok) {
          logDatabase("Backend API confirmed healthy. Requesting telemetry seeds recalculation...");
        }
      })
      .catch(() => {
        logDatabase("Local backend unreachable. Proceeding with client synchronization.");
      });

    // Simulate progress meter counting up
    let currentProg = syncProgress;
    const interval = setInterval(() => {
      if (currentProg < 100) {
        currentProg += 5;
        setSyncProgress(Math.min(currentProg, 100));
        logDatabase(`Sync process: row synchronizer written ${Math.floor(currentProg)}% total rows...`);
      } else {
        clearInterval(interval);
        setTables(prev => prev.map(t => {
          if (t.name === "financial_records") return { ...t, records: 34910, status: "Synchronized" };
          if (t.name === "user_churn_events") return { ...t, records: 2104, status: "Synchronized" };
          return { ...t, status: "Synchronized" };
        }));
        setIsSyncing(false);
        setLastSynced("Just now");
        logDatabase("NeonDB sync completed successfully. All local models calibrated to new data.");
      }
    }, 400);
  };

  return (
    <div className="space-y-lg flex-1 relative flex flex-col min-h-0 min-w-0 select-none">
      
      {/* Page Header */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md shrink-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-sm tracking-tight leading-none">
            Datasets & Integrations
          </h1>
          <p className="text-body-md text-outline mt-1.5 font-semibold">
            Integrate primary NeonDB servers, verify active tables, and seed synthetic data.
          </p>
        </div>

        <div className="flex gap-sm">
          <button 
            onClick={runSync}
            disabled={isSyncing || syncProgress === 100}
            className="flex items-center gap-xs bg-primary hover:bg-primary-fixed text-on-primary px-md py-2 rounded-xl text-label-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            {isSyncing ? "Synchronizing..." : syncProgress === 100 ? "Fully Synced" : "Synchronize NeonDB"}
          </button>
        </div>
      </section>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-gutter min-h-0 min-w-0 overflow-y-auto">
        
        {/* Left Column: NeonDB Configuration Panel */}
        <div className="lg:col-span-5 min-w-0 flex flex-col gap-md lg:max-h-full">
          
          {/* Connection Status Indicator */}
          <div className="glass-panel rounded-2xl p-md md:p-lg space-y-md">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-outline font-bold uppercase tracking-widest">Active Data Engine</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-xs ${
                connectionStatus === "Connected" 
                  ? "bg-green-400/10 border border-green-400/25 text-green-400" 
                  : connectionStatus === "Connecting" 
                  ? "bg-amber-400/10 border border-amber-400/25 text-amber-400" 
                  : "bg-red-400/10 border border-red-400/25 text-red-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === "Connected" ? "bg-green-400 animate-pulse" : connectionStatus === "Connecting" ? "bg-amber-400 animate-spin" : "bg-red-400"
                }`}></span>
                {connectionStatus === "Connected" ? `${dbType} Active` : connectionStatus === "Connecting" ? "Handshaking..." : "Disconnected"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                <span className="text-[9px] text-outline uppercase font-bold">Synchronized</span>
                <p className="text-xl font-extrabold text-primary">{syncProgress}%</p>
              </div>

              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
                <span className="text-[9px] text-outline uppercase font-bold">Last Synchronized</span>
                <p className="text-label-md font-extrabold text-secondary mt-0.5">{lastSynced}</p>
              </div>
            </div>
            
            {syncProgress < 100 && (
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <div className="glass-panel rounded-2xl p-md md:p-lg flex-1 flex flex-col justify-between">
            <form onSubmit={handleConnectNeon} className="space-y-md">
              <div className="flex items-center gap-sm border-b border-white/5 pb-sm">
                <span className="material-symbols-outlined text-primary text-2xl">database</span>
                <div>
                  <h3 className="font-extrabold text-on-surface tracking-tight leading-none text-headline-md">NeonDB Pipeline</h3>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Config Neon connection variables</p>
                </div>
              </div>

              <div className="space-y-sm">
                <div className="space-y-xs">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Host URL (AWS Region)</label>
                  <input 
                    type="text" 
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    disabled={connectionStatus === "Connecting"}
                    className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary px-3 py-2 text-label-sm text-on-surface font-semibold outline-none rounded-t disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div className="space-y-xs">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Database Name</label>
                    <input 
                      type="text" 
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      disabled={connectionStatus === "Connecting"}
                      className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary px-3 py-2 text-label-sm text-on-surface font-semibold outline-none rounded-t disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-xs">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider">DB Admin User</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={connectionStatus === "Connecting"}
                      className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary px-3 py-2 text-label-sm text-on-surface font-semibold outline-none rounded-t disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-xs relative">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Database Access Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={connectionStatus === "Connecting"}
                      className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary pl-3 pr-10 py-2 text-label-sm text-on-surface font-semibold outline-none rounded-t disabled:opacity-50"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="pt-md border-t border-white/5">
              {dbType === "SQLite" ? (
                <button 
                  onClick={handleConnectNeon}
                  disabled={connectionStatus === "Connecting"}
                  className="w-full py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:brightness-110 text-on-primary-container rounded-xl text-label-sm font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Save & Secure Connect
                </button>
              ) : (
                <button 
                  onClick={handleDisconnect}
                  disabled={connectionStatus === "Connecting"}
                  className="w-full py-2.5 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl text-label-sm font-extrabold transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Disconnect NeonDB Pipeline
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Schema Table Catalog & DB Console */}
        <div className="lg:col-span-7 min-w-0 flex flex-col gap-md lg:max-h-full">
          
          {/* Active Tables Grid List */}
          <div className="glass-panel rounded-2xl flex flex-col min-h-0 lg:max-h-[60%]">
            <div className="p-md border-b border-white/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-label-md text-on-surface">Data Engine Schema Catalog</h3>
                <span className="text-[9px] text-outline font-semibold">Active data tables synced from {dbType} engine.</span>
              </div>
              <span className="text-[10px] text-primary uppercase font-bold">{tables.length} tables found</span>
            </div>

            <div className="overflow-y-auto divide-y divide-white/5">
              {tables.map((table) => (
                <div key={table.name} className="p-md flex items-center justify-between hover:bg-white/2 transition-colors">
                  <div className="space-y-sm min-w-0 flex-1">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-outline text-[18px]">table_rows</span>
                      <span className="text-label-md font-bold text-on-surface truncate">{table.name}</span>
                      <span className="text-[9px] text-outline/70">({table.size})</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-xs">
                      {table.columns.map(c => (
                        <span key={c} className="text-[8px] font-semibold font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-outline-variant">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right pl-md">
                    <p className="text-label-sm font-extrabold text-on-surface">{table.records.toLocaleString()} rows</p>
                    <span className={`text-[8px] font-extrabold uppercase inline-block mt-xs ${
                      table.status === "Synchronized" 
                        ? "text-emerald-400" 
                        : table.status === "Syncing" 
                        ? "text-amber-400 animate-pulse" 
                        : "text-red-400"
                    }`}>
                      {table.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Logging Terminal */}
          <div className="glass-panel rounded-2xl p-md md:p-lg flex-1 flex flex-col min-h-[220px] relative">
            <div className="crystalline absolute inset-0 rounded-2xl"></div>
            
            <div className="flex justify-between items-center pb-sm border-b border-white/5 text-outline shrink-0 relative z-10">
              <div className="flex items-center gap-xs select-none">
                <span className="material-symbols-outlined text-label-md text-primary animate-pulse">settings_ethernet</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Database Syncer Ingress Engine</span>
              </div>
              <button 
                onClick={() => setSimulatedLogs([])}
                className="text-[9px] font-bold hover:text-on-surface text-outline uppercase hover:underline"
              >
                Clear Ingress
              </button>
            </div>

            {/* Ingress logs console */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-xs p-sm mt-sm bg-surface-container-lowest/80 rounded-xl border border-white/5 select-text select-all leading-normal relative z-10 custom-scrollbar">
              {simulatedLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-outline/40 select-none">
                  <span>Connection logs clear. Establishment and sync steps will register here.</span>
                </div>
              ) : (
                simulatedLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap transition-opacity duration-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
