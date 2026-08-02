import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Gauge, FileText, Settings2, Wrench, Bell, Check, Plus, X,
  TrendingUp, CheckCircle2, ChevronDown, ChevronUp, MapPin, Clock, CalendarClock, Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, daysSince } from '@/lib/date'
import { CATEGORY_META } from '@/lib/maintenanceCategories'
import { computeUpcoming, type UpcomingItem } from '@/lib/maintenanceSchedule'
import { forecastAianaQuery, reminderAianaQuery } from '@/lib/aianaQueries'
import type { Reminder, MaintenanceRecord } from '@/types'

function AskAianaLink({ query, className }: { query: string; className?: string }) {
  return (
    <Link
      to={`/aiana?q=${encodeURIComponent(query)}`}
      className={
        className ??
        'flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
      }
      title="Ask Aiana about this"
    >
      <Sparkles className="h-4 w-4" />
      Ask Aiana
    </Link>
  )
}

const URGENCY_STYLE: Record<UpcomingItem['status'], { border: string; badge: string }> = {
  overdue: { border: 'border-red-500', badge: 'text-red-600 bg-red-50 border-red-200' },
  due_soon: { border: 'border-amber-500', badge: 'text-amber-600 bg-amber-50 border-amber-200' },
  ok: { border: 'border-emerald-500', badge: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
}

function Tag({ label, className }: { label: string; className: string }) {
  return (
    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}

function ReminderCard({
  reminder,
  onLogService,
  onMarkDone,
  isPending,
}: {
  reminder: Reminder
  onLogService: () => void
  onMarkDone: () => void
  isPending: boolean
}) {
  const isAppointment = reminder.category === 'appointment'

  return (
    <div className={`bg-white rounded-xl shadow-md border-l-4 overflow-hidden ${isAppointment ? 'border-blue-500' : 'border-toyota-red'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${isAppointment ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-toyota-red'}`}>
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <h3 className="font-semibold text-gray-900 break-words">{reminder.title}</h3>
              {isAppointment ? (
                <Tag label="Appointment" className="bg-blue-600 text-white" />
              ) : (
                <Tag label="Reminder" className="bg-toyota-red text-white" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {reminder.due_date && `Due ${formatDate(reminder.due_date)}`}
              {reminder.due_date && reminder.due_mileage && ' • '}
              {reminder.due_mileage && `${reminder.due_mileage.toLocaleString()} mi`}
            </p>
            {reminder.description && <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onLogService}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Log service with cost & provider"
          >
            <Plus className="h-4 w-4" />
            Log service
          </button>
          <button
            onClick={onMarkDone}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 border border-toyota-red text-toyota-red px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Check className="h-4 w-4" />
            Mark done
          </button>
        </div>
        {/* Nothing to look up in the manual for a scheduled appointment — only
            for a part or fluid, so schedule-based reminders skip this. */}
        {!isAppointment && (
          <div className="mt-2">
            <AskAianaLink
              query={reminderAianaQuery(reminder.title)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ForecastCard({
  item,
  lastRecord,
  currentMileage,
  isExpanded,
  onToggle,
}: {
  item: UpcomingItem
  lastRecord?: MaintenanceRecord
  currentMileage: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const meta = CATEGORY_META[item.category]
  const Icon = meta.icon
  const { border, badge } = URGENCY_STYLE[item.status]
  const aianaQuery = forecastAianaQuery(item.type, item.name)

  const statusLabel = {
    overdue: 'Overdue',
    due_soon: 'Due soon',
    ok: `${Math.round(item.milesRemaining).toLocaleString()} mi left`,
  }[item.status]

  // Fetched once, on first expand, and cached indefinitely — an LLM+RAG call
  // per card isn't free, and the answer for a given service type doesn't
  // change between page loads.
  const spec = useQuery({
    queryKey: ['aiana-spec', item.type],
    queryFn: () => api.aiana.ask(aianaQuery),
    enabled: isExpanded,
    staleTime: Infinity,
    retry: false,
  })

  return (
    <div className={`bg-white rounded-xl shadow-md border-l-4 overflow-hidden transition-all ${border}`}>
      <button onClick={onToggle} className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${meta.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                <h3 className="font-semibold text-gray-900 break-words">{item.name}</h3>
                <Tag label="Forecast" className="bg-gray-900 text-white" />
              </div>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 border ${badge}`}>
                {statusLabel}
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Due Mileage</p>
              <p className="font-medium text-gray-900">{item.dueMileage.toLocaleString()} mi</p>
            </div>
            {item.dueDate && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Est. Due Date</p>
                <p className="font-medium text-gray-900">{formatDate(item.dueDate)}</p>
              </div>
            )}
          </div>

          {lastRecord?.service_provider && (
            <div className="mt-4 p-3 bg-white rounded-lg border flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">{lastRecord.service_provider}</span>
            </div>
          )}

          {item.lastPerformedDate && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(daysSince(item.lastPerformedDate) / 30)} months since last service</span>
              </div>
              {item.lastPerformedMileage !== null && (
                <div className="flex items-center gap-1">
                  <Gauge className="h-4 w-4" />
                  <span>{(currentMileage - item.lastPerformedMileage).toLocaleString()} mi since last</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              From the manual
            </p>
            {spec.isLoading && <p className="text-sm text-gray-400">Asking Aiana…</p>}
            {spec.isError && <p className="text-sm text-gray-400">Couldn't reach Aiana just now.</p>}
            {spec.data && (
              <p className="text-sm text-gray-700">
                {spec.data.answer.length > 220 ? `${spec.data.answer.slice(0, 220).trim()}…` : spec.data.answer}
              </p>
            )}
            <div className="mt-3">
              <AskAianaLink query={aianaQuery} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [mileageInput, setMileageInput] = useState('')
  const [blurredCards, setBlurredCards] = useState<Set<string>>(new Set())
  const [expandedForecast, setExpandedForecast] = useState<Set<string>>(new Set())
  const [logReminder, setLogReminder] = useState<Reminder | null>(null)
  const [logCost, setLogCost] = useState('')
  const [logProvider, setLogProvider] = useState('')
  const [logNotes, setLogNotes] = useState('')

  const toggleBlur = (cardId: string) => {
    setBlurredCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  const toggleForecast = (type: string) => {
    setExpandedForecast((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const { data: vehicle, isLoading, error } = useQuery({ queryKey: ['vehicle'], queryFn: api.vehicle.get })
  const { data: reminders } = useQuery({ queryKey: ['reminders'], queryFn: () => api.reminders.list() })
  const { data: records } = useQuery({ queryKey: ['maintenance'], queryFn: () => api.maintenance.list() })
  const { data: carfaxReport } = useQuery({ queryKey: ['carfax-report'], queryFn: api.carfax.report, retry: false })

  const updateMileage = useMutation({
    mutationFn: (mileage: number) => api.vehicle.updateMileage(mileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      setMileageInput('')
    },
  })

  const completeReminder = useMutation({
    mutationFn: ({ id, details }: { id: number; details?: { mileage?: number; cost?: number; service_provider?: string; notes?: string } }) =>
      api.reminders.complete(id, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] })
      setLogReminder(null)
      setLogCost('')
      setLogProvider('')
      setLogNotes('')
    },
  })

  const upcoming = useMemo(() => {
    if (!records || !vehicle?.current_mileage) return []
    return computeUpcoming(records, vehicle.current_mileage).slice(0, 6)
  }, [records, vehicle?.current_mileage])

  const lastRecordByType = useMemo(() => {
    const map = new Map<string, MaintenanceRecord>()
    for (const r of records ?? []) {
      if (!map.has(r.maintenance_type)) map.set(r.maintenance_type, r)
    }
    return map
  }, [records])

  const totalActionable = (reminders?.length ?? 0) + upcoming.length

  if (isLoading) return <p className="text-toyota-gray text-center py-12">Loading vehicle…</p>
  if (error) return <p className="text-red-600 text-center py-12">No vehicle on record yet.</p>
  if (!vehicle) return null

  return (
    <div className="space-y-6">
      {/* Vehicle block: title, mileage update, and all vehicle stats together */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-toyota-red blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-toyota-red rounded-full">
                  {vehicle.year}
                </span>
                {carfaxReport && (
                  <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider bg-white/10 rounded-full text-gray-300">
                    {carfaxReport.owner_count}-Owner
                  </span>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-lg text-gray-400 mt-1">
                {vehicle.trim ?? ''}
                {vehicle.color_exterior ? ` • ${vehicle.color_exterior}` : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2 lg:text-right">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const mileage = Number(mileageInput)
                  if (Number.isFinite(mileage)) updateMileage.mutate(mileage)
                }}
              >
                <input
                  type="number"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  placeholder="Update mileage"
                  className="w-40 px-3 py-2 text-sm text-gray-900 bg-white/90 backdrop-blur border-0 rounded-lg focus:ring-2 focus:ring-toyota-red"
                />
                <button
                  type="submit"
                  disabled={!mileageInput || updateMileage.isPending}
                  className="px-4 py-2 text-sm bg-toyota-red text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {updateMileage.isPending ? 'Saving…' : 'Update'}
                </button>
              </form>
              {vehicle.last_mileage_update && (
                <p className="text-xs text-gray-500">
                  Last updated: {formatDate(vehicle.last_mileage_update)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              onClick={() => toggleBlur('odometer')}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              title="Click to blur/unblur"
            >
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-5 w-5 text-blue-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Odometer</span>
              </div>
              <p
                className={`text-2xl lg:text-3xl font-bold text-white transition-all ${
                  blurredCards.has('odometer') ? 'blur-md select-none' : ''
                }`}
              >
                {vehicle.current_mileage?.toLocaleString() ?? '—'}
              </p>
              <p className="text-sm text-gray-500">miles</p>
            </div>

            <div
              onClick={() => toggleBlur('value')}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              title="Click to blur/unblur"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Est. Value</span>
              </div>
              <p
                className={`text-2xl lg:text-3xl font-bold text-white transition-all ${
                  blurredCards.has('value') ? 'blur-md select-none' : ''
                }`}
              >
                {carfaxReport?.retail_value ? `$${carfaxReport.retail_value.toLocaleString()}` : '—'}
              </p>
              <p className="text-sm text-gray-500">CARFAX estimate</p>
            </div>

            <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-green-400">Recalls</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-green-400">Clear</p>
              <p className="text-sm text-green-500/70">No open recalls</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-5 w-5 text-cyan-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Engine</span>
              </div>
              <p className="text-lg lg:text-xl font-bold text-white">{vehicle.engine ?? '—'}</p>
              <p className="text-sm text-gray-500">{vehicle.drivetrain ?? ''}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Transmission</span>
              </div>
              <p className="text-lg lg:text-xl font-bold text-white">{vehicle.transmission ?? '—'}</p>
            </div>

            <div
              onClick={() => toggleBlur('vin')}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              title="Click to blur/unblur"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">VIN</span>
              </div>
              <p
                className={`text-sm lg:text-base font-mono font-bold text-white truncate transition-all ${
                  blurredCards.has('vin') ? 'blur-md select-none' : ''
                }`}
                title={vehicle.vin}
              >
                {vehicle.vin}
              </p>
              <p className="text-sm text-gray-500">Vehicle ID</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders + Maintenance Forecast, unified into one "what's next" grid.
          Reminders (fixed commitments) always sort first with a solid
          toyota-red border/tag; forecast items (interval projections) follow,
          urgency-sorted, with a neutral tag and urgency-colored border. */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-toyota-red" />
              What's Next
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Reminders you've set, plus what's due based on service history</p>
          </div>
          {totalActionable > 0 && (
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-toyota-red text-white">
              {totalActionable} to review
            </span>
          )}
        </div>

        {totalActionable === 0 ? (
          <p className="text-toyota-gray text-center py-6 bg-white rounded-xl shadow-md">Nothing due right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders?.map((reminder) => (
              <ReminderCard
                key={`reminder-${reminder.id}`}
                reminder={reminder}
                onLogService={() => setLogReminder(reminder)}
                onMarkDone={() => completeReminder.mutate({ id: reminder.id })}
                isPending={completeReminder.isPending}
              />
            ))}
            {upcoming.map((item) => (
              <ForecastCard
                key={`forecast-${item.type}`}
                item={item}
                lastRecord={lastRecordByType.get(item.type)}
                currentMileage={vehicle.current_mileage ?? 0}
                isExpanded={expandedForecast.has(item.type)}
                onToggle={() => toggleForecast(item.type)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Log Service modal */}
      {logReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log Service</h2>
              <button
                onClick={() => {
                  setLogReminder(null)
                  setLogCost('')
                  setLogProvider('')
                  setLogNotes('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium">{logReminder.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mileage</p>
                <p className="font-medium">
                  {(vehicle.current_mileage ?? logReminder.due_mileage ?? 0).toLocaleString()} miles
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Service Provider (optional)</label>
                <input
                  type="text"
                  value={logProvider}
                  onChange={(e) => setLogProvider(e.target.value)}
                  placeholder="e.g. Kari Toyota"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Cost (optional)</label>
                <input
                  type="number"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setLogReminder(null)
                    setLogCost('')
                    setLogProvider('')
                    setLogNotes('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    completeReminder.mutate({
                      id: logReminder.id,
                      details: {
                        mileage: vehicle.current_mileage ?? logReminder.due_mileage ?? undefined,
                        cost: logCost ? parseFloat(logCost) : undefined,
                        service_provider: logProvider || undefined,
                        notes: logNotes || undefined,
                      },
                    })
                  }
                  disabled={completeReminder.isPending}
                  className="flex-1 px-4 py-2 bg-toyota-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {completeReminder.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
