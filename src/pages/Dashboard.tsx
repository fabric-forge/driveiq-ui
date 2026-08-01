import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gauge, FileText, Settings2, Wrench, Bell, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [mileageInput, setMileageInput] = useState('')
  const [blurredCards, setBlurredCards] = useState<Set<string>>(new Set())

  const toggleBlur = (cardId: string) => {
    setBlurredCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  const { data: vehicle, isLoading, error } = useQuery({ queryKey: ['vehicle'], queryFn: api.vehicle.get })
  const { data: upcomingReminders } = useQuery({
    queryKey: ['upcoming-reminders', vehicle?.current_mileage],
    queryFn: () => api.reminders.upcoming(vehicle?.current_mileage ?? undefined),
    enabled: !!vehicle,
  })

  const updateMileage = useMutation({
    mutationFn: (mileage: number) => api.vehicle.updateMileage(mileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] })
      setMileageInput('')
    },
  })

  const completeReminder = useMutation({
    mutationFn: (id: number) => api.reminders.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })

  if (isLoading) return <p className="text-toyota-gray text-center py-12">Loading vehicle…</p>
  if (error) return <p className="text-red-600 text-center py-12">No vehicle on record yet.</p>
  if (!vehicle) return null

  return (
    <div className="space-y-6">
      {/* Vehicle hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-toyota-red blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-toyota-red rounded-full mb-2">
                {vehicle.year}
              </span>
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Upcoming reminders */}
      {upcomingReminders && upcomingReminders.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-toyota-red" />
            Upcoming Service Reminders
          </h2>
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{reminder.title}</p>
                  <p className="text-sm text-gray-600">
                    {reminder.due_date && `Due: ${formatDate(reminder.due_date)}`}
                    {reminder.due_date && reminder.due_mileage && ' • '}
                    {reminder.due_mileage && `${reminder.due_mileage.toLocaleString()} miles`}
                  </p>
                </div>
                <button
                  onClick={() => completeReminder.mutate(reminder.id)}
                  disabled={completeReminder.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
