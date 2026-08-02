// Mirrors driveiq-cloud's D1 row shapes (see driveiq-cloud/migrations/0001_init.sql),
// which in turn mirror the reference backend/app/schemas/*.py response models.

export interface Vehicle {
  id: number;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  color_exterior: string | null;
  color_interior: string | null;
  purchase_date: string | null;
  purchase_mileage: number | null;
  current_mileage: number | null;
  last_mileage_update: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  maintenance_type: string;
  description: string | null;
  date_performed: string;
  mileage: number;
  cost: number | null;
  parts_cost: number | null;
  labor_cost: number | null;
  service_provider: string | null;
  location: string | null;
  parts_used: string | null;
  notes: string | null;
  documents: string | null;
  photos: string | null;
  created_at: string;
  updated_at: string | null;
}

// From a CARFAX import (see reference backend/app/services/carfax_parser.py).
// Not yet ported to driveiq-cloud — api.carfax.report() 404s gracefully until
// a matching /api/import route exists there.
export interface CarfaxReport {
  retail_value: number;
  owner_count: number;
}

export interface AskSource {
  document: string;
  page: number | null;
  relevance: number;
  thumbnail_url?: string;
  fullsize_url?: string;
}

export interface AskResponse {
  answer: string;
  sources: AskSource[];
}

export interface Reminder {
  id: number;
  vehicle_id: number;
  title: string;
  description: string | null;
  reminder_type: 'mileage' | 'date' | 'both';
  due_date: string | null;
  due_mileage: number | null;
  is_recurring: 0 | 1;
  recurrence_interval_days: number | null;
  recurrence_interval_miles: number | null;
  is_active: 0 | 1;
  is_completed: 0 | 1;
  completed_at: string | null;
  notify_days_before: number;
  notify_miles_before: number;
  last_notified: string | null;
  created_at: string;
  updated_at: string | null;
}
