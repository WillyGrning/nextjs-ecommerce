// lib/withAdminAuth.tsx
import UnauthorizedView from "@/pages/admin/views/unauthorized";
import { useSession } from "next-auth/react";
import { ComponentType } from "react";

export function withAdminAuth<T extends object>(Component: ComponentType<T>) {
  return function ProtectedRoute(props: T) {
    const { data: session, status } = useSession();

    if (status === "loading") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      );
    }

    if (!session || session.user?.role !== "admin") {
      return (
        <UnauthorizedView
          email={session?.user?.email ?? undefined}
          role={session?.user?.role ?? undefined}
        />
      );
    }

    return <Component {...props} />;
  };
}
