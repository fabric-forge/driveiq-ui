import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'
import { api } from '@/lib/api'

export default function Reminders() {
  const queryClient = useQueryClient()
  const { data: reminders, isLoading } = useQuery({ queryKey: ['reminders'], queryFn: () => api.reminders.list() })

  const complete = useMutation({
    mutationFn: (id: number) => api.reminders.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] })
    },
  })

  if (isLoading) return <p className="text-toyota-gray text-center py-12">Loading reminders…</p>

  return (
    <div className="space-y-3">
      {reminders?.length ? (
        reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4 flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Bell className="h-5 w-5 text-toyota-red" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{reminder.title}</p>
                <p className="text-sm text-gray-500">
                  {reminder.due_date && `Due ${new Date(reminder.due_date).toLocaleDateString()}`}
                  {reminder.due_date && reminder.due_mileage && ' · '}
                  {reminder.due_mileage && `${reminder.due_mileage.toLocaleString()} mi`}
                </p>
              </div>
            </div>
            <button
              onClick={() => complete.mutate(reminder.id)}
              disabled={complete.isPending}
              className="flex items-center gap-1.5 border border-toyota-red text-toyota-red px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              Mark done
            </button>
          </div>
        ))
      ) : (
        <p className="text-toyota-gray text-center py-12">No active reminders.</p>
      )}
    </div>
  )
}
