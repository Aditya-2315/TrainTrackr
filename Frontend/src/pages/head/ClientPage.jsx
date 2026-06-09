import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllClients,
  updateClientStatus,
  getClientAllowances,
  setClientAllowance,
  deleteAllowance,
} from "../../api/head.api";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  Search, UserCheck, UserX, ChevronDown,
  GitMerge, Layers, Plus, Trash2, X,
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  ACTIVE: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-600", label: "Suspended" },
  PENDING_APPROVAL: { bg: "bg-amber-50", text: "text-amber-600", label: "Pending" },
};

// ── Allowance modal ─────────────────────────────────────────────────────────
function AllowanceModal({ client, onClose }) {
  const queryClient = useQueryClient();
  const [maxSessions, setMaxSessions] = useState("");
  const [startDate, setStartDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState("");
  const [limitType, setLimitType] = useState("MONTHLY");

  const { data, isLoading } = useQuery({
    queryKey: ["clientAllowances", client.id],
    queryFn: () => getClientAllowances(client.id),
  });
const [isUnlimited, setIsUnlimited] = useState(false);
  const { mutate: createAllowance, isPending: creating } = useMutation({
   mutationFn: () =>
  setClientAllowance(client.id, {
    limitType,
    maxSessions: isUnlimited ? undefined : parseInt(maxSessions),
    startDate,
    endDate: endDate || undefined,
    isUnlimited,
  }),
    onSuccess: () => {
      toast.success("Session allowance set");
      queryClient.invalidateQueries({ queryKey: ["clientAllowances", client.id] });
      queryClient.invalidateQueries({ queryKey: ["allClients"] });
      setMaxSessions("");
      setEndDate("");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to set allowance"),
  });
  const { mutate: removeAllowance } = useMutation({
    mutationFn: deleteAllowance,
    onSuccess: () => {
      toast.success("Allowance removed");
      queryClient.invalidateQueries({ queryKey: ["clientAllowances", client.id] });
      queryClient.invalidateQueries({ queryKey: ["allClients"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });
  
  const allowances = data?.allowances || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Session allowances</h3>
            <p className="text-xs text-gray-400 mt-0.5">{client.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Existing allowances */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Current allowances
            </p>
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : allowances.length > 0 ? (
              <div className="space-y-2">
                {allowances.map((a) => (
                  <div
                    key={a.id}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
<div className="flex items-center gap-2 flex-wrap">
  {a.isUnlimited ? (
    <span className="text-sm font-semibold text-gray-900">Unlimited</span>
  ) : (
    <span className="text-sm font-semibold text-gray-900">
      {a.maxSessions} sessions
    </span>
  )}
  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
    {a.limitType}
  </span>
  {a.isUnlimited && (
    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-lg bg-green-50 text-green-700">
      Tracking only
    </span>
  )}
</div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        From {format(parseISO(a.startDate), "MMM d, yyyy")}
                        {a.endDate
                          ? ` → ${format(parseISO(a.endDate), "MMM d, yyyy")}`
                          : " · No end date"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Remove this allowance?"))
                          removeAllowance(a.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-amber-700">No allowance set</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  This client cannot book sessions until an allowance is added.
                </p>
              </div>
            )}
          </div>

{/* Add new allowance form */}
<div className="border-t border-gray-100 pt-5">
  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
    Add new allowance
  </p>
  <div className="space-y-3">

    {/* Unlimited toggle */}
    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Unlimited sessions</p>
        <p className="text-xs text-gray-400 mt-0.5">Track usage with no cap</p>
      </div>
      <button
        onClick={() => setIsUnlimited((u) => !u)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          isUnlimited ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            isUnlimited ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>

    {/* Sessions count — hidden when unlimited */}
    {!isUnlimited && (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Number of sessions
        </label>
        <input
          type="number"
          min="1"
          value={maxSessions}
          onChange={(e) => setMaxSessions(e.target.value)}
          placeholder="e.g. 20"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
    )}

    {/* Pack type label */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        Pack type <span className="text-gray-300 font-normal">(label only)</span>
      </label>
      <div className="flex gap-2">
        {["WEEKLY", "MONTHLY"].map((t) => (
          <button
            key={t}
            onClick={() => setLimitType(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              limitType === t
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </div>

    {/* Date range */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Start date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          End date <span className="text-gray-300">(optional)</span>
        </label>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
    </div>

    <button
      onClick={() => createAllowance()}
      disabled={(!isUnlimited && (!maxSessions || parseInt(maxSessions) < 1)) || creating}
      className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus size={15} />
      {creating ? "Adding…" : isUnlimited ? "Add unlimited allowance" : "Add allowance"}
    </button>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile client card ──────────────────────────────────────────────────────
function ClientCard({ client, onToggleStatus, onManageAllowance }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[client.status] || STATUS_STYLES.ACTIVE;
  const activeAssignment = client.clientAssignments?.find((a) => a.active);
  const profile = client.clientProfile;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
          {client.name?.trim()[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
          <p className="text-xs text-gray-400 truncate">{client.email}</p>
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
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Trainer</p>
              {activeAssignment ? (
                <p className="text-sm text-gray-700">{activeAssignment.trainer?.name}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Unassigned</p>
              )}
            </div>
            {activeAssignment?.workout && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Plan</p>
                <p className="text-sm text-gray-700 truncate max-w-[140px]">{activeAssignment.workout.title}</p>
              </div>
            )}
          </div>

          {profile && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "—" },
                { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
                { label: "Phone", value: profile.phone || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400">
            Joined {format(parseISO(client.createdAt), "MMM d, yyyy")}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/head/assignments"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <GitMerge size={14} /> Assign
            </Link>
            <button
              onClick={() => onManageAllowance(client)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-blue-100 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Layers size={14} /> Sessions
            </button>
          </div>

          <button
            onClick={() => onToggleStatus(client)}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              client.status === "ACTIVE"
                ? "border-red-100 text-red-600 hover:bg-red-50"
                : "border-green-100 text-green-700 hover:bg-green-50"
            }`}
          >
            {client.status === "ACTIVE" ? <><UserX size={14} /> Suspend</> : <><UserCheck size={14} /> Activate</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [allowanceClient, setAllowanceClient] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["allClients"],
    queryFn: getAllClients,
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }) =>
      updateClientStatus(id, { status: status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }),
    onSuccess: () => {
      toast.success("Client status updated");
      queryClient.invalidateQueries({ queryKey: ["allClients"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const clients = data?.clients || [];
  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "ALL" ||
      (filter === "ASSIGNED" && c.clientAssignments?.some((a) => a.active)) ||
      (filter === "UNASSIGNED" && !c.clientAssignments?.some((a) => a.active)) ||
      c.status === filter;
    return matchSearch && matchFilter;
  });

  const filters = [
    { key: "ALL", label: "All" },
    { key: "ASSIGNED", label: "Assigned" },
    { key: "UNASSIGNED", label: "Unassigned" },
    { key: "SUSPENDED", label: "Suspended" },
  ];

  return (
    <div className="px-4 pt-6 pb-6 max-w-4xl mx-auto space-y-5 md:pt-8 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} total</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
              filter === key
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              {["Client","Trainer","Plan","Status","Joined","Sessions",""].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((client) => {
                const activeAssignment = client.clientAssignments?.find((a) => a.active);
                const style = STATUS_STYLES[client.status] || STATUS_STYLES.ACTIVE;
                return (
                  <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                          {client.name?.trim()[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {activeAssignment?.trainer?.name || <span className="text-gray-300 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[140px] truncate">
                      {activeAssignment?.workout?.title || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {format(parseISO(client.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setAllowanceClient(client)}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Layers size={13} /> Manage
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus({ id: client.id, status: client.status })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          client.status === "ACTIVE"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {client.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                  No clients found
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
          filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onToggleStatus={(c) => toggleStatus({ id: c.id, status: c.status })}
              onManageAllowance={setAllowanceClient}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No clients found</p>
          </div>
        )}
      </div>

      {/* Allowance modal */}
      {allowanceClient && (
        <AllowanceModal
          client={allowanceClient}
          onClose={() => setAllowanceClient(null)}
        />
      )}
    </div>
  );
}