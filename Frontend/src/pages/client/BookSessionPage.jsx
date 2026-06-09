import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyTrainer, getMyAllowances } from "../../api/clients.api";
import { createBooking } from "../../api/booking.api";
import toast from "react-hot-toast";
import {
  format,
  addDays,
  startOfDay,
  isSameDay,
  parseISO,
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react";

const SESSION_DURATION = 60;

// JS getDay() → 0=Sun,1=Mon,...,6=Sat  mapped to backend enum values

function getDateStr(date) {
  return format(date, "yyyy-MM-dd");
}

function parseDateStr(isoString) {
  // Handles both "2024-12-02" and "2024-12-02T09:00:00.000Z"
  return isoString.slice(0, 10);
}

function generateSlots(availability, exceptions, selectedDate) {
  if (!selectedDate || !availability) return [];
  const dateStr = getDateStr(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  const now = new Date();
  // 1. Check BLOCKED exceptions for this exact date
  const isBlocked = exceptions.some(
    (e) => e.exceptionType === "BLOCKED" && parseDateStr(e.date || e.startTime) === dateStr
  );
  if (isBlocked) return [];

  // 2. Check EXTRA_AVAILABLE exceptions for this date
  const extras = exceptions.filter(
    (e) =>
      e.exceptionType === "EXTRA_AVAILABLE" &&
      parseDateStr(e.date || e.startTime) === dateStr
  );

  // 3. Weekly slots for this day of week
  const weeklySlots = availability.filter((a) => 
    a.dayOfWeek === dayOfWeek);

  // Extras override weekly if they exist
  const sourceSlots = extras.length > 0 ? extras : weeklySlots;
  if (sourceSlots.length === 0) return [];

  const slots = [];

  sourceSlots.forEach((slot) => {
    // startTime/endTime come as "HH:MM" from weekly slots
    // or as full ISO strings from exception slots — handle both
    let startH, startM, endH, endM;

    const rawStart = slot.startTime || "09:00";
    const rawEnd = slot.endTime || "17:00";

    if (rawStart.includes("T")) {
      // ISO string like "2024-12-02T09:00:00.000Z"
      const d = new Date(rawStart);
      startH = d.getHours();
      startM = d.getMinutes();
    } else {
      // "HH:MM"
      [startH, startM] = rawStart.split(":").map(Number);
    }

    if (rawEnd.includes("T")) {
      const d = new Date(rawEnd);
      endH = d.getHours();
      endM = d.getMinutes();
    } else {
      [endH, endM] = rawEnd.split(":").map(Number);
    }

    // Build slot times on the selected date
    let cursor = setMinutes(setHours(startOfDay(selectedDate), startH), startM);
    const slotEnd = setMinutes(setHours(startOfDay(selectedDate), endH), endM);

    while (!isBefore(slotEnd, addMinutes(cursor, SESSION_DURATION))) {
      // Only include future slots (skip past slots on today)
      if (isBefore(now, cursor)) {
        slots.push(new Date(cursor));
      }
      cursor = addMinutes(cursor, SESSION_DURATION);
    }
  });
  return slots;
}

function WeekStrip({ selected, onSelect, availability, exceptions }) {
  const today = startOfDay(new Date());
  const [weekStart, setWeekStart] = useState(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function dayHasSlots(date) {
    if (isBefore(date, today)) return false;
    return generateSlots(availability, exceptions, date).length > 0;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          disabled={!isBefore(today, weekStart)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-gray-700">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
        </p>
        <button
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isPast = isBefore(day, today);
          const isSelected = selected && isSameDay(day, selected);
          const available = !isPast && dayHasSlots(day);

          return (
            <button
              key={day.toISOString()}
              disabled={isPast || !available}
              onClick={() => onSelect(startOfDay(day))}
              className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-gray-900 text-white"
                  : isPast || !available
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <span className="text-[10px] mb-1">
                {["Su","Mo","Tu","We","Th","Fr","Sa"][day.getDay()]}
              </span>
              <span className="text-sm font-semibold">{format(day, "d")}</span>
              {available && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-gray-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookSessionPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booked, setBooked] = useState(false);

  const { data: trainerData, isLoading: trainerLoading } = useQuery({
    queryKey: ["myTrainer"],
    queryFn: getMyTrainer,
  });

  const { data: allowanceData } = useQuery({
    queryKey: ["myAllowances"],
    queryFn: getMyAllowances,
  });

  const availability = trainerData?.trainer.trainerAvailabilities
 || [];
  const exceptions = trainerData?.exceptions || [];
const allowance = allowanceData?.allowances?.[0];
console.log(allowance)
// Unlimited clients are never limit-reached
const limitReached = allowance && !allowance.isUnlimited && allowance.sessionsRemaining <= 0;

  const slots = useMemo(
    () => generateSlots(availability, exceptions, selectedDate),
    [availability, exceptions, selectedDate]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["myAllowances"] });
      setBooked(true);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Booking failed");
    },
  });

const handleBook = () => {
  if (!selectedSlot || !trainerData?.trainer?.id) return;

  mutate({
    trainerId: trainerData.trainer.id, // ✅ FIX
    startTime: selectedSlot.toISOString(),
    endTime: addMinutes(selectedSlot, SESSION_DURATION).toISOString(),
  });
};

  if (booked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Session booked!</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedSlot && format(selectedSlot, "EEEE, MMMM d 'at' h:mm a")}
          </p>
        </div>
        <button
          onClick={() => { setBooked(false); setSelectedDate(null); setSelectedSlot(null); }}
          className="mt-2 text-sm font-medium text-gray-900 underline underline-offset-2"
        >
          Book another
        </button>
      </div>
    );
  }

  if (trainerLoading) {
    return (
      <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto">
        <div className="h-6 w-40 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }


if (!allowanceData?.hasLimit) {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Book a session</h1>
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-2">
        <p className="text-sm font-semibold text-amber-800">
          Session allowance not configured
        </p>
        <p className="text-sm text-amber-700 leading-relaxed">
          Your head trainer hasn't set a session allowance for you yet. Please contact them to get your sessions configured before booking.
        </p>
      </div>
    </div>
  );
}

  if (!trainerData?.trainer) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <p className="text-sm text-gray-400">
          No trainer assigned yet. Ask the head trainer to assign one.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Book a session</h1>
        <p className="text-sm text-gray-400 mt-0.5">with {trainerData.trainer.name}</p>
      </div>

      {limitReached && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-red-700">Session limit reached</p>
          <p className="text-xs text-red-500 mt-0.5">
            You've used all your{" "}
            {allowance.limitType === "WEEKLY" ? "weekly" : "monthly"} sessions.
          </p>
        </div>
      )}

{allowance && !limitReached && (
  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center justify-between">
    <p className="text-xs text-blue-700 font-medium">
      {allowance.isUnlimited
        ? `${allowance.sessionsUsed} sessions completed · no cap`
        : `${allowance.sessionsRemaining} session${allowance.sessionsRemaining !== 1 ? "s" : ""} remaining`}
    </p>
    {!allowance.isUnlimited && (
      <p className="text-xs text-blue-500">
        {allowance.sessionsUsed} of {allowance.maxSessions} used
      </p>
    )}
  </div>
)}

{limitReached && (
  <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
    <p className="text-sm font-medium text-red-700">Session limit reached</p>
    <p className="text-xs text-red-500 mt-0.5">
      You've used all {allowance.maxSessions} sessions in your current pack.
      Contact your head trainer to add more.
    </p>
  </div>
)}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
          Pick a date
        </p>
        <WeekStrip
          selected={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
          availability={availability}
          exceptions={exceptions}
        />
      </div>

      {selectedDate && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            {format(selectedDate, "EEEE, MMMM d")}
          </p>
          {slots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedSlot && +slot === +selectedSlot;
                return (
                  <button
                    key={slot.toISOString()}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-100 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Clock size={12} className={isSelected ? "text-gray-400" : "text-gray-300"} />
                    {format(slot, "h:mm a")}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              No available slots on this day
            </p>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="sticky bottom-24 md:bottom-6">
          <button
            onClick={handleBook}
            disabled={isPending || limitReached}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 text-sm font-semibold shadow-lg disabled:opacity-50 transition-colors hover:bg-gray-700"
          >
            {isPending
              ? "Booking…"
              : `Confirm ${format(selectedSlot, "h:mm a")} on ${format(selectedDate, "MMM d")}`}
          </button>
        </div>
      )}
    </div>
  );
}