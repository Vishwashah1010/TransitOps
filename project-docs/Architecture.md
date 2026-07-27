# System Architecture - TransitOps

## High-Level Topology

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

## Directory Layout
* `/src/`: Frontend React components and styles
  * `/src/components/`: Modular dashboard widgets (Map, Alerts, FleetList, Performance, AuditTrail)
  * `/src/App.tsx`: Layout routing and sidebar selector
  * `/src/types.ts`: TypeScript structures for API payloads and DB schema models
  * `/src/index.css`: Global tailwind imports and display font custom themes
* `/server.ts`: Full-stack entry point which serves Express API endpoints, handles SQLite interactions, and hosts Vite middleware in dev or Serves static dist in prod.
* `/project-docs/`: Project specifications folder (PRD, Features, TechStack, etc.)
