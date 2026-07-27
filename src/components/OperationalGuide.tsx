import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Compass, ChevronLeft, ChevronRight, HelpCircle, 
  Lightbulb, Sparkles, Target, CheckCircle2, Menu
} from "lucide-react";

interface Step {
  title: string;
  description: string;
  targetSelector: string;
  tip: string;
}

interface OperationalGuideProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export default function OperationalGuide({ currentTab, setTab }: OperationalGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean[]>>({});
  const [showTip, setShowTip] = useState(false);

  // Tab mapping for human-readable title
  const tabTitles: Record<string, string> = {
    fleet: "Digital Twin Map & Telemetry",
    ai_control: "AI Logistics Control Room",
    dispatch: "Intelligent Dispatch & Operational Rules",
    health_safety: "Health & Safety Analytics",
    workflows: "Registry Workflows & Repairs",
    executive: "Executive Expenditure Board",
    emergency: "Emergency Ops Failover",
    audit_trail: "Immutable Cryptographic Audit Trail",
    data_integrity: "Data Integrity & Zod Validation Command Center"
  };

  const guides: Record<string, Step[]> = {
    fleet: [
      {
        title: "Focus Active Vessel",
        description: "Select an active vessel (e.g. FLT-3029) from the drop-down selector at the top of the map dashboard.",
        targetSelector: "select",
        tip: "This choice updates the live gauge clusters, battery readings, and localized GPS coordinates instantly."
      },
      {
        title: "Configure Route Destination",
        description: "Choose a logistical terminal target (e.g., TERMINAL_E_GATE_12) in the Reroute Simulator options.",
        targetSelector: "select",
        tip: "Each endpoint calculates path metrics through secondary street arteries to map real-world congested sectors."
      },
      {
        title: "Toggle Optimization Rules",
        description: "Choose between LOWEST_LATENCY or MIN_ENERGY route solver parameters.",
        targetSelector: "button:contains(\"LOWEST_LATENCY\")",
        tip: "LOWEST_LATENCY optimizes purely for speed, while MIN_ENERGY dampens speed targets to lower carbon footprint metrics."
      },
      {
        title: "Execute Re-Route",
        description: "Click 'EXECUTE RE-ROUTE' to trigger spatial route calculation.",
        targetSelector: "button:contains(\"EXECUTE RE-ROUTE\")",
        tip: "You will see the blue line visual map path update on-the-fly and write a cryptographic log to the database."
      }
    ],
    ai_control: [
      {
        title: "Audit AI Forecast",
        description: "Review the logistics forecasting compiled by server-side Gemini intelligence models in the left pane.",
        targetSelector: "p:contains(\"logistics optimization summary\")",
        tip: "The summary evaluates average safety indexes and carbon offsets dynamically."
      },
      {
        title: "Operations Assistant Chat",
        description: "Type an operations query or ask about driver credentials in the prompt input on the right.",
        targetSelector: "input[placeholder*=\"Type standard fleet\"]",
        tip: "You can ask: 'Which driver has safety alerts?' or 'List expired documents' for direct db querying."
      },
      {
        title: "Quick-Action Chip Trigger",
        description: "Click on one of the quick prompt suggestions above the chat.",
        targetSelector: "button:contains(\"Which driver\")",
        tip: "Suggestions allow quick diagnostics on critical anomalies without typing full questions."
      }
    ],
    dispatch: [
      {
        title: "Select Cargo Freight",
        description: "Choose an unassigned pending cargo order from the dropdown selector on the left card.",
        targetSelector: "select",
        tip: "Pending orders are loaded on-the-fly from the transactional SQL state ledger."
      },
      {
        title: "Compute Match recommendation",
        description: "Click 'COMPUTE OPTIMAL DISPATCH' to leverage server-side Gemini constraints verification.",
        targetSelector: "button:contains(\"COMPUTE OPTIMAL DISPATCH\")",
        tip: "The recommendation engine checks license validity, fatigue rates, and maximum vehicle cargo loads."
      },
      {
        title: "Commit Active Dispatch",
        description: "Confirm the assignment by clicking 'DISPATCH RECOMMENDED RESOURCES' to send the vehicle on-trip.",
        targetSelector: "button:contains(\"DISPATCH RECOMMENDED\")",
        tip: "This logs the operation in the audit trail, updates driver status to IN_TRANSIT, and binds resources."
      },
      {
        title: "Tune Operational Rules",
        description: "Switch sub-tabs to the Operational Rule Engine to configure system-wide safety coefficients.",
        targetSelector: "button:contains(\"Operational Rule Engine\")",
        tip: "You can alter working hour limits and target safety thresholds on-the-fly without restarting servers."
      },
      {
        title: "Regulatory Sandbox Verification",
        description: "Open the Explainable Validation Center to verify compliance limits using the mock Zod validator.",
        targetSelector: "button:contains(\"Explainable Validation Center\")",
        tip: "This tests regex license rules (e.g. dl-ilxxxxx) and triggers instant compiler responses."
      }
    ],
    health_safety: [
      {
        title: "Check Composite Fleet Score",
        description: "Observe the overall active health percentage circle.",
        targetSelector: "span:contains(\"%\")",
        tip: "This composite metric measures system engine life, remaining lifespan, and licensing clearances."
      },
      {
        title: "Review AI Health Insights",
        description: "Read critical preventative repair alerts and licensing warnings compiled under Insights.",
        targetSelector: "div:contains(\"PREVENTATIVE REPAIR MANDATE\")",
        tip: "Insights automatically suggest blocking drivers with expired permits from active dispatch duties."
      },
      {
        title: "Audit Predictive Lifespans",
        description: "Scroll through the Predictive Maintenance Ledger to check vehicle temperatures and mileages.",
        targetSelector: "div:contains(\"Predictive Maintenance Ledger\")",
        tip: "High risk vehicles are automatically flagged with orange indicators to prevent highway breakdowns."
      },
      {
        title: "Audit Driver Safety Analytics",
        description: "Verify sudden braking and speeding metrics in the Driver Safety card.",
        targetSelector: "div:contains(\"Driver Safety Analytics\")",
        tip: "Safety scores below 80 can prompt real-time driver health checks."
      }
    ],
    workflows: [
      {
        title: "Inspect Reparation Pipeline",
        description: "Monitor active fleet units currently passing through the six-stage repair pipeline.",
        targetSelector: "div:contains(\"Vessel Repair Pipeline\")",
        tip: "Stages include Inspection, Issue Detected, Approval, Repair, Quality Check, and Ready."
      },
      {
        title: "Configure Pipeline Stage",
        description: "Click 'Update Progress' on a vehicle to load it in the Stage Manager on the right.",
        targetSelector: "button:contains(\"Update Progress\")",
        tip: "Adding detailed technician logs helps team diagnostics during offline safety audits."
      },
      {
        title: "Commit Stage Transition",
        description: "Select a new stage and click 'COMMIT STAGE' to update database attributes.",
        targetSelector: "button:contains(\"COMMIT STAGE\")",
        tip: "Setting the stage to 'READY' automatically transitions the vehicle back to ACTIVE state."
      },
      {
        title: "Verify Digital Registry",
        description: "Switch to the 'Digital Registry' tab to audit driver and vehicle insurance permits.",
        targetSelector: "button:contains(\"Digital Registry\")",
        tip: "Near-expiry or expired compliance dates are automatically flagged with warning badges."
      }
    ],
    executive: [
      {
        title: "Expenditure vs. Emissions",
        description: "Observe Area trends comparing monthly fuel costs against carbon greenhouse output.",
        targetSelector: "div:contains(\"Expenditure & Carbon Footprint\")",
        tip: "Optimizing corridors reduces carbon output while maximizing freight efficiency ratios."
      },
      {
        title: "Audit Cumulative Downtime",
        description: "Check repair costs and inactive hours by vehicle class on the bar charts.",
        targetSelector: "div:contains(\"Downtime & Maintenance Costs\")",
        tip: "Heavy trucks are typically more costly but carry double the capacity of medium vans."
      },
      {
        title: "Vessel Allocation Profile",
        description: "Review current vessel deployment to balance active transit, standby, and repair ratios.",
        targetSelector: "div:contains(\"Vessel Allocation Profile\")",
        tip: "Adequate standby vehicles support the crisis simulator's autonomous failovers."
      }
    ],
    emergency: [
      {
        title: "Choose Vessel in Distress",
        description: "Select an active in-transit vessel to simulate an emergency scenario.",
        targetSelector: "select",
        tip: "Only active vessels are selectable for failure testing."
      },
      {
        title: "Trigger System Disaster",
        description: "Select a failure mode (e.g. Mechanical Breakdown) and click 'TRIGGER SYSTEM DISASTER'.",
        targetSelector: "button:contains(\"TRIGGER SYSTEM DISASTER\")",
        tip: "This dispatches automatic failover triggers to locate nearby backup trucks and backup drivers."
      },
      {
        title: "Inspect Autonomic Response",
        description: "Read the detailed action logs, assigned backup vehicle, and revised ETA targets.",
        targetSelector: "div:contains(\"Failover Action Logs\")",
        tip: "Autonomic response operations execute in under 13ms to guarantee complete cargo safety."
      }
    ],
    audit_trail: [
      {
        title: "Search State Modifications",
        description: "Enter filter text inside the Search input box to isolate critical transactional dispatches.",
        targetSelector: "input[placeholder*=\"Search audit trail\"]",
        tip: "Filters update the visible logs instantly as you type."
      },
      {
        title: "Audit Success indicators",
        description: "Verify that transactional operations display the green 'SUCCESS' compliance badge.",
        targetSelector: "th:contains(\"Status\")",
        tip: "Failed dispatches will log detailed system warnings to assist diagnostics."
      }
    ],
    data_integrity: [
      {
        title: "Audit Platform Integrity",
        description: "Review the Platform Integrity Rate, Compliance Compatibility, and Load Constraint cards representing automated real-time SQLite diagnostics.",
        targetSelector: "span:contains(\"PLATFORM INTEGRITY\")",
        tip: "These rates evaluate live validation audit logs and baseline metrics to safeguard active transports."
      },
      {
        title: "Zod Schema Tests",
        description: "Use the prefill chips to populate compliant, expired, or improperly formatted driver profiles in the interactive Zod Schema sandbox, then run the validation.",
        targetSelector: "button:contains(\"Execute Schema Verification\")",
        tip: "This parses real-time checks matching Zod regular expression requirements, preventing illegal vehicle check-outs."
      },
      {
        title: "Verify Capacity Limits",
        description: "Configure proposed cargo weights for selected trucks or drones to test the overload validation limits.",
        targetSelector: "button:contains(\"Execute Capacity Check\")",
        tip: "The platform locks assignment submissions if a proposed weight exceeds physical cargo thresholds."
      },
      {
        title: "Simulate System Anomalies",
        description: "Trigger a database connection drop or routing conflict in the sandbox to observe immediate reactive toast alert actions.",
        targetSelector: "button:contains(\"TOAST SYSTEM TESTING SANDBOX\")",
        tip: "Custom interactive action-oriented toasts allow direct recovery, like manual database sync-retry or customer support dispatching."
      },
      {
        title: "Audit Compliance Log",
        description: "Observe recent sandboxed schemas writing live transaction records into the permanent SQLite Audit ledger.",
        targetSelector: "span:contains(\"REAL-TIME SCHEMA\")",
        tip: "Each row preserves the precise operator details, outcome status, and schema validation failures for long-term audits."
      }
    ]
  };

  const activeSteps = guides[currentTab] || [];

  // Reset steps on tab change
  useEffect(() => {
    setCurrentStepIdx(0);
    setShowTip(false);
  }, [currentTab]);

  const handleNext = () => {
    if (currentStepIdx < activeSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      setShowTip(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
      setShowTip(false);
    }
  };

  const toggleStepCompleted = (idx: number) => {
    setCompletedSteps(prev => {
      const tabCompleted = prev[currentTab] ? [...prev[currentTab]] : new Array(activeSteps.length).fill(false);
      tabCompleted[idx] = !tabCompleted[idx];
      return { ...prev, [currentTab]: tabCompleted };
    });
  };

  const isStepCompleted = (idx: number) => {
    return !!(completedSteps[currentTab]?.[idx]);
  };

  const totalCompletedInCurrentTab = completedSteps[currentTab]?.filter(Boolean).length || 0;
  const progressPercent = activeSteps.length > 0 
    ? Math.round((totalCompletedInCurrentTab / activeSteps.length) * 100) 
    : 0;

  const handleHighlight = () => {
    const step = activeSteps[currentStepIdx];
    if (!step || !step.targetSelector) return;

    try {
      let element: HTMLElement | null = null;
      const selector = step.targetSelector;

      if (selector.includes(':contains(')) {
        const match = selector.match(/(.+):contains\("(.+)"\)/);
        if (match) {
          const tag = match[1];
          const text = match[2];
          const elements = document.querySelectorAll(tag);
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.textContent?.toLowerCase().includes(text.toLowerCase())) {
              element = el;
              break;
            }
          }
        }
      } else {
        element = document.querySelector(selector) as HTMLElement;
      }

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        
        const originalStyle = element.getAttribute("style") || "";
        element.style.transition = "all 0.5s ease-in-out";
        element.style.outline = "4px solid #4ADE80";
        element.style.outlineOffset = "4px";
        element.style.boxShadow = "0 0 24px #4ADE80, inset 0 0 12px #4ADE80";
        
        setTimeout(() => {
          element!.style.outline = "none";
          element!.style.boxShadow = "none";
          setTimeout(() => {
            element!.setAttribute("style", originalStyle);
          }, 500);
        }, 2500);
      } else {
        // Fallback banner notification if not currently rendered or visible
        const fallbackNotify = document.createElement("div");
        fallbackNotify.className = "fixed top-20 right-6 z-[100] bg-yellow-950/90 border border-yellow-500 text-yellow-400 p-3 rounded font-mono text-xs shadow-2xl animate-bounce";
        fallbackNotify.innerHTML = `⚠️ Element "${step.title}" is located further down the page or in a folded tab section.`;
        document.body.appendChild(fallbackNotify);
        setTimeout(() => fallbackNotify.remove(), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#12141A] hover:bg-[#1E222B] text-[#4ADE80] border border-[#4ADE80]/35 px-4 py-3 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.25)] hover:shadow-[0_0_25px_rgba(74,222,128,0.45)] transition-all cursor-pointer font-sans font-bold text-xs uppercase tracking-wider"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Compass className="w-4 h-4 animate-spin-slow text-[#4ADE80]" />
          <span>{isOpen ? "Close Guide" : "Ops-Pilot AI Guide"}</span>
          {totalCompletedInCurrentTab < activeSteps.length && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </motion.button>
      </div>

      {/* Slide-out Overlay Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-sm bg-[#0C0E14] border border-[#2A2D35] rounded-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] font-sans text-[#8E9299]"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#2A2D35] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4ADE80]" />
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Ops-Pilot Assistant</h3>
                </div>
                <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase mt-0.5">GUIDE ACTIVE // STEP-BY-STEP</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Tab Title Block */}
            <div className="bg-[#161922] border border-[#2A2D35] rounded-lg p-3 mb-4 font-mono text-[11px]">
              <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Current Terminal View</span>
              <span className="text-white font-bold block truncate">{tabTitles[currentTab] || "Terminal Workspace"}</span>
            </div>

            {activeSteps.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 font-mono">
                No interactive walkthrough parameters mapped to this station view.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step Content */}
                <div className="min-h-[140px] space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                    <span>STEP {currentStepIdx + 1} OF {activeSteps.length}</span>
                    <button 
                      onClick={() => toggleStepCompleted(currentStepIdx)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
                        isStepCompleted(currentStepIdx)
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-[#161922] border-[#2A2D35] text-[#8E9299] hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isStepCompleted(currentStepIdx) ? "DONE" : "MARK DONE"}</span>
                    </button>
                  </div>

                  <h4 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5 font-mono">
                    <span className="text-[#4ADE80] font-bold">#</span>
                    {activeSteps[currentStepIdx].title}
                  </h4>

                  <p className="text-xs text-[#E0E2E6] leading-relaxed">
                    {activeSteps[currentStepIdx].description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-gray-500">
                    <span>WALKTHROUGH PROGRESS</span>
                    <span className="text-[#4ADE80] font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#161922] rounded-full h-1.5 overflow-hidden border border-[#2A2D35]/50">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Micro Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleHighlight}
                    className="flex-1 py-2 bg-[#1E293B] hover:bg-[#334155] text-blue-400 border border-blue-500/25 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Highlight UI</span>
                  </button>

                  <button
                    onClick={() => setShowTip(!showTip)}
                    className={`px-3 py-2 border rounded text-xs font-mono transition-colors ${
                      showTip
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-[#161922] border-[#2A2D35] text-gray-400 hover:text-white"
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Smart Tip Drawer */}
                <AnimatePresence>
                  {showTip && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-amber-950/15 border border-amber-500/20 rounded-lg p-3 text-[11px] font-mono text-amber-400 space-y-1"
                    >
                      <div className="font-bold uppercase tracking-wider flex items-center gap-1 text-[10px]">
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        <span>COGNITIVE TRAINING DATA</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        {activeSteps[currentStepIdx].tip}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Controls */}
                <div className="flex justify-between items-center border-t border-[#2A2D35] pt-3 mt-1 text-xs">
                  <button
                    onClick={handlePrev}
                    disabled={currentStepIdx === 0}
                    className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>

                  <span className="text-[10px] font-mono text-gray-600">PAGE {currentStepIdx + 1} / {activeSteps.length}</span>

                  <button
                    onClick={handleNext}
                    disabled={currentStepIdx === activeSteps.length - 1}
                    className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
