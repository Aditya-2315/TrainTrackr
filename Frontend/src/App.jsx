import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import TrainerRegisterPage from "./pages/auth/TrainerRegisterPage";

// Lazy-load role pages (add as you build them)
import ClientLayout from "./layouts/ClientLayout";
import TrainerLayout from "./layouts/TrainerLayout";
import HeadLayout from "./layouts/HeadLayout";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 2 } },
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
      </AuthProvider>
    </QueryClientProvider>
  );
}