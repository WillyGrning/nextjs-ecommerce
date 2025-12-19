import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useSession } from "next-auth/react";

type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  products: {
    id: string;
    name: string;
    image: string | null;
  } | null;
};

type OrderShipping = {
  full_name: string;
  email: string;
  phone_number: string | null;
  home_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  shipping_method: string;
  shipping_cost: number;
};

type PaymentCard = {
  last4: string;
  payment_number: string;
  cardholder_name: string;
  expiry_month: number;
  expiry_year: number;
};

type OrderPayment = {
  payment_method: string;
  status: string;
  paid_at: string;
  payment_cards: PaymentCard | null;
};

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
  order_shipping: OrderShipping | null; // ← Bukan array, tapi object
  order_payments: OrderPayment | null; // JSON string
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchOrdersData = async () => {
      if (!session?.user?.id) {
        setOrders([]);
        setLoading(false);
        setError("Please login to view orders");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/orders/list?user_id=${session.user.id}`);

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch orders");
        }

        const data = await res.json();
        console.log("Orders data:", data);
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Fetch orders error:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();
  }, [session]);

  const normalizeStatus = (status?: string): string =>
    status?.trim().toUpperCase() ?? "";

  const STATUS_STYLES: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",

    PENDING: "bg-amber-100 text-amber-800",
    PROCESSING: "bg-amber-100 text-amber-800",

    SHIPPED: "bg-sky-100 text-sky-800",
    DELIVERED: "bg-indigo-100 text-indigo-800",

    CANCELLED: "bg-rose-100 text-rose-800",
    FAILED: "bg-rose-100 text-rose-800",
  };

  const getStatusColor = (status?: string): string => {
    const normalizedStatus = normalizeStatus(status);
    return STATUS_STYLES[normalizedStatus] ?? "bg-gray-100 text-gray-800";
  };

  const parsePayment = (paymentStr: string) => {
    try {
      return JSON.parse(paymentStr);
    } catch {
      return { method: "Unknown" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">{error}</p>
          {error === "Please login to view orders" ? (
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          ) : (
            <button
              onClick={() => router.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 mt-16">
          <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
          <p className="mt-2 text-gray-600">Lacak dan kelola pesanan Anda</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Belum ada pesanan
            </h3>
            <p className="text-gray-600 mb-6">
              Mulai belanja dan buat pesanan pertama Anda!
            </p>
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-3 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition"
            >
              Jelajahi Produk
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const shipping = order.order_shipping; // ← Langsung ambil object
              const payment = order.order_payments;
              const card = payment?.payment_cards;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pesanan #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Dibuat pada{" "}
                          {new Date(order.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.order_items?.length || 0} item(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Items</h4>
                    <div className="space-y-4">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.products?.image ? (
                              <Image
                                src={item.products.image}
                                alt={item.products.name || "Product"}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-8 h-8"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">
                              {item.products?.name || "Product"}
                            </h5>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} ×
                              {formatCurrency(item.price_at_time)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(
                                item.quantity * item.price_at_time
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Shipping Info */}
                    {shipping && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Alamat Pengiriman
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-medium text-gray-900">
                            {shipping.full_name}
                          </p>
                          <p>{shipping.home_address}</p>
                          <p>
                            {shipping.city}, {shipping.state}{" "}
                            {shipping.zip_code}
                          </p>
                          <p>{shipping.country}</p>
                          {shipping.phone_number && (
                            <p className="mt-2">📞 {shipping.phone_number}</p>
                          )}
                          <p className="mt-2">✉️ {shipping.email}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Metode Pengiriman:
                            </span>{" "}
                            {shipping.shipping_method}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payment & Summary */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Pembayaran & Ringkasan
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Metode Pembayaran:
                          </span>
                          <span className="font-medium text-gray-900">
                            {payment
                              ? `${payment.payment_method.toUpperCase()}${
                                  card?.last4 ? ` ****${card.last4}` : ""
                                }`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-900">
                              {formatCurrency(order.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pengiriman:</span>
                            <span className="text-gray-900">
                              {order.shipping_cost === 0
                                ? "FREE"
                                : `${formatCurrency(order.shipping_cost)}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pajak:</span>
                            <span className="text-gray-900">
                              {formatCurrency(order.tax)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-base">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-gray-900">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Lihat Detail
                    </button>
                    {order.status === "PAID" && (
                      <button className="px-4 py-2 text-sm cursor-not-allowed font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                        Lacak Pesanan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
