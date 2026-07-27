import React, { useState } from "react";
import { Clock, Calendar, TrendingUp, Users, Truck, AlertTriangle, Zap, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, RefreshCw, BarChart2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

interface PredictiveLoadSchedulingProps {
  vehicles: any[];
  drivers: any[];
  orders: any[];
  onRefreshAll?: () => void;
  onAddToast?: (toast: any) => void;
}

interface ScheduleSlot {
  timeSlot: string;
  orderId: string;
  cargo: string;
  destination: string;
  recommendedDriver: string;
  recommendedVehicle: string;
  trafficDelayFactor: string;
  onTimeProbability: number;
  aiReasoning: string;
  status: "RECOMMENDED" | "CONFIRMED" | "DISPATCHED";
}

export default function PredictiveLoadScheduling({
  vehicles,
  drivers,
  orders,
  onRefreshAll,
  onAddToast
}: PredictiveLoadSchedulingProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleGenerated, setScheduleGenerated] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);

  // 24-Hour Traffic Congestion & Order Volume Simulation Data
  const hourlyData = [
    { hour: "00:00", orderVolume: 12, trafficCongestion: 15, driverAvail: 18 },
    { hour: "02:00", orderVolume: 8, trafficCongestion: 10, driverAvail: 16 },
    { hour: "04:00", orderVolume: 15, trafficCongestion: 12, driverAvail: 20 },
    { hour: "06:00", orderVolume: 28, trafficCongestion: 45, driverAvail: 22 },
    { hour: "08:00", orderVolume: 42, trafficCongestion: 85, driverAvail: 25 },
    { hour: "10:00", orderVolume: 35, trafficCongestion: 65, driverAvail: 24 },
    { hour: "12:00", orderVolume: 30, trafficCongestion: 55, driverAvail: 22 },
    { hour: "14:00", orderVolume: 38, trafficCongestion: 60, driverAvail: 23 },
    { hour: "16:00", orderVolume: 48, trafficCongestion: 90, driverAvail: 26 },
    { hour: "18:00", orderVolume: 40, trafficCongestion: 80, driverAvail: 21 },
    { hour: "20:00", orderVolume: 22, trafficCongestion: 40, driverAvail: 19 },
    { hour: "22:00", orderVolume: 16, trafficCongestion: 20, driverAvail: 17 }
  ];

  // Generated 24-Hour Optimal Schedule Slots
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    {
      timeSlot: "04:30 AM",
      orderId: "ORD-9912",
      cargo: "Pharmaceuticals & Cold Chain Vials (1,200 kg)",
      destination: "Metro General Medical Depot - Dock B",
      recommendedDriver: "Ananya Deshmukh (DRV-102)",
      recommendedVehicle: "FLT-9821 (Refrigerated Heavy Hauler)",
      trafficDelayFactor: "+2 mins (Low Traffic)",
      onTimeProbability: 98.4,
      aiReasoning: "Early morning dispatch bypasses 08:00 AM NH-48 rush hour corridor bottleneck while matching cold chain battery charge cycles.",
      status: "RECOMMENDED"
    },
    {
      timeSlot: "07:15 AM",
      orderId: "ORD-8834",
      cargo: "Precision Electronics & Avionics (2,400 kg)",
      destination: "TechPark Assembly Hub - Gate 4",
      recommendedDriver: "Vikramaditya Sharma (DRV-101)",
      recommendedVehicle: "FLT-4412 (High-Capacity Cargo Van)",
      trafficDelayFactor: "+14 mins (Moderate Traffic)",
      onTimeProbability: 92.1,
      aiReasoning: "Driver has completed mandatory 11-hr HOS rest break; vehicle battery pre-conditioned at 100% state of charge.",
      status: "RECOMMENDED"
    },
    {
      timeSlot: "11:00 AM",
      orderId: "ORD-7721",
      cargo: "Heavy Industrial Machinery Parts (4,500 kg)",
      destination: "Maritime Cargo Terminal - Berth 12",
      recommendedDriver: "Rajesh Kumar V (DRV-104)",
      recommendedVehicle: "FLT-1008 (Heavy Duty Flatbed)",
      trafficDelayFactor: "+5 mins (Midday Lull)",
      onTimeProbability: 96.8,
      aiReasoning: "Optimized arrival aligns with Port Terminal crane unloading shift window, eliminating dock queuing delay.",
      status: "RECOMMENDED"
    },
    {
      timeSlot: "02:45 PM",
      orderId: "ORD-6610",
      cargo: "Perishable Organic Produce (3,100 kg)",
      destination: "Central Wholesale Grocery Hub - Zone A",
      recommendedDriver: "Siddharth Rao (DRV-105)",
      recommendedVehicle: "FLT-3309 (Temperature Controlled Van)",
      trafficDelayFactor: "+8 mins (Moderate Traffic)",
      onTimeProbability: 94.5,
      aiReasoning: "Routed via Western Express Bypass to avoid school zone congestion near Sector 9.",
      status: "RECOMMENDED"
    },
    {
      timeSlot: "08:30 PM",
      orderId: "ORD-5542",
      cargo: "E-Commerce High-Density Packages (1,800 kg)",
      destination: "Regional Express Fulfillment Depot",
      recommendedDriver: "Kavita Menon (DRV-103)",
      recommendedVehicle: "FLT-7701 (Urban Electric Freight)",
      trafficDelayFactor: "+1 min (Night Smooth Flow)",
      onTimeProbability: 99.1,
      aiReasoning: "Night dispatch utilizes off-peak energy grid rates for fast DC charging and zero urban delivery delay.",
      status: "RECOMMENDED"
    }
  ]);

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setScheduleGenerated(true);
      if (onAddToast) {
        onAddToast({
          type: "success",
          title: "PREDICTIVE SCHEDULE GENERATED",
          message: "Calculated optimal 24-hour dispatch schedule based on real-time traffic and driver availability models."
        });
      }
    }, 1200);
  };

  const handleConfirmSlot = (slotIdx: number) => {
    setScheduleSlots((prev) =>
      prev.map((item, idx) => (idx === slotIdx ? { ...item, status: "CONFIRMED" } : item))
    );
    if (onAddToast) {
      onAddToast({
        type: "success",
        title: "SCHEDULE SLOT CONFIRMED",
        message: `Dispatch slot ${scheduleSlots[slotIdx].timeSlot} for ${scheduleSlots[slotIdx].orderId} confirmed.`
      });
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Header Banner */}
      <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-xl text-white font-mono space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#2A2D35] pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                AI PREDICTIVE LOAD SCHEDULING ENGINE
              </h2>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Real-time traffic telemetry • Driver HOS availability windows • Order demand forecasting • 24-Hour Gantt Optimization
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 cursor-pointer transition-all border border-purple-400/40"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Recalculating Telematics..." : "Re-Calculate 24-Hour Schedule"}</span>
          </button>
        </div>

        {/* KPIs Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded-lg flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Predicted On-Time Rate</div>
            <div className="text-lg font-black text-emerald-400 mt-1">96.8%</div>
            <div className="text-[9px] text-emerald-300/80">+4.2% vs Manual Dispatch</div>
          </div>

          <div className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded-lg flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Traffic Bottlenecks Avoided</div>
            <div className="text-lg font-black text-blue-400 mt-1">18 Hours</div>
            <div className="text-[9px] text-blue-300/80">NH-48 & Ring Road Bypass</div>
          </div>

          <div className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded-lg flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Driver Rest Compliance</div>
            <div className="text-lg font-black text-amber-400 mt-1">100% Valid</div>
            <div className="text-[9px] text-amber-300/80">Zero 49 CFR § 395 Violations</div>
          </div>

          <div className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded-lg flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Fuel / Energy Optimization</div>
            <div className="text-lg font-black text-purple-400 mt-1">-14.5% Fuel</div>
            <div className="text-[9px] text-purple-300/80">Off-Peak Dispatch Profiling</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Demand vs Traffic vs Driver Availability Chart */}
      <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-xl text-white font-mono space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              24-Hour Telematics Inputs (Traffic Congestion % vs Order Demand vs Available Drivers)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Traffic Congestion %
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Order Demand Volume
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Available Drivers
            </span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDrivers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2332" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", borderRadius: "8px", fontSize: "11px" }}
              />
              <Area type="monotone" dataKey="trafficCongestion" stroke="#f43f5e" fillOpacity={1} fill="url(#colorTraffic)" />
              <Area type="monotone" dataKey="orderVolume" stroke="#a855f7" fillOpacity={1} fill="url(#colorOrders)" />
              <Area type="monotone" dataKey="driverAvail" stroke="#10b981" fillOpacity={1} fill="url(#colorDrivers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Suggested 24-Hour Schedule Slots List */}
      <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-xl text-white font-mono space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Optimal 24-Hour Dispatch Sequence Recommendations
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            {scheduleSlots.length} Dispatches Queued
          </span>
        </div>

        <div className="space-y-2.5">
          {scheduleSlots.map((slot, idx) => (
            <div
              key={slot.orderId}
              className={`p-3 rounded-lg border transition-all space-y-2 ${
                slot.status === "CONFIRMED"
                  ? "bg-emerald-950/30 border-emerald-500/50 text-slate-100"
                  : "bg-[#141720] border-[#2A2D35] hover:border-slate-600 text-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2D35]/60 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="bg-purple-950 text-purple-300 border border-purple-500/40 font-extrabold text-xs px-2.5 py-1 rounded-md">
                    {slot.timeSlot}
                  </span>
                  <span className="font-bold text-xs text-white">{slot.orderId}</span>
                  <span className="text-[10px] text-slate-400 font-sans">{slot.cargo}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {slot.onTimeProbability}% On-Time Prob
                  </span>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">
                    {slot.trafficDelayFactor}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold">Assigned Vessel & Driver:</span>
                  <div className="text-white font-semibold mt-0.5 text-[11px]">
                    {slot.recommendedVehicle} • {slot.recommendedDriver}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Dest: {slot.destination}</div>
                </div>

                <div>
                  <span className="text-purple-300 text-[11px] font-bold flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-purple-400" /> AI Optimization Logic:
                  </span>
                  <p className="text-slate-300 text-[10.5px] italic mt-0.5 leading-snug">
                    "{slot.aiReasoning}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#2A2D35]/50">
                <span className="text-[10px] text-slate-500 font-mono">
                  Status: <strong className={slot.status === "CONFIRMED" ? "text-emerald-400" : "text-amber-400"}>{slot.status}</strong>
                </span>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {slot.status === "RECOMMENDED" ? (
                    <button
                      type="button"
                      onClick={() => handleConfirmSlot(idx)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Schedule Slot
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Schedule Slot Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
