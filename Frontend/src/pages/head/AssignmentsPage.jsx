import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAllWorkoutPlans,
} from "../../api/head.api";
import { getAllClients } from "../../api/head.api";
import { getAllTrainers } from "../../api/trainers.api";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, X, ChevronDown, GitMerge } from "lucide-react";

function AssignmentModal({ mode, initial, clients, trainers, plans, onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({
    clientId: initial?.clientId || "",
    trainerId: initial?.trainerId || "",
    workoutPlanId: initial?.workoutPlanId || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (mode === "create" && (!form.clientId || !form.trainerId)) {
      toast.error("Client and trainer are required");
      return;
    }
    onSubmit(form);
  };

  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 bg-white";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {mode === "create" ? "New assignment" : "Edit assignment"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mode === "create" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Client</label>
                <select value={form.clientId} onChange={set("clientId")} className={selectClass}>
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Trainer</label>
                <select value={form.trainerId} onChange={set("trainerId")} className={selectClass}>
                  <option value="">Select trainer…</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Workout plan <span className="text-gray-300 font-normal">(optional)</span>
            </label>
            <select value={form.workoutPlanId} onChange={set("workoutPlanId")} className={selectClass}>
              <option value="">No plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {mode === "edit" && initial && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-600">Client:</span> {initial.client?.name}
              </p>
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-600">Trainer:</span> {initial.trainer?.name}
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            {isPending ? "Saving…" : mode === "create" ? "Create assignment" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({ assignment, onEdit, onDeactivate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {assignment.client?.name}
          </p>
          <p className="text-xs text-gray-400 truncate">→ {assignment.trainer?.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${
            assignment.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {assignment.active ? "Active" : "Inactive"}
          </span>
          <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Plan</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
                {assignment.workout?.title || "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Assigned</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">
                {format(parseISO(assignment.assignedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {assignment.active && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onEdit(assignment)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={14} /> Edit plan
              </button>
              <button
                onClick={() => onDeactivate(assignment.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Deactivate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', data?: assignment }
  const [filterActive, setFilterActive] = useState("active");

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["allAssignments"],
    queryFn: getAllAssignments,
  });
  const { data: clientsData } = useQuery({ queryKey: ["allClients"], queryFn: getAllClients });
  const { data: trainersData } = useQuery({ queryKey: ["allTrainers"], queryFn: getAllTrainers });
  const { data: plansData } = useQuery({ queryKey: ["allWorkoutPlans"], queryFn: getAllWorkoutPlans });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      toast.success("Assignment created");
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["allClients"] });
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create"),
  });

  const { mutate: edit, isPending: editing } = useMutation({
    mutationFn: ({ id, data }) => updateAssignment(id, data),
    onSuccess: () => {
      toast.success("Assignment updated");
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      toast.success("Assignment deactivated");
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["allClients"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const assignments = assignmentsData?.assignments || [];
  const clients = clientsData?.clients || [];
  const trainers = trainersData?.trainers || [];
  const plans = plansData?.plans || [];

  const filtered = assignments.filter((a) =>
    filterActive === "active" ? a.active : !a.active
  );

  const handleSubmit = (form) => {
    if (modal.mode === "create") {
      create({ ...form, workoutPlanId: form.workoutPlanId || null });
    } else {
      edit({ id: modal.data.id, data: { workoutPlanId: form.workoutPlanId || null } });
    }
  };

  return (
    <div className="px-4 pt-6 pb-6 max-w-4xl mx-auto space-y-5 md:pt-8 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {assignments.filter((a) => a.active).length} active
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New assignment</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {["active", "inactive"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filterActive === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Trainer</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Workout plan</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                        {a.client?.name?.trim()[0]}
                      </div>
                      <span className="font-medium text-gray-900">{a.client?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{a.trainer?.name}</td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">
                    {a.workout?.title || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {format(parseISO(a.assignedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${
                      a.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {a.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {a.active && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ mode: "edit", data: a })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Edit plan"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Deactivate this assignment?")) deactivate(a.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <GitMerge size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No {filterActive} assignments</p>
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
          filtered.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onEdit={(a) => setModal({ mode: "edit", data: a })}
              onDeactivate={(id) => {
                if (window.confirm("Deactivate this assignment?")) deactivate(id);
              }}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <GitMerge size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No {filterActive} assignments</p>
          </div>
        )}
      </div>

      {modal && (
        <AssignmentModal
          mode={modal.mode}
          initial={modal.data}
          clients={clients}
          trainers={trainers}
          plans={plans}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isPending={creating || editing}
        />
      )}
    </div>
  );
}