import React, { useState } from "react";
import { ShieldAlert, Lock, ArrowRight, UserCheck, ShieldCheck, Key, Radio, Wrench, BellRing, CheckCircle2, Send } from "lucide-react";
import { AppUser, UserRole } from "../types";
import { ROLE_DEFINITIONS } from "./FirebaseAuthBar";

interface AccessRestrictedViewProps {
  currentUser: AppUser | null;
  requiredRole?: string;
  tabTitle: string;
  onSwitchRole: (role: UserRole) => void;
  onRequestAccess?: (tabTitle: string) => void;
}

export default function AccessRestrictedView({
  currentUser,
  requiredRole = "EXECUTIVE",
  tabTitle,
  onSwitchRole,
  onRequestAccess
}: AccessRestrictedViewProps) {
  const currentRoleInfo = currentUser ? ROLE_DEFINITIONS[currentUser.role] : ROLE_DEFINITIONS.DISPATCHER;
  const [requested, setRequested] = useState(false);
  const [requestNotes, setRequestNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);

  const handleSendAccessRequest = () => {
    setRequested(true);

    // 1. Record security audit log entry in localStorage
    try {
      const newAuditLog = {
        id: `audit-req-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: `${currentUser?.displayName || "Operator"} (${currentUser?.role || "GUEST"})`,
        action: `ACCESS_ELEVATION_REQUESTED: User requested elevated access to [${tabTitle}] module`,
        initial_state: `Role: ${currentUser?.role || "GUEST"}`,
        end_state: `Request Pending: ${tabTitle}`,
        success: 1,
        error_message: `Elevated access request dispatched to System Administrator (admin@transitops.io). Notes: "${requestNotes || 'Standard operational request'}"`
      };

      const existingLogsStr = localStorage.getItem("transitops_security_audit_logs");
      const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      localStorage.setItem("transitops_security_audit_logs", JSON.stringify([newAuditLog, ...existingLogs]));

      // Dispatch window event so AuditTrailWidget can update in real-time
      window.dispatchEvent(new Event("transitops-audit-log-updated"));
    } catch (e) {
      console.error("Failed to store audit log:", e);
    }

    // 2. Callback if provided
    if (onRequestAccess) {
      onRequestAccess(tabTitle);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-[#0F1117] border border-[#2A2D35] rounded-2xl p-6 shadow-2xl space-y-5 text-white font-mono relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 border-b border-[#2A2D35] pb-4">
          <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase block">
              ROLE-BASED ACCESS CONTROL (RBAC) RESTRICTION
            </span>
            <h2 className="text-base font-extrabold text-white uppercase tracking-wide">
              {tabTitle} Clearance Restricted
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Your active Firebase profile (<strong className="text-amber-300">{currentUser?.displayName || "Current User"}</strong>) is authenticated with the <strong className="text-rose-300 uppercase">{currentRoleInfo.title}</strong> role. Access to <strong className="text-white">{tabTitle}</strong> requires elevated clearance privileges.
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Your Active Role</span>
            <div className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>{currentUser?.role || "GUEST"}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight mt-1">
              {currentRoleInfo.description}
            </p>
          </div>

          <div className="bg-[#141720] border border-amber-500/40 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">Required Clearance</span>
            <div className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{requiredRole}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight mt-1">
              Full director & executive clearance authorized for high-level controls.
            </p>
          </div>
        </div>

        {/* Access Request Status Alert */}
        {requested ? (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs font-sans space-y-1 animate-in fade-in">
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ACCESS REQUEST DISPATCHED TO ADMINISTRATOR</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-100/90">
              A high-priority request ticket for elevated access to <strong className="text-white">{tabTitle}</strong> has been logged in the audit trail and transmitted to <strong className="text-amber-300">admin@transitops.io</strong>.
            </p>
          </div>
        ) : showNotesInput ? (
          <div className="space-y-2 bg-[#141720] border border-[#2A2D35] p-3 rounded-xl">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
              Justification / Operational Note for Administrator:
            </label>
            <input
              type="text"
              placeholder="e.g. Urgent shift dispatch review required..."
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2A2D35] px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNotesInput(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAccessRequest}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Request</span>
              </button>
            </div>
          </div>
        ) : null}

        <div className="pt-2 border-t border-[#2A2D35] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-slate-400">
            Firebase Project: <strong className="text-emerald-400 font-mono">transitops-4fad1</strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!requested && (
              <button
                type="button"
                onClick={() => setShowNotesInput(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-400" />
                <span>Request Access</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSwitchRole("EXECUTIVE")}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Elevate Clearance to Executive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
