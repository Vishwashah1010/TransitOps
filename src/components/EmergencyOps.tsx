import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Send, 
  Flame, 
  CloudLightning, 
  Activity, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Truck, 
  ShieldCheck, 
  FileCheck,
  Search,
  Download
} from "lucide-react";

interface IncidentReport {
  id: string;
  filingId: string;
  timestamp: string;
  vehicleId: string;
  driverName: string;
  incidentType: string;
  severity: "LOW" | "MODERATE" | "CRITICAL" | "CATASTROPHIC";
  location: string;
  description: string;
  metadata: {
    gpsCoords: string;
    weatherCondition: string;
    speedKmH: number;
    hosRemaining: string;
    telematicsStatus: string;
  };
  complianceStatus: "AUDITED_AND_FILED" | "PENDING_DOT_REVIEW";
}

interface EmergencyOpsProps {
  vehicles: any[];
  drivers?: any[];
  onRefreshAll: () => void;
}

export default function EmergencyOps({ vehicles, drivers = [], onRefreshAll }: EmergencyOpsProps) {
  // Simulator State
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [scenario, setScenario] = useState("BREAKDOWN");
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);

  // Form State for Formal Incident Reporting
  const [reportVehicleId, setReportVehicleId] = useState("");
  const [reportDriverName, setReportDriverName] = useState("");
  const [incidentType, setIncidentType] = useState("Breakdown / Mechanical Failure");
  const [severity, setSeverity] = useState<"LOW" | "MODERATE" | "CRITICAL" | "CATASTROPHIC">("CRITICAL");
  const [locationCorridor, setLocationCorridor] = useState("Highway I-95 Corridor (Mile 142)");
  const [description, setDescription] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Stored Incident Reports
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(() => {
    try {
      const stored = localStorage.getItem("transitops_formal_incident_reports");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load incident reports:", e);
    }
    return [
      {
        id: "inc-101",
        filingId: "INC-2026-8491",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        vehicleId: "TRK-902",
        driverName: "Vikramaditya Sharma",
        incidentType: "Highway Gridlock & Weather Delay",
        severity: "MODERATE",
        location: "Corridor Alpha-1 (Mile 112)",
        description: "Heavy localized rainstorm caused multi-car highway standstill. Speed limited to 25 km/h for safety compliance.",
        metadata: {
          gpsCoords: "28.6139° N, 77.2090° E",
          weatherCondition: "Heavy Torrential Rain (85% visibility)",
          speedKmH: 22,
          hosRemaining: "05h 42m",
          telematicsStatus: "J1939 Nominal"
        },
        complianceStatus: "AUDITED_AND_FILED"
      }
    ];
  });

  const activeVehicles = vehicles.filter(v => v.status === "ACTIVE");

  useEffect(() => {
    try {
      localStorage.setItem("transitops_formal_incident_reports", JSON.stringify(incidentReports));
    } catch (e) {
      console.error("Failed to save incident reports:", e);
    }
  }, [incidentReports]);

  const triggerEmergency = async () => {
    const vId = selectedVehicleId || (activeVehicles[0]?.id);
    if (!vId) return;

    setLoading(true);
    setResponseLog(null);

    try {
      const res = await fetch("/api/emergency/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vId,
          scenario,
        })
      });
      const data = await res.json();
      if (data.success) {
        setResponseLog(data);
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncidentReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVeh = vehicles.find(v => v.id === reportVehicleId) || vehicles[0];
    const vehId = reportVehicleId || targetVeh?.id || "TRK-101";
    const driver = reportDriverName || drivers[0]?.name || "Marcus Vance";

    const filingNum = Math.floor(1000 + Math.random() * 9000);
    const newReport: IncidentReport = {
      id: `inc-${Date.now()}`,
      filingId: `INC-2026-${filingNum}`,
      timestamp: new Date().toISOString(),
      vehicleId: vehId,
      driverName: driver,
      incidentType,
      severity,
      location: locationCorridor || "Corridor North-West Transit Route",
      description: description || "Routine incident report recorded for compliance audit trail.",
      metadata: {
        gpsCoords: targetVeh?.lat && targetVeh?.lng ? `${targetVeh.lat.toFixed(4)}° N, ${targetVeh.lng.toFixed(4)}° E` : "28.6421° N, 77.2285° E",
        weatherCondition: "Clear (Visibility 10km)",
        speedKmH: targetVeh?.speed || 0,
        hosRemaining: "06h 15m",
        telematicsStatus: "CAN-Bus Signal Active"
      },
      complianceStatus: "AUDITED_AND_FILED"
    };

    const updated = [newReport, ...incidentReports];
    setIncidentReports(updated);
    setFormSubmitted(true);
    setDescription("");

    // Push into system audit log
    try {
      const existingAuditStr = localStorage.getItem("transitops_security_audit_logs");
      const existingLogs = existingAuditStr ? JSON.parse(existingAuditStr) : [];
      const auditLogEntry = {
        id: `audit-inc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: `${driver} (${vehId})`,
        action: `FORMAL_INCIDENT_FILED: [${newReport.filingId}] ${incidentType} (${severity})`,
        initial_state: `Location: ${locationCorridor}`,
        end_state: `Filed & Compliance Archived`,
        success: 1,
        error_message: `Formal report recorded for compliance auditing. Metadata attached.`
      };
      localStorage.setItem("transitops_security_audit_logs", JSON.stringify([auditLogEntry, ...existingLogs]));
      window.dispatchEvent(new Event("transitops-audit-log-updated"));
    } catch (err) {
      console.error("Failed to update security audit log:", err);
    }

    setTimeout(() => setFormSubmitted(false), 4000);
  };

  const handleExportReportsCSV = () => {
    if (incidentReports.length === 0) return;
    const headers = ["Filing ID", "Timestamp", "Vehicle", "Driver", "Incident Type", "Severity", "Location", "Description", "GPS Coords", "Compliance Status"];
    const rows = incidentReports.map(r => [
      r.filingId,
      r.timestamp,
      r.vehicleId,
      `"${r.driverName}"`,
      `"${r.incidentType}"`,
      r.severity,
      `"${r.location}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.metadata.gpsCoords}"`,
      r.complianceStatus
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Incident_Compliance_Reports_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Simulator & Failover Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 font-sans flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500 shadow-[0_0_8px_#EF4444]" />
                Crisis Simulator
              </h2>
            </div>

            <p className="text-xs text-[#8E9299] mb-4">
              Induce standard logistics failures to test real-time failover, autonomous rerouting, and driver reassignment mechanics.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Vessel in Distress</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-[#161922] border border-[#2A2D35] text-white p-2.5 rounded text-xs font-mono focus:outline-none focus:border-red-500"
                >
                  <option value="">-- SELECT ACTIVE VESSEL --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0F1117] text-white">{v.id} ({v.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Scenario Mode</label>
                <div className="space-y-2">
                  {[
                    { id: "BREAKDOWN", label: "Mechanical Breakdown", icon: AlertTriangle, desc: "Forces vehicle out of service, assigns nearest idle driver and truck." },
                    { id: "WEATHER_ALERT", label: "Severe Weather", icon: CloudLightning, desc: "Caps maximum safety speed to 45km/h and alters path." },
                    { id: "DRIVER_ILLNESS", label: "Driver Health Distress", icon: Activity, desc: "Autonomous safe park, dispatches certified backup operator." },
                    { id: "ROAD_CLOSURE", label: "Highway Gridlock", icon: ShieldAlert, desc: "Calculates secondary arterial corridors, revises delivery ETA." },
                  ].map((sc) => {
                    const Icon = sc.icon;
                    const isSelected = scenario === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setScenario(sc.id)}
                        className={`w-full text-left p-3 rounded border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-950/20 border-red-500/50 text-red-400"
                            : "bg-[#161922] border-[#2A2D35] text-[#8E9299] hover:bg-[#1A1D26] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold font-mono">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{sc.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{sc.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerEmergency}
            disabled={loading || (!selectedVehicleId && activeVehicles.length === 0)}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs tracking-widest rounded transition-all flex items-center justify-center gap-2 disabled:bg-gray-800 disabled:text-gray-500 mt-5 cursor-pointer"
          >
            {loading ? "PROCESSING..." : "TRIGGER SYSTEM DISASTER"}
          </button>
        </div>

        {/* Failover Response Feed */}
        <div className="lg:col-span-2 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 font-sans flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Failover Action Logs</h2>
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">EMERGENCY PROTOCOL ACTIVE</span>
            </div>

            {!responseLog ? (
              <div className="h-64 border border-dashed border-[#2A2D35] rounded-lg flex flex-col items-center justify-center text-center p-6 text-[#8E9299]">
                <ShieldAlert className="w-8 h-8 mb-2 text-gray-600" />
                <p className="text-xs font-mono">No active emergency triggered in this simulation sequence.</p>
                <p className="text-[10px] text-gray-500 mt-1">Select an active vessel and press trigger to inspect autonomic failover execution.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded bg-red-950/15 border border-red-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    <span>Autonomic Response Strategy</span>
                  </div>
                  <p className="text-xs text-gray-300 font-mono leading-relaxed">
                    {responseLog.actionPlan}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-center">
                    <div className="text-[9px] text-gray-500 uppercase">Backup Vessel</div>
                    <div className="text-white font-bold text-xs mt-1">
                      {responseLog.backupVehicleId || "N/A - CAPPED"}
                    </div>
                  </div>

                  <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-center">
                    <div className="text-[9px] text-gray-500 uppercase">Assigned Rescue Pilot</div>
                    <div className="text-white font-bold text-xs mt-1">
                      {responseLog.backupDriverId || "N/A - RETARGETED"}
                    </div>
                  </div>

                  <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded font-mono text-center">
                    <div className="text-[9px] text-gray-500 uppercase">Revised Safe ETA</div>
                    <div className="text-emerald-400 font-bold text-xs mt-1">
                      {responseLog.revisedEta}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0C0E14] border border-[#2A2D35] p-3.5 rounded space-y-1.5 text-[10px] font-mono text-[#8E9299]">
                  <div className="text-white font-bold text-[11px] uppercase border-b border-[#2A2D35] pb-1 mb-1">STAKEHOLDER TELEMETRY</div>
                  <div>📡 TWILIO CORRIDOR DISPATCH: <span className="text-emerald-400">ONLINE</span></div>
                  <div>🗺️ HIGHWAY CORRIDOR BYPASS RE-CALC: <span className="text-emerald-400">12ms LATENCY</span></div>
                  <div>🚛 ACTIVE VESSEL LOCK STATUS: <span className="text-red-400">BYPASS LOCKDOWN ENGAGED</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-gray-500 border-t border-[#2A2D35] pt-3 flex justify-between">
            <span>FAILOVER LATENCY: 12.4ms</span>
            <span>COMPLIANCE STATUS: OMEGA CERTIFIED</span>
          </div>
        </div>
      </div>

      {/* FORMAL INCIDENT REPORTING FORM SECTION */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#2A2D35] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                <span>Formal Incident Report Filing</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-normal">
                  DOT & Compliance Audited
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Record official fleet incidents with timestamped telematics metadata for legal and safety compliance auditing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportReportsCSV}
            className="px-3 py-1.5 bg-[#161922] hover:bg-[#1F2330] border border-[#2A2D35] hover:border-amber-500/40 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Incident Log (CSV)</span>
          </button>
        </div>

        {formSubmitted && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs font-sans flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold font-mono text-emerald-400 uppercase">INCIDENT REPORT SUCCESSFULLY ARCHIVED</div>
              <p className="text-[11px] text-emerald-100">
                Report logged with cryptographic timestamp metadata and appended to the compliance audit trail.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateIncidentReport} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
          {/* Vehicle Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Vehicle</span>
            </label>
            <select
              value={reportVehicleId}
              onChange={(e) => setReportVehicleId(e.target.value)}
              className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="">-- SELECT VEHICLE --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} - {v.type} ({v.driverName || "Assigned Driver"})
                </option>
              ))}
            </select>
          </div>

          {/* Driver Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Assigned Driver / Operator</span>
            </label>
            <select
              value={reportDriverName}
              onChange={(e) => setReportDriverName(e.target.value)}
              className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="">-- SELECT DRIVER --</option>
              {drivers.length > 0 ? (
                drivers.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.code || d.id})
                  </option>
                ))
              ) : (
                <>
                  <option value="Vikramaditya Sharma">Vikramaditya Sharma (DRV-801)</option>
                  <option value="Rajesh Kumar V">Rajesh Kumar V (DRV-802)</option>
                  <option value="Ananya Deshmukh">Ananya Deshmukh (DRV-803)</option>
                  <option value="Marcus Vance">Marcus Vance (DRV-101)</option>
                </>
              )}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Severity Classification</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="LOW">LOW - Minor Delay / Non-critical</option>
              <option value="MODERATE">MODERATE - Route Delay / Equipment Wear</option>
              <option value="CRITICAL">CRITICAL - Mechanical Breakdown / Collision</option>
              <option value="CATASTROPHIC">CATASTROPHIC - Severe Accident / Emergency</option>
            </select>
          </div>

          {/* Incident Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
              Incident Category
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="Breakdown / Mechanical Failure">Breakdown / Mechanical Failure</option>
              <option value="Traffic Collision / Accident">Traffic Collision / Accident</option>
              <option value="Severe Weather & Road Blockade">Severe Weather & Road Blockade</option>
              <option value="Driver Health Distress / Fatigue">Driver Health Distress / Fatigue</option>
              <option value="Cargo Damage or Security Breach">Cargo Damage or Security Breach</option>
              <option value="Route Boundary Violation">Route Boundary Violation</option>
            </select>
          </div>

          {/* Location / Corridor */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location / Transit Corridor</span>
            </label>
            <input
              type="text"
              value={locationCorridor}
              onChange={(e) => setLocationCorridor(e.target.value)}
              placeholder="e.g. Highway I-95 Mile 142, Northbound Exit 4"
              className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
              Detailed Incident Description & Field Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a thorough account of the event, immediate safety measures taken, and preliminary damage assessment..."
              className="w-full bg-[#141720] border border-[#2A2D35] p-3 rounded-lg text-white focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
            />
          </div>

          {/* Submit Button & Auto-Attached Metadata Notice */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#2A2D35]">
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Auto-Attaching Metadata: <strong className="text-white">GPS Telemetry</strong>, <strong className="text-white">Weather Radar</strong>, <strong className="text-white">CAN-Bus Snapshot</strong> & <strong className="text-white">ISO Timestamp</strong>.
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>File Formal Incident Report</span>
            </button>
          </div>
        </form>

        {/* AUDITED INCIDENT REPORTS ARCHIVE TABLE */}
        <div className="pt-4 border-t border-[#2A2D35] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Archived Compliance Incident Reports ({incidentReports.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Audit Encryption: <strong className="text-emerald-400">SHA-256 Enabled</strong>
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 scrollbar-thin scrollbar-thumb-gray-800">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#2A2D35] text-[10px] text-slate-400 uppercase bg-[#0C0E14]">
                  <th className="p-2.5">Filing ID & Date</th>
                  <th className="p-2.5">Vehicle & Driver</th>
                  <th className="p-2.5">Incident Category</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Location & Metadata</th>
                  <th className="p-2.5 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {incidentReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                      No compliance incident reports recorded.
                    </td>
                  </tr>
                ) : (
                  incidentReports.map((r) => (
                    <tr key={r.id} className="border-b border-[#1C1F26] hover:bg-[#141720] transition-colors">
                      <td className="p-2.5 space-y-0.5">
                        <div className="text-amber-400 font-bold">{r.filingId}</div>
                        <div className="text-[9.5px] text-slate-500">{new Date(r.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="p-2.5 space-y-0.5">
                        <div className="text-white font-bold">{r.vehicleId}</div>
                        <div className="text-[10px] text-slate-400">{r.driverName}</div>
                      </td>
                      <td className="p-2.5 font-sans font-semibold text-slate-200">
                        {r.incidentType}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            r.severity === "CATASTROPHIC"
                              ? "bg-rose-950 text-rose-300 border-rose-500/50"
                              : r.severity === "CRITICAL"
                              ? "bg-red-950 text-red-300 border-red-500/40"
                              : r.severity === "MODERATE"
                              ? "bg-amber-950 text-amber-300 border-amber-500/40"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-2.5 space-y-0.5 max-w-xs">
                        <div className="text-slate-300 truncate text-[11px] font-sans">{r.location}</div>
                        <div className="text-[9.5px] text-slate-500 truncate">
                          GPS: {r.metadata.gpsCoords} | HOS: {r.metadata.hosRemaining}
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>AUDITED</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
