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

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  order_shipping: OrderShipping | null;
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!id || !session?.user?.id) return;

    fetchOrderDetail();
  }, [id, session]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/orders/${id}?user_id=${session?.user?.id}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch order");
      }

      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      console.error("Fetch order error:", err);
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELIVERED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return "✓";
      case "SHIPPED":
        return "🚚";
      case "DELIVERED":
        return "📦";
      case "CANCELLED":
        return "✕";
      default:
        return "●";
    }
  };

  const parsePayment = (paymentStr: string) => {
    try {
      return JSON.parse(paymentStr);
    } catch {
      return { method: "Unknown" };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // TODO: Implement PDF generation
    alert("Invoice download will be implemented soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">
            {error || "Order not found"}
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const shipping = order.order_shipping;
  const payment = parsePayment(order.payment);

  const normalizeStatus = (status?: string) =>
    status?.trim().toUpperCase() ?? "";

  const ORDER_TIMELINE = ["PLACED", "SHIPPED", "DELIVERED"] as const;

  const STATUS_PROGRESS: Record<string, number> = {
    PAID: 1,
    PENDING: 1,
    PROCESSING: 1,

    SHIPPED: 2,

    DELIVERED: 3,
    COMPLETED: 3,
  };

  const isStepActive = (currentStatus: string, stepIndex: number) => {
    const progress = STATUS_PROGRESS[currentStatus] ?? 0;
    return progress >= stepIndex + 1;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 mt-16 print:hidden">
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order Details
              </h1>
              <p className="text-gray-600 mt-1">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
              <button
                onClick={handleDownloadInvoice}
                className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Status Banner */}
          <div className={`p-6 border-b-4 ${getStatusColor(order.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getStatusIcon(order.status)}</div>
                <div>
                  <h2 className="text-2xl font-bold">Order {order.status}</h2>
                  <p className="text-sm mt-1">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="p-6 border-b border-gray-200 print:hidden">
            <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>

            {(() => {
              const status = normalizeStatus(order.status);

              return (
                <>
                  <div className="flex items-center gap-2">
                    {ORDER_TIMELINE.map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-2 rounded-full transition-colors ${
                          isStepActive(status, index)
                            ? index === 0
                              ? "bg-emerald-500"
                              : index === 1
                              ? "bg-sky-500"
                              : "bg-indigo-500"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>Order Placed</span>
                    <span>Shipped</span>
                    <span>Delivered</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">
              Order Items
            </h3>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.products?.image ? (
                      <Image
                        src={item.products.image}
                        alt={item.products.name || "Product"}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-10 h-10"
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
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {item.products?.name || "Product"}
                    </h4>
                    <p className="text-gray-600 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-gray-600">
                      Price: ${item.price_at_time.toFixed(2)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${(item.quantity * item.price_at_time).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* Shipping Address */}
            {shipping && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                  Shipping Address
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-gray-900">
                    {shipping.full_name}
                  </p>
                  <p className="text-gray-700">{shipping.home_address}</p>
                  <p className="text-gray-700">
                    {shipping.city}, {shipping.state} {shipping.zip_code}
                  </p>
                  <p className="text-gray-700">{shipping.country}</p>
                  {shipping.phone_number && (
                    <p className="text-gray-700 mt-3 pt-3 border-t border-gray-200">
                      📞 {shipping.phone_number}
                    </p>
                  )}
                  <p className="text-gray-700">✉️ {shipping.email}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Shipping Method:</span>{" "}
                      {shipping.shipping_method}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Shipping Cost:</span>{" "}
                      {shipping.shipping_cost === 0
                        ? "FREE"
                        : `$${shipping.shipping_cost.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment & Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
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
                Payment Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-700">Payment Method:</span>
                  <span className="font-semibold text-gray-900">
                    {payment.method?.toUpperCase() || "N/A"}
                    {payment.last4 && ` ****${payment.last4}`}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-gray-900 font-medium">
                      ${order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Shipping:</span>
                    <span className="text-gray-900 font-medium">
                      {order.shipping_cost === 0
                        ? "FREE"
                        : `$${order.shipping_cost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax (10%):</span>
                    <span className="text-gray-900 font-medium">
                      ${order.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2 border-gray-300 text-lg">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-gray-900">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Order Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-blue-800">
                    <span className="font-medium">Order ID:</span> {order.id}
                  </p>
                  <p className="text-blue-800">
                    <span className="font-medium">Order Date:</span>{" "}
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-blue-800">
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(order.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 print:hidden">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about your order, please contact our
                support team.
              </p>
              <div className="flex justify-center gap-3">
                <button className="px-6 py-2 text-sm cursor-pointer font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                  Contact Support
                </button>
                <button
                  onClick={() => router.push("/orders")}
                  className="px-6 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  View All Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
