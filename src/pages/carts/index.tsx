import { useState, useEffect } from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Tag,
  Truck,
  Shield,
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Database } from "@/types/supabase";
import Image from "next/image";
import router from "next/router";
import toast from "react-hot-toast";

type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type CartItemWithProduct = CartItem & {
  products: Pick<
    ProductRow,
    "id" | "name" | "image" | "price" | "stock" | "discount"
  > | null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CartPage() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [cartItem, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState(new Set<string>());

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!session?.user?.id) {
        setCartItems([]);
        setCartCount(0);
        return;
      }

      try {
        const response = await fetch("/api/cart/fetch");
        const result = await response.json();

        console.log("📦 Fetched cart:", result);

        if (result.error) {
          console.error("Error fetching cart:", result.error);
          setCartItems([]);
          setCartCount(0);
          return;
        }

        setCartItems(result.items);
        setCartCount(result.count);
      } catch (error) {
        console.error("Error:", error);
        setCartItems([]);
        setCartCount(0);
      }
    };

    fetchCartItems();
  }, [session]);

  const updateQuantity = (id: string, change: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const getInStockIds = (items: typeof cartItem) =>
    items
      .filter((i) => !!i.products?.stock) // hanya yg ada stock truthy
      .map((i) => String(i.id));

  const toggleSelectAll = () => {
    const inStockIds = getInStockIds(cartItem);

    setSelectedSet((prev) => {
      const allSelected = inStockIds.every((id) => prev.has(id));

      // immutable copy
      const next = new Set(prev);

      if (allSelected) {
        // kalau semua sudah tercentang -> uncheck semua in-stock
        inStockIds.forEach((id) => next.delete(id));
      } else {
        // kalau belum semua -> centang semua in-stock
        inStockIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const toggleItemSelection = (id: string) => {
    setSelectedSet((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(id)) {
        // jika sudah dipilih → uncheck
        newSet.delete(id);
      } else {
        // jika belum dipilih → check
        newSet.add(id);
      }

      return newSet;
    });
  };

  const removeFromCart = async (id: string) => {
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id }),
      });

      const result = await response.json();

      console.log("✅ Delete result:", result);

      if (result.error || !result.success) {
        console.error("Error removing item:", result.error);
        setNotification("Failed to remove item");
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Update UI only if delete succeeded
      const item = cartItem.find((item) => item.id === id);
      setCartItems((items) => items.filter((item) => item.id !== id));
      setCartCount((prev) => Math.max(prev - 1, 0));

      if (item) {
        setNotification(`${item.products?.name} removed from cart`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setNotification("Failed to remove item");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCheckout = () => {
    const selectedItems = cartItem.filter((item) =>
      selectedSet.has(String(item.id))
    );

    if (selectedItems.length === 0) {
      setNotification("Please select at least one item to checkout.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      // Save minimal payload needed for checkout
      const payload = selectedItems.map((it) => ({
        id: String(it.id),
        productId: it.products?.id ?? null,
        name: it.products?.name ?? "",
        price: it.products?.price ?? 0,
        quantity: it.quantity ?? 1,
        image: it.products?.image ?? null,
        stock: it.products?.stock ?? 0,
      }));

      sessionStorage.setItem("checkoutItems", JSON.stringify(payload));
      // optional: save subtotal/total if you want
      sessionStorage.setItem("checkoutPromo", JSON.stringify(appliedPromo));
      // const subtotal = payload.reduce((s, p) => s + p.price * p.quantity, 0);
      // sessionStorage.setItem("checkoutSubtotal", String(subtotal));

      // navigate to checkout page
      router.push(
        `/checkout?items=${encodeURIComponent(JSON.stringify(selectedItems))}`
      );
    } catch (err) {
      console.error("Failed to prepare checkout:", err);
      setNotification("Failed to prepare checkout. Try again.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const [couponCode, setCouponCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    promoId: string;
    discount: number;
    finalSubtotal: number;
  } | null>(null);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const res = await fetch("/api/promos/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(data);
      toast.success(
        `Promo diterapkan! Anda menghemat ${formatCurrency(
          data.discount.toFixed(2)
        )}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Gagal menerapkan promo. Silakan coba lagi.");
    }
  };

  const subtotal = cartItem
    .filter((item) => selectedSet.has(String(item.id)))
    .reduce(
      (sum, item) => sum + (item.products?.price ?? 0) * item.quantity,
      0
    );
  const shipping = subtotal > 500 ? 0 : 15;
  const discount = appliedPromo?.discount ?? 0;
  const total = Math.max(subtotal - discount, 0) + shipping;

  return (
    <div className="min-h-screen mt-16 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-slideIn flex items-center gap-3 max-w-md">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="font-medium">{notification}</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-blue-600" />
            Keranjang Belanja
          </h1>
          <p className="text-gray-600">
            {cartItem.length} {cartItem.length === 1 ? "item" : "items"} item di
            keranjang anda ·{" "}
            {cartItem.filter((i) => selectedSet.has(i.id)).length} dipilih
          </p>
        </div>

        {/* Select All */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cartItem
                .filter((i) => i.products?.stock)
                .every((item) => selectedSet.has(item.id))}
              onChange={toggleSelectAll}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="font-semibold text-gray-900">Pilih Semua</span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItem.length > 0 ? (
              cartItem.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border ${
                    selectedSet.has(item.id)
                      ? "border-blue-500"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex gap-6">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-5 h-5 text-blue-600 rounded cursor-pointer mt-2"
                    />
                    {/* Product Image */}
                    <div className="relative flex-shrink-0">
                      <Image
                        width={100}
                        height={100}
                        src={item.products?.image ?? "/images/placeholder.png"}
                        alt={item.products?.name ?? ""}
                        className="w-32 h-32 object-cover rounded-xl shadow-sm"
                      />
                      {!item.products?.stock && (
                        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {item.products?.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              Size:
                            </span>
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              Color:
                            </span>
                            {item.products?.stock && (
                              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(item.products?.price || 0)}
                          </p>
                          <p className="text-sm text-gray-500">per item</p>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-700">
                            Quantity:
                          </span>
                          <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="px-6 py-2 font-bold text-gray-900 bg-white border-x-2 border-gray-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={
                                item.quantity >= (item.products?.stock || 0)
                              }
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                          {item.quantity >= (item.products?.stock || 0) && (
                            <span className="text-xs text-orange-600 font-medium">
                              Max stock reached
                            </span>
                          )}
                        </div>

                        {/* SubTotal */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(
                              (item.products?.price || 0) * item.quantity
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-16 text-center">
                <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-500 mb-6">
                  Add some items to get started!
                </p>
                <button
                  onClick={() => router.push("/products")}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden sticky top-8">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5">
                <h2 className="text-2xl font-bold text-white">
                  Ringkasan Pesanan
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Coupon */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Punya kode promo?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setAppliedPromo(null);
                        }}
                        placeholder="Enter code"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      className="px-6 py-3 bg-gray-900 cursor-pointer hover:bg-gray-800 text-white font-semibold rounded-xl transition-all"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Pengiriman</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `${formatCurrency(shipping)}`
                      )}
                    </span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-gray-600">
                      <span>Diskon</span>
                      <span className="font-semibold text-green-600">
                        -{formatCurrency(appliedPromo.discount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      Total
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Free Shipping Banner */}
                {shipping > 0 && subtotal < 500 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-blue-700 text-center">
                      💡 Tambahkan{" "}
                      <strong>{formatCurrency(500 - subtotal)}</strong> lagi
                      untuk pengiriman GRATIS!
                    </p>
                    <div className="mt-2 bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-500"
                        style={{ width: `${(subtotal / 500) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={
                    cartItem.filter((item) => selectedSet.has(item.id))
                      .length === 0
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg cursor-pointer"
                >
                  Lanjut ke Pembayaran
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs text-gray-600 font-medium">
                      Fast Delivery
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto mb-1 text-green-600" />
                    <p className="text-xs text-gray-600 font-medium">Secure</p>
                  </div>
                  <div className="text-center">
                    <Lock className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                    <p className="text-xs text-gray-600 font-medium">
                      Safe Payment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
