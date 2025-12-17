// pages/admin/views/unauthorized.tsx
import { AlertCircle, Shield } from "lucide-react";

interface UnauthorizedViewProps {
  email?: string;
  role?: string;
}

export default function UnauthorizedView({ email, role }: UnauthorizedViewProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Shield className="w-14 h-14 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          This area is restricted to administrators only.
        </p>

        <div className="bg-red-50 p-4 rounded-lg mb-6 text-sm text-left">
          <p><strong>Email:</strong> {email ?? "Not logged in"}</p>
          <p><strong>Role:</strong> {role ?? "guest"}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 px-4 py-3 bg-gray-100 cursor-pointer rounded-xl"
          >
            Home
          </button>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="flex-1 px-4 py-3 bg-red-500 cursor-pointer text-white rounded-xl"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
