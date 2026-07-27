import React, { useState, useEffect, useRef } from "react";
import { Search, Truck, User, Package, X, ArrowRight, CornerDownLeft } from "lucide-react";

interface GlobalSearchPaletteProps {
  vehicles: any[];
  drivers: any[];
  orders: any[];
  onSelectVehicle: (id: string) => void;
  onSelectDriver?: (id: string) => void;
  onSelectOrder?: (id: string) => void;
  onSetTab: (tab: string) => void;
  onAddToast?: (toast: { type: "info" | "success" | "warning"; title: string; message: string }) => void;
}

export default function GlobalSearchPalette({
  vehicles,
  drivers,
  orders,
  onSelectVehicle,
  onSelectDriver,
  onSelectOrder,
  onSetTab,
  onAddToast
}: GlobalSearchPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener to trigger search: '/' or '⌘F' or 'Ctrl+F' or clicking search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (!isInput && (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f"))) {
        e.preventDefault();
        setIsOpen(true);
      } else if (isOpen && e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter search results across vehicles, drivers, and orders
  const q = query.trim().toLowerCase();
  const matchedVehicles = q
    ? vehicles.filter(
        (v) =>
          v.id.toLowerCase().includes(q) ||
          (v.license_plate && v.license_plate.toLowerCase().includes(q)) ||
          (v.type && v.type.toLowerCase().includes(q)) ||
          (v.status && v.status.toLowerCase().includes(q))
      )
    : vehicles.slice(0, 3);

  const matchedDrivers = q
    ? drivers.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          (d.status && d.status.toLowerCase().includes(q)) ||
          (d.assignedVehicle && d.assignedVehicle.toLowerCase().includes(q))
      )
    : drivers.slice(0, 3);

  const matchedOrders = q
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.customer && o.customer.toLowerCase().includes(q)) ||
          (o.destination && o.destination.toLowerCase().includes(q)) ||
          (o.status && o.status.toLowerCase().includes(q))
      )
    : orders.slice(0, 3);

  const allResults = [
    ...matchedVehicles.map((v) => ({ type: "vehicle" as const, item: v })),
    ...matchedDrivers.map((d) => ({ type: "driver" as const, item: d })),
    ...matchedOrders.map((o) => ({ type: "order" as const, item: o }))
  ];

  const handleSelectResult = (res: { type: "vehicle" | "driver" | "order"; item: any }) => {
    if (res.type === "vehicle") {
      onSelectVehicle(res.item.id);
      onSetTab("fleet");
      if (onAddToast) {
        onAddToast({
          type: "info",
          title: "Vehicle Selected",
          message: `Navigated to Fleet Digital Twin for unit ${res.item.id}.`
        });
      }
    } else if (res.type === "driver") {
      onSetTab("driver_profiles");
      if (onAddToast) {
        onAddToast({
          type: "info",
          title: "Driver Profile Found",
          message: `Navigated to Driver Profile for ${res.item.name} (${res.item.id}).`
        });
      }
    } else if (res.type === "order") {
      onSetTab("dispatch");
      if (onAddToast) {
        onAddToast({
          type: "info",
          title: "Order Found",
          message: `Navigated to Intelligent Assignment Engine for Order ${res.item.id}.`
        });
      }
    }
    setIsOpen(false);
  };

  const handleKeyDownInMenu = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(allResults[selectedIndex]);
    }
  };

  return (
    <div className="relative">
      {/* Header Bar Search Input Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#0B0D13] hover:bg-[#161922] text-slate-400 hover:text-slate-200 border border-[#2A2D35] px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer shadow-xs"
        title="Global Fleet Search (Press '/' or ⌘F)"
      >
        <Search className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Search Driver, Vehicle, Order...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="hidden md:inline-block bg-[#1F2332] text-slate-400 text-[9.5px] px-1.5 py-0.5 rounded font-mono border border-slate-700">
          /
        </kbd>
      </button>

      {/* Floating Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150">
          <div
            className="bg-[#0F1117] border border-[#2A2D35] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans text-xs text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Field */}
            <div className="p-3 border-b border-[#2A2D35] flex items-center gap-3 bg-[#141720]">
              <Search className="w-4 h-4 text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownInMenu}
                placeholder="Search driver name, vehicle ID, license plate, or order ID..."
                className="w-full bg-transparent text-white font-mono text-xs placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#2A2D35] rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Floating Dropdown Results */}
            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#1F2332]">
              {allResults.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-mono">
                  No matching driver, vehicle, or order found for "{query}".
                </div>
              ) : (
                <div className="space-y-1">
                  {allResults.map((res, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={`${res.type}-${res.item.id}`}
                        onClick={() => handleSelectResult(res)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? "bg-[#2563EB]/20 border border-[#2563EB]" : "hover:bg-[#161922] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {res.type === "vehicle" && (
                            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400">
                              <Truck className="w-4 h-4" />
                            </div>
                          )}
                          {res.type === "driver" && (
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          {res.type === "order" && (
                            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}

                          <div>
                            <div className="font-mono font-bold text-white text-xs flex items-center gap-2">
                              {res.type === "vehicle" && <span>{res.item.id}</span>}
                              {res.type === "driver" && <span>{res.item.name}</span>}
                              {res.type === "order" && <span>Order {res.item.id}</span>}

                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded border bg-[#0B0D13] border-slate-700 text-slate-400 uppercase">
                                {res.type}
                              </span>
                            </div>

                            <div className="text-[10.5px] font-mono text-slate-400 mt-0.5">
                              {res.type === "vehicle" && (
                                <span>
                                  Plate: {res.item.license_plate || "IL-9821"} • Type: {res.item.type || "Truck"} • Status:{" "}
                                  <strong className="text-emerald-400">{res.item.status || "ACTIVE"}</strong>
                                </span>
                              )}
                              {res.type === "driver" && (
                                <span>
                                  ID: {res.item.id} • Assigned: {res.item.assignedVehicle || "FLT-9821"} • Status:{" "}
                                  <strong className="text-blue-400">{res.item.status || "ACTIVE"}</strong>
                                </span>
                              )}
                              {res.type === "order" && (
                                <span>
                                  Customer: {res.item.customer || "Logistics Corp"} • Dest: {res.item.destination || "Depot Alpha"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-blue-400 font-mono font-bold">
                          <span>Jump to</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-2.5 bg-[#0B0D13] border-t border-[#2A2D35] text-[10px] font-mono text-slate-500 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">↑↓</kbd> Navigate
                <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 ml-2">↵</kbd> Select
              </span>
              <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">ESC</kbd> to exit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
