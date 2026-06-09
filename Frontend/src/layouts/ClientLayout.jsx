import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Dumbbell,
  UserCircle,
} from "lucide-react";

import ClientDashboard from "../pages/client/ClientDashboard";
import BookSessionPage from "../pages/client/BookSessionPage";
import MyBookingsPage from "../pages/client/MyBookingsPage";
import WorkoutPlanPage from "../pages/client/WorkoutPlanPage";
import ClientProfilePage from "../pages/client/ClientProfilePage";

const navItems = [
  { to: "/client/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/client/book", icon: CalendarPlus, label: "Book" },
  { to: "/client/bookings", icon: CalendarDays, label: "Sessions" },
  { to: "/client/workout", icon: Dumbbell, label: "Workout" },
  { to: "/client/profile", icon: UserCircle, label: "Profile" },
];

export default function ClientLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page content — bottom padding so content clears the nav bar */}
      <main className="flex-1 pb-20">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="book" element={<BookSessionPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="workout" element={<WorkoutPlanPage />} />
          <Route path="profile" element={<ClientProfilePage />} />
        </Routes>
      </main>

      {/* Bottom navigation — mobile only layout, fixed to viewport bottom */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
        <div className="flex items-stretch h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? "bg-gray-100" : ""
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}