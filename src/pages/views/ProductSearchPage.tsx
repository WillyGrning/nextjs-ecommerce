import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import {
  Search,
  Filter,
  Grid3x3,
  List,
  SlidersHorizontal,
  Package,
  TrendingUp,
  Star,
  ShoppingCart,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCart } from "@/pages/products";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  status: string;
  sold?: number;
}

interface ProductsApiResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function ProductSearchPage() {
  const router = useRouter();
  const { q } = router.query;

  const [searchInput, setSearchInput] = useState((q as string) || "");
  // ✅ Initialize state directly from query params
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const { data, isLoading, error } = useSWR<ProductsApiResponse>(
    `/api/products/search?page=${page}&search=${encodeURIComponent(
      searchInput
    )}&category=${category}&status=${status}&sortBy=${sortBy}`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const limit = data?.meta?.limit ?? 12;
  const totalPages = Math.ceil(total / limit);

  // Filter by price range
  const filteredProducts = products.filter((p) => {
    if (priceRange.min && p.price < parseFloat(priceRange.min)) return false;
    if (priceRange.max && p.price > parseFloat(priceRange.max)) return false;
    return true;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const clearFilters = () => {
    setCategory("");
    setStatus("");
    setPriceRange({ min: "", max: "" });
    setSortBy("name");
  };

  const hasActiveFilters =
    category || status || priceRange.min || priceRange.max || sortBy !== "name";

  return (
    <div className="min-h-screen mt-16 bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hasil Pencarian</h1>
            <p className="text-gray-500 mt-1">
              {searchInput
                ? `Menampilkan hasil pencarian untuk "${searchInput}"`
                : "All products"}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 cursor-pointer px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500 transition-all text-sm"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500 transition-all text-sm"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500 transition-all text-sm"
            >
              <option value="name">Name (A-Z)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="stock">Stock</option>
            </select>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                className="w-28 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                className="w-28 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 cursor-pointer py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Hapus Filter
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Menemukan{" "}
              <span className="font-semibold text-gray-900">
                {filteredProducts.length}
              </span>{" "}
              produk
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">Failed to load products</p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada produk ditemukan
                </h3>
                <p className="text-gray-500">
                  Coba sesuaikan pencarian atau filter Anda
                </p>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page <span className="font-semibold">{page}</span> of{" "}
                      <span className="font-semibold">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const { adding, handleAddToCart } = useCart();

  return (
    <div
      key={product.id}
      onClick={() => (window.location.href = `/products/${product.id}`)}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.image ? (
          <Image
            width={400}
            height={400}
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              product.status === "active"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {product.status}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="flex-1 bg-white cursor-pointer hover:bg-gray-50 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-lg transition-colors">
            <Eye className="w-4 h-4" />
            Lihat
          </button>
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault(); // cegah Link navigate
              e.stopPropagation(); // cegah bubbling ke Link
              handleAddToCart(product.id);
            }}
            disabled={!product.stock || adding === product.id}
            className="flex-1 bg-indigo-600 cursor-pointer hover:bg-indigo-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-lg transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {adding === product.id ? "Menambahkan..." : "Tambah"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
            {product.category}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(product.price)}
            </p>
            <p className="text-xs text-gray-500">Stok: {product.stock}</p>
          </div>
          {product.sold && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Sold</p>
              <p className="text-sm font-semibold text-green-600">
                {product.sold}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductListItem({ product }: { product: Product }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const { adding, handleAddToCart } = useCart();

  return (
    <div
      key={product.id}
      onClick={() => (window.location.href = `/products/${product.id}`)}
      className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex gap-6">
        {/* Image */}
        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {product.image ? (
            <Image
              width={400}
              height={400}
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {product.category}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    product.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {product.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Stock</p>
                <p className="text-lg font-semibold text-gray-700">
                  {product.stock}
                </p>
              </div>
              {product.sold && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sold</p>
                  <p className="text-lg font-semibold text-green-600">
                    {product.sold}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  (window.location.href = `/products/${product.id}`)
                }
                className="px-4 py-2 border-2 border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                Lihat
              </button>
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault(); // cegah Link navigate
                  e.stopPropagation(); // cegah bubbling ke Link
                  handleAddToCart(product.id);
                }}
                disabled={!product.stock || adding === product.id}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                {adding === product.id ? "Menambahkan..." : "Tambah ke Keranjang"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
