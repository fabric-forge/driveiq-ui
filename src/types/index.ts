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

// Curated OEM specs (tire size, oil capacity, spark plugs, cabin filter,
// drive belt) — a one-time researched-and-reviewed compile, not a live
// lookup. See driveiq-cloud/migrations/0004_vehicle_specs.sql for why this
// is a plain table rather than another RAG document. Only covers a subset
// of maintenance_types; ForecastCard falls back to the live Aiana lookup
// for anything not in this table.
export interface VehicleSpec {
  id: number;
  vehicle_id: number;
  maintenance_type: string;
  spec_text: string;
  part_number: string | null;
  source_note: string | null;
  created_at: string;
  updated_at: string | null;
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
  // True when Aiana called the create_reminder tool during this turn — the
  // caller should invalidate the ['reminders'] query so What's Next refreshes.
  reminder_created?: boolean;
  // True when Aiana called the update_reminder tool during this turn — same
  // invalidation as reminder_created, just for an edit instead of a new one.
  reminder_updated?: boolean;
}

// Wire shapes for POST /api/search/ingest — used by the Aiana document
// upload flow (src/lib/pdfIngest.ts), which parses/chunks/renders PDFs
// client-side and posts the results to the same ingest endpoints the local
// driveiq-cloud/scripts/ingest*.mjs scripts use.
export interface IngestChunk {
  content: string;
  chunk_index: number;
  page_number: number | null;
}

export interface IngestResponse {
  ingested: number;
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
  // 'appointment' when Aiana created this via create_reminder from a chat
  // message; null for reminders the owner set up manually. Appointments skip
  // the Ask Aiana button — there's no manual page to look up for an event.
  category: 'appointment' | null;
  created_at: string;
  updated_at: string | null;
  // Short human-friendly reference (e.g. "DR-2026-0042") the backend derives
  // from id + created_at — see driveiq-cloud/src/worker/core/reminders.ts.
  // Not stored; always present on API responses, nothing to backfill.
  reference_number: string;
}

// NHTSA recall records — see driveiq-cloud/migrations/0005_recalls.sql.
// status defaults to 'open' at seed time since the source VIN report only
// confirms a campaign + remedy-availability date, not whether this
// vehicle's own remedy was completed.
export interface Recall {
  id: number;
  vehicle_id: number;
  nhtsa_campaign: string;
  component: string;
  summary: string;
  consequence: string | null;
  remedy: string | null;
  report_receipt_date: string | null;
  status: 'open' | 'remedied';
  created_at: string;
  updated_at: string | null;
}

// Theft/salvage title-brand check — see driveiq-cloud/migrations/0006_title_checks.sql.
export interface TitleCheck {
  id: number;
  vehicle_id: number;
  source: string;
  theft_status: 'clear' | 'flagged';
  salvage_status: 'clear' | 'flagged';
  checked_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}
