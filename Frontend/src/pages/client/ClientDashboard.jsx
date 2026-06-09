import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMyTrainer } from "../../api/clients.api";
import { getMyAllowances } from "../../api/clients.api";
import { getMyBookings } from "../../api/booking.api";
import { Fragment } from "react";
import { CalendarDays, Dumbbell, TrendingUp, Clock, ChevronRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isPast, isFuture, parseISO } from "date-fns";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 border border-gray-100">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-2xl font-semibold ${accent || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function BookingRow({ booking }) {
  const start = parseISO(booking.startTime);
  const statusColors = {
    BOOKED: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    RESCHEDULED: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center shrink-0">
        <span className="text-[10px] font-medium text-gray-400 uppercase leading-none">
          {format(start, "MMM")}
        </span>
        <span className="text-sm font-semibold text-gray-900 leading-none">
          {format(start, "d")}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {format(start, "EEEE")}
        </p>
        <p className="text-xs text-gray-400">{format(start, "h:mm a")}</p>
      </div>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${
          statusColors[booking.status]
        }`}
      >
        {booking.status}
      </span>
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: trainerData, isLoading: trainerLoading } = useQuery({
    queryKey: ["myTrainer"],
    queryFn: getMyTrainer,
  });

  const { data: allowanceData, isLoading: allowanceLoading } = useQuery({
    queryKey: ["myAllowances"],
    queryFn: getMyAllowances,
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  const bookings = bookingsData?.bookings || [];
  const upcoming = bookings
    .filter((b) => b.status === "BOOKED" && isFuture(parseISO(b.startTime)))
    .slice(0, 3);
  const recent = bookings
    .filter((b) => isPast(parseISO(b.startTime)))
    .slice(0, 3);

  const allowance = allowanceData?.allowances?.[0];
  const sessionStats = allowanceData?.stats;

  const trainer = trainerData?.trainer;
  const trainerProfile = trainerData?.trainerProfile;

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-0.5">
          Hey, {user?.name?.split(" ")[0]} 👋
        </h1>
      </div>

      {/* Trainer card */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Your trainer
        </p>
        {trainerLoading ? (
          <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ) : trainer ? (
          <Link
            to="/client/trainer"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 active:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white font-semibold text-lg shrink-0">
              {trainer.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{trainer.name}</p>
              {trainerProfile?.specialization && (
                <p className="text-xs text-gray-400 truncate">
                  {trainerProfile.specialization}
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </Link>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-sm text-gray-400">No trainer assigned yet</p>
          </div>
        )}
      </div>

     {/* Session stats */}
<div>
  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
    Sessions
  </p>
  {allowanceLoading ? (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  ) : !allowanceData?.hasLimit ? (
    // No allowance set yet
    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sm">⚠️</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800">No session allowance set</p>
        <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
          Your trainer hasn't set a session allowance yet. You won't be able to book sessions until this is configured.
        </p>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">

{allowanceData.allowances?.map((allowance) => (
  <Fragment key={allowance.id}>
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-xs text-gray-400 font-medium">Sessions used</p>
      <p className="text-2xl font-semibold text-gray-900 mt-0.5">
        {allowance.sessionsUsed}
        {!allowance.isUnlimited && (
          <span className="text-gray-400"> / {allowance.maxSessions}</span>
        )}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {allowance.isUnlimited ? "Unlimited pack" : `${allowance.limitType.charAt(0) + allowance.limitType.slice(1).toLowerCase()} pack`}
      </p>
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-xs text-gray-400 font-medium">Remaining</p>
      <p className="text-2xl font-semibold mt-0.5 text-gray-900">
        {allowance.isUnlimited ? "∞" : allowance.sessionsRemaining}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {allowance.isUnlimited ? "no cap set" : "sessions left"}
      </p>
    </div>
  </Fragment>
))}
    </div>
  )}
</div>

      {/* Quick book CTA */}
      {trainer && (
        <Link
          to="/client/book"
          className="flex items-center justify-between bg-gray-900 text-white rounded-2xl px-5 py-4 active:bg-gray-700 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold">Book a session</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Check your trainer's availability
            </p>
          </div>
          <CalendarDays size={20} className="text-gray-400 shrink-0" />
        </Link>
      )}

      {/* Upcoming sessions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Upcoming
          </p>
          <Link to="/client/bookings" className="text-xs text-gray-900 font-medium">
            See all
          </Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          {bookingsLoading ? (
            <div className="py-4 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcoming.length > 0 ? (
            upcoming.map((b) => <BookingRow key={b.id} booking={b} />)
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">No upcoming sessions</p>
              {trainer && (
                <Link
                  to="/client/book"
                  className="text-xs text-gray-900 font-medium mt-1 inline-block underline underline-offset-2"
                >
                  Book one now
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Recent
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl px-4">
            {recent.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}