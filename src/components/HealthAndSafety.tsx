import React, { useState, useEffect } from "react";
import { 
  Gauge, 
  ShieldAlert, 
  Heart, 
  RefreshCw, 
  AlertTriangle, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Award, 
  Activity, 
  Calendar, 
  Wrench, 
  BarChart2,
  FileText,
  Search,
  ArrowUpDown,
  ThumbsUp,
  X,
  Phone,
  Mail,
  Send,
  Smartphone,
  Copy,
  Check,
  User
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  ReferenceLine,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { useToasts } from "./ToastProvider";

export default function HealthAndSafety() {
  const [metrics, setMetrics] = useState<any>({ health: [], safety: [] });
  const [loading, setLoading] = useState(false);
  const [safetyTab, setSafetyTab] = useState<"dashboard" | "incidents" | "compliance">("dashboard");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "braking" | "speeding" | "hours">("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [coachingStatus, setCoachingStatus] = useState<Record<string, { status: string; directive?: string; timestamp?: string }>>({});
  const [logActionText, setLogActionText] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { addToast } = useToasts();

  const driverContacts: Record<string, {
    phone: string;
    email: string;
    emergencyContact: string;
    bloodGroup: string;
    activeZone: string;
    license: string;
  }> = {
    "DRV-101": {
      phone: "+1 (555) 019-2831",
      email: "d.vasquez@transitops.io",
      emergencyContact: "Elena Vasquez (Spouse) // +1 (555) 019-2832",
      bloodGroup: "O+",
      activeZone: "Chicago Logistics Corridor",
      license: "DL-IL90210"
    },
    "DRV-102": {
      phone: "+1 (555) 019-3829",
      email: "r.chen@transitops.io",
      emergencyContact: "Mei Chen (Spouse) // +1 (555) 019-3830",
      bloodGroup: "A+",
      activeZone: "Indianapolis Hub Sector",
      license: "DL-IL90211"
    },
    "DRV-103": {
      phone: "+1 (555) 019-4721",
      email: "s.muller@transitops.io",
      emergencyContact: "Hans Muller (Father) // +1 (555) 019-4722",
      bloodGroup: "B-",
      activeZone: "Skyways Drone-Port West",
      license: "DL-IL90212"
    },
    "DRV-104": {
      phone: "+1 (555) 019-5810",
      email: "k.tanaka@transitops.io",
      emergencyContact: "Yuki Tanaka (Mother) // +1 (555) 019-5811",
      bloodGroup: "AB+",
      activeZone: "Detroit Beltway North",
      license: "DL-IL90213"
    },
    "DRV-105": {
      phone: "+1 (555) 019-6902",
      email: "a.petrov@transitops.io",
      emergencyContact: "Sasha Petrova (Sister) // +1 (555) 019-6903",
      bloodGroup: "O-",
      activeZone: "Milwaukee Express Arterial",
      license: "DL-IL90214"
    },
    "DRV-106": {
      phone: "+1 (555) 019-7993",
      email: "m.ross@transitops.io",
      emergencyContact: "Sarah Ross (Spouse) // +1 (555) 019-7994",
      bloodGroup: "A-",
      activeZone: "Inactive / On Leave",
      license: "DL-IL90215"
    }
  };

  const handleCopyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
    addToast({
      type: "success",
      title: "COPIED_TO_CLIPBOARD",
      message: `Successfully copied to clipboard: ${text}`,
    });
  };

  useEffect(() => {
    if (metrics.safety?.length > 0 && !selectedDriverId) {
      setSelectedDriverId(metrics.safety[0].driver_id);
    }
  }, [metrics.safety, selectedDriverId]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health-safety");
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "MEDIUM": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "HIGH": return "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse";
      default: return "text-gray-400";
    }
  };

  // Fleet Health overall score out of 100: calculate average of vehicle healths
  const avgHealth = metrics.health.length > 0
    ? Math.round(metrics.health.reduce((sum: number, h: any) => sum + h.health_percentage, 0) / metrics.health.length)
    : 81;

  // Driver names mapping for beautiful charts
  const getDriverName = (id: string) => {
    const mapping: Record<string, string> = {
      "DRV-101": "Vasquez",
      "DRV-102": "Chen",
      "DRV-103": "Muller",
      "DRV-104": "Tanaka",
      "DRV-105": "Petrov",
      "DRV-106": "Ross"
    };
    return mapping[id] || id;
  };

  // Calculate Predictive Health Score
  const calculatePredictiveHealthScore = (v: any) => {
    // Base score is 100
    let score = 100;
    
    // 1. Engine Hours Penalty (higher hours = lower health)
    const engineHrs = v.engine_hours || 0;
    const enginePenalty = Math.min(25, engineHrs * 0.04); // cap penalty at 25 points
    
    // 2. Total Distance Penalty (higher km = lower health)
    const totalKm = v.total_kilometers || 0;
    const distancePenalty = Math.min(30, totalKm * 0.003); // cap penalty at 30 points
    
    // 3. Time Since Last Service: Simulated dynamically based on kilometers modulo 15,000
    const simulatedMonths = Math.max(1, Math.min(12, Math.round((totalKm % 15000) / 1250) + 1));
    const servicePenalty = Math.min(25, simulatedMonths * 2); // cap penalty at 25 points
    
    score = score - enginePenalty - distancePenalty - servicePenalty;
    const finalScore = Math.max(15, Math.min(100, Math.round(score)));

    return {
      score: finalScore,
      engineHrs,
      totalKm: Math.round(totalKm),
      monthsSinceService: simulatedMonths,
      enginePenalty: enginePenalty.toFixed(1),
      distancePenalty: distancePenalty.toFixed(1),
      servicePenalty: servicePenalty.toFixed(1)
    };
  };

  // Prepare chart-ready driver data
  const chartSafetyData = (metrics.safety || []).map((drv: any) => ({
    driverId: drv.driver_id,
    name: getDriverName(drv.driver_id),
    suddenBraking: drv.sudden_braking_events,
    speeding: drv.speeding_events,
    fatigue: drv.fatigue_indicators,
    averageSpeed: drv.average_speed,
    drivingHours: drv.driving_hours_today,
    safetyScore: drv.safety_score
  }));

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fleet Score Circle card */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Overall Fleet Score</h3>
            <p className="text-xs text-[#8E9299]">Composite scoring calculated from system load, compliance certificates, and safety telemetry.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <span className="text-3xl font-bold text-white font-mono">{avgHealth}<span className="text-emerald-400 text-sm">%</span></span>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent border-r-transparent animate-[spin_4s_linear_infinite]" />
            </div>
            <div className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-widest mt-4">Vessel Health Standard: Optimal</div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono text-center border-t border-[#2A2D35] pt-3">
            Last calibrated: Just now
          </div>
        </div>

        {/* Cognitive Action Advice */}
        <div className="md:col-span-2 bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#2A2D35] pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">System Health Insights</h3>
                <p className="text-xs text-[#8E9299]">AI-driven optimization suggestions compiled from current metrics and audit records.</p>
              </div>
              <button onClick={fetchMetrics} className="p-1 text-gray-500 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#161922] border-l-2 border-amber-500 p-3 rounded">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>PREVENTATIVE REPAIR MANDATE: Unit FLT-2209</span>
                </div>
                <p className="text-gray-300 mt-1 leading-relaxed">
                  Unit health holds at 42% with active transmission warnings. Do not assign FLT-2209 to heavy freight loads until gearbox seals are certified.
                </p>
              </div>

              <div className="bg-[#161922] border-l-2 border-red-500 p-3 rounded">
                <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>COMPLIANCE WARNING: Operator Licensing</span>
                </div>
                <p className="text-gray-300 mt-1 leading-relaxed">
                  Driver K. Tanaka (DL-IL90213) holds an EXPIRED operator permit. Block dispatch actions until verification is filed.
                </p>
              </div>

              <div className="bg-[#161922] border-l-2 border-emerald-500 p-3 rounded">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ECO OPTIMIZATION RATIO</span>
                </div>
                <p className="text-gray-300 mt-1 leading-relaxed">
                  Average fleet carbon emissions fell to 15.2 Tons/month. Medium Van (FLT-4402) exhibits optimal efficiency of 8.4 km/L.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Predictive Health Scores */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
        <div className="border-b border-[#2A2D35] pb-3 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Vehicle Predictive Health Forecaster
            </h3>
            <p className="text-xs text-[#8E9299]">
              Algorithmic scoring model evaluating operational wear based on engine hours, total distance, and simulated service age.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#161922] border border-[#2A2D35] px-2.5 py-1 rounded text-[10px] font-mono text-[#4ADE80]">
            <Gauge className="w-3.5 h-3.5 animate-pulse" />
            <span>MODEL: WEAR-CALC-V3</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.health.map((v: any) => {
            const analysis = calculatePredictiveHealthScore(v);
            const scoreColor = 
              analysis.score >= 85 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
              analysis.score >= 70 ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" :
              "text-rose-400 border-rose-500/20 bg-rose-500/5";

            return (
              <div 
                key={v.vehicle_id} 
                className={`border border-[#2A2D35] rounded-lg p-4 font-mono text-xs flex flex-col justify-between hover:border-gray-500 transition-all ${scoreColor}`}
              >
                <div>
                  <div className="flex justify-between items-start border-b border-[#2A2D35]/50 pb-2 mb-3">
                    <div>
                      <span className="text-white font-bold text-sm">{v.vehicle_id}</span>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-wider mt-0.5">PREDICTIVE SCORE</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono tracking-tighter">{analysis.score}</span>
                      <span className="text-[10px] font-bold text-gray-500">/100</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px] text-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-3.5 h-3.5" /> Engine Hours:
                      </span>
                      <span className="text-white font-semibold">{analysis.engineHrs} hrs</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <TrendingUp className="w-3.5 h-3.5" /> Total Distance:
                      </span>
                      <span className="text-white font-semibold">{analysis.totalKm.toLocaleString()} km</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" /> Last Service:
                      </span>
                      <span className="text-white font-semibold">{analysis.monthsSinceService} mos ago</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2A2D35]/30 flex flex-wrap gap-1 text-[9px] text-gray-500 justify-between items-center">
                  <span>RISK THRESHOLD:</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${getRiskColor(v.risk_level)}`}>
                    {v.risk_level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Predictive Maintenance Ledger */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 lg:col-span-1">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-400" />
              Predictive Maintenance Ledger
            </h3>
            <p className="text-xs text-[#8E9299]">Estimated lifespan indicators calculated from vehicle mileage and operating temperature.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {metrics.health.map((v: any) => (
              <div key={v.vehicle_id} className="bg-[#161922] border border-[#2A2D35] p-3 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{v.vehicle_id}</span>
                    <span className="text-gray-500">({Math.round(v.total_kilometers)} km)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getRiskColor(v.risk_level)}`}>
                    {v.risk_level} RISK
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Vessel Core Health</span>
                    <span className="text-white font-bold">{v.health_percentage}%</span>
                  </div>
                  <div className="w-full bg-[#0C0E14] rounded-full h-1.5 overflow-hidden">
                    <div
                       className={`h-full rounded-full ${
                        v.health_percentage > 85 ? "bg-emerald-500" : v.health_percentage > 70 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${v.health_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] pt-1 text-gray-500 border-t border-[#2A2D35]/50">
                  <div>Engine hours: <span className="text-white">{v.engine_hours}h</span></div>
                  <div className="text-right">Next check: <span className="text-[#3B82F6]">{v.estimated_maintenance_date}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: Driver Safety Indicators & Trends Dashboard */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 lg:col-span-2">
          <div className="border-b border-[#2A2D35] pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#4ADE80]" />
                Driver Safety Dashboard
              </h3>
              <p className="text-xs text-[#8E9299]">Telemetry monitoring of driving hours, sudden braking, and average velocities.</p>
            </div>
          </div>

          {/* Sub-tab Toggle buttons */}
          <div className="flex border-b border-[#2A2D35] mb-4 text-xs font-mono">
            <button
              onClick={() => setSafetyTab("dashboard")}
              className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                safetyTab === "dashboard"
                  ? "border-[#4ADE80] text-white font-bold"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Compliance Dashboard
            </button>
            <button
              onClick={() => setSafetyTab("incidents")}
              className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                safetyTab === "incidents"
                  ? "border-[#4ADE80] text-white font-bold"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Braking & Speeding Trends
            </button>
            <button
              onClick={() => setSafetyTab("compliance")}
              className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                safetyTab === "compliance"
                  ? "border-[#4ADE80] text-white font-bold"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Driving Hours & Compliance
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {safetyTab === "dashboard" && (() => {
              const totalBrakingEvents = chartSafetyData.reduce((sum, d) => sum + d.suddenBraking, 0);
              const totalSpeedingEvents = chartSafetyData.reduce((sum, d) => sum + d.speeding, 0);
              const totalHours = chartSafetyData.reduce((sum, d) => sum + d.drivingHours, 0).toFixed(1);
              const avgSafetyScore = chartSafetyData.length > 0 
                ? (chartSafetyData.reduce((sum, d) => sum + d.safetyScore, 0) / chartSafetyData.length).toFixed(1)
                : "88.0";

              const sortedDrivers = [...chartSafetyData].filter(d => 
                d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                d.driverId.toLowerCase().includes(searchQuery.toLowerCase())
              ).sort((a, b) => {
                if (sortBy === "score") return b.safetyScore - a.safetyScore;
                if (sortBy === "braking") return b.suddenBraking - a.suddenBraking;
                if (sortBy === "speeding") return b.speeding - a.speeding;
                if (sortBy === "hours") return b.drivingHours - a.drivingHours;
                return 0;
              });

              const activeDriverData = chartSafetyData.find(d => d.driverId === selectedDriverId) || chartSafetyData[0];

              return (
                <div className="space-y-5">
                  {/* Fleet-wide Safety Scorecard Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded-lg font-mono">
                      <span className="text-[9px] text-[#8E9299] uppercase tracking-wider block">Avg Fleet Score</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-[#4ADE80]">{avgSafetyScore}</span>
                        <span className="text-[10px] text-gray-500">/100</span>
                      </div>
                    </div>
                    <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded-lg font-mono">
                      <span className="text-[9px] text-red-400 uppercase tracking-wider block">Harsh Braking</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-bold text-red-500">{totalBrakingEvents}</span>
                        <span className="text-[9px] text-gray-500">triggers</span>
                      </div>
                    </div>
                    <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded-lg font-mono">
                      <span className="text-[9px] text-amber-400 uppercase tracking-wider block">Speeding Events</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-bold text-amber-500">{totalSpeedingEvents}</span>
                        <span className="text-[9px] text-gray-500">violations</span>
                      </div>
                    </div>
                    <div className="bg-[#12141A] border border-[#2A2D35] p-3 rounded-lg font-mono">
                      <span className="text-[9px] text-[#4ADE80] uppercase tracking-wider block">Fleet Hours</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-bold text-white">{totalHours}h</span>
                        <span className="text-[9px] text-gray-500">today</span>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard and Drill-down Split panel */}
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                    {/* LEFT: Leaderboard table list (col-span-3) */}
                    <div className="xl:col-span-3 bg-[#12141A] border border-[#2A2D35] rounded-lg p-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#2A2D35]/50">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Operator Compliance Rankings</span>
                        
                        {/* Search and Sort tools */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="w-3 h-3 text-gray-500 absolute left-2 top-2.5" />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-[#161922] border border-[#2A2D35] text-white text-[10px] pl-7 pr-2 py-1.5 rounded focus:outline-none focus:border-emerald-500 w-28 font-sans"
                            />
                          </div>

                          {/* Sort Selector */}
                          <div className="flex items-center bg-[#161922] border border-[#2A2D35] rounded text-[9px] text-gray-400 px-1.5 py-1">
                            <ArrowUpDown className="w-2.5 h-2.5 mr-1" />
                            <select
                              value={sortBy}
                              onChange={(e: any) => setSortBy(e.target.value)}
                              className="bg-transparent border-none outline-none text-white cursor-pointer py-0.5 text-[9px] font-sans"
                            >
                              <option value="score" className="bg-[#0F1117] text-white">Score</option>
                              <option value="braking" className="bg-[#0F1117] text-white">Harsh Braking</option>
                              <option value="speeding" className="bg-[#0F1117] text-white">Speeding</option>
                              <option value="hours" className="bg-[#0F1117] text-white">Hours</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Table / List */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {sortedDrivers.map((drv, idx) => {
                          const isSelected = selectedDriverId === drv.driverId;
                          
                          // Rank medals or badges
                          let rankPill = (
                            <span className="w-5 h-5 rounded-full bg-[#1A1F2C] text-gray-400 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                          );
                          if (searchQuery === "") {
                            if (idx === 0) rankPill = <span className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 flex items-center justify-center font-bold text-[10px]">🏆</span>;
                            if (idx === 1) rankPill = <span className="w-5 h-5 rounded-full bg-slate-400/10 border border-slate-400/30 text-slate-300 flex items-center justify-center font-bold text-[10px]">🥈</span>;
                            if (idx === 2) rankPill = <span className="w-5 h-5 rounded-full bg-amber-700/10 border border-amber-700/30 text-amber-600 flex items-center justify-center font-bold text-[10px]">🥉</span>;
                          }

                          // Determine safety color
                          const scoreColor = 
                            drv.safetyScore >= 90 ? "text-emerald-400" : 
                            drv.safetyScore >= 80 ? "text-yellow-400" : "text-rose-400 animate-pulse";

                          return (
                            <div
                              key={drv.driverId}
                              onClick={() => setSelectedDriverId(drv.driverId)}
                              className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? "bg-[#1E293B]/70 border-emerald-500/50 shadow-md" 
                                  : "bg-[#161922] border-[#2A2D35] hover:border-gray-500"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {rankPill}
                                <div>
                                  <div className="text-white font-bold text-[11px] flex items-center gap-1.5">
                                    <span>{drv.name}</span>
                                    <span className="text-[9px] text-gray-500 font-normal">({drv.driverId})</span>
                                  </div>
                                  <div className="flex gap-2 text-[9px] text-gray-400 mt-0.5">
                                    <span className="flex items-center gap-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                                      {drv.suddenBraking} Braking
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block"></span>
                                      {drv.speeding} Speeding
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[9px] text-gray-500 uppercase block">Score</span>
                                <span className={`text-xs font-bold font-mono ${scoreColor}`}>{drv.safetyScore}</span>
                              </div>
                            </div>
                          );
                        })}

                        {sortedDrivers.length === 0 && (
                          <div className="text-center py-8 text-gray-500 text-xs">
                            No operators match search filters.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Detailed Operator Drill-down Compliance Card (col-span-2) */}
                    <div className="xl:col-span-2 bg-[#161922] border border-[#2A2D35] rounded-lg p-3 flex flex-col justify-between">
                      {activeDriverData ? (
                        <div className="space-y-4">
                          <div className="border-b border-[#2A2D35]/50 pb-2 flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Operator Profile</span>
                              <span className="text-white font-bold text-xs">{activeDriverData.name} ({activeDriverData.driverId})</span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              activeDriverData.safetyScore >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              activeDriverData.safetyScore >= 80 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                              "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                            }`}>
                              {activeDriverData.safetyScore >= 90 ? "GRADE A" : activeDriverData.safetyScore >= 80 ? "GRADE B" : "RISK LEVEL C"}
                            </span>
                          </div>

                          {/* Telemetry Visual Progress bars */}
                          <div className="space-y-3 font-mono text-[10px]">
                            <div>
                              <div className="flex justify-between text-gray-400 mb-1">
                                <span>Safety Score Index</span>
                                <span className="text-white font-semibold">{activeDriverData.safetyScore}%</span>
                              </div>
                              <div className="w-full bg-[#0C0E14] rounded-full h-1.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    activeDriverData.safetyScore >= 90 ? "bg-emerald-500" : activeDriverData.safetyScore >= 80 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${activeDriverData.safetyScore}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-gray-400 mb-1">
                                <span>Hours Driven Today</span>
                                <span className={`font-semibold ${activeDriverData.drivingHours > 8.0 ? "text-red-400 font-bold" : "text-white"}`}>
                                  {activeDriverData.drivingHours}h / 8h
                                </span>
                              </div>
                              <div className="w-full bg-[#0C0E14] rounded-full h-1.5">
                                <div
                                  className={`h-full rounded-full ${
                                    activeDriverData.drivingHours > 8.0 ? "bg-red-500 animate-pulse" : "bg-blue-500"
                                  }`}
                                  style={{ width: `${Math.min(100, (activeDriverData.drivingHours / 8) * 100)}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-gray-400 mb-1">
                                <span>Harsh Braking Incidents</span>
                                <span className={`font-semibold ${activeDriverData.suddenBraking > 2 ? "text-red-400 font-bold" : "text-white"}`}>
                                  {activeDriverData.suddenBraking} triggers
                                </span>
                              </div>
                              <div className="w-full bg-[#0C0E14] rounded-full h-1.5">
                                <div
                                  className={`h-full rounded-full ${
                                    activeDriverData.suddenBraking > 2 ? "bg-red-500" : "bg-red-400/60"
                                  }`}
                                  style={{ width: `${Math.min(100, (activeDriverData.suddenBraking / 5) * 100)}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-gray-400 mb-1">
                                <span>Over-Speed Incidents</span>
                                <span className={`font-semibold ${activeDriverData.speeding > 3 ? "text-red-400 font-bold" : "text-white"}`}>
                                  {activeDriverData.speeding} triggers
                                </span>
                              </div>
                              <div className="w-full bg-[#0C0E14] rounded-full h-1.5">
                                <div
                                  className={`h-full rounded-full ${
                                    activeDriverData.speeding > 3 ? "bg-red-500" : "bg-yellow-400"
                                  }`}
                                  style={{ width: `${Math.min(100, (activeDriverData.speeding / 6) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Driver Contact & Communication Details */}
                          {(() => {
                            const contact = driverContacts[activeDriverData.driverId];
                            if (!contact) return null;
                            return (
                              <div className="bg-[#12141A] border border-[#2A2D35] rounded-lg p-3 space-y-3 font-mono text-[10px]">
                                <div className="border-b border-[#2A2D35]/50 pb-1.5 flex justify-between items-center">
                                  <span className="text-white font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-blue-400" />
                                    Contact & Communications
                                  </span>
                                  <span className="text-[8px] text-[#3B82F6] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest">REGISTRIES ACTIVE</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                                  <div className="space-y-0.5">
                                    <span className="text-gray-500 block uppercase text-[8px] font-bold">Mobile Number</span>
                                    <div className="flex items-center gap-1.5 text-gray-200">
                                      <Phone className="w-3 h-3 text-emerald-400" />
                                      <a href={`tel:${contact.phone}`} className="hover:underline hover:text-emerald-400 font-semibold">{contact.phone}</a>
                                      <button 
                                        onClick={() => handleCopyToClipboard(contact.phone, `${activeDriverData.driverId}-phone`)} 
                                        className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                        title="Copy Phone Number"
                                      >
                                        {copiedId === `${activeDriverData.driverId}-phone` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-0.5">
                                    <span className="text-gray-500 block uppercase text-[8px] font-bold">Secure Email</span>
                                    <div className="flex items-center gap-1.5 text-gray-200 min-w-0">
                                      <Mail className="w-3 h-3 text-blue-400" />
                                      <a href={`mailto:${contact.email}`} className="hover:underline hover:text-blue-400 truncate font-semibold block min-w-0" title={contact.email}>{contact.email}</a>
                                      <button 
                                        onClick={() => handleCopyToClipboard(contact.email, `${activeDriverData.driverId}-email`)} 
                                        className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0 cursor-pointer"
                                        title="Copy Email Address"
                                      >
                                        {copiedId === `${activeDriverData.driverId}-email` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-0.5 sm:col-span-2 border-t border-[#2A2D35]/30 pt-2">
                                    <span className="text-gray-500 block uppercase text-[8px] font-bold">Emergency Point-of-Contact</span>
                                    <div className="text-gray-200 flex items-center gap-1.5 font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
                                      <span>{contact.emergencyContact}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-0.5 border-t border-[#2A2D35]/30 pt-2">
                                    <span className="text-gray-500 block uppercase text-[8px] font-bold">Active Route Corridor</span>
                                    <span className="text-emerald-400 font-semibold">{contact.activeZone}</span>
                                  </div>

                                  <div className="space-y-0.5 border-t border-[#2A2D35]/30 pt-2">
                                    <span className="text-gray-500 block uppercase text-[8px] font-bold">Blood Registry</span>
                                    <span className="text-rose-400 font-semibold">{contact.bloodGroup}</span>
                                  </div>
                                </div>

                                {/* Direct Mobile Dispatch Terminal */}
                                <div className="border-t border-[#2A2D35]/50 pt-2.5 space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400 uppercase text-[8px] font-bold tracking-wider flex items-center gap-1">
                                      <Smartphone className="w-3 h-3 text-blue-400" />
                                      Dispatch Instant SMS Alert
                                    </span>
                                    <span className="text-[7px] text-emerald-500 font-mono">SECURED CHANNEL</span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder={`Send secure SMS to ${activeDriverData.name}...`}
                                      value={smsMessage}
                                      onChange={(e) => setSmsMessage(e.target.value)}
                                      className="bg-[#161922] border border-[#2A2D35] rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500 flex-1 font-sans"
                                    />
                                    <button
                                      onClick={() => {
                                        if (!smsMessage.trim()) return;
                                        addToast({
                                          type: "success",
                                          title: "SMS_DISPATCHED",
                                          message: `Sent to ${activeDriverData.name} at ${contact.phone}: "${smsMessage}"`,
                                        });
                                        setSmsMessage("");
                                      }}
                                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer uppercase flex items-center gap-1"
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                      Send
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Recent Alerts / Audit logs */}
                          <div className="bg-[#0C0E14] border border-[#2A2D35] rounded p-2 text-[9px] font-mono space-y-1.5 text-gray-400">
                            <span className="text-[10px] text-white font-bold uppercase block tracking-wider mb-1">Telemetry Alert Log</span>
                            {activeDriverData.suddenBraking > 0 ? (
                              <div className="flex gap-1 items-start text-red-400">
                                <span>⚠️</span>
                                <span>Decelerations: {activeDriverData.suddenBraking} high-G triggers.</span>
                              </div>
                            ) : (
                              <div className="text-emerald-400 flex gap-1 items-start">
                                <span>✓</span>
                                <span>Smooth deceleration metrics logged.</span>
                              </div>
                            )}
                            {activeDriverData.speeding > 0 ? (
                              <div className="flex gap-1 items-start text-amber-400">
                                <span>⚠️</span>
                                <span>Speedometer: {activeDriverData.speeding} velocity spikes.</span>
                              </div>
                            ) : (
                              <div className="text-emerald-400 flex gap-1 items-start">
                                <span>✓</span>
                                <span>Governed velocity: compliant.</span>
                              </div>
                            )}
                            {coachingStatus[activeDriverData.driverId] && (
                              <div className="mt-1 pt-1 border-t border-[#2A2D35]/50 flex gap-1 items-start text-[#4ADE80]">
                                <span>★</span>
                                <span>DIRECTIVE: {coachingStatus[activeDriverData.driverId].directive} ({coachingStatus[activeDriverData.driverId].status})</span>
                              </div>
                            )}
                          </div>

                          {/* Custom Coaching Input */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-gray-500 uppercase block font-bold">Log Safety Directive</span>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="Assign speed limits training..."
                                value={logActionText}
                                onChange={(e) => setLogActionText(e.target.value)}
                                className="bg-[#0F1117] border border-[#2A2D35] rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500 flex-1 font-sans"
                              />
                              <button
                                onClick={() => {
                                  if (!logActionText.trim()) return;
                                  setCoachingStatus(prev => ({
                                    ...prev,
                                    [activeDriverData.driverId]: {
                                      status: "ACTIVE",
                                      directive: logActionText,
                                      timestamp: new Date().toLocaleTimeString()
                                    }
                                  }));
                                  setLogActionText("");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] px-2 py-1 rounded cursor-pointer uppercase font-mono"
                              >
                                Dispatch
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-500 text-xs">
                          Select an operator to begin telemetry review.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {safetyTab === "incidents" && (
              <div className="bg-[#12141A] border border-[#2A2D35] rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-[#2A2D35]/50 pb-2">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Harsh Driving Incidents by Driver</span>
                  <span className="text-[9px] text-[#4ADE80] font-bold">LOWER IS SAFER</span>
                </div>
                
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartSafetyData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white", fontSize: "11px", fontFamily: "monospace" }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                      <Bar name="Sudden Braking Events" dataKey="suddenBraking" fill="#F87171" radius={[2, 2, 0, 0]} />
                      <Bar name="Speeding Events" dataKey="speeding" fill="#FBBF24" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-[#8E9299] leading-relaxed italic">
                  Note: Operators exceeding 2 sudden braking events or 3 speeding events are flagged for preventative safety coaching.
                </p>
              </div>
            )}

            {safetyTab === "compliance" && (
              <div className="bg-[#12141A] border border-[#2A2D35] rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-[#2A2D35]/50 pb-2">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Driving Hour Compliance Matrix</span>
                  <span className="text-[9px] text-red-400 font-bold">8.0 HOUR LIMIT</span>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSafetyData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white", fontSize: "11px", fontFamily: "monospace" }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                      <ReferenceLine y={8.0} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '8h Limit', position: 'insideTopLeft', fill: '#EF4444', fontSize: 9, fontFamily: 'monospace' }} />
                      <Area name="Hours Driven Today" type="monotone" dataKey="drivingHours" stroke="#10B981" fillOpacity={1} fill="url(#colorHours)" />
                      <Line name="Avg Speed (km/h)" type="monotone" dataKey="averageSpeed" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Target Max driving hours rule:</span>
                    <span className="text-white font-bold">8.0 hrs / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical over-work warnings:</span>
                    <span className="text-rose-400 font-bold">
                      {chartSafetyData.filter(d => d.drivingHours > 8.0).length > 0 
                        ? `${chartSafetyData.filter(d => d.drivingHours > 8).map(d => d.name).join(", ")} exceeded limit`
                        : "None (Fully Compliant)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
