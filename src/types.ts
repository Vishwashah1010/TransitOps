export interface Vehicle {
  id: string;
  license_plate: string;
  type: string; // 'Heavy Truck' | 'Medium Van' | 'Cargo Drone'
  max_capacity: number; // in kg
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  status: 'IDLE' | 'IN_TRANSIT' | 'OFF_DUTY';
  current_vehicle_id: string | null;
}

export interface Order {
  id: string;
  cargo_description: string;
  weight: number; // in kg
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  status: 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  driver_id: string | null;
  vehicle_id: string | null;
}

export interface TelemetryLog {
  id?: number;
  vehicle_id: string;
  velocity: number; // km/h
  power_out: number; // kW
  core_temp: number; // °C
  signal_strength: number; // GB/s or score
  fuel_capacity: number; // %
  engine_load: number; // %
  timestamp: string;
}

export interface AuditLog {
  id?: number;
  operator: string;
  action: string;
  initial_state: string | null;
  end_state: string | null;
  success: number; // 1 | 0
  error_message: string | null;
  timestamp: string;
}

export interface PerformanceMetrics {
  uptime: number;
  velocityIndex: number;
  activeAlerts: number;
  systemLoad: number;
}

export interface DriverProfile {
  driver_id: string;
  address: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  experience_years: number;
  joining_date: string;
  assigned_depot: string;
  blood_group: string;
  medical_status: 'FIT_FOR_DUTY' | 'CONDITIONAL' | 'ACTION_REQUIRED' | 'ON_LEAVE';
  last_medical_checkup: string;
  next_medical_due: string;
  medical_notes: string;
  vision_test: string;
  drug_test_status: string;
  drug_test_date: string;
  fitness_cert_expiry: string;
  supervisor_rating: number;
  supervisor_evaluation: string;
  total_completed_trips: number;
  ontime_delivery_pct: number;
}

export interface DriverDispatchRecord {
  id: string;
  driver_id: string;
  trip_code: string;
  vehicle_id: string;
  cargo_description: string;
  cargo_weight: number;
  origin: string;
  destination: string;
  dispatch_time: string;
  completion_time?: string | null;
  status: 'COMPLETED' | 'IN_TRANSIT' | 'DELAYED' | 'CANCELLED';
  on_time_status: 'ON_TIME' | 'DELAYED' | 'EARLY';
  rating?: number | null;
  feedback_notes?: string | null;
}

export interface DetailedDriver extends Driver {
  safety_score?: number;
  sudden_braking_events?: number;
  speeding_events?: number;
  fatigue_indicators?: number;
  driving_hours_today?: number;
  average_speed?: number;
  profile?: DriverProfile;
  dispatch_history?: DriverDispatchRecord[];
  current_vehicle?: Vehicle | null;
  current_order?: Order | null;
  license_expiry?: string;
  license_status?: string;
  tags?: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type UserRole = 'ADMIN' | 'EXECUTIVE' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'MAINTENANCE_TECH' | 'VIEWER';

export interface UserRoleInfo {
  role: UserRole;
  title: string;
  badgeColor: string;
  allowedTabs: string[];
  description: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  department?: string;
  lastLogin?: string;
}


