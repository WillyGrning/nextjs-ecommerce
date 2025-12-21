import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Session } from "next-auth";
import useSWR from "swr";
import router from "next/router";
import { timeAgo } from "@/utils/timeAgo";
import type { Order, OrdersApiResponse } from "@/types/order";
import type { Product, ProductsApiResponse, Sale } from "@/types/product";
import { useEffect, useState } from "react";

interface AdminDashboardProps {
  session?: Session | null;
}

interface User {
  id: string;
  email: string;
  fullname: string | null;
  role: "admin" | "member";
  created_at?: string;
  status?: "active" | "inactive";
}

interface UsersApiResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

// const formatCurrency = (
//   amount: number,
//   currency: "USD" | "IDR" = "USD",
//   locale: string = "en-US"
// ): string => {
//   return new Intl.NumberFormat(locale, {
//     style: "currency",
//     currency,
//     minimumFractionDigits: 0,
//   }).format(amount);
// };

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function DashboardView({ session }: AdminDashboardProps) {
  const [formData, setFormData] = useState([
    {
      product_id: "",
      product_name: "",
      quantity: 0,
      revenue: 0,
    },
  ]);

  // Fetch products
  const { data, isLoading, error, mutate } = useSWR<ProductsApiResponse>(
    `/api/admin/products`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  /* Fetch users */
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
    mutate: mutateUser,
  } = useSWR<UsersApiResponse>(`/api/admin/users`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  // Fetch orders
  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
    mutate: mutateOrder,
  } = useSWR<OrdersApiResponse>(`/api/admin/orders`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  // Fetch Sales
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await fetch("/api/admin/sales");
        const data = await res.json();

        if (res.ok) {
          setFormData(
            data.map((item: Sale) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.qty_sold,
              revenue: item.total_revenue,
            }))
          );
        } else {
          alert(data.message || "Failed to load sales");
        }
      } catch (error) {
        console.error("Error fetching sales:", error);
        alert("An unexpected error occurred while fetching sales");
      }
    };
    fetchSales();
  }, []);

  const total = data?.meta?.total ?? 0;
  const userTotal = userData?.meta?.total ?? 0;
  const orderTotal = orderData?.meta?.total ?? 0;
  const revenue = orderData?.data
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const stats = [
    {
      title: "Total Pendapatan",
      value: isOrderLoading
        ? "Loading..."
        : formatCurrency(revenue || 0),
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Total Pengguna",
      value: isUserLoading ? "Loading..." : userTotal,
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Pesanan",
      value: isOrderLoading ? "Loading..." : orderTotal,
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Produk",
      value: isLoading ? "Loading..." : total,
      change: "-2.4%",
      trend: "down",
      icon: Package,
      color: "from-orange-500 to-red-600",
    },
  ];

  // const recentOrders = orderData?.data.slice(0, 5).map((order) => ({
  //   id: order.id.slice(0, 8).toUpperCase()
  // }));

  // const topProducts = [
  //   {
  //     name: "Wireless Headphones",
  //     sales: 234,
  //     revenue: "$11,700",
  //     trend: "+15%",
  //   },
  //   { name: "Smart Watch", sales: 189, revenue: "$9,450", trend: "+8%" },
  //   { name: "Laptop Stand", sales: 156, revenue: "$7,800", trend: "+12%" },
  //   { name: "USB-C Cable", sales: 298, revenue: "$5,960", trend: "+22%" },
  // ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <TrendingUp className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name}! 👋
            </h1>
            <p className="text-indigo-100">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-indigo-100 mb-1">Tanggal Sekarang</p>
              <p className="text-xl font-bold">
                {new Date().toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {/* <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div> */}
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pesanan Terbaru</h2>
              <button
                onClick={() => router.push("/admin/orders")}
                className="text-sm text-indigo-600 cursor-pointer hover:text-indigo-700 font-semibold"
              >
                Lihat Semua Pesanan
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {orderData?.data.map((order, index) => (
              <div
                key={index}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {order.id}
                      </span>
                      <span
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order?.users?.fullname}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {order.total.toLocaleString("en-US", {
                        style: "currency",
                        currency: "IDR",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
          </div>
          <div className="p-6 space-y-4">
            {formData.map((product, index) => (
              <div key={index} className="group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                  {/* Nama produk & jumlah */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors break-words">
                      {product.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.quantity} sales
                    </p>
                  </div>

                  {/* Harga */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>

                {/* Border bawah */}
                {index < formData.length - 1 && (
                  <div className="mt-2 border-b border-gray-100"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col cursor-pointer items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
            <Users className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            <span className="text-sm font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">
              Add User
            </span>
          </button>
          <button
            onClick={() => router.push("/admin/products/create")}
            className="flex flex-col items-center cursor-pointer gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <Package className="w-8 h-8 text-gray-400 group-hover:text-purple-600 transition-colors" />
            <span className="text-sm font-semibold text-gray-600 group-hover:text-purple-600 transition-colors">
              Tambah Produk
            </span>
          </button>
          <button className="flex flex-col items-center cursor-pointer gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group">
            <ShoppingCart className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
            <span className="text-sm font-semibold text-gray-600 group-hover:text-green-600 transition-colors">
              New Order
            </span>
          </button>
          <button
            onClick={() => router.push("/admin/reports")}
            className="flex flex-col items-center cursor-pointer gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
          >
            <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-orange-600 transition-colors" />
            <span className="text-sm font-semibold text-gray-600 group-hover:text-orange-600 transition-colors">
              Lihat Laporan
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
