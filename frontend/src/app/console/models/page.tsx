"use client";

import { useState, useEffect } from "react";

interface Model {
  id: string;
  name: string;
  type: string;
  status: "Active" | "Standby";
  latency: number; // ms
  cost: number; // $ per 1k tokens
  accuracy: number; // %
  description: string;
  icon: string;
  parameters: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([
    {
      id: "gpt-4o-v2",
      name: "IF-GPT-4o-V2",
      type: "General Intelligence & Reasoning",
      status: "Active",
      latency: 122,
      cost: 0.0021,
      accuracy: 88.2,
      description: "Standard enterprise general intelligence. Optimized for low latency and high accuracy across analytical tasks.",
      icon: "rocket_launch",
      parameters: { temperature: 0.7, top_p: 0.9, max_tokens: 2048 }
    },
    {
      id: "llama3-70b",
      name: "IF-LLAMA3-70B",
      type: "Advanced Logical Inference",
      status: "Standby",
      latency: 842,
      cost: 0.0054,
      accuracy: 94.7,
      description: "Superior logical and domain reasoning. Best suited for high-density SQL query formulation and deep diagnostics.",
      icon: "psychology",
      parameters: { temperature: 0.2, top_p: 0.85, max_tokens: 1024 }
    },
    {
      id: "claude-3.5",
      name: "IF-CLAUDE3.5-SONNET",
      type: "Contextual Synthesizer",
      status: "Active",
      latency: 412,
      cost: 0.0084,
      accuracy: 92.8,
      description: "Deep multi-stage conversational parsing. Outstanding context window and stateful retention capabilities.",
      icon: "auto_awesome",
      parameters: { temperature: 0.5, top_p: 0.95, max_tokens: 4096 }
    },
    {
      id: "mixtral-8x7b",
      name: "IF-MIXTRAL-8x7B",
      type: "Lightweight MoE Router",
      status: "Active",
      latency: 512,
      cost: 0.0008,
      accuracy: 86.5,
      description: "Sparse mixture of experts model. Extremely cost-effective routing and fast general classification logic.",
      icon: "hub",
      parameters: { temperature: 0.8, top_p: 0.9, max_tokens: 1536 }
    }
  ]);

  const [selectedId, setSelectedId] = useState<string>("gpt-4o-v2");
  const selectedModel = models.find(m => m.id === selectedId) || models[0];

  // Parameters adjustment state
  const [temperature, setTemperature] = useState(selectedModel.parameters.temperature);
  const [topP, setTopP] = useState(selectedModel.parameters.top_p);
  const [maxTokens, setMaxTokens] = useState(selectedModel.parameters.max_tokens);

  // Sync state values when selected model changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTemperature(selectedModel.parameters.temperature);
      setTopP(selectedModel.parameters.top_p);
      setMaxTokens(selectedModel.parameters.max_tokens);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedId, selectedModel.parameters.max_tokens, selectedModel.parameters.temperature, selectedModel.parameters.top_p]);

  // Telemetry log list state
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Simulate log creation
  const logTelemetry = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + `.${Math.floor(Math.random() * 1000)}`;
    setSimulatedLogs(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 18)]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      logTelemetry(`Model cluster interface ready. Active model initialized: ${selectedModel.name}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedModel.name]);

  const handleUpdateParameters = () => {
    setModels(prev => prev.map(m => {
      if (m.id === selectedId) {
        return {
          ...m,
          parameters: { temperature, top_p: topP, max_tokens: maxTokens }
        };
      }
      return m;
    }));
    logTelemetry(`Successfully committed updated hyperparameters to ${selectedModel.name}: temp=${temperature}, top_p=${topP}, max_tok=${maxTokens}`);
  };

  const handleToggleStatus = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === "Active" ? "Standby" : "Active";
        logTelemetry(`Updated node deployment target: ${m.name} transitioned to ${nextStatus}`);
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const runBenchmark = () => {
    setIsTesting(true);
    logTelemetry(`Starting comprehensive diagnostic benchmarks on ${selectedModel.name}...`);
    
    setTimeout(() => {
      logTelemetry(`[Benchmark] Step 1/3 completed: Virtual prompt latency validated at ${selectedModel.latency}ms.`);
    }, 600);

    setTimeout(() => {
      logTelemetry(`[Benchmark] Step 2/3 completed: Token compute accuracy indexed at ${selectedModel.accuracy}%.`);
    }, 1200);

    setTimeout(() => {
      logTelemetry(`[Benchmark] Step 3/3 completed: Network ingress routing cost calculated at $${(selectedModel.cost * 1.1).toFixed(5)} per 1k tokens.`);
      setIsTesting(false);
      logTelemetry(`Benchmark telemetry finalized for ${selectedModel.name}. Status: OPTIMAL.`);
    }, 1800);
  };

  return (
    <div className="space-y-lg flex-1 relative flex flex-col min-h-0 min-w-0 select-none">
      
      {/* Page Header */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md shrink-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-sm tracking-tight leading-none">
            Models & Parameters
          </h1>
          <p className="text-body-md text-outline mt-1.5 font-semibold">
            Configure active node parameters and audit neural telemetry performance.
          </p>
        </div>

        <div className="flex gap-sm">
          <button 
            onClick={runBenchmark}
            disabled={isTesting}
            className="flex items-center gap-xs bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary px-md py-2 rounded-xl text-label-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isTesting ? 'animate-spin' : ''}`}>sync</span>
            {isTesting ? "Benchmarking..." : "Run Benchmark"}
          </button>
        </div>
      </section>

      {/* Main Two-Column Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-gutter min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column: Interactive Parameters Panel */}
        <div className="lg:col-span-4 min-w-0 flex flex-col gap-md lg:max-h-full">
          <div className="glass-panel rounded-2xl p-md md:p-lg space-y-md flex-1 flex flex-col justify-between">
            <div className="space-y-md">
              <div className="flex items-center gap-sm border-b border-white/5 pb-sm">
                <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                <div>
                  <h3 className="font-extrabold text-on-surface tracking-tight leading-none text-headline-md">Hyperparameters</h3>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Live Parameter Tuning</p>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-xs pt-sm">
                <div className="flex justify-between items-center text-label-sm font-semibold">
                  <span className="text-outline">Temperature (Creativity)</span>
                  <span className="text-primary font-mono font-bold">{temperature.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min={0.0} 
                  max={1.2} 
                  step={0.05} 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary border-none outline-none"
                />
                <p className="text-[9px] text-outline/60 leading-none">Lower values are focused and deterministic; higher values are more creative.</p>
              </div>

              {/* Top P Slider */}
              <div className="space-y-xs">
                <div className="flex justify-between items-center text-label-sm font-semibold">
                  <span className="text-outline">Top P (Nucleus Sampling)</span>
                  <span className="text-secondary font-mono font-bold">{topP.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min={0.0} 
                  max={1.0} 
                  step={0.05} 
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary border-none outline-none"
                />
                <p className="text-[9px] text-outline/60 leading-none">Controls probability mass threshold. 1.0 considers all candidate tokens.</p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-xs">
                <div className="flex justify-between items-center text-label-sm font-semibold">
                  <span className="text-outline">Max Completion Length</span>
                  <span className="text-primary font-mono font-bold">{maxTokens} tokens</span>
                </div>
                <input 
                  type="range" 
                  min={256} 
                  max={4096} 
                  step={256} 
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary border-none outline-none"
                />
                <p className="text-[9px] text-outline/60 leading-none">The absolute limit on token response sizes for inference generations.</p>
              </div>
            </div>

            <div className="pt-md border-t border-white/5 space-y-sm">
              <div className="flex justify-between items-center text-label-sm font-semibold">
                <span className="text-outline">Target Node Instance</span>
                <span className="text-on-surface font-extrabold">{selectedModel.name}</span>
              </div>
              <button 
                onClick={handleUpdateParameters}
                className="w-full py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:brightness-110 text-on-primary-container rounded-xl text-label-sm font-extrabold shadow-md transition-all active:scale-[0.98]"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Model Cards & Live Telemetry Console */}
        <div className="lg:col-span-8 min-w-0 flex flex-col gap-md lg:max-h-full">
          
          {/* Models Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md shrink-0">
            {models.map((model) => {
              const isSelected = model.id === selectedId;
              const isActive = model.status === "Active";

              return (
                <div 
                  key={model.id}
                  onClick={() => setSelectedId(model.id)}
                  className={`glass-panel p-md rounded-2xl cursor-pointer hover:scale-[1.01] transition-all relative flex min-w-0 flex-col justify-between min-h-[180px] overflow-hidden ${
                    isSelected ? "border-primary/45 bg-surface-container-low/80" : "hover:border-white/10"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-0 right-0 bottom-0 w-1 bg-primary rounded-r"></span>
                  )}

                  <div className="space-y-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-xs">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          isSelected ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-outline"
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">{model.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-label-md text-on-surface leading-tight truncate">{model.name}</h4>
                          <span className="text-[9px] text-outline font-semibold mt-0.5 inline-block leading-tight">{model.type}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(model.id);
                        }}
                        className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all ${
                          isActive 
                            ? "bg-green-400/10 border border-green-400/25 text-green-400" 
                            : "bg-outline-variant/10 border border-outline-variant/25 text-outline"
                        }`}
                      >
                        {model.status}
                      </button>
                    </div>

                    <p className="text-[11px] text-on-surface-variant font-semibold leading-normal line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-sm border-t border-white/5 mt-xs text-[10px] font-bold text-outline uppercase tracking-wider">
                    <div className="space-y-xs">
                      <span>Latency</span>
                      <p className="text-on-surface font-extrabold font-mono text-[11px]">{model.latency}ms</p>
                    </div>
                    <div className="space-y-xs">
                      <span>Cost / 1k</span>
                      <p className="text-primary font-extrabold font-mono text-[11px]">${model.cost.toFixed(4)}</p>
                    </div>
                    <div className="space-y-xs">
                      <span>Accuracy</span>
                      <p className="text-secondary font-extrabold font-mono text-[11px]">{model.accuracy}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Telemetry Console Logs */}
          <div className="glass-panel rounded-2xl p-md md:p-lg flex-1 flex flex-col min-h-[220px] lg:min-h-0 relative">
            <div className="crystalline absolute inset-0 rounded-2xl"></div>
            
            <div className="flex justify-between items-center pb-sm border-b border-white/5 text-outline shrink-0">
              <div className="flex items-center gap-xs select-none">
                <span className="material-symbols-outlined text-label-md text-primary animate-pulse">terminal</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Neural Node Execution Logger</span>
              </div>
              <button 
                onClick={() => setSimulatedLogs([])}
                className="text-[9px] font-bold hover:text-on-surface text-outline uppercase hover:underline"
              >
                Clear Log
              </button>
            </div>

            {/* Logger Output */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-green-400 space-y-xs p-sm mt-sm bg-surface-container-lowest/80 rounded-xl border border-white/5 select-text select-all leading-normal">
              {simulatedLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-outline/40 select-none">
                  <span>No recent neural executions. Run benchmark or adjust parameters to trigger telemetry.</span>
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
