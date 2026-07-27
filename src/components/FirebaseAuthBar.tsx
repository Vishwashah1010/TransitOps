import React, { useState, useEffect } from "react";
import {
  auth,
  db,
  googleProvider
} from "../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { AppUser, UserRole, UserRoleInfo } from "../types";
import {
  ShieldCheck,
  ShieldAlert,
  Radio,
  Wrench,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Key,
  Mail,
  Lock,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  Eye,
  Shield
} from "lucide-react";

export const ROLE_DEFINITIONS: Record<UserRole, UserRoleInfo> = {
  ADMIN: {
    role: "ADMIN",
    title: "System Administrator",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/50",
    allowedTabs: [
      "fleet",
      "driver_profiles",
      "ai_control",
      "dispatch",
      "executive",
      "health_safety",
      "safety_risk",
      "audit_trail",
      "workflows",
      "emergency",
      "data_integrity"
    ],
    description: "Master administrative control, user security policy management, and unrestricted fleet operation clearance."
  },
  EXECUTIVE: {
    role: "EXECUTIVE",
    title: "Executive Director",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    allowedTabs: [
      "fleet",
      "driver_profiles",
      "ai_control",
      "dispatch",
      "executive",
      "health_safety",
      "safety_risk",
      "audit_trail",
      "workflows",
      "emergency",
      "data_integrity"
    ],
    description: "Full unrestricted access to executive board, financial metrics, load balancers, rules, and admin utilities."
  },
  DISPATCHER: {
    role: "DISPATCHER",
    title: "Fleet Dispatcher",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    allowedTabs: [
      "fleet",
      "ai_control",
      "dispatch",
      "emergency",
      "audit_trail"
    ],
    description: "Access to twin maps, live dispatch queues, predictive scheduling, emergency response, and driver communications."
  },
  SAFETY_OFFICER: {
    role: "SAFETY_OFFICER",
    title: "Safety & Compliance Officer",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/50",
    allowedTabs: [
      "driver_profiles",
      "health_safety",
      "safety_risk",
      "audit_trail",
      "data_integrity"
    ],
    description: "Access to driver registry, medical certifications, HOS fatigue heat-maps, risk overview, and audit telematics."
  },
  MAINTENANCE_TECH: {
    role: "MAINTENANCE_TECH",
    title: "Maintenance Engineer",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    allowedTabs: [
      "fleet",
      "audit_trail",
      "data_integrity",
      "emergency"
    ],
    description: "Access to vessel diagnostics, telemetry drilldown, component health feeds, and maintenance overlays."
  },
  VIEWER: {
    role: "VIEWER",
    title: "Operations Viewer",
    badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    allowedTabs: [
      "fleet",
      "health_safety",
      "safety_risk",
      "audit_trail"
    ],
    description: "Read-only observer access to twin maps, health metrics, safety risk overviews, and system audit logs."
  }
};

interface FirebaseAuthBarProps {
  currentUser: AppUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  onAddToast?: (toast: { type: "info" | "success" | "warning" | "error"; title: string; message: string }) => void;
}

export default function FirebaseAuthBar({
  currentUser,
  setCurrentUser,
  onAddToast
}: FirebaseAuthBarProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"SIGNIN" | "SIGNUP">("SIGNIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [selectedSignupRole, setSelectedSignupRole] = useState<UserRole>("DISPATCHER");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  // Sync with Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          // Check if user record exists in Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          let role: UserRole = "EXECUTIVE";
          let dept = "Operations";

          if (userSnap.exists()) {
            const data = userSnap.data();
            role = data.role || "EXECUTIVE";
            dept = data.department || "Operations";
          } else {
            // Initialize new user in Firestore
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split("@")[0] || "TransitOps User",
              role: "EXECUTIVE",
              department: "Operations",
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            }, { merge: true });
          }

          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split("@")[0] || "Operator",
            photoURL: user.photoURL,
            role,
            department: dept,
            lastLogin: new Date().toLocaleTimeString()
          });

          setDbConnected(true);
        } catch (e) {
          console.warn("Firestore sync warning (falling back to authenticated profile):", e);
          // Fallback if Firestore security or connection is pending
          setCurrentUser((prev) => prev || {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "TransitOps Operator",
            photoURL: user.photoURL,
            role: "EXECUTIVE",
            department: "Operations",
            lastLogin: new Date().toLocaleTimeString()
          });
        }
      } else {
        // Default guest / initial demo user state
        if (!currentUser) {
          setCurrentUser({
            uid: "demo-executive-uid",
            email: "executive@transitops.io",
            displayName: "Sarah Jenkins (Director)",
            photoURL: null,
            role: "EXECUTIVE",
            department: "Executive Operations",
            lastLogin: new Date().toLocaleTimeString()
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Switch role dynamically
  const handleSwitchRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    const updatedUser: AppUser = {
      ...currentUser,
      role: newRole
    };
    setCurrentUser(updatedUser);
    setIsRoleDropdownOpen(false);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          role: newRole,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn("Role update in Firestore warning:", e);
      }
    }

    if (onAddToast) {
      onAddToast({
        type: "success",
        title: `ROLE SWITCHED TO [${newRole}]`,
        message: `Permissions updated. Active view restricted to ${ROLE_DEFINITIONS[newRole].title} capabilities.`
      });
    }
  };

  // Google Sign-In Popup
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (onAddToast) {
        onAddToast({
          type: "success",
          title: "FIREBASE AUTHENTICATED",
          message: `Welcome back, ${user.displayName || user.email}! Connected to transitops-4fad1.`
        });
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setAuthError(err.message || "Google Authentication failed. Please check browser popups.");
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthError(null);

    try {
      if (authMode === "SIGNUP") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // Save profile in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayNameInput || email.split("@")[0],
            role: selectedSignupRole,
            department: ROLE_DEFINITIONS[selectedSignupRole].title,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
        } catch (e) {
          console.warn("Firestore user creation warning:", e);
        }

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: displayNameInput || email.split("@")[0],
          photoURL: null,
          role: selectedSignupRole,
          department: ROLE_DEFINITIONS[selectedSignupRole].title,
          lastLogin: new Date().toLocaleTimeString()
        });

        if (onAddToast) {
          onAddToast({
            type: "success",
            title: "ACCOUNT CREATED",
            message: `User created with role ${selectedSignupRole}. Firebase Auth active.`
          });
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (onAddToast) {
          onAddToast({
            type: "success",
            title: "LOGGED IN",
            message: `Authenticated as ${cred.user.email}`
          });
        }
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      setAuthError(err.message || "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  // Demo Quick Role Switch Logins
  const handleDemoRoleLogin = (role: UserRole) => {
    const demoProfiles: Record<UserRole, { name: string; email: string; dept: string }> = {
      ADMIN: { name: "System Admin (Root)", email: "admin@transitops.io", dept: "IT Security & System Operations" },
      EXECUTIVE: { name: "Sarah Jenkins (Director)", email: "s.jenkins@transitops.io", dept: "Executive Board" },
      DISPATCHER: { name: "Vikram Dispatcher", email: "v.sharma@transitops.io", dept: "National Logistics Hub" },
      SAFETY_OFFICER: { name: "Inspector Rajesh Kumar", email: "r.kumar@transitops.io", dept: "HOS Safety & Auditing" },
      MAINTENANCE_TECH: { name: "Ananya Systems Eng", email: "a.deshmukh@transitops.io", dept: "Vessel Telematics Tech" },
      VIEWER: { name: "Guest Observer (Viewer)", email: "observer@transitops.io", dept: "External Audit Observer" }
    };

    const target = demoProfiles[role];
    const newDemoUser: AppUser = {
      uid: `demo-${role.toLowerCase()}-id`,
      email: target.email,
      displayName: target.name,
      photoURL: null,
      role: role,
      department: target.dept,
      lastLogin: new Date().toLocaleTimeString()
    };

    setCurrentUser(newDemoUser);
    setIsAuthModalOpen(false);

    if (onAddToast) {
      onAddToast({
        type: "success",
        title: `DEMO ACCOUNT ACTIVATED: [${role}]`,
        message: `Switched active credentials to ${target.name}. Permissions restricted to ${role}.`
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser({
      uid: "guest-uid",
      email: "guest@transitops.io",
      displayName: "Guest Operator",
      photoURL: null,
      role: "DISPATCHER",
      department: "Unauthenticated",
      lastLogin: new Date().toLocaleTimeString()
    });
    if (onAddToast) {
      onAddToast({
        type: "info",
        title: "LOGGED OUT",
        message: "Signed out of Firebase Auth. Session returned to Guest Dispatcher profile."
      });
    }
  };

  const activeRoleInfo = currentUser ? ROLE_DEFINITIONS[currentUser.role] : ROLE_DEFINITIONS.EXECUTIVE;

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      {/* Firebase Applet Status Indicator Badge */}
      <div className="hidden xl:flex items-center gap-1.5 bg-[#0F1117] border border-[#2A2D35] px-2.5 py-1 rounded-lg text-[10px]">
        <Database className="w-3 h-3 text-amber-400" />
        <span className="text-slate-400 font-sans">Firebase:</span>
        <span className="text-emerald-400 font-bold tracking-wider">transitops-4fad1</span>
      </div>

      {/* Role Badge & Role Switcher Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${activeRoleInfo.badgeColor}`}
          title="Click to Switch Role Permissions (RBAC Simulation)"
        >
          <span className="flex items-center gap-1 font-extrabold uppercase text-[10.5px]">
            {currentUser?.role === "ADMIN" && <Shield className="w-3.5 h-3.5 text-purple-400" />}
            {currentUser?.role === "EXECUTIVE" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
            {currentUser?.role === "DISPATCHER" && <Radio className="w-3.5 h-3.5 text-blue-400" />}
            {currentUser?.role === "SAFETY_OFFICER" && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
            {currentUser?.role === "MAINTENANCE_TECH" && <Wrench className="w-3.5 h-3.5 text-emerald-400" />}
            {currentUser?.role === "VIEWER" && <Eye className="w-3.5 h-3.5 text-slate-400" />}
            {currentUser?.role || "EXECUTIVE"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-80" />
        </button>

        {/* Role Switcher Menu */}
        {isRoleDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-[#0F1117] border border-[#2A2D35] rounded-xl shadow-2xl z-50 p-3 space-y-2 font-sans text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2 font-mono text-[10px]">
              <span className="text-slate-400 uppercase font-bold tracking-wider">ROLE-BASED ACCESS CONTROL</span>
              <span className="text-amber-400 font-extrabold">SELECT ROLE</span>
            </div>

            <div className="space-y-1.5">
              {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((rKey) => {
                const rInfo = ROLE_DEFINITIONS[rKey];
                const isSelected = currentUser?.role === rKey;

                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleSwitchRole(rKey)}
                    className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer flex items-start gap-2 ${
                      isSelected
                        ? "bg-[#1F2332] border-blue-500 text-white shadow-sm"
                        : "bg-[#141720] border-[#2A2D35] text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    <div className="mt-0.5">
                      {rKey === "ADMIN" && <Shield className="w-4 h-4 text-purple-400" />}
                      {rKey === "EXECUTIVE" && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                      {rKey === "DISPATCHER" && <Radio className="w-4 h-4 text-blue-400" />}
                      {rKey === "SAFETY_OFFICER" && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                      {rKey === "MAINTENANCE_TECH" && <Wrench className="w-4 h-4 text-emerald-400" />}
                      {rKey === "VIEWER" && <Eye className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{rInfo.title}</span>
                        {isSelected && <span className="text-[9px] font-mono font-extrabold text-emerald-400 bg-emerald-950 px-1 rounded">ACTIVE</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{rInfo.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar & Login Modal Trigger */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-2 bg-[#141720] hover:bg-[#1A1D26] border border-[#2A2D35] px-2.5 py-1 rounded-lg text-slate-200 cursor-pointer transition-colors"
          title="Manage Firebase Authentication Credentials"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-[10px] text-white">
            {currentUser?.displayName?.[0] || "U"}
          </div>
          <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate">
            {currentUser?.displayName || "Sign In"}
          </span>
          <LogIn className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Firebase Auth & Role Configuration Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-[#0F1117] border border-[#2A2D35] max-w-md w-full rounded-2xl shadow-2xl p-5 space-y-4 text-white font-mono relative">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 border-b border-[#2A2D35] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Database className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Firebase Authentication & RBAC
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Project: <strong className="text-emerald-400 font-mono">transitops-4fad1</strong> • Role-Based Access Control
              </p>
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-[11px] rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Quick Demo Role Switcher (Instant 1-Click Authentication) */}
            <div className="space-y-2 bg-[#141720] border border-[#2A2D35] p-3 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                ⚡ QUICK DEMO ROLE LOGIN (INSTANT EVALUATION)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoRoleLogin("ADMIN")}
                  className="p-2 bg-[#1A1D26] hover:bg-[#252936] border border-purple-500/40 rounded-lg text-left cursor-pointer transition-all"
                >
                  <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> System Admin
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">Root Master Clearance</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoRoleLogin("EXECUTIVE")}
                  className="p-2 bg-[#1A1D26] hover:bg-[#252936] border border-amber-500/40 rounded-lg text-left cursor-pointer transition-all"
                >
                  <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Executive
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">Director Board Access</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoRoleLogin("DISPATCHER")}
                  className="p-2 bg-[#1A1D26] hover:bg-[#252936] border border-blue-500/40 rounded-lg text-left cursor-pointer transition-all"
                >
                  <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Dispatcher
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">Fleet Control & Scheduling</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoRoleLogin("SAFETY_OFFICER")}
                  className="p-2 bg-[#1A1D26] hover:bg-[#252936] border border-rose-500/40 rounded-lg text-left cursor-pointer transition-all"
                >
                  <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Safety Officer
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">HOS & Fatigue Audits</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoRoleLogin("MAINTENANCE_TECH")}
                  className="p-2 bg-[#1A1D26] hover:bg-[#252936] border border-emerald-500/40 rounded-lg text-left cursor-pointer transition-all"
                >
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Tech Engineer
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">Telematics & Diagnostics</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoRoleLogin("VIEWER")}
                  className="p-2 bg-[#1A1D26] hover:bg-[#252936] border border-slate-500/40 rounded-lg text-left cursor-pointer transition-all"
                >
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Operations Viewer
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">Read-Only Auditing</div>
                </button>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md font-sans text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Sign-In</span>
            </button>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3 font-sans pt-2 border-t border-[#2A2D35]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Firebase Email Credentials</span>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "SIGNIN" ? "SIGNUP" : "SIGNIN")}
                  className="text-amber-400 hover:underline cursor-pointer font-bold"
                >
                  {authMode === "SIGNIN" ? "Create New Account" : "Back to Sign In"}
                </button>
              </div>

              {authMode === "SIGNUP" && (
                <>
                  <input
                    type="text"
                    placeholder="Full Operator Name"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Assigned Role:</label>
                    <select
                      value={selectedSignupRole}
                      onChange={(e) => setSelectedSignupRole(e.target.value as UserRole)}
                      className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-xs text-amber-300 font-mono font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="ADMIN">System Administrator</option>
                      <option value="EXECUTIVE">Executive Director</option>
                      <option value="DISPATCHER">Fleet Dispatcher</option>
                      <option value="SAFETY_OFFICER">Safety & Compliance Officer</option>
                      <option value="MAINTENANCE_TECH">Maintenance Technician</option>
                      <option value="VIEWER">Operations Viewer</option>
                    </select>
                  </div>
                </>
              )}

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141720] border border-[#2A2D35] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                {loading ? "Authenticating..." : authMode === "SIGNIN" ? "Sign In with Email" : "Register New Firebase User"}
              </button>
            </form>

            {currentUser && (
              <div className="pt-2 border-t border-[#2A2D35] flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans">
                  Current Session: <strong className="text-white">{currentUser.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
