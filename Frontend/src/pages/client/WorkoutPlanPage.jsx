import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyWorkoutPlan } from '../../api/clients.api'
import { Download, FileText } from 'lucide-react'

const WorkoutPlanPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['myWorkoutPlan'],
    queryFn: getMyWorkoutPlan
  })

  const plan = data?.workoutPlan
  
  const handleDownload = async () => {
    if (!plan?.file) return

    try {
      const response = await fetch(plan.file)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${plan.title || 'workout-plan'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error('Download failed', err)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto text-center">
        <p className="text-gray-400">No workout plan assigned yet</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Workout Plan</h1>
        <p className="text-sm text-gray-400 mt-1">Your assigned training program</p>
      </div>

      {/* Plan Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-gray-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{plan.title}</h2>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-gray-500">{plan.description}</p>
        )}

        {plan.file && (
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium mt-2"
          >
            <Download size={16} /> Download Plan
          </button>
        )}
      </div>

      {/* PDF Viewer */}
     {plan.fileUrl && (
  <>
    <a
      href={plan.fileUrl}
      target="_blank"
      className="text-blue-500 underline"
    >
      Open PDF in new tab
    </a>
    <iframe
      src={plan.fileUrl}
      className="w-full h-125 mt-2"
    />
  </>
)}
    </div>
  )
}

export default WorkoutPlanPage