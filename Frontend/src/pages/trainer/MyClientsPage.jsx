import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyClients } from "../../api/trainers.api";
import { format, parseISO } from "date-fns";
import { Search, Users, Dumbbell, ChevronDown, Phone, FileText } from "lucide-react";

function ClientCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const { client, workoutPlan, assignedAt } = item;
  const profile = client?.clientProfile;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
          {client?.name?.trim()[0]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{client?.name}</p>
          <p className="text-xs text-gray-400 truncate">{client?.email}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {workoutPlan && (
            <span className="hidden sm:inline text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
              Plan assigned
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Weight</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">
                {profile?.weight ? `${profile.weight} kg` : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Height</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">
                {profile?.height ? `${profile.height} cm` : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Since</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">
                {format(parseISO(assignedAt), "MMM d")}
              </p>
            </div>
          </div>

          {/* Phone */}
          {profile?.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone size={12} className="text-gray-300" />
              {profile.phone}
            </div>
          )}

          {/* Notes */}
          {profile?.notes && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
              {profile.notes}
            </p>
          )}

          {/* Workout plan */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 flex-1 rounded-xl px-3 py-2 ${
                workoutPlan ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <Dumbbell
                size={13}
                className={workoutPlan ? "text-blue-500" : "text-gray-300"}
              />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Workout plan
                </p>
                <p
                  className={`text-xs font-medium mt-0.5 truncate ${
                    workoutPlan ? "text-blue-700" : "text-gray-400"
                  }`}
                >
                  {workoutPlan?.title || "No plan assigned"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyClientsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["myClients"],
    queryFn: getMyClients,
  });

  const clients = data?.clients || [];

  const filtered = clients.filter(
    (item) =>
      item.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.client?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-6 pb-6 max-w-full mx-auto space-y-5 md:pt-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My clients</h1>
        <p className="text-sm text-gray-400 mt-0.5">{clients.length} assigned</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          placeholder="Search clients…"
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
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Height
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Workout plan
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Since
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((item) => {
                const profile = item.client?.clientProfile;
                return (
                  <tr
                    key={item.assignmentId}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                          {item.client?.name?.trim()[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.client?.name}</p>
                          <p className="text-xs text-gray-400">{item.client?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {profile?.phone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {profile?.weight ? `${profile.weight} kg` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {profile?.height ? `${profile.height} cm` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.workoutPlan ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                          <FileText size={12} className="text-blue-400" />
                          {item.workoutPlan.title}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">No plan</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {format(parseISO(item.assignedAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <Users size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No clients found</p>
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
          filtered.map((item) => <ClientCard key={item.assignmentId} item={item} />)
        ) : (
          <div className="text-center py-16">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {search ? "No clients match your search" : "No clients assigned yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}