import React, { useState } from "react";
import { AlertTriangle, Wrench, ShieldAlert, X, ExternalLink, ShieldX, Check } from "lucide-react";

interface UrgentMaintenanceOverlayProps {
  vehicles: any[];
  onSelectVehicle: (id: string) => void;
  onSetTab: (tab: string) => void;
  onAddToast?: (toast: { type: "info" | "success" | "warning"; title: string; message: string }) => void;
}

export default function UrgentMaintenanceOverlay({
  vehicles,
  onSelectVehicle,
  onSetTab,
  onAddToast
}: UrgentMaintenanceOverlayProps) {
  const [dismissedVehicleIds, setDismissedVehicleIds] = useState<string[]>([]);

  // Find vehicles that have "MAINTENANCE" status or critical faults
  const criticalVehicles = vehicles.filter(
    (v) =>
      (v.status === "MAINTENANCE" || v.status === "CRITICAL" || (v.battery_soc && v.battery_soc < 15)) &&
      !dismissedVehicleIds.includes(v.id)
  );

  if (criticalVehicles.length === 0) return null;

  const urgentVehicle = criticalVehicles[0];

  const handleInspect = () => {
    onSelectVehicle(urgentVehicle.id);
    onSetTab("fleet");
    if (onAddToast) {
      onAddToast({
        type: "warning",
        title: "Vehicle Fault Under Inspection",
        message: `Inspecting active CAN-bus diagnostics for unit ${urgentVehicle.id}.`
      });
    }
  };

  const handleGroundVehicle = () => {
    setDismissedVehicleIds((prev) => [...prev, urgentVehicle.id]);
    if (onAddToast) {
      onAddToast({
        type: "success",
        title: "Vehicle Grounded & Isolated",
        message: `Unit ${urgentVehicle.id} status flagged as GROUNDED. Maintenance ticket dispatched.`
      });
    }
  };

  const handleDismiss = () => {
    setDismissedVehicleIds((prev) => [...prev, urgentVehicle.id]);
  };

  return (
    <div className="bg-rose-950/90 border-b-2 border-rose-500 text-white px-4 py-3 font-sans shadow-xl relative animate-in slide-in-from-top duration-200 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-600 rounded-lg text-white animate-bounce shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs uppercase tracking-wider font-mono text-rose-300">
                🚨 URGENT MAINTENANCE FAULT DETECTED
              </span>
              <span className="bg-rose-600 text-white font-mono font-bold text-[9.5px] px-2 py-0.5 rounded border border-rose-400 animate-pulse">
                IMMEDIATE DOWNTIME REQUIRED
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5 font-mono">
              Unit <strong className="text-white underline">{urgentVehicle.id}</strong> ({urgentVehicle.license_plate || "IL-9821"}) reports critical fault:{" "}
              <span className="text-amber-200 font-bold">Core Overheat (98°C) / Brakes Wear Exceeded</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={handleInspect}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>INSPECT FAULT</span>
          </button>

          <button
            type="button"
            onClick={handleGroundVehicle}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm text-xs"
          >
            <ShieldX className="w-3.5 h-3.5" />
            <span>GROUND UNIT</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-800 rounded transition-colors cursor-pointer"
            title="Acknowledge Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
