import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAvailability,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
  getMyExceptions,
  addException,
  deleteException,
} from "../../api/trainers.api";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";

const DAYS = {
  "MONDAY":1, "TUESDAY":2, "WEDNESDAY":3,
  "THURSDAY":4, "FRIDAY":5, "SATURDAY":6, "SUNDAY":0,
};
const DAY_LABELS = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};
const EXCEPTION_TYPES = ["BLOCKED", "EXTRA_AVAILABLE"];

function TimeInput({ label, name, value, onChange }) {
  return (
    <div className="flex-1">
      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type="time"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  );
}

function AddSlotForm({ onAdd, isPending }) {
  const [form, setForm] = useState({
    dayOfWeek: "MONDAY",
    startTime: "05:00",
    endTime: "22:00",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

const handleSubmit = () => {
  if (form.startTime >= form.endTime) {
    toast.error("End time must be after start time");
    return;
  }

  onAdd({
    ...form,
    dayOfWeek: DAYS[form.dayOfWeek], // ✅ convert to number
  });
};
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Add recurring slot
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.keys(DAYS).map((d) => (
          <button
            key={d}
            onClick={() => setForm((f) => ({ ...f, dayOfWeek: d }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
              form.dayOfWeek === d
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <TimeInput label="From" name="startTime" value={form.startTime} onChange={handleChange} />
        <TimeInput label="To" name="endTime" value={form.endTime} onChange={handleChange} />
      </div>
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-colors hover:bg-gray-700"
      >
        {isPending ? "Adding…" : "Add slot"}
      </button>
    </div>
  );
}

function AddExceptionForm({ onAdd, isPending }) {
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    exceptionType: "BLOCKED",
    startTime: "09:00",
    endTime: "17:00",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    const payload =
      {
            date: form.date,
            type: form.exceptionType,
            startTime: `${form.date}T${form.startTime}:00`,
            endTime: `${form.date}T${form.endTime}:00`,
          };
    onAdd(payload);
    console.log(payload)
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Add exception
      </p>

      <div>
        <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={form.date}
          min={format(new Date(), "yyyy-MM-dd")}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="flex gap-2">
        {EXCEPTION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setForm((f) => ({ ...f, exceptionType: t }))}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
              form.exceptionType === t
                ? t === "BLOCKED"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-green-600 text-white border-green-600"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {t === "BLOCKED" ? "Block day" : "Extra available"}
          </button>
        ))}
      </div>

      {form.exceptionType === "EXTRA_AVAILABLE" && (
        <div className="flex gap-3">
          <TimeInput label="From" name="startTime" value={form.startTime} onChange={handleChange} />
          <TimeInput label="To" name="endTime" value={form.endTime} onChange={handleChange} />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-colors hover:bg-gray-700"
      >
        {isPending ? "Saving…" : "Save exception"}
      </button>
    </div>
  );
}

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("weekly");

  const { data: availData, isLoading: availLoading } = useQuery({
    queryKey: ["myAvailability"],
    queryFn: getMyAvailability,
  });
  console.log(availData)

  const { data: excData, isLoading: excLoading } = useQuery({
    queryKey: ["myExceptions"],
    queryFn: getMyExceptions,
  });

  const { mutate: addSlot, isPending: addingSlot } = useMutation({
    mutationFn: addAvailabilitySlot,
    onSuccess: () => {
      toast.success("Slot added");
      queryClient.invalidateQueries({ queryKey: ["myAvailability"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add slot"),
  });

  const { mutate: removeSlot } = useMutation({
    mutationFn: deleteAvailabilitySlot,
    onSuccess: () => {
      toast.success("Slot removed");
      queryClient.invalidateQueries({ queryKey: ["myAvailability"] });
    },
    onError: () => toast.error("Failed to remove slot"),
  });

  const { mutate: addExc, isPending: addingExc } = useMutation({
    mutationFn: addException,
    onSuccess: () => {
      toast.success("Exception saved");
      queryClient.invalidateQueries({ queryKey: ["myExceptions"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const { mutate: removeExc } = useMutation({
    mutationFn: deleteException,
    onSuccess: () => {
      toast.success("Exception removed");
      queryClient.invalidateQueries({ queryKey: ["myExceptions"] });
    },
    onError: () => toast.error("Failed to remove exception"),
  });

  const slots = availData?.availability || [];
  const exceptions = excData?.exceptions || [];

  // Group weekly slots by day
  const byDay = Object.keys(DAYS).reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.dayOfWeek === DAYS[day]);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6 pb-4 max-w-full mx-auto space-y-5 md:pt-8">
      <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {["weekly", "exceptions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "weekly" && (
        <div className="space-y-4">
          <AddSlotForm onAdd={addSlot} isPending={addingSlot} />

          {availLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.keys(DAYS).map((day) =>
                byDay[day].length > 0 ? (
                  <div key={day} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </p>
                    </div>
                    {byDay[day].map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex-1 flex items-center gap-1.5 text-sm text-gray-700">
                          {/* <Clock size={14} className="text-gray-300" /> */}
                          {slot.startTime} – {slot.endTime}
                        </div>
                        <button
                          onClick={() => removeSlot(slot.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null
              )}
              {slots.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  No recurring slots yet. Add one above.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "exceptions" && (
        <div className="space-y-4">
          <AddExceptionForm onAdd={addExc} isPending={addingExc} />

          {excLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : exceptions.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {exceptions.map((exc) => {
                const isBlocked = exc.exceptionType === "BLOCKED";
                return (
                  <div
                    key={exc.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isBlocked ? "bg-red-400" : "bg-green-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {format(
                          parseISO(exc.date || exc.startTime),
                          "EEEE, MMMM d"
                        )}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          isBlocked ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {isBlocked
                          ? "Blocked"
                          : `Extra available ${exc.startTime ? `${exc.startTime.slice(11, 16)} – ${exc.endTime?.slice(11, 16)}` : ""}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeExc(exc.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No exceptions set.
            </p>
          )}
        </div>
      )}
    </div>
  );
}