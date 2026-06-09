import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, cancelBooking, rescheduleBooking } from "../../api/booking.api";
import { getMyTrainer } from "../../api/clients.api";
import toast from "react-hot-toast";
import { format, parseISO, isFuture, addMinutes } from "date-fns";
import { Calendar, Clock, X, RefreshCw, ChevronDown, MessageSquare } from "lucide-react";

const SESSION_DURATION = 60;
const STATUS_STYLES = {
  BOOKED: { bg: "bg-blue-50", text: "text-blue-700", label: "Booked" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelled" },
  RESCHEDULED: { bg: "bg-amber-50", text: "text-amber-700", label: "Rescheduled" },
};
const FILTERS = ["All", "Booked", "Completed", "Cancelled"];

function RescheduleModal({ booking, availability, exceptions, onClose, onConfirm, isPending }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const DAYS_OF_WEEK = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(tomorrow);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getSlotsForDay = (date) => {
    const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
    const dateStr = format(date, "yyyy-MM-dd");
    const blocked = exceptions?.some(
      (e) => e.exceptionType === "BLOCKED" &&
        (e.date || e.startTime || "").slice(0, 10) === dateStr
    );
    if (blocked) return [];
    const weeklySlots = availability?.filter((a) => a.dayOfWeek === dayOfWeek) || [];
    const slots = [];
    weeklySlots.forEach((slot) => {
      const [sh, sm] = (slot.startTime || "09:00").split(":").map(Number);
      const [eh, em] = (slot.endTime || "17:00").split(":").map(Number);
      const start = new Date(date); start.setHours(sh, sm, 0, 0);
      const end = new Date(date); end.setHours(eh, em, 0, 0);
      let cursor = new Date(start);
      while (addMinutes(cursor, SESSION_DURATION) <= end) {
        slots.push(new Date(cursor));
        cursor = addMinutes(cursor, SESSION_DURATION);
      }
    });
    return slots;
  };

  const availableDays = days.filter((d) => getSlotsForDay(d).length > 0);
  const [selectedDay, setSelectedDay] = useState(availableDays[0] || null);
  const slots = selectedDay ? getSlotsForDay(selectedDay) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Reschedule session</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Choose a day</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {availableDays.slice(0, 10).map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                    selectedDay && format(day, "yyyy-MM-dd") === format(selectedDay, "yyyy-MM-dd")
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-[10px]">{format(day, "EEE")}</span>
                  <span className="text-sm font-semibold">{format(day, "d")}</span>
                  <span className="text-[10px] text-gray-400">{format(day, "MMM")}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedDay && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Choose a time</p>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot && +slot === +selectedSlot;
                  return (
                    <button
                      key={slot.toISOString()}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-100 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {format(slot, "h:mm a")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={() => selectedSlot && onConfirm(selectedSlot)}
            disabled={!selectedSlot || isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
          >
            {isPending ? "Rescheduling…" : "Confirm reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, onReschedule }) {
  const [expanded, setExpanded] = useState(false);
  const start = parseISO(booking.startTime);
  const canAct = booking.status === "BOOKED" && isFuture(start);
  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.BOOKED;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-4 py-4 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-gray-400 uppercase leading-none">{format(start, "MMM")}</span>
          <span className="text-sm font-semibold text-gray-900 leading-none">{format(start, "d")}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{format(start, "EEEE")}</p>
          <p className="text-xs text-gray-400">{format(start, "h:mm a")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-3">
            <Clock size={12} />
            <span>{format(start, "h:mm a")} – {format(parseISO(booking.endTime), "h:mm a")}</span>
          </div>

          {/* Show reason/notes left by trainer or head trainer */}
          {booking.notes && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <MessageSquare size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">
                  Note from trainer
                </p>
                <p className="text-xs text-amber-800">{booking.notes}</p>
              </div>
            </div>
          )}

          {canAct && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onReschedule(booking)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={14} /> Reschedule
              </button>
              <button
                onClick={() => onCancel(booking.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  const { data: trainerData } = useQuery({
    queryKey: ["myTrainer"],
    queryFn: getMyTrainer,
  });

  const { mutate: cancel } = useMutation({
    mutationFn: (id) => cancelBooking(id),
    onSuccess: () => {
      toast.success("Session cancelled");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["myAllowances"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to cancel"),
  });

  const { mutate: reschedule, isPending: reschedulePending } = useMutation({
    mutationFn: ({ id, slot }) =>
      rescheduleBooking(id, {
        startTime: slot.toISOString(),
        endTime: addMinutes(slot, SESSION_DURATION).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Session rescheduled");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      setRescheduleTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to reschedule"),
  });

  const allBookings = bookingsData?.bookings || [];
  const filtered = filter === "All"
    ? allBookings
    : allBookings.filter((b) => b.status === filter.toUpperCase());

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">My sessions</h1>

      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
              filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={(id) => { if (window.confirm("Cancel this session?")) cancel(id); }}
              onReschedule={setRescheduleTarget}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No {filter.toLowerCase()} sessions</p>
        </div>
      )}

      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          availability={trainerData?.availability || []}
          exceptions={trainerData?.exceptions || []}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={(slot) => reschedule({ id: rescheduleTarget.id, slot })}
          isPending={reschedulePending}
        />
      )}
    </div>
  );
}