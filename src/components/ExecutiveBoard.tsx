import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { DollarSign, ShieldCheck, Flame, Gauge, TrendingUp, Droplets, Scale, Users, ArrowRightLeft, Sparkles, Wrench, AlertTriangle, Lightbulb, PiggyBank } from "lucide-react";

interface DriverPerformanceMetrics {
  id: string;
  name: string;
  code: string;
  avatar: string;
  metrics: {
    punctuality: number;
    safetyIndex: number;
    ecoDriving: number;
    hosCompliance: number;
    vehicleCare: number;
    customerRating: number;
  };
}

const BENCHMARK_DRIVERS: DriverPerformanceMetrics[] = [
  {
    id: "drv-801",
    name: "Vikramaditya Sharma",
    code: "DRV-801",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    metrics: { punctuality: 98, safetyIndex: 99, ecoDriving: 94, hosCompliance: 96, vehicleCare: 92, customerRating: 98 }
  },
  {
    id: "drv-802",
    name: "Rajesh Kumar V",
    code: "DRV-802",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    metrics: { punctuality: 94, safetyIndex: 98, ecoDriving: 91, hosCompliance: 99, vehicleCare: 95, customerRating: 95 }
  },
  {
    id: "drv-803",
    name: "Ananya Deshmukh",
    code: "DRV-803",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    metrics: { punctuality: 96, safetyIndex: 97, ecoDriving: 98, hosCompliance: 92, vehicleCare: 90, customerRating: 97 }
  },
  {
    id: "drv-101",
    name: "Marcus Vance",
    code: "DRV-101",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    metrics: { punctuality: 91, safetyIndex: 92, ecoDriving: 88, hosCompliance: 95, vehicleCare: 89, customerRating: 90 }
  },
  {
    id: "drv-102",
    name: "Elena Rostova",
    code: "DRV-102",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    metrics: { punctuality: 99, safetyIndex: 89, ecoDriving: 86, hosCompliance: 90, vehicleCare: 87, customerRating: 96 }
  }
];

export default function ExecutiveBoard() {
  const [driverAId, setDriverAId] = useState("drv-801");
  const [driverBId, setDriverBId] = useState("drv-802");

  const driverA = BENCHMARK_DRIVERS.find((d) => d.id === driverAId) || BENCHMARK_DRIVERS[0];
  const driverB = BENCHMARK_DRIVERS.find((d) => d.id === driverBId) || BENCHMARK_DRIVERS[1];

  const radarData = [
    { subject: "Punctuality", A: driverA.metrics.punctuality, B: driverB.metrics.punctuality, fullMark: 100 },
    { subject: "Safety Index", A: driverA.metrics.safetyIndex, B: driverB.metrics.safetyIndex, fullMark: 100 },
    { subject: "Eco Driving", A: driverA.metrics.ecoDriving, B: driverB.metrics.ecoDriving, fullMark: 100 },
    { subject: "HOS Compliance", A: driverA.metrics.hosCompliance, B: driverB.metrics.hosCompliance, fullMark: 100 },
    { subject: "Vehicle Care", A: driverA.metrics.vehicleCare, B: driverB.metrics.vehicleCare, fullMark: 100 },
    { subject: "Customer Rating", A: driverA.metrics.customerRating, B: driverB.metrics.customerRating, fullMark: 100 },
  ];
  const fuelCostData = [
    { month: "Jan", expenditure: 4500, carbon: 12.4 },
    { month: "Feb", expenditure: 5200, carbon: 14.1 },
    { month: "Mar", expenditure: 4900, carbon: 13.5 },
    { month: "Apr", expenditure: 6100, carbon: 16.8 },
    { month: "May", expenditure: 5800, carbon: 15.9 },
    { month: "Jun", expenditure: 6700, carbon: 18.2 },
  ];

  // Detailed Monthly Fuel efficiency data across the entire fleet
  const fuelEfficiencyData = [
    { month: "Jan", consumption: 3100, distance: 22010, distanceScaled: 2201, efficiency: 7.1 },
    { month: "Feb", consumption: 3550, distance: 25560, distanceScaled: 2556, efficiency: 7.2 },
    { month: "Mar", consumption: 3300, distance: 24750, distanceScaled: 2475, efficiency: 7.5 },
    { month: "Apr", consumption: 4150, distance: 30295, distanceScaled: 3029, efficiency: 7.3 },
    { month: "May", consumption: 3900, distance: 29640, distanceScaled: 2964, efficiency: 7.6 },
    { month: "Jun", consumption: 4450, distance: 34710, distanceScaled: 3471, efficiency: 7.8 },
  ];

  const maintenanceData = [
    { name: "Heavy Truck", cost: 12400, downtime: 42 },
    { name: "Medium Van", cost: 5800, downtime: 18 },
    { name: "Cargo Drone", cost: 1200, downtime: 4 },
  ];

  // 12-month vehicle mileage vs repair frequency & expenditure correlation data
  const maintenanceEfficiencyData = [
    { month: "Aug '25", avgMileageK: 42, repairExpenditure: 2800, repairFrequency: 2, costPerMile: 0.22 },
    { month: "Sep '25", avgMileageK: 51, repairExpenditure: 3100, repairFrequency: 2, costPerMile: 0.23 },
    { month: "Oct '25", avgMileageK: 63, repairExpenditure: 3600, repairFrequency: 3, costPerMile: 0.24 },
    { month: "Nov '25", avgMileageK: 75, repairExpenditure: 4200, repairFrequency: 4, costPerMile: 0.26 },
    { month: "Dec '25", avgMileageK: 88, repairExpenditure: 5100, repairFrequency: 5, costPerMile: 0.28 },
    { month: "Jan '26", avgMileageK: 102, repairExpenditure: 6400, repairFrequency: 6, costPerMile: 0.31 },
    { month: "Feb '26", avgMileageK: 118, repairExpenditure: 7900, repairFrequency: 8, costPerMile: 0.35 },
    { month: "Mar '26", avgMileageK: 132, repairExpenditure: 10200, repairFrequency: 11, costPerMile: 0.42 },
    { month: "Apr '26", avgMileageK: 148, repairExpenditure: 13800, repairFrequency: 15, costPerMile: 0.52 },
    { month: "May '26", avgMileageK: 165, repairExpenditure: 17500, repairFrequency: 20, costPerMile: 0.64 },
    { month: "Jun '26", avgMileageK: 182, repairExpenditure: 21200, repairFrequency: 26, costPerMile: 0.78 },
    { month: "Jul '26", avgMileageK: 198, repairExpenditure: 25800, repairFrequency: 32, costPerMile: 0.91 },
  ];

  const utilizationData = [
    { name: "On Trip (Active)", value: 65, color: "#10B981" },
    { name: "Idle Standby", value: 25, color: "#3B82F6" },
    { name: "In Maintenance", value: 10, color: "#EF4444" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-lg font-mono">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Monthly Fuel Expenditure</div>
          <div className="text-xl font-bold text-white mt-1">$6,700</div>
          <div className="text-[10px] text-[#4ADE80] mt-0.5">+4.2% from last month</div>
        </div>

        <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-lg font-mono">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Active Fleet Utilization</div>
          <div className="text-xl font-bold text-white mt-1">84.2%</div>
          <div className="text-[10px] text-[#4ADE80] mt-0.5">Optimal operations target</div>
        </div>

        <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-lg font-mono">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Estimated Carbon Footprint</div>
          <div className="text-xl font-bold text-white mt-1">18.2 Tons</div>
          <div className="text-[10px] text-red-400 mt-0.5">+5.8% urban freight load</div>
        </div>

        <div className="bg-[#0F1117] border border-[#2A2D35] p-4 rounded-lg font-mono">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Delivery Success Rate</div>
          <div className="text-xl font-bold text-white mt-1">99.12%</div>
          <div className="text-[10px] text-[#4ADE80] mt-0.5">0.14s dispatch recovery</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenditure & Carbon footprint Area chart */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Expenditure & Carbon Footprint</h3>
            <p className="text-xs text-[#8E9299]">Analysis of monthly diesel fuel cost vs estimated total greenhouse output.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fuelCostData}>
                <defs>
                  <linearGradient id="colorExpenditure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white" }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                <Area type="monotone" name="Fuel ($)" dataKey="expenditure" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenditure)" />
                <Area type="monotone" name="Carbon (Tons)" dataKey="carbon" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCarbon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance cost and Downtime bar chart */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Downtime & Maintenance Costs</h3>
            <p className="text-xs text-[#8E9299]">Aggregated expenses vs total cumulative days spent in maintenance by vehicle type.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceData}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white" }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                <Bar name="Maintenance ($)" dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar name="Downtime (Hours)" dataKey="downtime" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Allocation pie chart */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Vessel Allocation Profile</h3>
            <p className="text-xs text-[#8E9299]">Current distribution of all vehicles across trip, standby, and repair statuses.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around h-60">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {utilizationData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-400">{entry.name}:</span>
                  <span className="text-white font-bold">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Driver Productivity rating block */}
        <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
          <div className="border-b border-[#2A2D35] pb-3 mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Driver Productivity Rating</h3>
            <p className="text-xs text-[#8E9299]">Active driver delivery efficiency compared against route optimization models.</p>
          </div>
          <div className="space-y-4 font-mono text-xs">
            {[
              { name: "R. Chen", rating: "98.2%", miles: "420 km", status: "EXCELLENT" },
              { name: "D. Vasquez", rating: "94.5%", miles: "380 km", status: "OPTIMAL" },
              { name: "S. Muller", rating: "96.1%", miles: "150 km", status: "EXCELLENT" },
              { name: "A. Petrov", rating: "88.4%", miles: "310 km", status: "SAFE" },
            ].map((dr, index) => (
              <div key={index} className="bg-[#161922] border border-[#2A2D35] p-3 rounded flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">{dr.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Total transit pathing: {dr.miles}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">{dr.rating}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">
                    {dr.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW SECTION: Top Performers Driver Ranking Widget */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
        <div className="border-b border-[#2A2D35] pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Top Performers Leaderboard
            </h3>
            <p className="text-xs text-[#8E9299]">
              Driver performance rankings evaluated across delivery efficiency, safety compliance index, and client feedback ratings.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
            MONTHLY EXECUTIVE AUDIT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            {
              rank: 1,
              name: "Vikramaditya Sharma",
              code: "DRV-801",
              deliveryEfficiency: "98.8%",
              safetyScore: "99.2",
              clientFeedback: "4.95 / 5.0",
              tripsCompleted: 142,
              badge: "🏆 ELITE MASTER DRIVER",
              badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
            },
            {
              rank: 2,
              name: "Rajesh Kumar V",
              code: "DRV-802",
              deliveryEfficiency: "97.4%",
              safetyScore: "98.5",
              clientFeedback: "4.88 / 5.0",
              tripsCompleted: 128,
              badge: "🥈 PRECISION CAPTAIN",
              badgeColor: "bg-slate-300/20 text-slate-200 border-slate-300/30"
            },
            {
              rank: 3,
              name: "Ananya Deshmukh",
              code: "DRV-803",
              deliveryEfficiency: "96.9%",
              safetyScore: "97.8",
              clientFeedback: "4.85 / 5.0",
              tripsCompleted: 119,
              badge: "🥉 SAFETY SENTINEL",
              badgeColor: "bg-orange-600/20 text-orange-300 border-orange-500/30"
            }
          ].map((driver) => (
            <div key={driver.code} className="bg-[#141720] border border-[#2A2D35] rounded-lg p-4 space-y-3 hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start border-b border-[#2A2D35] pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-sm">#{driver.rank}</span>
                    <span className="text-white font-bold text-sm">{driver.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{driver.code} • {driver.tripsCompleted} Trips</span>
                </div>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${driver.badgeColor}`}>
                  {driver.badge}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Delivery Efficiency:</span>
                  <span className="text-white font-bold">{driver.deliveryEfficiency}</span>
                </div>
                <div className="w-full bg-[#0F1117] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: driver.deliveryEfficiency }}></div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-400">Safety Compliance:</span>
                  <span className="text-emerald-400 font-bold">{driver.safetyScore} / 100</span>
                </div>
                <div className="w-full bg-[#0F1117] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${driver.safetyScore}%` }}></div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-400">Client Feedback Rating:</span>
                  <span className="text-amber-400 font-bold">⭐ {driver.clientFeedback}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW SECTION: Fuel Efficiency & Consumption Trend Chart */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5">
        <div className="border-b border-[#2A2D35] pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              Fleet Fuel Efficiency & Consumption Analytics
            </h3>
            <p className="text-xs text-[#8E9299]">
              Visual analysis mapping monthly total fuel expenditure, fleet consumption metrics, and aggregate fuel efficiency trends.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#161922] border border-[#2A2D35] px-2.5 py-1 rounded text-[10px] font-mono text-cyan-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Target Efficiency: 7.5 km/L</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Recharts Double Axis chart */}
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelEfficiencyData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                {/* YAxis left for Fuel consumption and scaled distance covered */}
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={10} tickLine={false} label={{ value: 'Consumption (L) / Distance (km / 10)', angle: -90, position: 'insideLeft', offset: 10, fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }} />
                {/* YAxis right for efficiency (km/L) */}
                <YAxis yAxisId="right" orientation="right" domain={[6, 9]} stroke="#10B981" fontSize={10} tickLine={false} label={{ value: 'Efficiency (km/L)', angle: 90, position: 'insideRight', offset: 10, fill: '#10B981', fontSize: 10, fontFamily: 'monospace' }} />
                
                <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white", fontSize: "11px", fontFamily: "monospace" }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                
                {/* Bar for fuel consumption volume */}
                <Bar yAxisId="left" name="Consumption (Liters)" dataKey="consumption" fill="#D97706" radius={[3, 3, 0, 0]} barSize={20} />
                {/* Bar for distance covered */}
                <Bar yAxisId="left" name="Distance (km / 10)" dataKey="distanceScaled" fill="#3B82F6" radius={[3, 3, 0, 0]} barSize={20} />
                {/* Line for fuel efficiency trend */}
                <Line yAxisId="right" name="Efficiency (km/L)" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={3} dot={{ r: 4, stroke: "#10B981", strokeWidth: 2 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics sidebar for fuel */}
          <div className="space-y-4 font-mono text-xs bg-[#161922] border border-[#2A2D35] rounded-lg p-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] border-b border-[#2A2D35]/50 pb-2 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-yellow-500" />
              Efficiency Ledger (YTD)
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#2A2D35]/30">
                <span className="text-gray-500">Peak Fleet Efficiency:</span>
                <span className="text-emerald-400 font-bold">7.8 km/L (Jun)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2A2D35]/30">
                <span className="text-gray-500">Cumulative Cost reduction:</span>
                <span className="text-emerald-400 font-bold">12.4% YTD</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2A2D35]/30">
                <span className="text-gray-500">Total volume consumed:</span>
                <span className="text-white font-bold">22,950 Liters</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Optimal Fleet speed:</span>
                <span className="text-amber-400 font-bold">62 - 75 km/h</span>
              </div>
            </div>

            <div className="bg-[#0F1117] border border-[#2A2D35] p-3 rounded text-[10px] leading-relaxed text-[#8E9299]">
              <span className="text-white font-bold uppercase text-[9px] block mb-1">💡 COGNITIVE ACTION ADVICE</span>
              Transitioning fleet routing corridors to night transit reduced idling times by 24.5%, directly facilitating the peak 7.8 km/L efficiency observed in June.
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Asset Utilization Efficiency & Fleet Redistribution Engine */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 space-y-5 font-sans">
        <div className="border-b border-[#2A2D35] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">
                Asset Utilization Efficiency & Fleet Redistribution Engine
              </h3>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                HISTORICAL DISPATCH ANALYTICS
              </span>
            </div>
            <p className="text-xs text-[#8E9299] mt-0.5">
              Identifies under-utilized vehicle classes using historical trip telemetry and generates cost-optimization redistribution strategies.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-gray-400">Potential Cost Recovery:</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded font-bold">
              +$24,900 / Month Saved
            </span>
          </div>
        </div>

        {/* Vehicle Class Efficiency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {[
            {
              class: "Heavy Duty Sleeper",
              activeCount: 14,
              utilization: 42.8,
              target: 80.0,
              costLeak: "-$14,200/mo",
              status: "CRITICAL UNDER-UTILIZED",
              statusBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
              strategyTitle: "JNPT Port Hub ➔ Pune Corridor Shift",
              strategyDesc: "Redistribute 4 Heavy Sleepers from Mumbai JNPT to Pune Industrial Corridor to absorb +38% peak freight demand.",
              badgeColor: "bg-amber-600"
            },
            {
              class: "Refrigerated Trailer",
              activeCount: 8,
              utilization: 51.5,
              target: 78.0,
              costLeak: "-$8,600/mo",
              status: "MODERATE LEAKAGE",
              statusBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              strategyTitle: "Pharma Night Cold-Chain Express",
              strategyDesc: "Convert 3 idle refrigerated units to overnight pharmaceutical cold-chain delivery runs between Hyderabad & Chennai.",
              badgeColor: "bg-blue-600"
            },
            {
              class: "EV Last-Mile Freight",
              activeCount: 22,
              utilization: 89.2,
              target: 85.0,
              costLeak: "$0/mo (Optimal)",
              status: "HIGH EFFICIENCY",
              statusBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
              strategyTitle: "Urban Grocery Night-Shift Rotation",
              strategyDesc: "Maintain current 24/7 delivery roster. Battery thermal degradation within 2.1% optimal tolerance.",
              badgeColor: "bg-emerald-600"
            },
            {
              class: "Medium Rigid Freight",
              activeCount: 18,
              utilization: 76.4,
              target: 80.0,
              costLeak: "-$2,100/mo",
              status: "BALANCED",
              statusBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
              strategyTitle: "Inter-City Feeder Balancing",
              strategyDesc: "Reassign 2 idle rigid units from Sector 62 depot to regional feeder loops.",
              badgeColor: "bg-indigo-600"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#141720] border border-[#2A2D35] rounded-lg p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2">
                  <div>
                    <div className="text-white font-bold text-sm">{item.class}</div>
                    <div className="text-[10px] text-gray-500">{item.activeCount} Units in Fleet</div>
                  </div>
                  <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${item.statusBg}`}>
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <span className="text-gray-400">Utilization Rate:</span>
                    <span className={`font-bold ${item.utilization < item.target ? "text-amber-400" : "text-emerald-400"}`}>
                      {item.utilization}% <span className="text-[9px] text-gray-500 font-normal">(Target: {item.target}%)</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#0B0D13] h-2 rounded-full overflow-hidden border border-[#2A2D35]">
                    <div
                      className={`h-full rounded-full ${
                        item.utilization < 50 ? "bg-rose-500" : item.utilization < 75 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${item.utilization}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-gray-500">Idle Operational Leak:</span>
                    <span className="font-bold text-rose-400">{item.costLeak}</span>
                  </div>
                </div>

                <div className="bg-[#0B0D13] border border-[#2A2D35] p-2.5 rounded text-[10.5px] space-y-1">
                  <div className="text-amber-300 font-bold flex items-center gap-1 text-[10px]">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{item.strategyTitle}</span>
                  </div>
                  <p className="text-gray-400 text-[10px] leading-relaxed">
                    {item.strategyDesc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  alert(`Executing Fleet Redistribution Plan: ${item.strategyTitle}. Reallocating asset vectors.`);
                }}
                className={`w-full py-1.5 ${item.badgeColor} hover:opacity-90 text-white font-bold rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer`}
              >
                Execute Redistribution
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAINTENANCE COST EFFICIENCY & VEHICLE LIFECYCLE CORRELATION CHART */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-xl p-5 space-y-4">
        <div className="border-b border-[#2A2D35] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">
                  Maintenance Cost Efficiency & Mileage Correlation
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  12-MONTH PREDICTIVE AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizing the direct correlation between vehicle mileage, repair frequency, and total expenditure to identify optimal refurbishment windows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#161922] border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 font-bold">
              <PiggyBank className="w-4 h-4 text-amber-400" />
              <span>Projected Savings: $142,500 / yr</span>
            </div>
          </div>
        </div>

        {/* Cost-saving Opportunity Callout Banner */}
        <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs font-sans text-amber-200 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-mono font-bold text-amber-300 uppercase">
              CRITICAL COST-SAVING OPPORTUNITY DETECTED AT 125,000 MILE THRESHOLD
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Telemetry regression shows unscheduled repair expenditure surges exponentially once vehicle odometer exceeds <strong className="text-white font-mono">125,000 miles</strong>. Cost per mile spikes from <strong className="text-emerald-400 font-mono">$0.28/mi</strong> to <strong className="text-rose-400 font-mono">$0.91/mi</strong> with repair frequency jumping <strong className="text-amber-300 font-mono">+280%</strong>. Implementing a structured fleet retirement / re-power protocol at 125k miles yields <strong className="text-emerald-400 font-mono">$142,500/year</strong> in avoided emergency downtime.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Recharts Composed Chart */}
          <div className="lg:col-span-2 h-80 bg-[#141720] border border-[#2A2D35] rounded-xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={maintenanceEfficiencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRepairCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#B45309" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                {/* Left YAxis for Repair Expenditure */}
                <YAxis
                  yAxisId="left"
                  stroke="#F59E0B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                {/* Right YAxis for Mileage & Repair Frequency */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#3B82F6"
                  fontSize={10}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white", fontSize: "11px", fontFamily: "monospace" }}
                  formatter={(value: any, name: any) => {
                    if (name.includes("Expenditure")) return [`$${Number(value).toLocaleString()}`, name];
                    if (name.includes("Mileage")) return [`${value},000 mi`, name];
                    if (name.includes("Cost per Mile")) return [`$${value}/mi`, name];
                    return [value, name];
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />

                {/* Expenditure Bars */}
                <Bar yAxisId="left" name="Repair Expenditure ($)" dataKey="repairExpenditure" fill="url(#colorRepairCost)" radius={[4, 4, 0, 0]} barSize={22} />
                {/* Average Mileage Line */}
                <Line yAxisId="right" name="Avg Mileage (k mi)" type="monotone" dataKey="avgMileageK" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3 }} />
                {/* Repair Frequency Line */}
                <Line yAxisId="right" name="Repair Frequency (Events/mo)" type="monotone" dataKey="repairFrequency" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, stroke: "#EF4444" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Efficiency Breakdown Metrics Sidebar */}
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#161922] border border-[#2A2D35] p-3.5 rounded-xl space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[#2A2D35] pb-1.5 flex items-center justify-between">
                <span>MILEAGE BREAK-EVEN METRICS</span>
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#2A2D35]/40">
                <span className="text-slate-400">Pre-120k mi Cost/Mile:</span>
                <span className="text-emerald-400 font-bold">$0.28 / mile</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#2A2D35]/40">
                <span className="text-slate-400">Post-150k mi Cost/Mile:</span>
                <span className="text-rose-400 font-bold">$0.91 / mile (+225%)</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#2A2D35]/40">
                <span className="text-slate-400">Optimal Phase-Out:</span>
                <span className="text-amber-300 font-bold">125,000 miles</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Annual Savings Potential:</span>
                <span className="text-emerald-400 font-extrabold">$142,500 / year</span>
              </div>
            </div>

            <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-xl text-[10.5px] text-slate-300 font-sans leading-relaxed">
              <strong className="text-amber-400 font-mono block mb-1 uppercase">🛠️ PREDICTIVE RECOMMENDATION</strong>
              Schedule 4 heavy trucks approaching 120k miles for full drivetrain overhaul or auction placement to cap maintenance leakage before Q4 peak freight surge.
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Driver Performance Comparator Overlay */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 space-y-5">
        <div className="border-b border-[#2A2D35] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Performance Comparator & Skill Benchmarking</h3>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono px-2 py-0.5 rounded">
                RADAR OVERLAY
              </span>
            </div>
            <p className="text-xs text-[#8E9299] mt-0.5">
              Select two drivers to plot their skill vectors side-by-side across 6 core operational KPIs.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            {/* Driver A Selector */}
            <div className="flex items-center gap-1.5 bg-[#161922] border border-blue-500/50 p-1.5 rounded">
              <span className="text-blue-400 font-bold text-[10px]">DRIVER A:</span>
              <select
                value={driverAId}
                onChange={(e) => setDriverAId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {BENCHMARK_DRIVERS.map((d) => (
                  <option key={`a-${d.id}`} value={d.id} className="bg-[#0F1117] text-white">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRightLeft className="w-4 h-4 text-gray-500 shrink-0" />

            {/* Driver B Selector */}
            <div className="flex items-center gap-1.5 bg-[#161922] border border-emerald-500/50 p-1.5 rounded">
              <span className="text-emerald-400 font-bold text-[10px]">DRIVER B:</span>
              <select
                value={driverBId}
                onChange={(e) => setDriverBId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {BENCHMARK_DRIVERS.map((d) => (
                  <option key={`b-${d.id}`} value={d.id} className="bg-[#0F1117] text-white">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Recharts Radar Chart */}
          <div className="lg:col-span-2 h-80 w-full bg-[#141720] border border-[#2A2D35] rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#2A2D35" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" tick={{ fontSize: 9 }} />
                <Radar name={`${driverA.name} (${driverA.code})`} dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                <Radar name={`${driverB.name} (${driverB.code})`} dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: "#0F1117", borderColor: "#2A2D35", color: "white", fontSize: "11px", fontFamily: "monospace" }} />
                <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "10px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-Side KPI Breakdown */}
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded-lg space-y-2">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider border-b border-[#2A2D35] pb-1 flex items-center justify-between">
                <span>BENCHMARK MATRIX COMPARISON</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>

              {[
                { label: "Punctuality Rate", aVal: `${driverA.metrics.punctuality}%`, bVal: `${driverB.metrics.punctuality}%` },
                { label: "Safety Index", aVal: `${driverA.metrics.safetyIndex}/100`, bVal: `${driverB.metrics.safetyIndex}/100` },
                { label: "Eco-Driving Score", aVal: `${driverA.metrics.ecoDriving}%`, bVal: `${driverB.metrics.ecoDriving}%` },
                { label: "HOS Compliance", aVal: `${driverA.metrics.hosCompliance}%`, bVal: `${driverB.metrics.hosCompliance}%` },
                { label: "Vehicle Care Rating", aVal: `${driverA.metrics.vehicleCare}%`, bVal: `${driverB.metrics.vehicleCare}%` },
                { label: "Customer Rating", aVal: `${driverA.metrics.customerRating}%`, bVal: `${driverB.metrics.customerRating}%` }
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-0.5 border-b border-[#2A2D35]/30">
                  <span className="text-gray-400">{row.label}:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-bold">{row.aVal}</span>
                    <span className="text-gray-600">vs</span>
                    <span className="text-emerald-400 font-bold">{row.bVal}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-lg text-[10.5px] leading-relaxed text-gray-300">
              <span className="text-blue-400 font-bold uppercase text-[9.5px] block mb-1">🎯 EXECUTIVE SUMMARY</span>
              {driverA.name} demonstrates higher velocity & customer rating scores, while {driverB.name} excels in eco-driving efficiency (+{Math.abs(driverB.metrics.ecoDriving - driverA.metrics.ecoDriving)}%) and vehicle care longevity.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
