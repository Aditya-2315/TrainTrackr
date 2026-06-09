import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, completeBooking } from "../../api/booking.api";
import toast from "react-hot-toast";
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
  isPast,
  isFuture,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from "lucide-react";

const STATUS_STYLES = {
  BOOKED: "border-l-blue-400 bg-blue-50",
  COMPLETED: "border-l-green-400 bg-green-50",
  CANCELLED: "border-l-gray-200 bg-gray-50 opacity-50",
  RESCHEDULED: "border-l-amber-400 bg-amber-50",
};

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDay, setSelectedDay] = useState(new Date());
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
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const bookings = bookingsData?.bookings || [];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));


  const dayBookings = bookings
    .filter((b) => isSameDay(parseISO(b.startTime), selectedDay))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const hasBookings = (day) =>
    bookings.some(
      (b) => isSameDay(parseISO(b.startTime), day) && b.status === "BOOKED"
    );

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto space-y-5 md:pt-8">
      <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>

      {/* Week navigation */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-medium text-gray-700">
            {format(weekStart, "MMM d")} –{" "}
            {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </p>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const today = isToday(day);
            const hasSessions = hasBookings(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-gray-900 text-white"
                    : today
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="text-[10px] mb-1">
                  {format(day, "EEE").charAt(0)}
                </span>
                <span className="text-sm font-semibold">{format(day, "d")}</span>
                {hasSessions && (
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${
                      isSelected ? "bg-white" : "bg-gray-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day sessions */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          {isToday(selectedDay)
            ? "Today"
            : format(selectedDay, "EEEE, MMMM d")}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : dayBookings.length > 0 ? (
          <div className="space-y-3">
            {dayBookings.map((session) => {
              const start = parseISO(session.startTime);
              const end = parseISO(session.endTime);
              const canComplete =
                session.status === "BOOKED" && isPast(end);
              const style = STATUS_STYLES[session.status] || STATUS_STYLES.BOOKED;

              return (
                <div
                  key={session.id}
                  className={`bg-white border border-gray-100 border-l-4 rounded-2xl p-4 flex items-center gap-4 ${style}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.client?.name || "Client"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {format(start, "h:mm a")} – {format(end, "h:mm a")}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md mt-1.5 ${
                        session.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : session.status === "BOOKED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  {canComplete && (
                    <button
                      onClick={() => markComplete(session.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors shrink-0"
                    >
                      <CheckCircle size={14} />
                      Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            {/* <CalendarDays size={28} className="text-gray-200 mx-auto mb-2" /> */}
            <p className="text-sm text-gray-400">No sessions this day</p>
          </div>
        )}
      </div>
    </div>
  );
}