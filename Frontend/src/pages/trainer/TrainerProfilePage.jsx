import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "../../api/trainers.api";
import { updateMe } from "../../api/auth.api";
import toast from "react-hot-toast";
import { CircleUser, UserRoundPen, X } from "lucide-react";

const TrainerProfilePage = () => {
  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    specialization: "",
    experienceYears: "",
    bio: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["trainerProfile"],
    queryFn: getMyProfile,
    onSuccess: (data) => {
      const p = data.profile;
      setForm({
        name: p.name || "",
        email: p.email || "",
        specialization: p.trainerProfile?.specialization || "",
        experienceYears: p.trainerProfile?.experienceYears || "",
        bio: p.trainerProfile?.bio || "",
      });
    },
  });
  

  const updateUserMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerProfile"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerProfile"] });
    },
  });

  const handleSave = async () => {
    try {
      const payloadUser = {};
      const payloadProfile = {};

      if (form.name !== data.profile.name) payloadUser.name = form.name;
      if (form.email !== data.profile.email) payloadUser.email = form.email;

      if (form.specialization !== data.profile.trainerProfile?.specialization)
        payloadProfile.specialization = form.specialization;

      if (
        Number(form.experienceYears) !==
        data.profile.trainerProfile?.experienceYears
      )
        payloadProfile.experienceYears = Number(form.experienceYears);

      if (form.bio !== data.profile.trainerProfile?.bio)
        payloadProfile.bio = form.bio;

      if (Object.keys(payloadUser).length > 0) {
        await updateUserMutation.mutateAsync(payloadUser);
      }

      if (Object.keys(payloadProfile).length > 0) {
        await updateProfileMutation.mutateAsync(payloadProfile);
      }

      toast.success("Profile updated");
      setShowEdit(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-400">Loading...</div>;
  }

  const profile = data.profile;
  return (
    <div className="mx-auto px-4 pt-6 max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white border rounded-2xl p-6 flex flex-col items-center gap-3">
        <CircleUser size={90} className="text-gray-300" />

        <h2 className="text-lg font-semibold">{profile.user?.name}</h2>
        <p className="text-sm text-gray-400">{profile.user?.email}</p>

        {/* Approval Badge */}
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            profile.isApproved
              ? "bg-green-50 text-green-700"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {profile.isApproved ? "Approved" : "Pending Approval"}
        </span>

        <button
          onClick={() => setShowEdit(true)}
          className="mt-2 flex items-center gap-1 text-sm text-gray-700 hover:text-black"
        >
          <UserRoundPen size={16} />
          Edit Profile
        </button>
      </div>

      {/* Details */}
      <div className="bg-white border rounded-2xl p-5 space-y-3 text-sm">
        <div>
          <p className="text-gray-400">Specialization</p>
          <p className="font-medium">
            {profile.user?.specialization || "—"}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Experience</p>
          <p className="font-medium">
            {profile.user?.experienceYears
              ? `${profile.trainerProfile.experienceYears} years`
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Bio</p>
          <p className="font-medium whitespace-pre-line">
            {profile.user?.bio || "—"}
          </p>
        </div>
      </div>

      {/* Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold">Edit Profile</h2>
              <button onClick={() => setShowEdit(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Inputs */}
            {[
              { label: "Name", key: "name" },
              { label: "Email", key: "email" },
              { label: "Specialization", key: "specialization" },
              { label: "Experience (years)", key: "experienceYears", type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs text-gray-500">{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: e.target.value })
                  }
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
                />
              </div>
            ))}

            <div>
              <label className="text-xs text-gray-500">Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) =>
                  setForm({ ...form, bio: e.target.value })
                }
                className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-gray-900 text-white py-2 rounded-xl text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerProfilePage;