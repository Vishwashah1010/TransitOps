<div align="center">
  <img width="1200" height="400" style="object-fit: cover; border-radius: 8px;" alt="TransitOps Dashboard" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
  <h1>⚡ TransitOps ⚡</h1>
  <p><strong>Real-Time Smart Transport Operations Platform & Logistics Engine</strong></p>
  <p><i>Hyper-local delivery optimization, live telemetry tracking, and atomic dispatch transactions for high-concurrency urban transit grids.</i></p>
</div>

---

## 📖 Overview

**TransitOps** is a premium, high-performance Smart Transport Operations Platform. It is designed to tackle the common inefficiencies and data race conditions present in modern urban delivery ecosystems:

1. **Race Conditions & Double-Bookings:** Prevents driver double-assignment or cargo capacity violations through strict **ACID transactions** at the database layer.
2. **Geospatial & Spatial Routing Latency:** Uses optimized spatial distance metrics and path calculations to select corridors in real-time.
3. **Stale Telematics & Diagnostic Gaps:** Streams real-time, terminal-like diagnostic logs and telemetry parameters (velocity, load, engine temperature, signal strength).

TransitOps features a custom, high-contrast, cyberpunk-inspired operations cockpit that displays real-time bento grid widgets, live interactive maps, telemetry feeds, incident dispatch overrides, and verification dashboards.

---

## 🛠️ Tech Stack

### Frontend Core
* **Framework:** React 19 (Vite SPA template)
* **Styling Engine:** Tailwind CSS v4 ([index.css](file:///c:/Users/Vishwa/Downloads/transitops/src/index.css))
* **Animations:** `motion/react` for smooth transitions and panel sliding
* **Data Visualization:** `recharts` for performance telemetry and trends
* **Icons:** `lucide-react`

### Backend Core
* **Runtime:** Node.js + Express
* **Database Engine:** Embedded SQLite via `better-sqlite3` (guarantees transaction atomicity and <1ms queries)
* **API Validation:** `zod` schema constraints for all data-modifying endpoints
* **Security Middleware:** `helmet` for secure HTTP headers, CORS configurations, and `express-rate-limit` for state-modifying requests

---

## 📐 System Architecture

### High-Level Topology

```
                  ┌────────────────────────────────────────┐
                  │              Vite Client               │
                  │   (React SPA, Tailwind, motion, Recharts)│
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼ [REST APIs / JSON]
                  ┌────────────────────────────────────────┐
                  │            Express Backend             │
                  │   (API Controllers & Vite Middleware)   │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼ [ACID SQL Queries]
                  ┌────────────────────────────────────────┐
                  │            SQLite Database             │
                  │         (using better-sqlite3)         │
                  └────────────────────────────────────────┘
```

### Core Project Directory Layout

* [server.ts](file:///c:/Users/Vishwa/Downloads/transitops/server.ts) — Full-stack Express entry point containing SQLite schemas, seeding scripts, security middleware, Zod schemas, Gemini integration, and Vite handlers.
* [src/App.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/App.tsx) — Main layout, state controller, sidebar tab router, and primary data synchronizer.
* [src/types.ts](file:///c:/Users/Vishwa/Downloads/transitops/src/types.ts) — TypeScript type specifications mapping server-side schema responses.
* [src/components/](file:///c:/Users/Vishwa/Downloads/transitops/src/components) — Modular front-end components:
  * [AIControlRoom.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/AIControlRoom.tsx) — Interface to request Gemini-powered (or local fallback) spatial pathing advice.
  * [FleetMapTwin.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/FleetMapTwin.tsx) / [MapWidget.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/MapWidget.tsx) — Live interactive map visualizing active fleets, routes, and recalculations.
  * [DispatchAndRules.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/DispatchAndRules.tsx) / [DispatchAdmin.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/DispatchAdmin.tsx) — Control panel enforcing capacity checks, driver dispatch workflows, and operational rule editing.
  * [DataIntegrityDashboard.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/DataIntegrityDashboard.tsx) — Validation terminal to trigger schema/capacity checks and simulate database recovery options.
  * [HealthAndSafety.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/HealthAndSafety.tsx) — Driver safety scores, braking indicators, fatigue trackers, and maintenance queues.
  * [RegistryWorkflows.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/RegistryWorkflows.tsx) — Compliance workflow panel verifying license, insurance, and emission certs.
  * [ExecutiveBoard.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/ExecutiveBoard.tsx) / [PerformanceWidget.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/PerformanceWidget.tsx) — Recharts performance widgets rendering load balances, latency averages, and active alert trends.
  * [EmergencyOps.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/EmergencyOps.tsx) — Critical intervention board managing roadside emergencies, weather hazards, and route disruptions.
  * [AuditTrailWidget.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/AuditTrailWidget.tsx) — Live table rendering persistent database audit logs.
  * [DiagnosticsFeed.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/DiagnosticsFeed.tsx) / [TelemetryGauges.tsx](file:///c:/Users/Vishwa/Downloads/transitops/src/components/TelemetryGauges.tsx) — Cybersecurity cockpit components rendering command logs and gauges.

---

## 🗄️ Database Schema & Relational Integrity

The SQLite database schema resides directly in [server.ts](file:///c:/Users/Vishwa/Downloads/transitops/server.ts) and enforces relational integrity via standard foreign keys:

```sql
-- 1. Vehicles
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  license_plate TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,           -- 'Heavy Truck', 'Medium Van', 'Cargo Drone'
  max_capacity REAL NOT NULL,    -- Max cargo load (kg)
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drivers
CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('IDLE', 'IN_TRANSIT', 'OFF_DUTY')),
  current_vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders / Deliveries
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  cargo_description TEXT NOT NULL,
  weight REAL NOT NULL,          -- Cargo load (kg)
  destination_name TEXT NOT NULL,
  destination_lat REAL NOT NULL,
  destination_lng REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED')),
  driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Telemetry Logs (Timeseries)
CREATE TABLE telemetry_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  velocity REAL NOT NULL,
  power_out REAL NOT NULL,
  core_temp REAL NOT NULL,
  signal_strength REAL NOT NULL,
  fuel_capacity REAL NOT NULL,
  engine_load REAL NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit & Security Trail Table
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator TEXT NOT NULL,
  action TEXT NOT NULL,
  initial_state TEXT,
  end_state TEXT,
  success INTEGER NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### The Atomic Dispatch Transaction Guarantee

To prevent double-bookings or over-capacity dispatch errors, the platform wraps orders inside SQL transactions:
1. **Capacity Audit:** Checks that the cargo weight of the order does not exceed the vehicle's `max_capacity`.
2. **Driver Availability check:** Asserts that the assigned driver is currently `IDLE`.
3. **Vehicle Condition check:** Asserts that the vehicle is `ACTIVE`.
4. **State Transition:** Updates the driver to `IN_TRANSIT` and the order to `ASSIGNED`.
5. **Commit:** Commits the transaction and logs to `audit_logs`. On any validation failure, an automatic **Rollback** is executed, restoring original database states, and a failure record is logged.

---

## ⚡ Getting Started & Setup

### Prerequisites
* **Node.js** (v18+ recommended)
* A Gemini API key (optional, for advanced AI pathing advice)

### Step 1: Clone and Install Dependencies
Install all package dependencies:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a local `.env` configuration file in the project root based on [.env.example](file:///c:/Users/Vishwa/Downloads/transitops/.env.example):
```bash
# Copy template
cp .env.example .env
```
Inside your `.env` file, populate your key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```
> **Note:** If no `GEMINI_API_KEY` is present or it is left blank, the app gracefully redirects requests to the built-in **Local Fallback Engine** to avoid operational disruptions.

### Step 3: Run the Application (Development)
Launch the server in development mode using `tsx` (TypeScript Execution):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to view the cockpit.

### Step 4: Build & Start (Production)
Build the React bundle and compile the Express TypeScript server into a compressed CommonJS file:
```bash
# Build Vite client assets & Esbuild server bundle
npm run build

# Start the compiled bundle
npm start
```

---

## 🔌 API Quick Reference

| Method | Endpoint | Description | Payload Validation |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/fleet` | Retrieves all vehicles, drivers, and their latest telemetry logs. | None |
| **GET** | `/api/orders` | Returns a list of all current delivery orders. | None |
| **POST** | `/api/orders/dispatch` | Executes an atomic assignment of driver, vehicle, and order. | Checked by `zod` schema parameters |
| **POST** | `/api/vehicles/re-route` | Recalculates route parameters based on `LOWEST_LATENCY` / `MIN_ENERGY`. | Checked by `zod` schema parameters |
| **POST** | `/api/orders/complete` | Simulates completion of active orders, setting drivers back to `IDLE`. | Parse matching `orderId` |
| **POST** | `/api/ai/re-route-advice` | Calls the Gemini model to compile real-time pathing recommendations. | Checked by `zod` schema parameters |
| **POST** | `/api/validation/test-license` | Validates driver credentials against regional regex constraints. | Checked by `zod` schema parameters |
| **POST** | `/api/validation/test-capacity` | Checks cargo capacity against vehicle constraints. | Checked by `zod` schema parameters |
| **GET** | `/api/audit-logs` | Retrieves the persistent security and operations log. | None |
| **POST** | `/api/seed` | Drops all database records and seeds 1,000 simulated routes and tables. | None |

---

## 🎨 UI/UX & Design Guidelines

Builders working on TransitOps must adhere to the core cockpit design directives:
* **Cyberpunk Aesthetics:** Dark backgrounds (`#0A0A0C`), sleek secondary cards (`#18181C`), neon green accents (`#00FF00` or `#10B981`), warnings in Amber, and errors in Crimson.
* **Bento Grid Formatting:** Content should always be housed in clean, responsive cards aligned to a global grid layout.
* **Typography Hierarchy:** General text labels use the **Inter** sans-serif font. Numeric displays, logs, telemetry stats, terminal lines, and status indicators must exclusively use **JetBrains Mono**.
