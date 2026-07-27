import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import FleetMapTwin from "./components/FleetMapTwin";
import AIControlRoom from "./components/AIControlRoom";
import DispatchAndRules from "./components/DispatchAndRules";
import HealthAndSafety from "./components/HealthAndSafety";
import SafetyRiskOverview from "./components/SafetyRiskOverview";
import DriverProfiles from "./components/DriverProfiles";
import RegistryWorkflows from "./components/RegistryWorkflows";
import ExecutiveBoard from "./components/ExecutiveBoard";
import EmergencyOps from "./components/EmergencyOps";
import AuditTrailWidget from "./components/AuditTrailWidget";
import DataIntegrityDashboard from "./components/DataIntegrityDashboard";
import DispatcherAssistant from "./components/DispatcherAssistant";

import TelemetryGauges from "./components/TelemetryGauges";
import DiagnosticsFeed from "./components/DiagnosticsFeed";
import OperationalGuide from "./components/OperationalGuide";
import ShortcutsModal from "./components/ShortcutsModal";
import GlobalSearchPalette from "./components/GlobalSearchPalette";
import CriticalAlertManager from "./components/CriticalAlertManager";
import FirebaseAuthBar, { ROLE_DEFINITIONS } from "./components/FirebaseAuthBar";
import AccessRestrictedView from "./components/AccessRestrictedView";
import UrgentMaintenanceOverlay from "./components/UrgentMaintenanceOverlay";
import FleetPerformanceTrendChart from "./components/FleetPerformanceTrendChart";
import DashboardMetricsCards from "./components/DashboardMetricsCards";
import ApiHealthMonitor from "./components/ApiHealthMonitor";
import { loadUserSettings, saveUserSettings } from "./utils/userSettingsStore";
import { AppUser, UserRole } from "./types";
import { motion } from "motion/react";

import { RefreshCw, Download, Bot, ChevronDown, FileSpreadsheet, Keyboard, Sliders } from "lucide-react";
import { ToastProvider, useToasts } from "./components/ToastProvider";
import { 
  exportFleetVehiclesToCsv, 
  exportDriverProfilesToCsv, 
  exportOrdersToCsv, 
  exportSafetyAndRiskToCsv 
} from "./utils/csvExport";

// Robust fetch wrapper with exponential backoff and retries to handle transient server restart states
const fetchWithRetry = async (url: string, options?: RequestInit, retries = 5, delay = 1000): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

function AppContent() {
  const initialSettings = loadUserSettings();
  const [currentTab, setTabState] = useState(() => initialSettings.activeTab || "fleet");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleIdState] = useState(() => initialSettings.selectedVehicleId || "");
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState("V2.15-OK");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAssistantWidget, setShowAssistantWidgetState] = useState(() => !!initialSettings.panelPreferences?.showAssistantWidget);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const { triggerSystemError, addToast, removeToastByTitle } = useToasts();

  // Firebase RBAC Active User State
  const [currentUser, setCurrentUser] = useState<AppUser | null>({
    uid: "demo-executive-uid",
    email: "executive@transitops.io",
    displayName: "Sarah Jenkins (Director)",
    photoURL: null,
    role: "EXECUTIVE",
    department: "Executive Operations",
    lastLogin: new Date().toLocaleTimeString()
  });

  // Record unauthorized access attempts in security audit log
  useEffect(() => {
    if (!currentUser) return;
    const allowed = ROLE_DEFINITIONS[currentUser.role]?.allowedTabs || [];
    if (!allowed.includes(currentTab)) {
      try {
        const existingLogsStr = localStorage.getItem("transitops_security_audit_logs");
        const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
        
        // Prevent duplicate spam for same tab within 3 seconds
        const lastLog = existingLogs[0];
        const now = Date.now();
        if (lastLog && lastLog.action?.includes(currentTab) && now - new Date(lastLog.timestamp).getTime() < 3000) {
          return;
        }

        const newAuditLog = {
          id: `sec-deny-${now}`,
          timestamp: new Date().toISOString(),
          operator: `${currentUser.displayName || "Operator"} (${currentUser.role})`,
          action: `UNAUTHORIZED_ACCESS_ATTEMPT: Tab '${currentTab.toUpperCase().replace("_", " ")}' restricted under RBAC`,
          initial_state: `Role: ${currentUser.role}`,
          end_state: `DENIED: ${currentTab}`,
          success: 0,
          error_message: `Access denied under RBAC security policy for destination '${currentTab}'. User lacks required role clearance.`
        };

        localStorage.setItem("transitops_security_audit_logs", JSON.stringify([newAuditLog, ...existingLogs]));
        window.dispatchEvent(new Event("transitops-audit-log-updated"));
      } catch (e) {
        console.error("Failed to record security audit log:", e);
      }
    }
  }, [currentTab, currentUser]);

  const [isCommandMode, setIsCommandModeState] = useState(() => {

    return initialSettings.isCommandMode ?? (localStorage.getItem("high_density_command_mode") === "true");
  });

  const [uiDensityPreset, setUiDensityPresetState] = useState<"compact" | "comfortable" | "large">(() => {
    return initialSettings.uiDensityPreset || "comfortable";
  });

  const setTab = (tab: string) => {
    setTabState(tab);
    saveUserSettings({ activeTab: tab });
  };

  const setUiDensityPreset = (preset: "compact" | "comfortable" | "large") => {
    setUiDensityPresetState(preset);
    saveUserSettings({ uiDensityPreset: preset });
  };

  const setSelectedVehicleId = (id: string) => {
    setSelectedVehicleIdState(id);
    saveUserSettings({ selectedVehicleId: id });
  };

  const setIsCommandMode = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsCommandModeState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("high_density_command_mode", String(next));
      saveUserSettings({ isCommandMode: next });
      return next;
    });
  };

  const setShowAssistantWidget = (val: boolean | ((prev: boolean) => boolean)) => {
    setShowAssistantWidgetState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveUserSettings({
        panelPreferences: {
          ...loadUserSettings().panelPreferences,
          showAssistantWidget: next
        }
      });
      return next;
    });
  };

  // Global Keyboard Shortcuts Manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      // ⌘K or Ctrl+K to open Shortcuts Modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Alt key shortcuts for navigation
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "f") { e.preventDefault(); setTab("fleet"); }
        else if (key === "d") { e.preventDefault(); setTab("driver_profiles"); }
        else if (key === "a") { e.preventDefault(); setTab("ai_control"); }
        else if (key === "p") { e.preventDefault(); setTab("dispatch"); }
        else if (key === "e") { e.preventDefault(); setTab("executive"); }
        else if (key === "h") { e.preventDefault(); setTab("health_safety"); }
        else if (key === "r") { e.preventDefault(); setTab("safety_risk"); }
        else if (key === "t") { e.preventDefault(); setTab("audit_trail"); }
        else if (key === "w") { e.preventDefault(); setTab("workflows"); }
        else if (key === "x") { e.preventDefault(); setTab("emergency"); }
        else if (key === "i") { e.preventDefault(); setTab("data_integrity"); }
        else if (key === "m") { e.preventDefault(); setIsCommandMode((prev) => !prev); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadData = async () => {
    try {
      const fleetRes = await fetchWithRetry("/api/fleet");
      const fleetData = await fleetRes.json();
      const vList = Array.isArray(fleetData?.vehicles) ? fleetData.vehicles : [];
      const dList = Array.isArray(fleetData?.drivers) ? fleetData.drivers : [];
      
      setVehicles(vList);
      setDrivers(dList);

      if (vList.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vList[0].id);
      }

      const ordersRes = await fetchWithRetry("/api/orders");
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setSystemStatus("V2.15-OK");

      // Clear any pending DB connection drop toast when load succeeds
      if (removeToastByTitle) {
        removeToastByTitle("DATABASE_CONNECTION_DROP");
      }
    } catch (err: any) {
      console.error("Data load failed:", err);
      setSystemLogs((prev) => [...prev, `[CRIT] DB connection error: ${err.message}`]);
      setSystemStatus("DB-OFFLINE");
      triggerSystemError("database");
    }
  };

  useEffect(() => {
    loadData();
    
    // Periodically sync stats every 10 seconds silently
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Spatial re-routing POST
  const handleExecuteReroute = async (vehicleId: string, dest: string, constraint: "LOWEST_LATENCY" | "MIN_ENERGY") => {
    try {
      const res = await fetch("/api/vehicles/re-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          destination: dest,
          constraint,
          operator: "ADMIN_CONSOLE"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSystemLogs((prev) => [
          ...prev,
          `EXECUTE_RE_ROUTE: Unit ${vehicleId} routing updated to ${dest} via ${constraint}.`
        ]);
        loadData();
      }
      return data;
    } catch (err: any) {
      setSystemLogs((prev) => [...prev, `[CRIT] Re-route dispatcher failure: ${err.message}`]);
      return { success: false, error: err.message };
    }
  };

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const densityClass = uiDensityPreset === "compact" ? "text-[11px] spacing-tight" : uiDensityPreset === "large" ? "text-base spacing-spacious" : "text-sm";

  return (
    <div className={`flex h-screen overflow-hidden font-sans select-none transition-all duration-200 ${densityClass} ${
      isCommandMode 
        ? "theme-command bg-[#090d16] text-slate-100" 
        : "bg-slate-100 text-slate-800"
    }`}>
      
      {/* Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setTab} 
        systemStatus={systemStatus} 
        currentUser={currentUser}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
      />

      {/* Primary Dashboard Panel Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Upper High Density Command Header */}
        <header className="h-12 bg-slate-900 text-white border-b border-slate-800 px-4 flex items-center justify-between shrink-0 font-sans z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-xs text-white shadow-sm">TO</div>
              <span className="font-bold tracking-tight text-sm text-white">TransitOps <span className="text-blue-400 font-medium">v4.2</span></span>
            </div>
            
            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
            
            <div className="hidden md:flex items-center gap-5 text-xs font-medium">
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]"></div>
                System Online
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                Fleet: <span className="font-mono font-bold text-white">{vehicles.length || 124}/130</span> Active
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                Punctuality: <span className="font-mono font-bold text-emerald-400">94.2%</span>
              </div>
            </div>

            {/* Global Command Search Bar */}
            <GlobalSearchPalette
              vehicles={vehicles}
              drivers={drivers}
              orders={orders}
              onSelectVehicle={setSelectedVehicleId}
              onSetTab={setTab}
              onAddToast={addToast}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Firebase Auth & RBAC Bar */}
            <FirebaseAuthBar 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              onAddToast={addToast} 
            />

            {/* Critical Push Alert Manager */}
            <CriticalAlertManager
              vehicles={vehicles}
              onSelectVehicle={setSelectedVehicleId}
              onSetTab={setTab}
              onAddToast={addToast}
            />


            <button 
              onClick={() => setIsShortcutsOpen(true)}
              className="hidden lg:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-xs text-slate-300 border border-slate-700 font-mono transition-colors cursor-pointer"
              title="Click or press ⌘K for Keyboard Shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5 text-blue-400" />
              <span>Shortcuts</span> 
              <span className="text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded text-[10px]">⌘K</span>
            </button>

            {/* Global Export CSV Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono text-[10px] font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-blue-400/40"
                title="Export View or Fleet Data to CSV"
              >
                <Download className="w-3 h-3" />
                <span>EXPORT DATA</span>
                <ChevronDown className="w-2.5 h-2.5 text-blue-200" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 font-mono text-[11px] text-slate-200">
                  <div className="px-3 py-1.5 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-800 flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    <span>Select Export Dataset</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      exportFleetVehiclesToCsv(vehicles);
                      setShowExportMenu(false);
                      addToast({ type: "success", title: "CSV EXPORTED", message: "Fleet vehicles dataset downloaded as CSV." });
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span>Fleet Vehicles CSV</span>
                    <span className="text-[9px] text-slate-500">{vehicles.length} rows</span>
                  </button>

                  <button
                    onClick={() => {
                      exportDriverProfilesToCsv(drivers);
                      setShowExportMenu(false);
                      addToast({ type: "success", title: "CSV EXPORTED", message: "Driver profiles & performance downloaded as CSV." });
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span>Driver Profiles CSV</span>
                    <span className="text-[9px] text-slate-500">{drivers.length} rows</span>
                  </button>

                  <button
                    onClick={() => {
                      exportOrdersToCsv(orders);
                      setShowExportMenu(false);
                      addToast({ type: "success", title: "CSV EXPORTED", message: "Orders & dispatches downloaded as CSV." });
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span>Orders & Dispatches CSV</span>
                    <span className="text-[9px] text-slate-500">{orders.length} rows</span>
                  </button>

                  <button
                    onClick={() => {
                      exportSafetyAndRiskToCsv(vehicles, drivers);
                      setShowExportMenu(false);
                      addToast({ type: "success", title: "CSV EXPORTED", message: "Safety & risk matrix downloaded as CSV." });
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 border-t border-slate-800 cursor-pointer"
                  >
                    <span>Safety & Risk Overview CSV</span>
                    <span className="text-[9px] text-emerald-400">Risk Matrix</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Dispatcher Assistant Header Toggle Button */}
            <button
              onClick={() => setShowAssistantWidget(!showAssistantWidget)}
              className={`px-2.5 py-1 rounded border font-mono text-[10px] font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                showAssistantWidget
                  ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  : "bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-750 hover:text-white"
              }`}
              title="Open AI Dispatcher Assistant"
            >
              <Bot className="w-3 h-3 text-blue-400" />
              <span>AI ASSISTANT</span>
            </button>

            {/* UI Density Preset Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2 py-1 rounded font-mono text-[10px]">
              <Sliders className="w-3 h-3 text-blue-400 shrink-0" />
              <select
                value={uiDensityPreset}
                onChange={(e) => setUiDensityPreset(e.target.value as "compact" | "comfortable" | "large")}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer uppercase text-[10px]"
                title="Select UI Spacing & Font Density Mode"
              >
                <option value="compact" className="bg-slate-900 text-white">Density: Compact</option>
                <option value="comfortable" className="bg-slate-900 text-white">Density: Comfortable</option>
                <option value="large" className="bg-slate-900 text-white">Density: Large</option>
              </select>
            </div>

            {/* High-Density Mode Toggle */}
            <button
              onClick={() => setIsCommandMode(!isCommandMode)}
              className={`px-2.5 py-1 rounded border font-mono text-[10px] font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                isCommandMode
                  ? "bg-slate-950 border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
              title="Toggle High-Contrast Command Theme"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCommandMode ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}></span>
              <span>{isCommandMode ? "COMMAND MODE" : "HIGH DENSITY"}</span>
            </button>

            <button 
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer border border-transparent hover:border-slate-700"
              title="Sync Telematics Core"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-slate-200">
                SJ
              </div>
            </div>
          </div>
        </header>

        {/* Urgent Maintenance Notification Banner Overlay */}
        <UrgentMaintenanceOverlay
          vehicles={vehicles}
          onSelectVehicle={setSelectedVehicleId}
          onSetTab={setTab}
          onAddToast={addToast}
        />

        {/* Content Viewer container */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Reorderable Metric Cards with Methodology Tooltips */}
          <DashboardMetricsCards />

          {/* 7-Day Rolling Fleet Performance Trend Chart */}
          <FleetPerformanceTrendChart />

          {/* RBAC Tab Guard */}
          {currentUser && !ROLE_DEFINITIONS[currentUser.role]?.allowedTabs.includes(currentTab) ? (
            <AccessRestrictedView
              currentUser={currentUser}
              requiredRole="EXECUTIVE"
              tabTitle={currentTab.toUpperCase().replace("_", " ")}
              onSwitchRole={(role) => {
                setCurrentUser((prev) => prev ? { ...prev, role } : null);
                addToast({
                  type: "success",
                  title: `ELEVATED TO [${role}]`,
                  message: `Role updated to ${role}. Full access restored.`
                });
              }}
            />
          ) : (
            <>
              {currentTab === "fleet" && (
                <>
                  {/* Fleet Map, routing widget and reroute parameters form */}
                  <FleetMapTwin 
                    vehicles={vehicles}
                    drivers={drivers}
                    orders={orders}
                    selectedVehicleId={selectedVehicleId}
                    setSelectedVehicleId={setSelectedVehicleId}
                    onExecuteReroute={handleExecuteReroute}
                  />

                  {/* Live telemetry counters gauges for active unit */}
                  <TelemetryGauges vehicle={currentVehicle} />

                  {/* diagnostics system stream logs */}
                  <DiagnosticsFeed 
                    logs={systemLogs} 
                    systemStatus={systemStatus}
                    vehicles={vehicles}
                    drivers={drivers}
                    orders={orders}
                  />
                </>
              )}

              {currentTab === "ai_control" && (
                <AIControlRoom />
              )}

              {currentTab === "dispatch" && (
                <DispatchAndRules 
                  vehicles={vehicles}
                  drivers={drivers}
                  orders={orders}
                  onRefreshAll={loadData}
                  onAddToast={addToast}
                />
              )}

              {currentTab === "health_safety" && (
                <HealthAndSafety />
              )}

              {currentTab === "safety_risk" && (
                <SafetyRiskOverview />
              )}

              {currentTab === "driver_profiles" && (
                <DriverProfiles />
              )}

              {currentTab === "workflows" && (
                <RegistryWorkflows onRefreshAll={loadData} />
              )}

              {currentTab === "executive" && (
                <ExecutiveBoard />
              )}

              {currentTab === "emergency" && (
                <EmergencyOps 
                  vehicles={vehicles}
                  onRefreshAll={loadData}
                />
              )}

              {currentTab === "audit_trail" && (
                <AuditTrailWidget />
              )}

              {currentTab === "data_integrity" && (
                <DataIntegrityDashboard 
                  vehicles={vehicles}
                  drivers={drivers}
                  onRefreshAll={loadData}
                />
              )}
            </>
          )}

        </main>

      </div>

      {/* Interactive context-aware operational guide overlay */}
      <OperationalGuide currentTab={currentTab} setTab={setTab} />

      {/* Floating AI Dispatcher Assistant Drawer / Widget */}
      {showAssistantWidget ? (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <DispatcherAssistant
            isWidget={true}
            onClose={() => setShowAssistantWidget(false)}
          />
        </div>
      ) : (
        <motion.button
          onClick={() => setShowAssistantWidget(true)}
          className="fixed bottom-20 sm:bottom-6 right-6 sm:right-[225px] z-50 flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-blue-400 border border-blue-500/40 px-4 py-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:shadow-[0_0_25px_rgba(59,130,246,0.45)] transition-all cursor-pointer font-sans font-bold text-xs uppercase tracking-wider group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Open AI Dispatcher Assistant"
        >
          <Bot className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
          <span>AI Dispatcher</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 animate-pulse"></span>
        </motion.button>
      )}

      {/* Shortcuts Cheat Sheet Modal Overlay */}
      <ShortcutsModal 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
        onSelectTab={setTab} 
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
