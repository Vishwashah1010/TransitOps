import React, { useState, useEffect } from "react";
import { 
  Grid,
  Cpu,
  Database,
  Heart,
  Hammer,
  BarChart3,
  ShieldAlert,
  FileText,
  FileCheck2,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Sliders,
  Layers,
  Lock
} from "lucide-react";
import { loadUserSettings, saveUserSettings } from "../utils/userSettingsStore";
import { AppUser } from "../types";
import { ROLE_DEFINITIONS } from "./FirebaseAuthBar";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  systemStatus: string;
  currentUser?: AppUser | null;
  onOpenShortcutsModal?: () => void;
}

interface NavGroup {
  title: string;
  key: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    hotkey?: string;
  }>;
}

export default function Sidebar({ currentTab, setTab, systemStatus, currentUser, onOpenShortcutsModal }: SidebarProps) {
  const allowedTabs = currentUser
    ? ROLE_DEFINITIONS[currentUser.role]?.allowedTabs || []
    : ROLE_DEFINITIONS.EXECUTIVE.allowedTabs;

  const navGroups: NavGroup[] = [
    {
      title: "Fleet Operations",
      key: "Fleet Operations",
      items: [
        { id: "fleet", label: "Dashboard & Twin Map", icon: Grid, hotkey: "Alt+F" },
        { id: "driver_profiles", label: "Driver Registry & Medical", icon: UserCheck, hotkey: "Alt+D" },
        { id: "ai_control", label: "AI Control Room", icon: Cpu, hotkey: "Alt+A" },
        { id: "dispatch", label: "Dispatch & Rules", icon: Database, hotkey: "Alt+P" },
      ]
    },
    {
      title: "Analytics",
      key: "Analytics",
      items: [
        { id: "executive", label: "Executive Analytics", icon: BarChart3, hotkey: "Alt+E" },
        { id: "health_safety", label: "Health & Safety", icon: Heart, hotkey: "Alt+H" },
        { id: "safety_risk", label: "Safety & Risk Overview", icon: ShieldAlert, hotkey: "Alt+R" },
        { id: "audit_trail", label: "Audit Telematics", icon: FileText, hotkey: "Alt+T" },
      ]
    },
    {
      title: "Admin Utilities",
      key: "Admin Utilities",
      items: [
        { id: "workflows", label: "Registry Workflows", icon: Hammer, hotkey: "Alt+W" },
        { id: "emergency", label: "Emergency Response", icon: ShieldAlert, hotkey: "Alt+X" },
        { id: "data_integrity", label: "Data Integrity", icon: FileCheck2, hotkey: "Alt+I" },
      ]
    }
  ];

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const settings = loadUserSettings();
    return settings.sidebarCollapsedGroups || {
      "Fleet Operations": false,
      "Analytics": false,
      "Admin Utilities": false
    };
  });

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      saveUserSettings({ sidebarCollapsedGroups: next });
      return next;
    });
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between h-full font-sans text-slate-700 shrink-0 select-none">
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {/* Brand Logo in Sidebar */}
        <div className="px-2 pt-1 pb-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-xs text-white shadow-sm">
              TO
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-slate-900 block leading-none">TransitOps</span>
              <span className="text-[10px] font-semibold text-blue-600">High Density v4.2</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenShortcutsModal && (
              <button
                onClick={onOpenShortcutsModal}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-[10px] font-mono cursor-pointer"
                title="Keyboard Shortcuts Cheat Sheet (⌘K)"
              >
                ⌘K
              </button>
            )}
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]"></span>
          </div>
        </div>

        {/* Grouped Collapsible Navigation */}
        <div className="space-y-3">
          {navGroups.map((group) => {
            const isCollapsed = !!collapsedGroups[group.key];
            const hasActiveItem = group.items.some((i) => i.id === currentTab);

            return (
              <div key={group.key} className="space-y-1">
                {/* Group Header Button */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 rounded transition-colors group/header cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/header:text-slate-700 transition-transform" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/header:text-slate-700 transition-transform" />
                    )}
                    <span>{group.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasActiveItem && isCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}
                    <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                      {group.items.length}
                    </span>
                  </div>
                </button>

                {/* Group Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      const isAllowed = allowedTabs.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          id={`sidebar-tab-${item.id}`}
                          onClick={() => setTab(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer group/item ${
                            isActive 
                              ? "bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-xs" 
                              : isAllowed
                              ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                              : "text-slate-400 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : isAllowed ? "text-slate-400 group-hover/item:text-slate-600" : "text-slate-300"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isAllowed && (
                              <Lock className="w-3 h-3 text-rose-400" title={`Restricted for ${currentUser?.role || "Current Role"}`} />
                            )}
                            {item.hotkey && isAllowed && (
                              <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded border border-slate-200 shrink-0 ml-1">
                                {item.hotkey}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Shift Supervisor Widget */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-[11px] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Active Profile
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-600 px-1 rounded bg-emerald-50 border border-emerald-100">
              {currentUser?.role || "EXECUTIVE"}
            </span>
          </div>
          <div className="text-slate-700 font-semibold truncate">{currentUser?.displayName || "Sarah Jenkins"}</div>
          <div className="text-blue-600 mt-1 font-mono font-medium flex items-center gap-1 text-[10px]">
            <Clock className="w-3 h-3" /> {systemStatus}
          </div>
        </div>
      </div>
    </aside>
  );
}
