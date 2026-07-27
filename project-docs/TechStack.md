# Tech Stack Specifications - TransitOps

## 1. Frontend Architecture
* **Framework:** React 19 (Vite SPA template)
* **Styling Engine:** Tailwind CSS v4 (@tailwindcss/vite)
* **Routing / Views:** Single-view sidebar state-router utilizing smooth layout transitions with `motion/react`
* **Icons:** `lucide-react`
* **Visualization:** Custom responsive SVG grid maps and `recharts` for performance telemetry and trends.

## 2. Backend & API Services
* **Server Framework:** Node.js + Express
* **Compiler / Engine:** TSX (direct TypeScript execution in dev) + CJS esbuild compiler for production build bundling
* **Input Validation:** `zod` for request schemas
* **Security Middleware:** `helmet` for HTTP response headers, custom rate-limiting for auth/dispatch endpoints, and CORS restrictive origin matching.

## 3. Database Layer
* **Database Engine:** Embedded **SQLite (via `better-sqlite3`)**
* **Why SQLite?**
  1. **Relational Data Modeling:** Perfectly models relational master-transaction data (Vehicles, Drivers, Orders, Telemetry, and Audit Logs) with full SQL syntax.
  2. **ACID Transactions:** Full support for transactional atomicity (using `BEGIN`, `COMMIT`, `ROLLBACK`), guaranteeing that orders cannot be double-assigned.
  3. **Low Latency Spatial Routing Queries:** Local relational query performance is under 1ms, ideal for high-concurrency urban simulations.
  4. **Self-Contained Deployment:** Fits inside the Cloud Run container without external networking overhead.
