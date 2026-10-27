export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'operator' | 'viewer';
  phone_number?: string;
  is_active: boolean;
  date_joined: string;
}

export interface Camera {
  id: number;
  name: string;
  camera_id: string;
  stream_type: 'webcam' | 'rtsp' | 'ip' | 'simulated';
  stream_url: string;
  username?: string;
  has_credentials: boolean;
  resolution: string;
  fps: number;
  processing_fps: number;
  detection_model: string;
  confidence_threshold: number;
  tracking_algorithm: 'bytetrack' | 'botsort';
  is_enabled: boolean;
  status: 'online' | 'offline' | 'error';
  last_ping: string;
  created_at: string;
  updated_at: string;
}

export interface VideoUpload {
  id: number;
  camera?: number;
  file?: string;
  file_url: string;
  original_filename: string;
  file_size_bytes: number;
  duration_seconds: number;
  fps: number;
  resolution: string;
  status: 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress_percent: number;
  total_frames: number;
  processed_frames: number;
  detected_objects_count: number;
  error_message?: string;
  task_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface EvidenceImage {
  id: number;
  persistent_object: number;
  track_id?: number;
  camera?: number;
  camera_name?: string;
  camera_id?: string;
  image: string;
  image_url: string;
  event_type: string;
  confidence: number;
  similarity_score: number;
  captured_at: string;
  metadata_json: Record<string, any>;
}

export interface PersistentObject {
  id: number;
  internal_id: string;
  object_type: string;
  first_seen: string;
  last_seen: string;
  total_visits: number;
  total_duration_seconds: number;
  camera_ids?: string[];
  cameras?: Camera[];
  primary_evidence_image?: string;
  primary_image_url?: string;
  notes?: string;
  evidence_images?: EvidenceImage[];
  visits?: Visit[];
}

export interface Visit {
  id: number;
  persistent_object: number;
  persistent_id: string;
  object_type: string;
  camera?: number;
  camera_id?: string;
  camera_name?: string;
  visit_number: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  entry_evidence?: number;
  entry_image_url?: string;
  created_at: string;
}

export interface Zone {
  id: number;
  camera: number;
  camera_name?: string;
  camera_id?: string;
  name: string;
  zone_type: 'restricted' | 'entrance' | 'parking' | 'reception' | 'warehouse' | 'custom';
  polygon_points: Array<{ x: number; y: number }>;
  rules: string[];
  max_dwell_seconds: number;
  max_occupancy: number;
  color_hex: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id: number;
  camera?: number;
  camera_name?: string;
  camera_id?: string;
  zone?: number;
  zone_name?: string;
  persistent_object?: number;
  persistent_id?: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  title: string;
  message: string;
  track_id?: number;
  object_type?: string;
  evidence_image?: string;
  is_read: boolean;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AlertRule {
  id: number;
  name: string;
  rule_type: string;
  camera?: number;
  camera_name?: string;
  zone?: number;
  zone_name?: string;
  target_classes: string[];
  dwell_threshold_seconds: number;
  occupancy_threshold: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_active: boolean;
  cooldown_seconds: number;
  last_triggered_at?: string;
  created_at: string;
}

export interface ZoneEvent {
  id: number;
  zone: number;
  zone_name?: string;
  camera: number;
  camera_id?: string;
  persistent_object?: number;
  persistent_id?: string;
  track_id?: number;
  object_type: string;
  event_type: 'enter' | 'exit' | 'dwell_exceeded' | 'occupancy_exceeded';
  duration_seconds: number;
  timestamp: string;
}

export interface Report {
  id: number;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  start_date: string;
  end_date: string;
  file_format: 'pdf' | 'csv' | 'excel';
  filters_applied: Record<string, any>;
  summary_data: {
    unique_people?: number;
    total_visits?: number;
    vehicles?: number;
    animals?: number;
    peak_hour?: string;
    [key: string]: any;
  };
  file_path?: string;
  file_url?: string;
  status: 'generating' | 'ready' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user?: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface DashboardKPIs {
  total_cameras: number;
  active_cameras: number;
  objects_detected_today: number;
  unique_objects: number;
  total_visits: number;
  active_alerts: number;
  processing_jobs: number;
  system_health: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  hourly_data: Array<{ hour: string; visitors: number; vehicles: number }>;
  object_distribution: Array<{ name: string; value: number; color: string }>;
  camera_activity: Array<{ name: string; visits: number; alerts: number }>;
  trend: Array<{ date: string; people: number; vehicles: number }>;
  live_activity: Array<{ id: number; timestamp: string; type: string; message: string; camera: string; badge: string }>;
}
