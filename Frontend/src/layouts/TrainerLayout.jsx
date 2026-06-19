import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCog,
  Users,
  History,
  UserCircle,
  Menu,
  X,
} from "lucide-react";

import TrainerDashboard from "../pages/trainer/TrainerDashboard";
import SchedulePage from "../pages/trainer/SchedulePage";
import AvailabilityPage from "../pages/trainer/AvailabilityPage";
import MyClientsPage from "../pages/trainer/MyClientsPage";
import SessionHistoryPage from "../pages/trainer/SessionHistoryPage";
import TrainerProfilePage from "../pages/trainer/TrainerProfilePage";
import { useAuth } from "../context/AuthContext";
import OfflineAwareLayout from "../components/shared/OfflineAwareLayout";

const navItems = [
  { to: "/trainer/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/trainer/schedule", icon: CalendarDays, label: "Schedule" },
  { to: "/trainer/availability", icon: CalendarCog, label: "Availability" },
  { to: "/trainer/clients", icon: Users, label: "Clients" },
  { to: "/trainer/history", icon: History, label: "History" },
  { to: "/trainer/profile", icon: UserCircle, label: "Profile" },
];

// Bottom nav shows only 5 items on mobile — profile lives in the sidebar
const mobileNavItems = navItems.slice(0, 5);

function SidebarLink({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function TrainerLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-100 z-40">
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
            TrainTrackr
          </p>
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-400">Trainer</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-400">Trainer</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-900">TrainTrackr</span>
          <div className="w-9" /> {/* spacer to center title */}
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <OfflineAwareLayout>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TrainerDashboard />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="clients" element={<MyClientsPage />} />
            <Route path="history" element={<SessionHistoryPage />} />
            <Route path="profile" element={<TrainerProfilePage />} />
          </Routes>
          </OfflineAwareLayout>
        </main>
      </div>

{/* ── Mobile bottom nav ── */}
{!sidebarOpen && (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100">
    <div className="flex items-stretch h-16">
      {mobileNavItems.map(({ to, icon: Icon, label }) => (
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
)}
    </div>
  );
}