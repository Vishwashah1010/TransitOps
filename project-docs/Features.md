# Features Document - TransitOps

## Feature List

### 1. Atomic Order Dispatch & Match (ACID Transactions)
* **Description:** Dispatchers can create and assign delivery orders. The backend processes this assignment using standard SQL transactions with strict atomic locking.
* **Constraints:**
  * Checks driver state: Driver must be `IDLE`.
  * Checks cargo limits: Order cargo weight must not exceed vehicle's max capacity.
  * Checks vehicle state: Vehicle must be `ACTIVE`.
  * Rollback behavior: If any check fails, the entire transaction is rolled back, and an descriptive error is returned to the user.

### 2. Live Geospatial Routing & Map Simulation
* **Description:** A beautiful, responsive visual map showing urban grid layouts (Chicago area as seen in mockup), active vehicle routes, hubs, and re-routing paths.
* **Capabilities:**
  * **Haversine Distance Calculator:** Server-side SQL or helper-based distance optimization.
  * **Routing Logic Toggles:** Toggles for "LOWEST_LATENCY" vs. "MIN_ENERGY" which dynamically alters the route pathing and velocity calculations.
  * **Execute Re-Route:** Dispatches a re-routing instruction to a specific unit, triggering dynamic updating of telemetry logs and path visuals.

### 3. Smart Diagnostics & Live Telemetry Stream
* **Description:** A live diagnostic feed simulating telemetry updates for each unit (Velocity, Power Output, Core Temp, Signal Strength, Engine Load, Fuel Capacity).
* **Capabilities:**
  * Displays terminal-style diagnostic streams with formatted logs (e.g. `[OK] PING SUCCESS`, `[WARN] BATTERY_TEMP RISING`).
  * Telemetry indicators showing real-time fuel, engine, and temperature levels with visual warning ranges (orange/red alerts).

### 4. Active Incident Alerts Panel
* **Description:** Real-time alert notifications of critical system issues (e.g., `ENGINE_FAIL`, `ROUTE_OBSTR`, `SENSOR_OFFLINE`).
* **Capabilities:**
  * Action buttons to `Acknowledge` or `Relay Comms`.
  * Priority scoring (Priority 1 vs Priority 2) and visual sector grid targeting.

### 5. Interactive Relational Audit Trail
* **Description:** A persistent audit log showing every database operation, user login, and status change.
* **Capabilities:**
  * Captures timestamp, operator, action, initial state, and end state.
  * Filterable and searchable interface.
