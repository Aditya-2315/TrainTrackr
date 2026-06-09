import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyClientProfile, updateMyClientProfile } from '../../api/clients.api'
import { updateMe } from '../../api/auth.api'
import { useAuth } from '../../context/AuthContext'
import { CircleUser, UserRoundPen, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ClientProfilePage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    weight: '',
    height: ''
  })

  const [initialForm, setInitialForm] = useState({})

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['myDetails'],
    queryFn: getMyClientProfile
  })

  useEffect(() => {
    if (clientData?.profile) {
      const p = clientData.profile
      const cp = p.clientProfile || {}

      const initial = {
        name: p.name || '',
        email: p.email || '',
        phone: cp.phone || '',
        weight: cp.weight || '',
        height: cp.height || ''
      }

      setForm(initial)
      setInitialForm(initial)
    }
  }, [clientData])

  const updateUserMutation = useMutation({
    mutationFn: updateMe,
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateMyClientProfile,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const userChanged =
        form.name !== initialForm.name ||
        form.email !== initialForm.email

      const profileChanged =
        form.phone !== initialForm.phone ||
        form.weight !== initialForm.weight ||
        form.height !== initialForm.height

      if (!userChanged && !profileChanged) {
        toast('No changes to update')
        return
      }

      if (userChanged) {
        await updateUserMutation.mutateAsync({
          name: form.name,
          email: form.email
        })
      }

      if (profileChanged) {
        await updateProfileMutation.mutateAsync({
          phone: form.phone,
          weight: Number(form.weight),
          height: Number(form.height)
        })
      }

      toast.success('Profile updated')
      queryClient.invalidateQueries(['myDetails'])
      setIsEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>

  return (
    <div className="mx-auto px-4 pt-6 max-w-lg space-y-6">
      <h1 className="font-semibold text-2xl">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center">
        <CircleUser size={100} className="text-gray-300" />
        <h2 className="font-bold text-xl mt-3">{form.name}</h2>
        <p className="text-sm text-gray-400">{form.email}</p>
        <p className='text-sm text-gray-400'>Phone: {form?.phone || '-'}</p>

        <div className="w-full mt-4 text-left space-y-2">
          <p><span className="font-medium">Weight:</span> {form.weight} kg</p>
          <p><span className="font-medium">Height:</span> {form.height} cm</p>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="mt-4 flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-xl"
        >
          <UserRoundPen size={16} /> Edit Profile
        </button>
      </div>

      {/* Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)}>
                <X size={18} />
              </button>
            </div>

            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="Name" />
            <input name="email" value={form.email} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="Phone" />

            <div className="flex gap-2">
              <div className="relative w-full">
                <input name="weight" value={form.weight} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 pr-10" placeholder="Weight" />
                <span className="absolute right-3 top-2 text-sm text-gray-400">kg</span>
              </div>
              <div className="relative w-full">
                <input name="height" value={form.height} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 pr-10" placeholder="Height" />
                <span className="absolute right-3 top-2 text-sm text-gray-400">cm</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-gray-900 text-white py-2 rounded-xl"
              disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientProfilePage