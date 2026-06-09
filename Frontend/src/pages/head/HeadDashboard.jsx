import { useQuery } from "@tanstack/react-query";
import { getAllClients } from "../../api/head.api";
import { getAllAssignments } from "../../api/head.api";
import { getAllTrainers } from "../../api/trainers.api";
import { getAllBookings } from "../../api/booking.api";
import { format, parseISO, isToday } from "date-fns";
import { Users, UserCheck, GitMerge, CalendarDays, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function StatCard({ icon: Icon, label, value, to, accent }) {
  const content = (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-200 transition-colors">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent || "bg-gray-50"}`}>
        <Icon size={20} className={accent ? "text-white" : "text-gray-500"} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value ?? "—"}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function UnassignedClientRow({ client }) {
  return (
    <Link
      to="/head/clients"
      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
    >
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
        {client.name?.trim()[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
        <p className="text-xs text-gray-400 truncate">{client.email}</p>
      </div>
      <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-lg shrink-0">
        Unassigned
      </span>
    </Link>
  );
}

export default function HeadDashboard() {
  const { user } = useAuth();

  const { data: clientsData } = useQuery({ queryKey: ["allClients"], queryFn: getAllClients });
  const { data: trainersData } = useQuery({ queryKey: ["allTrainers"], queryFn: getAllTrainers });
  const { data: assignmentsData } = useQuery({ queryKey: ["allAssignments"], queryFn: getAllAssignments });
  const { data: bookingsData } = useQuery({ queryKey: ["allBookings"], queryFn: () => getAllBookings({}) });

  const clients = clientsData?.clients || [];
  const trainers = trainersData?.trainers || [];
  const assignments = assignmentsData?.assignments || [];
  const bookings = bookingsData?.bookings || [];

  const activeAssignments = assignments.filter((a) => a.active);
  const unassignedClients = clients.filter(
    (c) => !c.clientAssignments?.some((a) => a.active)
  );
  const todayBookings = bookings.filter(
    (b) => b.status === "BOOKED" && isToday(parseISO(b.startTime))
  );

  return (
    <div className="px-4 pt-6 pb-6 max-w-4xl mx-auto space-y-6 md:pt-8 md:px-8">
      {/* Greeting */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-0.5">
          Hey, {user?.name?.split(" ")[0]} 👋
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total clients" value={clients.length} to="/head/clients" />
        <StatCard icon={UserCheck} label="Trainers" value={trainers.length} to="/head/trainers" />
        <StatCard icon={GitMerge} label="Active assignments" value={activeAssignments.length} to="/head/assignments" />
        <StatCard icon={CalendarDays} label="Sessions today" value={todayBookings.length} to="/head/bookings" />
      </div>

      {/* Two column on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unassigned clients */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Unassigned clients
            </p>
            {unassignedClients.length > 0 && (
              <span className="text-xs font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg">
                {unassignedClients.length}
              </span>
            )}
          </div>
          {unassignedClients.length > 0 ? (
            unassignedClients.slice(0, 5).map((c) => (
              <UnassignedClientRow key={c.id} client={c} />
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">All clients are assigned ✓</p>
            </div>
          )}
        </div>

        {/* Today's sessions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Today's sessions
          </p>
          {todayBookings.length > 0 ? (
            todayBookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-gray-900 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] text-gray-400 leading-none">{format(parseISO(b.startTime), "h:mm")}</span>
                  <span className="text-[9px] font-semibold text-white leading-none">{format(parseISO(b.startTime), "a")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {b.client?.name || "Client"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    with {b.trainer?.name || "Trainer"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">No sessions today</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { to: "/head/assignments", label: "Manage assignments", icon: GitMerge },
          { to: "/head/workout-plans", label: "Workout plans", icon: TrendingUp },
          { to: "/head/bookings", label: "All bookings", icon: CalendarDays },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-gray-200 transition-colors"
          >
            <Icon size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}