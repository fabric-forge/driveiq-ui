// DriveIQ UI — API client
// Requests go to a relative /api/... path, same-origin with the frontend.
// A Worker route binds driveiq-api's Worker to driveiq.ry-ops.dev/api/* in
// addition to its standalone host, so the browser never makes a cross-origin
// call — Cloudflare Access can't selectively bypass a CORS preflight (no
// HTTP-method rule in its policy builder), so a credentialed cross-origin
// POST/PATCH from driveiq.ry-ops.dev to driveiq-api.ry-ops.dev always 403s
// on the OPTIONS preflight. VITE_API_URL can still override this (e.g. local
// dev against a standalone Worker) — see .env.example.

import type { Vehicle, MaintenanceRecord, Reminder, AskResponse, CarfaxReport, VehicleSpec, IngestChunk, IngestResponse, Recall, TitleCheck } from '@/types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function apiFetchRaw(path: string, init?: RequestInit): Promise<Response> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.clone().json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(body.detail ?? `HTTP ${res.status}`), { status: res.status, body });
  }
  return res;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetchRaw(path, init);
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => apiFetch<T>(path);
const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' });

export const api = {
  vehicle: {
    get: () => get<Vehicle>('/api/vehicle'),
    update: (body: Partial<Pick<Vehicle, 'current_mileage' | 'color_exterior' | 'color_interior'>>) =>
      patch<Vehicle>('/api/vehicle', body),
    updateMileage: (mileage: number) => patch<Vehicle>(`/api/vehicle/mileage/${mileage}`),
  },
  maintenance: {
    list: (params?: { maintenance_type?: string; skip?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.maintenance_type) qs.set('maintenance_type', params.maintenance_type);
      if (params?.skip) qs.set('skip', String(params.skip));
      if (params?.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs}` : '';
      return get<MaintenanceRecord[]>(`/api/maintenance${suffix}`);
    },
    get: (id: number) => get<MaintenanceRecord>(`/api/maintenance/${id}`),
    create: (body: Partial<MaintenanceRecord> & Pick<MaintenanceRecord, 'vehicle_id' | 'maintenance_type' | 'date_performed' | 'mileage'>) =>
      post<MaintenanceRecord>('/api/maintenance', body),
    update: (id: number, body: Partial<MaintenanceRecord>) => patch<MaintenanceRecord>(`/api/maintenance/${id}`, body),
    delete: (id: number) => del<{ message: string }>(`/api/maintenance/${id}`),
    summary: () =>
      get<{ type: string; count: number; total_cost: number; last_performed: string; last_mileage: number }[]>(
        '/api/maintenance/types/summary'
      ),
  },
  reminders: {
    list: (activeOnly = true) => get<Reminder[]>(`/api/reminders?active_only=${activeOnly}`),
    upcoming: (currentMileage?: number) =>
      get<Reminder[]>(`/api/reminders/upcoming${currentMileage !== undefined ? `?current_mileage=${currentMileage}` : ''}`),
    get: (id: number) => get<Reminder>(`/api/reminders/${id}`),
    create: (body: Partial<Reminder> & Pick<Reminder, 'vehicle_id' | 'title' | 'reminder_type'>) =>
      post<Reminder>('/api/reminders', body),
    update: (id: number, body: Partial<Reminder>) => patch<Reminder>(`/api/reminders/${id}`, body),
    complete: (id: number, body?: { mileage?: number; cost?: number; service_provider?: string; notes?: string }) =>
      post<Reminder>(`/api/reminders/${id}/complete`, body),
    delete: (id: number) => del<{ message: string }>(`/api/reminders/${id}`),
  },
  aiana: {
    ask: (query: string) => post<AskResponse>('/api/search/ask', { query }),
    // Used by the document upload flow (src/lib/pdfIngest.ts) — same
    // endpoints the local driveiq-cloud/scripts/ingest*.mjs scripts call,
    // just invoked from the browser instead of a local wrangler dev session.
    ingestChunks: (document_name: string, chunks: IngestChunk[]) =>
      post<IngestResponse>('/api/search/ingest', { document_name, chunks }),
    ingestPageImage: (document: string, page: number, variant: 'thumbnail' | 'full', bytes: ArrayBuffer) =>
      apiFetchRaw(`/api/pages/ingest/${encodeURIComponent(document)}/${page}/${variant}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: bytes,
      }),
  },
  carfax: {
    // No matching route on driveiq-cloud yet — 404 resolves to null so the
    // dashboard's Est. Value / owner-count UI degrades gracefully instead of
    // erroring, and lights up automatically once the route exists.
    report: () =>
      apiFetchRaw('/api/import/carfax-report')
        .then((res) => res.json() as Promise<CarfaxReport>)
        .catch((err) => {
          if (err?.status === 404) return null;
          throw err;
        }),
  },
  vehicleSpecs: {
    list: () => get<VehicleSpec[]>('/api/vehicle-specs'),
  },
  recalls: {
    list: () => get<Recall[]>('/api/recalls'),
    updateStatus: (id: number, status: 'open' | 'remedied') => patch<Recall>(`/api/recalls/${id}`, { status }),
  },
  titleChecks: {
    list: () => get<TitleCheck[]>('/api/title-checks'),
  },
};
