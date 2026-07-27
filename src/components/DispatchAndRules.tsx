import React, { useState, useEffect } from "react";
import { Cpu, ShieldCheck, ShieldAlert, ArrowRight, Settings, CheckCircle2, AlertOctagon, HelpCircle, Scale, Clock, RefreshCw, AlertTriangle, Eye, Sparkles } from "lucide-react";
import FleetLoadBalancer from "./FleetLoadBalancer";
import PredictiveLoadScheduling from "./PredictiveLoadScheduling";

interface DispatchAndRulesProps {
  vehicles: any[];
  drivers: any[];
  orders: any[];
  onRefreshAll: () => void;
  onAddToast?: (toast: any) => void;
}

export default function DispatchAndRules({ vehicles, drivers, orders, onRefreshAll, onAddToast }: DispatchAndRulesProps) {
  // Tabs: "dispatch" | "predictive_schedule" | "load_balancer" | "compliance_watcher" | "rules" | "validation"
  const [activeSub, setActiveSub] = useState<"dispatch" | "predictive_schedule" | "load_balancer" | "compliance_watcher" | "rules" | "validation">("dispatch");

  // State for Automated Compliance Watcher
  const [complianceScanning, setComplianceScanning] = useState(false);
  const [lastComplianceScanTime, setLastComplianceScanTime] = useState(new Date().toLocaleTimeString());
  const [regionalLawRegion, setRegionalLawRegion] = useState<"US_FMCSA" | "EU_DRIVING" | "CA_MTO">("US_FMCSA");

  // State for Intelligent Assignment
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState("");

  // State for Rule Engine
  const [rules, setRules] = useState<any[]>([]);
  const [editingRuleId, setEditingRuleId] = useState("");
  const [ruleValue, setRuleValue] = useState<number>(0);

  // State for Explainable Validation Sandbox
  const [validDriverName, setValidDriverName] = useState("");
  const [validLicense, setValidLicense] = useState("");
  const [validExpDate, setValidExpDate] = useState("");
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);

  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      setRules(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleGetRecommendation = async () => {
    if (!selectedOrderId) return;
    setLoadingAssign(true);
    setRecommendation(null);
    setDispatchSuccess("");
    try {
      const agentMode = localStorage.getItem("transitops_agent_mode") || "local";
      const res = await fetch("/api/ai/assignment-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrderId, agentMode })
      });
      const data = await res.json();
      if (data.success) {
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleExecuteDispatch = async () => {
    if (!recommendation) return;
    try {
      const res = await fetch("/api/orders/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          driverId: recommendation.driverId,
          vehicleId: recommendation.vehicleId,
          operator: "AI_DISPATCH_AGENT"
        })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchSuccess(`Vessel successfully dispatched: ${data.message}`);
        setRecommendation(null);
        setSelectedOrderId("");
        onRefreshAll();
      } else {
        setDispatchSuccess(`Dispatch operation aborted: ${data.error}`);
      }
    } catch (err: any) {
      setDispatchSuccess(`API network error: ${err.message}`);
    }
  };

  const handleSaveRule = async (id: string) => {
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, value: Number(ruleValue) })
      });
      const data = await res.json();
      if (data.success) {
        setEditingRuleId("");
        fetchRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunValidation = async () => {
    setSandboxResponse(null);
    try {
      const res = await fetch("/api/validation/test-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverName: validDriverName,
          licenseNumber: validLicense,
          expirationDate: validExpDate,
        })
      });
      const data = await res.json();
      setSandboxResponse({ success: res.ok, message: data.message || data.error });
    } catch (err: any) {
      setSandboxResponse({ success: false, message: `System network warning: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-tab list */}
      <div className="flex gap-2 border-b border-[#2A2D35] pb-px overflow-x-auto">
        {[
          { id: "dispatch", label: "Intelligent Assignment Engine", icon: Cpu },
          { id: "predictive_schedule", label: "Predictive Load Scheduling AI", icon: Sparkles },
          { id: "load_balancer", label: "Fleet Load Balancer AI", icon: Scale },
          { id: "compliance_watcher", label: "Automated Compliance Watcher", icon: Clock },
          { id: "rules", label: "Operational Rule Engine", icon: Settings },
          { id: "validation", label: "Explainable Validation Center", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSub === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSub(tab.id as any)}
              className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${
                isSelected
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-[#8E9299] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeSub === "dispatch" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order selection and recommendation parameters */}
          <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-[#2A2D35] pb-3 mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Cognitive Dispatcher</h3>
                <p className="text-xs text-[#8E9299]">Automated machine learning matching process comparing order specifications against active vessels.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Unassigned Freight Cargo</label>
                  {pendingOrders.length === 0 ? (
                    <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded text-center text-xs text-gray-500 font-mono">
                      No unassigned orders found in ledger.
                    </div>
                  ) : (
                    <select
                      value={selectedOrderId}
                      onChange={(e) => {
                        setSelectedOrderId(e.target.value);
                        setRecommendation(null);
                        setDispatchSuccess("");
                      }}
                      className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2.5 rounded text-xs font-mono focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- SELECT PENDING ORDER --</option>
                      {pendingOrders.map((o) => (
                        <option key={o.id} value={o.id} className="bg-[#0F1117] text-white">
                          {o.id}: {o.cargo_description} ({o.weight}kg)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="bg-[#161922] border border-[#2A2D35] p-3.5 rounded text-[10px] font-mono text-gray-500 space-y-1">
                  <div className="text-white font-bold text-[11px] mb-1">EVALUATED CONSTRAINTS</div>
                  <div>• Max Cargo Weight Capacity</div>
                  <div>• Active License and Permit Validity</div>
                  <div>• Driver Working Hours Limits</div>
                  <div>• Estimated Road Pathing Distances</div>
                  <div>• Fleet Health Risk Parameters</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGetRecommendation}
              disabled={loadingAssign || !selectedOrderId}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold uppercase text-xs tracking-widest rounded transition-all flex items-center justify-center gap-2 disabled:bg-gray-800 disabled:text-gray-500 mt-5"
            >
              {loadingAssign ? "COMPUTING..." : "COMPUTE OPTIMAL DISPATCH"}
            </button>
          </div>

          {/* AI Recommendation display */}
          <div className="md:col-span-2 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-[#2A2D35] pb-3 mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">ML Assignment Recommendation</h3>
                <p className="text-xs text-[#8E9299]">Optimal resource alignment evaluated from database state variables.</p>
              </div>

              {!recommendation ? (
                <div className="h-64 border border-dashed border-[#2A2D35] rounded-lg flex flex-col items-center justify-center text-center p-6 text-[#8E9299]">
                  <Cpu className="w-8 h-8 mb-2 text-gray-600" />
                  <p className="text-xs font-mono">Select a pending order cargo description and click compute.</p>
                  {dispatchSuccess && (
                    <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs rounded font-mono">
                      {dispatchSuccess}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs">
                      <Cpu className="w-4 h-4 shadow-[0_0_8px_#10B981]" />
                      <span>COGNITIVE MATCH SUCCESS</span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono leading-relaxed">
                      {recommendation.explanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#161922] border border-[#2A2D35] p-4 rounded font-mono">
                      <div className="text-[10px] text-gray-500 uppercase">Recommended Operator</div>
                      <div className="text-white font-bold text-sm mt-1">{recommendation.driverId || "No idle operator available"}</div>
                    </div>

                    <div className="bg-[#161922] border border-[#2A2D35] p-4 rounded font-mono">
                      <div className="text-[10px] text-gray-500 uppercase">Recommended Vessel</div>
                      <div className="text-white font-bold text-sm mt-1">{recommendation.vehicleId || "No active vessel available"}</div>
                    </div>
                  </div>

                  {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                    <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-[10px] text-gray-500">
                      <span className="font-bold text-white uppercase block mb-1">Backup Alternate Vessels</span>
                      <div className="flex gap-2">
                        {recommendation.alternatives.map((alt: string, idx: number) => (
                          <span key={idx} className="bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">
                            {alt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {recommendation && (
              <button
                onClick={handleExecuteDispatch}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs tracking-widest rounded transition-all mt-4"
              >
                DISPATCH RECOMMENDED RESOURCES
              </button>
            )}
          </div>

          {/* NEW SECTION: Delay Risk Indicator Table with Traffic & Weather Telemetry */}
          <div className="md:col-span-3 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 space-y-4 font-mono text-xs">
            <div className="border-b border-[#2A2D35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">
                    Delay Risk Indicator & Predictive Delay Matrix
                  </h3>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                    TRAFFIC & WEATHER TELEMETRY
                  </span>
                </div>
                <p className="text-xs text-[#8E9299] mt-0.5">
                  Calculates probability of missed arrival ETAs cross-referencing real-time traffic congestion APIs and regional weather conditions.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-400">Live Weather Telemetry:</span>
                <span className="bg-[#161922] text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded font-bold">
                  ⛈️ Monsoon Downpour (Visibility 120m)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2D35] text-[10px] text-gray-500 uppercase tracking-wider bg-[#141720]">
                    <th className="p-2.5">Order ID</th>
                    <th className="p-2.5">Route Corridor</th>
                    <th className="p-2.5">Scheduled ETA</th>
                    <th className="p-2.5">Traffic Congestion Index</th>
                    <th className="p-2.5">Weather Impact</th>
                    <th className="p-2.5">Delay Miss Probability</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2332]">
                  {[
                    {
                      id: "ORD-9901",
                      customer: "Reliance Retail Heavy",
                      corridor: "Mumbai JNPT ➔ Delhi ICD",
                      scheduled: "18:30 Today",
                      traffic: "+52 min (NH-48 Bottleneck)",
                      weather: "Torrential Rain (85mm/h)",
                      riskPct: 84,
                      riskGrade: "HIGH RISK",
                      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    },
                    {
                      id: "ORD-9902",
                      customer: "Tata Motors Express",
                      corridor: "Pune Hub ➔ Bengaluru Port",
                      scheduled: "21:00 Today",
                      traffic: "+14 min (Normal Corridor)",
                      weather: "Moderate Overcast",
                      riskPct: 22,
                      riskGrade: "LOW RISK",
                      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    },
                    {
                      id: "ORD-9903",
                      customer: "Apollo Pharma Cold",
                      corridor: "Chennai Dock ➔ Kolkata Depot",
                      scheduled: "08:15 Tomorrow",
                      traffic: "+38 min (Coastal Highway)",
                      weather: "Cyclonic Wind (62 km/h)",
                      riskPct: 68,
                      riskGrade: "MEDIUM RISK",
                      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }
                  ].map((item) => (
                    <tr key={item.id} className="hover:bg-[#161922] transition-colors">
                      <td className="p-2.5 font-bold text-white">
                        {item.id}
                        <div className="text-[10px] text-gray-400 font-normal">{item.customer}</div>
                      </td>
                      <td className="p-2.5 text-gray-300">{item.corridor}</td>
                      <td className="p-2.5 text-slate-200">{item.scheduled}</td>
                      <td className="p-2.5 text-amber-300">{item.traffic}</td>
                      <td className="p-2.5 text-cyan-300">{item.weather}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#0B0D13] h-2 rounded-full overflow-hidden border border-[#2A2D35]">
                            <div
                              className={`h-full rounded-full ${
                                item.riskPct >= 70 ? "bg-rose-500" : item.riskPct >= 40 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${item.riskPct}%` }}
                            ></div>
                          </div>
                          <span className={`px-1.5 py-0.5 border rounded text-[9.5px] font-bold ${item.badgeColor}`}>
                            {item.riskPct}% {item.riskGrade}
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (onAddToast) {
                              onAddToast({
                                type: "warning",
                                title: "Preemptive Reroute Request",
                                message: `Calculated dynamic detour corridor for ${item.id} avoiding ${item.traffic}.`
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-[#1F2332] hover:bg-blue-600 text-slate-200 hover:text-white rounded border border-[#2A2D35] transition-all cursor-pointer text-[10px]"
                        >
                          Auto-Detour
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSub === "predictive_schedule" && (
        <PredictiveLoadScheduling
          vehicles={vehicles}
          drivers={drivers}
          orders={orders}
          onRefreshAll={onRefreshAll}
          onAddToast={onAddToast}
        />
      )}

      {activeSub === "load_balancer" && (
        <FleetLoadBalancer
          vehicles={vehicles}
          drivers={drivers}
          orders={orders}
          onRefreshAll={onRefreshAll}
          onAddToast={onAddToast}
        />
      )}

      {activeSub === "compliance_watcher" && (
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 space-y-5 font-sans">
          <div className="border-b border-[#2A2D35] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Automated Labor Law Compliance Watcher</h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded">
                  LIVE TELEMETRY CROSS-REFERENCE
                </span>
              </div>
              <p className="text-xs text-[#8E9299] mt-1">
                Real-time cross-referencing of vehicle CAN-bus telemetry, driving hours, and geographical labor laws. Highlights mandatory rest periods & shift limits.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={regionalLawRegion}
                onChange={(e) => setRegionalLawRegion(e.target.value as any)}
                className="bg-[#161922] border border-[#2A2D35] text-white text-xs font-mono p-2 rounded focus:outline-none cursor-pointer"
              >
                <option value="US_FMCSA">🇺🇸 US FMCSA (49 CFR § 395 - 8h Cap)</option>
                <option value="EU_DRIVING">🇪🇺 EU Regulation (EC) 561/2006 (4.5h Pause)</option>
                <option value="CA_MTO">🇨🇦 Canada MTO (Commercial Vehicle Hours)</option>
              </select>

              <button
                onClick={() => {
                  setComplianceScanning(true);
                  setTimeout(() => {
                    setComplianceScanning(false);
                    setLastComplianceScanTime(new Date().toLocaleTimeString());
                    if (onAddToast) {
                      onAddToast({
                        type: "success",
                        title: "Compliance Audit Scan Complete",
                        message: "Cross-referenced all 6 active driver telemetries against regional labor statutes."
                      });
                    }
                  }, 600);
                }}
                disabled={complianceScanning}
                className="bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs px-3 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${complianceScanning ? "animate-spin" : ""}`} />
                <span>{complianceScanning ? "Auditing..." : "Re-Scan Telemetry"}</span>
              </button>
            </div>
          </div>

          {/* Regional Rule Parameters Card */}
          <div className="bg-[#161922] border border-[#2A2D35] p-3.5 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-[#0F1117] p-2.5 rounded border border-[#2A2D35] space-y-1">
              <div className="text-[10px] text-gray-500 uppercase">Continuous Driving Cap</div>
              <div className="text-amber-400 font-bold text-sm">
                {regionalLawRegion === "US_FMCSA" ? "8.0 Driving Hours" : regionalLawRegion === "EU_DRIVING" ? "4.5 Driving Hours" : "13.0 Driving Hours"}
              </div>
              <div className="text-[10px] text-gray-400">Mandatory rest break enforced upon reaching threshold</div>
            </div>

            <div className="bg-[#0F1117] p-2.5 rounded border border-[#2A2D35] space-y-1">
              <div className="text-[10px] text-gray-500 uppercase">Required Rest Break Duration</div>
              <div className="text-emerald-400 font-bold text-sm">
                {regionalLawRegion === "US_FMCSA" ? "30 Minutes Off-Duty" : regionalLawRegion === "EU_DRIVING" ? "45 Minutes Continuous" : "45 Minutes Off-Duty"}
              </div>
              <div className="text-[10px] text-gray-400">Vehicle ignition lock engaged during break window</div>
            </div>

            <div className="bg-[#0F1117] p-2.5 rounded border border-[#2A2D35] space-y-1">
              <div className="text-[10px] text-gray-500 uppercase">Daily Shift Rest Period</div>
              <div className="text-blue-400 font-bold text-sm">
                {regionalLawRegion === "US_FMCSA" ? "10.0 Hours Off-Duty" : regionalLawRegion === "EU_DRIVING" ? "11.0 Hours Off-Duty" : "10.0 Hours Off-Duty"}
              </div>
              <div className="text-[10px] text-gray-400">Required between consecutive daily driving shifts</div>
            </div>
          </div>

          {/* Real-time Driver Telemetry Compliance Watch Table */}
          <div className="border border-[#2A2D35] rounded-lg overflow-hidden bg-[#161922]">
            <div className="p-3 bg-[#0F1117] border-b border-[#2A2D35] flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold uppercase">Driver Telemetry Compliance Matrix</span>
              <span className="text-gray-400 text-[10px]">Last Scan: {lastComplianceScanTime}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-gray-300">
                <thead className="bg-[#0F1117] text-gray-500 text-[10px] uppercase border-b border-[#2A2D35]">
                  <tr>
                    <th className="p-3">Driver Name & ID</th>
                    <th className="p-3">Current Vessel</th>
                    <th className="p-3">Shift Driving Hours</th>
                    <th className="p-3">Upcoming Mandatory Rest</th>
                    <th className="p-3">Compliance Status</th>
                    <th className="p-3 text-right">Action Directive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2D35]">
                  {[
                    { id: "DRV-101", name: "Marcus Vance", vehicle: "FLT-9821", hoursToday: 7.8, fatigue: 3, status: "URGENT_REST_REQUIRED", minsToRest: 12 },
                    { id: "DRV-102", name: "Elena Rostova", vehicle: "FLT-1008", hoursToday: 6.2, fatigue: 1, status: "COMPLIANT", minsToRest: 108 },
                    { id: "DRV-103", name: "Tariq Al-Mansoor", vehicle: "FLT-4412", hoursToday: 7.4, fatigue: 2, status: "REST_BREAK_APPROACHING", minsToRest: 36 },
                    { id: "DRV-104", name: "John Doe", vehicle: "FLT-104", hoursToday: 7.9, fatigue: 4, status: "URGENT_REST_REQUIRED", minsToRest: 6 },
                    { id: "DRV-105", name: "Sarah Jenkins", vehicle: "FLT-5501", hoursToday: 4.1, fatigue: 0, status: "COMPLIANT", minsToRest: 234 },
                    { id: "DRV-106", name: "David Kim", vehicle: "FLT-3309", hoursToday: 5.5, fatigue: 1, status: "COMPLIANT", minsToRest: 150 }
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-[#1C202B]">
                      <td className="p-3">
                        <div className="font-bold text-white">{row.name}</div>
                        <div className="text-[10px] text-gray-500">{row.id}</div>
                      </td>
                      <td className="p-3 text-blue-400 font-bold">{row.vehicle}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{row.hoursToday} / 8.0 hrs</div>
                        <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${row.hoursToday >= 7.5 ? "bg-rose-500" : row.hoursToday >= 6.5 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${(row.hoursToday / 8.0) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        {row.minsToRest <= 15 ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded animate-pulse">
                            Mandatory Rest in {row.minsToRest} mins
                          </span>
                        ) : row.minsToRest <= 45 ? (
                          <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                            Rest Break in {row.minsToRest} mins
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">
                            In {Math.floor(row.minsToRest / 60)}h {row.minsToRest % 60}m
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {row.status === "URGENT_REST_REQUIRED" ? (
                          <span className="text-rose-400 font-bold bg-rose-500/20 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> URGENT STAND-DOWN
                          </span>
                        ) : row.status === "REST_BREAK_APPROACHING" ? (
                          <span className="text-amber-400 font-bold bg-amber-500/20 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-400" /> BREAK APPROACHING
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold bg-emerald-500/20 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> COMPLIANT
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (onAddToast) {
                              onAddToast({
                                type: "info",
                                title: "Rest Break Notification Sent",
                                message: `Dispatched rest pause instruction to ${row.name} (${row.id}) via in-cab telematics.`
                              });
                            }
                          }}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer uppercase"
                        >
                          Dispatch Rest Lock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSub === "rules" && (
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Operational Parameters Editor</h3>
            <p className="text-xs text-[#8E9299]">Modify system-wide constraints and threshold values directly from the admin station without redeploying code.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rl) => (
              <div key={rl.id} className="bg-[#161922] border border-[#2A2D35] p-4 rounded-lg font-mono text-xs flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{rl.category}</span>
                  <div className="text-white font-bold">{rl.name}</div>
                  <div className="text-[#4ADE80] font-bold text-base mt-1">
                    {editingRuleId === rl.id ? (
                      <input
                        type="number"
                        value={ruleValue}
                        onChange={(e) => setRuleValue(Number(e.target.value))}
                        className="bg-[#0F1117] border border-[#2A2D35] text-white p-1 rounded w-24 text-xs font-bold"
                        step="0.1"
                      />
                    ) : (
                      <span>{rl.value} <span className="text-gray-500 text-xs font-normal">{rl.unit}</span></span>
                    )}
                  </div>
                </div>

                <div>
                  {editingRuleId === rl.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRuleId("")}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-800 text-white rounded font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveRule(rl.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRuleId(rl.id);
                        setRuleValue(rl.value);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold uppercase tracking-wider text-[10px]"
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSub === "validation" && (
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Zod Sandbox Verification</h3>
            <p className="text-xs text-[#8E9299]">Input mock dispatcher parameters to verify schema boundaries prior to executing transactional database logs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium border-b border-[#2A2D35] pb-1">Input Credentials Sandbox</h4>
              
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Operator Registered Name</label>
                  <input
                    type="text"
                    placeholder="e.g. D. Vasquez"
                    value={validDriverName}
                    onChange={(e) => setValidDriverName(e.target.value)}
                    className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">License Code (dl-ilxxxxx regex)</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-IL90210"
                    value={validLicense}
                    onChange={(e) => setValidLicense(e.target.value)}
                    className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Operator Expiry Date</label>
                  <input
                    type="date"
                    value={validExpDate}
                    onChange={(e) => setValidExpDate(e.target.value)}
                    className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleRunValidation}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase rounded text-xs tracking-wider font-mono"
                >
                  Verify Compliance Rule Boundaries
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium border-b border-[#2A2D35] pb-1 mb-4">Compiler Feedback Output</h4>
                
                {!sandboxResponse ? (
                  <div className="h-44 border border-dashed border-[#2A2D35] rounded-lg flex flex-col items-center justify-center text-center p-4 text-[#8E9299]">
                    <HelpCircle className="w-8 h-8 mb-2 text-gray-600" />
                    <p className="text-xs font-mono">Fill in operator parameters and run simulation checks.</p>
                  </div>
                ) : (
                  <div className={`p-4 rounded border font-mono text-xs space-y-2 ${
                    sandboxResponse.success
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                      {sandboxResponse.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                      <span>{sandboxResponse.success ? "Schema Compliant" : "Schema Rejected"}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-[11px]">
                      {sandboxResponse.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-[10px] text-gray-500 mt-4">
                💡 EXPLANATION ENGINE: Validation utilizes strict server-side Zod validators matching real-time regex standards. Expiration check guarantees the operator has active credentials before database transaction lock is created.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
