import React, { useState, useEffect } from "react";
import { ShieldAlert, Bell, Check, Navigation, AlertTriangle, X, Volume2, VolumeX, ShieldCheck } from "lucide-react";

export interface CriticalAlert {
  id: string;
  type: "GEOFENCE_EXIT" | "ENGINE_FAILURE" | "FATIGUE_CRITICAL" | "CARGO_BREACH";
  title: string;
  vehicleId: string;
  driverName?: string;
  message: string;
  timestamp: string;
  severity: "HIGH" | "CRITICAL";
  status: "PENDING" | "ACKNOWLEDGED" | "RESOLVED";
}

interface CriticalAlertManagerProps {
  vehicles: any[];
  onSelectVehicle?: (id: string) => void;
  onSetTab?: (tab: string) => void;
  onAddToast?: (toast: { type: "info" | "success" | "warn" | "error"; title: string; message: string }) => void;
}

export default function CriticalAlertManager({
  vehicles,
  onSelectVehicle,
  onSetTab,
  onAddToast
}: CriticalAlertManagerProps) {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([
    {
      id: "alert-101",
      type: "GEOFENCE_EXIT",
      title: "UNAUTHORIZED GEOFENCE EXIT",
      vehicleId: "FLT-9821",
      driverName: "Vikramaditya Sharma",
      message: "Vessel exited predefined corridor NH-48 near Sector 12 boundary. Speed: 84 km/h.",
      timestamp: "JUST NOW",
      severity: "CRITICAL",
      status: "PENDING"
    },
    {
      id: "alert-102",
      type: "ENGINE_FAILURE",
      title: "SUDDEN ENGINE OVERHEAT & PRESSURE DROP",
      vehicleId: "FLT-4412",
      driverName: "Rajesh Kumar V",
      message: "Coolant temperature spike to 112°C with hydraulic pressure loss in cylinder 3.",
      timestamp: "2 MINS AGO",
      severity: "CRITICAL",
      status: "PENDING"
    },
    {
      id: "alert-103",
      type: "FATIGUE_CRITICAL",
      title: "MAXIMUM CONTINUOUS HOURS BREACH",
      vehicleId: "FLT-1008",
      driverName: "Ananya Deshmukh",
      message: "Shift progress at 7.9 hrs continuous driving. Mandated 30-min break required immediately.",
      timestamp: "5 MINS AGO",
      severity: "HIGH",
      status: "PENDING"
    }
  ]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activePushPopup, setActivePushPopup] = useState<CriticalAlert | null>(alerts[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Periodically generate a simulated alert every 45 seconds for active demonstration
  useEffect(() => {
    const timer = setInterval(() => {
      const types: Array<CriticalAlert["type"]> = ["GEOFENCE_EXIT", "ENGINE_FAILURE", "FATIGUE_CRITICAL", "CARGO_BREACH"];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const sampleVehicles = vehicles.length > 0 ? vehicles : [
        { id: "FLT-9821" }, { id: "FLT-4412" }, { id: "FLT-1008" }, { id: "FLT-3309" }
      ];
      const targetV = sampleVehicles[Math.floor(Math.random() * sampleVehicles.length)];

      const newAlert: CriticalAlert = {
        id: `alert-${Date.now()}`,
        type: chosenType,
        title: chosenType === "GEOFENCE_EXIT" ? "UNAUTHORIZED CORRIDOR EXIT" :
               chosenType === "ENGINE_FAILURE" ? "ENGINE THERMAL ANOMALY" :
               chosenType === "FATIGUE_CRITICAL" ? "DRIVER REST BREAK OVERDUE" : "CARGO CONTAINER DOOR OPEN",
        vehicleId: targetV.id,
        driverName: "Active Fleet Operator",
        message: `High-priority telematics flag raised for unit ${targetV.id}. Immediate supervisor review recommended.`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        severity: "CRITICAL",
        status: "PENDING"
      };

      setAlerts((prev) => [newAlert, ...prev]);
      setActivePushPopup(newAlert);

      if (onAddToast) {
        onAddToast({
          type: "error",
          title: `CRITICAL ALERT: ${newAlert.vehicleId}`,
          message: newAlert.title
        });
      }
    }, 45000);

    return () => clearInterval(timer);
  }, [vehicles]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "ACKNOWLEDGED" } : a))
    );
    if (activePushPopup?.id === alertId) {
      setActivePushPopup(null);
    }
    if (onAddToast) {
      onAddToast({
        type: "success",
        title: "ALERT ACKNOWLEDGED",
        message: `Critical alert #${alertId} marked as acknowledged by dispatcher.`
      });
    }
  };

  const handleReRouteAlert = (alertItem: CriticalAlert) => {
    handleAcknowledge(alertItem.id);
    if (onSelectVehicle) onSelectVehicle(alertItem.vehicleId);
    if (onSetTab) onSetTab("fleet");
    if (onAddToast) {
      onAddToast({
        type: "info",
        title: "RE-ROUTING INITIATED",
        message: `Redirecting fleet view to ${alertItem.vehicleId} for emergency corridor recalculation.`
      });
    }
  };

  const pendingCount = alerts.filter((a) => a.status === "PENDING").length;

  return (
    <div className="relative font-sans">
      {/* Header Alert Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`relative p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
          pendingCount > 0
            ? "bg-rose-950/80 border-rose-500/60 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse"
            : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
        }`}
        title="Critical Alert Manager & Push Notifications"
      >
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow-sm">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Critical Alerts Center */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0F1117] border border-[#2A2D35] rounded-lg shadow-2xl z-50 p-3 font-mono text-xs space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Critical Alert Center</h4>
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] px-1.5 py-0.5 rounded font-extrabold">
                {pendingCount} Pending
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 hover:bg-[#1F2332] rounded text-slate-400 hover:text-white cursor-pointer"
                title={soundEnabled ? "Mute Alert Chime" : "Enable Alert Chime"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="p-1 hover:bg-[#1F2332] rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-gray-800">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-[11px]">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1 opacity-50" />
                No active critical alerts. Fleet operating within nominal boundaries.
              </div>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded border transition-all space-y-1.5 ${
                    item.status === "PENDING"
                      ? "bg-rose-950/30 border-rose-500/50 text-slate-100"
                      : "bg-[#141720] border-[#2A2D35] text-slate-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${item.status === "PENDING" ? "text-rose-400" : "text-gray-500"}`} />
                      <span className="font-bold text-[11px] text-white">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{item.timestamp}</span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-snug">{item.message}</p>

                  <div className="flex items-center justify-between text-[9.5px] pt-1 border-t border-[#2A2D35]/50">
                    <span className="text-amber-400 font-bold">Vessel: {item.vehicleId}</span>

                    {item.status === "PENDING" ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(item.id)}
                          className="px-2 py-0.5 bg-[#1F2332] hover:bg-slate-700 text-slate-200 border border-[#2A2D35] rounded font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" /> Ack
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReRouteAlert(item)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" /> Re-Route
                        </button>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Push Notification Banner Overlay (Top Right) */}
      {activePushPopup && activePushPopup.status === "PENDING" && (
        <div className="fixed top-14 right-4 z-50 max-w-sm w-full bg-[#0F1117] border-2 border-rose-500 text-white p-3.5 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.5)] font-mono text-xs space-y-2 animate-in slide-in-from-right-10 duration-300">
          <div className="flex items-start justify-between border-b border-rose-500/30 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-extrabold text-rose-400 text-[11px] tracking-wider uppercase">
                CRITICAL PUSH ALERT
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePushPopup(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="font-bold text-white text-xs">{activePushPopup.title}</div>
            <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
              {activePushPopup.message}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-amber-300 font-bold">
              Unit: {activePushPopup.vehicleId}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAcknowledge(activePushPopup.id)}
                className="px-2.5 py-1 bg-[#1A1D26] hover:bg-[#252936] text-slate-200 border border-[#2A2D35] rounded text-[10px] font-bold cursor-pointer"
              >
                Acknowledge
              </button>
              <button
                type="button"
                onClick={() => handleReRouteAlert(activePushPopup)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Navigation className="w-3 h-3" /> Re-Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
