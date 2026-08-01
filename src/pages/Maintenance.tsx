import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Car, Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import type { MaintenanceRecord } from '@/types'

function RecordCard({ record }: { record: MaintenanceRecord }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasDetail = record.notes || record.description || record.service_provider || record.location

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4 cursor-pointer" onClick={() => hasDetail && setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Wrench className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 capitalize">{record.maintenance_type.replace(/_/g, ' ')}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{new Date(record.date_performed).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {record.mileage.toLocaleString()} mi
                </span>
                {record.service_provider && <span className="truncate">{record.service_provider}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {record.cost != null && <span className="font-semibold text-gray-900">${record.cost.toFixed(2)}</span>}
            {hasDetail && (
              <button className="p-1 text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasDetail && (
        <div className="border-t border-gray-100 p-4 space-y-2 text-sm text-gray-600">
          {(record.description || record.notes) && <p>{record.description || record.notes}</p>}
          {record.location && <p className="text-gray-500">{record.location}</p>}
        </div>
      )}
    </div>
  )
}

export default function Maintenance() {
  const { data: records, isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => api.maintenance.list() })

  if (isLoading) return <p className="text-toyota-gray text-center py-12">Loading maintenance history…</p>

  return (
    <div className="space-y-3">
      {records?.length ? (
        records.map((record) => <RecordCard key={record.id} record={record} />)
      ) : (
        <p className="text-toyota-gray text-center py-12">No maintenance records yet.</p>
      )}
    </div>
  )
}
