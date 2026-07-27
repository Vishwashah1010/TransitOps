import React from "react";
import { Gauge, Zap, Thermometer, Wifi } from "lucide-react";

interface TelemetryGaugesProps {
  vehicle: any;
}

export default function TelemetryGauges({ vehicle }: TelemetryGaugesProps) {
  // Use current vehicle telemetry, or mock defaults if not available
  const velocity = vehicle?.velocity ?? 64.2;
  const powerOut = vehicle?.power_out ?? 182;
  const coreTemp = vehicle?.core_temp ?? 42.5;
  const signalStrength = vehicle?.signal_strength ?? 0.98;

  // Gauge bar levels (percentages for visual bar filling)
  const velPercent = Math.min(100, Math.round((velocity / 120) * 100));
  const powerPercent = Math.min(100, Math.round((powerOut / 300) * 100));
  const tempPercent = Math.min(100, Math.round((coreTemp / 100) * 100));
  const signalPercent = Math.round(signalStrength * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* 1. Velocity Card */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[180px] font-mono shadow-md">
        <div className="flex justify-between items-start text-[#8E9299]">
          <div className="text-xs uppercase tracking-wider font-bold">Velocity</div>
          <Gauge className="w-4 h-4 text-[#8E9299]" />
        </div>
        <div>
          <div className="text-3xl text-white font-bold tracking-tight">
            {velocity} <span className="text-xs text-[#8E9299] font-normal">KM/H</span>
          </div>
        </div>
        <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#4ADE80] h-full transition-all duration-500 shadow-[0_0_8px_#4ADE80]" style={{ width: `${velPercent}%` }}></div>
        </div>
      </div>

      {/* 2. Power Out Card */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[180px] font-mono shadow-md">
        <div className="flex justify-between items-start text-[#8E9299]">
          <div className="text-xs uppercase tracking-wider font-bold">Power Out</div>
          <Zap className="w-4 h-4 text-[#FACC15]" />
        </div>
        <div>
          <div className="text-3xl text-white font-bold tracking-tight">
            {powerOut} <span className="text-xs text-[#8E9299] font-normal">KW</span>
          </div>
        </div>
        <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#FACC15] h-full transition-all duration-500" style={{ width: `${powerPercent}%` }}></div>
        </div>
      </div>

      {/* 3. Core Temp Card */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[180px] font-mono shadow-md">
        <div className="flex justify-between items-start text-[#8E9299]">
          <div className="text-xs uppercase tracking-wider font-bold">Core Temp</div>
          <Thermometer className="w-4 h-4 text-[#EF4444]" />
        </div>
        <div>
          <div className="text-3xl text-white font-bold tracking-tight">
            {coreTemp} <span className="text-xs text-[#8E9299] font-normal">°C</span>
          </div>
        </div>
        <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${coreTemp > 45 ? "bg-[#EF4444]" : "bg-[#4ADE80]"}`} 
            style={{ width: `${tempPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 4. Signal Strength Card */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-[180px] font-mono shadow-md">
        <div className="flex justify-between items-start text-[#8E9299]">
          <div className="text-xs uppercase tracking-wider font-bold">Signal Str.</div>
          <Wifi className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <div className="text-3xl text-white font-bold tracking-tight">
            {signalStrength} <span className="text-xs text-[#8E9299] font-normal">GB/S</span>
          </div>
        </div>
        <div className="w-full bg-[#1A1D26] h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#2563EB] h-full transition-all duration-500" style={{ width: `${signalPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
}
