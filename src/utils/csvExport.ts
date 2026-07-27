/**
 * TransitOps Universal CSV Export Utility
 */

export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const sanitizeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(sanitizeCell).join(",");
  const dataRows = rows.map((row) => row.map(sanitizeCell).join(","));
  const csvContent = [headerRow, ...dataRows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const formattedDate = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `${filename}_${formattedDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFleetVehiclesToCsv(vehicles: any[]) {
  const headers = ["Vehicle ID", "License Plate", "Type", "Max Capacity (kg)", "Status", "Velocity (km/h)", "Power Out (kW)", "Core Temp (°C)", "Fuel Capacity (%)", "Engine Load (%)"];
  const rows = vehicles.map((v) => [
    v.id,
    v.license_plate,
    v.type,
    v.max_capacity,
    v.status,
    v.velocity ?? "N/A",
    v.power_out ?? "N/A",
    v.core_temp ?? "N/A",
    v.fuel_capacity ?? "N/A",
    v.engine_load ?? "N/A",
  ]);
  downloadCsv("TransitOps_Fleet_Vehicles", headers, rows);
}

export function exportDriverProfilesToCsv(drivers: any[]) {
  const headers = ["Driver ID", "Name", "License Number", "License Status", "Status", "Safety Score", "Sudden Braking", "Speeding Events", "Fatigue Warnings", "Driving Hours Today", "Assigned Depot", "Phone", "Email", "Emergency Contact"];
  const rows = drivers.map((d) => [
    d.id,
    d.name,
    d.license_number,
    d.license_status || "VALID",
    d.status,
    d.safety_score ?? 90,
    d.sudden_braking_events ?? 0,
    d.speeding_events ?? 0,
    d.fatigue_indicators ?? 0,
    d.driving_hours_today ?? 0,
    d.profile?.assigned_depot || "Main Depot",
    d.profile?.phone || "N/A",
    d.profile?.email || "N/A",
    d.profile?.emergency_contact_name || "N/A",
  ]);
  downloadCsv("TransitOps_Driver_Profiles", headers, rows);
}

export function exportOrdersToCsv(orders: any[]) {
  const headers = ["Order ID", "Cargo Description", "Weight (kg)", "Destination Name", "Status", "Assigned Driver ID", "Assigned Vehicle ID", "Created At"];
  const rows = orders.map((o) => [
    o.id,
    o.cargo_description,
    o.weight,
    o.destination_name,
    o.status,
    o.driver_id || "Unassigned",
    o.vehicle_id || "Unassigned",
    o.created_at || new Date().toISOString(),
  ]);
  downloadCsv("TransitOps_Orders_Dispatches", headers, rows);
}

export function exportSafetyAndRiskToCsv(healthData: any[], safetyData: any[]) {
  const headers = ["Entity ID", "Entity Type", "Health / Safety Score", "Risk / Status Level", "Primary Metrics", "Details / Observations"];
  const rows: (string | number)[][] = [];

  healthData.forEach((v) => {
    rows.push([
      v.vehicle_id,
      "VEHICLE",
      `${v.health_percentage}%`,
      v.risk_level,
      `Engine Hrs: ${v.engine_hours}h | Total: ${v.total_kilometers}km`,
      `Est. Service: ${v.estimated_maintenance_date || "N/A"}`,
    ]);
  });

  safetyData.forEach((s) => {
    rows.push([
      s.driver_id,
      "DRIVER",
      `${s.safety_score}/100`,
      s.safety_score >= 85 ? "LOW" : s.safety_score >= 70 ? "MEDIUM" : "HIGH",
      `Braking: ${s.sudden_braking_events} | Speeding: ${s.speeding_events} | Fatigue: ${s.fatigue_indicators}`,
      `Driving Hours Today: ${s.driving_hours_today}h`,
    ]);
  });

  downloadCsv("TransitOps_Safety_Risk_Overview", headers, rows);
}
