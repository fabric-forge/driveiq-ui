import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock3 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'
import { categorize, CATEGORY_META, type Category } from '@/lib/maintenanceCategories'
import { computeUpcoming, type UpcomingItem } from '@/lib/maintenanceSchedule'
import MaintenanceCalendar from '@/components/MaintenanceCalendar'

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
        {item.lastPerformedDate
          ? `Due at ${item.dueMileage.toLocaleString()} mi · last ${formatDate(item.lastPerformedDate)}`
          : 'No record on file'}
      </span>
    </div>
  )
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

  if (isLoading) return <p className="text-toyota-gray text-center py-12">Loading maintenance history…</p>

  return (
    <div className="space-y-6 pb-8">
      {/* Hero header, matching the Home page's dark gradient treatment */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-toyota-red blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-500 blur-3xl" />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white tracking-tight">Maintenance</h1>
          <p className="text-sm text-gray-400 mt-1">Service history and manufacturer-recommended upkeep</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
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

        </div>

        {/* Calendar: past, current, and future (estimated) events */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">Calendar</h2>
          <MaintenanceCalendar records={filtered} upcoming={upcoming} />
        </div>
      </div>
    </div>
  )
}
