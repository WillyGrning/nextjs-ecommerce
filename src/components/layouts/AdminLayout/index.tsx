import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  FileText,
  ShoppingCart,
  BarChart3,
  Package,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  LogIn,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { supabase } from "../../../../lib/supabase";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { data: session } = useSession();
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from("users")
          .select("id", {
            count: "exact",
            head: true, // ⚡ hanya hitung, tidak ambil data
          })
          .eq("role", "member");

        if (error) throw error;
        if (isMounted && typeof count === "number") {
          setUserCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch user count:", err);
      }
    };

    fetchUserCount();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");

      if (error) {
        console.error("Failed to fetch pending orders:", error);
        return;
      }

      setPendingOrderCount(count ?? 0);
    };

    fetchPendingOrders();
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin", badge: null },
    { icon: Users, label: "Users", href: "/admin/users", badge: null },
    { icon: ShoppingCart, label: "Orders", href: "/admin/orders", badge: pendingOrderCount > 0 ? pendingOrderCount : null },
    { icon: Package, label: "Products", href: "/admin/products", badge: null },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/admin/analytics",
      badge: null,
    },
    { icon: FileText, label: "Reports", href: "/admin/reports", badge: null },
    { icon: Settings, label: "Settings", href: "/admin/settings", badge: null },
  ];

  const words = session?.user?.name?.trim().split(/\s+/).filter(Boolean) || "";
  if (words.length === 0) return "";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";

  const initial = (first + last).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Sidebar - Fixed position */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-50 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-indigo-700 min-h-[80px]">
          <div
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
              sidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold whitespace-nowrap">
                Admin Panel
              </h2>
              <p className="text-xs text-indigo-300 whitespace-nowrap">
                Management System
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors flex-shrink-0"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-700/50 transition-all duration-200 group relative ${
                    isActive ? "bg-indigo-700 shadow-lg" : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-white" : "text-indigo-300"
                    } group-hover:text-white transition-colors`}
                  />
                  <span
                    className={`flex-1 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                    } ${isActive ? "text-white" : "text-indigo-100"}`}
                  >
                    {item.label}
                  </span>
                  {item.badge && sidebarOpen && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={() =>
              session
                ? signOut({ callbackUrl: "/auth/login" })
                : router.push("/auth/login")
            }
            className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg hover:bg-red-600/20 text-red-300 hover:text-white transition-all duration-200 w-full group"
          >
            {session ? (
              <LogOut className="w-5 h-5 flex-shrink-0" />
            ) : (
              <LogIn className="w-5 h-5 flex-shrink-0" />
            )}
            <span
              className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
              }`}
            >
              {session ? "Logout" : "Login"}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content - Takes remaining space */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex cursor-pointer items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {initial}
                    </span>
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-700">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={() =>
                        session
                          ? signOut({ callbackUrl: "/auth/login" })
                          : router.push("/auth/login")
                      }
                      className="flex items-center cursor-pointer gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-red-600"
                    >
                      {session ? (
                        <LogOut className="w-4 h-4" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {session ? "Logout" : "Login"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Full width, scrollable */}
        <main className="flex-1 w-full overflow-y-auto bg-gray-50">
          <div className="p-6 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
