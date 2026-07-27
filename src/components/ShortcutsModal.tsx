import React from "react";
import { X, Keyboard, ArrowRight, Zap } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
}

export default function ShortcutsModal({ isOpen, onClose, onSelectTab }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: "Fleet Operations",
      shortcuts: [
        { keyCombo: "Alt + F", action: "Fleet Map & Dashboard", tabId: "fleet" },
        { keyCombo: "Alt + D", action: "Driver Registry & Medical", tabId: "driver_profiles" },
        { keyCombo: "Alt + A", action: "AI Control Room", tabId: "ai_control" },
        { keyCombo: "Alt + P", action: "Dispatch & Rules", tabId: "dispatch" },
      ]
    },
    {
      category: "Analytics & Intelligence",
      shortcuts: [
        { keyCombo: "Alt + E", action: "Executive Analytics", tabId: "executive" },
        { keyCombo: "Alt + H", action: "Health & Safety", tabId: "health_safety" },
        { keyCombo: "Alt + R", action: "Safety & Risk Overview", tabId: "safety_risk" },
        { keyCombo: "Alt + T", action: "Audit Telematics", tabId: "audit_trail" },
      ]
    },
    {
      category: "Admin & Utilities",
      shortcuts: [
        { keyCombo: "Alt + W", action: "Registry Workflows", tabId: "workflows" },
        { keyCombo: "Alt + X", action: "Emergency Response", tabId: "emergency" },
        { keyCombo: "Alt + I", action: "Data Integrity", tabId: "data_integrity" },
        { keyCombo: "Alt + M", action: "Toggle Command High-Density Mode" },
        { keyCombo: "Ctrl + K / ⌘K", action: "Open Keyboard Shortcuts Navigator" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#1E293B]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Power-User Keyboard Shortcut Navigator</span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                  Global Hotkeys
                </span>
              </h3>
              <p className="text-xs text-slate-400">Use instant key combinations to jump across TransitOps modules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-blue-400" />
                <span>{group.category}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.keyCombo}
                    onClick={() => {
                      if (sc.tabId) {
                        onSelectTab(sc.tabId);
                        onClose();
                      }
                    }}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                      sc.tabId 
                        ? "bg-[#1E293B]/60 border-slate-700/80 hover:bg-blue-900/30 hover:border-blue-500/50 cursor-pointer" 
                        : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white flex items-center gap-1.5">
                      <span>{sc.action}</span>
                      {sc.tabId && <ArrowRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </span>

                    <kbd className="font-mono text-[10px] font-bold px-2 py-1 bg-slate-950 text-blue-300 border border-slate-700 rounded shadow-inner">
                      {sc.keyCombo}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#1E293B]/30 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Press <kbd className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ESC</kbd> to close</span>
          <span className="text-blue-400">TransitOps Command Shortcut Engine</span>
        </div>
      </div>
    </div>
  );
}
