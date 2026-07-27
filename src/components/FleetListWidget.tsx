import React, { useState } from "react";
import { List, ShieldAlert, Cpu, Eye, Radio } from "lucide-react";

interface FleetListWidgetProps {
  vehicles: any[];
}

export default function FleetListWidget({ vehicles }: FleetListWidgetProps) {
  const [selectedVId, setSelectedVId] = useState(vehicles[0]?.id || "FLT-9821");
  const [commLogs, setCommLogs] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVId) || vehicles[0];

  const handleCommLink = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setCommLogs((prev) => [
        ...prev,
        `Secure handshake established with unit [${selectedVehicle.id}]`,
        `Transmitting spatial sync coordinates...`,
        `Direct uplink locked successfully.`
      ]);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
      {/* 1. Fleet List Panel */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg overflow-hidden flex flex-col h-[520px] shadow-md">
        <div className="p-4 border-b border-[#2A2D35] bg-[#12141A] flex justify-between items-center font-mono text-xs">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.3)]" />
            <span className="text-white font-bold uppercase tracking-wider">Unit Inventory</span>
          </div>
          <span className="text-[#8E9299]">TOTAL: {vehicles.length}</span>
        </div>

        {/* Inventory List table headers */}
        <div className="grid grid-cols-4 px-4 py-2 border-b border-[#2A2D35] text-[9px] font-mono text-[#8E9299] font-bold uppercase bg-[#12141A]/50">
          <span>ID</span>
          <span>SPD</span>
          <span>ETA</span>
          <span className="text-right">RT STATUS</span>
        </div>

        {/* Inventory Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2A2D35]/70 font-mono text-xs">
          {vehicles.map((v) => {
            const isSelected = v.id === selectedVId;
            const statusColor = v.status === "ACTIVE" ? "text-[#4ADE80]" : "text-[#FACC15]";
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVId(v.id)}
                className={`w-full grid grid-cols-4 px-4 py-3.5 text-left transition-all hover:bg-[#1A1D26]/50 ${
                  isSelected ? "bg-[#1A1D26] border-l-2 border-[#4ADE80]" : ""
                }`}
              >
                <span className="text-white font-semibold">{v.id}</span>
                <span className="text-[#8E9299]">{v.velocity || 0} KM/H</span>
                <span className="text-[#8E9299]">{v.status === "ACTIVE" ? "14:20" : "N/A"}</span>
                <span className={`text-right font-bold ${statusColor}`}>{v.status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Diagnostics details */}
      <div className="xl:col-span-2 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[520px] shadow-md">
        {selectedVehicle ? (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#2A2D35] pb-3 mb-4 font-mono">
                <div>
                  <span className="text-[10px] text-[#8E9299]">UNIT DIAGNOSTICS</span>
                  <h2 className="text-xl text-white font-bold">{selectedVehicle.id} // <span className="text-[#8E9299] text-sm font-normal">{selectedVehicle.type}</span></h2>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[#8E9299] uppercase font-bold">HW REVISION</div>
                  <div className="text-[#4ADE80] font-bold text-xs uppercase">V2.14.0-STABLE</div>
                </div>
              </div>

              {/* Progress bars capacity & load */}
              <div className="space-y-4 mb-5 font-mono">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[#8E9299]">FUEL CELL CAPACITY</span>
                    <span className="text-white font-bold">{selectedVehicle.fuel_capacity || 82}%</span>
                  </div>
                  <div className="w-full bg-[#1A1D26] h-2 rounded-full overflow-hidden border border-[#2A2D35]">
                    <div className="bg-[#4ADE80] h-full transition-all duration-500 shadow-[0_0_8px_#4ADE80]" style={{ width: `${selectedVehicle.fuel_capacity || 82}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[#8E9299]">ENGINE LOAD INDICES</span>
                    <span className="text-[#FACC15] font-bold">{selectedVehicle.engine_load || 45}%</span>
                  </div>
                  <div className="w-full bg-[#1A1D26] h-2 rounded-full overflow-hidden border border-[#2A2D35]">
                    <div className="bg-[#FACC15] h-full transition-all duration-500" style={{ width: `${selectedVehicle.engine_load || 45}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Grid telemetry readings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 font-mono text-xs">
                <div className="bg-[#12141A] border border-[#2A2D35] p-2.5 rounded shadow-sm">
                  <span className="text-[9px] text-[#8E9299] font-bold block uppercase">TEMP</span>
                  <span className="text-white font-bold block mt-0.5">{selectedVehicle.core_temp || 34.2}°C</span>
                </div>
                <div className="bg-[#12141A] border border-[#2A2D35] p-2.5 rounded shadow-sm">
                  <span className="text-[9px] text-[#8E9299] font-bold block uppercase">CURRENT_LOAD</span>
                  <span className="text-white font-bold block mt-0.5">{(selectedVehicle.max_capacity * 0.45).toFixed(0)} KG</span>
                </div>
                <div className="bg-[#12141A] border border-[#2A2D35] p-2.5 rounded shadow-sm">
                  <span className="text-[9px] text-[#8E9299] font-bold block uppercase">GPS LOCK</span>
                  <span className="text-white font-bold block mt-0.5">ACTIVE: 12S</span>
                </div>
                <div className="bg-[#12141A] border border-[#2A2D35] p-2.5 rounded shadow-sm">
                  <span className="text-[9px] text-[#8E9299] font-bold block uppercase">GATEWAY IP</span>
                  <span className="text-white font-bold block mt-0.5">10.0.4.{selectedVehicle.id.split("-")[1]}</span>
                </div>
              </div>

              {/* Cockpit camera visual preview */}
              <div className="bg-[#0A0B0E] border border-[#2A2D35] rounded p-2.5 font-mono text-[10px] text-[#8E9299] relative h-36 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="flex justify-between text-[9px] text-[#8E9299]/60 uppercase border-b border-[#2A2D35] pb-1 font-bold z-10">
                  <span>🎥 DASHBOARD COCKPIT EYE-LINK</span>
                  <span className="text-[#4ADE80]">FPS: 30 / RESOLUTION: 480P</span>
                </div>
                
                {/* Visual Camera representation */}
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 120">
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#4ADE80" strokeWidth="0.5" strokeDasharray="5,5" />
                    <line x1="200" y1="0" x2="200" y2="120" stroke="#4ADE80" strokeWidth="0.5" strokeDasharray="5,5" />
                    <circle cx="200" cy="60" r="30" fill="none" stroke="#4ADE80" strokeWidth="1" />
                    <circle cx="200" cy="60" r="45" fill="none" stroke="#4ADE80" strokeWidth="0.5" strokeDasharray="3,3" />
                  </svg>
                </div>
                
                <div className="z-10 text-center flex flex-col items-center justify-center h-full">
                  <Radio className="w-6 h-6 text-[#4ADE80] animate-pulse mb-1" />
                  <span className="font-bold uppercase tracking-wider text-[#4ADE80]">Live Visual Pipeline Locked</span>
                  <p className="text-[9px] text-[#8E9299] uppercase tracking-widest mt-0.5">Telemetry overlay fully synchronized</p>
                </div>

                <div className="flex justify-between text-[9px] text-[#8E9299]/60 uppercase pt-1 border-t border-[#2A2D35] z-10 font-bold">
                  <span>UTC: {new Date().toISOString().substring(0,10)}</span>
                  <span>UPLINK CODE: CJS_TRANSIT</span>
                </div>
              </div>
            </div>

            {/* Link comms control */}
            <div className="mt-4 flex gap-4 items-center">
              <button
                onClick={handleCommLink}
                disabled={connecting}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold uppercase text-xs tracking-widest rounded transition-all disabled:bg-gray-700 disabled:text-gray-400 font-mono shadow-md"
              >
                {connecting ? "CONNECTING..." : "DIRECT COMM LINK"}
              </button>
              
              <div className="flex-1 font-mono text-[10px] text-[#8E9299] max-h-12 overflow-y-auto leading-relaxed border-l border-[#2A2D35] pl-4">
                {commLogs.length > 0 ? (
                  commLogs.slice(-2).map((log, index) => (
                    <div key={index} className="text-[#E0E2E6]">✓ {log}</div>
                  ))
                ) : (
                  <div>Comms ready. Click direct link to query remote units.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center font-mono text-[#8E9299]">
            Select a unit from the inventory to query details.
          </div>
        )}
      </div>
    </div>
  );
}
