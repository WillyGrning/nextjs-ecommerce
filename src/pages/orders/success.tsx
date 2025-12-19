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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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

      <h1 className="text-3xl font-bold mb-2">Pesanan Berhasil 🎉</h1>
      <p className="text-gray-600 mb-6">
        Terima kasih! Pesanan Anda telah berhasil dibuat.
      </p>

      <div className="bg-white shadow rounded-xl p-6 text-left">
        <p><strong>ID Pesanan:</strong> {order.id}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Tanggal:</strong> {new Date(order.created_at).toLocaleString()}</p>
        <p className="mt-4 text-xl font-bold">
          Total Dibayar: {formatCurrency(order.total) ?? "0.00"}
        </p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-8 px-6 py-3 bg-blue-600 text-white cursor-pointer rounded-lg"
      >
        Kembali ke Beranda
      </button>
    </div>
  );
}
