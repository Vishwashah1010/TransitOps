import React, { useState, useEffect, useRef } from "react";
import { Compass, ShieldAlert, Cpu, ArrowRight, Activity, Eye, ShieldCheck } from "lucide-react";
import L from "leaflet";
import * as d3 from "d3";

interface MapWidgetProps {
  vehicles: any[];
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  onExecuteReroute: (vehicleId: string, dest: string, constraint: "LOWEST_LATENCY" | "MIN_ENERGY") => Promise<any>;
}

const LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  DEPOT: { lat: 18.9500, lng: 72.9500, name: "MUMBAI JNPT PORT (Origin Depot)" },
  TERMINAL_E_GATE_12: { lat: 28.5000, lng: 77.2800, name: "DELHI_ICD_DEPOT (Delhi)" },
  LOGISTICS_HUB_4: { lat: 18.5204, lng: 73.8567, name: "PUNE_LOGISTICS_HUB (Pune)" },
  STAGING_YARD_B: { lat: 12.9700, lng: 77.7500, name: "BENGALURU_HUB (Bengaluru)" },
  NORTH_PORT_A: { lat: 13.0900, lng: 80.2900, name: "CHENNAI_PORT_TRUST (Chennai)" },
  WEST_DECK_6: { lat: 22.0300, lng: 88.0600, name: "KOLKATA_DOCK_COMP (Kolkata)" },
};

export default function MapWidget({ vehicles, selectedVehicleId, setSelectedVehicleId, onExecuteReroute }: MapWidgetProps) {
  const [targetDest, setTargetDest] = useState("TERMINAL_E_GATE_12");
  const [constraint, setConstraint] = useState<"LOWEST_LATENCY" | "MIN_ENERGY">("LOWEST_LATENCY");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  
  const [routeProgress, setRouteProgress] = useState(0.2);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [trafficNodes, setTrafficNodes] = useState<Array<{ lat: number; lng: number; congestion: number; flowSpeed: number }>>([]);
  const d3SvgRef = useRef<SVGSVGElement | null>(null);

  // Generate real-time traffic nodes along major Indian corridors for the heatmap
  useEffect(() => {
    const baseNodes = [
      { lat: 19.0760, lng: 72.8777, label: "Mumbai Metro Corridor" },
      { lat: 18.5204, lng: 73.8567, label: "Pune Expressway Corridor" },
      { lat: 12.9716, lng: 77.5946, label: "Bengaluru Central Crossing" },
      { lat: 28.7041, lng: 77.1025, label: "Delhi Bypass Trunk" },
      { lat: 13.0827, lng: 80.2707, label: "Chennai Coastal Radial" },
      { lat: 22.5726, lng: 88.3639, label: "Kolkata Port Linkway" },
      { lat: 17.3850, lng: 78.4867, label: "Hyderabad Highway Bypass" },
      { lat: 23.0225, lng: 72.5714, label: "Ahmedabad Transit Node" },
      { lat: 21.1702, lng: 72.8311, label: "Surat Urban Bottleneck" },
      { lat: 26.9124, lng: 75.7873, label: "Jaipur Bypass Connector" },
      { lat: 21.1458, lng: 79.0882, label: "Nagpur Central Crossing" },
      { lat: 15.3173, lng: 75.7139, label: "Hubli Junction Link" },
      { lat: 16.5062, lng: 80.6480, label: "Vijayawada Expressway" },
      { lat: 19.2183, lng: 72.9781, label: "Thane Transport Bottleneck" },
      { lat: 28.4595, lng: 77.0266, label: "Gurugram Transit Corridor" },
      { lat: 13.0012, lng: 77.6722, label: "Krishnarajapuram Transit Bottleneck" },
      { lat: 26.8467, lng: 80.9462, label: "Lucknow Corridor Bypass" },
      { lat: 11.0168, lng: 76.9558, label: "Coimbatore Industrial Route" },
      { lat: 10.8505, lng: 76.2711, label: "Kerala Corridor Link" }
    ];

    const generateTraffic = () => {
      return baseNodes.map(node => {
        let baseCongestion = 0.3;
        if (node.label.includes("Bottleneck") || node.label.includes("Metro") || node.label.includes("Central") || node.label.includes("Bypass")) {
          baseCongestion = 0.65;
        }
        const congestion = Math.min(1.0, Math.max(0.05, baseCongestion + (Math.random() * 0.28 - 0.14)));
        const flowSpeed = Math.round(90 * (1 - congestion * 0.8));
        return {
          lat: node.lat,
          lng: node.lng,
          congestion,
          flowSpeed
        };
      });
    };

    setTrafficNodes(generateTraffic());

    const interval = setInterval(() => {
      setTrafficNodes(generateTraffic());
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const destinations = [
    { value: "TERMINAL_E_GATE_12", label: "DELHI_ICD_DEPOT (Tughlakabad, Delhi)" },
    { value: "LOGISTICS_HUB_4", label: "PUNE_LOGISTICS_HUB (Pune, Maharashtra)" },
    { value: "STAGING_YARD_B", label: "BENGALURU_HUB (Whitefield, Bengaluru)" },
    { value: "NORTH_PORT_A", label: "CHENNAI_PORT_TRUST (Chennai, Tamil Nadu)" },
    { value: "WEST_DECK_6", label: "KOLKATA_DOCK_COMP (Haldia, West Bengal)" },
  ];

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleRerouteClick = async () => {
    if (!currentVehicle) return;
    setLoading(true);
    setSuccessMsg("");
    setAiAdvice("");
    try {
      const response = await onExecuteReroute(currentVehicle.id, targetDest, constraint);
      if (response.success) {
        setSuccessMsg(`Reroute stable! New telemetry logged: Speed: ${response.diagnostics?.velocity}km/h, Temp: ${response.diagnostics?.core_temp}°C.`);
        setRouteProgress(0.0); // Reset animation along new path
        
        const agentMode = localStorage.getItem("transitops_agent_mode") || "local";
        // Fetch AI advice
        const aiRes = await fetch("/api/ai/re-route-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: currentVehicle.id,
            destination: targetDest,
            constraint: constraint,
            agentMode
          })
        });
        const aiData = await aiRes.json();
        if (aiData.success) {
          setAiAdvice(aiData.advice);
        }
      } else {
        setSuccessMsg(`Reroute failed: ${response.error || "System anomaly"}`);
      }
    } catch (err: any) {
      setSuccessMsg(`API error during transaction processing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Smooth transit vehicle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRouteProgress((prev) => {
        const next = prev + 0.008;
        return next > 1.0 ? 0.0 : next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Center of India
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Data Updates (markers, routes, vehicle animation)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    layerGroup.clearLayers();

    const origin = LOCATIONS.DEPOT;
    const target = LOCATIONS[targetDest] || LOCATIONS.TERMINAL_E_GATE_12;

    // 1. Draw Central Origin Depot Marker
    const originMarker = L.marker([origin.lat, origin.lng], {
      icon: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
                 <div class="w-4 h-4 bg-[#10B981] border-2 border-white rounded-full shadow-[0_0_10px_#10B981]"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    });
    originMarker.bindTooltip("MUMBAI JNPT DEPOT (Origin)", {
      permanent: true,
      direction: "top",
      className: "bg-[#090D16] border border-[#1E293B] text-[#10B981] text-[10px] font-mono font-bold rounded px-1.5 py-0.5 shadow-lg",
      offset: [0, -10]
    });
    layerGroup.addLayer(originMarker);

    // 2. Draw Active Target Marker
    const targetMarker = L.marker([target.lat, target.lng], {
      icon: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping"></div>
                 <div class="w-4 h-4 bg-[#3B82F6] border-2 border-white rounded-full shadow-[0_0_10px_#3B82F6]"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    });
    targetMarker.bindTooltip(target.name.split(" ")[0] + " (Active Destination)", {
      permanent: true,
      direction: "top",
      className: "bg-[#090D16] border border-[#1E293B] text-[#3B82F6] text-[10px] font-mono font-bold rounded px-1.5 py-0.5 shadow-lg",
      offset: [0, -10]
    });
    layerGroup.addLayer(targetMarker);

    // 3. Draw Other Alternate Destinations
    Object.entries(LOCATIONS).forEach(([key, loc]) => {
      if (key !== "DEPOT" && key !== targetDest) {
        const altMarker = L.marker([loc.lat, loc.lng], {
          icon: L.divIcon({
            className: "custom-div-icon",
            html: `<div class="relative flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                     <div class="w-3 h-3 bg-[#F59E0B] border border-white rounded-full shadow-[0_0_5px_#F59E0B]"></div>
                   </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        });
        altMarker.bindTooltip(loc.name.split(" ")[0], {
          direction: "right",
          className: "bg-[#090D16] border border-[#1E293B] text-[#94A3B8] text-[9px] font-mono rounded px-1 py-0.5 shadow-md",
          offset: [10, 0]
        });
        layerGroup.addLayer(altMarker);
      }
    });

    // 4. Draw Route Polyline Corridor
    const routePoints = [[origin.lat, origin.lng], [target.lat, target.lng]] as [number, number][];
    
    // Background glow line
    const routeBg = L.polyline(routePoints, {
      color: "#1E3A8A",
      weight: 6,
      opacity: 0.4
    });
    layerGroup.addLayer(routeBg);

    // Foreground active animated dash line
    const routeActive = L.polyline(routePoints, {
      color: "#3B82F6",
      weight: 3.5,
      dashArray: "5, 12",
      opacity: 0.9
    });
    layerGroup.addLayer(routeActive);

    // 5. Calculate Animated Transit Vehicle Position
    const currentLat = origin.lat + (target.lat - origin.lat) * routeProgress;
    const currentLng = origin.lng + (target.lng - origin.lng) * routeProgress;

    const status = currentVehicle?.status || "ACTIVE";
    const plate = currentVehicle?.license_plate || "FLT-9821";

    const statusBg = 
      status === "ACTIVE" ? "bg-[#10B981]" : 
      status === "MAINTENANCE" ? "bg-[#F59E0B]" : "bg-[#EF4444]";

    const vehicleMarker = L.marker([currentLat, currentLng], {
      icon: L.divIcon({
        className: "custom-vehicle-icon",
        html: `<div class="relative flex flex-col items-center justify-center">
                 <div class="absolute -top-7 px-2 py-0.5 bg-[#090D16]/95 border border-gray-700 text-[8px] font-mono text-white rounded whitespace-nowrap shadow-2xl z-50">
                   🚚 ${plate}
                 </div>
                 <div class="absolute w-8 h-8 rounded-full border border-dashed border-white/30 animate-[spin_6s_linear_infinite]"></div>
                 <div class="w-4 h-4 ${statusBg} border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.7)]">
                   <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    });
    layerGroup.addLayer(vehicleMarker);

  }, [targetDest, currentVehicle, routeProgress]);

  // D3 Route Congestion Heatmap Overlay Renderer
  useEffect(() => {
    if (!mapInstanceRef.current || !d3SvgRef.current) return;
    const map = mapInstanceRef.current;

    const drawD3Heatmap = () => {
      const svg = d3.select(d3SvgRef.current);
      if (!showHeatmap || trafficNodes.length === 0) {
        svg.selectAll("circle.heatmap-node").remove();
        svg.selectAll("text.heatmap-text").remove();
        return;
      }

      // Convert lat/lng to container pixel coordinates relative to the absolute overlay
      const points = trafficNodes.map((node) => {
        const pt = map.latLngToContainerPoint([node.lat, node.lng]);
        return {
          x: pt.x,
          y: pt.y,
          congestion: node.congestion,
          flowSpeed: node.flowSpeed,
        };
      });

      const width = d3SvgRef.current?.clientWidth || 800;
      const height = d3SvgRef.current?.clientHeight || 450;
      const visiblePoints = points.filter(p => p.x >= -60 && p.x <= width + 60 && p.y >= -60 && p.y <= height + 60);

      // Color Scale: Green -> Yellow -> Red
      const colorScale = d3.scaleLinear<string>()
        .domain([0, 0.4, 0.7, 1.0])
        .range(["#10B981", "#3B82F6", "#FACC15", "#EF4444"]);

      // Join points to SVG circles
      const nodes = svg.selectAll<SVGCircleElement, any>("circle.heatmap-node")
        .data(visiblePoints);

      // Enter + Update
      nodes.enter()
        .append("circle")
        .attr("class", "heatmap-node")
        .attr("filter", "url(#heatmap-blur)")
        .merge(nodes)
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y)
        .attr("r", (d: any) => 22 + d.congestion * 36)
        .attr("fill", (d: any) => colorScale(d.congestion))
        .attr("opacity", (d: any) => 0.35 + d.congestion * 0.15);

      nodes.exit().remove();

      // Draw small text indicating flow speed if zoomed in enough
      const showLabels = map.getZoom() >= 6;
      const labels = svg.selectAll<SVGTextElement, any>("text.heatmap-text")
        .data(showLabels ? visiblePoints : []);

      labels.enter()
        .append("text")
        .attr("class", "heatmap-text")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .merge(labels)
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y + 3)
        .text((d: any) => `${d.flowSpeed}k/h`);

      labels.exit().remove();
    };

    // Listen to Leaflet move/zoom events to redraw D3 overlays in sync
    map.on("move", drawD3Heatmap);
    map.on("zoom", drawD3Heatmap);
    map.on("viewreset", drawD3Heatmap);

    // Initial draw
    drawD3Heatmap();

    return () => {
      map.off("move", drawD3Heatmap);
      map.off("zoom", drawD3Heatmap);
      map.off("viewreset", drawD3Heatmap);
    };
  }, [showHeatmap, trafficNodes]);

  const origin = LOCATIONS.DEPOT;
  const target = LOCATIONS[targetDest] || LOCATIONS.TERMINAL_E_GATE_12;
  const currentLat = (origin.lat + (target.lat - origin.lat) * routeProgress).toFixed(4);
  const currentLng = (origin.lng + (target.lng - origin.lng) * routeProgress).toFixed(4);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Map Layout */}
      <div className="lg:col-span-2 bg-[#0C0E14] border border-[#2A2D35] rounded-lg p-4 relative overflow-hidden h-[450px] flex flex-col justify-between shadow-lg">
        
        {/* Map Header Status Bar */}
        <div className="flex justify-between items-center z-10 relative pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1A1D26]/90 border border-[#2A2D35] font-mono text-xs shadow-md pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80] animate-pulse"></span>
            <span className="text-[#8E9299]">ACTIVE VESSEL:</span>
            <select 
              value={selectedVehicleId} 
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0F1117] text-white">{v.id} ({v.type})</option>
              ))}
            </select>
          </div>

          <div className="px-3 py-1.5 rounded bg-[#1A1D26]/90 border border-[#2A2D35] font-mono text-xs text-right shadow-md pointer-events-auto">
            <div className="text-[9px] text-[#8E9299]">CURRENT_GPS</div>
            <div className="text-[#4ADE80] font-bold">{currentLat}° N, {currentLng}° E</div>
          </div>
        </div>

        {/* Real Leaflet Map Container */}
        <div className="absolute inset-0 z-0">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* D3.js Route Congestion Heatmap Overlay */}
        <svg
          ref={d3SvgRef}
          className="absolute inset-0 pointer-events-none z-[400] w-full h-full"
          style={{ mixBlendMode: "screen" }}
        >
          <defs>
            <filter id="heatmap-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
        </svg>

        {/* Map Legend Overlay */}
        <div className="flex justify-between items-end z-10 relative pointer-events-none">
          <div className="bg-[#0A0B0E]/90 backdrop-blur-sm border border-[#2A2D35] p-2.5 rounded text-[10px] font-mono text-[#8E9299] space-y-1 shadow-xl pointer-events-auto">
            <div className="text-[9px] text-[#8E9299] uppercase tracking-widest border-b border-[#2A2D35] pb-1 mb-1 font-bold">Map Anchor Indices (India)</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
              <span>Mumbai Central Depot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]"></span>
              <span>Active Target Terminal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"></span>
              <span>Alternate Logistics Hubs</span>
            </div>
          </div>

          <div className="flex gap-1.5 pointer-events-auto">
            {/* D3 Heatmap Toggle Switch */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1.5 rounded border transition-colors cursor-pointer text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                showHeatmap
                  ? "bg-[#EF4444]/20 border-[#EF4444]/60 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                  : "bg-[#1A1D26] border-[#2A2D35] text-[#8E9299] hover:text-white"
              }`}
              title="Toggle D3.js Traffic Congestion Heatmap"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{showHeatmap ? "HEATMAP: ACTIVE" : "HEATMAP: OFF"}</span>
            </button>

            <button 
              onClick={handleRecenter}
              className="p-2 rounded bg-[#1A1D26] border border-[#2A2D35] text-[#8E9299] hover:text-white transition-colors cursor-pointer" 
              title="Recenter Map"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Re-Route Controller Card */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between font-sans shadow-md">
        <div>
          <div className="flex justify-between items-center border-b border-[#2A2D35] pb-3 mb-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Re-Route Vectors</h2>
            <Cpu className="w-4 h-4 text-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
          </div>

          {/* Target selection */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Target Destination</label>
              <select
                value={targetDest}
                onChange={(e) => setTargetDest(e.target.value)}
                className="w-full bg-[#1A1D26] border border-[#2A2D35] text-white p-2.5 rounded text-sm font-mono focus:outline-none focus:border-[#4ADE80]"
              >
                {destinations.map((d) => (
                  <option key={d.value} value={d.value} className="bg-[#0F1117] text-white">{d.label}</option>
                ))}
              </select>
            </div>

            {/* Constraint Toggles */}
            <div>
              <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Constraint Logic</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConstraint("LOWEST_LATENCY")}
                  className={`py-2 text-xs font-mono font-bold border rounded transition-all cursor-pointer ${
                    constraint === "LOWEST_LATENCY"
                      ? "bg-[#1E3A8A] border-[#2563EB] text-[#93C5FD]"
                      : "bg-[#1A1D26] border-[#2A2D35] text-[#8E9299] hover:bg-[#1A1D26]/80 hover:text-white"
                  }`}
                >
                  LOWEST_LATENCY
                </button>
                <button
                  type="button"
                  onClick={() => setConstraint("MIN_ENERGY")}
                  className={`py-2 text-xs font-mono font-bold border rounded transition-all cursor-pointer ${
                    constraint === "MIN_ENERGY"
                      ? "bg-[#064E3B] border-[#059669] text-[#6EE7B7]"
                      : "bg-[#1A1D26] border-[#2A2D35] text-[#8E9299] hover:bg-[#1A1D26]/80 hover:text-white"
                  }`}
                >
                  MIN_ENERGY
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Trigger Panel */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono border-t border-[#2A2D35] pt-3 text-[#8E9299]">
            <span>EST_TIME_RECALC</span>
            <span className="text-[#4ADE80] font-bold">1.4s</span>
          </div>

          <button
            type="button"
            onClick={handleRerouteClick}
            disabled={loading || !currentVehicle}
            className="w-full py-3 bg-[#2563EB] text-white font-bold uppercase text-xs tracking-widest rounded hover:bg-[#1D4ED8] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:bg-gray-700 disabled:text-gray-400 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>EXECUTE RE-ROUTE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Success / Feedback Alerts */}
          {successMsg && (
            <div className={`p-3 rounded text-xs font-mono border ${
              successMsg.includes("failed") || successMsg.includes("error")
                ? "bg-red-950/20 border-red-500/30 text-red-400"
                : "bg-[#4ADE80]/5 border-[#4ADE80]/20 text-[#4ADE80]"
            }`}>
              {successMsg}
            </div>
          )}

          {/* Gemini AI recommendation advisory response card */}
          {aiAdvice && (
            <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded text-xs font-mono space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-blue-400 uppercase tracking-widest text-[9px] font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Routing Analyst (Gemini Core)</span>
              </div>
              <p className="text-[#E0E2E6] italic leading-relaxed">"{aiAdvice}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
