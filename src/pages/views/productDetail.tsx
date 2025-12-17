import React, { useState } from "react";
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Database } from "@/types/supabase";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/pages/products";

type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductPageProps = {
  product: Product;
};

export default function ProductPage({ product }: ProductPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("black");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { adding, handleAddToCart } = useCart();

  // Parse images jika product memiliki multiple images
  const images = product?.image
    ? [product.image]
    : [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
      ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { name: "black", hex: "#000000" },
    { name: "white", hex: "#FFFFFF" },
    { name: "navy", hex: "#1e3a8a" },
    { name: "gray", hex: "#6b7280" },
  ];

  type SpecValue = string | number | boolean | SpecObject | SpecValue[];
  interface SpecObject {
    [key: string]: SpecValue;
  }

  const specJson: SpecObject =
    typeof product?.specification === "string"
      ? JSON.parse(product?.specification)
      : product?.specification || {};

  console.log(typeof product?.specification, product?.specification);

  const features = [
    { icon: Truck, title: "Free Shipping", desc: "On orders over $100" },
    { icon: Shield, title: "Secure Payment", desc: "100% protected" },
    { icon: RefreshCw, title: "Easy Returns", desc: "30-day return policy" },
  ];

  const specs = Object.entries(specJson)
    .filter(([key]) => key !== "Key Features")
    .map(([label, value]) => ({
      label,
      value: Array.isArray(value) ? value.join(", ") : String(value),
    }));

  console.log("Specs array:", specs);

  const keyFeatures = Array.isArray(specJson["Key Features"])
    ? specJson["Key Features"]
    : [];
  console.log("Key Features array:", keyFeatures);

  // Format harga
  // const formatPrice = (price: number | null) => {
  //     if (!price) return '$0.00';
  //     return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD'
  //     }).format(price);
  // };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Breadcrumb */}
      <div className="bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-gray-500 hover:text-blue-600 cursor-pointer transition"
            >
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/products"
              className="text-gray-500 hover:text-blue-600 cursor-pointer transition"
            >
              Product
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
                <Image
                  width={500}
                  height={500}
                  src={images[selectedImage]}
                  alt={product.name || "Product"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {images?.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage(
                          (selectedImage - 1 + images?.length) % images?.length
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((selectedImage + 1) % images?.length)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {images?.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images?.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-xl overflow-hidden transition-all ${
                        selectedImage === idx
                          ? "ring-4 ring-blue-600 scale-95"
                          : "ring-2 ring-gray-200 hover:ring-gray-300"
                      }`}
                    >
                      <Image
                        width={500}
                        height={500}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>Premium Collection</span>
                  {/* {product.is_active && (
                                <>
                                <span>•</span>
                                <span className="text-green-600 font-semibold">Available</span>
                                </>
                            )} */}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => {
                      const rating = product.rating ?? 0;
                      const difference = rating - i;

                      let fillPercentage = 0;
                      if (difference >= 1) {
                        fillPercentage = 100;
                      } else if (difference > 0) {
                        fillPercentage = difference * 100;
                      }

                      return (
                        <div key={i} className="relative w-4 h-4">
                          {/* Background star (empty) */}
                          <Star className="w-4 h-4 text-gray-300 absolute" />

                          {/* Foreground star (filled) */}
                          <div
                            className="overflow-hidden absolute top-0 left-0"
                            style={{ width: `${fillPercentage}%` }}
                          >
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-gray-600">
                    {product.rating} ({product.sales || 0} sold)
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {product.discount && product.discount > 0
                      ? formatPrice(
                          product.price -
                            (product.price * product.discount) / 100
                        )
                      : formatPrice(product.price)}
                  </span>
                  {product.discount && product.discount > 0 ? (
                    <>
                      <span className="text-2xl text-gray-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                        {product.discount}% OFF
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {product.description && (
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Color
                </label>
                <div className="flex gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-12 h-12 rounded-full cursor-pointer border-4 transition-all ${
                        selectedColor === color.name
                          ? "border-blue-600 scale-110"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selectedColor === color.name &&
                        color.hex === "#FFFFFF" && (
                          <Check className="w-6 h-6 mx-auto text-gray-800" />
                        )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Size
                </label>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-xl cursor-pointer font-semibold transition-all ${
                        selectedSize === size
                          ? "bg-gray-900 text-white scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-5 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 font-semibold transition-colors"
                    >
                      −
                    </button>
                    <span className="px-8 py-3 font-semibold">{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(product.stock || 99, quantity + 1))
                      }
                      className="px-5 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {product.stock && (
                    <span className="text-gray-600">
                      {product.stock > 10
                        ? "In Stock"
                        : `Only ${product.stock} items left`}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleAddToCart(product.id)}
                  disabled={!product.stock || adding === product.id}
                  className="flex-1 bg-gray-900 text-white py-4 cursor-pointer rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {adding === product.id ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`px-6 py-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isFavorite
                      ? "bg-red-50 border-red-300 text-red-600"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${isFavorite ? "fill-red-600" : ""}`}
                  />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                {features.map((feature, idx) => (
                  <div key={idx} className="text-center">
                    <feature.icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Info Tabs */}
          <div className="border-t bg-gray-50">
            <div className="max-w-7xl mx-auto px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Specifications */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Specifications
                  </h3>
                  <div className="space-y-4">
                    {specs.map((spec, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:justify-between gap-2 py-3 border-b border-gray-100 last:border-0"
                      >
                        <span className="font-semibold text-gray-700 flex-shrink-0">
                          {spec.label}
                        </span>
                        <span className="text-gray-600 text-left sm:text-right break-words">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Features */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Key Features
                  </h3>
                  <ul className="space-y-3">
                    {keyFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{String(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
