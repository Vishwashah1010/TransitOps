import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Search, RefreshCw, Download, Lock, Shield, Filter, AlertTriangle } from "lucide-react";

export default function AuditTrailWidget() {
  const [serverLogs, setServerLogs] = useState<any[]>([]);
  const [localLogs, setLocalLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SECURITY" | "DISPATCH">("ALL");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setServerLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch server audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalSecurityLogs = () => {
    try {
      const stored = localStorage.getItem("transitops_security_audit_logs");
      if (stored) {
        setLocalLogs(JSON.parse(stored));
      } else {
        setLocalLogs([]);
      }
    } catch (e) {
      console.error("Failed to read local audit logs:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    loadLocalSecurityLogs();

    const handleUpdate = () => {
      loadLocalSecurityLogs();
    };

    window.addEventListener("transitops-audit-log-updated", handleUpdate);
    return () => {
      window.removeEventListener("transitops-audit-log-updated", handleUpdate);
    };
  }, []);

  // Merge server and local security audit logs
  const allLogs = [...localLogs, ...serverLogs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const securityCount = allLogs.filter((log) => 
    log.action?.includes("UNAUTHORIZED") || log.action?.includes("RESTRICTED") || log.action?.includes("ACCESS_ELEVATION") || log.success === 0
  ).length;

  const filtered = allLogs.filter((log) => {
    const text = `${log.operator} ${log.action} ${log.initial_state || ""} ${log.end_state || ""} ${log.error_message || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "SECURITY") {
      return log.action?.includes("UNAUTHORIZED") || log.action?.includes("RESTRICTED") || log.action?.includes("ACCESS_ELEVATION") || log.success === 0;
    }
    if (filterType === "DISPATCH") {
      return !log.action?.includes("UNAUTHORIZED") && !log.action?.includes("RESTRICTED") && !log.action?.includes("ACCESS_ELEVATION");
    }

    return true;
  });

  const handleDownloadAuditTrail = () => {
    if (allLogs.length === 0) return;
    const auditData = allLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      operator: log.operator,
      action: log.action,
      initial_state: log.initial_state,
      end_state: log.end_state,
      success: log.success === 1 ? "SUCCESS" : "FAIL",
      error_message: log.error_message || ""
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `transitops_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    
    const headers = ["ID", "Timestamp", "Operator", "Action", "Initial State", "End State", "Success Status", "Error Message"];
    
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = filtered.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString(),
      log.operator,
      log.action,
      log.initial_state || "NULL",
      log.end_state || "NULL",
      log.success === 1 ? "SUCCESS" : "FAIL",
      log.error_message || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `transitops_audit_trail_view_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 font-sans space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#2A2D35] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider font-mono">System & Security Audit Trail</h2>
          </div>
          <p className="text-xs text-[#8E9299]">Cryptographic transaction logs & RBAC security breach audit records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Security Counter Badge */}
          <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-300">Security Audits:</span>
            <span className="text-rose-400 font-bold">{securityCount}</span>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161922] border border-[#2A2D35] text-white pl-9 pr-3 py-1.5 rounded text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleDownloadAuditTrail}
            disabled={allLogs.length === 0}
            title="Download Full Audit Trail (JSON)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-[#1A1D26] border border-[#2A2D35] hover:border-[#4ADE80]/30 rounded text-[#8E9299] hover:text-white transition-all disabled:opacity-50 cursor-pointer text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            title="Export Current View (CSV)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-[#1A1D26] border border-[#2A2D35] hover:border-blue-500/30 rounded text-[#8E9299] hover:text-white transition-all disabled:opacity-50 cursor-pointer text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 bg-[#161922] hover:bg-[#1A1D26] border border-[#2A2D35] rounded text-[#8E9299] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2A2D35] pb-3 text-xs font-mono">
        <span className="text-slate-500 flex items-center gap-1 text-[11px] uppercase font-bold mr-2">
          <Filter className="w-3 h-3" /> Log Category:
        </span>
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
            filterType === "ALL" ? "bg-blue-600 text-white font-bold" : "bg-[#161922] text-slate-400 hover:text-white"
          }`}
        >
          All Logs ({allLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("SECURITY")}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
            filterType === "SECURITY" ? "bg-rose-600 text-white font-bold" : "bg-[#161922] text-slate-400 hover:text-white"
          }`}
        >
          <Lock className="w-3 h-3 text-rose-300" />
          <span>Security & Unauthorized Access ({securityCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("DISPATCH")}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
            filterType === "DISPATCH" ? "bg-emerald-600 text-white font-bold" : "bg-[#161922] text-slate-400 hover:text-white"
          }`}
        >
          Dispatch Operations ({allLogs.length - securityCount})
        </button>
      </div>

      {/* Logs Data Table */}
      <div className="overflow-x-auto max-h-[420px] scrollbar-thin scrollbar-thumb-gray-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2A2D35] text-[10px] font-mono text-[#8E9299] uppercase tracking-wider bg-[#0C0E14]">
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Operator & Role</th>
              <th className="py-2.5 px-3">Action Description</th>
              <th className="py-2.5 px-3">Initial State</th>
              <th className="py-2.5 px-3">Result / Target</th>
              <th className="py-2.5 px-3 text-center">Security Clearance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-gray-500 font-mono">
                  No system or security audit logs matching query filter.
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const isUnauthorized = log.action?.includes("UNAUTHORIZED") || log.action?.includes("RESTRICTED") || log.success === 0;
                const isElevationReq = log.action?.includes("ACCESS_ELEVATION");

                return (
                  <tr
                    key={log.id}
                    className={`border-b border-[#1C1F26] text-xs font-mono transition-colors ${
                      isUnauthorized
                        ? "bg-rose-950/20 hover:bg-rose-900/30 border-l-2 border-l-rose-500"
                        : isElevationReq
                        ? "bg-amber-950/20 hover:bg-amber-900/30 border-l-2 border-l-amber-500"
                        : "hover:bg-[#12151D]"
                    }`}
                  >
                    <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold">
                      <span className={isUnauthorized ? "text-rose-400" : "text-[#4ADE80]"}>
                        {log.operator}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white max-w-[280px]" title={log.error_message || log.action}>
                      <div className="font-semibold text-xs leading-snug">{log.action}</div>
                      {log.error_message && (
                        <div className="text-[10px] text-rose-300/80 font-sans leading-tight mt-0.5 truncate">
                          {log.error_message}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-yellow-400 text-[11px]">{log.initial_state || "N/A"}</td>
                    <td className="py-3 px-3 text-blue-300 text-[11px]">{log.end_state || "N/A"}</td>
                    <td className="py-3 px-3">
                      <div className="flex justify-center">
                        {isUnauthorized ? (
                          <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            <span>ACCESS DENIED</span>
                          </span>
                        ) : isElevationReq ? (
                          <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>REQ PENDING</span>
                          </span>
                        ) : log.success === 1 ? (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            <span>AUTHORIZED</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <ShieldAlert className="w-3 h-3" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
