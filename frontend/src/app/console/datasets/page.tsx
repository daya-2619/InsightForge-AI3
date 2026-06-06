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
  // Database Configuration State
  const [dbUrl, setDbUrl] = useState("");
  const [maskedUrl, setMaskedUrl] = useState("");
  const [showRawUrl, setShowRawUrl] = useState(false);
  const [dbStatus, setDbStatus] = useState<"Connected" | "Disconnected" | "Connecting">("Disconnected");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File Ingestion State
  const [targetTable, setTargetTable] = useState<"execution_logs" | "activities" | "kpi_records">("execution_logs");
  const [ingestMode, setIngestMode] = useState<"overwrite" | "append">("overwrite");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState(0);

  // Schema Table Catalog State
  const [tables, setTables] = useState<DBTable[]>([]);

  const [isRunningEtl, setIsRunningEtl] = useState(false);
  const [etlProgress, setEtlProgress] = useState(0);

  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);

  const logDatabase = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulatedLogs(prev => [`[${timestamp}] DB: ${text}`, ...prev.slice(0, 25)]);
  };

  // Fetch actual database schema from backend
  const fetchTableCounts = () => {
    fetch("http://127.0.0.1:8000/api/neondb/tables")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTables(data);
          if (data.length > 0) {
            setTargetTable(prev => data.some((t: DBTable) => t.name === prev) ? prev : data[0].name);
          }
          logDatabase("Refreshed data catalog statistics with actual database schema.");
        } else {
          logDatabase("Failed to parse database schema catalog. Reverting to fallback.");
        }
      })
      .catch(() => {
        logDatabase("Failed to retrieve live schema catalog. Server unreachable.");
      });
  };

  // Fetch saved URL & schema stats on load
  useEffect(() => {
    logDatabase("Database sync engine loaded. Resolving connection settings...");
    
    // Fetch NeonDB config
    fetch("http://127.0.0.1:8000/api/neondb/config")
      .then(res => res.json())
      .then(data => {
        if (data.database_url) {
          setDbUrl(data.database_url);
          setMaskedUrl(data.masked_url);
          if (data.active_status === "Offline") {
            setDbStatus("Disconnected");
            logDatabase("Warning: PostgreSQL database is currently offline or unreachable.");
          } else {
            setDbStatus("Connected");
            logDatabase("Connection string loaded. Active connection: PostgreSQL (NeonDB).");
          }
        } else {
          setDbStatus("Disconnected");
          logDatabase("SQLite Fallback is active. NeonDB configuration has not been set.");
        }
      })
      .catch(() => {
        logDatabase("Unable to communicate with local API server. Running client sandbox.");
      });
      
    // Fetch counts
    fetchTableCounts();
  }, []);

  // Save config
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dbUrl) {
      logDatabase("Error: Connection string is required to save config.");
      return;
    }
    setIsSaving(true);
    logDatabase("Committing PostgreSQL connection string to environment properties...");
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/neondb/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database_url: dbUrl })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.db_initialized) {
          setDbStatus("Connected");
          logDatabase(`Success: ${data.message}`);
        } else {
          setDbStatus("Disconnected");
          logDatabase(`Success: ${data.message} Warning: ${data.warning}`);
        }
        // Fetch new counts
        fetchTableCounts();
      } else {
        logDatabase(`Failed to save config: ${data.detail || "Validation Error"}`);
      }
    } catch (err) {
      logDatabase("Save aborted. Connection timed out.");
    } finally {
      setIsSaving(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!dbUrl) {
      logDatabase("Error: Connection string is required to run handshake.");
      return;
    }
    setIsTesting(true);
    setDbStatus("Connecting");
    logDatabase("Executing remote connection test to NeonDB cluster...");
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/neondb/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database_url: dbUrl })
      });
      
      const data = await res.json();
      if (res.ok) {
        setDbStatus("Connected");
        logDatabase(`Handshake OK: ${data.message}`);
      } else {
        setDbStatus("Disconnected");
        logDatabase(`Handshake failed: ${data.detail || "Invalid server response"}`);
      }
    } catch (err) {
      setDbStatus("Disconnected");
      logDatabase("Handshake timed out. NeonDB cluster unreachable.");
    } finally {
      setIsTesting(false);
    }
  };

  // File Ingestion Logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      logDatabase(`Selected file via drop: ${e.dataTransfer.files[0].name} (${(e.dataTransfer.files[0].size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      logDatabase(`Selected file: ${e.target.files[0].name} (${(e.target.files[0].size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleIngest = async () => {
    if (!file) {
      logDatabase("Error: Please load a file before ingesting.");
      return;
    }
    setIsIngesting(true);
    setIngestProgress(20);
    logDatabase(`Preparing ingestion workspace for table '${targetTable}'...`);
    logDatabase(`Reading dataset: ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("table_name", targetTable);
    formData.append("mode", ingestMode);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/neondb/ingest", {
        method: "POST",
        body: formData
      });
      
      setIngestProgress(60);
      const data = await res.json();
      
      if (res.ok) {
        setIngestProgress(100);
        logDatabase(`Success: Ingested ${data.count} rows into NeonDB table '${data.table}'.`);
        setFile(null);
        // Refresh counts
        fetchTableCounts();
      } else {
        setIngestProgress(0);
        logDatabase(`Ingestion Failed: ${data.detail || "Validation or type error in dataset files."}`);
      }
    } catch (err) {
      setIngestProgress(0);
      logDatabase("Ingestion failed due to backend server connection timeout.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleRunEtl = async () => {
    setIsRunningEtl(true);
    setEtlProgress(20);
    logDatabase("Initiating FMCG Sales Data ETL pipeline execution...");
    logDatabase("Connecting to database & scanning data directories...");
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/neondb/run-etl", {
        method: "POST"
      });
      setEtlProgress(60);
      const data = await res.json();
      
      if (res.ok) {
        setEtlProgress(100);
        logDatabase("ETL Pipeline completed successfully.");
        if (data.logs) {
          data.logs.forEach((l: string) => logDatabase(l));
        }
        // Refresh counts
        fetchTableCounts();
      } else {
        setEtlProgress(0);
        logDatabase(`ETL Failed: ${data.detail || "Server error"}`);
      }
    } catch (err) {
      setEtlProgress(0);
      logDatabase("ETL Pipeline failed due to backend server timeout.");
    } finally {
      setIsRunningEtl(false);
    }
  };


  return (
    <div className="space-y-lg flex-1 relative flex flex-col min-h-0 min-w-0 select-none">
      
      {/* Page Header */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md shrink-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-sm tracking-tight leading-none">
            NeonDB Pipeline & Ingestor
          </h1>
          <p className="text-body-md text-outline mt-1.5 font-semibold">
            Configure Neon PostgreSQL servers, test connections, and ingest CSV or JSON datasets directly into tables.
          </p>
        </div>
      </section>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter min-w-0">
        
        {/* Left Column: NeonDB Configuration Panel */}
        <div className="lg:col-span-5 min-w-0 flex flex-col gap-md">
          
          {/* Connection Status Indicator */}
          <div className="glass-panel rounded-2xl p-md md:p-lg space-y-md">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-outline font-bold uppercase tracking-widest">Active Data Engine</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-xs ${
                dbStatus === "Connected" 
                  ? "bg-green-400/10 border border-green-400/25 text-green-400" 
                  : dbStatus === "Connecting" 
                  ? "bg-amber-400/10 border border-amber-400/25 text-amber-400" 
                  : dbUrl 
                  ? "bg-red-400/10 border border-red-400/25 text-red-400" 
                  : "bg-blue-400/10 border border-blue-400/25 text-blue-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus === "Connected" 
                    ? "bg-green-400 animate-pulse" 
                    : dbStatus === "Connecting" 
                    ? "bg-amber-400 animate-spin" 
                    : dbUrl 
                    ? "bg-red-400" 
                    : "bg-blue-400"
                }`}></span>
                {dbUrl 
                  ? (dbStatus === "Connected" ? "NeonDB Connected" : dbStatus === "Connecting" ? "Connecting..." : "Connection Offline") 
                  : "SQLite Fallback"
                }
              </span>
            </div>

            <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-xs">
              <span className="text-[9px] text-outline uppercase font-bold">NeonDB Cluster Url</span>
              <p className="text-label-sm font-semibold text-secondary truncate mt-0.5">
                {dbUrl ? (showRawUrl ? dbUrl : maskedUrl) : "Sourcing local backup database (insightforge.db)"}
              </p>
            </div>
          </div>

          {/* Configuration Form Panel */}
          <div className="glass-panel rounded-2xl p-md md:p-lg flex flex-col justify-between">
            <form onSubmit={handleSaveConfig} className="space-y-md flex flex-col h-full justify-between">
              <div className="space-y-md">
                <div className="flex items-center gap-sm border-b border-white/5 pb-sm">
                  <span className="material-symbols-outlined text-primary text-2xl">database</span>
                  <div>
                    <h3 className="font-extrabold text-on-surface tracking-tight leading-none text-headline-md">Database Connection</h3>
                    <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Config Neon PostgreSQL variables</p>
                  </div>
                </div>

                <div className="space-y-xs relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Neon Connection URL</label>
                    <button 
                      type="button" 
                      onClick={() => setShowRawUrl(!showRawUrl)}
                      className="text-[9px] font-extrabold text-primary hover:underline hover:text-primary-fixed cursor-pointer"
                    >
                      {showRawUrl ? "Hide Key" : "Reveal URL"}
                    </button>
                  </div>
                  <input 
                    type={showRawUrl ? "text" : "password"}
                    placeholder="postgresql://user:password@ep-glassy-galaxy-a5v6qdg7.us-east-2.aws.neon.tech/insightforge_enterprise"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    disabled={isTesting || isSaving}
                    className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary px-3 py-2 text-label-sm text-on-surface font-mono outline-none rounded-t disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-md border-t border-white/5 space-y-sm mt-md">
                <div className="flex gap-sm">
                  <button 
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !dbUrl}
                    className="flex-1 py-2 bg-surface-container-high hover:bg-white/5 border border-white/10 text-on-surface hover:text-primary rounded-xl text-label-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isTesting ? "Testing..." : "Test Connection"}
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving || !dbUrl}
                    className="flex-1 py-2 bg-gradient-to-r from-primary-container to-secondary-container hover:brightness-110 text-on-primary-container rounded-xl text-label-sm font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Save Connection"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Dataset File Ingestion Workspace */}
        <div className="lg:col-span-7 min-w-0 flex flex-col gap-md">
          
          <div className="glass-panel rounded-2xl p-md md:p-lg flex flex-col justify-between">
            <div className="space-y-md flex flex-col">
              <div className="flex items-center gap-sm border-b border-white/5 pb-sm">
                <span className="material-symbols-outlined text-primary text-2xl">cloud_upload</span>
                <div>
                  <h3 className="font-extrabold text-on-surface tracking-tight leading-none text-headline-md">Dataset File Ingestor</h3>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Upload records to active database</p>
                </div>
              </div>

              {/* Ingestion Parameters Selection */}
              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-xs">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Target Database Table</label>
                  <select 
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value as any)}
                    className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary px-3 py-2 text-label-sm text-on-surface font-semibold outline-none rounded-t cursor-pointer"
                  >
                    {tables.length > 0 ? (
                      tables.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))
                    ) : (
                      <option value="">No tables available</option>
                    )}
                  </select>
                </div>

                <div className="space-y-xs">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Ingestion Mode</label>
                  <select 
                    value={ingestMode}
                    onChange={(e) => setIngestMode(e.target.value as any)}
                    className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary px-3 py-2 text-label-sm text-on-surface font-semibold outline-none rounded-t cursor-pointer"
                  >
                    <option value="overwrite">Overwrite (Clear & Ingest)</option>
                    <option value="append">Append (Add rows)</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop Box Workspace */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 min-h-[160px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-lg text-center transition-all mt-sm relative cursor-pointer ${
                  dragActive 
                    ? "border-primary bg-primary/5" 
                    : file 
                    ? "border-secondary/40 bg-secondary/5" 
                    : "border-outline-variant hover:border-outline bg-surface-container/10"
                }`}
              >
                <input 
                  type="file" 
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <span className={`material-symbols-outlined text-4xl mb-sm ${file ? "text-secondary" : "text-outline"}`}>
                  {file ? "description" : "upload_file"}
                </span>

                {file ? (
                  <div className="space-y-xs max-w-[85%]">
                    <p className="text-label-md font-bold text-on-surface truncate">{file.name}</p>
                    <p className="text-[10px] text-outline font-mono">
                      Size: {(file.size / 1024).toFixed(1)} KB | Format: {file.name.split(".").pop()?.toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-xs">
                    <p className="text-label-sm font-bold text-on-surface">
                      Drag & drop dataset file here, or click to browse
                    </p>
                    <p className="text-[9px] text-outline font-semibold">
                      Accepts only JSON (.json) or CSV (.csv) formats matching the target schema.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-md border-t border-white/5 space-y-sm mt-md">
              {isIngesting && ingestProgress < 100 && (
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-xs">
                  <div 
                    className="h-full bg-secondary transition-all duration-300" 
                    style={{ width: `${ingestProgress}%` }}
                  ></div>
                </div>
              )}

              <button 
                onClick={handleIngest}
                disabled={isIngesting || !file}
                className="w-full py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:brightness-110 text-on-primary-container rounded-xl text-label-sm font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isIngesting ? "Ingesting Dataset..." : "Ingest Dataset File"}
              </button>
            </div>
          </div>
          
          {/* Consolidated Sales Pipeline (FMCG) ETL Panel */}
          <div className="glass-panel rounded-2xl p-md md:p-lg flex flex-col justify-between">
            <div className="space-y-md">
              <div className="flex items-center gap-sm border-b border-white/5 pb-sm">
                <span className="material-symbols-outlined text-secondary text-2xl">cached</span>
                <div>
                  <h3 className="font-extrabold text-on-surface tracking-tight leading-none text-headline-md">Consolidated Sales Pipeline (FMCG)</h3>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Clean and merge parent/child company data</p>
                </div>
              </div>

              <div className="p-md bg-surface-container rounded-xl border border-white/5 space-y-sm">
                <span className="text-[9px] text-outline uppercase font-bold">Consolidation Engine Details</span>
                <p className="text-label-sm font-semibold text-on-surface-variant leading-relaxed">
                  Executing this data pipeline runs a unified Python ETL workflow to import all transactions from parent and child companies.
                  It cleans spelling typos, resolves duplicate records, handles negative prices, forward-fills missing month values, and enforces relational constraints.
                </p>
              </div>
            </div>

            <div className="pt-md border-t border-white/5 space-y-sm mt-md">
              {isRunningEtl && etlProgress < 100 && (
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-xs">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${etlProgress}%` }}
                  ></div>
                </div>
              )}

              <button 
                onClick={handleRunEtl}
                disabled={isRunningEtl}
                className="w-full py-2.5 bg-gradient-to-r from-secondary-container to-primary-container hover:brightness-110 text-on-secondary-container rounded-xl text-label-sm font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isRunningEtl ? "Executing ETL Pipeline..." : "Run ETL Data Pipeline"}
              </button>
            </div>
          </div>
          
        </div>

      </div>

      {/* Bottom Row: Schema Table Catalog & Logging Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter shrink-0">
        
        {/* Table Schema Catalog */}
        <div className="lg:col-span-6 glass-panel rounded-2xl flex flex-col min-h-[220px] max-h-[300px]">
          <div className="p-md border-b border-white/5 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-extrabold text-label-md text-on-surface">Data Engine Schema Catalog</h3>
              <span className="text-[9px] text-outline font-semibold">Active database tables synced from database engine.</span>
            </div>
            <span className="text-[10px] text-primary uppercase font-bold">{tables.length} tables found</span>
          </div>

          <div className="overflow-y-auto divide-y divide-white/5 flex-1">
            {tables.map((table) => (
              <div key={table.name} className="p-sm px-md flex items-center justify-between hover:bg-white/2 transition-colors">
                <div className="space-y-xs min-w-0 flex-1">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-outline text-[16px]">table_rows</span>
                    <span className="text-label-sm font-bold text-on-surface truncate">{table.name}</span>
                    <span className="text-[9px] text-outline/70">({table.size})</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-xs">
                    {table.columns.slice(0, 5).map(c => (
                      <span key={c} className="text-[7px] font-semibold font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-outline-variant">
                        {c}
                      </span>
                    ))}
                    {table.columns.length > 5 && (
                      <span className="text-[7px] font-semibold font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-outline-variant">
                        +{table.columns.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right pl-md">
                  <p className="text-label-sm font-extrabold text-on-surface">{table.records.toLocaleString()} rows</p>
                  <span className="text-[7px] font-extrabold uppercase inline-block text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1 rounded mt-xs">
                    {table.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Logging Terminal */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-md flex flex-col min-h-[220px] max-h-[300px] relative">
          <div className="crystalline absolute inset-0 rounded-2xl"></div>
          
          <div className="flex justify-between items-center pb-sm border-b border-white/5 text-outline shrink-0 relative z-10">
            <div className="flex items-center gap-xs select-none">
              <span className="material-symbols-outlined text-label-md text-primary animate-pulse">settings_ethernet</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Database Syncer Ingress Engine</span>
            </div>
            <button 
              onClick={() => setSimulatedLogs([])}
              className="text-[9px] font-bold hover:text-on-surface text-outline uppercase hover:underline cursor-pointer"
            >
              Clear Ingress
            </button>
          </div>

          {/* Ingress logs console */}
          <div className="flex-1 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-xs p-sm mt-sm bg-surface-container-lowest/80 rounded-xl border border-white/5 select-text select-all leading-normal relative z-10 custom-scrollbar">
            {simulatedLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-outline/40 select-none">
                <span>Ingestion logs clear. Database configuration saves or file ingestion uploads will register here.</span>
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
  );
}
