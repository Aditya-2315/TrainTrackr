import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllClients } from "../../api/head.api";
import { getTrainerAvailability, getTrainerExceptions } from "../../api/trainers.api";
import { createBooking } from "../../api/booking.api";
import toast from "react-hot-toast";
import {
  format, addDays, startOfDay, isSameDay,
  addMinutes, setHours, setMinutes, isBefore,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SESSION_DURATION = 60;
const JS_DAY_TO_BACKEND = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

function parseDateStr(iso) { return iso.slice(0, 10); }

function generateSlots(availability, exceptions, selectedDate) {
  if (!selectedDate || !availability?.length) return [];
  console.log(availability)
  const dateStr = format(selectedDate, "yyyy-MM-dd");
const dayOfWeek = selectedDate.getDay();
  console.log(dayOfWeek)
  const now = new Date();

  const isBlocked = exceptions.some(
    (e) => e.exceptionType === "BLOCKED" && parseDateStr(e.date || e.startTime) === dateStr
  );
  if (isBlocked) return [];

  const extras = exceptions.filter(
    (e) => e.exceptionType === "EXTRA_AVAILABLE" && parseDateStr(e.date || e.startTime) === dateStr
  );
  const sourceSlots = extras.length > 0 ? extras : availability.filter((a) => a.dayOfWeek === dayOfWeek);
  if (!sourceSlots.length) return [];

  const slots = [];
  sourceSlots.forEach((slot) => {
    const rawStart = slot.startTime || "09:00";
    const rawEnd = slot.endTime || "17:00";
    let startH, startM, endH, endM;
    if (rawStart.includes("T")) {
      const d = new Date(rawStart); startH = d.getHours(); startM = d.getMinutes();
    } else { [startH, startM] = rawStart.split(":").map(Number); }
    if (rawEnd.includes("T")) {
      const d = new Date(rawEnd); endH = d.getHours(); endM = d.getMinutes();
    } else { [endH, endM] = rawEnd.split(":").map(Number); }

    let cursor = setMinutes(setHours(startOfDay(selectedDate), startH), startM);
    const slotEnd = setMinutes(setHours(startOfDay(selectedDate), endH), endM);
    while (!isBefore(slotEnd, addMinutes(cursor, SESSION_DURATION))) {
      if (isBefore(now, cursor)) slots.push(new Date(cursor));
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
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-gray-700">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
        </p>
        <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
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
                isSelected ? "bg-gray-900 text-white"
                  : isPast || !available ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-[10px] mb-1">{["Su","Mo","Tu","We","Th","Fr","Sa"][day.getDay()]}</span>
              <span className="text-sm font-semibold">{format(day, "d")}</span>
              {available && !isSelected && <span className="w-1 h-1 rounded-full bg-gray-400 mt-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HeadBookSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booked, setBooked] = useState(false);

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["allClients"],
    queryFn: getAllClients,
  });

  // Only fetch availability once a client with an active assignment is selected
  const activeAssignment = selectedClient?.clientAssignments?.find((a) => a.active);
  const trainerId = activeAssignment?.trainerId;

  const { data: availData } = useQuery({
    queryKey: ["trainerAvailability", trainerId],
    queryFn: () => getTrainerAvailability(trainerId),
    enabled: !!trainerId,
  });

  const { data: excData } = useQuery({
    queryKey: ["trainerExceptions", trainerId],
    queryFn: () => getTrainerExceptions(trainerId),
    enabled: !!trainerId,
  });

  const availability = availData?.availability || [];
  const exceptions = excData?.exceptions || [];

  const slots = useMemo(
    () => generateSlots(availability, exceptions, selectedDate),
    [availability, exceptions, selectedDate]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
      setBooked(true);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Booking failed"),
  });

  const handleBook = () => {
    if (!selectedSlot || !selectedClient) return;
    mutate({
      clientId: selectedClient.id,
      startTime: selectedSlot.toISOString(),
      endTime: addMinutes(selectedSlot, SESSION_DURATION).toISOString(),
    });
  };

  const clients = clientsData?.clients || [];
  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // ── Success screen ──
  if (booked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Session booked!</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedClient?.name} — {selectedSlot && format(selectedSlot, "EEEE, MMMM d 'at' h:mm a")}
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setBooked(false); setSelectedClient(null); setSelectedDate(null); setSelectedSlot(null); setClientSearch(""); }}
            className="text-sm font-medium text-gray-900 underline underline-offset-2"
          >
            Book another
          </button>
          <button
            onClick={() => navigate("/head/bookings")}
            className="text-sm font-medium text-gray-500 underline underline-offset-2"
          >
            View all bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto space-y-6 md:pt-8 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Book a session</h1>
        <p className="text-sm text-gray-400 mt-0.5">Book on behalf of a client</p>
      </div>

      {/* Step 1 — Select client */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          1. Select client
        </p>

        {selectedClient ? (
          <div className="bg-white border border-gray-900 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
              {selectedClient.name?.trim()[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{selectedClient.name}</p>
              <p className="text-xs text-gray-400 truncate">{selectedClient.email}</p>
              {activeAssignment ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  Trainer: {activeAssignment.trainer?.name}
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-0.5">No active trainer assigned</p>
              )}
            </div>
            <button
              onClick={() => { setSelectedClient(null); setSelectedDate(null); setSelectedSlot(null); }}
              className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search clients…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {clientsLoading ? (
                <div className="p-4 space-y-2">
                  {[0,1,2].map((i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const assignment = client.clientAssignments?.find((a) => a.active);
                  return (
                    <button
                      key={client.id}
                      onClick={() => { setSelectedClient(client); setSelectedDate(null); setSelectedSlot(null); }}
                      disabled={!assignment}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                        {client.name?.trim()[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {assignment ? `Trainer: ${assignment.trainer?.name}` : "No trainer assigned"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">No clients found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Pick date (only if client has trainer) */}
      {selectedClient && activeAssignment && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            2. Pick a date
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <WeekStrip
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
              availability={availability}
              exceptions={exceptions}
            />
          </div>
        </div>
      )}

      {/* Step 3 — Pick time */}
      {selectedDate && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            3. Pick a time
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-3">{format(selectedDate, "EEEE, MMMM d")}</p>
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
              <p className="text-sm text-gray-400 text-center py-4">No available slots on this day</p>
            )}
          </div>
        </div>
      )}

      {/* Confirm */}
      {selectedSlot && (
        <div className="sticky bottom-6">
          <button
            onClick={handleBook}
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 text-sm font-semibold shadow-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            {isPending
              ? "Booking…"
              : `Book ${selectedClient?.name} — ${format(selectedSlot, "h:mm a")} on ${format(selectedDate, "MMM d")}`}
          </button>
        </div>
      )}
    </div>
  );
}