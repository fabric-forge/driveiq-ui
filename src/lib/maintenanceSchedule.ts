// Toyota 4Runner (2018) manufacturer-recommended maintenance intervals.
// Ported from the reference ry-ops/DriveIQ backend/app/data/maintenance_schedule.py
// (Toyota's official maintenance guide). Cross-checked against CARFAX's
// manufacturer-recommended-services page for this VIN — matches at the
// 130,000 mi milestone (oil/filter, tire rotation due; brake/fluid/wiper
// inspect).
import type { MaintenanceRecord } from '@/types'

export interface ScheduleItem {
  type: string
  name: string
  intervalMiles: number
  intervalMonths: number
  category: 'fluids' | 'filters' | 'brakes' | 'tires' | 'other'
  priority: 'high' | 'medium' | 'low'
}

export const MAINTENANCE_SCHEDULE: ScheduleItem[] = [
  { type: 'oil_change', name: 'Oil & Filter Change', intervalMiles: 5000, intervalMonths: 6, category: 'fluids', priority: 'high' },
  { type: 'tire_rotation', name: 'Tire Rotation', intervalMiles: 5000, intervalMonths: 6, category: 'tires', priority: 'medium' },
  { type: 'air_filter', name: 'Engine Air Filter', intervalMiles: 30000, intervalMonths: 36, category: 'filters', priority: 'medium' },
  { type: 'cabin_filter', name: 'Cabin Air Filter', intervalMiles: 15000, intervalMonths: 12, category: 'filters', priority: 'low' },
  { type: 'brake_fluid', name: 'Brake Fluid', intervalMiles: 30000, intervalMonths: 36, category: 'brakes', priority: 'high' },
  { type: 'transmission_fluid', name: 'Transmission Fluid', intervalMiles: 60000, intervalMonths: 72, category: 'fluids', priority: 'high' },
  { type: 'coolant', name: 'Engine Coolant', intervalMiles: 100000, intervalMonths: 120, category: 'fluids', priority: 'medium' },
  { type: 'spark_plugs', name: 'Spark Plugs', intervalMiles: 120000, intervalMonths: 120, category: 'other', priority: 'medium' },
  { type: 'drive_belt', name: 'Drive Belt', intervalMiles: 100000, intervalMonths: 120, category: 'other', priority: 'medium' },
  { type: 'brake_pads_front', name: 'Front Brake Pads', intervalMiles: 40000, intervalMonths: 48, category: 'brakes', priority: 'high' },
  { type: 'brake_pads_rear', name: 'Rear Brake Pads', intervalMiles: 50000, intervalMonths: 60, category: 'brakes', priority: 'high' },
  { type: 'battery', name: 'Battery', intervalMiles: 50000, intervalMonths: 48, category: 'other', priority: 'medium' },
  { type: 'wiper_blades', name: 'Wiper Blades', intervalMiles: 15000, intervalMonths: 12, category: 'other', priority: 'low' },
]

export interface UpcomingItem extends ScheduleItem {
  lastPerformedDate: string | null
  lastPerformedMileage: number | null
  dueMileage: number
  milesRemaining: number
  status: 'overdue' | 'due_soon' | 'ok'
  dueDate: string | null
}

/** Estimates a calendar due date from the last-performed date + interval. Only
 * meaningful when there's a real last-performed record to anchor it to. */
function estimateDueDate(lastPerformedDate: string | null, intervalMonths: number): string | null {
  if (!lastPerformedDate) return null
  const [y, m, d] = lastPerformedDate.split('-').map(Number)
  const due = new Date(y, m - 1 + intervalMonths, d)
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
}

/** Matches a maintenance_type against a schedule type via substring, same
 * loosely-matched convention the reference reminder generator used. */
function findLastPerformed(records: MaintenanceRecord[], scheduleType: string): MaintenanceRecord | undefined {
  return records.find((r) => r.maintenance_type === scheduleType)
}

export function computeUpcoming(
  records: MaintenanceRecord[],
  currentMileage: number,
  dueSoonWindowMiles = 1000
): UpcomingItem[] {
  return MAINTENANCE_SCHEDULE.map((item) => {
    const last = findLastPerformed(records, item.type)
    const dueMileage = last ? last.mileage + item.intervalMiles : item.intervalMiles
    const milesRemaining = dueMileage - currentMileage

    let status: UpcomingItem['status'] = 'ok'
    if (milesRemaining <= 0) status = 'overdue'
    else if (milesRemaining <= dueSoonWindowMiles) status = 'due_soon'

    return {
      ...item,
      lastPerformedDate: last?.date_performed ?? null,
      lastPerformedMileage: last?.mileage ?? null,
      dueMileage,
      milesRemaining,
      status,
      dueDate: estimateDueDate(last?.date_performed ?? null, item.intervalMonths),
    }
  }).sort((a, b) => a.milesRemaining - b.milesRemaining)
}
