import { CheckCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
};

type Order = {
  id: string;
  status: string;
  created_at: string;
  total: number;
  items: OrderItem[];
};

export default function OrderSuccessPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const { data: session } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !session?.user?.id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?user_id=${session.user.id}`);
        if (!res.ok) throw new Error("Failed to fetch order");

        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, session]);

  if (loading) {
    return <p className="p-8">Loading order...</p>;
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-25 px-6 text-center">
      <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />

      <h1 className="text-3xl font-bold mb-2">Order Successful 🎉</h1>
      <p className="text-gray-600 mb-6">
        Thank you! Your order has been placed successfully.
      </p>

      <div className="bg-white shadow rounded-xl p-6 text-left">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
        <p className="mt-4 text-xl font-bold">
          Total Paid: ${order.total.toFixed(2) ?? "0.00"}
        </p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-8 px-6 py-3 bg-blue-600 text-white cursor-pointer rounded-lg"
      >
        Continue Shopping
      </button>
    </div>
  );
}
