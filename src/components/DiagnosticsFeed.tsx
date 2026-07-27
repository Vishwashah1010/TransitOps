import React, { useEffect, useState, useRef } from "react";
import { Terminal, Download, TrendingUp, Calendar, Wrench, Clock, MapPin, Gauge, Zap, Play, Pause, RotateCcw, FastForward, Mic, MicOff, Send, Volume2 } from "lucide-react";
import { loadUserSettings, saveUserSettings } from "../utils/userSettingsStore";

interface DiagnosticsFeedProps {
  logs: string[];
  systemStatus?: string;
  vehicles?: any[];
  drivers?: any[];
  orders?: any[];
  onScheduleService?: (vehicleId: string, component: string, date: string) => void;
}

interface MaintenanceComponentForecast {
  id: string;
  vehicleId: string;
  vehicleName: string;
  component: string;
  currentKm: number;
  thresholdKm: number;
  dailyAvgKm: number;
  projectedFailureDate: string;
  daysRemaining: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  failureProbability: number;
}

export default function DiagnosticsFeed({ 
  logs, 
  systemStatus = "OPERATIONAL", 
  vehicles = [], 
  drivers = [], 
  orders = [],
  onScheduleService
}: DiagnosticsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<"logs" | "predictive" | "playback">(() => {
    const settings = loadUserSettings();
    return (settings.panelPreferences.diagnosticsView as any) || "logs";
  });

  const [liveLogs, setLiveLogs] = useState<Array<{ id: number; text: string; type: 'OK' | 'WARN' | 'INFO' | 'CRIT'; time: string }>>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>("comp-1");

  // Voice-to-text field note state
  const [voiceNoteText, setVoiceNoteText] = useState("");
  const [selectedNoteVehicle, setSelectedNoteVehicle] = useState(vehicles[0]?.id || "FLT-9821");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNoteText("Dispatcher Voice Log: Highway clearance on NH-48 confirmed. Vehicle thermals optimal.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setVoiceNoteText(transcript);
        };

        recognition.onerror = (err: any) => {
          console.error("Speech Recognition Error", err);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const handleAppendVoiceNote = () => {
    if (!voiceNoteText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false });
    const formattedNote = `[VOICE LOG - ${selectedNoteVehicle}]: ${voiceNoteText}`;

    setLiveLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: formattedNote,
        type: "INFO",
        time: timeStr
      }
    ]);
    setVoiceNoteText("");
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Telemetry Playback State
  const [playbackVehicleId, setPlaybackVehicleId] = useState<string>(vehicles[0]?.id || "FLT-9821");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(35); // 0 to 100 %
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x

  // Playback timer effect
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 300 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const defaultLogs = [
    { text: "PING SUCCESS - SERVER_ONLINE", type: "OK" },
    { text: "BATTERY_TEMP RISING - STABLE FLUIDS IN RANGE", type: "WARN" },
    { text: "ROUTE RECALC COMPLETED - VECTOR OFFSET FIXED", type: "INFO" },
    { text: "GYRO_STABILIZER OFFLINE - COMPENSATING COILS ACTIVE", type: "CRIT" },
    { text: "HYDRAULIC_PRESSURE NOMINAL - CHASSIS LEVEL", type: "OK" },
    { text: "UNIT_ID_101 AUTHENTICATED ON PORT_3000", type: "INFO" },
    { text: "TELEMETRY_LINK_02 ESTABLISHED WITH MAIN_CORE", type: "OK" },
  ];

  // Dynamic predictive maintenance list calculated from vehicles dataset
  const generateMaintenanceForecasts = (): MaintenanceComponentForecast[] => {
    const baseVehicles = vehicles.length > 0 ? vehicles : [
      { id: "FLT-9821", license_plate: "IL-9821-X", type: "Heavy Truck" },
      { id: "FLT-4412", license_plate: "IL-4412-A", type: "Cargo Drone" },
      { id: "FLT-1008", license_plate: "IL-1008-B", type: "Medium Van" },
      { id: "FLT-3309", license_plate: "IL-3309-C", type: "EV Transport" },
    ];

    const components = [
      { name: "Brake Pad Friction Assembly", baseThreshold: 120000, baseCurrent: 114200, rate: 210 },
      { name: "Transmission Fluid & Seals", baseThreshold: 180000, baseCurrent: 172500, rate: 250 },
      { name: "Gyro Stabilizer Coils", baseThreshold: 95000, baseCurrent: 89400, rate: 180 },
      { name: "High-Voltage Battery Core", baseThreshold: 220000, baseCurrent: 201000, rate: 310 },
      { name: "Pneumatic Suspension Valves", baseThreshold: 140000, baseCurrent: 133800, rate: 195 },
    ];

    return baseVehicles.flatMap((v, index) => {
      const comp = components[index % components.length];
      const currentKm = comp.baseCurrent + (index * 1400);
      const thresholdKm = comp.baseThreshold;
      const dailyAvgKm = comp.rate;
      const remainingKm = Math.max(0, thresholdKm - currentKm);
      const daysRemaining = Math.max(1, Math.round(remainingKm / dailyAvgKm));

      const now = new Date();
      now.setDate(now.getDate() + daysRemaining);
      const projectedFailureDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
      let failureProbability = Math.min(99, Math.round((currentKm / thresholdKm) * 100));

      if (daysRemaining <= 10) riskLevel = "CRITICAL";
      else if (daysRemaining <= 25) riskLevel = "HIGH";
      else if (daysRemaining <= 50) riskLevel = "MEDIUM";

      return {
        id: `comp-${v.id}-${index}`,
        vehicleId: v.id,
        vehicleName: `${v.id} (${v.type || v.license_plate || "Vehicle"})`,
        component: comp.name,
        currentKm,
        thresholdKm,
        dailyAvgKm,
        projectedFailureDate,
        daysRemaining,
        riskLevel,
        failureProbability,
      };
    });
  };

  const forecasts = generateMaintenanceForecasts();
  const selectedForecast = forecasts.find((f) => f.id === selectedComponentId) || forecasts[0];

  useEffect(() => {
    const initial = defaultLogs.map((item, index) => {
      const now = new Date();
      now.setSeconds(now.getSeconds() - (10 - index) * 5);
      const timeStr = now.toLocaleTimeString([], { hour12: false });
      return {
        id: index,
        text: item.text,
        type: item.type as any,
        time: timeStr
      };
    });
    setLiveLogs(initial);
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      const latestText = logs[logs.length - 1];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false });
      
      setLiveLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: latestText,
          type: latestText.includes("fail") || latestText.includes("CRIT") ? "CRIT" : latestText.includes("re-route") ? "INFO" : "OK",
          time: timeStr
        }
      ]);
    }
  }, [logs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [liveLogs]);

  const handleToggleView = (view: "logs" | "predictive" | "playback") => {
    setActiveView(view);
    const settings = loadUserSettings();
    saveUserSettings({
      panelPreferences: {
        ...settings.panelPreferences,
        diagnosticsView: view
      }
    });
  };

  const handleDownloadSnapshot = () => {
    const snapshot = {
      app_id: "transitops-command-center",
      timestamp: new Date().toISOString(),
      offline_auditing: {
        system_status: systemStatus,
        active_fleet_count: vehicles.length,
        drivers_registry_count: drivers.length,
        pending_orders_count: orders.length,
      },
      predictive_maintenance_forecasts: forecasts,
      diagnostics_feed_logs: liveLogs.map(log => ({
        timestamp: log.time,
        severity: log.type,
        message: log.text
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `transitops_system_snapshot_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-4 font-mono flex flex-col h-[320px] shadow-md">
      {/* Header bar with view toggles */}
      <div className="flex justify-between items-center border-b border-[#2A2D35] pb-2.5 mb-3 bg-[#12141A]/50 -mx-4 px-4 -mt-4 pt-4 rounded-t-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.3)]" />
            <h3 className="text-white text-xs uppercase tracking-wider font-bold hidden sm:inline">Diagnostic & Maintenance Hub</h3>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex bg-[#1A1D26] p-0.5 rounded border border-[#2A2D35] text-[10px]">
            <button
              onClick={() => handleToggleView("logs")}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
                activeView === "logs"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[#8E9299] hover:text-white"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Live Terminal ({liveLogs.length})</span>
            </button>
            <button
              onClick={() => handleToggleView("predictive")}
              className={`px-2 py-1 rounded transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
                activeView === "predictive"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-[#8E9299] hover:text-white"
              }`}
            >
              <TrendingUp className="w-3 h-3 text-purple-300" />
              <span>Predictive</span>
            </button>
            <button
              onClick={() => handleToggleView("playback")}
              className={`px-2 py-1 rounded transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
                activeView === "playback"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-[#8E9299] hover:text-white"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-300" />
              <span>Telemetry Playback</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSnapshot}
            title="Download System Snapshot & Predictive Maintenance JSON"
            className="flex items-center gap-1.5 text-[10px] text-[#4ADE80] hover:text-white bg-[#1A1D26] hover:bg-[#252936] border border-[#4ADE80]/20 hover:border-[#4ADE80]/55 px-2 py-1 rounded transition-all cursor-pointer font-bold uppercase font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Snapshot</span>
          </button>
          <div className="flex items-center gap-1.5 text-[9px] text-[#8E9299]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping"></span>
            <span className="hidden sm:inline">LIVE STREAM</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: Terminal Feed */}
      {activeView === "logs" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto space-y-1.5 text-xs text-[#8E9299] scrollbar-thin scrollbar-thumb-gray-800"
          >
            {liveLogs.map((log) => {
              let badgeColor = "text-[#4ADE80]";
              let badgeText = "OK";
              
              if (log.type === "WARN") {
                badgeColor = "text-[#FACC15]";
                badgeText = "WARN";
              } else if (log.type === "CRIT") {
                badgeColor = "text-[#EF4444]";
                badgeText = "CRIT";
              } else if (log.type === "INFO") {
                badgeColor = "text-[#2563EB]";
                badgeText = "INFO";
              }

              return (
                <div key={log.id} className="flex gap-3 hover:bg-[#1A1D26]/60 p-0.5 rounded transition-all">
                  <span className="text-[#8E9299]/50 select-none">{log.time}</span>
                  <span className={`${badgeColor} font-bold`}>[{badgeText}]</span>
                  <span className="text-[#E0E2E6] flex-1">{log.text}</span>
                </div>
              );
            })}
          </div>

          {/* Voice-to-Text Field Note Input Bar */}
          <div className="mt-2 pt-2 border-t border-[#2A2D35] flex items-center gap-2 bg-[#141720] p-1.5 rounded shrink-0">
            <select
              value={selectedNoteVehicle}
              onChange={(e) => setSelectedNoteVehicle(e.target.value)}
              className="bg-[#0B0D13] text-amber-300 font-bold border border-[#2A2D35] text-[10px] px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              {(vehicles.length > 0 ? vehicles : [
                { id: "FLT-9821" }, { id: "FLT-4412" }, { id: "FLT-1008" }, { id: "FLT-3309" }
              ]).map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0F1117] text-white">
                  {v.id}
                </option>
              ))}
            </select>

            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                placeholder={isRecording ? "Listening to dispatcher voice notes..." : "Record voice note or type field log..."}
                value={voiceNoteText}
                onChange={(e) => setVoiceNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAppendVoiceNote();
                }}
                className={`w-full bg-[#0B0D13] border border-[#2A2D35] text-xs px-2.5 py-1 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                  isRecording ? "ring-1 ring-rose-500 border-rose-500 bg-rose-950/20" : ""
                }`}
              />
              {isRecording && (
                <span className="absolute right-2 flex items-center gap-1 text-[9px] text-rose-400 font-bold animate-pulse">
                  <Volume2 className="w-3 h-3 text-rose-500" /> REC
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 rounded border transition-all cursor-pointer ${
                isRecording
                  ? "bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : "bg-[#1F2332] text-slate-300 border-[#2A2D35] hover:text-white hover:bg-slate-700"
              }`}
              title={isRecording ? "Stop Voice Recording" : "Record Voice Field Note (Microphone)"}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            <button
              type="button"
              onClick={handleAppendVoiceNote}
              disabled={!voiceNoteText.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white p-1.5 rounded font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
              title="Append Voice Note to Vehicle Logs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: Predictive Maintenance & Mileage Failure Projection */}
      {activeView === "predictive" && (
        <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden text-xs">
          {/* Left Table: Upcoming Component Failures */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#141720] border border-[#2A2D35] rounded-md p-2 overflow-y-auto scrollbar-thin">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-400" />
                <span>Forecasted Component Schedule</span>
              </span>
              <span className="text-purple-400 font-mono text-[9px]">{forecasts.length} Components</span>
            </div>

            <div className="space-y-1">
              {forecasts.map((f) => {
                const isSelected = f.id === selectedForecast.id;
                const riskBadge = 
                  f.riskLevel === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  f.riskLevel === "HIGH" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                  "bg-blue-500/20 text-blue-400 border-blue-500/30";

                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedComponentId(f.id)}
                    className={`w-full text-left p-2 rounded border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? "bg-purple-950/40 border-purple-500/50 text-white shadow-xs" 
                        : "bg-[#181B26] border-[#2A2D35] text-slate-300 hover:bg-[#1F2332]"
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-100">{f.vehicleName}</span>
                        <span className="text-[9px] text-purple-300 font-mono">({f.dailyAvgKm} km/day)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{f.component}</div>
                    </div>

                    <div className="text-right">
                      <div className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${riskBadge}`}>
                        {f.projectedFailureDate} ({f.daysRemaining}d)
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {f.currentKm.toLocaleString()} / {f.thresholdKm.toLocaleString()} km
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Mileage Trend Line Chart & Forecast Details */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#141720] border border-[#2A2D35] rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#2A2D35] pb-1.5">
              <div>
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-purple-400" />
                  <span>{selectedForecast.vehicleName} — {selectedForecast.component}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Projected Failure Date: <span className="text-amber-400 font-bold">{selectedForecast.projectedFailureDate}</span> ({selectedForecast.daysRemaining} days remaining)
                </div>
              </div>
              <div className="text-right font-mono text-[10px]">
                <div className="text-slate-400">Degradation:</div>
                <div className="font-bold text-red-400">{selectedForecast.failureProbability}% Capacity</div>
              </div>
            </div>

            {/* Mileage Trend Line Visual Canvas / SVG */}
            <div className="bg-[#0A0C10] p-2 rounded border border-[#2A2D35] flex-1 flex flex-col justify-between">
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>PROJECTED MILEAGE TREND LINE</span>
                <span className="text-purple-400 font-bold">Failure Threshold: {selectedForecast.thresholdKm.toLocaleString()} km</span>
              </div>

              {/* Interactive Trend SVG */}
              <div className="h-20 w-full relative my-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
                  {/* Threshold Line */}
                  <line x1="0" y1="15" x2="300" y2="15" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="230" y="11" fill="#EF4444" fontSize="8" fontFamily="monospace" fontWeight="bold">LIMIT THRESHOLD</text>

                  {/* Mileage Accumulation Trend Line */}
                  <path 
                    d="M 10 65 Q 120 50, 220 28 T 280 15" 
                    fill="none" 
                    stroke="#A855F7" 
                    strokeWidth="2.5" 
                  />
                  {/* Area fill */}
                  <path 
                    d="M 10 65 Q 120 50, 220 28 T 280 15 L 280 75 L 10 75 Z" 
                    fill="url(#trendGradient)" 
                    opacity="0.3" 
                  />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Current Position Marker */}
                  <circle cx="220" cy="28" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="170" y="42" fill="#3B82F6" fontSize="8" fontFamily="monospace" fontWeight="bold">CURRENT: {selectedForecast.currentKm.toLocaleString()} KM</text>

                  {/* Forecast Intersection Marker */}
                  <circle cx="280" cy="15" r="5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" className="animate-ping" />
                  <circle cx="280" cy="15" r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Footer info & trigger service button */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#1E2230]">
                <div className="text-slate-400">
                  Daily Utilization Rate: <span className="text-emerald-400 font-bold">+{selectedForecast.dailyAvgKm} km/day</span>
                </div>
                <button
                  onClick={() => {
                    if (onScheduleService) {
                      onScheduleService(selectedForecast.vehicleId, selectedForecast.component, selectedForecast.projectedFailureDate);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Book Maintenance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Telemetry Playback Control */}
      {activeView === "playback" && (
        <div className="flex-1 flex flex-col justify-between bg-[#141720] border border-[#2A2D35] rounded-md p-3 space-y-2.5 text-xs">
          {/* Controls Bar & Vehicle Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2D35] pb-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-400 uppercase font-bold">Vessel:</label>
              <select
                value={playbackVehicleId}
                onChange={(e) => setPlaybackVehicleId(e.target.value)}
                className="bg-[#0B0D13] border border-[#2A2D35] text-amber-300 font-bold text-xs px-2 py-1 rounded focus:outline-none"
              >
                {(vehicles.length > 0 ? vehicles : [
                  { id: "FLT-9821", license_plate: "IL-9821-X" },
                  { id: "FLT-4412", license_plate: "IL-4412-A" },
                  { id: "FLT-1008", license_plate: "IL-1008-B" },
                  { id: "FLT-3309", license_plate: "IL-3309-C" }
                ]).map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0F1117] text-white">
                    {v.id} ({v.license_plate || v.type || "Active Vehicle"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1 rounded font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlaying ? "bg-amber-600 text-white animate-pulse" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "PAUSE PLAYBACK" : "START PLAYBACK"}</span>
              </button>

              <button
                type="button"
                onClick={() => setPlaybackProgress(0)}
                className="p-1 bg-[#1F2332] hover:bg-slate-700 text-gray-300 rounded cursor-pointer"
                title="Reset to 00:00"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 bg-[#0B0D13] px-2 py-1 rounded border border-[#2A2D35] text-[10px]">
                <FastForward className="w-3 h-3 text-amber-400" />
                {[1, 2, 5, 10].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1 rounded font-extrabold ${playbackSpeed === spd ? "text-amber-400 underline" : "text-gray-500"}`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Scrubber Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Scrubbing Historical Timestamp: <span className="text-amber-300 font-bold">{Math.floor((playbackProgress / 100) * 12)}:{String(Math.floor(((playbackProgress % 8) / 8) * 60)).padStart(2, "0")} UTC</span>
              </span>
              <span className="text-gray-400 font-bold">{playbackProgress}% Streamed</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={playbackProgress}
              onChange={(e) => setPlaybackProgress(Number(e.target.value))}
              className="w-full accent-amber-500 bg-[#0B0D13] h-2 rounded cursor-pointer"
            />
          </div>

          {/* Simulated Historical Sensor Readings Readout Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
            <div className="bg-[#0B0D13] border border-[#2A2D35] p-2 rounded">
              <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1">
                <Gauge className="w-3 h-3 text-blue-400" /> Speed
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                {Math.round(62 + Math.sin(playbackProgress * 0.1) * 24)} km/h
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-[#2A2D35] p-2 rounded">
              <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Battery / Fuel
              </div>
              <div className="text-sm font-extrabold text-amber-300 mt-0.5">
                {Math.max(12, Math.round(98 - (playbackProgress * 0.7)))} %
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-[#2A2D35] p-2 rounded">
              <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1">
                <Wrench className="w-3 h-3 text-rose-400" /> Core Temp
              </div>
              <div className="text-sm font-extrabold text-rose-400 mt-0.5">
                {Math.round(82 + (playbackProgress % 15))} °C
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-[#2A2D35] p-2 rounded">
              <div className="text-[9px] text-gray-400 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> GPS Vector
              </div>
              <div className="text-[10px] font-mono text-emerald-300 mt-1 truncate">
                {(18.9 + playbackProgress * 0.005).toFixed(4)}N, {(72.8 + playbackProgress * 0.004).toFixed(4)}E
              </div>
            </div>
          </div>

          {/* Scrubbed Live Event Log Stream */}
          <div className="bg-[#0B0D13] p-2 rounded border border-[#2A2D35] text-[10px] text-gray-300 font-mono truncate">
            <span className="text-amber-400 font-bold">[PLAYBACK LOG @ T+{playbackProgress}s]:</span>{" "}
            {playbackProgress < 25 ? "Vessel departing origin depot terminal gate #3." :
             playbackProgress < 60 ? "Cruising highway corridor NH-48. Engine load nominal at 64%." :
             playbackProgress < 85 ? "Approaching urban toll plaza. Minor speed reduction detected." :
             "Arrival staging zone reached. Discharging telemetry packets."}
          </div>
        </div>
      )}
    </div>
  );
}
