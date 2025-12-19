import {
  ArrowLeft,
  Lock,
  Check,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Client-side CheckoutPage
 * - expects `items` query param (encoded JSON) OR reads sessionStorage.checkoutItems
 * - checkoutItems shape: same as `selectedItems` from your CartPage
 */

type ProductPick = {
  id: string;
  name: string;
  image?: string | null;
  price: number;
  stock?: number | null;
  discount?: number | null;
};

type CheckoutItem = {
  id: string;
  quantity: number;
  price_at_time?: number;
  products?: ProductPick | null;
};

type Promo = {
  promoId: string;
  discount: number;
  finalSubtotal: number;
};

function safeJsonParse<T>(value: unknown): T | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeCheckoutItems(raw: unknown): CheckoutItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): CheckoutItem | null => {
      if (typeof item !== "object" || item === null) return null;

      const it = item as Record<string, unknown>;
      const product =
        typeof it.products === "object" && it.products !== null
          ? (it.products as Record<string, unknown>)
          : null;

      return {
        id: String(it.id),
        quantity: Number(it.quantity ?? 1),
        price_at_time:
          typeof it.price_at_time === "number" ? it.price_at_time : undefined,
        products: product
          ? {
              id: String(product.id),
              name: String(product.name ?? ""),
              image: typeof product.image === "string" ? product.image : null,
              price: Number(product.price ?? 0),
              stock: typeof product.stock === "number" ? product.stock : null,
              discount:
                typeof product.discount === "number" ? product.discount : null,
            }
          : null,
      };
    })
    .filter((v): v is CheckoutItem => v !== null);
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CheckoutPage() {
  const router = useRouter();
  const [notification, setNotification] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { data: session } = useSession();

  // shipping & payment state (simple, client-side)
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    // country: "Indonesia",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    saveCard: false,
  });

  const checkoutItems = useMemo<CheckoutItem[]>(() => {
    if (!router.isReady) return [];

    // 1️⃣ Try from query
    const fromQuery = normalizeCheckoutItems(safeJsonParse(router.query.items));

    if (fromQuery.length > 0) {
      try {
        sessionStorage.setItem("checkoutItems", JSON.stringify(fromQuery));
      } catch {}
      return fromQuery;
    }

    // 2️⃣ Fallback from sessionStorage
    const fromStorage = normalizeCheckoutItems(
      safeJsonParse(sessionStorage.getItem("checkoutItems"))
    );

    return fromStorage;
  }, [router.isReady, router.query.items]);

  const appliedPromo: Promo | null = useMemo(() => {
    const raw = safeJsonParse<Promo>(sessionStorage.getItem("checkoutPromo"));
    return raw ?? null;
  }, []);

  // derived totals
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((s, it) => {
      const price = it.products?.price ?? it.price_at_time ?? 0;
      const qty = it.quantity ?? 1;
      return s + price * qty;
    }, 0);
  }, [checkoutItems]);

  const discount = appliedPromo?.discount ?? 0;
  const finalSubtotal = appliedPromo?.finalSubtotal ?? subtotal;

  const shippingThreshold = 100000;
  const shippingCost = subtotal > shippingThreshold ? 0 : 15000;
  const taxRate = 0.1; // simple 10% tax example
  const tax = +(finalSubtotal * taxRate);
  const total = finalSubtotal + shippingCost + tax;

  // handlers
  const handleContinueToPayment = (e?: React.FormEvent) => {
    e?.preventDefault();
    // basic validation for shipping
    if (
      !shippingInfo.fullName ||
      !shippingInfo.email ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.zipCode
    ) {
      setNotification("Please complete required shipping fields.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinueToReview = (e?: React.FormEvent) => {
    e?.preventDefault();
    // basic payment validation (very light)
    if (
      !paymentInfo.cardNumber ||
      !paymentInfo.cardName ||
      !paymentInfo.expiryDate ||
      !paymentInfo.cvv
    ) {
      setNotification("Please complete required payment fields.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) {
      setNotification("No items to place order.");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session?.user.id,
          items: checkoutItems.map((it) => ({
            product_id: it.products?.id,
            quantity: it.quantity,
            price: it.products?.price ?? it.price_at_time ?? 0,
          })),
          shipping: shippingInfo,
          payment: {
            method: "card",
            last4: paymentInfo.cardNumber.slice(-4),
            cardNumber: paymentInfo.cardNumber,
            cardName: paymentInfo.cardName,
            expiryMonth: paymentInfo.expiryDate.split("/")[0],
            expiryYear: paymentInfo.expiryDate.split("/")[1],
          },
          promo_code_id: appliedPromo?.promoId,
          subtotal,
          shippingCost,
          tax,
          total,
        }),
      });

      if (!res.ok) throw new Error("Order creation failed");

      const data: { order_id: string } = await res.json();
      sessionStorage.removeItem("checkoutItems");
      router.push(`/orders/success?orderId=${data.order_id}`);
    } catch (err) {
      console.error(err);
      setNotification("Failed to place order.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // quick guard: if no items, show prompt
  useEffect(() => {
    if (checkoutItems.length === 0) {
      // don't auto-redirect immediately; allow user to go back
      // setNotification("No items found. Please return to cart.");
    }
  }, [checkoutItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {notification && (
        <div className="fixed top-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-medium">{notification}</span>
        </div>
      )}
      <div className="max-w-7xl mt-16 mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/carts")}
            className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Keranjang
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Selesaikan pembelian Anda</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { number: 1, title: "Pengiriman", icon: Truck },
              { number: 2, title: "Pembayaran", icon: CreditCard },
              { number: 3, title: "Tinjau", icon: Package },
            ].map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all ${
                      currentStep >= step.number
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-8 h-8" />
                    ) : (
                      <step.icon className="w-8 h-8" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      currentStep >= step.number
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                      currentStep > step.number
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                        : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forms Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <MapPin className="w-6 h-6" />
                    Informasi Pengiriman
                  </h2>
                </div>

                <form
                  className="p-6 space-y-6"
                  onSubmit={handleContinueToPayment}
                >
                  {/* Contact */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Informasi Kontak
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={shippingInfo.fullName}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                fullName: e.target.value,
                              }))
                            }
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Alamat Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={shippingInfo.email}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                email: e.target.value,
                              }))
                            }
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nomor Telepon
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={shippingInfo.phone}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                phone: e.target.value,
                              }))
                            }
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="+62 (8xx) xxxx-xxxx"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Alamat Pengiriman
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Alamat Jalan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.address}
                          onChange={(e) =>
                            setShippingInfo((s) => ({
                              ...s,
                              address: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kota <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.city}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                city: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Provinsi <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.state}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                state: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="NY"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kode Pos <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.zipCode}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                zipCode: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="10001"
                          />
                        </div>

                        {/* <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Negara
                          </label>
                          <select
                            value={shippingInfo.country}
                            onChange={(e) =>
                              setShippingInfo((s) => ({
                                ...s,
                                country: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white"
                          >
                            <option>United States</option>
                            <option>Canada</option>
                            <option>United Kingdom</option>
                            <option>Australia</option>
                          </select>
                        </div> */}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Shipping Method
                    </h3>
                    <div className="space-y-3">
                      {/* Placeholder for shipping options */}
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          id="standard"
                          name="ship"
                          defaultChecked
                        />
                        <label htmlFor="standard" className="text-sm">
                          Standard Delivery (3-5 hari kerja) —
                          {formatCurrency(shippingCost)}
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Lanjut ke Pembayaran
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Information */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="w-6 h-6" />
                    Informasi Pembayaran
                  </h2>
                </div>

                <form
                  className="p-6 space-y-6"
                  onSubmit={handleContinueToReview}
                >
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl mb-6">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded"></div>
                      <Lock className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="mb-6">
                      <p className="text-2xl font-mono tracking-wider mb-2">
                        {paymentInfo.cardNumber
                          ? paymentInfo.cardNumber.replace(/\d(?=\d{4})/g, "•")
                          : "•••• •••• •••• ••••"}
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Card Holder
                        </p>
                        <p className="font-semibold">
                          {paymentInfo.cardName || "JOHN DOE"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Expires</p>
                        <p className="font-semibold">
                          {paymentInfo.expiryDate || "MM/YY"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nomor Kartu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentInfo.cardNumber}
                        onChange={(e) =>
                          setPaymentInfo((p) => ({
                            ...p,
                            cardNumber: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nama Pemilik <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentInfo.cardName}
                        onChange={(e) =>
                          setPaymentInfo((p) => ({
                            ...p,
                            cardName: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tanggal Kadaluarsa{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentInfo.expiryDate}
                          onChange={(e) =>
                            setPaymentInfo((p) => ({
                              ...p,
                              expiryDate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          CVV <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentInfo.cvv}
                          onChange={(e) =>
                            setPaymentInfo((p) => ({
                              ...p,
                              cvv: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={paymentInfo.saveCard}
                        onChange={(e) =>
                          setPaymentInfo((p) => ({
                            ...p,
                            saveCard: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <label
                        htmlFor="saveCard"
                        className="text-sm cursor-pointer text-gray-700"
                      >
                        Simpan informasi kartu untuk pembayaran di masa depan
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-100 cursor-pointer hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      Tinjau Pesanan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Shipping Info Review */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Alamat Pengiriman
                    </h3>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-gray-700 space-y-1">
                    <p className="font-semibold">{shippingInfo.fullName}</p>
                    <p>{shippingInfo.address}</p>
                    <p>
                      {shippingInfo.city}, {shippingInfo.state}{" "}
                      {shippingInfo.zipCode}
                    </p>
                    {/* <p>{shippingInfo.country}</p> */}
                    <p className="pt-2">{shippingInfo.email}</p>
                    {shippingInfo.phone && <p>{shippingInfo.phone}</p>}
                  </div>
                </div>

                {/* Payment Info Review */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Metode Pembayaran
                    </h3>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        •••• •••• •••• {paymentInfo.cardNumber.slice(-4)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {paymentInfo.cardName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Method Review */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Metode Pengiriman
                  </h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Standar</p>
                      <p className="text-sm text-gray-500">3-5 hari kerja</p>
                    </div>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(shippingCost)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-gradient-to-r cursor-pointer from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                  <Shield className="w-6 h-6" />
                  Bayar — {formatCurrency(total)}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Dengan melakukan pemesanan, Anda menyetujui Syarat dan
                  Ketentuan kami
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-5">
                <h2 className="text-2xl font-bold text-white">
                  Ringkasan Pemesanan
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Items */}
                <div className="space-y-4">
                  {checkoutItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No items in checkout.{" "}
                        <button
                          className="text-blue-600"
                          onClick={() => router.push("/carts")}
                        >
                          Kembali ke Keranjang
                        </button>
                      </p>
                    </div>
                  ) : (
                    checkoutItems.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <Image
                          src={
                            item.products?.image ?? "/images/placeholder.png"
                          }
                          alt={item.products?.name ?? item.id}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                            {item.products?.name ?? "Unknown product"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                          <p className="font-bold text-gray-900 mt-1">
                            {formatCurrency(
                              (item.products?.price ??
                                item.price_at_time ??
                                0) * item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
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
                      {formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Pajak</span>
                    <span className="font-semibold">{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Diskon</span>
                      <span className="font-semibold">
                        - {formatCurrency(discount)}
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

                {/* Security Badges */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700 font-medium">
                      Secure SSL Encryption
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700 font-medium">
                      Safe Payment Processing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* end container */}
    </div>
  );
}
