import DashboardView from "./views/DashboardView";
import UnauthorizedView from "./views/unauthorized";
import { adminGuard } from "@/lib/auth/adminGuard";
import type { Session } from "next-auth";

interface AdminPageProps {
  unauthorized: boolean;
  user?: {
    email?: string | null;
    role?: string;
  };
  session?: Session | null;
}

export const getServerSideProps = adminGuard;

export default function AdminDashboard(props: AdminPageProps) {
  if (props.unauthorized) {
    return (
      <UnauthorizedView
        email={props.user?.email ?? undefined} 
        role={props.user?.role ?? undefined}
      />
    );
  }

  return <DashboardView session={props.session ?? null} />;
}
