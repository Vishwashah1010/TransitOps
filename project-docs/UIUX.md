# UI/UX Specifications - TransitOps

## 1. Visual Identity & Mood
* **Mood:** High-fidelity, cyberpunk-adjacent, professional, technical dashboard. Feels like a military, aerospace, or advanced cybersecurity transport operations center.
* **Palette:**
  * **Primary Background:** Slate Dark (`#0A0A0C`, `#121214`)
  * **Secondary Cards:** Dark Grey (`#18181C`, `#1E1E24`)
  * **Accent Color:** Neon Green (`#00FF00` or `#10B981`) for active/optimal status.
  * **Warning Yellow:** Amber (`#F59E0B`) for minor issues or delay indicators.
  * **Critical Red:** Crimson (`#EF4444`) for engine failures and high-priority alarms.
  * **Borders:** Thin slate gray lines (`#2A2A32`) that outline cards without adding bulk.

## 2. Typography Pairings
* **General UI Text:** **Inter** (sans-serif) for high legibility, clean spacing, and structural reading.
* **Telemetry, Metrics, Logs, & Terminals:** **JetBrains Mono** (monospace) to capture the authentic developer/technical monitoring feel.

## 3. Responsive Screen Layouts
* **Layout Structure:**
  * **Sidebar navigation** containing Fleet, Schedule, Alerts, Performance, Audit Log, Settings, and Support.
  * **Header rail** showing system name (TransitOps / Command Center), global search bar, notification bells, profile icons, and terminal status indicators.
  * **Bento Grid Layout:** Fully fluid and grid-aligned cards containing maps, diagnostic panels, list items, and system streams.
  * **Adaptive Panels:** Panels slide in/out smoothly using `motion/react`.

## 4. Interaction Animations
* **Re-route animations:** Transition line renders from old path to new path.
* **Logs & Alarms:** Feed logs insert with a subtle fade-in and upward slide.
* **Buttons:** Hover scale transitions with brightened borders.
