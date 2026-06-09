import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, completeBooking, cancelBooking, rescheduleBooking } from "../../api/booking.api";
import { getMyAvailability, getMyExceptions } from "../../api/trainers.api";
import toast from "react-hot-toast";
import { format, parseISO, isPast, isFuture, isToday, addMinutes } from "date-fns";
import {
  Search, History, ChevronDown, Clock,
  CheckCircle, RefreshCw, X, MessageSquare,
} from "lucide-react";

const SESSION_DURATION = 60;
const STATUS_STYLES = {
  BOOKED: { bg: "bg-blue-50", text: "text-blue-700", label: "Booked" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelled" },
  RESCHEDULED: { bg: "bg-amber-50", text: "text-amber-700", label: "Rescheduled" },
};
const FILTERS = ["ALL", "BOOKED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

// ── Reason modal (cancel or reschedule step 1) ──────────────────────────────
function ReasonModal({ title, confirmLabel, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Reason <span className="text-gray-300 font-normal">(optional — visible to client)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Trainer unavailable due to illness…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
          <button
            onClick={() => onConfirm(reason || null)}
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            {isPending ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reschedule modal (step 2 after reason) ──────────────────────────────────
function RescheduleModal({ availability, exceptions, reason, onClose, onConfirm, isPending }) {
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
    const dayOfWeek = date.getDay();
    const dateStr = format(date, "yyyy-MM-dd");
    const blocked = exceptions?.some(
      (e) => e.exceptionType === "BLOCKED" && (e.date || e.startTime || "").slice(0, 10) === dateStr
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Pick new time</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Day</p>
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
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Time</p>
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
            onClick={() => selectedSlot && onConfirm(selectedSlot, reason)}
            disabled={!selectedSlot || isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {isPending ? "Rescheduling…" : "Confirm reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session card (mobile) ───────────────────────────────────────────────────
function SessionCard({ booking, onCancel, onReschedule, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const start = parseISO(booking.startTime);
  const end = parseISO(booking.endTime);
  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.BOOKED;
  const canComplete = booking.status === "BOOKED" && isPast(end);
  const canAct = booking.status === "BOOKED" && isFuture(start);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-gray-400 uppercase leading-none">{format(start, "MMM")}</span>
          <span className="text-sm font-semibold text-gray-900 leading-none">{format(start, "d")}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{booking.client?.name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={10} />
            {format(start, "h:mm a")}
            {isToday(start) && (
              <span className="ml-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">Today</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canComplete && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Action needed</span>
          )}
          <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Date</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{format(start, "EEEE, MMM d")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Time</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{format(start, "h:mm a")} – {format(end, "h:mm a")}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <MessageSquare size={12} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-600">{booking.notes}</p>
            </div>
          )}

          {booking.previous && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2">
              <RefreshCw size={12} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Rescheduled from {format(parseISO(booking.previous.startTime), "MMM d 'at' h:mm a")}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {canComplete && (
              <button
                onClick={() => onComplete(booking.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={14} /> Done
              </button>
            )}
            {canAct && (
              <>
                <button
                  onClick={() => onReschedule(booking)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw size={14} /> Reschedule
                </button>
                <button
                  onClick={() => onCancel(booking)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X size={14} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function SessionHistoryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal state:
  // cancelTarget  = booking object waiting for reason
  // rescheduleTarget = { booking, reason } — reason collected, now pick slot
  const [cancelTarget, setCancelTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const { data } = useQuery({ queryKey: ["myBookings"], queryFn: getMyBookings });
  const { data: availData } = useQuery({ queryKey: ["myAvailability"], queryFn: getMyAvailability });
  const { data: excData } = useQuery({ queryKey: ["myExceptions"], queryFn: getMyExceptions });

  const availability = availData?.availability || [];
  const exceptions = excData?.exceptions || [];

  const { mutate: markComplete } = useMutation({
    mutationFn: completeBooking,
    onSuccess: () => {
      toast.success("Session marked as completed");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: ({ id, notes }) => cancelBooking(id, notes),
    onSuccess: () => {
      toast.success("Session cancelled");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      setCancelTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to cancel"),
  });

  const { mutate: reschedule, isPending: rescheduling } = useMutation({
    mutationFn: ({ id, slot, notes }) =>
      rescheduleBooking(id, {
        startTime: slot.toISOString(),
        endTime: addMinutes(slot, SESSION_DURATION).toISOString(),
        notes,
      }),
    onSuccess: () => {
      toast.success("Session rescheduled");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      setRescheduleTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to reschedule"),
  });

  const bookings = data?.bookings || [];
  const stats = {
    total: bookings.length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    upcoming: bookings.filter((b) => b.status === "BOOKED" && !isPast(parseISO(b.endTime))).length,
    needsAction: bookings.filter((b) => b.status === "BOOKED" && isPast(parseISO(b.endTime))).length,
  };

  const filtered = bookings.filter((b) => {
    const matchFilter = filter === "ALL" || b.status === filter;
    const matchSearch =
      !search ||
      b.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.client?.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl mx-auto space-y-5 md:pt-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Session history</h1>
        <p className="text-sm text-gray-400 mt-0.5">{stats.total} total sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Completed", value: stats.completed, accent: "text-green-600" },
          { label: "Upcoming", value: stats.upcoming, accent: "text-blue-600" },
          { label: "Needs action", value: stats.needsAction, accent: stats.needsAction > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Cancelled", value: bookings.filter((b) => b.status === "CANCELLED").length, accent: "text-gray-400" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
            <p className={`text-xl font-semibold ${accent}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {stats.needsAction > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{stats.needsAction} session{stats.needsAction !== 1 ? "s" : ""}</span> need to be marked complete.
          </p>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          placeholder="Search by client name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
      </div>

      {/* Filter tabs with counts */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {FILTERS.map((f) => {
          const count = f === "ALL" ? bookings.length : bookings.filter((b) => b.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                filter === f ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              {["Date","Time","Client","Status","Notes",""].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((booking) => {
              const start = parseISO(booking.startTime);
              const end = parseISO(booking.endTime);
              const style = STATUS_STYLES[booking.status] || STATUS_STYLES.BOOKED;
              const canComplete = booking.status === "BOOKED" && isPast(end);
              const canAct = booking.status === "BOOKED" && isFuture(start);
              return (
                <tr key={booking.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{format(start, "MMM d, yyyy")}</p>
                    {isToday(start) && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">Today</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{format(start, "h:mm a")} – {format(end, "h:mm a")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                        {booking.client?.name?.trim()[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.client?.name}</p>
                        <p className="text-xs text-gray-400">{booking.client?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[160px] truncate">
                    {booking.notes || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {canComplete && (
                        <button
                          onClick={() => markComplete(booking.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={12} /> Done
                        </button>
                      )}
                      {canAct && (
                        <>
                          <button
                            onClick={() => setRescheduleTarget({ booking, reason: null })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Reschedule"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => setCancelTarget(booking)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <History size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No sessions found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((booking) => (
            <SessionCard
              key={booking.id}
              booking={booking}
              onComplete={markComplete}
              onCancel={setCancelTarget}
              onReschedule={(b) => setRescheduleTarget({ booking: b, reason: null })}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <History size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No sessions found</p>
          </div>
        )}
      </div>

      {/* Cancel — collect reason first */}
      {cancelTarget && (
        <ReasonModal
          title="Cancel session"
          confirmLabel="Confirm cancellation"
          onClose={() => setCancelTarget(null)}
          onConfirm={(reason) => cancel({ id: cancelTarget.id, notes: reason })}
          isPending={cancelling}
        />
      )}

      {/* Reschedule — step 1: reason already set as null, go straight to slot picker */}
      {/* We use a two-step flow: reason modal → slot picker modal */}
      {rescheduleTarget && rescheduleTarget.reason === null && (
        <ReasonModal
          title="Reschedule session"
          confirmLabel="Next — pick new time"
          onClose={() => setRescheduleTarget(null)}
          onConfirm={(reason) => setRescheduleTarget((t) => ({ ...t, reason: reason || "" }))}
          isPending={false}
        />
      )}
      {rescheduleTarget && rescheduleTarget.reason !== null && (
        <RescheduleModal
          availability={availability}
          exceptions={exceptions}
          reason={rescheduleTarget.reason}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={(slot, reason) =>
            reschedule({ id: rescheduleTarget.booking.id, slot, notes: reason })
          }
          isPending={rescheduling}
        />
      )}
    </div>
  );
}