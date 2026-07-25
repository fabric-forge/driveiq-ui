import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Maintenance() {
  const { data: records, isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => api.maintenance.list() })

  if (isLoading) return <p className="text-toyota-gray">Loading maintenance history…</p>

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {records?.length ? (
        records.map((record) => (
          <div key={record.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-toyota-black capitalize">{record.maintenance_type.replace(/_/g, ' ')}</p>
              <p className="text-sm text-toyota-gray">
                {new Date(record.date_performed).toLocaleDateString()} · {record.mileage.toLocaleString()} mi
              </p>
            </div>
            {record.cost != null && <p className="font-semibold text-toyota-black">${record.cost.toFixed(2)}</p>}
          </div>
        ))
      ) : (
        <p className="p-4 text-toyota-gray">No maintenance records yet.</p>
      )}
    </div>
  )
}
