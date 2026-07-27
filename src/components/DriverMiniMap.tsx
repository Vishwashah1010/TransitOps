import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation, MapPin, Truck, ShieldCheck, Clock, Compass } from "lucide-react";

interface DriverMiniMapProps {
  originName?: string;
  originLat?: number;
  originLng?: number;
  destinationName?: string;
  destinationLat?: number;
  destinationLng?: number;
  vehicleId?: string;
  licensePlate?: string;
  speedKmH?: number;
  cargoDescription?: string;
}

// Default fallback coordinates (Indian logistics corridors)
const DEFAULT_ORIGIN = { name: "Mumbai Air Cargo / Port Gate 1", lat: 18.9500, lng: 72.9500 };
const DEFAULT_DEST = { name: "Delhi ICD Freight Depot", lat: 28.5000, lng: 77.2800 };

export default function DriverMiniMap({
  originName = DEFAULT_ORIGIN.name,
  originLat = DEFAULT_ORIGIN.lat,
  originLng = DEFAULT_ORIGIN.lng,
  destinationName = DEFAULT_DEST.name,
  destinationLat = DEFAULT_DEST.lat,
  destinationLng = DEFAULT_DEST.lng,
  vehicleId = "FLT-9821",
  licensePlate = "MH-04-TR-9981",
  speedKmH = 68,
  cargoDescription = "Pharmaceutical Substrates"
}: DriverMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Intermediate current position along route (approx ~40% between origin & dest)
  const currentLat = originLat + (destinationLat - originLat) * 0.45;
  const currentLng = originLng + (destinationLng - originLng) * 0.45;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing layers if any
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds(
      [originLat, originLng],
      [destinationLat, destinationLng]
    );
    bounds.extend([currentLat, currentLng]);
    map.fitBounds(bounds, { padding: [40, 40] });

    // 1. Origin Marker
    const originMarker = L.marker([originLat, originLng], {
      icon: L.divIcon({
        className: "custom-mini-icon",
        html: `<div class="relative flex items-center justify-center">
                 <div class="w-4 h-4 bg-emerald-600 border-2 border-white rounded-full shadow-md"></div>
               </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    }).addTo(map);
    originMarker.bindTooltip(`Origin: ${originName}`, { permanent: false, direction: "top" });

    // 2. Destination Marker
    const destMarker = L.marker([destinationLat, destinationLng], {
      icon: L.divIcon({
        className: "custom-mini-icon",
        html: `<div class="relative flex items-center justify-center">
                 <div class="w-4 h-4 bg-rose-600 border-2 border-white rounded-full shadow-md"></div>
               </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    }).addTo(map);
    destMarker.bindTooltip(`Destination: ${destinationName}`, { permanent: false, direction: "top" });

    // 3. Current Live Vehicle Position Marker
    const vehicleMarker = L.marker([currentLat, currentLng], {
      icon: L.divIcon({
        className: "custom-vehicle-icon",
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
                 <div class="w-7 h-7 bg-blue-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-[10px]">
                   🚛
                 </div>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    }).addTo(map);
    vehicleMarker.bindTooltip(`Vehicle ${vehicleId} (${speedKmH} km/h)`, { permanent: true, direction: "top", offset: [0, -10] });

    // 4. Polyline Pathing
    const routeCoords: [number, number][] = [
      [originLat, originLng],
      [currentLat, currentLng],
      [destinationLat, destinationLng]
    ];

    // Traveled polyline
    L.polyline([[originLat, originLng], [currentLat, currentLng]], {
      color: "#2563EB",
      weight: 4,
      opacity: 0.9,
      lineCap: "round"
    }).addTo(map);

    // Remaining polyline
    L.polyline([[currentLat, currentLng], [destinationLat, destinationLng]], {
      color: "#94A3B8",
      weight: 3,
      dashArray: "6, 8",
      opacity: 0.8
    }).addTo(map);

    // Invalidate size on load to render properly inside modals/tabs
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [originLat, originLng, destinationLat, destinationLng, currentLat, currentLng, vehicleId, speedKmH, originName, destinationName]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-100 p-2 rounded-t-lg border border-slate-200">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
          <span>Real-time Vehicle Pathing & GPS Overlay</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {speedKmH} km/h GPS Live
          </span>
          <span className="text-slate-600">{vehicleId} ({licensePlate})</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-56 rounded-b-lg border border-slate-200 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Route Info Box */}
        <div className="absolute bottom-2 left-2 z-10 bg-slate-900/90 text-white backdrop-blur-xs p-2.5 rounded-md border border-slate-700 text-[11px] space-y-1 max-w-xs shadow-xl">
          <div className="flex items-center justify-between text-blue-300 font-bold border-b border-slate-700 pb-1">
            <span>Route Transit Summary</span>
            <span className="text-emerald-400 font-mono">ON SCHEDULE</span>
          </div>
          <div className="text-slate-200 truncate">Origin: <strong>{originName}</strong></div>
          <div className="text-slate-200 truncate">Destination: <strong>{destinationName}</strong></div>
          <div className="text-slate-400 font-mono text-[10px] pt-0.5">Cargo: {cargoDescription}</div>
        </div>
      </div>
    </div>
  );
}
