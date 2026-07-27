import React, { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { TrendingUp, Percent, Signal, Flame, Users, ShieldAlert } from "lucide-react";
import TelemetryDrilldownModal, { TelemetryPointData } from "./TelemetryDrilldownModal";

export default function PerformanceWidget() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drilldownData, setDrilldownData] = useState<TelemetryPointData | null>(null);

  useEffect(() => {
    fetch("/api/performance")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const performanceLogs = [
    { asset: "FLT-9821", operator: "D. VASQUEZ", status: "TRANSIT", velocity: "84 KM/H", load: "92%", eta: "+00:12" },
    { asset: "FLT-4402", operator: "R. CHEN", status: "IDLE", velocity: "00 KM/H", load: "00%", eta: "--:--" },
    { asset: "FLT-1193", operator: "S. MULLER", status: "ALARM", velocity: "42 KM/H", load: "104%", eta: "-08:45" },
    { asset: "FLT-8722", operator: "K. TANAKA", status: "TRANSIT", velocity: "76 KM/H", load: "88%", eta: "+04:30" },
    { asset: "FLT-5510", operator: "A. PETROV", status: "STAGING", velocity: "12 KM/H", load: "45%", eta: "--:--" },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96 font-mono text-[#4ADE80]">
        <div className="w-5 h-5 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>RETRIEVING PERFORMANCE CORES...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Metric Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <div className="flex justify-between items-start text-[#8E9299] font-mono text-[10px] font-bold uppercase">
            <span>OPERATIONAL UPTIME</span>
            <Percent className="w-3.5 h-3.5 text-[#4ADE80]" />
          </div>
          <div className="mt-2">
            <h4 className="text-2xl text-white font-bold leading-none">{metrics.uptime}%</h4>
            <span className="text-[10px] font-mono text-[#4ADE80] mt-1 block">▲ 0.12% CO-FACTOR</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <div className="flex justify-between items-start text-[#8E9299] font-mono text-[10px] font-bold uppercase">
            <span>FLEET VELOCITY INDEX</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#FACC15]" />
          </div>
          <div className="mt-2">
            <h4 className="text-2xl text-white font-bold leading-none">{metrics.velocityIndex}</h4>
            <span className="text-[10px] font-mono text-[#FACC15] mt-1 block">STABLE RATIO MODE</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <div className="flex justify-between items-start text-[#8E9299] font-mono text-[10px] font-bold uppercase">
            <span>ACTIVE ALERTS</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div className="mt-2">
            <h4 className="text-2xl text-white font-bold leading-none">0{metrics.activeAlerts}</h4>
            <span className="text-[10px] font-mono text-[#EF4444] mt-1 block">CRITICAL SYSTEMS ALIGNED</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <div className="flex justify-between items-start text-[#8E9299] font-mono text-[10px] font-bold uppercase">
            <span>SYSTEM LOAD</span>
            <Signal className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="mt-2">
            <h4 className="text-2xl text-white font-bold leading-none">{metrics.systemLoad}%</h4>
            <span className="text-[10px] font-mono text-[#2563EB] mt-1 block">NOMINAL BANDWIDTH</span>
          </div>
        </div>
      </div>

      {/* 2. Charts and Idle Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between h-[360px] shadow-sm">
          <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-1.5">
              <span>■ ON-TIME PERFORMANCE TREND</span>
            </h3>
            <div className="flex gap-2 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-[#1A1D26] text-[#8E9299]">24H</span>
              <span className="px-2 py-0.5 rounded bg-[#4ADE80]/10 text-[#4ADE80] font-bold border border-[#4ADE80]/20 shadow-[0_0_8px_rgba(74,222,128,0.1)]">7D</span>
              <span className="px-2 py-0.5 rounded bg-[#1A1D26] text-[#8E9299]">30D</span>
            </div>
          </div>

          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.trend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const item = e.activePayload[0].payload;
                    setDrilldownData({
                      timestamp: `2026-07-27 (${item.date})`,
                      assetId: "FLT-9821",
                      metricName: "On-Time Performance Factor",
                      metricValue: `${item.performance}%`,
                      velocity: 82.5,
                      powerOut: 195,
                      coreTemp: 43.1,
                      engineLoad: item.performance > 90 ? 62 : 78
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8E9299" 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#8E9299" 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded font-mono text-xs text-white shadow-xl">
                          <div className="font-bold text-emerald-400 mb-1">{label} - Click to Inspect Telemetry</div>
                          <div>Performance: {payload[0].value}%</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Raw ECU sensor packet ready</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="performance" fill="#4ADE80" radius={[2, 2, 0, 0]} barSize={35} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Progress Meters */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between h-[360px] font-mono text-xs shadow-sm">
          <div>
            <div className="border-b border-[#2A2D35] pb-3 mb-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider">■ AVERAGE IDLE TIME</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-[#8E9299] mb-1">
                  <span>TERMINAL ALPHA</span>
                  <span className="text-white font-bold">12.4m</span>
                </div>
                <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                  <div className="bg-[#FACC15] h-full" style={{ width: "75%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#8E9299] mb-1">
                  <span>ZONE BRAVO-2</span>
                  <span className="text-white font-bold">08.2m</span>
                </div>
                <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                  <div className="bg-[#FACC15] h-full" style={{ width: "45%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#8E9299] mb-1">
                  <span>LOGISTICS HUB</span>
                  <span className="text-white font-bold">18.9m</span>
                </div>
                <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                  <div className="bg-[#FACC15] h-full" style={{ width: "95%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#8E9299] mb-1">
                  <span>STAGING YARD</span>
                  <span className="text-white font-bold">05.1m</span>
                </div>
                <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                  <div className="bg-[#FACC15] h-full" style={{ width: "25%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2A2D35] pt-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] text-[#8E9299] uppercase font-bold">FUEL INDEX AGGREGATE</div>
                <div className="text-md text-white font-bold mt-0.5">8.2 L/KM</div>
              </div>
              <span className="text-[10px] text-[#EF4444] font-bold">▲ 2.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Metrics Table */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-[#12141A] border-b border-[#2A2D35] flex justify-between items-center font-mono text-xs">
          <h3 className="text-white font-bold uppercase tracking-wider">Live Fleet Metrics</h3>
          <span className="text-[#8E9299]">REFRESH: 02s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2A2D35] text-[#8E9299] text-[10px] uppercase font-bold bg-[#12141A]/50">
                <th className="p-4">ASSET ID</th>
                <th className="p-4">OPERATOR</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">VELOCITY</th>
                <th className="p-4">LOAD FACTOR</th>
                <th className="p-4 text-right">ETA VARIANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D35]/50 text-[#E0E2E6]">
              {performanceLogs.map((log) => {
                let statBadge = "bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20";
                if (log.status === "ALARM") statBadge = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
                else if (log.status === "IDLE") statBadge = "bg-[#8E9299]/10 text-[#8E9299] border-[#8E9299]/20";
                else if (log.status === "STAGING") statBadge = "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/20";

                return (
                  <tr key={log.asset} className="hover:bg-[#1A1D26]/30 transition-colors">
                    <td className="p-4 font-bold text-white">{log.asset}</td>
                    <td className="p-4">{log.operator}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statBadge}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4">{log.velocity}</td>
                    <td className="p-4">{log.load}</td>
                    <td className="p-4 text-right text-[#8E9299]">{log.eta}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drilldownData && (
        <TelemetryDrilldownModal
          data={drilldownData}
          onClose={() => setDrilldownData(null)}
        />
      )}
    </div>
  );
}
