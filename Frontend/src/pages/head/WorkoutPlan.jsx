import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from "../../api/head.api";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, FileText, X, ExternalLink } from "lucide-react";

function getViewableUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/fl_inline/");
}

function PlanModal({ mode, initial, onClose, onSubmit, isPending }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [file, setFile] = useState(null);

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    if (file) fd.append("file", file);
    onSubmit(fd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {mode === "create" ? "New workout plan" : "Edit plan"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Beginner strength plan"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the plan…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              PDF file {mode === "edit" && <span className="text-gray-300 font-normal">(leave empty to keep existing)</span>}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            {isPending ? "Saving…" : mode === "create" ? "Create plan" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutPlansPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["allWorkoutPlans"],
    queryFn: getAllWorkoutPlans,
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: createWorkoutPlan,
    onSuccess: () => {
      toast.success("Plan created");
      queryClient.invalidateQueries({ queryKey: ["allWorkoutPlans"] });
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: ({ id, fd }) => updateWorkoutPlan(id, fd),
    onSuccess: () => {
      toast.success("Plan updated");
      queryClient.invalidateQueries({ queryKey: ["allWorkoutPlans"] });
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteWorkoutPlan,
    onSuccess: () => {
      toast.success("Plan deleted");
      queryClient.invalidateQueries({ queryKey: ["allWorkoutPlans"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const plans = data?.plans || [];

  const handleSubmit = (fd) => {
    if (modal.mode === "create") {
      create(fd);
    } else {
      update({ id: modal.data.id, fd });
    }
  };

  return (
    <div className="px-4 pt-6 pb-6 max-w-4xl mx-auto space-y-5 md:pt-8 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workout plans</h1>
          <p className="text-sm text-gray-400 mt-0.5">{plans.length} plans</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New plan</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {plan.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {plan.createdBy?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setModal({ mode: "edit", data: plan })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this plan? This cannot be undone."))
                        remove(plan.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {plan.description && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {plan.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto pt-1">
                <p className="text-xs text-gray-400">
                  {format(parseISO(plan.createdAt), "MMM d, yyyy")}
                </p>
                {plan.fileUrl && (
                  <a
                    href={getViewableUrl(plan.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    View PDF <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No workout plans yet</p>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="mt-3 text-sm font-medium text-gray-900 underline underline-offset-2"
          >
            Create your first plan
          </button>
        </div>
      )}

      {modal && (
        <PlanModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          isPending={creating || updating}
        />
      )}
    </div>
  );
}