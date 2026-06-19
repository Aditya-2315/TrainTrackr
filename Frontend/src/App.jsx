import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { usePwaUpdate } from "./hooks/sw";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import TrainerRegisterPage from "./pages/auth/TrainerRegisterPage";
import InstallPrompt from "./components/shared/InstallPrompt";

// Lazy-load role pages (add as you build them)
import ClientLayout from "./layouts/ClientLayout";
import TrainerLayout from "./layouts/TrainerLayout";
import HeadLayout from "./layouts/HeadLayout";
import OfflineBanner from "./components/shared/Offlinebanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry when offline — serve cache immediately
        if (!navigator.onLine) return false;
        // Otherwise retry once
        return failureCount < 1;
      },
      staleTime: 1000 * 60 * 2,          // 2 minutes
      gcTime: 1000 * 60 * 60 * 24,       // keep cache for 24 hours
      networkMode: "offlineFirst",        // serve cache without waiting for network
    },
    mutations: {
      networkMode: "online",              // mutations only when online
    },
  },
});

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map = {
    CLIENT: "/client/dashboard",
    TRAINER: "/trainer/dashboard",
    HEAD_TRAINER: "/head/dashboard",
  };
  return <Navigate to={map[user.role] || "/login"} replace />;
}

export default function App() {
  usePwaUpdate()
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/trainer/register" element={<TrainerRegisterPage />} />

            {/* Role redirect at root */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Client */}
            <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
              <Route path="/client/*" element={<ClientLayout />} />
            </Route>

            {/* Trainer */}
            <Route element={<ProtectedRoute allowedRoles={["TRAINER", "HEAD_TRAINER"]} />}>
              <Route path="/trainer/*" element={<TrainerLayout />} />
            </Route>

            {/* Head trainer */}
            <Route element={<ProtectedRoute allowedRoles={["HEAD_TRAINER"]} />}>
              <Route path="/head/*" element={<HeadLayout />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
        <OfflineBanner/>
        <InstallPrompt/>
      </AuthProvider>
    </QueryClientProvider>
  );
}