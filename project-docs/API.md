# API Specifications - TransitOps

## Endpoints List

### 1. Retrieve Fleet Status
* **Endpoint:** `GET /api/fleet`
* **Response (200 OK):**
```json
{
  "vehicles": [
    { "id": "FLT-9821", "license_plate": "IL-9821-X", "type": "Heavy Truck", "max_capacity": 5000, "status": "ACTIVE" }
  ],
  "drivers": [
    { "id": "DRV-101", "name": "D. Vasquez", "license_number": "LIC-9821-V", "status": "IDLE", "current_vehicle_id": "FLT-9821" }
  ]
}
```

### 2. Retrieve Orders
* **Endpoint:** `GET /api/orders`
* **Response (200):**
```json
[
  { "id": "ORD-101", "cargo_description": "Medical Supplies", "weight": 450, "destination_name": "Lakeshore General", "destination_lat": 41.892, "destination_lng": -87.618, "status": "PENDING" }
]
```

### 3. Atomic Dispatch Order
* **Endpoint:** `POST /api/orders/dispatch`
* **Request Body:**
```json
{
  "orderId": "ORD-101",
  "driverId": "DRV-101",
  "vehicleId": "FLT-9821"
}
```
* **Response (200 Success):**
```json
{
  "success": true,
  "message": "Order ORD-101 successfully assigned to driver DRV-101 using vehicle FLT-9821."
}
```
* **Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Driver is currently in transit or vehicle is inactive. Transaction rolled back."
}
```

### 4. Execute Re-Route
* **Endpoint:** `POST /api/vehicles/re-route`
* **Request Body:**
```json
{
  "vehicleId": "FLT-9821",
  "destination": "TERMINAL_E_GATE_12",
  "constraint": "LOWEST_LATENCY"
}
```
* **Response (200):**
```json
{
  "success": true,
  "message": "Re-routing executed successfully. Estimated travel recalc completed (1.4s)."
}
```

### 5. Get Audit Logs
* **Endpoint:** `GET /api/audit-logs`
* **Response (200):**
```json
[
  { "id": 1, "operator": "ADMIN", "action": "DISPATCH_ORDER", "initial_state": "PENDING", "end_state": "ASSIGNED", "success": 1, "timestamp": "2026-07-11T21:44:00.000Z" }
]
```

### 6. Get Performance Metrics
* **Endpoint:** `GET /api/performance`
* **Response (200):**
```json
{
  "uptime": 98.42,
  "velocityIndex": 114.8,
  "activeAlerts": 4,
  "systemLoad": 42,
  "trend": [
    { "date": "OCT 12", "performance": 84 },
    { "date": "OCT 13", "performance": 88 }
  ]
}
```
