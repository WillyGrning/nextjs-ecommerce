import useSWR from "swr";
import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  Truck,
} from "lucide-react";
import type { Order, OrdersApiResponse } from "@/types/order";
import toast from "react-hot-toast";
import { FaRupiahSign } from "react-icons/fa6";
/* =======================
   Types
======================= */
interface OrderListViewProps {
  initialPage?: number;
}

/* =======================
   Utils
======================= */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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


const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Package,
  },
  delivered: {
    label: "Delivered",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Truck,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

/* =======================
   Component
======================= */
export default function OrderListView({ initialPage = 1 }: OrderListViewProps) {
  const [page, setPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"view" | "edit">("view");

  /* Debounce search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Fetch orders */
  const { data, isLoading, error, mutate } = useSWR<OrdersApiResponse>(
    `/api/admin/orders?page=${page}&search=${encodeURIComponent(
      search
    )}&status=${statusFilter}`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const orders = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const limit = data?.meta?.limit ?? 10;
  const totalPages = Math.ceil(total / limit);

  // Calculate stats
  const stats = {
    total: total,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    revenue: orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.total), 0),
  };

  /* Action handlers */
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Status pesanan berhasil diperbarui!");
        setShowModal(false);
        mutate();
      } else {
        toast.error(result.message || "Gagal memperbarui status pesanan");
      }
    } catch (error) {
      console.error("Gagal memperbarui status pesanan:", error);
      alert("Failed to update order status");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const result = await res.json();

      if (res.ok) {
        alert("Order deleted successfully!");
        setShowModal(false);
        mutate();
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Failed to delete order");
    }
  };

  const openModal = (order: Order, type: "view" | "edit") => {
    setSelectedOrder(order);
    setModalType(type);
    setShowModal(true);
  };

  const handleExport = () => {
    const csv = [
      ["Order ID", "Customer", "Email", "Status", "Total", "Date"],
      ...orders.map((o) => [
        o.id.slice(0, 8),
        o.users?.fullname || "Unknown",
        o.users?.email || "N/A",
        o.status,
        o.total,
        o.created_at,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Failed to load orders
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Manajemen Pesanan</h1>
        <p className="text-slate-600 mt-1">
          Kelola dan lacak semua pesanan pelanggan
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Pesanan</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Processing</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.processing}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Pendapatan</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(stats.revenue)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <FaRupiahSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan ID Pesanan, Nama, atau Email Pelanggan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 cursor-pointer border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-slate-600 cursor-pointer text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Pesanan Tidak Ditemukan</p>
            <p className="text-sm">Coba sesuaikan filter Anda</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => {
                    const StatusIcon =
                      STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
                        ?.icon || Clock;
                    const statusConfig =
                      STATUS_CONFIG[
                        order.status as keyof typeof STATUS_CONFIG
                      ] || STATUS_CONFIG.pending;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-600">
                            #{order.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {(order.users?.fullname || "U").charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {order.users?.fullname || "Unknown"}
                              </p>
                              <p className="text-sm text-slate-500">
                                {order.users?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(order, "view")}
                              className="p-2 text-blue-600 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal(order, "edit")}
                              className="p-2 text-emerald-600 cursor-pointer hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Status"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {modalType === "view" ? "Detail Pesanan" : "Edit Status Pesanan"}
              </h2>
            </div>

            <div className="p-6">
              {modalType === "view" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">ID Pesanan</p>
                      <p className="font-mono font-semibold text-slate-800">
                        #{selectedOrder?.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Status</p>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          STATUS_CONFIG[
                            selectedOrder?.status as keyof typeof STATUS_CONFIG
                          ]?.color
                        }`}
                      >
                        {
                          STATUS_CONFIG[
                            selectedOrder?.status as keyof typeof STATUS_CONFIG
                          ]?.label
                        }
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      Informasi Pelanggan
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">
                          {selectedOrder?.users?.fullname || "Unknown"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {selectedOrder?.users?.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      Detail Pembayaran
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(selectedOrder?.subtotal || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Biaya Pengiriman</span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(selectedOrder?.shipping_cost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pajak</span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(selectedOrder?.tax || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-800">
                          Total
                        </span>
                        <span className="font-bold text-lg text-slate-800">
                          {formatCurrency(selectedOrder?.total || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">
                          {selectedOrder?.payment || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      Timeline
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-600">
                        Dibuat:{" "}
                        {formatDate(selectedOrder?.created_at || "N/A")}
                      </p>
                      <p className="text-slate-600">
                        Terakhir Diperbarui:{" "}
                        {formatDate(selectedOrder?.updated_at || "N/A")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600 mb-4">
                    Change the status of order #{selectedOrder?.id.slice(0, 8)}
                  </p>
                  <div className="space-y-3">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const StatusIcon = config.icon;
                      return (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusChange(selectedOrder?.id || "", status)
                          }
                          className={`w-full flex items-center cursor-pointer gap-3 p-4 rounded-lg border-2 transition-all ${
                            selectedOrder?.status === status
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <StatusIcon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-800">
                            {config.label}
                          </span>
                          {selectedOrder?.status === status && (
                            <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-slate-700 bg-slate-100 cursor-pointer hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
