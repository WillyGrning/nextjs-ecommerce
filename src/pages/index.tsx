import {
  ShoppingCart,
  Heart,
  Star,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Database } from "@/types/supabase";
import Link from "next/link";
import { useCart, useFavorite } from "./products";

type Product = Database["public"]["Tables"]["products"]["Row"];

type Props = {
  products: Product[];
};

export default function Home({ products: initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const { adding, handleAddToCart } = useCart();
  const { addingFav, handleAddToFavorites } = useFavorite();

  useEffect(() => {
    const productChannel = supabase
      .channel("products-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("Realtime payload:", payload);
          // Update local state
          setProducts((prev: Product[]) => {
            const newProduct = payload.new as Product; // cast ke Product
            const updated = prev.map((p) =>
              p.id === newProduct.id ? newProduct : p
            );

            // Kalau product baru, push ke array
            if (!prev.find((p) => p.id === newProduct.id)) {
              updated.push(newProduct);
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
    };
  }, []);

  const hotDeal = products
    .filter((p) => p.discount && p.discount > 0)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))[0];

  const today = new Date().toISOString().split("T")[0];

  const newProducts = products
    .filter((p) => p.date_added && p.date_added.startsWith(today))
    .sort(
      (a, b) =>
        new Date(b.date_added!).getTime() - new Date(a.date_added!).getTime()
    )
    .slice(0, 1);

  const bestSeller = products
    .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
    .slice(0, 1);

  const productsWithBadge = products.map((p) => {
    let badge = "";

    if (p.id === hotDeal?.id) {
      badge = "Hot Deal";
    } else if (newProducts.some((np) => np.id === p.id)) {
      badge = "New Arrival";
    } else if (bestSeller.some((bs) => bs.id === p.id)) {
      badge = "Best Seller";
    }

    return {
      ...p,
      badge,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}

      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Summer Sale - Up to 50% Off
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Discover Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  Perfect Style
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Explore our curated collection of premium products designed to
                elevate your everyday experience.
              </p>
              <div className="flex gap-4">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  Shop Now
                </button>
                <button className="bg-white text-gray-700 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition border border-gray-200">
                  View Deals
                </button>
              </div>

              <div className="flex gap-8 mt-12">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Fast Delivery</span>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl transform rotate-6"></div>
              <Image
                src="/image/bg.jpg"
                alt="Hero"
                className="relative rounded-3xl shadow-2xl object-cover w-full h-96"
                width={800}
                height={600}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Featured Products
            </h2>
            <p className="text-gray-600">Handpicked items just for you</p>
          </div>
          <button className="text-blue-600 font-medium hover:text-blue-700 transition">
            View All →
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-3 gap-8">
            {productsWithBadge.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}/${product.name}`}
                className="block group relative"
              >
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={product.image ?? "/image/placeholder.png"}
                        alt={product.name}
                        className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                        width={600}
                        height={600}
                      />
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{product.discount}%
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                        {product.badge && product.badge}
                      </div>
                      <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-gray-900 px-6 py-3 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                        Quick View
                      </button>
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault(); // cegah Link navigate
                            e.stopPropagation(); // cegah bubbling ke Link
                            handleAddToFavorites(product.id);
                        }}
                        disabled={addingFav === product.id}
                        className="absolute bottom-4 right-4 bg-white p-3 rounded-full z-99 shadow-lg hover:bg-red-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Heart className="w-5 h-5 text-gray-700 hover:text-red-500 transition" />
                      </button>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.rating ?? 0)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.rating} ({product.sales})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900 pointer-events-auto select-text">
                              $
                              {product.price -
                                (product.price * (product.discount ?? 0)) / 100}
                            </span>
                            <span className="text-sm text-gray-400 line-through pointer-events-auto select-text">
                              ${product.price}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.preventDefault(); // cegah Link navigate
                              e.stopPropagation(); // cegah bubbling ke Link
                              handleAddToCart(product.id);
                          }}
                          className="bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
              </Link>
            ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Get 20% Off Your First Order
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Subscribe to our newsletter and receive exclusive deals
          </p>
          <div className="flex gap-4 max-w-md mx-auto border border-white rounded-full">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full outline-none"
            />
            <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const { data: products, error } = await supabase.from("products").select("*");

  if (error) {
    console.error(error);
    return { props: { products: [] }, revalidate: 60 };
  }

  return { props: { products: products ?? [] }, revalidate: 60 };
}
