import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Reminders() {
  const queryClient = useQueryClient()
  const { data: reminders, isLoading } = useQuery({ queryKey: ['reminders'], queryFn: () => api.reminders.list() })

  const complete = useMutation({
    mutationFn: (id: number) => api.reminders.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })

  if (isLoading) return <p className="text-toyota-gray">Loading reminders…</p>

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {reminders?.length ? (
        reminders.map((reminder) => (
          <div key={reminder.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-toyota-black">{reminder.title}</p>
              <p className="text-sm text-toyota-gray">
                {reminder.due_date && `Due ${new Date(reminder.due_date).toLocaleDateString()}`}
                {reminder.due_date && reminder.due_mileage && ' · '}
                {reminder.due_mileage && `${reminder.due_mileage.toLocaleString()} mi`}
              </p>
            </div>
            <button
              onClick={() => complete.mutate(reminder.id)}
              disabled={complete.isPending}
              className="border border-toyota-red text-toyota-red px-3 py-1.5 rounded font-medium text-sm disabled:opacity-50"
            >
              Mark done
            </button>
          </div>
        ))
      ) : (
        <p className="p-4 text-toyota-gray">No active reminders.</p>
      )}
    </div>
  )
}
