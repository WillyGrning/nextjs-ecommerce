import DashboardView from "./views/DashboardView";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return <DashboardView session={session} />;
}
