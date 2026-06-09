import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GitMerge,
  Dumbbell,
  CalendarDays,
  CalendarPlus,
  Menu,
  X,
  ChevronRight,
  CalendarCog
} from "lucide-react";

import HeadDashboard from "../pages/head/HeadDashboard";
import TrainerPage from "../pages/head/TrainerPage";
import ClientPage from "../pages/head/ClientPage";
import AssignmentsPage from "../pages/head/AssignmentsPage";
import WorkoutPlan from "../pages/head/WorkoutPlan";
import AllBookingsPage from "../pages/head/AllBookingsPage";
import AvailabilityPage from "../pages/trainer/AvailabilityPage";
import SchedulePage from "../pages/trainer/SchedulePage";
import HeadBookSessionPage from "../pages/head/HeadBookSessionPage";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/head/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/head/trainers", icon: UserCheck, label: "Trainers" },
  { to: "/head/clients", icon: Users, label: "Clients" },
  { to: "/head/assignments", icon: GitMerge, label: "Assignments" },
  { to: "/head/workout-plans", icon: Dumbbell, label: "Workout Plans" },
  { to: "/head/bookings", icon: CalendarDays, label: "All Bookings" },
  { to: "/head/availability", icon: CalendarCog, label: "Availability" },
  { to: "/head/schedule", icon: CalendarDays, label: "Schedule" },
  { to: "/head/book", icon: CalendarPlus, label: "Book Session" },

];

function SidebarLink({ to, icon: Icon, label, onClick, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group relative ${
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${collapsed ? "justify-center" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
          {!collapsed && <span>{label}</span>}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function HeadLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-100 z-40 transition-all duration-300 ${
          collapsed ? "md:w-16" : "md:w-64"
        }`}
      >
        <div
          className={`flex items-center border-b border-gray-100 h-14 px-3 ${
            collapsed ? "justify-center" : "justify-between px-6"
          }`}
        >
          {!collapsed && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                TrainTrackr
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">
                {user?.name}
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
          >
            <ChevronRight
              size={16}
              className={`transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              collapsed ? "flex justify-center" : "text-left"
            }`}
          >
            {collapsed ? "→" : "Sign out"}
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
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Head Trainer
            </p>
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
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
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-900">TrainTrackr</span>
          <div className="w-9" />
        </header>

        <main className="flex-1">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HeadDashboard />} />
            <Route path="trainers" element={<TrainerPage />} />
            <Route path="clients" element={<ClientPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="workout-plans" element={<WorkoutPlan />} />
            <Route path="bookings" element={<AllBookingsPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="book" element={<HeadBookSessionPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}