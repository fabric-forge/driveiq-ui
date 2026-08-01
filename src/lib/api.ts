// DriveIQ UI — API client
// Every request goes through the absolute API host, never a relative path.
// In prod the UI is served from Cloudflare Pages (driveiq.ry-ops.dev) but the
// API lives on the Worker (driveiq-api.ry-ops.dev); a relative `/api/...`
// fetch would hit Pages, which only serves static assets and 405s on
// anything but GET/HEAD. Mirrors social-ui/src/lib/api.ts's apiFetchRaw
// pattern for the same reason.

import type { Vehicle, MaintenanceRecord, Reminder } from '@/types';

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
};
