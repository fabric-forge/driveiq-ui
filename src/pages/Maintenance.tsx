import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Car, ChevronDown, ChevronUp, AlertTriangle, Clock3, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'
import { categorize, CATEGORY_META, type Category } from '@/lib/maintenanceCategories'
import { computeUpcoming, type UpcomingItem } from '@/lib/maintenanceSchedule'
import type { MaintenanceRecord } from '@/types'

const CATEGORIES: Category[] = ['fluids', 'filters', 'brakes', 'tires', 'inspections', 'other']

function UpcomingCard({ item }: { item: UpcomingItem }) {
  const meta = CATEGORY_META[item.category]
  const Icon = meta.icon

  const statusStyle = {
    overdue: 'text-red-700 bg-red-50 border-red-200',
    due_soon: 'text-amber-700 bg-amber-50 border-amber-200',
    ok: 'text-gray-600 bg-gray-50 border-gray-200',
  }[item.status]

  const statusLabel = {
    overdue: 'Overdue',
    due_soon: 'Due soon',
    ok: `${Math.round(item.milesRemaining).toLocaleString()} mi left`,
  }[item.status]

  return (
    <div className="flex-shrink-0 w-44 sm:w-auto bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${meta.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</span>
      </div>
      <span className={`inline-flex items-center gap-1 self-start text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}>
        {item.status === 'overdue' && <AlertTriangle className="h-3 w-3" />}
        {item.status === 'due_soon' && <Clock3 className="h-3 w-3" />}
        {statusLabel}
      </span>
      <span className="text-xs text-gray-500">
        Due at {item.dueMileage.toLocaleString()} mi
        {item.lastPerformedDate && ` · last ${formatDate(item.lastPerformedDate)}`}
      </span>
    </div>
  )
}

function RecordRow({ record }: { record: MaintenanceRecord }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasDetail = record.notes || record.description || record.service_provider || record.location
  const meta = CATEGORY_META[categorize(record.maintenance_type)]
  const Icon = meta.icon

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full p-3 flex items-center gap-3 text-left"
        onClick={() => hasDetail && setIsExpanded((v) => !v)}
      >
        <div className={`p-2 rounded-lg shrink-0 ${meta.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 capitalize truncate">{record.maintenance_type.replace(/_/g, ' ')}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>{formatDate(record.date_performed)}</span>
            <span className="flex items-center gap-0.5">
              <Car className="h-3 w-3" />
              {record.mileage.toLocaleString()} mi
            </span>
          </div>
        </div>
        {record.cost != null && <span className="text-sm font-semibold text-gray-900 shrink-0">${record.cost.toFixed(0)}</span>}
        {hasDetail && (
          <span className="text-gray-400 shrink-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>
      {isExpanded && hasDetail && (
        <div className="px-3 pb-3 -mt-1 space-y-1 text-sm text-gray-600 border-t border-gray-100 pt-2">
          {(record.description || record.notes) && <p>{record.description || record.notes}</p>}
          {(record.service_provider || record.location) && (
            <p className="text-gray-500">{[record.service_provider, record.location].filter(Boolean).join(' — ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function groupByYearMonth(records: MaintenanceRecord[]) {
  const years = new Map<number, Map<number, MaintenanceRecord[]>>()
  for (const record of records) {
    const [y, m] = record.date_performed.split('-').map(Number)
    if (!years.has(y)) years.set(y, new Map())
    const months = years.get(y)!
    if (!months.has(m)) months.set(m, [])
    months.get(m)!.push(record)
  }
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: [...months.entries()].sort((a, b) => b[0] - a[0]).map(([month, recs]) => ({ month, records: recs })),
    }))
}

export default function Maintenance() {
  const { data: vehicle } = useQuery({ queryKey: ['vehicle'], queryFn: api.vehicle.get })
  const { data: records, isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => api.maintenance.list() })
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const filtered = useMemo(() => {
    if (!records) return []
    if (activeCategory === 'all') return records
    return records.filter((r) => categorize(r.maintenance_type) === activeCategory)
  }, [records, activeCategory])

  const upcoming = useMemo(() => {
    if (!records || !vehicle?.current_mileage) return []
    const items = computeUpcoming(records, vehicle.current_mileage)
    return activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory)
  }, [records, vehicle?.current_mileage, activeCategory])

  const summary = useMemo(() => {
    const map = new Map<string, { count: number; totalCost: number; lastDate: string }>()
    for (const r of filtered) {
      const entry = map.get(r.maintenance_type) ?? { count: 0, totalCost: 0, lastDate: r.date_performed }
      entry.count += 1
      entry.totalCost += r.cost ?? 0
      if (r.date_performed > entry.lastDate) entry.lastDate = r.date_performed
      map.set(r.maintenance_type, entry)
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [filtered])

  const grouped = useMemo(() => groupByYearMonth(filtered), [filtered])

  if (isLoading) return <p className="text-toyota-gray text-center py-12">Loading maintenance history…</p>

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeCategory === 'all' ? 'bg-toyota-red text-white border-toyota-red' : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat ? 'bg-toyota-red text-white border-toyota-red' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">Upcoming Service</h2>
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-x-auto sm:overflow-visible -mx-1 px-1">
            {upcoming.slice(0, 6).map((item) => (
              <UpcomingCard key={item.type} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      {summary.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {summary.map(([type, s]) => {
              const meta = CATEGORY_META[categorize(type)]
              const Icon = meta.icon
              return (
                <div key={type} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize truncate">{type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">
                    {s.count}x · {formatDate(s.lastDate)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* History, grouped by year/month */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">History</h2>
        {grouped.length === 0 ? (
          <p className="text-toyota-gray text-center py-12 flex flex-col items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-gray-300" />
            No records in this category.
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ year, months }) => (
              <div key={year}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{year}</h3>
                <div className="space-y-4">
                  {months.map(({ month, records: monthRecords }) => (
                    <div key={month}>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                        {MONTH_NAMES[month - 1]}
                      </h4>
                      <div className="space-y-2">
                        {monthRecords.map((r) => (
                          <RecordRow key={r.id} record={r} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
