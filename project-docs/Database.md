# Database Schema Specification - TransitOps

## Relational Schema Diagram (SQLite)

```sql
-- 1. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  license_plate TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,          -- 'Heavy Truck', 'Medium Van', 'Cargo Drone'
  max_capacity REAL NOT NULL,   -- in kilograms
  status TEXT NOT NULL,         -- 'ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,         -- 'IDLE', 'IN_TRANSIT', 'OFF_DUTY'
  current_vehicle_id TEXT REFERENCES vehicles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders / Deliveries Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  cargo_description TEXT NOT NULL,
  weight REAL NOT NULL,         -- in kilograms
  destination_name TEXT NOT NULL,
  destination_lat REAL NOT NULL,
  destination_lng REAL NOT NULL,
  status TEXT NOT NULL,         -- 'PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED'
  driver_id TEXT REFERENCES drivers(id),
  vehicle_id TEXT REFERENCES vehicles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Telemetry Logs (Timeseries)
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT REFERENCES vehicles(id) NOT NULL,
  velocity REAL NOT NULL,
  power_out REAL NOT NULL,
  core_temp REAL NOT NULL,
  signal_strength REAL NOT NULL,
  fuel_capacity REAL NOT NULL,
  engine_load REAL NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit & Security Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator TEXT NOT NULL,
  action TEXT NOT NULL,
  initial_state TEXT,
  end_state TEXT,
  success INTEGER NOT NULL,     -- 1 for true, 0 for false
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Transactional Integrity & ACID Locks
To dispatch an order, we must run an atomic transaction performing these steps:
1. **BEGIN TRANSACTION**
2. Select vehicle `max_capacity` and `status` where `id = vehicle_id`
   * Check if status is `'ACTIVE'`. If not, raise exception (ROLLBACK).
3. Select driver `status` where `id = driver_id`
   * Check if driver status is `'IDLE'`. If not, raise exception (ROLLBACK).
4. Verify if `weight` <= `max_capacity`. If not, raise exception (ROLLBACK).
5. Update driver status to `'IN_TRANSIT'` and assign vehicle.
6. Update order status to `'ASSIGNED'` and link `driver_id` and `vehicle_id`.
7. Log operation to `audit_logs` as successful.
8. **COMMIT**
9. *Error handling block:* On any catch, execute **ROLLBACK** and insert a failure log into `audit_logs`.
