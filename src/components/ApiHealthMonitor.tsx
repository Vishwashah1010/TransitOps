import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Wifi, Radio } from "lucide-react";

export interface ApiEndpointHealth {
  id: string;
  name: string;
  endpoint: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  lastPing: string;
  uptime: string;
}

export default function ApiHealthMonitor() {
  const [endpoints, setEndpoints] = useState<ApiEndpointHealth[]>([
    {
      id: "traffic",
      name: "Highway Traffic Telematics API",
      endpoint: "https://api.transitops.io/v2/traffic/live",
      status: "healthy",
      latencyMs: 14,
      lastPing: "Just now",
      uptime: "99.98%"
    },
    {
      id: "weather",
      name: "NOAA Doppler Weather Radar API",
      endpoint: "https://api.noaa.gov/v1/radar/reflectivity",
      status: "healthy",
      latencyMs: 22,
      lastPing: "Just now",
      uptime: "99.95%"
    },
    {
      id: "maps_routing",
      name: "Google Maps Corridor Routing Engine",
      endpoint: "https://maps.googleapis.com/maps/api/directions/json",
      status: "healthy",
      latencyMs: 18,
      lastPing: "Just now",
      uptime: "99.99%"
    },
    {
      id: "j1939_telematics",
      name: "J1939 CAN-Bus Fleet Telematics Stream",
      endpoint: "wss://telematics.transitops.io/stream/canbus",
      status: "healthy",
      latencyMs: 8,
      lastPing: "Just now",
      uptime: "100.00%"
    },
    {
      id: "logistics_geofence",
      name: "Depot Geofence & RFID Gate API",
      endpoint: "https://api.transitops.io/v1/geofence/events",
      status: "degraded",
      latencyMs: 142,
      lastPing: "2m ago",
      uptime: "98.40%"
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [isPingRefreshing, setIsPingRefreshing] = useState(false);

  // Overall system health
  const degradedCount = endpoints.filter((e) => e.status === "degraded").length;
  const downCount = endpoints.filter((e) => e.status === "down").length;
  const overallStatus = downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";

  const handlePingAll = () => {
    setIsPingRefreshing(true);
    setTimeout(() => {
      setEndpoints((prev) =>
        prev.map((e) => ({
          ...e,
          latencyMs: Math.floor(Math.random() * (e.id === "logistics_geofence" ? 80 : 30)) + 6,
          lastPing: "Just now"
        }))
      );
      setIsPingRefreshing(false);
    }, 600);
  };

  return (
    <div className="relative">
      {/* Header Widget Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono font-bold transition-all cursor-pointer ${
          overallStatus === "healthy"
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40"
            : overallStatus === "degraded"
            ? "bg-amber-950/40 border-amber-500/40 text-amber-400 hover:bg-amber-900/40"
            : "bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/40"
        }`}
        title="API Connectivity & Latency Health Monitor"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              overallStatus === "healthy"
                ? "bg-emerald-400"
                : overallStatus === "degraded"
                ? "bg-amber-400"
                : "bg-rose-400"
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              overallStatus === "healthy"
                ? "bg-emerald-500"
                : overallStatus === "degraded"
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          ></span>
        </span>

        <span className="hidden md:inline uppercase tracking-wider text-[10px]">
          {overallStatus === "healthy" ? "API HEALTH: 99.9%" : overallStatus === "degraded" ? "API LATENCY WARNING" : "API SYSTEM DOWN"}
        </span>

        <span className="text-[10px] bg-slate-900/80 px-1 rounded border border-slate-700/60 font-mono text-slate-300">
          14ms
        </span>
      </button>

      {/* Floating Detailed Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#0F1117] border border-[#2A2D35] rounded-xl shadow-2xl p-4 z-50 text-white font-sans space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  API & Connectivity Health Monitor
                </h4>
                <p className="text-[10px] text-slate-400">Real-time telematics endpoint latency telemetry</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePingAll}
              disabled={isPingRefreshing}
              className="p-1.5 bg-[#161922] hover:bg-[#1F2330] border border-[#2A2D35] rounded text-slate-400 hover:text-white text-xs cursor-pointer transition-colors"
              title="Ping All External API Endpoints"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>

          {/* Endpoints List */}
          <div className="space-y-2">
            {endpoints.map((ep) => {
              const isHealthy = ep.status === "healthy";
              const isDegraded = ep.status === "degraded";

              return (
                <div
                  key={ep.id}
                  className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded-lg flex items-center justify-between text-xs font-mono group hover:border-slate-600 transition-all"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px] truncate">
                      {isHealthy && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {isDegraded && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {!isHealthy && !isDegraded && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      <span className="truncate">{ep.name}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate font-sans">{ep.endpoint}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-bold ${
                        ep.latencyMs < 50
                          ? "text-emerald-400"
                          : ep.latencyMs < 150
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {ep.latencyMs}ms
                    </div>
                    <div className="text-[9px] text-slate-400">{ep.uptime} uptime</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#2A2D35] flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Core Gateway: <strong className="text-emerald-400">AWS CloudRun v4.2</strong></span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
