import React, { useState, useEffect } from "react";
import { Info, GripVertical, RefreshCw, UserCheck, Shield } from "lucide-react";
import { AppUser, UserRole } from "../types";

interface MetricCard {
  id: string;
  title: string;
  value: string;
  badge: string;
  badgeType: "positive" | "negative" | "neutral";
  methodology: string;
}

const ROLE_SPECIFIC_METRICS: Record<UserRole, { focusTitle: string; metrics: MetricCard[] }> = {
  EXECUTIVE: {
    focusTitle: "Executive Revenue & Compliance Focus",
    metrics: [
      {
        id: "exec_revenue",
        title: "Revenue Run Rate",
        value: "$2.42 M",
        badge: "+8.4%",
        badgeType: "positive",
        methodology: "Annualized gross revenue based on trailing 30-day completed freight and passenger transit dispatches."
      },
      {
        id: "exec_margin",
        title: "Operating Margin",
        value: "28.4%",
        badge: "+2.1%",
        badgeType: "positive",
        methodology: "Net operating profit divided by gross revenue after fuel, maintenance, and driver labor deductions."
      },
      {
        id: "exec_hos",
        title: "HOS Compliance",
        value: "99.8%",
        badge: "DOT Certified",
        badgeType: "positive",
        methodology: "FMCSA Hours of Service log verification across 100% of active ELD-connected drivers."
      },
      {
        id: "exec_utilization",
        title: "Fleet Utilization",
        value: "92.8%",
        badge: "124/130 Active",
        badgeType: "neutral",
        methodology: "Ratio of active revenue-generating vessels to total registered fleet capacity."
      },
      {
        id: "exec_carbon_tax",
        title: "Carbon Tax Credits",
        value: "$42.5K",
        badge: "Tier 1 Earned",
        badgeType: "positive",
        methodology: "Accumulated green freight credits calculated from EV route substitution and bio-diesel usage."
      },
      {
        id: "exec_safety",
        title: "Fleet Safety Index",
        value: "98.4 / 100",
        badge: "High Grade",
        badgeType: "positive",
        methodology: "Composite safety score evaluated over trailing 100,000 miles of telemetry monitoring."
      }
    ]
  },
  DISPATCHER: {
    focusTitle: "Dispatcher Live Fleet Status Focus",
    metrics: [
      {
        id: "disp_active_units",
        title: "Active Vessels",
        value: "124 / 130",
        badge: "95.3% Online",
        badgeType: "positive",
        methodology: "Real-time count of vessels currently transmitting active GPS and J1939 CAN-bus telemetry."
      },
      {
        id: "disp_avg_delay",
        title: "Avg Route Delay",
        value: "1.4 min",
        badge: "+0.2m",
        badgeType: "negative",
        methodology: "Average difference between scheduled geofence stop arrival and actual GPS ingress timestamp."
      },
      {
        id: "disp_idle_time",
        title: "Fleet Idle Time",
        value: "8.4%",
        badge: "-1.2%",
        badgeType: "positive",
        methodology: "Percentage of total active engine runtime spent stationary with ignition enabled."
      },
      {
        id: "disp_ontime_rate",
        title: "On-Time Dispatch",
        value: "98.2%",
        badge: "Target Met",
        badgeType: "positive",
        methodology: "Percentage of departures occurring within +/- 3 minutes of scheduled depot release."
      },
      {
        id: "disp_unassigned",
        title: "Unassigned Orders",
        value: "3 Pending",
        badge: "Requires Dispatch",
        badgeType: "negative",
        methodology: "Number of queued freight orders awaiting driver and vehicle route pairing."
      },
      {
        id: "disp_shift_clock",
        title: "Driver Shift Clock",
        value: "6.4 hrs avg",
        badge: "Safe Range",
        badgeType: "neutral",
        methodology: "Average remaining drive time available before mandatory 30-minute rest break."
      }
    ]
  },
  SAFETY_OFFICER: {
    focusTitle: "Safety & Compliance Audit Focus",
    metrics: [
      {
        id: "safe_score",
        title: "Safety Score",
        value: "98.4 / 100",
        badge: "Class A",
        badgeType: "positive",
        methodology: "Calculated from harsh braking events, cornering G-force, and speed boundary adherence."
      },
      {
        id: "safe_harsh_brake",
        title: "Harsh Braking",
        value: "0.2 / 100km",
        badge: "-18% YoY",
        badgeType: "positive",
        methodology: "Deceleration events exceeding 0.45g detected by telematics IMU sensors."
      },
      {
        id: "safe_speeding",
        title: "Speeding Alerts",
        value: "0 Active",
        badge: "100% Adherence",
        badgeType: "positive",
        methodology: "Real-time comparison of vehicle GPS velocity against posted speed limit databases."
      },
      {
        id: "safe_hos_warn",
        title: "HOS Overtime Risk",
        value: "1 Flagged",
        badge: "11h Limit Approaching",
        badgeType: "negative",
        methodology: "Drivers within 30 minutes of reaching FMCSA 11-hour maximum drive time window."
      },
      {
        id: "safe_inspection",
        title: "Inspection Pass Rate",
        value: "99.1%",
        badge: "DOT Approved",
        badgeType: "positive",
        methodology: "Percentage of pre-trip and post-trip DVIR electronic inspection forms passed without critical defects."
      },
      {
        id: "safe_fatigue",
        title: "Fatigue Alerts",
        value: "0 Critical",
        badge: "Clear",
        badgeType: "neutral",
        methodology: "AI driver camera monitoring alerts for eyeclosure duration and lane drift anomalies."
      }
    ]
  },
  MAINTENANCE_TECH: {
    focusTitle: "Maintenance & Diagnostics Focus",
    metrics: [
      {
        id: "maint_overdue_pm",
        title: "Overdue PM Service",
        value: "2 Units",
        badge: "Action Needed",
        badgeType: "negative",
        methodology: "Vessels exceeding scheduled oil change or inspection mileage interval by > 500 miles."
      },
      {
        id: "maint_fault_codes",
        title: "CAN-Bus Faults",
        value: "1 Active",
        badge: "Low Severity",
        badgeType: "negative",
        methodology: "J1939 Diagnostic Trouble Codes (DTC) broadcasted by engine control units in trailing 24h."
      },
      {
        id: "maint_health_index",
        title: "Fleet Health Index",
        value: "94.2%",
        badge: "Optimal",
        badgeType: "positive",
        methodology: "Composite health rating based on coolant temp, oil pressure, tire PSI, and brake pad wear."
      },
      {
        id: "maint_parts_stock",
        title: "Depot Parts Stock",
        value: "88% Full",
        badge: "Sufficient",
        badgeType: "neutral",
        methodology: "Inventory level of critical spares including filters, belts, brake shoes, and tires."
      },
      {
        id: "maint_turnaround",
        title: "Avg Repair Turnaround",
        value: "4.2 hrs",
        badge: "-0.8h",
        badgeType: "positive",
        methodology: "Average duration from repair order creation to vehicle release back into active service."
      },
      {
        id: "maint_fuel_efficiency",
        title: "Fuel Efficiency",
        value: "4.2 mi/gal",
        badge: "Optimal",
        badgeType: "neutral",
        methodology: "Calculated from CAN-bus fuel flow meter telemetry divided by GPS odometer distance delta."
      }
    ]
  },
  ADMIN: {
    focusTitle: "System Administration & Infrastructure Focus",
    metrics: [
      {
        id: "admin_users",
        title: "Active System Users",
        value: "42 Active",
        badge: "RBAC Enforced",
        badgeType: "positive",
        methodology: "Authenticated users actively holding open session sockets across dispatch and management portals."
      },
      {
        id: "admin_security_audits",
        title: "Security Audits",
        value: "128 Logs",
        badge: "2 Restricted Blocked",
        badgeType: "neutral",
        methodology: "Total security events logged in cryptographic audit trail including unauthorized access blocks."
      },
      {
        id: "admin_api_latency",
        title: "Core API Latency",
        value: "14ms",
        badge: "Sub-20ms",
        badgeType: "positive",
        methodology: "P99 latency across REST and WebSocket telematics ingest microservices."
      },
      {
        id: "admin_db_connections",
        title: "DB Connections",
        value: "12 / 50",
        badge: "Healthy",
        badgeType: "positive",
        methodology: "Active connection pool utilization on primary Cloud SQL/Firestore database clusters."
      },
      {
        id: "admin_uptime",
        title: "System Uptime",
        value: "99.99%",
        badge: "SLO Met",
        badgeType: "positive",
        methodology: "Continuous availability tracking across all platform web applications and container nodes."
      },
      {
        id: "admin_rbac_denials",
        title: "Access Denials",
        value: "0 Critical",
        badge: "Audited",
        badgeType: "neutral",
        methodology: "Role-based authorization failures captured and quarantined for security inspection."
      }
    ]
  },
  VIEWER: {
    focusTitle: "Operations Observer Overview",
    metrics: [
      {
        id: "view_ridership",
        title: "Total Ridership",
        value: "12,402",
        badge: "+4.2%",
        badgeType: "positive",
        methodology: "Derived from total passenger tap-ins and ticket validations across active routes."
      },
      {
        id: "view_fuel",
        title: "Fuel Efficiency",
        value: "4.2 mi/gal",
        badge: "Optimal",
        badgeType: "neutral",
        methodology: "Calculated from J1939 CAN-bus fuel flow meter telemetry divided by distance delta."
      },
      {
        id: "view_delay",
        title: "Avg Route Delay",
        value: "1.4 min",
        badge: "+0.2m",
        badgeType: "negative",
        methodology: "Derived from scheduled stop ETA vs real-time geofence arrival logs."
      },
      {
        id: "view_idle",
        title: "Idle Time",
        value: "8.4%",
        badge: "-1.2%",
        badgeType: "positive",
        methodology: "Percentage of total engine runtime where vehicle velocity is 0 km/h with ignition active."
      },
      {
        id: "view_safety",
        title: "Safety Score",
        value: "98.4 / 100",
        badge: "High Grade",
        badgeType: "positive",
        methodology: "Weighted safety index based on harsh braking, cornering G-force, and speed adherence."
      },
      {
        id: "view_utilization",
        title: "Fleet Utilization",
        value: "92.8%",
        badge: "124/130 Active",
        badgeType: "neutral",
        methodology: "Ratio of active in-service vehicles to total registered fleet capacity."
      }
    ]
  }
};

interface DashboardMetricsCardsProps {
  currentUser?: AppUser | null;
}

export default function DashboardMetricsCards({ currentUser }: DashboardMetricsCardsProps) {
  const activeRole: UserRole = currentUser?.role || "EXECUTIVE";
  const roleConfig = ROLE_SPECIFIC_METRICS[activeRole] || ROLE_SPECIFIC_METRICS.EXECUTIVE;

  const [metrics, setMetrics] = useState<MetricCard[]>(roleConfig.metrics);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // When role changes, update metrics to role focus
  useEffect(() => {
    setMetrics(roleConfig.metrics);
  }, [activeRole]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...metrics];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, movedItem);
    setDraggedIndex(index);
    setMetrics(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const resetOrder = () => {
    setMetrics(roleConfig.metrics);
  };

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-200 font-bold">{roleConfig.focusTitle}</span>
          <span className="text-[9.5px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
            Role: <strong className="text-amber-300 uppercase">{activeRole}</strong>
          </span>
        </span>
        <button
          type="button"
          onClick={resetOrder}
          className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset Role Metrics Layout"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Reset Order</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m, idx) => {
          const isDragging = draggedIndex === idx;

          return (
            <div
              key={m.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredCardId(m.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              className={`relative bg-[#0F1117] border p-3 rounded-lg flex flex-col justify-between transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                isDragging ? "opacity-40 border-blue-500 scale-95" : "border-[#2A2D35] hover:border-blue-500/60 shadow-2xs"
              }`}
            >
              {/* Drag handle & Methodology Tooltip Icon */}
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-300 truncate max-w-[110px]">
                  {m.title}
                </span>

                <div className="flex items-center gap-1">
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400 transition-colors cursor-help" />

                    <div className="absolute right-0 top-6 w-56 bg-[#0B0D13] border border-amber-500/50 p-2.5 rounded-lg shadow-2xl z-50 text-[10px] font-sans text-slate-200 hidden group-hover:block pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="font-mono font-bold text-amber-300 border-b border-slate-800 pb-1 mb-1 uppercase tracking-wide flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-400" />
                        Calculation Methodology
                      </div>
                      <p className="leading-snug text-slate-300 font-mono">{m.methodology}</p>
                    </div>
                  </div>

                  <GripVertical className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />
                </div>
              </div>

              {/* Value & Badge */}
              <div className="mt-2 flex items-baseline justify-between gap-1">
                <span className="text-base font-extrabold font-mono text-white tracking-tight">{m.value}</span>

                <span
                  className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    m.badgeType === "positive"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : m.badgeType === "negative"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {m.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
