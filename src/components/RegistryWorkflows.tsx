import React, { useState, useEffect } from "react";
import { Hammer, FileText, CheckCircle, AlertTriangle, XCircle, ChevronRight, User, Truck, ShieldAlert, X, DollarSign, Plus, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RegistryWorkflowsProps {
  onRefreshAll: () => void;
}

export default function RegistryWorkflows({ onRefreshAll }: RegistryWorkflowsProps) {
  const [subTab, setSubTab] = useState<"maintenance" | "documents" | "auto_schedule">("maintenance");
  
  // State for Automated Scheduling
  const [scheduledSuccess, setScheduledSuccess] = useState<string>("");
  const [autoSchedules, setAutoSchedules] = useState<any[]>([
    {
      vehicleId: "FLT-101",
      licensePlate: "MH-04-AB-9821",
      type: "Volvo FH16 Multi-Axle",
      currentOdometerKm: 142850,
      lastServiceOdometerKm: 128000,
      kmSinceLastService: 14850,
      engineDiagnostics: {
        oilPressureBar: 2.1, // normal 3.5
        engineTempC: 98,
        brakePadWearPct: 82, // High wear
        transmissionFaultCode: "P0700-02"
      },
      suggestedDate: "2026-08-02",
      urgency: "CRITICAL",
      reason: "Brake Pad Wear (82%) & Oil Pressure drop (2.1 bar) exceeding 12,000 km service interval"
    },
    {
      vehicleId: "FLT-102",
      licensePlate: "MH-12-CD-4509",
      type: "Tata Signa 5530.S",
      currentOdometerKm: 98400,
      lastServiceOdometerKm: 88500,
      kmSinceLastService: 9900,
      engineDiagnostics: {
        oilPressureBar: 3.2,
        engineTempC: 88,
        brakePadWearPct: 61,
        transmissionFaultCode: "NONE"
      },
      suggestedDate: "2026-08-10",
      urgency: "HIGH",
      reason: "Approaching 10,000 km periodic engine oil refresh threshold"
    },
    {
      vehicleId: "FLT-103",
      licensePlate: "KA-01-EF-3320",
      type: "Ashok Leyland 4825",
      currentOdometerKm: 189200,
      lastServiceOdometerKm: 175000,
      kmSinceLastService: 14200,
      engineDiagnostics: {
        oilPressureBar: 2.8,
        engineTempC: 104, // High temp
        brakePadWearPct: 74,
        transmissionFaultCode: "P0217-01"
      },
      suggestedDate: "2026-08-05",
      urgency: "HIGH",
      reason: "Engine Overheat Alert (104°C) & Transmission Code P0217-01 recorded"
    },
    {
      vehicleId: "FLT-104",
      licensePlate: "DL-01-GH-1102",
      type: "Mahindra Blazo X 35",
      currentOdometerKm: 62100,
      lastServiceOdometerKm: 58000,
      kmSinceLastService: 4100,
      engineDiagnostics: {
        oilPressureBar: 3.6,
        engineTempC: 84,
        brakePadWearPct: 35,
        transmissionFaultCode: "NONE"
      },
      suggestedDate: "2026-08-25",
      urgency: "ROUTINE",
      reason: "Routine preventive maintenance & alignment check"
    }
  ]);

  // State for Maintenance Workflows
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState("REPAIR");
  const [techNotes, setTechNotes] = useState("");
  const [partsUsed, setPartsUsed] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [newPartInput, setNewPartInput] = useState("");
  const [loading, setLoading] = useState(false);

  // State for Digital Documents
  const [documents, setDocuments] = useState<any[]>([]);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/maintenance/workflows");
      const data = await res.json();
      setWorkflows(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    fetchDocuments();
  }, []);

  const handleUpdateStage = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/maintenance/workflows/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          stage: selectedStage, 
          notes: techNotes,
          parts: partsUsed,
          cost: totalCost
        })
      });
      const data = await res.json();
      if (data.success) {
        setUpdatingId(null);
        setTechNotes("");
        setPartsUsed([]);
        setTotalCost(0);
        fetchWorkflows();
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    "INSPECTION",
    "ISSUE_DETECTED",
    "APPROVAL",
    "REPAIR",
    "QUALITY_CHECK",
    "READY"
  ];

  const getStageColor = (st: string) => {
    switch (st) {
      case "INSPECTION": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "ISSUE_DETECTED": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "APPROVAL": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "REPAIR": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "QUALITY_CHECK": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "READY": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  // Compute stats for the Pipeline Metrics panel
  const totalInRepair = workflows.length;
  const totalAccruedCost = workflows.reduce((acc, wf) => acc + (wf.total_cost || 0), 0);
  const stageDistribution = stages.reduce((acc, stage) => {
    acc[stage] = workflows.filter(wf => wf.current_stage === stage).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-navigation Toggles */}
      <div className="flex gap-2 border-b border-[#2A2D35] pb-px">
        <button
          onClick={() => setSubTab("maintenance")}
          className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            subTab === "maintenance"
              ? "border-emerald-400 text-white"
              : "border-transparent text-[#8E9299] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Hammer className="w-3.5 h-3.5" />
            <span>Workflow Board</span>
          </div>
        </button>

        <button
          onClick={() => setSubTab("auto_schedule")}
          className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            subTab === "auto_schedule"
              ? "border-emerald-400 text-white"
              : "border-transparent text-[#8E9299] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated Maintenance Scheduler</span>
          </div>
        </button>

        <button
          onClick={() => setSubTab("documents")}
          className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            subTab === "documents"
              ? "border-emerald-400 text-white"
              : "border-transparent text-[#8E9299] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Digital Registry</span>
          </div>
        </button>
      </div>

      {subTab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of active maintenance records */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg">
              <div className="border-b border-[#2A2D35] pb-3 mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Vessel Repair Pipeline</h3>
                <p className="text-xs text-[#8E9299]">Live tracking of fleet units in progress through the six-stage safety certification process.</p>
              </div>

              {workflows.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono py-8 text-center">No active vehicles currently in the maintenance workflow.</p>
              ) : (
                <div className="space-y-4">
                  {workflows.map((wf) => {
                    const parsedParts = wf.parts_used ? JSON.parse(wf.parts_used) : [];
                    return (
                      <div key={wf.id} className="bg-[#161922] border border-[#2A2D35] rounded-lg p-4 font-mono text-xs hover:border-[#3B82F6]/50 transition-colors">
                        <div className="flex justify-between items-start gap-4 flex-wrap border-b border-[#2A2D35]/50 pb-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm">{wf.vehicle_id}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                              <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getStageColor(wf.current_stage)}`}>
                                {wf.current_stage}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">Logged timestamp: {new Date(wf.updated_at).toLocaleString()}</div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setUpdatingId(wf.id);
                              setSelectedStage(wf.current_stage);
                              setTechNotes(wf.technician_notes || "");
                              setPartsUsed(parsedParts);
                              setTotalCost(wf.total_cost || 0);
                              setNewPartInput("");
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Update Progress
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Problem Diagnosis</span>
                            <p className="text-[#E0E2E6] mt-0.5 font-sans leading-relaxed">{wf.issue_description}</p>
                          </div>

                          {wf.technician_notes && (
                            <div>
                              <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Technician Notes</span>
                              <p className="text-gray-300 italic mt-0.5 font-sans">"{wf.technician_notes}"</p>
                            </div>
                          )}

                          {parsedParts.length > 0 && (
                            <div>
                              <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Assigned Components & Consumables</span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {parsedParts.map((part: string, idx: number) => (
                                  <span key={idx} className="bg-[#1E293B] text-[#93C5FD] border border-[#3B82F6]/25 px-2 py-0.5 rounded text-[10px]">
                                    {part}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] border-t border-[#2A2D35]/50 pt-2.5 text-gray-500">
                            <span>REPAIR ESTIMATION COST</span>
                            <span className="text-white font-bold text-xs">${wf.total_cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Repurposed Pipeline Stats Sidebar Column */}
          <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between h-fit space-y-6">
            <div>
              <div className="border-b border-[#2A2D35] pb-3 mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Pipeline Metrics</h3>
                <p className="text-xs text-[#8E9299]">Operational health and cost aggregation overview across active repair queues.</p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                {/* Metric 1 */}
                <div className="bg-[#161922] border border-[#2A2D35] p-3.5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Active Repair Units</span>
                    <span className="text-xl font-bold text-white mt-1 block">{totalInRepair}</span>
                  </div>
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">
                    <Hammer className="w-5 h-5" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-[#161922] border border-[#2A2D35] p-3.5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Accrued Repair Cost</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">${totalAccruedCost.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Stage Distribution Breakdown */}
                <div className="bg-[#161922] border border-[#2A2D35] p-4 rounded-lg space-y-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block border-b border-[#2A2D35] pb-2">
                    Queue Distribution
                  </span>
                  
                  <div className="space-y-2 text-[11px]">
                    {stages.map((st) => {
                      const count = stageDistribution[st] || 0;
                      const pct = totalInRepair > 0 ? (count / totalInRepair) * 100 : 0;
                      return (
                        <div key={st} className="space-y-1">
                          <div className="flex justify-between items-center text-gray-400 text-[10px]">
                            <span>{st.replace("_", " ")}</span>
                            <span className="text-white font-bold">{count}</span>
                          </div>
                          <div className="w-full bg-[#0F1117] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                st === "READY" ? "bg-emerald-500" :
                                st === "QUALITY_CHECK" ? "bg-purple-500" :
                                st === "REPAIR" ? "bg-orange-500" :
                                st === "APPROVAL" ? "bg-yellow-500" :
                                st === "ISSUE_DETECTED" ? "bg-red-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 p-3.5 rounded-lg text-[10px] font-mono text-blue-300 flex gap-2.5">
              <Settings className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Clicking "Update Progress" on any active repair card opens the modal dialog, where you can modify repair attributes.</span>
            </div>
          </div>
        </div>
      )}

      {subTab === "auto_schedule" && (
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 font-mono text-xs space-y-6">
          <div className="border-b border-[#2A2D35] pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Automated Preventive Maintenance Scheduler
              </h3>
              <p className="text-xs text-[#8E9299] font-sans mt-0.5">
                AI diagnostic engine evaluating individual vehicle odometer mileage, oil pressure degradation, brake pad wear, and ECU fault logs.
              </p>
            </div>
            {scheduledSuccess && (
              <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded animate-pulse">
                {scheduledSuccess}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {autoSchedules.map((item) => {
              const badgeClass = 
                item.urgency === "CRITICAL" ? "bg-red-950/80 border-red-500 text-red-400" :
                item.urgency === "HIGH" ? "bg-amber-950/80 border-amber-500 text-amber-300" :
                "bg-blue-950/80 border-blue-500 text-blue-300";

              return (
                <div key={item.vehicleId} className="bg-[#141720] border border-[#2A2D35] rounded-lg p-4 space-y-3.5 hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start border-b border-[#2A2D35] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{item.vehicleId}</span>
                        <span className="text-gray-400 text-[11px]">({item.licensePlate})</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{item.type}</div>
                    </div>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${badgeClass}`}>
                      {item.urgency} URGENCY
                    </span>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0F1117] p-2.5 rounded border border-[#2A2D35] text-[10px]">
                    <div>
                      <span className="text-gray-500 block">Odometer</span>
                      <span className="text-white font-bold">{item.currentOdometerKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Since Service</span>
                      <span className="text-amber-400 font-bold">{item.kmSinceLastService.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Brake Wear</span>
                      <span className={`font-bold ${item.engineDiagnostics.brakePadWearPct > 75 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.engineDiagnostics.brakePadWearPct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Oil Pressure</span>
                      <span className={`font-bold ${item.engineDiagnostics.oilPressureBar < 2.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.engineDiagnostics.oilPressureBar} bar
                      </span>
                    </div>
                  </div>

                  {/* Diagnostic Trigger Reason */}
                  <div className="bg-amber-950/20 border border-amber-500/20 p-2.5 rounded text-[10.5px] text-amber-200/90 leading-relaxed font-sans">
                    <strong>Diagnostic Trigger:</strong> {item.reason}
                  </div>

                  {/* Suggested Date & Schedule Trigger */}
                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <span className="text-gray-500 text-[10px] uppercase block">Suggested Maintenance Date</span>
                      <span className="text-emerald-400 font-bold text-xs">{item.suggestedDate}</span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch("/api/maintenance/workflows/stage", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: Math.floor(Math.random() * 1000) + 10,
                              stage: "INSPECTION",
                              notes: `Automated Schedule Confirmed: ${item.reason}`,
                              parts: ["Scheduled Filters", "Diagnostic Kit"],
                              cost: 250
                            })
                          });
                          setScheduledSuccess(`✓ Maintenance queued for ${item.vehicleId} on ${item.suggestedDate}`);
                          fetchWorkflows();
                          onRefreshAll();
                        } catch (e) {
                          setScheduledSuccess(`Scheduled ${item.vehicleId} for ${item.suggestedDate}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-md"
                    >
                      Approve & Schedule Date
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === "documents" && (
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Digital Documents Registry</h3>
            <p className="text-xs text-[#8E9299]">Compliance checklist monitor for insurance certificates, registrations, and driver licenses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver licenses */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#8E9299] uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-[#2A2D35] pb-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Operator Credentials Ledger</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                {documents.filter(d => d.entity_type === "DRIVER").map((doc) => (
                  <div key={doc.id} className="bg-[#161922] border border-[#2A2D35] p-3 rounded flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold">{doc.entity_id}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Cert number: {doc.doc_number}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-gray-400">Expires: {doc.expiration_date}</div>
                      <div className="mt-1.5 flex justify-end">
                        {doc.status === "VALID" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" />
                            <span>VALID</span>
                          </span>
                        )}
                        {doc.status === "WARNING" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            <span>WARNING (EXPIRY NEAR)</span>
                          </span>
                        )}
                        {doc.status === "EXPIRED" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                            <XCircle className="w-3 h-3" />
                            <span>EXPIRED</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle registrations & Pollution certs */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#8E9299] uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-[#2A2D35] pb-1.5">
                <Truck className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>Vessel Registrations & Permits</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                {documents.filter(d => d.entity_type === "VEHICLE").map((doc) => (
                  <div key={doc.id} className="bg-[#161922] border border-[#2A2D35] p-3 rounded flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold">{doc.entity_id} ({doc.doc_type})</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Cert number: {doc.doc_number}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-gray-400">Expires: {doc.expiration_date}</div>
                      <div className="mt-1.5 flex justify-end">
                        {doc.status === "VALID" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" />
                            <span>VALID</span>
                          </span>
                        )}
                        {doc.status === "WARNING" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            <span>WARNING</span>
                          </span>
                        )}
                        {doc.status === "EXPIRED" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                            <XCircle className="w-3 h-3" />
                            <span>EXPIRED</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Center-Aligned Update Progress Modal Dialog */}
      <AnimatePresence>
        {updatingId !== null && (() => {
          const activeWf = workflows.find(w => w.id === updatingId);
          if (!activeWf) return null;
          return (
            <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
              {/* Modal Backdrop overlay click to cancel */}
              <div 
                className="absolute inset-0 cursor-default" 
                onClick={() => setUpdatingId(null)}
              />

              {/* Modal Core Container Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-[#0F1117] border border-[#2A2D35] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl z-50 flex flex-col max-h-[90vh] font-mono text-xs"
              >
                {/* Modal Header */}
                <div className="bg-[#161922] border-b border-[#2A2D35] px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                      <Hammer className="w-4 h-4 animate-[spin_4s_linear_infinite]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                        Update Repair Progress
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Active Vessel: <span className="text-blue-400 font-bold">{activeWf.vehicle_id}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUpdatingId(null)}
                    className="p-1.5 bg-[#0F1117] hover:bg-red-500/10 border border-[#2A2D35] hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Content Scroll Area */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-150px)] scrollbar-thin scrollbar-thumb-gray-800">
                  {/* Problem Diagnosis Reference */}
                  <div className="bg-[#161922] border border-[#2A2D35] p-3.5 rounded-lg space-y-1">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Diagnosed Issue</span>
                    <p className="text-gray-200 font-sans leading-relaxed text-[11px]">{activeWf.issue_description}</p>
                  </div>

                  {/* Dynamic Clickable Interactive Stepper */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#8E9299] uppercase tracking-wider font-bold block mb-1">
                      Pipeline Stage Transition
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {stages.map((st) => {
                        const isSelected = selectedStage === st;
                        let activeStyle = "";
                        switch (st) {
                          case "INSPECTION": activeStyle = "border-blue-500 text-blue-300 bg-blue-950/40 shadow-[0_0_8px_rgba(59,130,246,0.25)]"; break;
                          case "ISSUE_DETECTED": activeStyle = "border-red-500 text-red-300 bg-red-950/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]"; break;
                          case "APPROVAL": activeStyle = "border-yellow-500 text-yellow-300 bg-yellow-950/40 shadow-[0_0_8px_rgba(234,179,8,0.25)]"; break;
                          case "REPAIR": activeStyle = "border-orange-500 text-orange-300 bg-orange-950/40 shadow-[0_0_8px_rgba(249,115,22,0.25)]"; break;
                          case "QUALITY_CHECK": activeStyle = "border-purple-500 text-purple-300 bg-purple-950/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]"; break;
                          case "READY": activeStyle = "border-emerald-500 text-emerald-300 bg-emerald-950/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]"; break;
                        }

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSelectedStage(st)}
                            className={`px-1 py-2.5 rounded border text-center transition-all cursor-pointer font-mono text-[9px] font-bold uppercase tracking-wider flex flex-col justify-between items-center gap-1.5 h-[65px] ${
                              isSelected 
                                ? activeStyle 
                                : "border-[#2A2D35] text-gray-500 hover:text-gray-300 hover:border-gray-600 bg-[#161922]"
                            }`}
                          >
                            <span className="text-[11px]">
                              {st === "INSPECTION" && "🔍"}
                              {st === "ISSUE_DETECTED" && "⚠️"}
                              {st === "APPROVAL" && "✍️"}
                              {st === "REPAIR" && "🔧"}
                              {st === "QUALITY_CHECK" && "🧪"}
                              {st === "READY" && "✅"}
                            </span>
                            <span className="truncate w-full text-center text-[8px]">{st.replace("_", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedStage === "READY" && (
                      <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 rounded">
                        💡 NOTE: Selecting "READY" instantly signs off the vessel and sets its dispatch ledger status to "ACTIVE" on completion!
                      </div>
                    )}
                  </div>

                  {/* Work Completed Technician Notes Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E9299] uppercase tracking-wider font-bold block">
                      Work Completed & Diagnostic Notes
                    </label>
                    <textarea
                      value={techNotes}
                      onChange={(e) => setTechNotes(e.target.value)}
                      rows={4}
                      placeholder="Input completed diagnostic actions, calibration logs, or technician final remarks..."
                      className="w-full bg-[#161922] border border-[#2A2D35] text-white p-3 rounded font-sans text-xs focus:outline-none focus:border-emerald-500 placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  {/* Components and Consumables Tags Editor Section */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E9299] uppercase tracking-wider font-bold block">
                      Components & Consumables Used
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#161922] border border-[#2A2D35] rounded mb-2 min-h-[44px]">
                      {partsUsed.length === 0 ? (
                        <span className="text-[10px] text-gray-500 font-mono italic p-1">No parts or consumables assigned. Type and click add below.</span>
                      ) : (
                        partsUsed.map((part, index) => (
                          <span key={index} className="flex items-center gap-1.5 bg-[#1E293B] text-[#93C5FD] border border-[#3B82F6]/25 px-2.5 py-1 rounded text-[10px]">
                            <span>{part}</span>
                            <button
                              type="button"
                              onClick={() => setPartsUsed(partsUsed.filter((_, idx) => idx !== index))}
                              className="text-blue-400 hover:text-rose-400 cursor-pointer font-bold ml-1 text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPartInput}
                        onChange={(e) => setNewPartInput(e.target.value)}
                        placeholder="e.g. Synthetic Gear Fluid (4L)"
                        className="flex-1 bg-[#161922] border border-[#2A2D35] text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-emerald-500 placeholder-gray-600"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newPartInput.trim()) {
                            e.preventDefault();
                            if (!partsUsed.includes(newPartInput.trim())) {
                              setPartsUsed([...partsUsed, newPartInput.trim()]);
                            }
                            setNewPartInput("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPartInput.trim() && !partsUsed.includes(newPartInput.trim())) {
                            setPartsUsed([...partsUsed, newPartInput.trim()]);
                            setNewPartInput("");
                          }
                        }}
                        className="px-3.5 py-2 bg-blue-600/10 border border-blue-500/25 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Cost Calibration */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E9299] uppercase tracking-wider font-bold block">
                      Total Repair Calibration Cost ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-gray-500 text-xs font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={totalCost}
                        onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#161922] border border-[#2A2D35] text-white pl-8 pr-3 py-2.5 rounded text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="bg-[#161922] border-t border-[#2A2D35] px-6 py-4 flex gap-3 justify-end flex-shrink-0">
                  <button
                    onClick={() => setUpdatingId(null)}
                    className="px-4 py-2.5 bg-[#0F1117] border border-[#2A2D35] hover:bg-[#1C1F2B] text-gray-400 hover:text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStage(updatingId)}
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "SAVING..." : "COMMIT STAGE"}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
