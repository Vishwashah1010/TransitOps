import React, { useState, useEffect } from "react";
import { 
  UserCheck, 
  Heart, 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Award, 
  Clock, 
  FileText, 
  Star, 
  X, 
  Activity, 
  RefreshCw, 
  PackageCheck, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  ShieldAlert,
  Send,
  User,
  Eye,
  Stethoscope,
  Filter,
  Bell,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Map,
  Zap,
  Download,
  MessageSquare,
  Camera,
  Printer,
  Tag,
  Flame,
  Snowflake,
  AlertCircle,
  Scale,
  FileCheck,
  CheckSquare,
  Square,
  Users,
  Layers
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from "recharts";
import { DetailedDriver } from "../types";
import { useToasts } from "./ToastProvider";
import DriverMiniMap from "./DriverMiniMap";
import DriverChat from "./DriverChat";
import DriverDocCamera from "./DriverDocCamera";

export const ALL_AVAILABLE_TAGS = [
  "HAZMAT Certified",
  "Cold Chain Specialist",
  "Heavy Heavy-Duty",
  "Overnight Long-Haul",
  "Interstate Route Permit",
  "Dangerous Goods Class 3",
  "Biomedical Cargo",
  "Cargo Drone Specialist"
];

export const getDriverTags = (driver: DetailedDriver): string[] => {
  if (driver.tags && driver.tags.length > 0) return driver.tags;
  
  switch (driver.id) {
    case "DRV-101":
      return ["HAZMAT Certified", "Heavy Heavy-Duty", "Cold Chain Specialist", "Interstate Route Permit"];
    case "DRV-102":
      return ["Cold Chain Specialist", "First Aid Certified", "Biomedical Cargo", "Express Delivery"];
    case "DRV-103":
      return ["Cargo Drone Specialist", "Avionics Safety Pods", "High-Tech Electronics", "Overnight Long-Haul"];
    case "DRV-104":
      return ["Heavy Heavy-Duty", "Overnight Long-Haul", "Dangerous Goods Class 3", "Maritime Corridor"];
    case "DRV-105":
      return ["Cold Chain Specialist", "Biomedical Cargo", "Fast-Response Depot", "Interstate Route Permit"];
    case "DRV-106":
      return ["General Freight", "Regional Transit", "First Aid Certified"];
    default:
      return ["Heavy Heavy-Duty", "Interstate Route Permit"];
  }
};

export interface RegulatoryViolation {
  code: string;
  ruleTitle: string;
  severity: "CRITICAL" | "WARNING" | "ADVISORY";
  description: string;
  correctiveAction: string;
}

export const getDriverRegulatoryViolations = (driver: DetailedDriver): RegulatoryViolation[] => {
  const violations: RegulatoryViolation[] = [];

  // Rule 1: Maximum allowable daily driving limit (FMCSA 49 CFR § 395.3 - 8.0/11.0 hour cap)
  const drivingHours = driver.driving_hours_today || 0;
  if (drivingHours >= 7.8) {
    violations.push({
      code: "REG-HOS-49CFR-395.3",
      ruleTitle: "Maximum Daily Driving Hours Reached",
      severity: "CRITICAL",
      description: `Driver logged ${drivingHours} hours driving today. Threshold cap is 8.0 hours before mandatory 11-hour off-duty rest period.`,
      correctiveAction: "Enforce immediate Stand-Down & lock dispatch assignment for 11 consecutive hours."
    });
  } else if (drivingHours >= 7.0) {
    violations.push({
      code: "REG-HOS-49CFR-395.3-WARN",
      ruleTitle: "Approaching Max Driving Hours Limit",
      severity: "WARNING",
      description: `Driver logged ${drivingHours} hours driving today. Approaching the 8.0 hour legal shift cap.`,
      correctiveAction: "Schedule mandatory mid-shift rest break and prepare relief driver."
    });
  }

  // Rule 2: Commercial Driver License Expiry (DOT CDL Validity)
  if (driver.license_status === "EXPIRED" || (driver.license_expiry && new Date(driver.license_expiry) < new Date())) {
    violations.push({
      code: "REG-CDL-49CFR-383.23",
      ruleTitle: "Commercial License Expired / Verification Needed",
      severity: "CRITICAL",
      description: `Commercial Driver License ${driver.license_number} expired on ${driver.license_expiry}. Operation on public roads is unlawful.`,
      correctiveAction: "Immediately suspend active vehicle assignment until CDL renewal document is captured."
    });
  }

  // Rule 3: Medical Fitness Certificate Expiration
  if (driver.profile?.medical_status === "ACTION_REQUIRED" || (driver.profile?.fitness_cert_expiry && new Date(driver.profile.fitness_cert_expiry) < new Date())) {
    violations.push({
      code: "REG-FMCSA-MED-391.45",
      ruleTitle: "Medical Examiner Certificate Overdue",
      severity: "CRITICAL",
      description: "Medical clearance fitness certificate has expired or requires mandatory re-examination.",
      correctiveAction: "Schedule mandatory medical examination with Chief Medical Officer before next dispatch."
    });
  }

  // Rule 4: High Telemetry Aggression / Sudden Braking Events
  if ((driver.sudden_braking_events || 0) >= 3 || (driver.speeding_events || 0) >= 2) {
    violations.push({
      code: "REG-SAFETY-DOT-392.2",
      ruleTitle: "High Telemetry Aggression Pattern Detected",
      severity: "WARNING",
      description: `Logged ${driver.sudden_braking_events || 0} sudden braking events and ${driver.speeding_events || 0} speeding infractions during current shift.`,
      correctiveAction: "Require defensive driving refresher module & supervisor debriefing."
    });
  }

  // Rule 5: Fatigue Index Risk Level
  if ((driver.fatigue_indicators || 0) >= 3) {
    violations.push({
      code: "REG-FATIGUE-AI-395.13",
      ruleTitle: "Elevated In-Cab Fatigue Risk Index",
      severity: "WARNING",
      description: `In-cab telemetry calculated fatigue risk indicator level ${driver.fatigue_indicators} / 5.`,
      correctiveAction: "Mandatory 45-minute rest pause required at nearest designated freight terminal."
    });
  }

  return violations;
};

export interface DriverSentiment {
  label: string;
  satisfactionPct: number;
  turnoverRisk: "LOW" | "MODERATE" | "HIGH";
  aiScanSummary: string;
}

export const getDriverSentiment = (driver: DetailedDriver): DriverSentiment => {
  const safety = driver.safety_score || 90;
  const fatigue = driver.fatigue_indicators || 0;
  const drivingHours = driver.driving_hours_today || 6.5;
  const ontime = driver.profile?.ontime_delivery_pct || 95;

  if (fatigue >= 3 || drivingHours >= 7.5 || safety < 80) {
    return {
      label: "Elevated Frustration",
      satisfactionPct: Math.min(62, Math.max(40, Math.round(50 + (safety % 12)))),
      turnoverRisk: "HIGH",
      aiScanSummary: "AI Scan: Expressed dispatch friction & fatigue in recent driver messaging history."
    };
  } else if (fatigue >= 1 || drivingHours >= 6.8 || ontime < 92) {
    return {
      label: "Neutral / Monitor",
      satisfactionPct: Math.round(75 + (safety % 10)),
      turnoverRisk: "MODERATE",
      aiScanSummary: "AI Scan: Stable interaction sentiment. Minor rest-pause requests logged in recent chats."
    };
  } else {
    return {
      label: "High Satisfaction",
      satisfactionPct: Math.min(99, Math.round(92 + (safety % 8))),
      turnoverRisk: "LOW",
      aiScanSummary: "AI Scan: High satisfaction & smooth route performance across recent dispatch logs."
    };
  }
};

export interface ShiftHeatmapDay {
  dateStr: string;
  dayNum: number;
  dayOfWeek: string;
  status: "COMPLIANT" | "WARNING" | "VIOLATION";
  drivingHours: number;
  restHours: number;
  checkInTime: string;
  checkInStatus: "ON_TIME" | "LATE" | "MISSED";
  notes: string;
}

export const generate30DayShiftComplianceHeatmap = (driver: DetailedDriver): ShiftHeatmapDay[] => {
  const days: ShiftHeatmapDay[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNum = d.getDate();
    const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });

    // Seed-based deterministic compliance status
    const seed = (i * 13 + driver.id.charCodeAt(driver.id.length - 1)) % 100;

    let status: "COMPLIANT" | "WARNING" | "VIOLATION" = "COMPLIANT";
    let drivingHours = +(6.2 + (seed % 18) / 10).toFixed(1);
    let restHours = +(11.5 + (seed % 4) / 2).toFixed(1);
    let checkInTime = `0${7 + (seed % 2)}:${10 + (seed % 45)}`;
    let checkInStatus: "ON_TIME" | "LATE" | "MISSED" = "ON_TIME";
    let notes = "Shift completed within full FMCSA 49 CFR § 395 regulatory compliance.";

    if (i === 4 || i === 18 || (driver.id === "DRV-101" && i === 2)) {
      status = "VIOLATION";
      drivingHours = 8.4;
      restHours = 8.2; // Insufficient rest (< 10 hours)
      checkInTime = "09:40 AM";
      checkInStatus = "LATE";
      notes = "Rest Period Violation: Only 8.2 hrs off-duty rest logged prior to shift start (Mandatory: 10 hrs).";
    } else if (i === 11 || i === 25) {
      status = "WARNING";
      drivingHours = 7.8;
      restHours = 10.2;
      checkInTime = "08:35 AM";
      checkInStatus = "LATE";
      notes = "Approaching maximum 8-hour continuous driving window threshold.";
    }

    days.push({
      dateStr,
      dayNum,
      dayOfWeek,
      status,
      drivingHours,
      restHours,
      checkInTime,
      checkInStatus,
      notes
    });
  }

  return days;
};

// Helper to generate 30-day historical productivity data for recharts with fleet-wide baseline average overlay
const generate30DayProductivity = (driver: DetailedDriver) => {
  const baseEfficiency = driver.profile?.ontime_delivery_pct || 95;
  const baseSafety = driver.safety_score || 92;
  const baseRating = (driver.profile?.supervisor_rating || 4.8) * 20;

  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Deterministic seed for driver variance
    const seed = (i * 7 + (driver.id.charCodeAt(driver.id.length - 1) || 1)) % 11 - 5;
    const safetySeed = (i * 3) % 9 - 4;

    const efficiency = Math.min(100, Math.max(72, Math.round(baseEfficiency + seed)));
    const safetyIndex = Math.min(100, Math.max(68, Math.round(baseSafety + safetySeed)));
    const ratingScore = Math.min(100, Math.max(75, Math.round(baseRating + (seed / 2))));
    const distanceKm = Math.round(210 + (i % 6) * 45 + seed * 8);

    // Fleet-wide baseline average
    const fleetEfficiency = Math.round(87.5 + ((i % 5) - 2));
    const fleetSafetyIndex = Math.round(86.0 + ((i % 4) - 1.5));
    const fleetDistanceKm = Math.round(235 + (i % 5) * 20);

    data.push({
      date: dateStr,
      efficiency,
      safetyIndex,
      ratingScore,
      distanceKm,
      fleetEfficiency,
      fleetSafetyIndex,
      fleetDistanceKm
    });
  }

  return data;
};

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState<DetailedDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [medicalFilter, setMedicalFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [selectedDriver, setSelectedDriver] = useState<DetailedDriver | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<"overview" | "medical" | "active_mission" | "dispatch_history" | "performance" | "chat" | "documents" | "heatmap">("overview");
  
  // Bulk Action Toolbar State
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");
  const [showBulkShiftModal, setShowBulkShiftModal] = useState<boolean>(false);
  const [bulkShiftDepot, setBulkShiftDepot] = useState<string>("Main Logistics Hub");

  // Batch Print Configuration Modal State
  const [showBatchPrintModal, setShowBatchPrintModal] = useState<boolean>(false);
  const [batchPrintSelectedDriverIds, setBatchPrintSelectedDriverIds] = useState<string[]>([]);
  const [includeComplianceMetrics, setIncludeComplianceMetrics] = useState<boolean>(true);
  const [includeShiftLogs, setIncludeShiftLogs] = useState<boolean>(true);

  // Selected Heatmap Day detail view
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<ShiftHeatmapDay | null>(null);

  // Real-time Urgent Alerts Drawer State
  const [showUrgentDrawer, setShowUrgentDrawer] = useState<boolean>(false);

  // Chart Metric Filter in Dossier
  const [activeMetric, setActiveMetric] = useState<"efficiency" | "safetyIndex" | "distanceKm">("efficiency");

  // Smart View Toggle State
  const [smartSortMode, setSmartSortMode] = useState<"DEFAULT" | "RISK_SCORE" | "SHIFT_HOURS_REMAINING" | "EFFICIENCY">("DEFAULT");
  const [showFatigueHeatmap, setShowFatigueHeatmap] = useState<boolean>(true);

  // Medical Note Edit Form
  const [isEditingMedical, setIsEditingMedical] = useState<boolean>(false);
  const [editMedicalStatus, setEditMedicalStatus] = useState<string>("FIT_FOR_DUTY");
  const [editMedicalNotes, setEditMedicalNotes] = useState<string>("");
  const [updatingMedical, setUpdatingMedical] = useState<boolean>(false);

  const { addToast } = useToasts();

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drivers/profiles");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDrivers(data);
      }
    } catch (err) {
      console.error("Failed to fetch driver profiles:", err);
      addToast({
        type: "error",
        title: "Connection Error",
        message: "Failed to load driver profiles from server."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleUpdateMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setUpdatingMedical(true);

    try {
      const res = await fetch("/api/drivers/medical-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver.id,
          medicalStatus: editMedicalStatus,
          medicalNotes: editMedicalNotes,
          lastCheckupDate: new Date().toISOString().split("T")[0]
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: "success",
          title: "Medical Record Updated",
          message: `Medical clearance for ${selectedDriver.name} has been updated.`
        });
        setIsEditingMedical(false);
        fetchDrivers();
        setSelectedDriver(prev => prev ? {
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            medical_status: editMedicalStatus as any,
            medical_notes: editMedicalNotes,
            last_medical_checkup: new Date().toISOString().split("T")[0]
          } : prev.profile
        } : null);
      } else {
        addToast({
          type: "error",
          title: "Update Failed",
          message: data.error || "Could not save medical record."
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Server Error",
        message: err.message || "Failed to update medical record."
      });
    } finally {
      setUpdatingMedical(false);
    }
  };

  // Urgent Drivers Requiring Immediate Attention
  const getDriverAlerts = (driver: DetailedDriver) => {
    const alerts: { type: "medical" | "license" | "fatigue" | "dispatch"; label: string }[] = [];
    if (driver.profile?.medical_status === "ACTION_REQUIRED") {
      alerts.push({ type: "medical", label: "Medical Clearance & Checkup Overdue" });
    } else if (driver.profile?.medical_status === "CONDITIONAL") {
      alerts.push({ type: "medical", label: "Conditional Medical Watch Required" });
    }

    if (driver.license_status === "EXPIRED" || (driver.license_expiry && new Date(driver.license_expiry) < new Date())) {
      alerts.push({ type: "license", label: "Driver License Expired / Verification Needed" });
    }

    if ((driver.fatigue_indicators || 0) > 0 || (driver.driving_hours_today || 0) >= 7.5) {
      alerts.push({ type: "fatigue", label: `Fatigue Risk: ${driver.driving_hours_today || 7.5} Driving Hours Today` });
    }

    if ((driver.current_order?.status as string) === "DELAYED") {
      alerts.push({ type: "dispatch", label: `Active Dispatch Delayed: Cargo ${driver.current_order.cargo_description}` });
    }

    return alerts;
  };

  const driversWithAlerts = drivers.map(d => ({
    driver: d,
    alerts: getDriverAlerts(d)
  })).filter(item => item.alerts.length > 0);

  const urgentCount = driversWithAlerts.length;

  // Filtered drivers list
  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      d.name.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.license_number.toLowerCase().includes(q) ||
      (d.profile?.address && d.profile.address.toLowerCase().includes(q)) ||
      (d.current_order?.cargo_description && d.current_order.cargo_description.toLowerCase().includes(q)) ||
      (d.current_order?.destination_name && d.current_order.destination_name.toLowerCase().includes(q));

    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchMedical = medicalFilter === "ALL" || (d.profile && d.profile.medical_status === medicalFilter);
    const driverTags = getDriverTags(d);
    const matchTag = tagFilter === "ALL" || driverTags.includes(tagFilter);

    return matchSearch && matchStatus && matchMedical && matchTag;
  });

  // Apply Smart View quick sorting
  const displayedDrivers = [...filteredDrivers].sort((a, b) => {
    if (smartSortMode === "RISK_SCORE") {
      const riskA = (100 - (a.safety_score || 90)) + ((a.fatigue_indicators || 0) * 12) + (getDriverRegulatoryViolations(a).length * 15);
      const riskB = (100 - (b.safety_score || 90)) + ((b.fatigue_indicators || 0) * 12) + (getDriverRegulatoryViolations(b).length * 15);
      return riskB - riskA;
    }
    if (smartSortMode === "SHIFT_HOURS_REMAINING") {
      const hoursA = a.driving_hours_today || 0;
      const hoursB = b.driving_hours_today || 0;
      return hoursB - hoursA;
    }
    if (smartSortMode === "EFFICIENCY") {
      const effA = a.profile?.ontime_delivery_pct || 95;
      const effB = b.profile?.ontime_delivery_pct || 95;
      return effB - effA;
    }
    return 0;
  });

  // Print Profile PDF / Printer View Generator
  const handlePrintProfile = (driver: DetailedDriver) => {
    const printWindow = window.open("", "_blank", "width=920,height=1000");
    if (!printWindow) {
      addToast({
        type: "error",
        title: "Print Popup Blocked",
        message: "Please enable popup windows to preview and print the driver profile PDF report."
      });
      return;
    }

    const tags = getDriverTags(driver);
    const violations = getDriverRegulatoryViolations(driver);
    const todayStr = new Date().toLocaleString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TransitOps Official Driver Dossier - ${driver.name} (${driver.id})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 30px; line-height: 1.5; font-size: 13px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { font-size: 18px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; }
            .sub { font-size: 11px; color: #64748b; font-family: monospace; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; font-family: monospace; }
            .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .badge-red { background: #ffe4e6; color: #9f1239; border: 1px solid #fca5a5; }
            .section { margin-bottom: 22px; page-break-inside: avoid; }
            .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 10px; letter-spacing: 0.5px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .field { background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px; }
            .tag { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px; }
            .violation-card { background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; color: #475569; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #64748b; font-family: monospace; display: flex; justify-content: space-between; }
            @media print {
              body { margin: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TRANSITOPS CORE OPERATIONAL DOSSIER</div>
              <div class="sub">Official Administrative Personnel, Medical & Compliance Verification Record</div>
            </div>
            <div style="text-align: right;">
              <div class="badge badge-green">OFFICIAL ADMINISTRATIVE AUDIT RECORD</div>
              <div class="sub" style="margin-top: 4px;">Issued: ${todayStr}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">1. Driver Personnel Identification</div>
            <div class="grid">
              <div class="field"><div class="label">Full Name</div><div class="value">${driver.name}</div></div>
              <div class="field"><div class="label">Driver ID / Code</div><div class="value">${driver.id}</div></div>
              <div class="field"><div class="label">Commercial License No.</div><div class="value">${driver.license_number} (${driver.license_status || "VALID"})</div></div>
              <div class="field"><div class="label">Assigned Depot</div><div class="value">${driver.profile?.assigned_depot || "Main Logistics Depot"}</div></div>
              <div class="field"><div class="label">Contact Phone & Email</div><div class="value">${driver.profile?.phone || "N/A"} | ${driver.profile?.email || "N/A"}</div></div>
              <div class="field"><div class="label">Emergency Contact</div><div class="value">${driver.profile?.emergency_contact_name || "N/A"} (${driver.profile?.emergency_contact_relation || "Family"}) - ${driver.profile?.emergency_contact_phone || "N/A"}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. Skill Set & Vehicle Certification Metadata Tags</div>
            <div>
              ${tags.map(t => `<span class="tag">✓ ${t}</span>`).join("")}
            </div>
          </div>

          <div class="section">
            <div class="section-title">3. Regulatory Compliance & Shift Hours Violation Audit</div>
            ${violations.length === 0 ? `
              <div class="field" style="background: #f0fdf4; border-color: #bbf7d0;">
                <strong style="color: #166534;">✓ NO ACTIVE REGULATORY VIOLATIONS OR COMPLIANCE WARNINGS LOGGED</strong>
                <div style="font-size: 11px; color: #15803d; margin-top: 2px;">Driver adheres 100% to FMCSA 49 CFR § 395 Hours of Service regulations and CDL validity requirements.</div>
              </div>
            ` : violations.map(v => `
              <div class="violation-card">
                <strong style="color: #9f1239;">[${v.code}] ${v.ruleTitle} - (${v.severity})</strong>
                <div style="font-size: 11px; color: #4c0519; margin-top: 2px;">${v.description}</div>
                <div style="font-size: 10px; font-weight: bold; color: #be123c; margin-top: 4px;">Corrective Directive: ${v.correctiveAction}</div>
              </div>
            `).join("")}
          </div>

          <div class="section">
            <div class="section-title">4. Medical Fitness & Health Clearance History</div>
            <div class="grid">
              <div class="field"><div class="label">Medical Status</div><div class="value">${driver.profile?.medical_status || "FIT_FOR_DUTY"}</div></div>
              <div class="field"><div class="label">Last Medical Examination</div><div class="value">${driver.profile?.last_medical_checkup || "2026-05-10"}</div></div>
              <div class="field"><div class="label">Vision Exam Result</div><div class="value">${driver.profile?.vision_test || "20/20"}</div></div>
              <div class="field"><div class="label">Drug Screening Clearance</div><div class="value">${driver.profile?.drug_test_status || "CLEARED"}</div></div>
            </div>
            <div class="field" style="margin-top: 8px;">
              <div class="label">Medical Examiner Remarks</div>
              <div class="value" style="font-size: 11px; font-style: italic;">"${driver.profile?.medical_notes || "Cleared for full duty."}"</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">5. 30-Day Operational Productivity Benchmarks</div>
            <div class="grid">
              <div class="field"><div class="label">Safety Driving Score</div><div class="value">${driver.safety_score || 90} / 100 (Fleet Avg: 86.0)</div></div>
              <div class="field"><div class="label">On-Time Delivery Rate</div><div class="value">${driver.profile?.ontime_delivery_pct || 98.2}% (Fleet Avg: 87.5%)</div></div>
              <div class="field"><div class="label">Completed Lifetime Dispatches</div><div class="value">${driver.profile?.total_completed_trips || 184} Dispatches</div></div>
              <div class="field"><div class="label">Supervisor Evaluation Rating</div><div class="value">${driver.profile?.supervisor_rating || 4.8} / 5.0</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">6. Dispatch & Completed Trip History</div>
            <table>
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Cargo Description</th>
                  <th>Route Corridor</th>
                  <th>Dispatch Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${(driver.dispatch_history || []).map(dh => `
                  <tr>
                    <td><strong>${dh.trip_code}</strong></td>
                    <td>${dh.cargo_description} (${dh.cargo_weight} kg)</td>
                    <td>${dh.origin} → ${dh.destination}</td>
                    <td>${dh.dispatch_time}</td>
                    <td>${dh.on_time_status}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div>TransitOps Fleet Operations Security Engine • Confidential Administrative Record</div>
            <div>Page 1 of 1 • Verification Stamp: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    addToast({
      type: "info",
      title: "Print Dossier Ready",
      message: `Generated printable administrative PDF report for ${driver.name}.`
    });
  };

  // Bulk Action Handlers
  const toggleSelectDriver = (id: string) => {
    setSelectedDriverIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDriverIds.length === filteredDrivers.length && filteredDrivers.length > 0) {
      setSelectedDriverIds([]);
    } else {
      setSelectedDriverIds(filteredDrivers.map(d => d.id));
    }
  };

  const handleBulkStatusUpdate = (newStatus: "IN_TRANSIT" | "IDLE" | "OFF_DUTY") => {
    setDrivers(prev => prev.map(d => selectedDriverIds.includes(d.id) ? { ...d, status: newStatus } : d));
    addToast({
      type: "success",
      title: "Batch Status Updated",
      message: `Updated status to ${newStatus} for ${selectedDriverIds.length} driver(s).`
    });
  };

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    addToast({
      type: "info",
      title: "Broadcast Dispatched",
      message: `Sent broadcast message to ${selectedDriverIds.length} driver(s).`
    });
    setBroadcastMessage("");
    setShowBroadcastModal(false);
  };

  const handleAssignBulkShift = () => {
    setDrivers(prev => prev.map(d => {
      if (selectedDriverIds.includes(d.id)) {
        return {
          ...d,
          profile: {
            ...d.profile,
            assigned_depot: bulkShiftDepot
          }
        };
      }
      return d;
    }));
    addToast({
      type: "success",
      title: "Bulk Shift Assigned",
      message: `Assigned depot '${bulkShiftDepot}' to ${selectedDriverIds.length} driver(s).`
    });
    setShowBulkShiftModal(false);
  };

  // Open Batch Print Modal & Preselect Drivers
  const handleOpenBatchPrintModal = () => {
    const defaultIds = selectedDriverIds.length > 0 
      ? selectedDriverIds 
      : drivers.map(d => d.id);
    setBatchPrintSelectedDriverIds(defaultIds);
    setShowBatchPrintModal(true);
  };

  // Execute Paginated Batch Print PDF Generation
  const handleExecuteBatchPrint = () => {
    const selectedDriversToPrint = drivers.filter(d => batchPrintSelectedDriverIds.includes(d.id));
    if (selectedDriversToPrint.length === 0) {
      addToast({
        type: "warning",
        title: "No Drivers Selected",
        message: "Please select at least one driver profile to include in the batch print report."
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=920,height=1000");
    if (!printWindow) {
      addToast({
        type: "error",
        title: "Print Popup Blocked",
        message: "Please allow popup windows to preview and print the batch compliance report."
      });
      return;
    }

    const todayStr = new Date().toLocaleString();

    const driversHtml = selectedDriversToPrint.map((driver, index) => {
      const violations = getDriverRegulatoryViolations(driver);
      const shiftHistory = generate30DayShiftComplianceHeatmap(driver);

      return `
        <div class="driver-page ${index < selectedDriversToPrint.length - 1 ? 'page-break' : ''}">
          <div class="header">
            <div>
              <div class="logo">TRANSITOPS BATCH COMPLIANCE & SHIFT REPORT</div>
              <div class="sub">Official Administrative Personnel & HOS Shift Log Record</div>
            </div>
            <div style="text-align: right;">
              <div class="badge badge-green">AUDIT VERIFIED</div>
              <div class="sub" style="margin-top: 4px;">Issued: ${todayStr}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">1. Driver Personnel Identification</div>
            <div class="grid">
              <div class="field"><div class="label">Full Name</div><div class="value">${driver.name}</div></div>
              <div class="field"><div class="label">Driver ID / Code</div><div class="value">${driver.id}</div></div>
              <div class="field"><div class="label">Commercial CDL No.</div><div class="value">${driver.license_number} (${driver.license_status || "VALID"})</div></div>
              <div class="field"><div class="label">Assigned Depot</div><div class="value">${driver.profile?.assigned_depot || "Main Logistics Hub"}</div></div>
              <div class="field"><div class="label">Contact Phone / Email</div><div class="value">${driver.profile?.phone || "N/A"} | ${driver.profile?.email || "N/A"}</div></div>
              <div class="field"><div class="label">Medical Status</div><div class="value">${driver.profile?.medical_status || "FIT_FOR_DUTY"}</div></div>
            </div>
          </div>

          ${includeComplianceMetrics ? `
          <div class="section">
            <div class="section-title">2. Regulatory Compliance & DOT Violations Audit</div>
            ${violations.length === 0 ? `
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:8px 12px; border-radius:6px; font-weight:bold; font-size:11px;">
                ✓ 100% COMPLIANT - Zero active regulatory or HOS safety violations flagged.
              </div>
            ` : violations.map(v => `
              <div class="violation-card">
                <div style="font-weight:bold; color:#9f1239; font-size:11px;">[${v.code}] ${v.ruleTitle}</div>
                <div style="margin-top:2px; font-size:10.5px; color:#475569;">${v.description}</div>
                <div style="margin-top:4px; font-weight:bold; font-size:10px; color:#1e293b;">Action: ${v.correctiveAction}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${includeShiftLogs ? `
          <div class="section">
            <div class="section-title">3. Recent Shift Logs & HOS Driving Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in Status</th>
                  <th>Driving Hrs</th>
                  <th>Rest Hrs</th>
                  <th>Compliance Status</th>
                  <th>Log Notes</th>
                </tr>
              </thead>
              <tbody>
                ${shiftHistory.slice(0, 8).map(s => `
                  <tr>
                    <td><b>${s.dateStr}</b> (${s.dayOfWeek})</td>
                    <td>${s.checkInTime} (${s.checkInStatus})</td>
                    <td>${s.drivingHours} hrs</td>
                    <td>${s.restHours} hrs</td>
                    <td><span class="badge ${s.status === 'COMPLIANT' ? 'badge-green' : 'badge-red'}">${s.status}</span></td>
                    <td><small>${s.notes}</small></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <span>TransitOps Batch Compliance Engine • Profile ${index + 1} of ${selectedDriversToPrint.length}</span>
            <span>Confidential Operational Audit Record</span>
          </div>
        </div>
      `;
    }).join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TransitOps Batch Driver Compliance PDF Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 25px; line-height: 1.4; font-size: 12px; background: #fff; }
            .page-break { page-break-after: always; break-after: page; }
            .driver-page { margin-bottom: 30px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
            .logo { font-size: 16px; font-weight: 800; color: #1e3a8a; }
            .sub { font-size: 10px; color: #64748b; font-family: monospace; }
            .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; font-family: monospace; }
            .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .badge-red { background: #ffe4e6; color: #9f1239; border: 1px solid #fca5a5; }
            .section { margin-bottom: 18px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .field { background: #f8fafc; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; }
            .label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 11px; font-weight: 600; color: #0f172a; }
            .violation-card { background: #fff1f2; border: 1px solid #fecdd3; padding: 8px; border-radius: 4px; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { background: #f1f5f9; text-align: left; padding: 6px; font-size: 10px; color: #475569; border-bottom: 2px solid #cbd5e1; }
            td { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
            .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9.5px; color: #64748b; font-family: monospace; display: flex; justify-content: space-between; }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>
          ${driversHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
    setShowBatchPrintModal(false);
    addToast({
      type: "success",
      title: "Batch PDF Generated",
      message: `Generated paginated report for ${selectedDriversToPrint.length} selected drivers.`
    });
  };

  // Calculate Metrics
  const totalDrivers = drivers.length;
  const fitCount = drivers.filter(d => d.profile?.medical_status === "FIT_FOR_DUTY").length;
  const fitRate = totalDrivers > 0 ? Math.round((fitCount / totalDrivers) * 100) : 0;
  const activeInTransit = drivers.filter(d => d.status === "IN_TRANSIT").length;
  const avgSafetyScore = drivers.length > 0
    ? Math.round(drivers.reduce((acc, d) => acc + (d.safety_score || 90), 0) / drivers.length)
    : 0;

  const totalFleetEfficiency = totalDrivers > 0 
    ? (drivers.reduce((acc, d) => acc + (d.profile?.ontime_delivery_pct || 95), 0) / totalDrivers).toFixed(1)
    : "95.0";

  const compliantDriversCount = drivers.filter(d => getDriverRegulatoryViolations(d).length === 0).length;
  const avgComplianceScore = totalDrivers > 0
    ? ((compliantDriversCount / totalDrivers) * 100).toFixed(1)
    : "100.0";

  const totalActiveViolationsCount = drivers.reduce((acc, d) => acc + getDriverRegulatoryViolations(d).length, 0);

  const getMedicalBadge = (status?: string) => {
    switch (status) {
      case "FIT_FOR_DUTY":
        return (
          <span className="hd-badge-green flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <ShieldCheck className="w-3 h-3 text-emerald-700" /> FIT FOR DUTY
          </span>
        );
      case "CONDITIONAL":
        return (
          <span className="hd-badge-orange flex items-center gap-1.5 animate-pulse">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <AlertTriangle className="w-3 h-3 text-amber-700" /> CONDITIONAL WATCH
          </span>
        );
      case "ACTION_REQUIRED":
        return (
          <span className="hd-badge-red flex items-center gap-1.5 animate-pulse border-rose-400/80 shadow-sm">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <ShieldAlert className="w-3 h-3 text-rose-700" /> ACTION REQUIRED
          </span>
        );
      case "ON_LEAVE":
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" /> ON REST LEAVE
          </span>
        );
      default:
        return <span className="hd-badge-blue">PENDING EVAL</span>;
    }
  };

  const getDutyBadge = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <Truck className="w-3 h-3 text-blue-700" /> IN TRANSIT
          </span>
        );
      case "IDLE":
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> IDLE / READY
          </span>
        );
      case "OFF_DUTY":
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-400" /> OFF DUTY
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">{status}</span>;
    }
  };

  // Download Shift Report CSV Generator
  const handleDownloadShiftReport = (driver: DetailedDriver) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const reportId = `SHIFT-REP-${driver.id}-${Date.now().toString().slice(-6)}`;
    
    const csvRows = [
      ["TRANSITOPS OFFICIAL DRIVER SHIFT & OPERATIONAL EFFICIENCY REPORT"],
      ["Report ID", reportId],
      ["Generated Timestamp", new Date().toLocaleString()],
      [""],
      ["--- DRIVER PERSONNEL DOSSIER ---"],
      ["Driver Name", driver.name],
      ["Driver ID", driver.id],
      ["License Number", driver.license_number],
      ["License Status", driver.license_status || "VALID"],
      ["Assigned Depot", driver.profile?.assigned_depot || "Main Hub"],
      ["Residential Address", `"${driver.profile?.address || "Registered Address"}"`],
      [""],
      ["--- SHIFT & DUTY METRICS ---"],
      ["Shift Date", todayStr],
      ["Duty Status", driver.status],
      ["Driving Hours Today", `${driver.driving_hours_today || 7.5} hours`],
      ["Remaining Legal Driving Limit", `${Math.max(0, 8.0 - (driver.driving_hours_today || 7.5)).toFixed(1)} hours`],
      ["Lifetime Completed Trips", driver.profile?.total_completed_trips || 184],
      ["Sudden Braking Events Today", driver.sudden_braking_events || 0],
      ["Fatigue Risk Index", driver.fatigue_indicators || 0],
      [""],
      ["--- ACTIVE DISPATCH & CARGO MANIFEST ---"],
      ["Active Vehicle ID", driver.current_vehicle_id || "FLT-9821"],
      ["Cargo Description", driver.current_order?.cargo_description || "None"],
      ["Cargo Weight", driver.current_order ? `${driver.current_order.weight} kg` : "N/A"],
      ["Destination Hub", driver.current_order?.destination_name || "N/A"],
      [""],
      ["--- PERFORMANCE & SAFETY BENCHMARKS ---"],
      ["30-Day On-Time Delivery Rate", `${driver.profile?.ontime_delivery_pct || 98.2}%`],
      ["Safety Driving Score", `${driver.safety_score || 90} / 100`],
      ["Supervisor Evaluation Rating", `${driver.profile?.supervisor_rating || 4.8} / 5.0`],
      [""],
      ["--- MEDICAL CLEARANCE HISTORY ---"],
      ["Medical Clearance Status", driver.profile?.medical_status || "FIT_FOR_DUTY"],
      ["Vision Eye Test", driver.profile?.vision_test || "20/20"],
      ["Drug Screening Status", driver.profile?.drug_test_status || "CLEARED"],
      ["Last Medical Examination", driver.profile?.last_medical_checkup || "2026-05-10"],
      ["Medical Examiner Notes", `"${driver.profile?.medical_notes || "Cleared for long-haul commercial duty."}"`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${driver.name.replace(/\s+/g, "_")}_Shift_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: "success",
      title: "Shift Report Downloaded",
      message: `Shift summary report for ${driver.name} has been generated.`
    });
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Top Banner Header & KPI Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-bold tracking-tight text-white">Driver Personnel & Medical Registry</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              COMPLIANCE LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete driver dossiers including medical fitness history, dispatch logs, present addresses, active cargo & performance assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Print Configuration Trigger */}
          <button
            onClick={handleOpenBatchPrintModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 px-3 py-1.5 rounded-md text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Batch Print Paginated Compliance & HOS Report PDF"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Batch Print Compliance</span>
          </button>

          {/* Real-time Notification Badge Trigger */}
          <button
            onClick={() => setShowUrgentDrawer(!showUrgentDrawer)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer relative ${
              urgentCount > 0 
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-sm shadow-rose-950 animate-pulse" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Urgent Action Badge</span>
            <span className={`px-1.5 py-0.2 text-[10px] font-mono font-black rounded-full ${
              urgentCount > 0 ? "bg-white text-rose-700" : "bg-slate-700 text-slate-300"
            }`}>
              {urgentCount}
            </span>
          </button>

          <button 
            onClick={fetchDrivers} 
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time Urgent Administrative Notifications Drawer */}
      {showUrgentDrawer && (
        <div className="bg-rose-950/30 border border-rose-500/40 p-4 rounded-lg space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-rose-800/40 pb-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>URGENT ADMINISTRATIVE ATTENTION REQUIRED ({urgentCount} Drivers Flagged)</span>
            </div>
            <button 
              onClick={() => setShowUrgentDrawer(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {driversWithAlerts.length === 0 ? (
            <div className="text-xs text-emerald-400 font-medium p-2 bg-emerald-950/30 rounded border border-emerald-800/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              All driver medical clearances, licenses, and dispatches are fully compliant.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {driversWithAlerts.map(({ driver, alerts }) => (
                <div 
                  key={driver.id}
                  className="bg-slate-900 border border-rose-800/60 p-3 rounded-md space-y-2 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-white font-bold">
                      <span className="text-rose-200">{driver.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{driver.id}</span>
                    </div>

                    <div className="space-y-1 mt-2">
                      {alerts.map((alt, idx) => (
                        <div key={idx} className="bg-rose-900/30 text-rose-300 border border-rose-800/40 p-1.5 rounded text-[11px] font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{alt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDriver(driver);
                      setActiveDossierTab(alerts.some(a => a.type === "medical") ? "medical" : "overview");
                      setShowUrgentDrawer(false);
                      if (driver.profile) {
                        setEditMedicalStatus(driver.profile.medical_status);
                        setEditMedicalNotes(driver.profile.medical_notes);
                      }
                    }}
                    className="mt-2 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect & Resolve Administrative Flag
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fleet Summary Aggregate Indicator Cards Component */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="hd-card p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Fleet Efficiency</div>
            <div className="text-lg font-bold text-blue-600 mt-0.5">{totalFleetEfficiency}%</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">On-Time Delivery Index</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="hd-card p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Compliance Score</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{avgComplianceScore}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{compliantDriversCount} / {totalDrivers} Fully Compliant</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="hd-card p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fleet Safety Rating</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{avgSafetyScore} / 100</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Defensive Driving Benchmark</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="hd-card p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Medical Fitness Rate</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{fitRate}% Fit</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{fitCount} Clearance Approved</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4" />
          </div>
        </div>

        <div className="hd-card p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Dispatches</div>
            <div className="text-lg font-bold text-blue-600 mt-0.5">{activeInTransit} In-Transit</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active Freight Dispatches</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="hd-card p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rest / Violation Flags</div>
            <div className="text-lg font-bold text-rose-600 mt-0.5">{totalActiveViolationsCount} Active</div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">HOS & Regulatory Warnings</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Bulk Action Operations Toolbar */}
      {selectedDriverIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              {selectedDriverIds.length} Driver(s) Selected
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">Administrative Batch Operations:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 font-semibold px-1 text-[11px]">Set Status:</span>
              <button
                onClick={() => handleBulkStatusUpdate("IN_TRANSIT")}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                In Transit
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("IDLE")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                Idle
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("OFF_DUTY")}
                className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                Off Duty
              </button>
            </div>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Message</span>
            </button>

            <button
              onClick={() => setShowBulkShiftModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Assign Bulk Shift</span>
            </button>

            <button
              onClick={() => setSelectedDriverIds([])}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 underline cursor-pointer ml-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Smart View Quick Sort Toggles Bar */}
      <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Smart View Toggles:</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Instantly sort drivers by risk score, shift hours remaining, or recent efficiency</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSmartSortMode(smartSortMode === "RISK_SCORE" ? "DEFAULT" : "RISK_SCORE")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              smartSortMode === "RISK_SCORE"
                ? "bg-rose-600 border-rose-500 text-white shadow-sm ring-2 ring-rose-400/40"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
            <span>Risk Score</span>
          </button>

          <button
            type="button"
            onClick={() => setSmartSortMode(smartSortMode === "SHIFT_HOURS_REMAINING" ? "DEFAULT" : "SHIFT_HOURS_REMAINING")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              smartSortMode === "SHIFT_HOURS_REMAINING"
                ? "bg-amber-600 border-amber-500 text-white shadow-sm ring-2 ring-amber-400/40"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Shift Hours Remaining</span>
          </button>

          <button
            type="button"
            onClick={() => setSmartSortMode(smartSortMode === "EFFICIENCY" ? "DEFAULT" : "EFFICIENCY")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              smartSortMode === "EFFICIENCY"
                ? "bg-emerald-600 border-emerald-500 text-white shadow-sm ring-2 ring-emerald-400/40"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Recent Efficiency</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFatigueHeatmap(!showFatigueHeatmap)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showFatigueHeatmap
                ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            title="Toggle Continuous Driving Hours Fatigue Heat-map Overlay"
          >
            <Flame className="w-3.5 h-3.5 text-rose-300" />
            <span>Fatigue Heat-map Overlay</span>
          </button>

          {smartSortMode !== "DEFAULT" && (
            <button
              type="button"
              onClick={() => setSmartSortMode("DEFAULT")}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer px-1"
            >
              Reset Sort
            </button>
          )}
        </div>
      </div>

      {/* Driver Fatigue Heat-map Overlay Executive Summary Banner */}
      {showFatigueHeatmap && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border border-rose-500/40 p-3.5 rounded-lg text-white font-mono space-y-2.5 animate-in fade-in duration-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-300">
                DRIVER FATIGUE HEAT-MAP OVERLAY • FMCSA 49 CFR § 395.3 MANDATE
              </h3>
            </div>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
              Shift Cap: 8.0 Continuous Driving Hours
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-rose-950/50 border border-rose-500/30 p-2 rounded flex flex-col justify-between">
              <div className="text-[10px] text-rose-400 font-bold uppercase">Critical Rest Overdue (≥7.5 hrs)</div>
              <div className="text-lg font-black text-rose-400 mt-1">
                {drivers.filter((d) => (d.driving_hours_today || 0) >= 7.5).length} Drivers
              </div>
              <div className="text-[9px] text-rose-300/80">Mandatory Stand-down Needed</div>
            </div>

            <div className="bg-amber-950/50 border border-amber-500/30 p-2 rounded flex flex-col justify-between">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Approaching Cap (6.5–7.5 hrs)</div>
              <div className="text-lg font-black text-amber-400 mt-1">
                {drivers.filter((d) => (d.driving_hours_today || 0) >= 6.5 && (d.driving_hours_today || 0) < 7.5).length} Drivers
              </div>
              <div className="text-[9px] text-amber-300/80">Prepare Relief Shift</div>
            </div>

            <div className="bg-yellow-950/50 border border-yellow-500/30 p-2 rounded flex flex-col justify-between">
              <div className="text-[10px] text-yellow-400 font-bold uppercase">Moderate Load (5.0–6.5 hrs)</div>
              <div className="text-lg font-black text-yellow-400 mt-1">
                {drivers.filter((d) => (d.driving_hours_today || 0) >= 5.0 && (d.driving_hours_today || 0) < 6.5).length} Drivers
              </div>
              <div className="text-[9px] text-yellow-300/80">Monitor Telematics</div>
            </div>

            <div className="bg-emerald-950/50 border border-emerald-500/30 p-2 rounded flex flex-col justify-between">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Nominal / Low Risk (&lt;5.0 hrs)</div>
              <div className="text-lg font-black text-emerald-400 mt-1">
                {drivers.filter((d) => (d.driving_hours_today || 0) < 5.0).length} Drivers
              </div>
              <div className="text-[9px] text-emerald-300/80">Fully Compliant</div>
            </div>
          </div>
        </div>
      )}

      {/* Search, Filter & Bar Controls */}
      <div className="hd-card p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search driver name, ID, license, address, current cargo or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
            title="Select or deselect all drivers in active view"
          >
            {selectedDriverIds.length === displayedDrivers.length && displayedDrivers.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Select All ({displayedDrivers.length})</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Duty:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="IDLE">Idle / Ready</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Certification / Tag:</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Certifications</option>
              {ALL_AVAILABLE_TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
            <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
            <span>Medical:</span>
            <select
              value={medicalFilter}
              onChange={(e) => setMedicalFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Medical</option>
              <option value="FIT_FOR_DUTY">Fit for Duty</option>
              <option value="CONDITIONAL">Conditional Watch</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="ON_LEAVE">On Rest Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Cards Grid */}
      {loading ? (
        <div className="hd-card p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <div className="font-semibold text-sm">Loading Driver Profiles & Medical Data...</div>
        </div>
      ) : displayedDrivers.length === 0 ? (
        <div className="hd-card p-12 text-center text-slate-500">
          <User className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <div className="font-bold text-slate-700">No driver records found matching query</div>
          <div className="text-xs mt-1">Try adjusting search parameters or clear filters.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedDrivers.map((driver) => {
            const profile = driver.profile;
            const alerts = getDriverAlerts(driver);
            const hasAlert = alerts.length > 0;
            const tags = getDriverTags(driver);
            const violations = getDriverRegulatoryViolations(driver);
            const sentiment = getDriverSentiment(driver);

            return (
              <div 
                key={driver.id}
                className={`hd-card hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group shadow-2xs ${
                  hasAlert ? "border-l-4 border-l-rose-500" : ""
                }`}
              >
                {/* Driver Card Header */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectDriver(driver.id);
                      }}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer shrink-0"
                      title={selectedDriverIds.includes(driver.id) ? "Deselect Driver" : "Select Driver for Bulk Action"}
                    >
                      {selectedDriverIds.includes(driver.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-50" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>

                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white shadow-sm text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {driver.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        {driver.name}
                        <span className="font-mono font-normal text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                          {driver.id}
                        </span>
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Lic: <span className="font-semibold text-slate-700">{driver.license_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getDutyBadge(driver.status)}
                    {getMedicalBadge(profile?.medical_status)}
                    {hasAlert && (
                      <span className="bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[9px] px-1.5 py-0.2 rounded flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> URGENT ALERT
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body Info */}
                <div className="p-3 space-y-2.5 text-xs flex-1">
                  {/* Driver Fatigue Heat-map Overlay Widget */}
                  {showFatigueHeatmap && (
                    <div className={`p-2.5 rounded-lg border font-mono space-y-2 ${
                      (driver.driving_hours_today || 0) >= 7.5
                        ? "bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                        : (driver.driving_hours_today || 0) >= 6.5
                        ? "bg-amber-950/60 border-amber-500/80 text-amber-200"
                        : (driver.driving_hours_today || 0) >= 5.0
                        ? "bg-yellow-950/40 border-yellow-500/60 text-yellow-200"
                        : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                          <Flame className={`w-3.5 h-3.5 ${
                            (driver.driving_hours_today || 0) >= 7.5 ? "text-rose-400 animate-bounce" : "text-amber-400"
                          }`} />
                          Fatigue Progress
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded border bg-slate-900/80">
                          {driver.driving_hours_today || 6.5} / 8.0 HRS
                        </span>
                      </div>

                      {/* Continuous Shift Progress Heat Bar */}
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            (driver.driving_hours_today || 0) >= 7.5 ? "bg-rose-500" :
                            (driver.driving_hours_today || 0) >= 6.5 ? "bg-amber-500" :
                            (driver.driving_hours_today || 0) >= 5.0 ? "bg-yellow-400" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.round(((driver.driving_hours_today || 6.5) / 8.0) * 100))}%` }}
                        ></div>
                      </div>

                      {/* Hourly Shift Heat Blocks */}
                      <div className="grid grid-cols-8 gap-1 pt-0.5">
                        {Array.from({ length: 8 }).map((_, hIdx) => {
                          const hourVal = hIdx + 1;
                          const currentDriven = driver.driving_hours_today || 6.5;
                          const isDriven = hourVal <= Math.floor(currentDriven);
                          const isPartial = hourVal === Math.ceil(currentDriven) && currentDriven % 1 !== 0;

                          return (
                            <div
                              key={hIdx}
                              className={`h-3 rounded-[2px] border text-[8px] flex items-center justify-center font-black ${
                                isDriven
                                  ? hourVal >= 8 ? "bg-rose-600 border-rose-400 text-white" :
                                    hourVal >= 7 ? "bg-amber-500 border-amber-300 text-slate-900" :
                                    hourVal >= 5 ? "bg-yellow-400 border-yellow-200 text-slate-900" : "bg-emerald-500 border-emerald-300 text-slate-900"
                                  : isPartial ? "bg-amber-400/60 border-amber-300 text-slate-900" : "bg-slate-900/80 border-slate-800 text-slate-600"
                              }`}
                              title={`Hour ${hourVal}: ${isDriven ? "Logged Continuous Driving" : "Remaining"}`}
                            >
                              H{hourVal}
                            </div>
                          );
                        })}
                      </div>

                      {(driver.driving_hours_today || 0) >= 7.5 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToast({
                              type: "success",
                              title: "MANDATORY STAND-DOWN ENFORCED",
                              message: `Stand-down lock issued for ${driver.name}. 11-hour mandatory rest period initiated.`
                            });
                          }}
                          className="w-full mt-1 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <ShieldAlert className="w-3 h-3" /> Enforce Mandatory Stand-Down
                        </button>
                      )}
                    </div>
                  )}

                  {/* AI Driver Interaction Sentiment Tag */}
                  <div className={`p-2 rounded-md border text-[11px] font-semibold space-y-1 ${
                    sentiment.turnoverRisk === "HIGH" 
                      ? "bg-rose-50/90 border-rose-200 text-rose-950"
                      : sentiment.turnoverRisk === "MODERATE"
                      ? "bg-amber-50/90 border-amber-200 text-amber-950"
                      : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold text-[10.5px] uppercase tracking-wider">
                        <MessageSquare className="w-3 h-3 shrink-0 text-slate-700" />
                        AI Sentiment: <span className="underline font-extrabold">{sentiment.label}</span>
                      </span>
                      <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.2 rounded border ${
                        sentiment.turnoverRisk === "HIGH" ? "bg-rose-200 text-rose-900 border-rose-300" :
                        sentiment.turnoverRisk === "MODERATE" ? "bg-amber-200 text-amber-900 border-amber-300" :
                        "bg-emerald-200 text-emerald-900 border-emerald-300"
                      }`}>
                        {sentiment.satisfactionPct}% SATISFACTION
                      </span>
                    </div>
                    <div className="text-[10px] opacity-90 leading-snug font-sans italic">
                      "{sentiment.aiScanSummary}"
                    </div>
                  </div>

                  {/* Urgent Alert Banner on Card if present */}
                  {hasAlert && (
                    <div className="bg-rose-50 p-2 rounded border border-rose-200 text-rose-800 text-[11px] font-semibold space-y-0.5">
                      <div className="flex items-center gap-1 text-rose-700 font-bold uppercase text-[10px]">
                        <ShieldAlert className="w-3 h-3 text-rose-600" /> Action Required
                      </div>
                      <div className="truncate">{alerts[0].label}</div>
                    </div>
                  )}

                  {/* Skill & Certification Metadata Tags */}
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagFilter(t);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${
                          tagFilter === t 
                            ? "bg-blue-600 text-white border-blue-700" 
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5 text-blue-500" />
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>

                  {/* Regulatory Violation Alert Indicator */}
                  {violations.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-rose-700">
                        <span className="flex items-center gap-1"><Scale className="w-3 h-3 text-rose-600" /> HOS Regulatory Flag</span>
                        <span className="bg-rose-200 text-rose-900 px-1 py-0.2 rounded font-mono text-[9px]">{violations.length} Warning(s)</span>
                      </div>
                      <div className="text-[10px] font-medium text-rose-900 truncate">
                        [{violations[0].code}] {violations[0].ruleTitle}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Present Address</div>
                      <div className="font-medium line-clamp-2 text-[11px] text-slate-800">
                        {profile?.address || "Registered Depot Address On Record"}
                      </div>
                    </div>
                  </div>

                  {/* Active Goods & Transit Route */}
                  {driver.current_order ? (
                    <div className="bg-blue-50/80 p-2 rounded border border-blue-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-blue-700 font-bold">
                        <span className="flex items-center gap-1"><PackageCheck className="w-3 h-3" /> ACTIVE CARGO RUN</span>
                        <span className="font-mono text-blue-800">{driver.current_order.weight} kg</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {driver.current_order.cargo_description}
                      </div>
                      <div className="text-[10px] text-slate-600 flex items-center justify-between">
                        <span>Going to: <strong className="text-slate-800">{driver.current_order.destination_name}</strong></span>
                        <span className="font-mono font-semibold text-blue-700">{driver.current_vehicle_id}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[11px] text-slate-500 italic flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      No active cargo run assigned. Ready for next dispatch.
                    </div>
                  )}

                  {/* Active Shift Real-Time Duty Hours Countdown Timer */}
                  {(() => {
                    const driven = driver.driving_hours_today || 0;
                    const maxHours = 8.0;
                    const remainingHours = Math.max(0, maxHours - driven);
                    const remainingMinsTotal = Math.round(remainingHours * 60);
                    const displayHours = Math.floor(remainingMinsTotal / 60);
                    const displayMins = remainingMinsTotal % 60;
                    const isWarning = remainingHours <= 1.0;
                    const isLimitReached = remainingHours <= 0;

                    return (
                      <div className={`p-2 rounded border text-xs font-mono space-y-1 ${
                        isLimitReached
                          ? "bg-rose-950/20 border-rose-500 text-rose-700"
                          : isWarning
                          ? "bg-amber-50 border-amber-300 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${isWarning ? "text-amber-600 animate-spin" : "text-slate-500"}`} />
                            <span>Active Shift Duty Hours</span>
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                            isLimitReached
                              ? "bg-rose-600 text-white"
                              : isWarning
                              ? "bg-amber-600 text-white animate-pulse"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {isLimitReached ? "LIMIT EXCEEDED" : isWarning ? "WARNING: LIMIT NEAR" : "ON SHIFT"}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline pt-0.5">
                          <span className="text-[11px] text-slate-500">
                            Logged: <strong className="text-slate-900">{driven}h</strong> / {maxHours}h max
                          </span>
                          <span className={`font-bold text-xs ${isWarning ? "text-amber-700 font-extrabold" : "text-blue-700"}`}>
                            {isLimitReached ? "0h 0m (Mandatory Rest)" : `${displayHours}h ${displayMins}m remaining`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isLimitReached ? "bg-rose-600" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                            }`} 
                            style={{ width: `${Math.min(100, (driven / maxHours) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Rating & Safety Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white border border-slate-200 p-1.5 rounded flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Safety Score</span>
                      <span className={`font-bold font-mono ${
                        (driver.safety_score || 90) >= 90 ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {driver.safety_score || 90} / 100
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 p-1.5 rounded flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Supervisor</span>
                      <span className="font-bold font-mono text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {profile?.supervisor_rating || 4.8}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedDriver(driver);
                      setActiveDossierTab("overview");
                      if (driver.profile) {
                        setEditMedicalStatus(driver.profile.medical_status);
                        setEditMedicalNotes(driver.profile.medical_notes);
                      }
                    }}
                    className="w-full bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Full Medical & Dispatch Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Driver Dossier Modal Inspector */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-white/20 text-white font-bold text-sm flex items-center justify-center shadow-inner shrink-0">
                  {selectedDriver.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white">{selectedDriver.name}</h2>
                    <span className="font-mono text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                      {selectedDriver.id}
                    </span>
                    {getDutyBadge(selectedDriver.status)}
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1 font-mono">
                    <span>License: <strong className="text-slate-200">{selectedDriver.license_number}</strong></span>
                    <span>Depot: <strong className="text-slate-200">{selectedDriver.profile?.assigned_depot || "Main Hub"}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {getDriverTags(selectedDriver).map((t) => (
                      <span key={t} className="text-[10px] font-bold bg-blue-900/60 text-blue-200 border border-blue-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-blue-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => handlePrintProfile(selectedDriver)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Print Profile</span>
                </button>

                <button
                  onClick={() => handleDownloadShiftReport(selectedDriver)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Shift Report</span>
                </button>

                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Dossier Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveDossierTab("overview")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "overview" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Personal & Contact
              </button>

              <button
                onClick={() => setActiveDossierTab("medical")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "medical" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Medical & Fitness History
              </button>

              <button
                onClick={() => setActiveDossierTab("active_mission")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "active_mission" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Active Goods & Route Mini-Map
              </button>

              <button
                onClick={() => setActiveDossierTab("dispatch_history")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "dispatch_history" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Dispatch & Trip History
              </button>

              <button
                onClick={() => setActiveDossierTab("performance")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "performance" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                30-Day Productivity Trends
              </button>

              <button
                onClick={() => setActiveDossierTab("chat")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "chat" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Live Dispatch Chat
              </button>

              <button
                onClick={() => setActiveDossierTab("documents")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "documents" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Document Camera Verification
              </button>

              <button
                onClick={() => setActiveDossierTab("heatmap")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDossierTab === "heatmap" 
                    ? "border-blue-600 text-blue-700 font-bold" 
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Shift Compliance Heatmap
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
              
              {/* TAB 1: OVERVIEW & PERSONAL */}
              {activeDossierTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address Box */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        Present Residential Address
                      </div>
                      <div className="text-slate-800 font-medium bg-white p-2.5 rounded border border-slate-200 text-xs leading-relaxed">
                        {selectedDriver.profile?.address || "402 Evergreen Blvd, Sector 62, Noida, Uttar Pradesh - 201301"}
                      </div>
                    </div>

                    {/* Contact Phone & Email */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Phone className="w-4 h-4 text-blue-600" />
                        Direct Communication
                      </div>
                      <div className="space-y-1.5 bg-white p-2.5 rounded border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <strong className="text-slate-900 font-mono">{selectedDriver.profile?.phone || "+91 98765 21091"}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Email:</span>
                          <strong className="text-slate-900 font-mono">{selectedDriver.profile?.email || "driver@transitops.io"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Regulatory Compliance & Shift Hours Audit Box */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Scale className="w-4 h-4 text-amber-600" />
                        FMCSA / DOT Regulatory Compliance & Shift Hours Violation Audit
                      </div>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        49 CFR § 395 RULES ENGINE
                      </span>
                    </div>

                    {getDriverRegulatoryViolations(selectedDriver).length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md flex items-center gap-2.5 text-xs">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-emerald-900">100% Fully Compliant - No Active Regulatory Violations Logged</div>
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            Driver adheres to legal driving limits ({selectedDriver.driving_hours_today || 0} hrs driven today), commercial license validity, medical clearances, and safe driving thresholds.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {getDriverRegulatoryViolations(selectedDriver).map((v, idx) => (
                          <div 
                            key={`${v.code}-${idx}`} 
                            className={`p-3 rounded-md border flex items-start justify-between gap-3 ${
                              v.severity === "CRITICAL" 
                                ? "bg-rose-50 border-rose-200 text-rose-900" 
                                : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                  v.severity === "CRITICAL" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                                }`}>
                                  [{v.code}] {v.severity} SEVERITY
                                </span>
                                <span>{v.ruleTitle}</span>
                              </div>
                              <p className="text-[11px] font-medium leading-relaxed">{v.description}</p>
                              <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1 pt-0.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Corrective Dispatch Directive: {v.correctiveAction}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MEDICAL HISTORY & FITNESS */}
              {activeDossierTab === "medical" && (
                <div className="space-y-4">
                  {/* Medical Header Clearance Pill */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Current Medical Clearance Status</div>
                      <div className="mt-1">{getMedicalBadge(selectedDriver.profile?.medical_status)}</div>
                    </div>

                    <button
                      onClick={() => setIsEditingMedical(!isEditingMedical)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      {isEditingMedical ? "Cancel Edit" : "Update Medical Note"}
                    </button>
                  </div>

                  {/* Medical Update Form */}
                  {isEditingMedical && (
                    <form onSubmit={handleUpdateMedical} className="bg-blue-50/80 p-4 rounded-lg border border-blue-200 space-y-3">
                      <div className="font-bold text-blue-900 text-xs">Update Driver Medical Clearance & Diagnostics</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Medical Status</label>
                          <select
                            value={editMedicalStatus}
                            onChange={(e) => setEditMedicalStatus(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
                          >
                            <option value="FIT_FOR_DUTY">FIT FOR DUTY (Approved)</option>
                            <option value="CONDITIONAL">CONDITIONAL WATCH (Medicated / Routine Rest)</option>
                            <option value="ACTION_REQUIRED">ACTION REQUIRED (Checkup Overdue / License Expired)</option>
                            <option value="ON_LEAVE">ON REST LEAVE</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Medical Assessment Notes</label>
                          <input
                            type="text"
                            value={editMedicalNotes}
                            onChange={(e) => setEditMedicalNotes(e.target.value)}
                            placeholder="Enter physician/medical examiner remarks..."
                            className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingMedical(false)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 px-3 rounded text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updatingMedical}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-4 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {updatingMedical ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Save Medical Record
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Detailed Medical Indicators Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Blood Group</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{selectedDriver.profile?.blood_group || "O+"}</div>
                      <div className="text-[10px] text-slate-400">Universal Donor</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Vision Eye Test</div>
                      <div className="text-xs font-bold text-slate-900 mt-1">{selectedDriver.profile?.vision_test || "20/20"}</div>
                      <div className="text-[10px] text-slate-400">Optical Clearance</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Drug Screening</div>
                      <div className="text-xs font-bold text-emerald-600 mt-1">{selectedDriver.profile?.drug_test_status || "CLEARED"}</div>
                      <div className="text-[10px] text-slate-400">Tested: {selectedDriver.profile?.drug_test_date || "2026-06-01"}</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Last Checkup</div>
                      <div className="text-xs font-bold text-slate-900 mt-1">{selectedDriver.profile?.last_medical_checkup || "2026-05-10"}</div>
                      <div className="text-[10px] text-slate-500">Next Due: {selectedDriver.profile?.next_medical_due || "2027-05-10"}</div>
                    </div>
                  </div>

                  {/* Physician Notes */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      Medical Examiner Observations & Conditions
                    </div>
                    <p className="text-slate-800 bg-white p-3 rounded border border-slate-200 text-xs leading-relaxed font-medium">
                      {selectedDriver.profile?.medical_notes || "No underlying medical restrictions recorded. Cleared for long-haul duty."}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVE GOODS & ROUTE MINI-MAP */}
              {activeDossierTab === "active_mission" && (
                <div className="space-y-4">
                  {/* Mini-Map Visualizer */}
                  <DriverMiniMap
                    originName={selectedDriver.current_order?.origin_name || "Mumbai Air Cargo Terminal E Gate 12"}
                    destinationName={selectedDriver.current_order?.destination_name || "Delhi ICD Freight Depot"}
                    destinationLat={selectedDriver.current_order?.destination_lat || 28.5000}
                    destinationLng={selectedDriver.current_order?.destination_lng || 77.2800}
                    vehicleId={selectedDriver.current_vehicle?.id || selectedDriver.current_vehicle_id || "FLT-9821"}
                    licensePlate={selectedDriver.current_vehicle?.license_plate || "MH-04-TR-9981"}
                    speedKmH={selectedDriver.average_speed || 68}
                    cargoDescription={selectedDriver.current_order?.cargo_description || "Pharmaceutical Substrates"}
                  />

                  {selectedDriver.current_order ? (
                    <div className="bg-blue-50/90 border border-blue-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="w-5 h-5 text-blue-700" />
                          <span className="font-bold text-sm text-blue-950">Active Cargo Manifest: {selectedDriver.current_order.id}</span>
                        </div>
                        <span className="bg-blue-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {selectedDriver.current_order.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Goods Description</div>
                          <div className="text-sm font-bold text-slate-900">{selectedDriver.current_order.cargo_description}</div>
                          <div className="text-xs text-blue-700 font-mono font-semibold">Manifest Weight: {selectedDriver.current_order.weight} kg</div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Destination Hub</div>
                          <div className="text-sm font-bold text-slate-900">{selectedDriver.current_order.destination_name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            Coords: ({selectedDriver.current_order.destination_lat.toFixed(2)}, {selectedDriver.current_order.destination_lng.toFixed(2)})
                          </div>
                        </div>
                      </div>

                      {/* Assigned Vehicle info */}
                      {selectedDriver.current_vehicle && (
                        <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-bold text-slate-900">Vehicle: {selectedDriver.current_vehicle.id} ({selectedDriver.current_vehicle.license_plate})</div>
                              <div className="text-xs text-slate-500">{selectedDriver.current_vehicle.type} • Max Capacity {selectedDriver.current_vehicle.max_capacity} kg</div>
                            </div>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">
                            {selectedDriver.current_vehicle.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-slate-500" />
                        <div>
                          <div className="font-bold text-slate-800">No active cargo run assigned</div>
                          <div className="text-xs text-slate-500">Driver is ready for next dispatch from depot. Mini-map above depicts primary assigned route corridor.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DISPATCH & TRIP HISTORY */}
              {activeDossierTab === "dispatch_history" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Historical Dispatches & Completed Trips</h3>
                    <span className="text-xs text-slate-500 font-mono">Total Completed: <strong>{selectedDriver.dispatch_history?.length || 0} Records</strong></span>
                  </div>

                  {(!selectedDriver.dispatch_history || selectedDriver.dispatch_history.length === 0) ? (
                    <div className="bg-slate-50 p-6 text-center rounded-lg text-slate-500 italic">
                      No past trip records logged for this driver.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Trip Code</th>
                            <th className="p-2.5">Cargo Carried</th>
                            <th className="p-2.5">Origin → Destination</th>
                            <th className="p-2.5">Dispatch Date</th>
                            <th className="p-2.5">Punctuality</th>
                            <th className="p-2.5">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedDriver.dispatch_history.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold text-blue-700">{record.trip_code}</td>
                              <td className="p-2.5">
                                <div className="font-semibold text-slate-900">{record.cargo_description}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{record.cargo_weight} kg</div>
                              </td>
                              <td className="p-2.5 text-slate-700">
                                {record.origin} → <strong>{record.destination}</strong>
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono">{record.dispatch_time}</td>
                              <td className="p-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  record.on_time_status === "ON_TIME" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                }`}>
                                  {record.on_time_status}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold font-mono text-amber-500 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {record.rating || 5.0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: 30-DAY PRODUCTIVITY TRENDS (RECHARTS) */}
              {activeDossierTab === "performance" && (
                <div className="space-y-4">
                  {/* Productivity Line Chart Section */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          30-Day Productivity vs Fleet-Wide Average Baseline
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Comparing driver's 30-day performance trends directly against the active fleet-wide benchmark average.
                        </p>
                      </div>

                      {/* Metric Toggle Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                        <button
                          onClick={() => setActiveMetric("efficiency")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            activeMetric === "efficiency" 
                              ? "bg-white text-blue-700 shadow-sm font-bold" 
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Efficiency (%)
                        </button>
                        <button
                          onClick={() => setActiveMetric("safetyIndex")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            activeMetric === "safetyIndex" 
                              ? "bg-white text-emerald-700 shadow-sm font-bold" 
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Safety Index
                        </button>
                        <button
                          onClick={() => setActiveMetric("distanceKm")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            activeMetric === "distanceKm" 
                              ? "bg-white text-indigo-700 shadow-sm font-bold" 
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Distance (km)
                        </button>
                      </div>
                    </div>

                    {/* Comparative Fleet Benchmark Summary Pill */}
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                          Driver 30-Day Avg: <strong className="text-blue-700 font-mono text-sm">{selectedDriver.profile?.ontime_delivery_pct || 98.2}%</strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-400 inline-block"></span>
                          Fleet-Wide Average: <strong className="text-slate-700 font-mono">87.5%</strong>
                        </span>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-300 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        +10.7% Above Fleet Baseline
                      </div>
                    </div>

                    {/* Recharts Area / Line Chart Rendering */}
                    <div className="w-full h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={generate30DayProductivity(selectedDriver)}
                          margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                              <stop 
                                offset="5%" 
                                stopColor={
                                  activeMetric === "efficiency" ? "#2563EB" : activeMetric === "safetyIndex" ? "#059669" : "#6366F1"
                                } 
                                stopOpacity={0.3}
                              />
                              <stop 
                                offset="95%" 
                                stopColor={
                                  activeMetric === "efficiency" ? "#2563EB" : activeMetric === "safetyIndex" ? "#059669" : "#6366F1"
                                } 
                                stopOpacity={0.0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: "#64748b" }} 
                            tickLine={false}
                          />
                          <YAxis 
                            domain={activeMetric === "distanceKm" ? [100, 600] : [50, 100]} 
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#0f172a", 
                              borderRadius: "8px", 
                              borderColor: "#334155", 
                              color: "#fff",
                              fontSize: "12px",
                              padding: "8px 12px"
                            }}
                            labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                          <Area 
                            type="monotone" 
                            dataKey={activeMetric} 
                            name={
                              activeMetric === "efficiency" 
                                ? `${selectedDriver.name} Efficiency (%)` 
                                : activeMetric === "safetyIndex" 
                                ? `${selectedDriver.name} Safety Index` 
                                : `${selectedDriver.name} Distance (km)`
                            }
                            stroke={
                              activeMetric === "efficiency" ? "#2563EB" : activeMetric === "safetyIndex" ? "#059669" : "#6366F1"
                            } 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorMetric)" 
                          />
                          <Line
                            type="monotone"
                            dataKey={
                              activeMetric === "efficiency" 
                                ? "fleetEfficiency" 
                                : activeMetric === "safetyIndex" 
                                ? "fleetSafetyIndex" 
                                : "fleetDistanceKm"
                            }
                            name="Fleet Average Baseline Overlay"
                            stroke="#64748b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Performance Summary Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">30-Day Avg Productivity</div>
                      <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
                        {selectedDriver.profile?.ontime_delivery_pct || 98.2}%
                      </div>
                      <div className="text-[10px] text-slate-400">Punctuality Score</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Safety Score</div>
                      <div className={`text-2xl font-bold font-mono mt-1 ${
                        (selectedDriver.safety_score || 90) >= 90 ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {selectedDriver.safety_score || 90} / 100
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Defensive Driving Benchmark</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Driving Hours Today</div>
                      <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
                        {selectedDriver.driving_hours_today || 0} hrs
                      </div>
                      <div className="text-[10px] text-slate-400">Legal Limit: 8.0 hrs</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Sudden Braking</div>
                      <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
                        {selectedDriver.sudden_braking_events || 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Telemetry Events</div>
                    </div>
                  </div>

                  {/* Supervisor Evaluation */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Award className="w-4 h-4 text-amber-500" />
                        Supervisor Quality Assessment & Performance Review
                      </span>
                      <span className="font-bold text-amber-500 flex items-center gap-1 font-mono text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {selectedDriver.profile?.supervisor_rating || 4.8} / 5.0 Rating
                      </span>
                    </div>

                    <p className="text-slate-800 bg-white p-3 rounded border border-slate-200 text-xs leading-relaxed font-medium">
                      "{selectedDriver.profile?.supervisor_evaluation || "Demonstrates exceptional commitment to safety, defensive driving standards, and cargo protection."}"
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 6: LIVE DISPATCH CHAT */}
              {activeDossierTab === "chat" && (
                <DriverChat driver={selectedDriver} />
              )}

              {/* TAB 7: DOCUMENT CAMERA SCANNER */}
              {activeDossierTab === "documents" && (
                <DriverDocCamera driver={selectedDriver} />
              )}

              {/* TAB 8: SHIFT COMPLIANCE HEATMAP */}
              {activeDossierTab === "heatmap" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          30-Day Shift Compliance & Rest-Period Heatmap
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Visual record of shift attendance, HOS driving compliance (49 CFR § 395), mandatory 10-hr rest intervals, and check-in timeliness.
                        </p>
                      </div>

                      {/* Heatmap Legend */}
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600 inline-block"></span>
                          <span className="text-slate-700">Fully Compliant</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500 inline-block"></span>
                          <span className="text-slate-700">Rest Warning / Late</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600 inline-block"></span>
                          <span className="text-slate-700">Rest Violation / Missed</span>
                        </span>
                      </div>
                    </div>

                    {/* Heatmap Grid (30 Days) */}
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 pt-1">
                      {generate30DayShiftComplianceHeatmap(selectedDriver).map((day) => {
                        const isSelected = selectedHeatmapDay?.dateStr === day.dateStr;
                        let colorStyle = "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200";
                        if (day.status === "VIOLATION") {
                          colorStyle = "bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200 animate-pulse";
                        } else if (day.status === "WARNING") {
                          colorStyle = "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200";
                        }

                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => setSelectedHeatmapDay(day)}
                            className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-between h-16 ${colorStyle} ${
                              isSelected ? "ring-2 ring-blue-600 ring-offset-1 font-extrabold shadow-md" : ""
                            }`}
                          >
                            <div className="text-[9px] font-mono uppercase tracking-tighter opacity-80">{day.dayOfWeek}</div>
                            <div className="text-sm font-bold font-mono">{day.dayNum}</div>
                            <div className="text-[9px] font-semibold">
                              {day.status === "VIOLATION" ? "VIOLATION" : day.status === "WARNING" ? "WARN" : "OK"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Compliance Inspector Panel */}
                  {selectedHeatmapDay ? (
                    <div className="bg-white border-2 border-blue-500 p-4 rounded-xl shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {selectedHeatmapDay.dateStr} ({selectedHeatmapDay.dayOfWeek})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            selectedHeatmapDay.status === "VIOLATION" 
                              ? "bg-rose-100 text-rose-800 border-rose-300" 
                              : selectedHeatmapDay.status === "WARNING"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}>
                            {selectedHeatmapDay.status} AUDIT STATUS
                          </span>
                        </div>

                        <button 
                          onClick={() => setSelectedHeatmapDay(null)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Close Inspector
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Driving Hours Logged</div>
                          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{selectedHeatmapDay.drivingHours} hrs</div>
                          <div className="text-[10px] text-slate-400">FMCSA Limit: 8.0 hrs</div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Prior Off-Duty Rest</div>
                          <div className={`text-sm font-bold font-mono mt-0.5 ${
                            selectedHeatmapDay.restHours < 10 ? "text-rose-600" : "text-emerald-600"
                          }`}>
                            {selectedHeatmapDay.restHours} hrs
                          </div>
                          <div className="text-[10px] text-slate-400">Mandatory: 10.0 hrs</div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Shift Check-In Time</div>
                          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{selectedHeatmapDay.checkInTime}</div>
                          <div className={`text-[10px] font-bold ${
                            selectedHeatmapDay.checkInStatus === "LATE" ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {selectedHeatmapDay.checkInStatus}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Compliance Directive</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                            {selectedHeatmapDay.status === "VIOLATION" ? "Mandatory Safety Review" : "Full Clearance Verified"}
                          </div>
                          <div className="text-[10px] text-slate-400">TransitOps Audit Tag</div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border text-xs leading-relaxed font-medium ${
                        selectedHeatmapDay.status === "VIOLATION"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : selectedHeatmapDay.status === "WARNING"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}>
                        <strong>Shift Log Notes:</strong> {selectedHeatmapDay.notes}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl text-center text-slate-500 text-xs">
                      <Calendar className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      Click on any calendar day tile above to inspect detailed shift hours, rest breaks, and check-in verification records.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                <span>Driver Record Status: <strong className="text-slate-800">AUTHENTICATED BY TRANSITOPS CORE</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintProfile(selectedDriver)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  Print Profile / PDF
                </button>

                <button
                  onClick={() => handleDownloadShiftReport(selectedDriver)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Shift Report
                </button>

                <button
                  onClick={() => setSelectedDriver(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Message Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Send Broadcast Message ({selectedDriverIds.length} Drivers)</span>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Dispatch Emergency Broadcast Message</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type dispatch alert or operational notice to be broadcast to all selected drivers..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Bulk Shift Modal */}
      {showBulkShiftModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>Assign Bulk Shift / Depot ({selectedDriverIds.length} Drivers)</span>
              </div>
              <button 
                onClick={() => setShowBulkShiftModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Assigned Logistics Depot / Shift Hub</label>
              <select
                value={bulkShiftDepot}
                onChange={(e) => setBulkShiftDepot(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="Main Logistics Hub">Main Logistics Hub (Noida Depot)</option>
                <option value="North Terminal Depot">North Terminal Depot (Delhi Terminal)</option>
                <option value="West Corridor Hub">West Corridor Hub (Gurugram Depot)</option>
                <option value="East Express Depot">East Express Depot (Faridabad Hub)</option>
                <option value="Interstate Cargo Terminal">Interstate Cargo Terminal</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkShiftModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignBulkShift}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                Assign Shift Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW BATCH PRINT CONFIGURATION MODAL */}
      {showBatchPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-slate-700 max-w-2xl w-full rounded-xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#1E293B]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Batch Print Compliance Configuration</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      PDF REPORT GENERATOR
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Select driver profiles and choose sections to compile into a single paginated report</p>
                </div>
              </div>

              <button
                onClick={() => setShowBatchPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto font-mono text-xs">
              {/* Section Toggles */}
              <div className="bg-[#1E293B]/60 border border-slate-700/80 p-3 rounded-lg space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Included Report Modules</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded border border-slate-800">
                    <input
                      type="checkbox"
                      checked={includeComplianceMetrics}
                      onChange={(e) => setIncludeComplianceMetrics(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
                    />
                    <span>Compliance Metrics & DOT Violations</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-2 rounded border border-slate-800">
                    <input
                      type="checkbox"
                      checked={includeShiftLogs}
                      onChange={(e) => setIncludeShiftLogs(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
                    />
                    <span>Recent 30-Day Shift & HOS Logs</span>
                  </label>
                </div>
              </div>

              {/* Driver Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Drivers ({batchPrintSelectedDriverIds.length} of {drivers.length} selected)
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setBatchPrintSelectedDriverIds(drivers.map(d => d.id))}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setBatchPrintSelectedDriverIds([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {drivers.map((driver) => {
                    const isChecked = batchPrintSelectedDriverIds.includes(driver.id);
                    return (
                      <div
                        key={`batch-${driver.id}`}
                        onClick={() => {
                          setBatchPrintSelectedDriverIds(prev =>
                            prev.includes(driver.id)
                              ? prev.filter(id => id !== driver.id)
                              : [...prev, driver.id]
                          );
                        }}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-emerald-950/30 border-emerald-500/50 text-white"
                            : "bg-slate-900/50 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-xs">{driver.name}</div>
                            <div className="text-[10px] text-slate-400">{driver.id} • {driver.license_number}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          driver.profile?.medical_status === "FIT_FOR_DUTY"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}>
                          {driver.profile?.medical_status || "ACTIVE"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-[#1E293B]/30 flex items-center justify-between">
              <span className="text-xs text-slate-400">Generates printable paginated PDF layout</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchPrintModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchPrint}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Paginated PDF ({batchPrintSelectedDriverIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
