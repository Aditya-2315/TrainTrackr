import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTrainers, updateTrainerStatus } from "../../api/trainers.api";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { Search, UserCheck, UserX, ChevronDown, Mail } from "lucide-react";
import { inviteTrainer } from "../../api/auth.api";

const STATUS_STYLES = {
  ACTIVE: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-600", label: "Suspended" },
  PENDING_APPROVAL: { bg: "bg-amber-50", text: "text-amber-600", label: "Pending" },
};

function InviteModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: inviteTrainer,
    onSuccess: (data) => {
      setSent(data.inviteToken || "sent");
      toast.success("Invite sent!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to invite"),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Invite trainer</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {sent ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">Invite created. Share this token with the trainer:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-xs text-gray-700 break-all select-all">
                {sent}
              </div>
              <p className="text-xs text-gray-400">
                They register at <span className="font-medium">/trainer/register?token=…</span>
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Trainer's name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                onClick={() => mutate({ email, name })}
                disabled={isPending || !email}
                className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {isPending ? "Sending…" : "Send invite"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TrainerCard({ trainer, onToggleStatus }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[trainer.status] || STATUS_STYLES.ACTIVE;
  const profile = trainer.trainerProfile;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-sm font-semibold text-white shrink-0">
          {trainer.name?.trim()[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{trainer.name}</p>
          <p className="text-xs text-gray-400 truncate">{trainer.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
          {profile && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Specialization", value: profile.specialization || "—" },
                { label: "Experience", value: profile.experience ? `${profile.experience} yrs` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}
          {profile?.bio && (
            <p className="text-xs text-gray-500 leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onToggleStatus(trainer)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                trainer.status === "ACTIVE"
                  ? "border-red-100 text-red-600 hover:bg-red-50"
                  : "border-green-100 text-green-700 hover:bg-green-50"
              }`}
            >
              {trainer.status === "ACTIVE" ? <><UserX size={14} /> Suspend</> : <><UserCheck size={14} /> Activate</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["allTrainers"],
    queryFn: getAllTrainers,
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }) =>
      updateTrainerStatus(id, { status: status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }),
    onSuccess: () => {
      toast.success("Trainer status updated");
      queryClient.invalidateQueries({ queryKey: ["allTrainers"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const trainers = data?.trainers || [];
  const filtered = trainers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-6 pb-6 max-w-4xl mx-auto space-y-5 md:pt-8 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trainers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{trainers.length} total</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Mail size={14} />
          <span className="hidden sm:inline">Invite trainer</span>
          <span className="sm:hidden">Invite</span>
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          placeholder="Search trainers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Trainer</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Specialization</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Experience</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((trainer) => {
                const style = STATUS_STYLES[trainer.status] || STATUS_STYLES.ACTIVE;
                return (
                  <tr key={trainer.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                          {trainer.name?.trim()[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{trainer.name}</p>
                          <p className="text-xs text-gray-400">{trainer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {trainer.trainerProfile?.specialization || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {trainer.trainerProfile?.experience
                        ? `${trainer.trainerProfile.experience} yrs`
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus({ id: trainer.id, status: trainer.status })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          trainer.status === "ACTIVE"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {trainer.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  No trainers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((trainer) => (
            <TrainerCard
              key={trainer.id}
              trainer={trainer}
              onToggleStatus={(t) => toggleStatus({ id: t.id, status: t.status })}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No trainers found</p>
          </div>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}