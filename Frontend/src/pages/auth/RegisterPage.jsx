import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { register as registerApi } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate("/client/dashboard");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Registration failed");
    },
  });

  const onSubmit = ({ confirmPassword, ...rest }) => mutate(rest);

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-8">Join TrainTrackr as a client</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {[
            { name: "name", label: "Full name", type: "text", autoComplete: "name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
            { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
          ].map(({ name, label, type, autoComplete }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                autoComplete={autoComplete}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-gray-900 ${
                  errors[name] ? "border-red-400" : "border-gray-200"
                }`}
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-xs text-red-500 mt-1">{errors[name].message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium transition hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gray-900 font-medium underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}