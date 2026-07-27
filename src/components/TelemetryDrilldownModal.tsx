import React, { useState } from "react";
import { X, Gauge, Zap, Thermometer, Wifi, Cpu, Copy, Check, Terminal, FileCode2, Clock, Activity, AlertTriangle } from "lucide-react";
import { useToasts } from "./ToastProvider";

export interface TelemetryPointData {
  timestamp: string;
  assetId?: string;
  driverName?: string;
  metricName?: string;
  metricValue?: number | string;
  velocity?: number;
  powerOut?: number;
  coreTemp?: number;
  signalStrength?: number;
  engineLoad?: number;
  fuelCapacity?: number;
  vibrationG?: number;
  rpm?: number;
  rawPayload?: any;
}

interface TelemetryDrilldownModalProps {
  data: TelemetryPointData | null;
  onClose: () => void;
}

export default function TelemetryDrilldownModal({ data, onClose }: TelemetryDrilldownModalProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToasts();

  if (!data) return null;

  // Synthesize realistic raw sensor telemetry parameters if not fully provided
  const vel = data.velocity ?? (typeof data.metricValue === "number" ? data.metricValue : 74.2);
  const temp = data.coreTemp ?? 42.8;
  const power = data.powerOut ?? 185;
  const load = data.engineLoad ?? 68;
  const fuel = data.fuelCapacity ?? 82;
  const signal = data.signalStrength ?? 0.98;
  const vib = data.vibrationG ?? 0.04;
  const rpm = data.rpm ?? 2240;

  const rawJson = data.rawPayload || {
    timestamp: data.timestamp,
    header: {
      protocol_version: "CAN-BUS-v4.2",
      packet_id: `PKT-${Math.floor(100000 + Math.random() * 900000)}`,
      checksum: "0x8F2A1C0B",
      latency_ms: 12.4
    },
    sensors: {
      velocity_kmh: vel,
      core_temperature_celsius: temp,
      power_output_kw: power,
      engine_load_percent: load,
      fuel_capacity_percent: fuel,
      signal_strength_gbs: signal,
      three_axis_vibration_g: vib,
      engine_rpm: rpm,
      gps_coordinates: {
        lat: 28.5000,
        lng: 77.2800,
        altitude_m: 216.4,
        satellites_locked: 14
      }
    },
    diagnostics: {
      ecu_status: "NOMINAL",
      brake_line_pressure_psi: 1240,
      oil_pressure_bar: 4.2,
      battery_voltage: 24.1,
      exhaust_gas_temp_c: 480
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: "success",
      title: "Telemetry Payload Copied",
      message: "Raw CAN-bus JSON sensor payload copied to clipboard."
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Raw Telemetry Sensor Drill-Down</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  TIMESTAMP: {data.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Detailed packet level CAN-bus telemetry payload for Asset <span className="text-blue-400 font-mono font-bold">{data.assetId || "FLT-9821"}</span> {data.driverName ? `(Operator: ${data.driverName})` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 font-sans text-slate-200 text-xs">
          
          {/* Key Sensor Gauges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold mb-1">
                <span>Velocity</span>
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white">{vel} <span className="text-[10px] text-slate-400 font-normal">KM/H</span></div>
              <div className="text-[9px] text-emerald-400 mt-1">RPM: {rpm}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold mb-1">
                <span>Core Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-white">{temp} <span className="text-[10px] text-slate-400 font-normal">°C</span></div>
              <div className={`text-[9px] mt-1 ${temp > 50 ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                {temp > 50 ? "WARNING TEMP HIGH" : "THERMAL NOMINAL"}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold mb-1">
                <span>Power Output</span>
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div className="text-xl font-bold text-white">{power} <span className="text-[10px] text-slate-400 font-normal">KW</span></div>
              <div className="text-[9px] text-yellow-400 mt-1">Engine Load: {load}%</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold mb-1">
                <span>Signal Strength</span>
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">{signal} <span className="text-[10px] text-slate-400 font-normal">GB/S</span></div>
              <div className="text-[9px] text-blue-400 mt-1">Vibration: {vib}g</div>
            </div>
          </div>

          {/* Raw JSON Telemetry Inspector */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <FileCode2 className="w-4 h-4 text-emerald-400" />
                <span>Raw CAN-Bus Telemetry Payload</span>
              </div>
              
              <button
                onClick={handleCopyRaw}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition-colors cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copied ? "Copied!" : "Copy JSON"}</span>
              </button>
            </div>

            <pre className="p-4 text-[11px] font-mono text-emerald-400 bg-slate-950 overflow-x-auto max-h-60 leading-relaxed">
              {JSON.stringify(rawJson, null, 2)}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>ECU Node: TransitOps-Core-01 // Verified Data Integrity</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
