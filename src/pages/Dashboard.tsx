import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { data: vehicle, isLoading, error } = useQuery({ queryKey: ['vehicle'], queryFn: api.vehicle.get })
  const [mileageInput, setMileageInput] = useState('')

  const updateMileage = useMutation({
    mutationFn: (mileage: number) => api.vehicle.updateMileage(mileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      setMileageInput('')
    },
  })

  if (isLoading) return <p className="text-toyota-gray">Loading vehicle…</p>
  if (error) return <p className="text-red-600">No vehicle on record yet.</p>
  if (!vehicle) return null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-toyota-black mb-4">
          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ?? ''}
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-toyota-gray">VIN</dt>
            <dd className="font-mono">{vehicle.vin}</dd>
          </div>
          <div>
            <dt className="text-toyota-gray">Current mileage</dt>
            <dd className="text-xl font-bold text-toyota-black">
              {vehicle.current_mileage?.toLocaleString() ?? '—'} mi
            </dd>
          </div>
          {vehicle.engine && (
            <div>
              <dt className="text-toyota-gray">Engine</dt>
              <dd>{vehicle.engine}</dd>
            </div>
          )}
          {vehicle.last_mileage_update && (
            <div>
              <dt className="text-toyota-gray">Last updated</dt>
              <dd>{new Date(vehicle.last_mileage_update).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-toyota-black mb-3">Update mileage</h3>
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
            placeholder="New mileage"
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <button
            type="submit"
            disabled={updateMileage.isPending}
            className="bg-toyota-red text-white px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            {updateMileage.isPending ? 'Saving…' : 'Update'}
          </button>
        </form>
      </div>
    </div>
  )
}
