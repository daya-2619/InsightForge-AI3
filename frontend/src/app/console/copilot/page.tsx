"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string | null;
  chart?: {
    type: "bar" | "pie";
    title: string;
    labels: string[];
    values: number[];
  } | null;
  metrics?: Array<{
    label: string;
    value: string;
    sub: string;
  }> | null;
  timestamp: string;
}

export default function CopilotPage() {
  const messageIdRef = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **Struxiva AI Copilot**. I have real-time analytical access to all nodes, databases, execution logs, and activities across the system. Ask me specific questions like *'Why did revenue drop last month?'*, *'Analyze customer churn'*, or *'Compare model accuracy'* and I will fetch live telemetry, generate structural SQL queries, and render interactive data visualizations for you!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const nextMessageId = () => {
      messageIdRef.current += 1;
      return `msg-${messageIdRef.current}`;
    };

    // Create user message
    const userMsg: ChatMessage = {
      id: nextMessageId(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      // Build conversation history for API call
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: history,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: ChatMessage = {
          id: nextMessageId(),
          role: "assistant",
          content: data.message.content,
          sql: data.sql,
          chart: data.chart,
          metrics: data.metrics,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("HTTP error " + response.status);
      }
    } catch {
      console.warn("FastAPI backend is offline. Triggering high-fidelity mock response fallback.");
      
      // High-fidelity client-side mock logic matching FastAPI main.py
      setTimeout(() => {
        let responseText = "";
        let sqlQuery: string | null = null;
        let chartData = null;
        let metricsData = null;
        const msgLower = text.toLowerCase();

        if (msgLower.includes("revenue") || msgLower.includes("sales") || msgLower.includes("money") || msgLower.includes("earnings")) {
          responseText =
            "I've fetched our Q3 financial statistics from the primary database logs. Our overall enterprise revenue stands at **$2.4M**, showing a strong **+12%** growth rate. However, the EMEA market experienced a minor 4% slowdown during Week 2, which was quickly corrected.";
          sqlQuery =
            "SELECT region, sum(revenue) as total_revenue, avg(growth) as avg_growth\nFROM financial_records\nWHERE quarter = 'Q3'\nGROUP BY region\nORDER BY total_revenue DESC;";
          chartData = {
            type: "bar" as const,
            title: "Revenue by Region (Millions USD)",
            labels: ["N. America", "Europe", "APAC", "LATAM"],
            values: [1.2, 0.7, 0.5, 0.2],
          };
          metricsData = [
            { label: "Direct Sales", value: "$1.82M", sub: "+14.1% MoM" },
            { label: "Partner Sales", value: "$0.58M", sub: "+5.2% MoM" },
          ];
        } else if (msgLower.includes("churn") || msgLower.includes("customers") || msgLower.includes("retention") || msgLower.includes("users")) {
          responseText =
            "Our current customer churn audit indicates a contract expiry concentration in the 'Mid-Market' segment. The overall customer churn rate increased slightly to **12.4%** (+2.1% from last month), primarily affecting 42 accounts whose contracts expired concurrently. I recommend launching targeted retention alerts 60 days prior to contract expiry.";
          sqlQuery =
            "SELECT count(user_id) as churned_users, segment, reason\nFROM churn_events\nWHERE date >= date_sub(now(), interval 30 day)\nGROUP BY segment, reason;";
          chartData = {
            type: "pie" as const,
            title: "Churn Reasons (Mid-Market)",
            labels: ["Contract Expiry", "Competitor Upgrade", "Pricing", "Support Delay"],
            values: [55, 20, 15, 10],
          };
          metricsData = [
            { label: "Churn Rate", value: "12.4%", sub: "+2.1% increase" },
            { label: "Key Reason", value: "Contract Expiry", sub: "42 accounts affected" },
          ];
        } else if (msgLower.includes("model") || msgLower.includes("accuracy") || msgLower.includes("performance") || msgLower.includes("speed")) {
          responseText =
            "Comparing our baseline core models shows a distinct latency-to-accuracy trade-off. **IF-GPT-4o-V2** offers excellent lightweight speed (122ms average latency) but slightly lower domain specialization, whereas **IF-LLAMA3-70B** maintains superior structured task reasoning but features higher latency (842ms).";
          sqlQuery =
            "SELECT model_id, avg(latency) as avg_latency, count(id) as total_inferences\nFROM execution_logs\nWHERE status = 'Success'\nGROUP BY model_id;";
          chartData = {
            type: "bar" as const,
            title: "Model Average Latency (ms)",
            labels: ["GPT-4o-V2", "CLAUDE-3.5", "LLAMA3-70B"],
            values: [122, 412, 842],
          };
          metricsData = [
            { label: "GPT-4o-V2 Latency", value: "122ms", sub: "Standard speed" },
            { label: "LLAMA3-70B Latency", value: "842ms", sub: "Heavy reasoning" },
          ];
        } else if (msgLower.includes("strategy") || msgLower.includes("retention") || msgLower.includes("suggest")) {
          responseText =
            "To combat mid-market contract churn and stabilize EMEA revenue streams, I suggest: \n\n1. **Auto-Trigger Retention campaigns:** Integrate alerts in our CRM 60 days before contract expiry. \n2. **Frankfurt replication nodes:** Expand the DB connection pool and deploy dynamic replicas to avoid EU regional slow-downs. \n3. **Proactive tier upgrades:** Pitch customized 'Specialized Tuning' models (e.g. IF-LLAMA3-70B) to APAC and LATAM fast-growing customers.";
          sqlQuery = null;
          chartData = null;
          metricsData = [
            { label: "Stability Index", value: "+18%", sub: "Projected lift" },
            { label: "Implementation", value: "2 Weeks", sub: "Zero downtime" },
          ];
        } else {
          responseText =
            "I'm here to support your operations workspace. I can run live reports, write custom telemetry aggregation queries, and graph model benchmarks. Please feel free to ask about *'revenue charts'*, *'customer churn metrics'*, or *'model performance comparison'*!";
          sqlQuery = null;
          chartData = null;
          metricsData = null;
        }

        const assistantMsg: ChatMessage = {
          id: nextMessageId(),
          role: "assistant",
          content: responseText,
          sql: sqlQuery,
          chart: chartData,
          metrics: metricsData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const suggestionChips = [
    "Why did revenue drop last month?",
    "Analyze customer churn",
    "Compare model accuracy",
    "Suggest retention strategy",
  ];

  // Helper function to format chat content with basic markdown (bold text)
  const formatContent = (content: string) => {
    // Basic regex replacement for bold items
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="text-primary font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      
      // Handle simple newlines as linebreaks
      const lineParts = part.split("\n");
      return lineParts.map((line, lIdx) => (
        <span key={`${index}-${lIdx}`}>
          {line}
          {lIdx < lineParts.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <div className="space-y-lg flex-1 relative flex flex-col min-h-0 min-w-0 select-none">
      
      {/* Workspace Header Toolbar */}
      <section className="min-h-12 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-sm px-xs pb-sm sm:pb-0 shrink-0 select-none">
        <div className="flex items-center gap-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-xs px-2 py-1 bg-surface-container-highest/40 rounded border border-white/5">
            <span className="text-[10px] text-outline font-bold">Workspace:</span>
            <span className="text-[10px] text-on-surface font-extrabold">Enterprise_Copilot_v3.2</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-label-sm text-outline flex items-center gap-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> Copilot Interface Running
          </span>
        </div>
        
        <div className="flex items-center gap-sm text-[10px] font-bold text-outline uppercase tracking-wider">
          <span className="hidden sm:inline">Active Session ID: </span>
          <span className="text-primary font-mono select-all">IF-AI-778X-Q</span>
        </div>
      </section>

      {/* Main chat viewport */}
      <div className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden bg-surface-dim rounded-2xl border border-white/5 relative p-4 min-h-[500px]">
        
        {/* Ambient Decorative Blurs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-primary/5 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-secondary/5 blur-[80px] rounded-full"></div>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-md custom-scrollbar relative z-10">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex min-w-0 gap-md w-full sm:max-w-[85%] ${
                  isUser ? "ml-auto justify-end" : "mr-auto"
                }`}
              >
                {/* AI Assistant Avatar */}
                {!isUser && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-[0_0_15px_-3px_rgba(195,192,255,0.3)]">
                    <span
                      className="material-symbols-outlined text-[#13121b] text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className="space-y-sm min-w-0 flex-1">
                  <div
                    className={`${
                      isUser
                        ? "bg-surface-container-high rounded-2xl rounded-tr-none px-md py-sm border border-white/10 shadow-sm text-on-surface"
                        : "glass-panel rounded-2xl p-md shadow-md text-on-surface border-white/5"
                    }`}
                  >
                    {/* Header bar inside Assistant Bubble */}
                    {!isUser && (
                      <div className="flex items-center justify-between mb-sm border-b border-white/5 pb-2 text-[10px] font-bold text-outline">
                        <div className="flex items-center gap-xs">
                          <span className="text-primary tracking-widest uppercase">INSIGHT SATELLITE</span>
                          <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
                        </div>
                        <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                          CONFIDENCE: 98%
                        </span>
                      </div>
                    )}

                    {/* Text Message Content */}
                    <p className="text-label-md text-on-surface leading-relaxed whitespace-pre-wrap select-text font-semibold">
                      {formatContent(msg.content)}
                    </p>

                    {/* Rich SQL Pane Overlay */}
                    {!isUser && msg.sql && (
                      <div className="mt-md space-y-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-widest px-xs">
                          <span className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-label-sm">database</span>
                            SQL query executed
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.sql || "", msg.id)}
                            className="hover:text-primary transition-colors flex items-center gap-xs cursor-pointer py-0.5 px-2 bg-white/5 rounded border border-white/10"
                          >
                            <span className="material-symbols-outlined text-[12px]">content_copy</span>
                            {copiedId === msg.id ? "Copied!" : "Copy SQL"}
                          </button>
                        </div>
                        
                        <div className="bg-surface-container-lowest border border-white/5 rounded-xl p-md font-mono text-label-sm text-on-surface-variant overflow-x-auto whitespace-pre select-all select-text shadow-inner">
                          {/* Basic SQL coloring simulation */}
                          {msg.sql.split(/(\s+)/).map((word, wIdx) => {
                            const upperWord = word.toUpperCase();
                            const isKeyword = [
                              "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "DESC", "ASC", "JOIN", "ON", "AND", "SUM", "AVG", "COUNT"
                            ].includes(upperWord);
                            
                            return (
                              <span
                                key={wIdx}
                                className={isKeyword ? "text-secondary font-bold" : "text-[#c7c4d8]"}
                              >
                                {word}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Rich Metrics Cards Overlay */}
                    {!isUser && msg.metrics && (
                      <div className="mt-md grid grid-cols-1 sm:grid-cols-2 gap-sm">
                        {msg.metrics.map((met, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-md bg-surface-container/60 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-sm"
                          >
                            <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">
                              {met.label}
                            </span>
                            <span className="text-headline-md font-extrabold text-on-surface mt-xs block">
                              {met.value}
                            </span>
                            <span className="text-[10px] text-outline font-semibold block mt-0.5 flex items-center gap-xs">
                              {met.sub.includes("+") || met.sub.includes("18%") ? (
                                <span className="material-symbols-outlined text-green-400 text-[12px] font-bold">trending_up</span>
                              ) : met.sub.includes("-") || met.sub.includes("churn") ? (
                                <span className="material-symbols-outlined text-red-400 text-[12px] font-bold">trending_down</span>
                              ) : (
                                <span className="material-symbols-outlined text-primary text-[12px] font-bold">info</span>
                              )}
                              {met.sub}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dynamic Responsive SVG Custom Chart */}
                    {!isUser && msg.chart && (
                      <div className="mt-md p-md bg-surface-container-lowest/50 rounded-xl border border-white/5 flex flex-col shadow-sm">
                        <div className="flex justify-between items-center mb-sm border-b border-white/5 pb-2">
                          <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                            {msg.chart.title}
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded uppercase tracking-wider">
                            {msg.chart.type.toUpperCase()} CHART
                          </span>
                        </div>

                        {/* Chart Render Area */}
                        <div className="h-44 w-full flex items-center justify-center pt-2">
                          {msg.chart.type === "bar" ? (
                            <div className="w-full h-full flex flex-col justify-between">
                              {/* Horizontal Bar Chart representation */}
                              <div className="space-y-sm flex-1 flex flex-col justify-center">
                                {msg.chart.labels.map((lbl, lIdx) => {
                                  const val = msg.chart?.values[lIdx] || 0;
                                  // Find maximum value to normalize width percentage
                                  const maxVal = Math.max(...(msg.chart?.values || [1]));
                                  const percentWidth = (val / maxVal) * 80; // keep some right padding
                                  
                                  return (
                                    <div key={lIdx} className="space-y-xs">
                                      <div className="flex justify-between text-[10px] font-bold text-outline-variant">
                                        <span className="text-on-surface-variant">{lbl}</span>
                                        <span className="text-primary">{val}</span>
                                      </div>
                                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden border border-white/5 relative">
                                        <div
                                          style={{ width: `${percentWidth}%` }}
                                          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full shadow-[0_0_8px_rgba(195,192,255,0.4)]"
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            /* Doughnut chart rendering using dynamic calculations */
                            <div className="w-full h-full flex items-center justify-around">
                              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                {(() => {
                                  const chart = msg.chart;
                                  if (!chart) return null;
                                  const total = chart.values.reduce((a, b) => a + b, 0);
                                  let accumulatedAngle = 0;
                                  const colors = [
                                    "var(--color-primary)",
                                    "var(--color-secondary)",
                                    "var(--color-tertiary)",
                                    "var(--color-error)",
                                  ];
                                  
                                  return (
                                    <>
                                      {chart.values.map((val, idx) => {
                                        const angle = (val / total) * 360;
                                        const endAngle = accumulatedAngle + angle;
                                        
                                        // Path trigonometry
                                        const r = 48;
                                        const cx = 60;
                                        const cy = 60;
                                        const x1 = cx + r * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                                        const y1 = cy + r * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
                                        const x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
                                        const y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);
                                        const largeArcFlag = angle > 180 ? 1 : 0;
                                        
                                        const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                                        accumulatedAngle = endAngle;
                                        
                                        return (
                                          <path
                                            key={idx}
                                            d={pathData}
                                            fill={colors[idx % colors.length]}
                                            stroke="#13121b"
                                            strokeWidth="2"
                                            className="hover:opacity-90 transition-opacity cursor-pointer"
                                          />
                                        );
                                      })}
                                      {/* Doughnut Center Cover circle */}
                                      <circle cx="60" cy="60" r="26" fill="#13121b" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    </>
                                  );
                                })()}
                              </svg>

                              {/* Doughnut Legends list */}
                              <div className="flex flex-col gap-xs text-[10px] font-bold text-outline">
                                {msg.chart.labels.map((lbl, lIdx) => {
                                  const val = msg.chart?.values[lIdx] || 0;
                                  const colors = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-error"];
                                  
                                  return (
                                    <div key={lIdx} className="flex items-center gap-sm">
                                      <span className={`w-2.5 h-2.5 rounded-full ${colors[lIdx % colors.length]}`}></span>
                                      <span className="text-on-surface-variant min-w-[90px]">{lbl}</span>
                                      <span className="font-mono text-outline">{val}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message timestamp metadata */}
                  <div
                    className={`text-[9px] font-bold text-outline px-xs flex items-center gap-xs ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    <span>•</span>
                    <span>{isUser ? "Dayamay Das" : "Struxiva AI Core"}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Analyzing / loading indicator */}
          {loading && (
            <div className="flex gap-md max-w-[85%] mr-auto items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-[#13121b] text-[20px] animate-spin">
                  sync
                </span>
              </div>
              
              <div className="glass-panel rounded-2xl p-md shadow-md border-white/5 space-y-sm flex-1 w-full sm:w-[400px] overflow-hidden">
                <div className="flex items-center gap-xs text-[10px] font-bold text-primary">
                  <span className="tracking-widest uppercase">ANALYZING PRIMARY TELEMETRY</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                </div>
                
                {/* Shimmer loading blocks */}
                <div className="space-y-sm pt-xs">
                  <div className="h-3 w-[90%] bg-white/5 rounded animate-pulse"></div>
                  <div className="h-3 w-[75%] bg-white/5 rounded animate-pulse"></div>
                  <div className="h-3 w-[60%] bg-white/5 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input pills & Suggestion Chips Container */}
        <div className="mt-md border-t border-white/5 pt-md relative z-10">
          
          {/* Suggestion Chips */}
          <div className="flex gap-sm mb-md overflow-x-auto pb-2 custom-scrollbar no-scrollbar select-none">
            {suggestionChips.map((chip, cIdx) => (
              <button
                key={cIdx}
                onClick={() => handleSend(chip)}
                className="px-md py-xs bg-surface-container rounded-full border border-white/10 text-label-sm font-bold text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all whitespace-nowrap active:scale-95 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Main Chat Input capsulation */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="glass-panel rounded-full p-1 pl-md flex min-w-0 items-center gap-sm shadow-xl focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(195,192,255,0.15)] transition-all bg-surface-container-lowest/80 border-white/10"
          >
            <span className="material-symbols-outlined text-outline select-none">attachment</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Struxiva AI anything..."
              className="min-w-0 flex-1 bg-transparent border-none text-body-md text-on-surface placeholder:text-outline/40 h-10 outline-none focus:ring-0 focus:border-transparent select-text font-medium"
            />
            
            <div className="flex items-center gap-sm pr-1">
              <button
                type="button"
                onClick={() => alert("Voice input module is in demonstration standby mode.")}
                className="p-base rounded-full text-outline hover:text-secondary transition-colors cursor-pointer"
                title="Voice dictation input"
              >
                <span className="material-symbols-outlined">mic</span>
              </button>
              
              <button
                type="submit"
                className="h-9 w-9 bg-gradient-to-br from-primary to-primary-container text-[#1d00a5] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md relative overflow-hidden group cursor-pointer"
                title="Send query"
              >
                <span className="material-symbols-outlined text-body-md font-bold text-[#1d00a5] group-hover:translate-x-0.5 transition-transform">send</span>
              </button>
            </div>
          </form>

          <p className="text-center text-[9px] font-semibold text-outline mt-sm select-none">
            Struxiva AI Copilot is operating under secure enterprise SLA compliance sandbox guidelines.
          </p>
        </div>

      </div>

    </div>
  );
}
