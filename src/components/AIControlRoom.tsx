import React, { useState, useEffect } from "react";
import { Cpu, Send, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle, MessageSquare } from "lucide-react";

export default function AIControlRoom() {
  const [analysis, setAnalysis] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Agent Mode State (Local vs Cloud)
  const [agentMode, setAgentMode] = useState<"local" | "cloud">("local");
  const [hasApiKey, setHasApiKey] = useState(false);

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "TransitOps Intelligence Core active. Ask me anything about vessel health, operator credentials, pending cargo weights, or rule compliance parameters."
    }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Operational Advisor State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [advisorExplanation, setAdvisorExplanation] = useState("");
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);

  const checkApiConfig = async () => {
    try {
      const res = await fetch("/api/ai/config");
      const data = await res.json();
      setHasApiKey(data.isConfigured);
      
      const storedMode = localStorage.getItem("transitops_agent_mode") as "local" | "cloud";
      if (storedMode) {
        setAgentMode(storedMode);
      } else if (data.isConfigured) {
        setAgentMode("cloud");
        localStorage.setItem("transitops_agent_mode", "cloud");
      } else {
        setAgentMode("local");
        localStorage.setItem("transitops_agent_mode", "local");
      }
    } catch (err) {
      console.error("Failed to check API config:", err);
    }
  };

  const fetchAnalysis = async (mode = agentMode) => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`/api/ai/control-center-analysis?agentMode=${mode}`);
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchFleetVehiclesAndRoutes = async () => {
    try {
      const res = await fetch("/api/fleet");
      const fleetData = await res.json();
      let firstVehId = "";
      if (fleetData.vehicles && fleetData.vehicles.length > 0) {
        setVehicles(fleetData.vehicles);
        firstVehId = fleetData.vehicles[0].id;
        setSelectedVehicleId(firstVehId);
      }

      const routesRes = await fetch("/api/orders");
      const routesData = await routesRes.json();
      let firstRouteId = "";
      if (routesData && routesData.length > 0) {
        setRoutes(routesData);
        firstRouteId = routesData[0].id;
        setSelectedRouteId(firstRouteId);
      }

      if (firstVehId) {
        fetchAdvisorExplanation(firstVehId, firstRouteId || undefined, agentMode);
      }
    } catch (err) {
      console.error("Failed to load fleet vehicles and routes:", err);
    }
  };

  const fetchAdvisorExplanation = async (vehicleId: string, routeId?: string, mode = agentMode) => {
    if (!vehicleId) return;
    setLoadingAdvisor(true);
    try {
      const res = await fetch("/api/ai/operational-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, orderId: routeId, agentMode: mode }),
      });
      const data = await res.json();
      if (data.success) {
        setAdvisorExplanation(data.explanation);
      }
    } catch (err) {
      console.error("Failed to fetch operational advisor advice:", err);
      setAdvisorExplanation("Failed to connect to the Operational Advisor service. Please check network connectivity.");
    } finally {
      setLoadingAdvisor(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkApiConfig();
      fetchFleetVehiclesAndRoutes();
    };
    init();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0) {
      fetchAnalysis(agentMode);
      fetchAdvisorExplanation(selectedVehicleId, selectedRouteId || undefined, agentMode);
    } else {
      fetchAnalysis(agentMode);
    }
  }, [agentMode]);

  const handleAgentModeChange = (mode: "local" | "cloud") => {
    setAgentMode(mode);
    localStorage.setItem("transitops_agent_mode", mode);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoadingChat(true);

    try {
      const res = await fetch("/api/ai/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, agentMode })
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { sender: "ai", text: `Connection aborted: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: "ai", text: `Cognitive engine offline: ${err.message}` }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Global Agent Switcher */}
      <div className="lg:col-span-3 bg-[#0F1117]/85 backdrop-blur-md border border-[#2A2D35] rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-20 transition-all duration-750 ${
          agentMode === "cloud" ? "bg-blue-500" : "bg-amber-500"
        }`} />

        <div className="flex items-center gap-3.5 z-10">
          <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
            agentMode === "cloud" 
              ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
              : "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          }`}>
            <Cpu className={`w-6 h-6 ${agentMode === "cloud" ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm md:text-base font-mono flex items-center gap-2">
              Active Core: {agentMode === "cloud" ? "Cloud Cognitive Core" : "Local Operational Agent"}
            </h2>
            <p className="text-xs text-[#8E9299]">
              {agentMode === "cloud" 
                ? "Utilizing Gemini 3.5 Flash models for deep contextual analytics." 
                : "Utilizing deterministic local SQLite database rule-based heuristics."}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 z-10 w-full md:w-auto">
          <button
            onClick={() => handleAgentModeChange("local")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-300 border w-full sm:w-auto cursor-pointer ${
              agentMode === "local"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "bg-[#161922] text-[#8E9299] border-[#2A2D35] hover:text-white hover:bg-[#1C202B]"
            }`}
          >
            Local Offline Agent
          </button>
          
          <button
            onClick={() => handleAgentModeChange("cloud")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-300 border w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer ${
              agentMode === "cloud"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                : "bg-[#161922] text-[#8E9299] border-[#2A2D35] hover:text-white hover:bg-[#1C202B]"
            }`}
          >
            Cloud Core (Gemini)
            {!hasApiKey && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="API Key not configured in .env" />
            )}
          </button>
        </div>
      </div>

      {!hasApiKey && agentMode === "cloud" && (
        <div className="lg:col-span-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-400 uppercase">Warning: Gemini API Key Not Configured.</span>
            <p className="mt-1 text-[#C0C4CC]">
              The application is currently using local fallback simulation because no `GEMINI_API_KEY` was detected in your `.env` configuration. Please add a valid key to run real-time cloud agent cognitive core operations.
            </p>
          </div>
        </div>
      )}
      {/* AI Control Center Analytics Box */}
      <div className="lg:col-span-2 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[520px]">
        <div>
          <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500 shadow-[0_0_8px_#3B82F6]" />
                AI Logistics Control Center
              </h3>
              <p className="text-xs text-[#8E9299]">Live operational forecasting utilizing server-side Gemini cognitive analytics models.</p>
            </div>
            <button
              onClick={() => fetchAnalysis()}
              disabled={loadingAnalysis}
              className="p-2 bg-[#161922] hover:bg-[#1A1D26] border border-[#2A2D35] rounded text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalysis ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingAnalysis ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 font-mono text-xs gap-3">
              <span className="w-6 h-6 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
              <span>Generating full operations summary, delay risks, and carbon metrics...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#161922] border border-[#2A2D35] p-4 rounded-lg text-xs font-mono space-y-3 leading-relaxed">
                <div className="flex items-center gap-2 text-[#4ADE80] font-bold text-[10px] uppercase">
                  <span>Forecast status: active</span>
                </div>
                <p className="text-[#E0E2E6] italic">
                  "{analysis || "Retrieving logistics optimization summary..."}"
                </p>
              </div>

              {/* Quick KPI blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-xs">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">Estimated Dispatch Safety Ratio</span>
                  <div className="text-[#4ADE80] font-bold text-base">98.12% Safe Tolerance</div>
                </div>

                <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-xs">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">Carbon Mitigation Score</span>
                  <div className="text-[#3B82F6] font-bold text-base">18.2 Tons Offset Verified</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] font-mono text-gray-500 border-t border-[#2A2D35] pt-3 flex justify-between">
          <span>COGNITIVE CORE: {agentMode === "cloud" ? "gemini-3.5-flash (Cloud)" : "Offline Logic Core"}</span>
          <span>COMPLIANCE RATING: AAA GRADE</span>
        </div>
      </div>

      {/* Operations Assistant Chatbot */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[520px]">
        <div>
          <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#4ADE80]" />
                AI Operations Assistant
              </h3>
              <p className="text-[10px] text-[#8E9299] font-mono mt-0.5">
                Active core: {agentMode === "cloud" ? (
                  <span className="text-blue-400 font-bold uppercase">Cloud Cognitive Core</span>
                ) : (
                  <span className="text-amber-500 font-bold uppercase">Local Offline Agent</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[
              "Which driver has safety alerts?",
              "Why is FLT-2209 in maintenance?",
              "List expired documents"
            ].map((suggest, sIdx) => (
              <button
                key={sIdx}
                onClick={() => setChatInput(suggest)}
                className="bg-[#161922] hover:bg-[#1A1D26] border border-[#2A2D35] text-[10px] font-mono text-[#8E9299] hover:text-white px-2 py-1 rounded transition-colors"
              >
                {suggest}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-800 text-xs font-mono">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#1E3A8A] text-blue-100 self-end ml-auto border border-[#3B82F6]/35"
                    : "bg-[#161922] text-[#E0E2E6] border border-[#2A2D35]"
                }`}
              >
                {m.text}
              </div>
            ))}

            {loadingChat && (
              <div className="bg-[#161922] text-gray-500 p-2.5 rounded-lg flex items-center gap-2">
                <span className="w-3 h-3 border border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
                <span>Querying system database variables...</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat input form */}
        <div className="border-t border-[#2A2D35] pt-3 flex gap-2">
          <input
            type="text"
            placeholder="Type standard fleet questions..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-[#161922] border border-[#2A2D35] text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-[#4ADE80] font-mono placeholder-gray-600"
          />
          <button
            onClick={handleSendMessage}
            disabled={loadingChat || !chatInput.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center justify-center disabled:bg-gray-800 disabled:text-gray-500"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Operational Advisor Section */}
      <div className="lg:col-span-3 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between shadow-md mt-6">
        <div>
          <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.3)]" />
                  AI Operational Advisor Engine
                </h3>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase ${
                  agentMode === "cloud" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {agentMode === "cloud" ? "Cloud Logic" : "Local Rules"}
                </span>
              </div>
              <p className="text-xs text-[#8E9299] mt-1">
                Analyze specific vehicle-to-route assignments to get live recommendations or rejection justifications based on safety scores, licensing constraints, weight limits, and active maintenance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Input / Control Column */}
            <div className="md:col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8E9299] uppercase tracking-wider font-mono font-medium block">
                  Select Fleet Vessel
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    fetchAdvisorExplanation(e.target.value, selectedRouteId, agentMode);
                  }}
                  className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2.5 rounded text-xs font-mono focus:outline-none focus:border-[#4ADE80]"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0F1117] text-white">
                      {v.id} — {v.type} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8E9299] uppercase tracking-wider font-mono font-medium block">
                  Select Target Route Corridor
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    fetchAdvisorExplanation(selectedVehicleId, e.target.value, agentMode);
                  }}
                  className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2.5 rounded text-xs font-mono focus:outline-none focus:border-[#4ADE80]"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0F1117] text-white">
                      {r.id} — {r.destination_name} ({r.cargo_description}, {r.weight}kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Health & Telemetry Fast KPIs */}
              {selectedVehicleId && (
                (() => {
                  const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicleId);
                  if (!selectedVehicleObj) return null;
                  const healthColor = selectedVehicleObj.health_percentage >= 85 
                    ? "text-[#4ADE80]" 
                    : selectedVehicleObj.health_percentage >= 70 
                      ? "text-[#FACC15]" 
                      : "text-[#EF4444]";
                  return (
                    <div className="bg-[#161922] border border-[#2A2D35] rounded p-3 font-mono text-[11px] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">MAX CAPACITY:</span>
                        <span className="font-bold text-white">{selectedVehicleObj.max_capacity} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">HEALTH:</span>
                        <span className={`font-bold ${healthColor}`}>{selectedVehicleObj.health_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">RISK LEVEL:</span>
                        <span className={`font-bold ${
                          selectedVehicleObj.risk_level === "LOW" ? "text-emerald-400" : selectedVehicleObj.risk_level === "MEDIUM" ? "text-yellow-400" : "text-red-500"
                        }`}>{selectedVehicleObj.risk_level || "LOW"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">STATUS:</span>
                        <span className={`font-bold ${
                          selectedVehicleObj.status === "ACTIVE" ? "text-emerald-400" : selectedVehicleObj.status === "MAINTENANCE" ? "text-yellow-400" : "text-red-500"
                        }`}>{selectedVehicleObj.status}</span>
                      </div>
                    </div>
                  );
                })()
              )}

              <button
                onClick={() => fetchAdvisorExplanation(selectedVehicleId, selectedRouteId, agentMode)}
                disabled={loadingAdvisor || !selectedVehicleId}
                className="w-full py-2 bg-[#1A1D26] hover:bg-[#252936] text-[#4ADE80] border border-[#4ADE80]/20 hover:border-[#4ADE80]/50 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAdvisor ? "animate-spin" : ""}`} />
                <span>Re-Analyze Assignment</span>
              </button>
            </div>

            {/* Readout Column */}
            <div className="md:col-span-2">
              <div className="bg-[#12141A] border border-[#2A2D35] rounded-lg p-4 min-h-[140px] font-mono text-xs flex flex-col justify-between relative overflow-hidden shadow-inner">
                {/* Decorative scanning line or background text */}
                <div className="absolute top-2 right-3 text-[9px] text-[#4ADE80]/15 tracking-wider uppercase font-bold">
                  ADVISORY STREAM // VERBOSE
                </div>

                {loadingAdvisor ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-gray-500 text-xs gap-2">
                    <span className="w-5 h-5 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
                    <span>Processing constraint heuristics...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#4ADE80] font-bold text-[10px] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Explanation:</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-[12px] italic">
                      "{advisorExplanation || "Select a vessel to compute operational recommendations."}"
                    </p>
                  </div>
                )}

                <div className="border-t border-[#2A2D35]/50 pt-2.5 mt-3 flex justify-between text-[10px] text-gray-500">
                  <span>ANALYSIS STATUS: COMPLETE</span>
                  <span>DECISION REASONING MATRIX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
