# Security Specifications - TransitOps

## 1. Secret Leak Prevention
* **Rule:** Zero hardcoded API keys, connection strings, or system passwords.
* **Implementation:** The `GEMINI_API_KEY` and server parameters are handled strictly through Node's `process.env`. `.gitignore` excludes `.env` from source control, and `.env.example` provides placeholders for external environments.

## 2. Personal Data Flow Audit (PII Protection)
* **Rule:** No raw PII or credentials printed in server logs or browser devtools.
* **Implementation:** All logs in the Express server strip personal details and replace them with anonymous keys or `[REDACTED]`. Database values are anonymized (e.g. mock names, masked licensing numbers).

## 3. Pre-Deploy Production Audit
* **Security Headers:** Integrated `helmet` middleware inside `server.ts` to block cross-site scripting (XSS), sniff attacks, and frame injection (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
* **Rate Limiting:** Added `express-rate-limit` for dispatch operations (`/api/orders/dispatch` and `/api/vehicles/re-route`) restricting spam/DDoS attempts (max 10 requests per minute per IP).
* **Error Handling:** Client-side error payloads return custom correlation IDs and sanitized messages. Under no circumstances are DB file structures, raw stack traces, or physical file paths exposed in API responses.

## 4. Input Validation & SQL Injection Prevention
* **Parametric SQL:** All query parameters passed to the SQLite engine are bound using parameter substitution (e.g., `db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id)`). Raw string concatenation for query building is strictly banned.
* **Zod Schemas:** All request payloads are rigorously validated on the server side using `zod` schemas. If the payload does not match, a `400 Bad Request` is immediately returned.
