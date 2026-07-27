# Product Requirement Document (PRD) - TransitOps

## 1. Project Overview
**TransitOps** is a real-time, high-performance Smart Transport Operations Platform and Logistics Engine. It is specifically designed for hyper-local delivery optimization in high-concurrency urban environments. It solves the critical challenges of dispatch coordination, geospatial routing efficiency, and transactional data integrity using a robust local relational database architecture.

## 2. Problem Statement
In dense urban delivery ecosystems, dispatch and route planning suffer from:
1. **Double-Booking & Race Conditions:** Stale state management allows multiple orders to be assigned to a single driver simultaneously or double-allocates cargo capacity.
2. **Geospatial Latency:** Stale route planning and slow distance calculations increase average delivery times (ETA).
3. **Data Inconsistency:** BaaS systems or non-transactional database layers fail to guarantee atomic operations during complex workflows (e.g., matching cargo weight, debiting fuel capacity, reserving vehicles, updating driver state).

## 3. Target Users
* **Transport Dispatchers / Operators:** Monitor fleet status, handle active incidents, optimize route structures, and trigger manual re-routing overrides.
* **Delivery Drivers (Simulation Mode):** Accept and complete assigned trips, update physical telemetry, and view routing directions.

## 4. Core Features
* **Fleet Control Center Dashboard:** A unified dark, high-contrast, cybersecurity-inspired cockpit displaying live fleet metrics, maps, telemetry, and terminal logging.
* **Atomic Transaction Engine:** Handles order dispatching and driver matching under ACID guarantees (with rollback on over-capacity or double-assignment).
* **Low-Latency Geospatial Router:** Runs real-time spatial routing simulations utilizing the Haversine formula and distance-recalculating algorithms.
* **Active Incident Response & Alarm Systems:** Monitors fleet telemetry (core temperature, fuel levels, engine load) and flags priority alerts.
* **Audit & Security Log:** Provides full accountability of every administrative and driver transition.

## 5. User Flow
1. **Dispatcher View:** Loads the main workspace -> Reviews fleet capacity and status -> Triggers atomic dispatch transaction -> Automatically matches optimal driver -> System recalculates routes and triggers real-time telemetry feed.
2. **Driver Simulation View:** Drivers log in -> Toggle state (IDLE -> IN_TRANSIT) -> Update telemetry -> Complete/Cancel trips -> Instantly updates the database.
