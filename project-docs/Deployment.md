# Deployment Guidelines - TransitOps

## 1. Production Build Phase
The application is fully compatible with production container packaging.
* **Build Command:** `npm run build`
* **Vite Static Asset Generation:** Compiles frontend resources (React components, styles, assets) and outputs optimized files to the `/dist` directory.
* **Backend Compiling:** Compiles the Express `server.ts` entry point into a standalone CommonJS bundle at `dist/server.cjs` using `esbuild`.

## 2. Production Start Command
* **Start Command:** `npm start` (which executes `node dist/server.cjs`).
* **Environment Configuration:**
  * Runs in production mode (`NODE_ENV=production`).
  * Server serves pre-compiled static resources from `dist/` and hosts API routes cleanly on Port `3000`.
