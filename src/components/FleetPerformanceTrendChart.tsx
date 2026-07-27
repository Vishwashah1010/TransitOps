import React, { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp, Activity, Fuel, Users, ChevronUp, ChevronDown } from "lucide-react";

const trendData = [
  { day: "Mon", ridership: 11200, fuelEfficiency: 3.9, punctuality: 91.5 },
  { day: "Tue", ridership: 11850, fuelEfficiency: 4.0, punctuality: 92.2 },
  { day: "Wed", ridership: 12100, fuelEfficiency: 4.1, punctuality: 93.0 },
  { day: "Thu", ridership: 12050, fuelEfficiency: 4.0, punctuality: 93.5 },
  { day: "Fri", ridership: 12380, fuelEfficiency: 4.2, punctuality: 94.0 },
  { day: "Sat", ridership: 12200, fuelEfficiency: 4.1, punctuality: 93.8 },
  { day: "Sun", ridership: 12402, fuelEfficiency: 4.2, punctuality: 94.2 }
];

export default function FleetPerformanceTrendChart() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<"all" | "ridership" | "fuelEfficiency" | "punctuality">("all");

  return (
    <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-3.5 space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-bold text-white text-xs uppercase tracking-wider">
            7-Day Rolling Fleet Performance Trend
          </span>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9.5px] font-mono px-2 py-0.5 rounded">
            ROLLING AVERAGE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#161922] p-1 rounded border border-[#2A2D35] font-mono text-[10px]">
            {(["all", "ridership", "fuelEfficiency", "punctuality"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMetric(m)}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer capitalize ${
                  selectedMetric === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "fuelEfficiency" ? "Fuel Eff." : m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[#1F2332] text-gray-400 hover:text-white rounded cursor-pointer transition-colors"
            title={isExpanded ? "Collapse Trend Chart" : "Expand Trend Chart"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRidership" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPunctuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
              <XAxis dataKey="day" stroke="#8E9299" fontSize={11} tickLine={false} />
              <YAxis stroke="#8E9299" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0D13",
                  borderColor: "#2A2D35",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#fff"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#9CA3AF" }} />

              {(selectedMetric === "all" || selectedMetric === "ridership") && (
                <Area
                  type="monotone"
                  dataKey="ridership"
                  name="Ridership (passengers)"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorRidership)"
                />
              )}

              {(selectedMetric === "all" || selectedMetric === "fuelEfficiency") && (
                <Area
                  type="monotone"
                  dataKey="fuelEfficiency"
                  name="Fuel Efficiency (mi/gal)"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorFuel)"
                />
              )}

              {(selectedMetric === "all" || selectedMetric === "punctuality") && (
                <Area
                  type="monotone"
                  dataKey="punctuality"
                  name="Punctuality (%)"
                  stroke="#F59E0B"
                  fillOpacity={1}
                  fill="url(#colorPunctuality)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
