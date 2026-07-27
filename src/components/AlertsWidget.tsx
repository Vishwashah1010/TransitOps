import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle, RefreshCw, Terminal, User } from "lucide-react";

export default function AlertsWidget() {
  const [activeIncidents, setActiveIncidents] = useState([
    {
      id: "inc-1",
      severity: "CRITICAL",
      code: "ENGINE_FAIL",
      unit: "Unit #FLT-8722",
      summary: "Main Fuel Rail Pressure Drop",
      details: "Sector 7-G. Fuel pressure drop detected in primary fuel rail. Auto-mitigation loops operating at full cycle.",
      time: "04:22:11",
      internalTemp: 942.5,
      fuelPressure: 12.8,
      loadFactor: 0.42,
      sector: "SECTOR VISUAL: DELTA GRID 12",
      recommended: "IMMEDIATE DISPATCH: FIRE_SUPPRESSION_TEAM_04. ESTIMATED IMPACT: TOTAL_ROUTE_LOCKOUT."
    },
    {
      id: "inc-2",
      severity: "AMBER",
      code: "ROUTE_OBSTR",
      unit: "Transit 88-P",
      summary: "Tunnel Block Debris Field",
      details: "Visual confirmation required on tunnel block. Heavy construction scrap reported on Interstate I-94 route.",
      time: "04:19:45",
      internalTemp: 44.5,
      fuelPressure: 45.2,
      loadFactor: 0.88,
      sector: "SECTOR VISUAL: ROUTE 94-T",
      recommended: "REROUTE TO ALTERNATE: WEST_DECK_6 HIGHWAY INJECTOR. TIME DELAY BIAS: +14min."
    },
    {
      id: "inc-3",
      severity: "AMBER",
      code: "SENSOR_OFFLINE",
      unit: "Grid L-9",
      summary: "Lidar System Failure",
      details: "Intermittent signal loss from front perimeter sensor array. Telemetry packet collision detected. Tech dispatch pending.",
      time: "04:15:02",
      internalTemp: 32.1,
      fuelPressure: 55.4,
      loadFactor: 0.12,
      sector: "SECTOR VISUAL: BOUNDS GRID L-9",
      recommended: "FORCE OVERRIDE: REMOTE_GPS_RADAR_BACKUP. DISPATCH MAINT_CREW_02."
    }
  ]);

  const [selectedIncId, setSelectedIncId] = useState("inc-1");
  const [acknowledgedIncidents, setAcknowledgedIncidents] = useState<string[]>([]);
  const [relayedIncidents, setRelayedIncidents] = useState<string[]>([]);

  const selectedInc = activeIncidents.find((i) => i.id === selectedIncId) || activeIncidents[0];

  const handleAcknowledge = (id: string) => {
    if (!acknowledgedIncidents.includes(id)) {
      setAcknowledgedIncidents([...acknowledgedIncidents, id]);
    }
  };

  const handleRelayComms = (id: string) => {
    if (!relayedIncidents.includes(id)) {
      setRelayedIncidents([...relayedIncidents, id]);
    }
  };

  const isAcknowledge = acknowledgedIncidents.includes(selectedInc.id);
  const isRelayed = relayedIncidents.includes(selectedInc.id);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
      {/* 1. Left Incidents Panel */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg overflow-hidden flex flex-col h-[520px] shadow-md">
        <div className="p-4 border-b border-[#2A2D35] bg-[#12141A] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Active Incidents</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 font-mono font-bold">
            {activeIncidents.length - acknowledgedIncidents.length} UNRESOLVED
          </span>
        </div>

        {/* Incidents List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2A2D35]/70">
          {activeIncidents.map((inc) => {
            const isCrit = inc.severity === "CRITICAL";
            const isSelected = inc.id === selectedIncId;
            const isAck = acknowledgedIncidents.includes(inc.id);

            return (
              <button
                key={inc.id}
                onClick={() => setSelectedIncId(inc.id)}
                className={`w-full text-left p-4 transition-all hover:bg-[#1A1D26]/50 flex flex-col gap-2 relative ${
                  isSelected ? "bg-[#1A1D26] border-l-2 border-[#4ADE80]" : ""
                } ${isAck ? "opacity-40" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={isCrit ? "text-[#EF4444] font-bold" : "text-[#FACC15] font-bold"}>
                      {inc.severity} // {inc.code}
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="text-[#8E9299] font-medium">{inc.unit}</span>
                  </div>
                  <span className="text-[10px] text-[#8E9299]/80 font-mono">{inc.time}</span>
                </div>

                <div>
                  <h4 className="text-sm text-white font-medium tracking-tight mb-1">{inc.summary}</h4>
                  <p className="text-xs text-[#8E9299] line-clamp-2 leading-relaxed">{inc.details}</p>
                </div>

                {isAck && (
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-[#4ADE80] border border-[#4ADE80]/20 px-1 rounded bg-[#4ADE80]/5">
                    ✓ ACKNOWLEDGED
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Right Incidents Details Block */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex-1 flex flex-col justify-between shadow-md">
          <div>
            {/* Header Details */}
            <div className="flex justify-between items-start border-b border-[#2A2D35] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedInc.severity === "CRITICAL" ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25" : "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/25"}`}>
                    {selectedInc.severity}
                  </span>
                  <span className="text-[#8E9299]">UUID: 88-XKJ-1049</span>
                </div>
                <h2 className="text-xl text-white font-bold tracking-tight mt-1 font-mono">
                  {selectedInc.code} // <span className="text-[#8E9299]">{selectedInc.unit}</span>
                </h2>
              </div>

              {/* Action Operations buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRelayComms(selectedInc.id)}
                  disabled={isRelayed}
                  className="px-3.5 py-1.5 bg-[#1A1D26] border border-[#2A2D35] text-white hover:text-white rounded text-xs font-semibold hover:bg-[#1A1D26]/80 transition-all disabled:opacity-40 font-mono"
                >
                  {isRelayed ? "COMMS_RELAYED" : "RELAY COMMS"}
                </button>
                <button
                  onClick={() => handleAcknowledge(selectedInc.id)}
                  disabled={isAcknowledge}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded text-xs tracking-widest uppercase transition-all disabled:bg-gray-700 disabled:text-gray-400 font-mono"
                >
                  {isAcknowledge ? "ACKNOWLEDGED" : "ACKNOWLEDGE"}
                </button>
              </div>
            </div>

            {/* Quick Metrics display */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded font-mono shadow-sm">
                <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">INTERNAL TEMP</div>
                <div className="text-md text-white font-bold mt-1">
                  {selectedInc.internalTemp}°C
                </div>
                <div className="w-full bg-[#1A1D26] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#EF4444] h-full" style={{ width: `${Math.min(100, Math.round((selectedInc.internalTemp / 1000) * 100))}%` }}></div>
                </div>
              </div>

              <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded font-mono shadow-sm">
                <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">FUEL PRESSURE</div>
                <div className="text-md text-white font-bold mt-1">
                  {selectedInc.fuelPressure} PSI
                </div>
                <div className="w-full bg-[#1A1D26] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#FACC15] h-full" style={{ width: `${Math.min(100, Math.round((selectedInc.fuelPressure / 100) * 100))}%` }}></div>
                </div>
              </div>

              <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded font-mono shadow-sm">
                <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">LOAD FACTOR</div>
                <div className="text-md text-[#4ADE80] font-bold mt-1">
                  {selectedInc.loadFactor}G
                </div>
                <div className="w-full bg-[#1A1D26] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#4ADE80] h-full shadow-[0_0_8px_#4ADE80]" style={{ width: `${selectedInc.loadFactor * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Visual Vector Grid Overlay */}
            <div className="bg-[#161922] border border-[#2A2D35] rounded-md p-3 font-mono text-xs mb-4">
              <div className="text-[10px] text-[#8E9299] font-bold mb-2 uppercase tracking-wide flex justify-between items-center">
                <span>{selectedInc.sector}</span>
                <span className="text-[9px] text-[#8E9299]/60">LIVE SENSOR GRAPH</span>
              </div>
              <div className="h-28 border border-[#2A2D35] rounded bg-[#0A0B0E] relative overflow-hidden flex items-center justify-center">
                {/* Circuit lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  <path d="M 10,40 Q 120,80 280,20 T 500,90" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
                  <path d="M 50,90 Q 220,10 310,70 T 480,20" fill="none" stroke="#4ADE80" strokeWidth="1" />
                </svg>
                {/* Flashing target locator */}
                <div className="absolute w-5 h-5 bg-[#EF4444]/20 border border-[#EF4444] rounded-full animate-ping"></div>
                <div className="absolute w-2.5 h-2.5 bg-[#EF4444] rounded-full"></div>
                <span className="text-[10px] text-[#EF4444] mt-8 bg-[#0A0B0E]/80 px-2 py-0.5 rounded border border-[#EF4444]/20 font-bold tracking-widest z-10">ALARM LOCATOR TARGET</span>
              </div>
            </div>

            {/* Operator context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1D26] border border-[#2A2D35] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#8E9299]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#8E9299] font-mono uppercase font-bold">OPERATOR PROFILE</div>
                  <div className="text-xs text-white font-bold leading-tight mt-0.5">K. Vance // LEVEL_3</div>
                  <div className="text-[10px] text-[#8E9299] font-mono leading-none">Shift Lead / Alpha Wing</div>
                </div>
              </div>

              {/* Recommended Action card */}
              <div className="bg-[#78350F]/10 border border-[#78350F]/30 p-3 rounded font-mono text-[10px] space-y-1">
                <div className="text-[#FACC15] font-bold uppercase tracking-wider">RECOMMENDED ACTION</div>
                <p className="text-[#E0E2E6] leading-normal">{selectedInc.recommended}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Live system logs terminal console */}
        <div className="bg-[#0A0B0E] border border-[#2A2D35] rounded-md p-3.5 font-mono text-xs text-[#8E9299] space-y-1.5 h-36 overflow-y-auto">
          <div className="text-[10px] text-[#8E9299]/80 font-bold uppercase tracking-wider pb-1.5 border-b border-[#2A2D35] mb-1.5 flex justify-between">
            <span>● RAW SYSTEM OUTPUT STREAM</span>
            <span className="text-[#4ADE80]">BUFFER: 1024KB</span>
          </div>
          <div>[04:24:01] SYS_WATCHDOG: HEARTBEAT RECEIVED FROM SUB-NODE_GRID_A</div>
          <div className="text-[#EF4444]">[04:23:59] CRITICAL: ENGINE_THERMAL_EXCURSION (UNIT_1049) → EXCEEDS_LIMIT_900C</div>
          <div>[04:23:58] KERNEL: IO_WAIT DETECTED ON SECTOR_7_CONTROLLER</div>
          <div>[04:23:55] NETWORK: HANDSHAKE SUCCESSFUL - HUB_CENTRAL_COMM</div>
          <div className="text-[#FACC15]">[04:23:51] WARN: LOW_BANDWIDTH_DETECTED ON AUX_ANTENNA_4</div>
        </div>
      </div>
    </div>
  );
}
