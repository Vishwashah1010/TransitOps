import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Activity, TrendingUp, Heart, Gauge, Wrench, RefreshCw, CheckCircle2, Clock, UserX, Download, ArrowUpRight, ShieldCheck, Flame, Shield, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { exportSafetyAndRiskToCsv } from "../utils/csvExport";
import TelemetryDrilldownModal, { TelemetryPointData } from "./TelemetryDrilldownModal";
import { useToasts } from "./ToastProvider";

export default function SafetyRiskOverview() {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [safetyData, setSafetyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drilldownData, setDrilldownData] = useState<TelemetryPointData | null>(null);
  const { addToast } = useToasts();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health-safety");
      const data = await res.json();
      setHealthData(data.health || []);
      setSafetyData(data.safety || []);
    } catch (err) {
      console.error("Failed to load safety & risk data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute overall composite fleet risk score
  const highRiskVehicles = healthData.filter(v => v.risk_level === "HIGH" || v.health_percentage < 60);
  const mediumRiskVehicles = healthData.filter(v => v.risk_level === "MEDIUM" || (v.health_percentage >= 60 && v.health_percentage < 85));
  const lowRiskVehicles = healthData.filter(v => v.risk_level === "LOW" && v.health_percentage >= 85);

  const highRiskDrivers = safetyData.filter(s => s.safety_score < 80 || s.fatigue_indicators > 0 || s.driving_hours_today > 8.0);
  const totalBraking = safetyData.reduce((acc, s) => acc + s.sudden_braking_events, 0);
  const totalSpeeding = safetyData.reduce((acc, s) => acc + s.speeding_events, 0);

  // Safety Violation 7-Day Trend data
  const violationTrendData = [
    { day: "MON", harshBraking: 2, speeding: 4, fatigueWarnings: 0, fleetRiskIndex: 18 },
    { day: "TUE", harshBraking: 1, speeding: 3, fatigueWarnings: 1, fleetRiskIndex: 14 },
    { day: "WED", harshBraking: 4, speeding: 6, fatigueWarnings: 2, fleetRiskIndex: 28 },
    { day: "THU", harshBraking: 2, speeding: 2, fatigueWarnings: 0, fleetRiskIndex: 12 },
    { day: "FRI", harshBraking: 5, speeding: 8, fatigueWarnings: 3, fleetRiskIndex: 35 },
    { day: "SAT", harshBraking: 1, speeding: 3, fatigueWarnings: 1, fleetRiskIndex: 16 },
    { day: "SUN", harshBraking: 0, speeding: 1, fatigueWarnings: 0, fleetRiskIndex: 8 },
  ];

  // Predictive Maintenance Alerts
  const predictiveMaintenanceAlerts = [
    {
      id: "ALT-2209",
      assetId: "FLT-2209",
      riskLevel: "CRITICAL",
      issue: "Transmission Slip & Secondary Gear Lock Warning",
      healthScore: 42,
      estFailureDate: "2026-07-30",
      recommendedAction: "Lock dispatch & complete clutch pack solenoid replacement."
    },
    {
      id: "ALT-8722",
      assetId: "FLT-8722",
      riskLevel: "MEDIUM",
      issue: "Exhaust Backpressure Elevation & Tire Tread Wear (>85% wear)",
      healthScore: 72,
      estFailureDate: "2026-08-10",
      recommendedAction: "Schedule tire rotation and particulate filter purge."
    },
    {
      id: "ALT-5510",
      assetId: "FLT-5510",
      riskLevel: "LOW",
      issue: "Hydraulic Fluid Degradation (Minor Viscosity Shift)",
      healthScore: 81,
      estFailureDate: "2026-09-02",
      recommendedAction: "Routine fluid top-up during scheduled weekend inspection."
    }
  ];

  return (
    <div className="space-y-5 font-sans">
      
      {/* Top Header Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">Safety & Risk Overview</h2>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold">
              REAL-TIME FLEET SCORE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time fleet safety telemetry, violation trends, and predictive maintenance risk forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportSafetyAndRiskToCsv(healthData, safetyData)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Risk CSV</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Refresh Real-time Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Real-time Fleet Risk KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Card 1: Composite Risk Index */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400 text-[10px] uppercase font-bold">
            <span>Fleet Risk Index</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white flex items-baseline gap-2">
              <span>LOW (18.4)</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                -3.2% vs Wk
              </span>
            </div>
            <span className="text-[10px] text-slate-400">92% Fleet operating in safe thresholds</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[82%] shadow-[0_0_8px_#22c55e]"></div>
          </div>
        </div>

        {/* Card 2: High Risk Assets */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400 text-[10px] uppercase font-bold">
            <span>High Risk Assets</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white flex items-baseline gap-2">
              <span className="text-rose-400 font-mono">{highRiskVehicles.length || 1} Vehicle</span>
              <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded animate-pulse">
                ACTION REQ
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Unit FLT-2209 in maintenance stage 'REPAIR'</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full w-[25%] shadow-[0_0_8px_#ef4444]"></div>
          </div>
        </div>

        {/* Card 3: Driver Telemetry Violations */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400 text-[10px] uppercase font-bold">
            <span>Active Safety Triggers</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white flex items-baseline gap-2">
              <span className="text-amber-400">{totalBraking + totalSpeeding} Events</span>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                Today
              </span>
            </div>
            <span className="text-[10px] text-slate-400">{totalBraking} Harsh Braking • {totalSpeeding} Speeding</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-[45%]"></div>
          </div>
        </div>

        {/* Card 4: Predictive Servicing Alerts */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400 text-[10px] uppercase font-bold">
            <span>Predictive Service Alerts</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white flex items-baseline gap-2">
              <span className="text-blue-400">3 Pending</span>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                Forecaster
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Next due: FLT-2209 (In 3 days)</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[60%]"></div>
          </div>
        </div>
      </div>

      {/* Safety Violation Trends & Risk Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Trend Area Chart (col-span-2) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                7-Day Safety Violation Trends & Fleet Risk Index
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Click any data node to inspect raw timestamped telemetry payload</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              Interactive Drilldown Enabled
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={violationTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const point = e.activePayload[0].payload;
                    setDrilldownData({
                      timestamp: `2026-07-27 (${point.day})`,
                      assetId: "FLEET-WIDE-AGGREGATE",
                      metricName: "Fleet Risk Index",
                      metricValue: point.fleetRiskIndex,
                      velocity: 78.4,
                      powerOut: 190,
                      coreTemp: 44.2,
                      engineLoad: point.fleetRiskIndex + 30
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg font-mono text-xs shadow-xl space-y-1">
                          <div className="text-white font-bold border-b border-slate-800 pb-1 mb-1">
                            Day: {label} (Click to inspect timestamp telemetry)
                          </div>
                          <div className="text-rose-400">Harsh Braking: {payload[0]?.value}</div>
                          <div className="text-amber-400">Speeding: {payload[1]?.value}</div>
                          <div className="text-emerald-400 font-bold">Fleet Risk Index: {payload[2]?.value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="harshBraking" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                <Area type="monotone" dataKey="speeding" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="fleetRiskIndex" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive Maintenance Alerts Column */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                Predictive Maintenance Alerts
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated component lifespan degradation predictions</p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {predictiveMaintenanceAlerts.map((alt) => (
                <div key={alt.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{alt.assetId}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      alt.riskLevel === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" :
                      alt.riskLevel === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    }`}>
                      {alt.riskLevel}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-tight">{alt.issue}</p>

                  <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 flex justify-between items-center">
                    <span>Est. Failure Date: <strong className="text-rose-400">{alt.estFailureDate}</strong></span>
                    <span>Health: <strong className="text-white">{alt.healthScore}%</strong></span>
                  </div>

                  <div className="bg-slate-900 p-2 rounded text-[10px] text-blue-300 border border-slate-800">
                    💡 <strong>Action:</strong> {alt.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* High-Risk Operator Mitigation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-400" />
            <h3 className="text-white font-bold uppercase tracking-wider">High-Risk Operator Spotlight & Mitigation</h3>
          </div>
          <span className="text-slate-400 text-[11px]">ACTIVE COMPLIANCE GUARDS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold bg-slate-950/60">
                <th className="p-3.5">OPERATOR ID</th>
                <th className="p-3.5">SAFETY SCORE</th>
                <th className="p-3.5">BRAKING / SPEEDING</th>
                <th className="p-3.5">DRIVING HOURS TODAY</th>
                <th className="p-3.5">RISK DIAGNOSIS</th>
                <th className="p-3.5 text-right">ADMIN MITIGATION ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {safetyData.map((drv) => {
                const isHighRisk = drv.safety_score < 80 || drv.fatigue_indicators > 0 || drv.driving_hours_today > 8.0;
                return (
                  <tr key={drv.driver_id} className={`hover:bg-slate-800/40 transition-colors ${isHighRisk ? "bg-rose-950/10" : ""}`}>
                    <td className="p-3.5 font-bold text-white">{drv.driver_id}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        drv.safety_score >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        drv.safety_score >= 80 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                      }`}>
                        {drv.safety_score} / 100
                      </span>
                    </td>
                    <td className="p-3.5">{drv.sudden_braking_events} Braking • {drv.speeding_events} Speeding</td>
                    <td className="p-3.5">
                      <span className={drv.driving_hours_today > 8.0 ? "text-rose-400 font-bold" : "text-slate-300"}>
                        {drv.driving_hours_today} hrs
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {drv.fatigue_indicators > 0 ? "Fatigue Warning On-Duty" : drv.safety_score < 80 ? "Frequent Speeding Violations" : "Normal Duty Parameters"}
                    </td>
                    <td className="p-3.5 text-right">
                      {isHighRisk ? (
                        <button
                          onClick={() => {
                            addToast({
                              type: "warning",
                              title: "Mitigation Directive Issued",
                              message: `Mandatory rest pause directive transmitted to ${drv.driver_id}.`
                            });
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded transition-colors cursor-pointer"
                        >
                          Enforce Mandatory Rest
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-bold">✓ Compliant</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Drilldown Inspection Modal */}
      {drilldownData && (
        <TelemetryDrilldownModal
          data={drilldownData}
          onClose={() => setDrilldownData(null)}
        />
      )}

    </div>
  );
}
