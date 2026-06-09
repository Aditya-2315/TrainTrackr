import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { login as loginApi } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data.token, data.user);
      const map = {
        CLIENT: "/client/dashboard",
        TRAINER: "/trainer/dashboard",
        HEAD_TRAINER: "/head/dashboard",
      };
      navigate(map[data.user.role] || "/");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Login failed");
    },
  });

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to your TrainTrackr account</p>

        <form onSubmit={handleSubmit(mutate)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-gray-900 ${
                errors.email ? "border-red-400" : "border-gray-200"
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

         <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Password
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"} // 🔥 toggle here
      autoComplete="current-password"
      className={`w-full rounded-xl border px-4 py-3 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-gray-900 ${
        errors.password ? "border-red-400" : "border-gray-200"
      }`}
      {...register("password")}
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>

  {errors.password && (
    <p className="text-xs text-red-500 mt-1">
      {errors.password.message}
    </p>
  )}
</div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium transition hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          New client?{" "}
          <Link to="/register" className="text-gray-900 font-medium underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}