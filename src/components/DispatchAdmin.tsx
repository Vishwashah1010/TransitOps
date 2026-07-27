import React, { useState, useEffect } from "react";
import { ShieldCheck, Database, Check, X, RefreshCw, Layers, ArrowRight } from "lucide-react";

interface DispatchAdminProps {
  vehicles: any[];
  drivers: any[];
  orders: any[];
  onRefreshAll: () => void;
}

export default function DispatchAdmin({ vehicles, drivers, orders, onRefreshAll }: DispatchAdminProps) {
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [loading, setLoading] = useState(false);

  // States for database operations feedbacks
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);

  // Driver simulation complete trip states
  const [completeOrderId, setCompleteOrderId] = useState("");
  const [completing, setCompleting] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Set default dropdown values on data load
  useEffect(() => {
    const pending = orders.filter(o => o.status === "PENDING");
    if (pending.length > 0 && !selectedOrder) setSelectedOrder(pending[0].id);

    const idle = drivers.filter(d => d.status === "IDLE");
    if (idle.length > 0 && !selectedDriver) setSelectedDriver(idle[0].id);

    const active = vehicles.filter(v => v.status === "ACTIVE");
    if (active.length > 0 && !selectedVehicle) setSelectedVehicle(active[0].id);

    const assigned = orders.filter(o => o.status === "ASSIGNED");
    if (assigned.length > 0 && !completeOrderId) setCompleteOrderId(assigned[0].id);
  }, [vehicles, drivers, orders]);

  // Dispatch order - ACID transaction post
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedDriver || !selectedVehicle) {
      setErrorMsg("Please complete the transaction routing parameters.");
      return;
    }

    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/orders/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder,
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          operator: "ADMIN"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Dispatch transaction committed to database successfully!");
        onRefreshAll();
        fetchAuditLogs();
        // Clear fields
        setSelectedOrder("");
      } else {
        setErrorMsg(data.error || "Transaction rolled back due to consistency limits.");
        fetchAuditLogs();
      }
    } catch (err: any) {
      setErrorMsg(`API transport layer failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Complete order - simulated driver workflow
  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeOrderId) return;

    setCompleting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/orders/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: completeOrderId,
          operator: "SIM_DRIVER"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        onRefreshAll();
        fetchAuditLogs();
        setCompleteOrderId("");
      } else {
        setErrorMsg(data.error || "Could not complete order state transition.");
      }
    } catch (err: any) {
      setErrorMsg(`Complete order service error: ${err.message}`);
    } finally {
      setCompleting(false);
    }
  };

  // Reseed Database
  const handleReseed = async () => {
    setSeeding(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        onRefreshAll();
        fetchAuditLogs();
      } else {
        setErrorMsg(data.error || "Seeding failed.");
      }
    } catch (err: any) {
      setErrorMsg(`Seeding error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const idleDrivers = drivers.filter((d) => d.status === "IDLE");
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE");
  const assignedOrders = orders.filter((o) => o.status === "ASSIGNED");

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header Context Indicator */}
      <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-[#8E9299] shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.2)]" />
          <div>
            <div className="text-[#8E9299]/70 text-[10px] font-bold uppercase">LOGGED CONTEXT</div>
            <div className="text-white font-bold leading-none mt-0.5">ADMIN // admin@transitops.io</div>
          </div>
        </div>

        <div className="border-l border-[#2A2D35] pl-4 flex items-center gap-3">
          <Database className="w-5 h-5 text-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.2)]" />
          <div>
            <div className="text-[#8E9299]/70 text-[10px] font-bold uppercase">DATABASE HEALTH</div>
            <div className="text-[#4ADE80] font-bold leading-none mt-0.5">SQLite RELATIONAL // ONLINE</div>
          </div>
        </div>

        <div className="border-l border-[#2A2D35] pl-4 flex items-center justify-between">
          <div>
            <div className="text-[#8E9299]/70 text-[10px] font-bold uppercase">JWT TRANSACTION SIGN</div>
            <div className="text-[#4ADE80] font-bold leading-none mt-0.5">VALID (SHA256 LOCK)</div>
          </div>
          <button 
            onClick={handleReseed}
            disabled={seeding}
            className="px-2.5 py-1 rounded bg-[#1A1D26] border border-[#2A2D35] text-[#8E9299] hover:text-white flex items-center gap-1.5 hover:bg-[#1A1D26]/80 font-mono text-[10px]"
            title="Reseed database"
          >
            <RefreshCw className={`w-3 h-3 ${seeding ? "animate-spin" : ""}`} />
            <span>RESEED</span>
          </button>
        </div>
      </div>

      {/* Interactive Logs Area */}
      {(successMsg || errorMsg) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {successMsg && (
            <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/30 p-4 rounded-md flex items-start gap-3 font-mono text-xs text-[#4ADE80]">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold uppercase tracking-wider">SUCCESS TRANSACTION COMMITTED</div>
                <p className="text-[#E0E2E6] mt-1">{successMsg}</p>
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/30 p-4 rounded-md flex items-start gap-3 font-mono text-xs text-[#EF4444]">
              <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold uppercase tracking-wider">TRANSACTION ROLLED BACK (ACID SAFE)</div>
                <p className="text-[#E0E2E6] mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Dispatch Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form A: Dispatcher Order matching */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between shadow-sm">
          <form onSubmit={handleDispatch} className="space-y-4">
            <div className="border-b border-[#2A2D35] pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider font-mono">1. Atomic Order Dispatch</h3>
              <span className="text-[10px] text-[#8E9299] font-mono">ACID ENGINE</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Order selector */}
              <div>
                <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">PENDING ORDER SELECT</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full bg-[#1A1D26] border border-[#2A2D35] text-white p-2.5 rounded font-mono focus:outline-none focus:border-[#4ADE80]"
                  required
                >
                  <option value="">-- CHOOSE PENDING ORDER --</option>
                  {pendingOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.cargo_description} ({o.weight}kg) to {o.destination_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver selector */}
              <div>
                <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">IDLE DRIVER SELECT</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full bg-[#1A1D26] border border-[#2A2D35] text-white p-2.5 rounded font-mono focus:outline-none focus:border-[#4ADE80]"
                  required
                >
                  <option value="">-- CHOOSE IDLE DRIVER --</option>
                  {idleDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.name} (License: {d.license_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle selector */}
              <div>
                <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">ACTIVE VEHICLE SELECT</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full bg-[#1A1D26] border border-[#2A2D35] text-white p-2.5 rounded font-mono focus:outline-none focus:border-[#4ADE80]"
                  required
                >
                  <option value="">-- CHOOSE ACTIVE VEHICLE --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} - {v.type} (Max Capacity: {v.max_capacity}kg)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || pendingOrders.length === 0}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold uppercase text-xs tracking-widest rounded transition-all mt-4 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>COMMIT DISPATCH LOCKS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Form B: Driver Simulation */}
        <div className="bg-[#0F1117] border border-[#2A2D35] p-5 rounded-lg flex flex-col justify-between shadow-sm">
          <div>
            <div className="border-b border-[#2A2D35] pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider font-mono">2. Driver Simulation Dock</h3>
              <span className="text-[10px] text-[#8E9299] font-mono">TRIP STATE MANAGER</span>
            </div>

            {assignedOrders.length > 0 ? (
              <form onSubmit={handleCompleteOrder} className="space-y-4">
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#8E9299] uppercase font-bold block mb-1">ACTIVE ASSIGNED ORDER</label>
                    <select
                      value={completeOrderId}
                      onChange={(e) => setCompleteOrderId(e.target.value)}
                      className="w-full bg-[#1A1D26] border border-[#2A2D35] text-white p-2.5 rounded font-mono focus:outline-none focus:border-[#4ADE80]"
                      required
                    >
                      <option value="">-- CHOOSE TRIP TO COMPLETE --</option>
                      {assignedOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id} - {o.cargo_description} (Driver: {o.driver_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-[#1A1D26] border border-[#2A2D35] p-3 rounded text-[11px] text-[#8E9299] leading-relaxed font-mono">
                  Completing a trip updates the driver state back to <span className="text-[#4ADE80] font-bold">IDLE</span> and order status to <span className="text-blue-400 font-bold">COMPLETED</span> in a transactional state transition block.
                </div>

                <button
                  type="submit"
                  disabled={completing || !completeOrderId}
                  className="w-full py-2.5 bg-[#4ADE80] hover:bg-[#34D399] text-black font-bold uppercase text-xs tracking-widest rounded transition-all mt-4 shadow-md cursor-pointer disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {completing ? "TRANSMITTING STATE..." : "COMPLETE DELIVERY ROUTE"}
                </button>
              </form>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center font-mono text-xs text-[#8E9299] border border-dashed border-[#2A2D35] rounded p-4 text-center">
                <span>No active trips in transit.</span>
                <span className="text-[10px] text-[#8E9299]/60 mt-1">Assign an order in step 1 to trigger simulation modes.</span>
              </div>
            )}
          </div>

          {/* Workflow Monitor Graphic */}
          <div className="mt-5 border-t border-[#2A2D35]/50 pt-4">
            <span className="text-[9px] text-[#8E9299] font-mono uppercase font-bold block mb-3">WORKFLOW STATE MONITOR</span>
            <div className="flex items-center justify-between font-mono text-[10px] text-[#8E9299]">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                <span>IDLE</span>
              </div>
              <ArrowRight className="w-3 h-3 text-[#2A2D35]" />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]"></span>
                <span className="text-[#4ADE80] font-bold">IN_TRANSIT</span>
              </div>
              <ArrowRight className="w-3 h-3 text-[#2A2D35]" />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>COMPLETED</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Relational Audit Trail logs table */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-[#12141A] border-b border-[#2A2D35] flex justify-between items-center font-mono text-xs">
          <span className="text-white font-bold uppercase tracking-wider">Relational DB Audit Trail</span>
          <span className="text-[#4ADE80]">ACID PERSISTENCE TRACE</span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2A2D35] text-[#8E9299] text-[10px] uppercase font-bold bg-[#12141A]/50">
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">OPERATOR</th>
                <th className="p-3">ACTION EVENT</th>
                <th className="p-3">INIT STATE</th>
                <th className="p-3">END STATE</th>
                <th className="p-3 text-right">LOCK STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D35]/50 text-[#8E9299]">
              {auditLogs.map((log) => {
                const isSuccess = log.success === 1;
                return (
                  <tr key={log.id} className="hover:bg-[#1A1D26]/30 transition-colors">
                    <td className="p-3 text-gray-500">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</td>
                    <td className="p-3 text-[#E0E2E6]">{log.operator}</td>
                    <td className="p-3 text-white font-medium">{log.action}</td>
                    <td className="p-3 text-gray-500">{log.initial_state || "NULL"}</td>
                    <td className="p-3 text-[#E0E2E6]">{log.end_state || "NULL"}</td>
                    <td className="p-3 text-right">
                      {isSuccess ? (
                        <span className="text-[#4ADE80] font-bold border border-[#4ADE80]/20 bg-[#4ADE80]/5 px-2 py-0.5 rounded text-[10px] shadow-[0_0_8px_rgba(74,222,128,0.1)]">
                          ✓ COMMIT
                        </span>
                      ) : (
                        <span 
                          className="text-[#EF4444] font-bold border border-[#EF4444]/20 bg-[#EF4444]/5 px-2 py-0.5 rounded text-[10px]"
                          title={log.error_message || "Rollback executed"}
                        >
                          ✕ ROLLBACK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
