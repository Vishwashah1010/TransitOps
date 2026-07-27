import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  removeToastByTitle: (title: string) => void;
  triggerSystemError: (errorType: "database" | "routing" | "network") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children, onRetryLoadData }: { children: React.ReactNode; onRetryLoadData?: () => Promise<void> | void }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Prevent duplicate stacked toasts with identical title
      if (prev.some((t) => t.title === toast.title)) {
        return prev;
      }
      return [...prev, { ...toast, id }];
    });
    // Auto-dismiss after 6 seconds if no custom action required
    if (!toast.onAction) {
      setTimeout(() => {
        removeToast(id);
      }, 6000);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const removeToastByTitle = (title: string) => {
    setToasts((prev) => prev.filter((t) => t.title !== title));
  };

  const triggerSystemError = (errorType: "database" | "routing" | "network") => {
    if (errorType === "database") {
      addToast({
        type: "error",
        title: "DATABASE_CONNECTION_DROP",
        message: "CRITICAL: Secure ACID transactional connection to PostgreSQL / SQLite database has dropped.",
        actionLabel: "Retry Connect",
        onAction: async () => {
          removeToastByTitle("DATABASE_CONNECTION_DROP");
          if (onRetryLoadData) {
            try {
              await onRetryLoadData();
            } catch (err) {
              console.error("Retry load data failed:", err);
            }
          }
          addToast({
            type: "success",
            title: "CONNECTION_RESTORED",
            message: "Re-established heartbeat. SQLite ledger synchronised successfully.",
          });
        },
      });
    } else if (errorType === "routing") {
      addToast({
        type: "error",
        title: "ROUTING_ENGINE_CONFLICT",
        message: "CRITICAL: Route overlap collision detected in sub-sector corridor NH-48 between active Heavy Truck and Cargo Drone air-grid.",
        actionLabel: "Contact Support",
        onAction: () => {
          removeToastByTitle("ROUTING_ENGINE_CONFLICT");
          addToast({
            type: "info",
            title: "TICKET_DISPATCHED",
            message: "Emergency Ticket #TR-9983 filed in the Omega Operations Ledger. A dispatcher has been assigned.",
          });
        },
      });
    } else if (errorType === "network") {
      addToast({
        type: "warning",
        title: "SIGNAL_STRENGTH_DEGRADATION",
        message: "WARNING: High-latency package loss detected on National Highway 44 (Terminal Gateway).",
        actionLabel: "Retry Ping",
        onAction: () => {
          removeToastByTitle("SIGNAL_STRENGTH_DEGRADATION");
          addToast({
            type: "success",
            title: "SIGNAL_OPTIMIZED",
            message: "Pings re-negotiated. Packet transmission latency back within standard deviation limits.",
          });
        },
      });
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeToastByTitle, triggerSystemError }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-96 max-w-[calc(100vw-2rem)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = {
              success: CheckCircle,
              error: AlertCircle,
              warning: AlertTriangle,
              info: Info,
            }[toast.type];

            const colors = {
              success: "bg-[#09150E]/95 border-[#123A20] text-[#4ADE80] shadow-[0_4px_20px_rgba(74,222,128,0.15)]",
              error: "bg-[#1A0B0B]/95 border-[#451818] text-[#EF4444] shadow-[0_4px_20px_rgba(239,68,68,0.15)]",
              warning: "bg-[#1A1208]/95 border-[#453018] text-[#F59E0B] shadow-[0_4px_20px_rgba(245,158,11,0.15)]",
              info: "bg-[#080E1A]/95 border-[#182B45] text-[#3B82F6] shadow-[0_4px_20px_rgba(59,130,246,0.15)]",
            }[toast.type];

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                className={`p-4 rounded-lg border flex flex-col gap-3 pointer-events-auto backdrop-blur-md ${colors}`}
              >
                <div className="flex gap-3 items-start">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-mono text-xs font-bold tracking-wider uppercase">{toast.title}</h4>
                    <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {toast.onAction && (
                  <div className="flex gap-2 justify-end border-t border-white/5 pt-3 mt-1">
                    <button
                      onClick={() => {
                        toast.onAction?.();
                        removeToast(toast.id);
                      }}
                      className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-current hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {toast.actionLabel || "Resolve"}
                    </button>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToasts must be used within a ToastProvider");
  }
  return context;
}
