import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllBookings } from "../../api/booking.api";
import { format, parseISO, isToday } from "date-fns";
import { Search, CalendarDays, ChevronDown } from "lucide-react";

const STATUS_STYLES = {
  BOOKED: { bg: "bg-blue-50", text: "text-blue-700", label: "Booked" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelled" },
  RESCHEDULED: { bg: "bg-amber-50", text: "text-amber-700", label: "Rescheduled" },
};

const FILTERS = ["ALL", "BOOKED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

function BookingRow({ booking }) {
  const [expanded, setExpanded] = useState(false);
  const start = parseISO(booking.startTime);
  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.BOOKED;

  return (
    <>
      {/* Mobile card */}
      <div className="md:hidden bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left"
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
              {booking.client?.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {format(start, "h:mm a")} · {booking.trainer?.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
              {style.label}
            </span>
            <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>
        {expanded && (
          <div className="border-t border-gray-50 px-4 pb-4 pt-3 grid grid-cols-2 gap-2">
            {[
              { label: "Date", value: format(start, "EEEE, MMM d") },
              { label: "Time", value: `${format(start, "h:mm a")} – ${format(parseISO(booking.endTime), "h:mm a")}` },
              { label: "Client", value: booking.client?.name },
              { label: "Trainer", value: booking.trainer?.name },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop row */}
      <tr className="hidden md:table-row border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
        <td className="px-5 py-3.5">
          <div>
            <p className="font-medium text-gray-900">{format(start, "MMM d, yyyy")}</p>
            <p className="text-xs text-gray-400">{format(start, "EEEE")}</p>
          </div>
        </td>
        <td className="px-5 py-3.5 text-gray-600 text-sm">
          {format(start, "h:mm a")} – {format(parseISO(booking.endTime), "h:mm a")}
        </td>
        <td className="px-5 py-3.5">
          <p className="text-sm font-medium text-gray-900">{booking.client?.name}</p>
          <p className="text-xs text-gray-400">{booking.client?.email}</p>
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{booking.trainer?.name}</td>
        <td className="px-5 py-3.5">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </td>
      </tr>
    </>
  );
}

export default function AllBookingsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["allBookings", statusFilter],
    queryFn: () =>
      getAllBookings(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  });

  const bookings = data?.bookings || [];

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.client?.name?.toLowerCase().includes(q) ||
      b.trainer?.name?.toLowerCase().includes(q) ||
      b.client?.email?.toLowerCase().includes(q)
    );
  });

  const todayCount = bookings.filter(
    (b) => b.status === "BOOKED" && isToday(parseISO(b.startTime))
  ).length;

  return (
    <div className="px-4 pt-6 pb-6 max-w-4xl mx-auto space-y-5 md:pt-8 md:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {todayCount > 0 && `${todayCount} session${todayCount !== 1 ? "s" : ""} today · `}
            {filtered.length} total
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          placeholder="Search by client or trainer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors capitalize ${
              statusFilter === f
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((b) => <BookingRow key={b.id} booking={b} />)
        ) : (
          <div className="text-center py-16">
            <CalendarDays size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No bookings found</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Trainer</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((b) => <BookingRow key={b.id} booking={b} />)
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <CalendarDays size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No bookings found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}