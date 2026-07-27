# AI Instructions - TransitOps

## Directives for AI Builders
When adding or updating features in TransitOps, verify compliance with the following:
1. **Transaction Guarantees:** Ensure all operations that match state (such as dispatching an order or re-assigning a vehicle) are executed within an SQLite `transaction()` function wrapper.
2. **Visual Consistency:** Maintain the high-contrast dark green terminal cockpit visual language. Always display telemetry gauges, real-time events, and alarm cards.
3. **Typography Rule:** Use Inter for general labels, and JetBrains Mono exclusively for numeric readings, logging lines, status tags, and diagnostic outputs.
4. **Validation Check:** Every API endpoint modifying state must validate payload parameters using a robust `zod` schema before carrying out SQL statements.
5. **Security Policy:** Keep headers set with helmet and maintain strict error boundary components on the frontend.
