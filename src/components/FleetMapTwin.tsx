import React, { useState, useEffect, useRef } from "react";
import { 
  Compass, ShieldAlert, Cpu, ArrowRight, Truck, Activity, Droplets, UserCheck, 
  Timer, ShieldCheck, Layers, Radio, AlertOctagon, Zap, Fuel, RefreshCw, 
  FileText, CheckCircle2, MapPin, Plus, Trash2, Clock, Eye, CloudRain, Wind,
  Wrench, HeartPulse, BatteryCharging, AlertTriangle, Gauge
} from "lucide-react";
import L from "leaflet";
import { motion, AnimatePresence } from "motion/react";
import * as d3 from "d3";

export interface MaintenanceHealthForecast {
  status: "GOOD" | "WARNING" | "URGENT";
  score: number;
  mileageKm: number;
  engineDiagnostics: {
    coolantTempC: number;
    oilPressurePsi: number;
    brakePadWearPct: number;
    batteryVoltageV: number;
    transmissionStatus: string;
  };
  recommendedAction: string;
  nextServiceDays: number;
}

export const getMaintenanceHealthForecast = (vehicle: any): MaintenanceHealthForecast => {
  const isMaintenance = vehicle?.status === "MAINTENANCE";
  const vehicleId = vehicle?.id || "FLT-101";
  const seed = (vehicleId.charCodeAt(vehicleId.length - 1) || 1) % 10;
  
  if (isMaintenance || seed >= 7) {
    return {
      status: "URGENT",
      score: 42,
      mileageKm: 148500 + seed * 2300,
      engineDiagnostics: {
        coolantTempC: 104,
        oilPressurePsi: 24,
        brakePadWearPct: 91,
        batteryVoltageV: 11.8,
        transmissionStatus: "High Thermal Stress / Slipping"
      },
      recommendedAction: "Immediate Brake Pad & Coolant System Overhaul Required at Nearest Depot",
      nextServiceDays: 1
    };
  } else if (seed >= 4) {
    return {
      status: "WARNING",
      score: 71,
      mileageKm: 98200 + seed * 1800,
      engineDiagnostics: {
        coolantTempC: 92,
        oilPressurePsi: 38,
        brakePadWearPct: 68,
        batteryVoltageV: 12.4,
        transmissionStatus: "Normal Wear / Advisory Watch"
      },
      recommendedAction: "Schedule Preventive Oil Change & Transmission Fluid Inspection in 5 Days",
      nextServiceDays: 5
    };
  } else {
    return {
      status: "GOOD",
      score: 94,
      mileageKm: 42100 + seed * 1200,
      engineDiagnostics: {
        coolantTempC: 84,
        oilPressurePsi: 45,
        brakePadWearPct: 24,
        batteryVoltageV: 13.2,
        transmissionStatus: "Optimal Performance Range"
      },
      recommendedAction: "Engine diagnostics normal. Regular inspection scheduled in 28 days.",
      nextServiceDays: 28
    };
  }
};

export interface ShiftCompletionEstimate {
  estimatedEndTimeStr: string;
  remainingHours: number;
  totalSessionHours: number;
  regulatoryCapHours: number;
  isRegulatoryRisk: boolean;
  overtimeMinutes: number;
  historicalAvgSpeedKmh: number;
  remainingKm: number;
}

export const getShiftCompletionEstimate = (
  vehicle: any,
  targetDestKey: string,
  routeProgress: number
): ShiftCompletionEstimate => {
  const ROUTE_DATA_MAP: Record<string, { distanceKm: number }> = {
    TERMINAL_E_GATE_12: { distanceKm: 1420 },
    LOGISTICS_HUB_4: { distanceKm: 150 },
    STAGING_YARD_B: { distanceKm: 980 },
    NORTH_PORT_A: { distanceKm: 1330 },
    WEST_DECK_6: { distanceKm: 1950 },
  };

  const route = ROUTE_DATA_MAP[targetDestKey] || { distanceKm: 1420 };
  const totalKm = route.distanceKm;
  const remainingKm = Math.max(30, Math.round(totalKm * (1 - routeProgress)));
  
  const avgSpeed = vehicle?.type === "Medium Van" ? 82 : (vehicle?.type === "Cargo Drone" ? 55 : 68);
  const hoursNeeded = +(remainingKm / avgSpeed).toFixed(1);
  
  const seed = (vehicle?.id?.charCodeAt((vehicle?.id?.length || 1) - 1) || 1) % 4;
  const hoursLoggedToday = +(6.2 + seed * 0.9).toFixed(1);
  const totalSessionHours = +(hoursLoggedToday + hoursNeeded).toFixed(1);
  const regulatoryCapHours = 10.0;
  
  const isRegulatoryRisk = totalSessionHours > regulatoryCapHours;
  const overtimeMinutes = isRegulatoryRisk ? Math.round((totalSessionHours - regulatoryCapHours) * 60) : 0;
  
  const now = new Date();
  now.setMinutes(now.getMinutes() + Math.round(hoursNeeded * 60));
  const estimatedEndTimeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return {
    estimatedEndTimeStr,
    remainingHours: hoursNeeded,
    totalSessionHours,
    regulatoryCapHours,
    isRegulatoryRisk,
    overtimeMinutes,
    historicalAvgSpeedKmh: avgSpeed,
    remainingKm
  };
};

export interface VehicleStatusLog {
  id: string;
  timestamp: string;
  vehicleId: string;
  licensePlate: string;
  state: "MOVING" | "ARRIVED" | "DELAY" | "RE_ROUTED" | "ZONE_ENTERED" | "ZONE_EXITED" | "GEOFENCE_BREACH";
  location: string;
  speedKmh: number;
  details: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: "HIGH_RISK" | "REFUELING_HUB" | "RESTRICTED_URBAN";
  lat: number;
  lng: number;
  radiusKm: number;
  color: string;
  active: boolean;
  alertMsg: string;
}

const DEFAULT_GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: "ZONE-WEST-HAZARD",
    name: "Western Ghats High-Risk Monsoon Hazard Area",
    type: "HIGH_RISK",
    lat: 19.1000,
    lng: 73.2000,
    radiusKm: 75,
    color: "#EF4444",
    active: true,
    alertMsg: "Entering Severe Weather & Landslide High-Risk Corridor"
  },
  {
    id: "ZONE-PUNE-HUB",
    name: "Pune Service Hub & Refueling Sanctuary",
    type: "REFUELING_HUB",
    lat: 18.5204,
    lng: 73.8567,
    radiusKm: 60,
    color: "#10B981",
    active: true,
    alertMsg: "Entering Priority Refueling & Service Hub Area"
  },
  {
    id: "ZONE-DELHI-URBAN",
    name: "Delhi NCR Urban Freight Low-Speed Perimeter",
    type: "RESTRICTED_URBAN",
    lat: 28.5000,
    lng: 77.2800,
    radiusKm: 85,
    color: "#F59E0B",
    active: true,
    alertMsg: "Entering Restricted Urban Corridor (Max Speed 40 km/h)"
  }
];

interface FleetMapTwinProps {
  vehicles: any[];
  drivers: any[];
  orders: any[];
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

export default function FleetMapTwin({
  vehicles,
  drivers,
  orders,
  selectedVehicleId,
  setSelectedVehicleId,
  onExecuteReroute,
}: FleetMapTwinProps) {
  const [targetDest, setTargetDest] = useState("TERMINAL_E_GATE_12");
  const [constraint, setConstraint] = useState<"LOWEST_LATENCY" | "MIN_ENERGY">("LOWEST_LATENCY");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [routeProgress, setRouteProgress] = useState(0.2);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [simulateDeviation, setSimulateDeviation] = useState(false);
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(120);
  const [mapLayer, setMapLayer] = useState<"standard" | "operator">("operator");
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  interface Toast {
    id: string;
    message: string;
    type: "info" | "warning" | "success" | "danger";
    vesselId?: string;
    timestamp: string;
  }

  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevBreachedRef = useRef(false);

  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>(DEFAULT_GEOFENCE_ZONES);
  const [activeRightTab, setActiveRightTab] = useState<"reroute" | "health" | "shift" | "energy" | "status_log" | "geofences">("reroute");
  const [showEnergyOverlay, setShowEnergyOverlay] = useState(true);
  
  // Real-time Status Log State
  const [statusLogs, setStatusLogs] = useState<VehicleStatusLog[]>([
    {
      id: "log-101",
      timestamp: "07:35:12",
      vehicleId: "FLT-101",
      licensePlate: "MH-04-AB-9821",
      state: "MOVING",
      location: "NH-48 Pune Expressway Corridor",
      speedKmh: 78,
      details: "GPS telemetry normal • Cruise velocity stable at 78 km/h"
    },
    {
      id: "log-102",
      timestamp: "07:12:45",
      vehicleId: "FLT-101",
      licensePlate: "MH-04-AB-9821",
      state: "RE_ROUTED",
      location: "Mumbai JNPT Port Origin",
      speedKmh: 0,
      details: "Route recalculation confirmed ➔ Delhi ICD Corridor"
    },
    {
      id: "log-103",
      timestamp: "06:45:00",
      vehicleId: "FLT-101",
      licensePlate: "MH-04-AB-9821",
      state: "ARRIVED",
      location: "JNPT Staging Deck B",
      speedKmh: 0,
      details: "Cargo loading completed • Safety checklist cleared"
    }
  ]);

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Effect for triggering high-priority browser notifications on deviation breach
  useEffect(() => {
    if (simulateDeviation) {
      // Browser notification
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            new Notification("🚨 ROUTE CORRIDOR DEVIATION BREACH", {
              body: `Vehicle ${currentVehicle?.id || "FLT-101"} has deviated from predefined route corridor! Dynamic Auto-Zone boundary breached.`,
            });
          } catch (e) {
            console.error(e);
          }
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              try {
                new Notification("🚨 ROUTE CORRIDOR DEVIATION BREACH", {
                  body: `Vehicle ${currentVehicle?.id || "FLT-101"} has deviated from predefined route corridor! Dynamic Auto-Zone boundary breached.`,
                });
              } catch (e) {
                console.error(e);
              }
            }
          });
        }
      }
    }
  }, [simulateDeviation, currentVehicle?.id]);
  const maintHealth = getMaintenanceHealthForecast(currentVehicle);
  const shiftEstimate = getShiftCompletionEstimate(currentVehicle, targetDest, routeProgress);

  const origin = LOCATIONS.DEPOT;
  const target = LOCATIONS[targetDest] || LOCATIONS.TERMINAL_E_GATE_12;

  const baseLatForDev = origin.lat + (target.lat - origin.lat) * routeProgress;
  const baseLngForDev = origin.lng + (target.lng - origin.lng) * routeProgress;
  const latOffsetForDev = simulateDeviation ? 2.8 : 0;
  const lngOffsetForDev = simulateDeviation ? -3.4 : 0;
  const currentLatForDev = baseLatForDev + latOffsetForDev;
  const currentLngForDev = baseLngForDev + lngOffsetForDev;

  const y0 = currentLatForDev;
  const x0 = currentLngForDev;
  const y1 = origin.lat;
  const x1 = origin.lng;
  const y2 = target.lat;
  const x2 = target.lng;

  const numVal = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
  const denVal = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  const devDeg = denVal === 0 ? 0 : numVal / denVal;
  const currentDeviationKm = Math.round(devDeg * 111.32);
  const isGeofenceBreached = currentDeviationKm > geofenceRadiusKm;

  const currentLat = currentLatForDev.toFixed(4);
  const currentLng = currentLngForDev.toFixed(4);

  // Quick Dispatch Handler
  const handleQuickDispatch = async (vehicleId: string, destKey: string, destLabel: string) => {
    const vObj = vehicles.find((v) => v.id === vehicleId) || currentVehicle;
    if (!vObj) return;

    setSelectedVehicleId(vObj.id);
    setTargetDest(destKey);
    setLoading(true);

    try {
      const res = await onExecuteReroute(vObj.id, destKey, constraint);
      if (res.success) {
        setSuccessMsg(`⚡ QUICK DISPATCH ACTIVE: ${vObj.license_plate || vObj.id} ➔ ${destLabel}`);
        setRouteProgress(0.0);

        const newLog: VehicleStatusLog = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          vehicleId: vObj.id,
          licensePlate: vObj.license_plate || vObj.id,
          state: "RE_ROUTED",
          location: destLabel,
          speedKmh: 82,
          details: `DIRECTIVE: Quick Dispatch triggered ➔ ${destLabel}`
        };
        setStatusLogs((prev) => [newLog, ...prev]);

        setToasts((prev) => [
          {
            id: Math.random().toString(36).substring(2, 9),
            message: `⚡ Quick Dispatch: ${vObj.license_plate || vObj.id} re-routed to ${destLabel}`,
            type: "success",
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err: any) {
      setSuccessMsg(`Quick Dispatch Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGeofenceBreached && !prevBreachedRef.current) {
      const plate = currentVehicle?.license_plate || "FLT-9821";
      const newToast: Toast = {
        id: Math.random().toString(36).substring(2, 9),
        message: `Vessel ${plate} drifted ${currentDeviationKm}km off-course! Corridor limit is ${geofenceRadiusKm}km.`,
        type: "danger",
        vesselId: currentVehicle?.id,
        timestamp: new Date().toLocaleTimeString(),
      };
      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      // Append state transition log for Geofence Breach
      const breachLog: VehicleStatusLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        vehicleId: currentVehicle?.id || "FLT-101",
        licensePlate: currentVehicle?.license_plate || "FLT-101",
        state: "GEOFENCE_BREACH",
        location: `${currentLat}° N, ${currentLng}° E`,
        speedKmh: 74,
        details: `Corridor Limit Breached: Drifted ${currentDeviationKm}km (Limit: ${geofenceRadiusKm}km)`
      };
      setStatusLogs((prev) => [breachLog, ...prev]);
    }
    prevBreachedRef.current = isGeofenceBreached;
  }, [isGeofenceBreached, currentVehicle, currentDeviationKm, geofenceRadiusKm, currentLat, currentLng]);

  // Monitor Active Geo-Fence Zones
  useEffect(() => {
    if (!currentVehicle) return;
    geofenceZones.forEach((zone) => {
      if (!zone.active) return;

      const distKm = Math.sqrt(
        Math.pow((currentLatForDev - zone.lat) * 111.32, 2) +
        Math.pow((currentLngForDev - zone.lng) * 111.32 * Math.cos(zone.lat * (Math.PI / 180)), 2)
      );

      if (distKm <= zone.radiusKm) {
        // Trigger status log if close to center
        if (Math.round(routeProgress * 100) % 25 === 0) {
          const zoneLog: VehicleStatusLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            vehicleId: currentVehicle.id,
            licensePlate: currentVehicle.license_plate || currentVehicle.id,
            state: zone.type === "HIGH_RISK" ? "DELAY" : "ZONE_ENTERED",
            location: zone.name,
            speedKmh: zone.type === "RESTRICTED_URBAN" ? 38 : 72,
            details: zone.alertMsg
          };
          setStatusLogs((prev) => {
            if (prev[0]?.details === zone.alertMsg) return prev;
            return [zoneLog, ...prev.slice(0, 20)];
          });
        }
      }
    });
  }, [currentLatForDev, currentLngForDev, routeProgress, geofenceZones, currentVehicle]);

  const ROUTE_DATA: Record<string, { distanceKm: number; label: string }> = {
    TERMINAL_E_GATE_12: { distanceKm: 1420, label: "DELHI_ICD_DEPOT (Delhi)" },
    LOGISTICS_HUB_4: { distanceKm: 150, label: "PUNE_LOGISTICS_HUB (Pune)" },
    STAGING_YARD_B: { distanceKm: 980, label: "BENGALURU_HUB (Bengaluru)" },
    NORTH_PORT_A: { distanceKm: 1330, label: "CHENNAI_PORT_TRUST (Chennai)" },
    WEST_DECK_6: { distanceKm: 1950, label: "KOLKATA_DOCK_COMP (Kolkata)" },
  };

  const getRouteAnalysis = () => {
    const route = ROUTE_DATA[targetDest] || { distanceKm: 1420, label: "DELHI_ICD_DEPOT (Delhi)" };
    const distance = route.distanceKm;
    
    // Base speed and consumption factors
    let baseSpeed = 75; // km/h
    let energyPerKm = 0.35; // L or kWh per km
    let unit = "L";
    let costPerUnit = 100; // Rs/L
    let co2PerUnit = 2.68; // kg CO2 per unit
    let energyType = "Diesel";

    if (currentVehicle?.type === "Medium Van") {
      baseSpeed = 85;
      energyPerKm = 0.15;
      unit = "L";
      costPerUnit = 100;
      co2PerUnit = 2.3;
      energyType = "Gasoline";
    } else if (currentVehicle?.type === "Cargo Drone") {
      baseSpeed = 55;
      energyPerKm = 0.8;
      unit = "kWh";
      costPerUnit = 8;
      co2PerUnit = 0.4;
      energyType = "Electricity";
    }

    // Adjust for MIN_ENERGY constraint
    let speed = baseSpeed;
    let consumption = energyPerKm;
    if (constraint === "MIN_ENERGY") {
      speed = baseSpeed * 0.85; // 15% speed reduction
      consumption = energyPerKm * 0.85; // 15% energy efficiency saving
    }

    const travelTimeHours = distance / speed;
    const totalEnergy = distance * consumption;
    const totalCost = totalEnergy * costPerUnit;
    const totalCO2 = totalEnergy * co2PerUnit;

    const hours = Math.floor(travelTimeHours);
    const minutes = Math.round((travelTimeHours - hours) * 60);

    return {
      distance,
      destinationName: route.label,
      travelTime: `${hours}h ${minutes}m`,
      fuelCost: `₹${Math.round(totalCost).toLocaleString()}`,
      carbonEmissions: `${Math.round(totalCO2).toLocaleString()} kg CO2`,
      energyType,
      totalEnergy: `${Math.round(totalEnergy).toLocaleString()} ${unit}`,
      savingsNote: constraint === "MIN_ENERGY" 
        ? "ECO-MODE ACTIVE: Fuel consumption and carbon footprint reduced by 15%." 
        : "PERFORMANCE MODE ACTIVE: Route prioritized for lowest-latency delivery corridor."
    };
  };

  const destinations = [
    { value: "TERMINAL_E_GATE_12", label: "DELHI_ICD_DEPOT (Tughlakabad, Delhi)" },
    { value: "LOGISTICS_HUB_4", label: "PUNE_LOGISTICS_HUB (Pune, Maharashtra)" },
    { value: "STAGING_YARD_B", label: "BENGALURU_HUB (Whitefield, Bengaluru)" },
    { value: "NORTH_PORT_A", label: "CHENNAI_PORT_TRUST (Chennai, Tamil Nadu)" },
    { value: "WEST_DECK_6", label: "KOLKATA_DOCK_COMP (Haldia, West Bengal)" },
  ];

  const handleRerouteClick = async () => {
    if (!currentVehicle) return;
    setLoading(true);
    setSuccessMsg("");
    setAiAdvice("");
    try {
      const response = await onExecuteReroute(currentVehicle.id, targetDest, constraint);
      if (response.success) {
        setSuccessMsg(`Reroute stable! Speed: ${response.diagnostics?.velocity}km/h, Core: ${response.diagnostics?.core_temp}°C.`);
        setRouteProgress(0.0); // Reset animation along new path
        
        const agentMode = localStorage.getItem("transitops_agent_mode") || "local";
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
        setSuccessMsg(`Reroute failed: ${response.error || "Anomaly"}`);
      }
    } catch (err: any) {
      setSuccessMsg(`API error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Digital Twin Metrics calculations based on actual database variables
  const vehiclesAvailable = vehicles.filter(v => v.status === "ACTIVE" && !drivers.find(d => d.current_vehicle_id === v.id && d.status === "IN_TRANSIT")).length;
  const vehiclesOnTrip = vehicles.filter(v => v.status === "ACTIVE" && drivers.find(d => d.current_vehicle_id === v.id && d.status === "IN_TRANSIT")).length;
  const vehiclesMaintenance = vehicles.filter(v => v.status === "MAINTENANCE").length;
  const activeDrivers = drivers.filter(d => d.status === "IN_TRANSIT").length;
  const cargoInTransit = orders.filter(o => o.status === "ASSIGNED").reduce((sum, o) => sum + o.weight, 0);
  const delayedDeliveries = orders.filter(o => o.status === "PENDING").length > 2 ? 1 : 0; // high congestion logic
  const fuelConsumption = vehiclesOnTrip * 45 + 120; // estimated liters

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

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

  // Draw D3 Heatmap Overlay
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

      // Color Scale: Green -> Blue -> Yellow -> Red
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
        .attr("filter", "url(#heatmap-blur-twin)")
        .merge(nodes)
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y)
        .attr("r", (d: any) => 12 + d.congestion * 14)
        .attr("fill", (d: any) => colorScale(d.congestion))
        .attr("opacity", (d: any) => 0.45 + d.congestion * 0.15)
        .attr("stroke", (d: any) => colorScale(d.congestion))
        .attr("stroke-width", "2")
        .attr("stroke-opacity", 0.9);

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

      const initialUrl = mapLayer === "operator"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tLayer = L.tileLayer(initialUrl, {
        maxZoom: 20
      }).addTo(map);

      tileLayerRef.current = tLayer;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Sync Map Tile Layer when mapLayer state changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const url = mapLayer === "operator"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      tileLayerRef.current.setUrl(url);
    }
  }, [mapLayer]);

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
        const isOperator = mapLayer === "operator";
        const altMarker = L.marker([loc.lat, loc.lng], {
          icon: L.divIcon({
            className: "custom-div-icon",
            html: `<div class="relative flex items-center justify-center ${isOperator ? 'opacity-30 hover:opacity-100' : 'opacity-70 hover:opacity-100'} transition-opacity">
                     <div class="w-2.5 h-2.5 bg-[#F59E0B] border border-white rounded-full ${isOperator ? '' : 'shadow-[0_0_5px_#F59E0B]'}"></div>
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

    // 4. Draw Visual Geo-Fencing Overlays (Admin Defined & Selectable)
    geofenceZones.forEach((zone) => {
      if (!zone.active) return;

      const zoneCircle = L.circle([zone.lat, zone.lng], {
        radius: zone.radiusKm * 1000,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.12,
        weight: 1.8,
        dashArray: "6, 8",
        className: "geofence-zone-animated"
      });

      zoneCircle.bindTooltip(`
        <div style="font-family: monospace; font-size: 10px; color: #FFFFFF; font-weight: bold;">
          🛡️ GEOFENCE: ${zone.name}<br/>
          <span style="color: #94A3B8; font-weight: normal;">Type: ${zone.type} • Radius: ${zone.radiusKm}km</span>
        </div>
      `, {
        permanent: false,
        direction: "top",
        className: "bg-[#090D16] border border-slate-700 text-white rounded px-2 py-1 shadow-2xl"
      });

      layerGroup.addLayer(zoneCircle);
    });

    // 5. Draw Route Polyline Corridor
    const routePoints = [[origin.lat, origin.lng], [target.lat, target.lng]] as [number, number][];
    const isOperator = mapLayer === "operator";

    // Background geofence tube buffer zone
    const geofenceBuffer = L.polyline(routePoints, {
      color: isGeofenceBreached ? "#EF4444" : (isOperator ? "#10B981" : "#10B981"),
      weight: Math.max(16, geofenceRadiusKm * 0.35),
      opacity: isOperator ? 0.08 : 0.15,
      lineCap: "round",
      lineJoin: "round"
    });
    layerGroup.addLayer(geofenceBuffer);

    // Corridor physical boundary fences
    const dy = target.lat - origin.lat;
    const dx = target.lng - origin.lng;
    const len = Math.sqrt(dy * dy + dx * dx);
    if (len > 0) {
      const py = -dx / len;
      const px = dy / len;
      const offsetDeg = geofenceRadiusKm / 111.32;
      
      const leftPoints = [
        [origin.lat + py * offsetDeg, origin.lng + px * offsetDeg],
        [target.lat + py * offsetDeg, target.lng + px * offsetDeg]
      ] as [number, number][];

      const rightPoints = [
        [origin.lat - py * offsetDeg, origin.lng - px * offsetDeg],
        [target.lat - py * offsetDeg, target.lng - px * offsetDeg]
      ] as [number, number][];

      const leftFence = L.polyline(leftPoints, {
        color: isGeofenceBreached ? "#EF4444" : (isOperator ? "#047857" : "#10B981"),
        weight: isOperator ? 1.0 : 1.5,
        dashArray: isOperator ? "3, 10" : "6, 8",
        opacity: isOperator ? 0.35 : 0.5
      });
      const rightFence = L.polyline(rightPoints, {
        color: isGeofenceBreached ? "#EF4444" : (isOperator ? "#047857" : "#10B981"),
        weight: isOperator ? 1.0 : 1.5,
        dashArray: isOperator ? "3, 10" : "6, 8",
        opacity: isOperator ? 0.35 : 0.5
      });
      layerGroup.addLayer(leftFence);
      layerGroup.addLayer(rightFence);
    }

    // Background glow line
    const routeBg = L.polyline(routePoints, {
      color: isOperator ? "#1D4ED8" : "#1E3A8A",
      weight: isOperator ? 8 : 6,
      opacity: isOperator ? 0.6 : 0.4
    });
    layerGroup.addLayer(routeBg);

    // Foreground active animated flowing dash path
    const routeActive = L.polyline(routePoints, {
      color: isOperator ? "#60A5FA" : "#3B82F6",
      weight: isOperator ? 5.0 : 4.0,
      opacity: 1.0,
      className: "flowing-route-path"
    });
    layerGroup.addLayer(routeActive);

    // 6. Draw Deviation Vector Link if Breached
    if (isGeofenceBreached) {
      const deviationLink = L.polyline([[currentLatForDev, currentLngForDev], [baseLatForDev, baseLngForDev]], {
        color: "#EF4444",
        weight: 2.5,
        dashArray: "4, 6",
        opacity: 0.85
      });
      deviationLink.bindTooltip(`BREACH: ${currentDeviationKm}km DRIFT`, {
        permanent: true,
        direction: "right",
        className: "bg-red-950 border border-red-500 text-red-400 text-[10px] font-mono font-bold rounded px-1.5 py-0.5 shadow-lg"
      });
      layerGroup.addLayer(deviationLink);
    }

    // 6.5 Traffic-Density Heatmap Layer (Historical Route Performance & Bottlenecks)
    if (showHeatmap) {
      const HISTORICAL_BOTTLENECK_HEATMAP_NODES = [
        { lat: 18.7500, lng: 73.4000, radiusMeters: 42000, color: "#EF4444", name: "NH-48 Lonavala Ghats Monsoon Congestion Bottleneck", avgSpeed: "22 km/h", delayMin: "+38m" },
        { lat: 18.9800, lng: 72.9800, radiusMeters: 35000, color: "#F59E0B", name: "JNPT Port Freight Gate Entry Bottleneck", avgSpeed: "14 km/h", delayMin: "+45m" },
        { lat: 28.5200, lng: 77.2100, radiusMeters: 45000, color: "#EF4444", name: "Delhi NCR Ashram Ring Road Congestion Zone", avgSpeed: "18 km/h", delayMin: "+52m" },
        { lat: 12.9800, lng: 77.7000, radiusMeters: 38000, color: "#F59E0B", name: "KR Puram Outer Ring Corridor Bottleneck", avgSpeed: "20 km/h", delayMin: "+35m" },
        { lat: 13.0800, lng: 80.2500, radiusMeters: 32000, color: "#EF4444", name: "Chennai Port Expressway Freight Toll Bottleneck", avgSpeed: "24 km/h", delayMin: "+28m" }
      ];

      HISTORICAL_BOTTLENECK_HEATMAP_NODES.forEach((node) => {
        const heatPulse = L.circle([node.lat, node.lng], {
          radius: node.radiusMeters * 1.3,
          color: node.color,
          fillColor: node.color,
          fillOpacity: 0.12,
          weight: 0,
        });

        const heatCore = L.circle([node.lat, node.lng], {
          radius: node.radiusMeters * 0.7,
          color: node.color,
          fillColor: node.color,
          fillOpacity: 0.28,
          weight: 1.5,
          dashArray: "4, 6"
        });

        const heatMarker = L.marker([node.lat, node.lng], {
          icon: L.divIcon({
            className: "traffic-heatmap-icon cursor-pointer",
            html: `<div class="relative flex items-center justify-center">
                     <div class="absolute w-6 h-6 bg-red-500/30 rounded-full animate-ping"></div>
                     <div class="bg-red-950/90 border border-red-500 text-red-300 font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                       🔥 BOTTLENECK (${node.avgSpeed})
                     </div>
                   </div>`,
            iconSize: [110, 24],
            iconAnchor: [55, 12]
          })
        });

        heatMarker.bindTooltip(`
          <div style="font-family: monospace; font-size: 10.5px; color: #FFFFFF; padding: 4px;">
            <div style="color: #FCA5A5; font-weight: bold; border-bottom: 1px solid #7F1D1D; padding-bottom: 2px; margin-bottom: 4px;">
              🔥 HISTORICAL TRAFFIC DENSITY BOTTLENECK
            </div>
            <div style="font-weight: bold;">${node.name}</div>
            <div style="color: #FDBA74; margin-top: 2px;">Avg Speed: <strong>${node.avgSpeed}</strong> • Projected Delay: <strong>${node.delayMin}</strong></div>
            <div style="font-size: 9px; color: #94A3B8; margin-top: 3px; font-style: italic;">
              Historical route performance indicates high congestion risk.
            </div>
          </div>
        `, {
          direction: "top",
          className: "bg-[#090D16] border border-red-800 text-white rounded p-2 shadow-2xl"
        });

        layerGroup.addLayer(heatPulse);
        layerGroup.addLayer(heatCore);
        layerGroup.addLayer(heatMarker);
      });
    }

    // 7. Calculate Animated Transit Vehicle Position & Selected Vehicle Marker
    const currentLat = currentLatForDev;
    const currentLng = currentLngForDev;

    const status = currentVehicle?.status || "ACTIVE";
    const plate = currentVehicle?.license_plate || "FLT-9821";

    const statusBg = 
      status === "ACTIVE" ? (isGeofenceBreached ? "bg-[#EF4444]" : "bg-[#10B981]") : 
      status === "MAINTENANCE" ? "bg-[#F59E0B]" : "bg-[#EF4444]";

    const vehicleMarker = L.marker([currentLat, currentLng], {
      icon: L.divIcon({
        className: "custom-vehicle-icon cursor-pointer",
        html: `<div class="relative flex flex-col items-center justify-center">
                 <div class="absolute -top-7 px-2 py-0.5 ${isGeofenceBreached ? 'bg-red-950 border-red-500 text-red-400 font-bold' : 'bg-[#090D16]/95 border-gray-700 text-white'} border text-[8px] font-mono rounded whitespace-nowrap shadow-2xl z-50">
                   ${isGeofenceBreached ? '⚠️ ' : '🚚 '}${plate}
                 </div>
                 <div class="absolute w-8 h-8 rounded-full border border-dashed ${isGeofenceBreached ? 'border-red-500 animate-[pulse_1s_infinite]' : 'border-white/30 animate-[spin_6s_linear_infinite]'}"></div>
                 <div class="w-4 h-4 ${statusBg} border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.7)]">
                   <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    });

    // Quick Dispatch Popup for Selected Vehicle
    const quickDispatchPopupHtml = `
      <div style="font-family: monospace; font-size: 11px; color: #F8FAFC; background: #090D16; padding: 10px; border-radius: 8px; border: 1px solid #334155; width: 230px;">
        <div style="font-weight: bold; color: #60A5FA; border-bottom: 1px solid #1E293B; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>🚚 ${plate}</span>
          <span style="color: #94A3B8; font-size: 9px; text-transform: uppercase;">${currentVehicle?.type || 'Truck'}</span>
        </div>
        <div style="color: #CBD5E1; font-size: 10px; margin-bottom: 10px; line-height: 1.6;">
          <div>Status: <strong style="color: ${status === 'ACTIVE' ? '#10B981' : '#F59E0B'}">${status}</strong></div>
          <div>GPS: <strong>${currentLat}° N, ${currentLng}° E</strong></div>
          <div>Current Route: <strong>JNPT ➜ ${target.name.split(" ")[0]}</strong></div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button class="quick-dispatch-hub-btn" data-vcode="${currentVehicle?.id}" style="width: 100%; background: #2563EB; color: white; font-weight: bold; padding: 6px 8px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer; text-transform: uppercase;">
            ⚡ Quick Dispatch ➔ Service Hub (Pune)
          </button>
          <button class="quick-dispatch-refuel-btn" data-vcode="${currentVehicle?.id}" style="width: 100%; background: #D97706; color: white; font-weight: bold; padding: 6px 8px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer; text-transform: uppercase;">
            ⛽ Quick Dispatch ➔ Refuel Station (BLR)
          </button>
        </div>
      </div>
    `;

    vehicleMarker.bindPopup(quickDispatchPopupHtml);
    layerGroup.addLayer(vehicleMarker);

    // 8. Draw All Other Fleet Transports on Their Designated Paths
    const DEST_KEYS = ["TERMINAL_E_GATE_12", "LOGISTICS_HUB_4", "STAGING_YARD_B", "NORTH_PORT_A", "WEST_DECK_6"];
    
    vehicles.forEach((v, idx) => {
      if (v.id === selectedVehicleId) return;

      const vOrigin = LOCATIONS.DEPOT;
      let vDestKey = DEST_KEYS[idx % DEST_KEYS.length];
      const assignedOrder = orders?.find((o) => o.vehicle_id === v.id || o.vehicleId === v.id);
      if (assignedOrder && LOCATIONS[assignedOrder.destination_name]) {
        vDestKey = assignedOrder.destination_name;
      }

      const vTarget = LOCATIONS[vDestKey] || LOCATIONS.TERMINAL_E_GATE_12;
      const isMaintenance = v.status === "MAINTENANCE";
      
      const vOffset = (idx * 0.17) % 1.0;
      const vProgress = isMaintenance ? 0.0 : ((routeProgress + vOffset) % 1.0);

      const shiftLat = isMaintenance ? ((idx * 0.08) - 0.2) : 0;
      const shiftLng = isMaintenance ? ((idx * 0.08) - 0.2) : 0;

      const vLat = vOrigin.lat + (vTarget.lat - vOrigin.lat) * vProgress + shiftLat;
      const vLng = vOrigin.lng + (vTarget.lng - vOrigin.lng) * vProgress + shiftLng;

      if (!isMaintenance) {
        const vRoutePoints = [[vOrigin.lat, vOrigin.lng], [vTarget.lat, vTarget.lng]] as [number, number][];
        const otherRouteLine = L.polyline(vRoutePoints, {
          color: isOperator ? "#334155" : "#475569",
          weight: isOperator ? 1.2 : 1.5,
          className: "flowing-route-path",
          opacity: isOperator ? 0.2 : 0.35
        });
        otherRouteLine.bindTooltip(`Corridor: ${v.license_plate} ➜ ${vTarget.name.split(" ")[0]}`, {
          direction: "top",
          className: "bg-[#090D16]/90 border border-slate-700 text-slate-400 text-[8px] font-mono rounded px-1 py-0.5"
        });
        layerGroup.addLayer(otherRouteLine);
      }

      const vStatusBg = 
        v.status === "ACTIVE" ? "bg-emerald-500/80" : 
        v.status === "MAINTENANCE" ? "bg-amber-500/80" : "bg-rose-500/80";

      const otherVehicleMarker = L.marker([vLat, vLng], {
        icon: L.divIcon({
          className: `custom-vehicle-icon ${isOperator ? 'opacity-50 hover:opacity-100' : 'opacity-80 hover:opacity-100'} transition-opacity cursor-pointer`,
          html: `<div class="relative flex flex-col items-center justify-center scale-90">
                   <div class="absolute -top-6 px-1.5 py-0.5 bg-[#090D16]/90 border border-slate-700 text-slate-300 text-[8px] font-mono rounded whitespace-nowrap shadow-md z-40 ${isOperator ? 'opacity-60' : ''}">
                     ${isMaintenance ? '🔧 ' : '🚚 '}${v.license_plate}
                   </div>
                   <div class="w-3.5 h-3.5 ${vStatusBg} border border-white rounded-full flex items-center justify-center shadow-lg">
                     <span class="w-1 h-1 bg-white rounded-full"></span>
                   </div>
                 </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      });

      const otherPopupHtml = `
        <div style="font-family: monospace; font-size: 11px; color: #F8FAFC; background: #090D16; padding: 10px; border-radius: 8px; border: 1px solid #334155; width: 220px;">
          <div style="font-weight: bold; color: #60A5FA; border-bottom: 1px solid #1E293B; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>🚚 ${v.license_plate}</span>
            <span style="color: #94A3B8; font-size: 9px;">${v.type}</span>
          </div>
          <div style="color: #CBD5E1; font-size: 10px; margin-bottom: 8px;">
            <div>Status: <strong style="color: ${v.status === 'ACTIVE' ? '#10B981' : '#F59E0B'}">${v.status}</strong></div>
            <div>Max Payload: <strong>${v.max_capacity} kg</strong></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button class="quick-dispatch-hub-btn" data-vcode="${v.id}" style="width: 100%; background: #2563EB; color: white; font-weight: bold; padding: 6px 8px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer; text-transform: uppercase;">
              ⚡ Quick Dispatch ➔ Service Hub
            </button>
            <button class="quick-dispatch-refuel-btn" data-vcode="${v.id}" style="width: 100%; background: #D97706; color: white; font-weight: bold; padding: 6px 8px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer; text-transform: uppercase;">
              ⛽ Quick Dispatch ➔ Refueling Station
            </button>
          </div>
        </div>
      `;

      otherVehicleMarker.bindPopup(otherPopupHtml);

      otherVehicleMarker.on("click", () => {
        setSelectedVehicleId(v.id);
        if (vDestKey) {
          setTargetDest(vDestKey);
        }
      });

      layerGroup.addLayer(otherVehicleMarker);
    });

    // Attach Leaflet Popup Click Listener for Quick Dispatch
    const handlePopupOpen = (e: L.PopupEvent) => {
      const container = e.popup.getElement();
      if (!container) return;

      const hubBtn = container.querySelector(".quick-dispatch-hub-btn");
      if (hubBtn) {
        hubBtn.addEventListener("click", () => {
          const vId = hubBtn.getAttribute("data-vcode") || selectedVehicleId;
          handleQuickDispatch(vId, "LOGISTICS_HUB_4", "PUNE_LOGISTICS_HUB (Service Hub)");
          map.closePopup();
        });
      }

      const refuelBtn = container.querySelector(".quick-dispatch-refuel-btn");
      if (refuelBtn) {
        refuelBtn.addEventListener("click", () => {
          const vId = refuelBtn.getAttribute("data-vcode") || selectedVehicleId;
          handleQuickDispatch(vId, "STAGING_YARD_B", "BENGALURU_HUB (Refueling Station)");
          map.closePopup();
        });
      }
    };

    map.on("popupopen", handlePopupOpen);

    return () => {
      map.off("popupopen", handlePopupOpen);
    };

  }, [targetDest, currentVehicle, routeProgress, simulateDeviation, geofenceRadiusKm, vehicles, orders, selectedVehicleId, mapLayer]);

const handleRecenter = () => {
  if (mapInstanceRef.current) {
    mapInstanceRef.current.setView([20.5937, 78.9629], 5);
  }
};

return (
  <div className="space-y-6 font-sans">
    
    {/* 1. Digital Twin Real-Time Stats Bar */}
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 bg-[#0F1117] border border-[#2A2D35] p-4 rounded-lg font-mono text-xs shadow-md">
      
      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Vehicles Available
        </div>
        <div className="text-white font-bold text-lg">{vehiclesAvailable}</div>
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Vehicles On Trip
        </div>
        <div className="text-white font-bold text-lg">{vehiclesOnTrip}</div>
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
          Under Maintenance
        </div>
        <div className="text-white font-bold text-lg">{vehiclesMaintenance}</div>
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          Delayed Deliveries
        </div>
        <div className="text-white font-bold text-lg">{delayedDeliveries}</div>
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-gray-400" />
          Cargo In Transit
        </div>
        <div className="text-white font-bold text-lg">{cargoInTransit} kg</div>
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5 text-[#3B82F6]" />
          Fuel Consumption (Est)
        </div>
        <div className="text-white font-bold text-lg">{fuelConsumption} L</div>
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          Active Drivers
        </div>
        <div className="text-white font-bold text-lg">{activeDrivers}</div>
      </div>

    </div>

    {/* 2. Visual Map & Controls */}
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
                <option key={v.id} value={v.id} className="bg-[#0F1117] text-white">
                  {v.id} ({v.type})
                </option>
              ))}
            </select>
          </div>

          <div className="px-3 py-1.5 rounded bg-[#1A1D26]/90 border border-[#2A2D35] font-mono text-xs text-right shadow-md pointer-events-auto">
            <div className="text-[9px] text-[#8E9299]">GPS_CORRELATION</div>
            <div className="text-[#4ADE80] font-bold">{currentLat}° N, {currentLng}° E</div>
          </div>
        </div>

        {/* Real-time Geofence Breach Warning Overlay Banner */}
        {isGeofenceBreached && (
          <div className="absolute top-[52px] left-4 right-4 z-[401] bg-[#7F1D1D]/95 backdrop-blur-md border border-[#EF4444] text-white p-2.5 rounded shadow-2xl font-mono text-[10px] animate-pulse flex items-center gap-3 pointer-events-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <div className="flex-1">
              <span className="font-bold text-red-400 uppercase tracking-wider">CORRIDOR BREACH:</span> Unit <span className="font-bold text-yellow-300">{currentVehicle?.license_plate || "FLT-9821"}</span> drifted <span className="font-bold text-yellow-300">{currentDeviationKm}km</span> off-course! Max corridor buffer is <span className="font-bold text-white">{geofenceRadiusKm}km</span>.
            </div>
            <button 
              onClick={() => setSimulateDeviation(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[9px] uppercase cursor-pointer"
            >
              Auto-Correct
            </button>
          </div>
        )}

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
            <filter id="heatmap-blur-twin" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
        </svg>

        {/* Real-time Weather Radar Overlay Panel */}
        {showWeatherOverlay && (
          <div className="absolute top-14 right-4 z-[401] bg-[#0A0D14]/90 backdrop-blur-md border border-cyan-500/40 text-white p-3 rounded-lg shadow-2xl font-mono text-[10px] max-w-xs space-y-2 pointer-events-auto">
            <div className="flex justify-between items-center border-b border-cyan-500/30 pb-1.5">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Monsoon Weather Radar</span>
              </span>
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                LIVE MET-API
              </span>
            </div>

            <div className="space-y-1.5 text-[9.5px]">
              <div className="flex justify-between items-center bg-[#121824] p-1.5 rounded border border-[#2A2D35]">
                <span className="text-gray-400">Ghats Corridor (NH-48):</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-amber-400" /> 42 km/h Crosswind
                </span>
              </div>
              <div className="flex justify-between items-center bg-[#121824] p-1.5 rounded border border-[#2A2D35]">
                <span className="text-gray-400">Precipitation Intensity:</span>
                <span className="text-blue-400 font-bold">Heavy Rain (18 mm/h)</span>
              </div>
              <div className="flex justify-between items-center bg-[#121824] p-1.5 rounded border border-[#2A2D35]">
                <span className="text-gray-400">Route Hydroplaning Risk:</span>
                <span className="text-red-400 font-bold">ELEVATED (82%)</span>
              </div>
            </div>

            <p className="text-[8.5px] text-gray-400 italic leading-snug">
              ⚠️ Driver advisory: Maintain 60 km/h speed governor across Lonavala steep gradient sections.
            </p>
          </div>
        )}

        {/* Map Legend */}
        <div className="flex justify-between items-end z-10 relative pointer-events-none">
          <div className="bg-[#0A0B0E]/90 backdrop-blur-sm border border-[#2A2D35] p-2.5 rounded text-[10px] font-mono text-[#8E9299] space-y-1 shadow-xl pointer-events-auto">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest border-b border-[#2A2D35] pb-1 mb-1 font-bold">Legend (India Logistics)</div>
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
            <button 
              onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
              className={`p-2 rounded border transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider ${
                showWeatherOverlay 
                  ? "bg-[#064E3B] border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                  : "bg-[#1A1D26] border-[#2A2D35] text-gray-400 hover:text-white"
              }`}
              title="Toggle Adverse Weather & Monsoon Radar Overlay"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>{showWeatherOverlay ? "WEATHER: ON" : "WEATHER: OFF"}</span>
            </button>
            <button 
              onClick={() => setMapLayer(mapLayer === "operator" ? "standard" : "operator")}
              className={`p-2 rounded border transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider ${
                mapLayer === "operator" 
                  ? "bg-blue-950/80 border-blue-500 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]" 
                  : "bg-[#1A1D26] border-[#2A2D35] text-gray-400 hover:text-white"
              }`}
              title="Toggle Standard Street / High-Visibility Operator layer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{mapLayer === "operator" ? "MAP: OPERATOR" : "MAP: STREET"}</span>
            </button>
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`p-2 rounded border transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider ${
                showHeatmap 
                  ? "bg-[#1E3A8A] border-blue-500 text-blue-200" 
                  : "bg-[#1A1D26] border-[#2A2D35] text-gray-400 hover:text-white"
              }`}
              title="Toggle Route Congestion Heatmap"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{showHeatmap ? "HEATMAP: ON" : "HEATMAP: OFF"}</span>
            </button>
            <button 
              onClick={handleRecenter}
              className="p-2 rounded bg-[#1A1D26] border border-[#2A2D35] text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Recenter Map"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Toasts container */}
        <div className="absolute bottom-16 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-auto">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50 }}
                className="bg-[#1C1115]/95 backdrop-blur-md border border-red-500/30 border-l-4 border-l-red-500 text-white p-3 rounded-lg shadow-2xl font-mono text-xs flex items-start gap-2.5 min-w-[280px]"
              >
                <div className="p-1 bg-red-500/10 rounded text-red-400 flex-shrink-0">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">
                      Geo-Fence Alert
                    </span>
                    <span className="text-[9px] text-gray-500 font-normal ml-2">
                      {toast.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-gray-400 hover:text-white font-bold text-[10px] cursor-pointer pl-1.5 flex-shrink-0"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>

      {/* Right Interactive Control Sidebar with Tabs */}
      <div className="bg-[#0F1117] border border-[#2A2D35] rounded-lg p-5 flex flex-col justify-between font-sans shadow-md">
        <div>
          {/* Sidebar Tab Header */}
          <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3 mb-4">
            <div className="flex flex-wrap gap-1 bg-[#161922] p-1 rounded border border-[#2A2D35]">
              <button
                type="button"
                onClick={() => setActiveRightTab("reroute")}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                  activeRightTab === "reroute" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Re-Route
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("health")}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  activeRightTab === "health" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Wrench className="w-3 h-3 text-amber-400" />
                Health
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("shift")}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  activeRightTab === "shift" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Timer className="w-3 h-3 text-emerald-400" />
                Shift
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("energy")}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  activeRightTab === "energy" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Zap className="w-3 h-3 text-amber-300" />
                Energy
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("status_log")}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  activeRightTab === "status_log" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Clock className="w-3 h-3" />
                Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("geofences")}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  activeRightTab === "geofences" ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Fences
              </button>
            </div>
            <Cpu className="w-4 h-4 text-[#4ADE80] shadow-[0_0_8px_#4ADE80] shrink-0" />
          </div>

          {/* TAB 1: RE-ROUTE SIMULATOR & QUICK DISPATCH */}
          {activeRightTab === "reroute" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Target Destination</label>
                <select
                  value={targetDest}
                  onChange={(e) => {
                    setTargetDest(e.target.value);
                    setIsRouteModalOpen(true);
                  }}
                  className="w-full bg-[#1A1D26] border border-[#2A2D35] text-white p-2.5 rounded text-sm font-mono focus:outline-none focus:border-[#4ADE80]"
                >
                  {destinations.map((d) => (
                    <option key={d.value} value={d.value} className="bg-[#0F1117] text-white">{d.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(true)}
                  className="mt-2 text-xs text-[#4ADE80] hover:text-white font-mono flex items-center gap-1.5 bg-[#161922] border border-[#4ADE80]/15 hover:border-[#4ADE80]/40 px-2.5 py-1.5 rounded transition-all cursor-pointer font-bold uppercase"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Show Route Analysis</span>
                </button>
              </div>

              {/* Quick Dispatch Shortcuts */}
              <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded space-y-2">
                <div className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Dispatch Command Center</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDispatch(selectedVehicleId, "LOGISTICS_HUB_4", "PUNE_LOGISTICS_HUB (Service Hub)")}
                    className="py-1.5 px-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-blue-200 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-400" />
                    <span>To Service Hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDispatch(selectedVehicleId, "STAGING_YARD_B", "BENGALURU_HUB (Refueling Station)")}
                    className="py-1.5 px-2 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/30 text-amber-200 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Fuel className="w-3 h-3 text-amber-400" />
                    <span>To Refuel Station</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block mb-1.5">Optimization Rule</label>
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

              {/* Geo-Fence Corridor Settings */}
              <div className="border-t border-[#2A2D35] pt-3 space-y-2.5">
                <label className="text-xs text-[#8E9299] uppercase tracking-wider font-mono font-medium block">
                  Geo-Fence Sentinel Buffer
                </label>
                
                <div className="flex items-center justify-between bg-[#1A1D26] p-2 rounded border border-[#2A2D35]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    <span className="text-xs font-mono text-white">Simulate Vector Drift</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulateDeviation}
                    onChange={(e) => setSimulateDeviation(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#4ADE80] focus:ring-emerald-500 cursor-pointer accent-[#4ADE80]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-[#8E9299]">
                    <span>Corridor Limit Buffer:</span>
                    <span className="text-white font-bold">{geofenceRadiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    step="10"
                    value={geofenceRadiusKm}
                    onChange={(e) => setGeofenceRadiusKm(Number(e.target.value))}
                    className="w-full h-1 bg-[#1A1D26] rounded-lg appearance-none cursor-pointer accent-[#4ADE80]"
                  />
                </div>
              </div>

              {/* Maintenance Health Forecast & Shift Estimator Quick Cards */}
              <div className="border-t border-[#2A2D35] pt-3 space-y-2">
                <div 
                  onClick={() => setActiveRightTab("health")}
                  className="bg-[#141720] border border-[#2A2D35] hover:border-amber-500/50 p-2.5 rounded cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[10.5px] font-mono font-bold text-slate-200">Health Forecast</div>
                      <div className="text-[9.5px] font-mono text-gray-400">{maintHealth.mileageKm.toLocaleString()} km • {maintHealth.score}/100</div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                    maintHealth.status === "URGENT" ? "bg-red-900/80 text-red-300 border-red-500" :
                    maintHealth.status === "WARNING" ? "bg-amber-900/80 text-amber-300 border-amber-500" :
                    "bg-emerald-900/80 text-emerald-300 border-emerald-500"
                  }`}>
                    {maintHealth.status}
                  </span>
                </div>

                <div 
                  onClick={() => setActiveRightTab("shift")}
                  className={`p-2.5 rounded border cursor-pointer transition-all flex items-center justify-between ${
                    shiftEstimate.isRegulatoryRisk 
                      ? "bg-red-950/40 border-red-500/60 hover:border-red-400" 
                      : "bg-[#141720] border-[#2A2D35] hover:border-emerald-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Timer className={`w-4 h-4 ${shiftEstimate.isRegulatoryRisk ? "text-red-400" : "text-emerald-400"}`} />
                    <div>
                      <div className="text-[10.5px] font-mono font-bold text-slate-200">Shift Estimator</div>
                      <div className="text-[9.5px] font-mono text-gray-400">ETA: {shiftEstimate.estimatedEndTimeStr} • {shiftEstimate.remainingKm} km left</div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                    shiftEstimate.isRegulatoryRisk ? "bg-red-600 text-white border-red-400 animate-pulse" : "bg-emerald-900/80 text-emerald-300 border-emerald-500"
                  }`}>
                    {shiftEstimate.isRegulatoryRisk ? "EXCEEDED" : "COMPLIANT"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MAINTENANCE HEALTH FORECAST WIDGET */}
          {activeRightTab === "health" && (
            <div className="space-y-3.5 font-mono text-xs">
              <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
                maintHealth.status === "URGENT" ? "bg-red-950/60 border-red-500/50 text-red-200" :
                maintHealth.status === "WARNING" ? "bg-amber-950/60 border-amber-500/50 text-amber-200" :
                "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                    <Wrench className="w-4 h-4 shrink-0 text-amber-400" />
                    Maintenance Health Forecast
                  </span>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] border ${
                    maintHealth.status === "URGENT" ? "bg-red-500 text-white border-red-400 animate-pulse" :
                    maintHealth.status === "WARNING" ? "bg-amber-500 text-slate-950 border-amber-400" :
                    "bg-emerald-500 text-slate-950 border-emerald-400"
                  }`}>
                    {maintHealth.status} STATUS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-[#0B0D13] p-2 rounded border border-[#2A2D35]">
                    <div className="text-[9px] text-gray-400 uppercase">Health Score</div>
                    <div className="text-base font-extrabold text-white mt-0.5">{maintHealth.score} / 100</div>
                  </div>
                  <div className="bg-[#0B0D13] p-2 rounded border border-[#2A2D35]">
                    <div className="text-[9px] text-gray-400 uppercase">Cumulative Mileage</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">{maintHealth.mileageKm.toLocaleString()} km</div>
                  </div>
                </div>
              </div>

              {/* Engine Diagnostic Breakdown */}
              <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-lg space-y-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold border-b border-[#2A2D35] pb-1 flex items-center justify-between">
                  <span>Engine Diagnostic Sensors</span>
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Coolant Temp:</span>
                    <span className={`font-bold ${maintHealth.engineDiagnostics.coolantTempC > 100 ? "text-red-400" : "text-emerald-400"}`}>
                      {maintHealth.engineDiagnostics.coolantTempC} °C
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Oil Pressure:</span>
                    <span className={`font-bold ${maintHealth.engineDiagnostics.oilPressurePsi < 30 ? "text-amber-400" : "text-emerald-400"}`}>
                      {maintHealth.engineDiagnostics.oilPressurePsi} PSI
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Brake Pad Wear:</span>
                    <span className={`font-bold ${maintHealth.engineDiagnostics.brakePadWearPct > 80 ? "text-red-400" : "text-slate-200"}`}>
                      {maintHealth.engineDiagnostics.brakePadWearPct}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Battery Voltage:</span>
                    <span className="font-bold text-blue-300">
                      {maintHealth.engineDiagnostics.batteryVoltageV} V
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#2A2D35] pt-1 mt-1">
                    <span className="text-gray-400">Transmission State:</span>
                    <span className="font-semibold text-amber-300 text-[10px] truncate max-w-[130px]">
                      {maintHealth.engineDiagnostics.transmissionStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Action Plan */}
              <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-lg space-y-1.5">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Recommended Maintenance Plan
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {maintHealth.recommendedAction}
                </p>
                <div className="text-[10px] text-gray-400 pt-1 flex justify-between">
                  <span>Next Mandatory Service:</span>
                  <span className="font-bold text-white">{maintHealth.nextServiceDays} Days</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHIFT COMPLETION ESTIMATOR WIDGET */}
          {activeRightTab === "shift" && (
            <div className="space-y-3.5 font-mono text-xs">
              <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between border-b border-[#2A2D35] pb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-[#4ADE80] text-[11px]">
                    <Timer className="w-4 h-4 text-[#4ADE80]" />
                    Shift Completion Estimator
                  </span>
                  <span className="text-[10px] text-gray-400">FMCSA 10h Cap</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-[#0B0D13] p-2.5 rounded border border-[#2A2D35]">
                    <div className="text-[9px] text-gray-400 uppercase">Estimated Shift End</div>
                    <div className="text-base font-extrabold text-blue-400 mt-0.5">{shiftEstimate.estimatedEndTimeStr}</div>
                  </div>
                  <div className="bg-[#0B0D13] p-2.5 rounded border border-[#2A2D35]">
                    <div className="text-[9px] text-gray-400 uppercase">Route Distance Left</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">{shiftEstimate.remainingKm} km</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Historical Fleet Speed:</span>
                    <span className="font-bold text-white">{shiftEstimate.historicalAvgSpeedKmh} km/h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Drive Time Remaining:</span>
                    <span className="font-bold text-emerald-400">+{shiftEstimate.remainingHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Driving Session:</span>
                    <span className={`font-extrabold ${shiftEstimate.isRegulatoryRisk ? "text-red-400" : "text-white"}`}>
                      {shiftEstimate.totalSessionHours} hrs / {shiftEstimate.regulatoryCapHours} hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Regulatory Limit Warning Box */}
              {shiftEstimate.isRegulatoryRisk ? (
                <div className="bg-red-950/80 border border-red-500/80 p-3 rounded-lg text-red-200 space-y-1.5 animate-pulse">
                  <div className="flex items-center gap-1.5 font-extrabold text-red-400 uppercase text-[11px]">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Regulatory Overtime Limit Risk!
                  </div>
                  <p className="text-[11px] leading-snug">
                    Driver is projected to exceed the <strong>10.0 hr daily driving limit</strong> by <strong>+{shiftEstimate.overtimeMinutes} minutes</strong> before destination arrival.
                  </p>
                  <div className="text-[10px] text-red-300 font-bold bg-red-900/60 p-1.5 rounded border border-red-800/80 mt-1">
                    Action: Re-route to nearest rest stop or schedule driver swap.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-lg text-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase text-[10.5px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Fully Regulatory Compliant
                  </div>
                  <p className="text-[10.5px] text-gray-300 leading-tight">
                    Projected driving session remains comfortably within HOS 10.0-hour safety caps.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REAL-TIME STATUS LOG SIDEBAR */}
          {activeRightTab === "status_log" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-[#2A2D35] pb-2">
                <span className="uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Live Transition Log ({currentVehicle?.license_plate || "Selected"})
                </span>
                <span className="text-[10px] text-gray-500">{statusLogs.length} Records</span>
              </div>

              <div className="max-h-[310px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {statusLogs.map((log) => {
                  const stateBadgeColor = 
                    log.state === "MOVING" ? "bg-emerald-950/80 border-emerald-500 text-emerald-400" :
                    log.state === "ARRIVED" ? "bg-blue-950/80 border-blue-500 text-blue-400" :
                    log.state === "RE_ROUTED" ? "bg-indigo-950/80 border-indigo-500 text-indigo-300" :
                    log.state === "ZONE_ENTERED" ? "bg-amber-950/80 border-amber-500 text-amber-300" :
                    "bg-red-950/80 border-red-500 text-red-400";

                  return (
                    <div key={log.id} className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded font-mono text-[11px] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold ${stateBadgeColor}`}>
                          {log.state}
                        </span>
                        <span className="text-[10px] text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="text-white font-medium text-[11px]">{log.location}</div>
                      <div className="text-gray-400 text-[10px] leading-tight">{log.details}</div>
                      <div className="text-[9px] text-emerald-400/90 pt-0.5">Speed: {log.speedKmh} km/h</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ENERGY CONSUMPTION & RANGE FORECAST OVERLAY */}
          {activeRightTab === "energy" && (
            <div className="space-y-3.5 font-mono text-xs">
              <div className="bg-[#141720] border border-[#2A2D35] p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between border-b border-[#2A2D35] pb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-amber-300 text-[11px]">
                    <Zap className="w-4 h-4 text-amber-300" />
                    Terrain & Load Energy Forecast
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded">
                    LIVE CAN-BUS
                  </span>
                </div>

                <div className="space-y-2 text-[11px] pt-1">
                  <div className="flex justify-between items-center bg-[#0B0D13] p-2 rounded border border-[#2A2D35]">
                    <span className="text-gray-400">Current Payload Load:</span>
                    <span className="text-white font-bold">14,200 kg (Heavy Freight)</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#0B0D13] p-2 rounded border border-[#2A2D35]">
                    <span className="text-gray-400">Terrain Gradient Profile:</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> +3.2% Slope (Ghats Ascent)
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#0B0D13] p-2 rounded border border-[#2A2D35]">
                    <span className="text-gray-400">Estimated Rate:</span>
                    <span className="text-blue-400 font-bold">0.42 {currentVehicle?.type === "Cargo Drone" ? "kWh" : "L"} / km</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#0B0D13] p-2 rounded border border-[#2A2D35]">
                    <span className="text-gray-400">Efficient Range Capacity:</span>
                    <span className="text-emerald-400 font-bold">1,100 km Max Tank</span>
                  </div>
                </div>
              </div>

              {/* Range Warning Alert Box */}
              {getRouteAnalysis().distance > 1100 ? (
                <div className="bg-rose-950/80 border border-rose-500 p-3 rounded-lg space-y-1.5">
                  <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    Range Exceeded Warning
                  </div>
                  <p className="text-[11px] text-rose-200 leading-snug">
                    Total corridor distance (<strong>{getRouteAnalysis().distance} km</strong>) exceeds vehicle efficient range (<strong>1,100 km</strong>) under current 14.2t cargo weight & terrain slope.
                  </p>
                  <div className="bg-[#0B0D13] p-2 rounded border border-rose-500/40 text-[10px] text-amber-300 font-bold mt-1">
                    ⚡ Mandatory Waypoint: Refuel at Pune Logistics Hub (KM 150) or switch to MIN_ENERGY eco-routing.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/80 border border-emerald-500 p-3 rounded-lg space-y-1">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Optimal Range Parameters
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    Route distance ({getRouteAnalysis().distance} km) is within vehicle's safe single-charge / tank operating radius.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VISUAL GEO-FENCING OVERLAYS MANAGER */}
          {activeRightTab === "geofences" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-[#2A2D35] pb-2">
                <span className="uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                  Active Geo-Fence Zones
                </span>
                <span className="text-[10px] text-gray-500">{geofenceZones.filter(z => z.active).length} Active</span>
              </div>

              {/* Auto-Zone Generator Button */}
              <button
                type="button"
                onClick={() => {
                  const autoZones: GeofenceZone[] = [
                    {
                      id: `ZONE-AUTO-ORIGIN-${Date.now()}`,
                      name: "⚡ Auto-Zone: MUMBAI JNPT PORT (Active Pickup)",
                      type: "RESTRICTED_URBAN",
                      lat: 18.9500,
                      lng: 72.9500,
                      radiusKm: 25,
                      color: "#3B82F6",
                      active: true,
                      alertMsg: "Corridor Deviation Breach: Vehicle left JNPT Pickup Auto-Zone without dispatch clearance!"
                    },
                    {
                      id: `ZONE-AUTO-DEST-${Date.now()}`,
                      name: "⚡ Auto-Zone: DELHI_ICD_DEPOT (Active Delivery)",
                      type: "HIGH_RISK",
                      lat: 28.5000,
                      lng: 77.2800,
                      radiusKm: 30,
                      color: "#10B981",
                      active: true,
                      alertMsg: "Corridor Deviation Breach: Vehicle approaching Delhi ICD Delivery Auto-Zone."
                    },
                    {
                      id: `ZONE-AUTO-PUNE-${Date.now()}`,
                      name: "⚡ Auto-Zone: PUNE LOGISTICS HUB (Refuel Corridor)",
                      type: "REFUELING_HUB",
                      lat: 18.5204,
                      lng: 73.8567,
                      radiusKm: 20,
                      color: "#F59E0B",
                      active: true,
                      alertMsg: "Waypoint Geofence: Transit vehicle inside Pune Corridor Auto-Zone."
                    }
                  ];
                  setGeofenceZones((prev) => [...autoZones, ...prev]);
                }}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded text-[10.5px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>GENERATE DYNAMIC AUTO-ZONES FOR ORDERS</span>
              </button>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {geofenceZones.map((zone) => (
                  <div key={zone.id} className="bg-[#141720] border border-[#2A2D35] p-2.5 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }}></span>
                        <span className="text-white font-bold text-[11px]">{zone.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={zone.active}
                        onChange={() => {
                          setGeofenceZones(prev => prev.map(z => z.id === zone.id ? { ...z, active: !z.active } : z));
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="text-[10px] text-gray-400">
                      Type: <span className="text-gray-200">{zone.type}</span> • Radius: <span className="text-emerald-400">{zone.radiusKm} km</span>
                    </div>
                    <div className="text-[9.5px] text-amber-300/80 italic">"{zone.alertMsg}"</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const newZone: GeofenceZone = {
                    id: `ZONE-CUSTOM-${Date.now()}`,
                    name: `Custom High-Density Perimeter #${geofenceZones.length + 1}`,
                    type: "HIGH_RISK",
                    lat: 20.0000,
                    lng: 75.0000,
                    radiusKm: 90,
                    color: "#EC4899",
                    active: true,
                    alertMsg: "Custom Security Perimeter Breach Detected!"
                  };
                  setGeofenceZones(prev => [newZone, ...prev]);
                }}
                className="w-full py-2 bg-[#1A1D26] hover:bg-[#252A38] border border-dashed border-gray-600 hover:border-gray-400 text-gray-300 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Draw / Add Custom Geo-Fence Zone</span>
              </button>
            </div>
          )}

        </div>

        {/* Action Button Section at Sidebar Bottom */}
        <div className="mt-5 space-y-3 border-t border-[#2A2D35] pt-4">
          {activeRightTab === "reroute" && (
            <button
              type="button"
              onClick={handleRerouteClick}
              disabled={loading || !currentVehicle}
              className="w-full py-3 bg-[#2563EB] text-white font-bold uppercase text-xs tracking-widest rounded hover:bg-[#1D4ED8] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:bg-gray-700 disabled:text-gray-400 cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.3)]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "EXECUTE RE-ROUTE"
              )}
            </button>
          )}

          {successMsg && (
            <div className={`p-2.5 rounded text-xs font-mono border ${
              successMsg.includes("failed") || successMsg.includes("error")
                ? "bg-red-950/20 border-red-500/30 text-red-400"
                : "bg-[#4ADE80]/5 border-[#4ADE80]/20 text-[#4ADE80]"
            }`}>
              {successMsg}
            </div>
          )}

          {aiAdvice && activeRightTab === "reroute" && (
            <div className="bg-[#161922] border border-[#2A2D35] p-3 rounded text-xs font-mono space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-blue-400 uppercase tracking-widest text-[9px] font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Routing Advisor (Gemini)</span>
              </div>
              <p className="text-[#E0E2E6] italic leading-relaxed">"{aiAdvice}"</p>
            </div>
          )}
        </div>

      </div>

    </div>

    {/* Route Analysis Modal */}
    <AnimatePresence>
      {isRouteModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#0C0E14] border border-[#2A2D35] rounded-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-[#8E9299] font-sans"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#2A2D35] pb-3.5 mb-4">
              <div>
                <h3 className="text-white font-bold text-base uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500 shadow-[0_0_8px_#3B82F6]" />
                  Route Optimization Analysis
                </h3>
                <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mt-0.5">DYNAMIC CORRIDOR PROFILE</p>
              </div>
              <button 
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1 text-gray-500 hover:text-white transition-colors font-mono font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selected Trip Details */}
            {(() => {
              const analysis = getRouteAnalysis();
              return (
                <div className="space-y-4">
                  {/* Summary Header */}
                  <div className="bg-[#161922] border border-[#2A2D35] rounded-lg p-3.5">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase">Vessel ID</span>
                        <span className="text-white font-bold">{currentVehicle?.id || "N/A"} ({currentVehicle?.type || "Standard"})</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase">Destination</span>
                        <span className="text-white font-bold truncate block" title={analysis.destinationName}>{analysis.destinationName}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 block text-[10px] uppercase">Total Distance</span>
                        <span className="text-blue-400 font-bold">{analysis.distance} km</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 block text-[10px] uppercase">Active Constraint</span>
                        <span className={`font-bold ${constraint === "MIN_ENERGY" ? "text-emerald-400" : "text-yellow-500"}`}>{constraint}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Metrics List */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* ETA */}
                    <div className="bg-[#12141A] border border-[#2A2D35] rounded p-3 font-mono text-center">
                      <Timer className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
                      <span className="text-[10px] text-gray-500 uppercase block">Travel Time</span>
                      <span className="text-white font-bold text-sm block mt-0.5">{analysis.travelTime}</span>
                    </div>

                    {/* Fuel Cost */}
                    <div className="bg-[#12141A] border border-[#2A2D35] rounded p-3 font-mono text-center">
                      <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                      <span className="text-[10px] text-gray-500 uppercase block">Fuel Cost</span>
                      <span className="text-white font-bold text-sm block mt-0.5">{analysis.fuelCost}</span>
                    </div>

                    {/* Carbon Emissions */}
                    <div className="bg-[#12141A] border border-[#2A2D35] rounded p-3 font-mono text-center">
                      <Activity className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                      <span className="text-[10px] text-gray-500 uppercase block">Carbon CO2</span>
                      <span className="text-white font-bold text-xs block mt-1 truncate">{analysis.carbonEmissions}</span>
                    </div>
                  </div>

                  {/* Energy Details & Warnings */}
                  <div className="bg-[#12141A] border border-[#2A2D35] rounded p-3 font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Fuel/Energy Needed:</span>
                      <span className="text-white font-semibold">{analysis.totalEnergy} ({analysis.energyType})</span>
                    </div>
                    <div className="text-amber-400 leading-relaxed text-[10.5px]">
                      💡 <strong>OPERATOR NOTE:</strong> {analysis.savingsNote}
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex gap-3 pt-2 border-t border-[#2A2D35] mt-1">
                    <button
                      type="button"
                      onClick={() => setIsRouteModalOpen(false)}
                      className="flex-1 py-2.5 bg-[#161922] hover:bg-[#1C1F2B] border border-[#2A2D35] text-gray-400 hover:text-white rounded text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                    >
                      Close Analysis
                    </button>
                    <button
                      type="button"
                      disabled={loading || !currentVehicle}
                      onClick={() => {
                        setIsRouteModalOpen(false);
                        handleRerouteClick();
                      }}
                      className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.2)] hover:shadow-[0_0_18px_rgba(37,99,235,0.4)]"
                    >
                      <span>Execute Re-Route</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>

  </div>
);
}
