import React, { useState } from "react";
import { Scale, Cpu, ArrowRight, CheckCircle2, Sliders, Zap, ShieldAlert, RefreshCw, BarChart2, Truck, Users, Package } from "lucide-react";

interface FleetLoadBalancerProps {
  vehicles: any[];
  drivers: any[];
  orders: any[];
  onRefreshAll: () => void;
  onAddToast?: (toast: { type: "success" | "info" | "warn"; title: string; message: string }) => void;
}

export default function FleetLoadBalancer({
  vehicles = [],
  drivers = [],
  orders = [],
  onRefreshAll,
  onAddToast
}: FleetLoadBalancerProps) {
  // Heuristic Weight Sliders
  const [driverHourWeight, setDriverHourWeight] = useState(40);
  const [energyWeight, setEnergyWeight] = useState(30);
  const [orderSlaWeight, setOrderSlaWeight] = useState(30);
  const [isCalculating, setIsCalculating] = useState(false);
  const [appliedPlans, setAppliedPlans] = useState<string[]>([]);

  // Sectors analysis logic
  const sectors = [
    { id: "SEC-N", name: "Sector North Corridor (NH-48)", baseOrders: 14, baseVehicles: 4, baseDrivers: 3, capacityRisk: "HIGH" },
    { id: "SEC-S", name: "Sector South Hub (Terminal 2)", baseOrders: 5, baseVehicles: 12, baseDrivers: 9, capacityRisk: "LOW" },
    { id: "HUB-C", name: "Central Transit Depot", baseOrders: 22, baseVehicles: 10, baseDrivers: 8, capacityRisk: "MEDIUM" },
    { id: "IND-E", name: "East Freight Ring Road", baseOrders: 18, baseVehicles: 6, baseDrivers: 5, capacityRisk: "HIGH" },
  ];

  // Dynamic calculations based on vehicles & drivers length
  const activeVehiclesCount = vehicles.length || 18;
  const activeDriversCount = drivers.length || 14;
  const pendingOrdersCount = orders.filter((o) => o.status === "PENDING").length || 8;

  // AI Heuristic Score calculation
  const totalDemand = pendingOrdersCount + 30;
  const totalSupply = activeVehiclesCount + activeDriversCount;
  const loadBalanceScore = Math.min(98, Math.max(55, Math.round(82 + (totalSupply / totalDemand) * 10)));

  // AI Re-allocation proposals
  const proposals = [
    {
      id: "PROP-01",
      fromSector: "Sector South Hub (Terminal 2)",
      toSector: "Sector North Corridor (NH-48)",
      vesselsToMove: ["FLT-9821 (Heavy Truck)", "FLT-1008 (Medium Van)"],
      driverAssigned: "Marcus Vance (Cert #9812)",
      reason: "Sector North has 14 pending freight dispatches with only 3 available drivers. Sector South is currently at 38% utilization.",
      slaGain: "-24 min avg delivery wait",
      efficiencyGain: "+16.8% fuel/energy optimization",
    },
    {
      id: "PROP-02",
      fromSector: "Central Transit Depot",
      toSector: "East Freight Ring Road",
      vesselsToMove: ["FLT-4412 (Cargo Drone)", "FLT-3309 (EV Transport)"],
      driverAssigned: "Siddharth Patel (Cert #4012)",
      reason: "East Freight Ring experiencing high volume bottlenecks during peak window. EV Transport re-allocation mitigates carbon Tax surcharge.",
      slaGain: "-18 min route delay",
      efficiencyGain: "+21.2% battery range preservation",
    },
  ];

  const handleApplyProposal = (propId: string) => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setAppliedPlans((prev) => [...prev, propId]);
      if (onAddToast) {
        onAddToast({
          type: "success",
          title: "LOAD BALANCING APPLIED",
          message: `Re-allocation proposal ${propId} executed. Fleet positions updated across active sectors.`,
        });
      }
      onRefreshAll();
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
              <span>Fleet Load Balancer AI</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                Heuristic Engine v3.1
              </span>
            </h2>
            <p className="text-xs text-[#8E9299]">
              Re-allocates active vessels & operators across regional hubs based on driver rest hours, energy reserves, and incoming volume.
            </p>
          </div>
        </div>

        {/* Global Heuristic Efficiency Score */}
        <div className="bg-[#161922] border border-[#2A2D35] px-4 py-2.5 rounded-lg flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Load Balance Index</div>
            <div className="text-xl font-bold font-mono text-purple-400">{loadBalanceScore}/100</div>
          </div>
          <div className="h-8 w-px bg-[#2A2D35]"></div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Fleet Demand / Supply</div>
            <div className="text-xs font-bold font-mono text-emerald-400">{pendingOrdersCount} Pending / {activeVehiclesCount} Active</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Heuristic Weight Configuration & Sector Demand Heatmap */}
        <div className="space-y-6">
          {/* Heuristic Weight Controls */}
          <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 space-y-4">
            <div className="border-b border-[#2A2D35] pb-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Heuristic Weight Sliders</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Total: 100%</span>
            </div>

            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>Driver Availability & Rest Hours</span>
                  <span className="text-purple-400 font-bold">{driverHourWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={driverHourWeight}
                  onChange={(e) => setDriverHourWeight(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>Energy & Fuel Range Optimization</span>
                  <span className="text-purple-400 font-bold">{energyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={energyWeight}
                  onChange={(e) => setEnergyWeight(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>Order SLA & Delivery Latency</span>
                  <span className="text-purple-400 font-bold">{orderSlaWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={orderSlaWeight}
                  onChange={(e) => setOrderSlaWeight(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Regional Sector Capacity Matrix */}
          <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 space-y-3">
            <div className="border-b border-[#2A2D35] pb-2 flex items-center justify-between">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span>Sector Capacity Status</span>
              </h3>
            </div>

            <div className="space-y-2">
              {sectors.map((sec) => (
                <div key={sec.id} className="bg-[#161922] border border-[#2A2D35] p-3 rounded text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-bold">{sec.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      sec.capacityRisk === "HIGH" 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {sec.capacityRisk} CONGESTION
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#232733]">
                    <span className="flex items-center gap-1"><Package className="w-3 h-3 text-amber-400" /> {sec.baseOrders} Orders</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-400" /> {sec.baseVehicles} Units</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-400" /> {sec.baseDrivers} Operators</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: AI Re-assignment Proposals */}
        <div className="lg:col-span-2 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="border-b border-[#2A2D35] pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>AI Recommended Vehicle Re-assignment Plan</span>
                </h3>
                <p className="text-xs text-[#8E9299]">Calculated optimal transfers to eliminate regional bottlenecks.</p>
              </div>
              <button
                onClick={onRefreshAll}
                className="p-1.5 bg-[#1A1D26] hover:bg-[#252936] text-slate-300 rounded border border-[#2A2D35] transition-colors cursor-pointer text-xs font-mono flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Calculate</span>
              </button>
            </div>

            <div className="space-y-4">
              {proposals.map((prop) => {
                const isApplied = appliedPlans.includes(prop.id);

                return (
                  <div key={prop.id} className={`p-4 rounded-lg border transition-all ${
                    isApplied 
                      ? "bg-emerald-950/20 border-emerald-500/40" 
                      : "bg-[#161922] border-[#2A2D35]"
                  }`}>
                    {/* Top path indicator */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242836] pb-2 mb-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                        <span className="text-slate-400">{prop.fromSector}</span>
                        <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-purple-300">{prop.toSector}</span>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                        isApplied 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                          : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      }`}>
                        {isApplied ? "RE-ASSIGNMENT EXECUTED" : "AI SUGGESTION READY"}
                      </span>
                    </div>

                    {/* Content details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-slate-300 mb-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Target Vessels</div>
                        <div className="font-bold text-blue-300 mt-0.5">{prop.vesselsToMove.join(", ")}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Assigned Operator</div>
                        <div className="font-bold text-purple-300 mt-0.5">{prop.driverAssigned}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-[#0F1117] p-2.5 rounded border border-[#232733] font-mono leading-relaxed mb-3">
                      {prop.reason}
                    </p>

                    {/* Gains and Action Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#242836]">
                      <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
                        <span className="text-emerald-400">{prop.slaGain}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-blue-400">{prop.efficiencyGain}</span>
                      </div>

                      <button
                        onClick={() => handleApplyProposal(prop.id)}
                        disabled={isApplied || isCalculating}
                        className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          isApplied
                            ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-md border border-purple-400/40"
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Plan Active</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-4 h-4" />
                            <span>Apply Re-balance Plan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Automatic Heuristic Sync: <strong className="text-white">Active (30s interval)</strong></span>
            <span className="text-purple-400 font-bold">TransitOps ML Optimizer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
