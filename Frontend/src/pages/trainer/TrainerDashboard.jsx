import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMyClients } from "../../api/trainers.api";
import { getMyBookings, completeBooking } from "../../api/booking.api";
import toast from "react-hot-toast";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { Users, CheckCircle, CalendarDays, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-gray-500" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clientsData } = useQuery({
    queryKey: ["myClients"],
    queryFn: getMyClients,
  });

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  const { mutate: markComplete } = useMutation({
    mutationFn: completeBooking,
    onSuccess: () => {
      toast.success("Session marked complete");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to complete"),
  });

  const bookings = bookingsData?.bookings || [];
  const todaySessions = bookings.filter(
    (b) => b.status === "BOOKED" && isToday(parseISO(b.startTime))
  );
  const upcoming = bookings
    .filter((b) => b.status === "BOOKED" && isFuture(parseISO(b.startTime)) && !isToday(parseISO(b.startTime)))
    .slice(0, 3);
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const clients = clientsData?.clients || [];

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto space-y-6 md:pt-8">
      {/* Greeting */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-0.5">
          Hey, {user?.name?.split(" ")[0]} 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Users} label="Active clients" value={clients.length} />
        <StatCard icon={CalendarDays} label="Today's sessions" value={todaySessions.length} />
        <StatCard icon={CheckCircle} label="Completed total" value={completedCount} />
      </div>

      {/* Today's sessions */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Today
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : todaySessions.length > 0 ? (
          <div className="space-y-3">
            {todaySessions.map((session) => {
              const start = parseISO(session.startTime);
              const hasPassed = isPast(parseISO(session.endTime));
              return (
                <div
                  key={session.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-900 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-gray-400 leading-none">
                      {format(start, "h:mm")}
                    </span>
                    <span className="text-xs font-semibold text-white leading-none">
                      {format(start, "a")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.client?.name || "Client"}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {format(start, "h:mm a")} – {format(parseISO(session.endTime), "h:mm a")}
                    </p>
                  </div>
                  {hasPassed ? (
                    <button
                      onClick={() => markComplete(session.id)}
                      className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
                    >
                      Mark done
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Upcoming</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400">No sessions today</p>
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Coming up
          </p>
          <div className="space-y-3">
            {upcoming.map((session) => {
              const start = parseISO(session.startTime);
              return (
                <div
                  key={session.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-gray-400 uppercase leading-none">
                      {format(start, "MMM")}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 leading-none">
                      {format(start, "d")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.client?.name || "Client"}
                    </p>
                    <p className="text-xs text-gray-400">{format(start, "EEEE, h:mm a")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}