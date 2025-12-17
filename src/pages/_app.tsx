import MainLayout from "@/components/layouts/MainLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import UnauthorizedView from "@/pages/admin/views/unauthorized";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider, useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isAdminRoute = router.pathname.startsWith("/admin");

  // 1️⃣ LOADING (belum tahu auth)
  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 2️⃣ ADMIN ROUTE TAPI TIDAK ADMIN / BELUM LOGIN
  if (isAdminRoute && (!session || session.user?.role !== "admin")) {
    return (
      <UnauthorizedView
        email={session?.user?.email?? undefined}
        role={session?.user?.role ?? "guest"}
      />
    );
  }

  // 3️⃣ BARU PILIH LAYOUT
  const Layout = isAdminRoute ? AdminLayout : MainLayout;

  return (
    <Layout>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </Layout>
  );
}

export default function App(props: AppProps) {
  return (
    <SessionProvider session={props.pageProps.session}>
      <AppContent {...props} />
    </SessionProvider>
  );
}
