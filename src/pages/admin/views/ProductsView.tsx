import useSWR from "swr";
import { useEffect, useState } from "react";
import { 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Tag,
  Layers,
  ImageOff
} from "lucide-react";
import router from "next/router";

/* =======================
   Types
======================= */
interface ProductsViewProps {
  initialPage?: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  image: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

interface ProductsApiResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/* =======================
   Utils
======================= */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/* =======================
   Component
======================= */
export default function ProductsView({ initialPage = 1 }: ProductsViewProps) {
  const [page, setPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /* Debounce search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Fetch products */
  const { data, isLoading, error, mutate } = useSWR<ProductsApiResponse>(
    `/api/admin/products?page=${page}&search=${encodeURIComponent(search)}&category=${category}&status=${status}`,
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

  // Calculate stats
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  /* Select handlers */
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  /* Action handlers */
  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Delete ${selectedProducts.length} product(s)?`)) return;
    
    try {
      await fetch('/api/admin/products/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts }),
      });
      setSelectedProducts([]);
      mutate();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    if(!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        mutate();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete product');
    }
  }

  const handleExport = () => {
    const csv = [
      ['Name', 'Price', 'Stock', 'Category', 'Status'],
      ...products.map(p => [p.name, p.price, p.stock, p.category, p.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> }
      : { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> };
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-700', text: 'Out of Stock' };
    if (stock < 10) return { color: 'bg-yellow-100 text-yellow-700', text: 'Low Stock' };
    return { color: 'bg-green-100 text-green-700', text: 'In Stock' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-500 mt-1">Manage your inventory and product catalog</p>
        </div>
        <button
        onClick={() => router.push('/admin/products/create')}
          className="flex items-center cursor-pointer gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{activeProducts}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{lowStockProducts}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="food">Food</option>
            <option value="books">Books</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <Layers className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <Package className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 border-2 cursor-pointer border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 text-gray-600" />
              <span className="hidden md:inline text-sm font-medium text-gray-700">Export</span>
            </button>

            {selectedProducts.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Delete ({selectedProducts.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected count */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">
              {selectedProducts.length} product(s) selected
            </span>
            <button
              onClick={() => setSelectedProducts([])}
              className="ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear
            </button>
          </div>
        )}
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Failed to load products</p>
            <p className="text-sm text-red-600 mt-1">Please try again or contact support</p>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {!isLoading && !error && (
        <>
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No products found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                products.map((product) => {
                  const statusBadge = getStatusBadge(product.status);
                  const stockBadge = getStockBadge(product.stock);
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        {/* Checkbox overlay */}
                        <div className="absolute top-3 left-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleSelectProduct(product.id)}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-lg"
                          />
                        </div>
                        {/* Status badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${statusBadge.color}`}>
                            {statusBadge.icon}
                            {product.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{product.description || 'No description'}</p>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {product.category}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-md font-medium ${stockBadge.color}`}>
                            {stockBadge.text}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Stock</p>
                            <p className="text-xl font-bold text-gray-900">{product.stock}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.location.href = `/admin/products/edit/${product.id}`}
                            className="flex-1 flex items-center cursor-pointer justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(product.id, product.name)}
                            className="p-2 hover:bg-red-50 cursor-pointer text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={products.length > 0 && selectedProducts.length === products.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const statusBadge = getStatusBadge(product.status);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleSelectProduct(product.id)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageOff className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">{product.stock}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                              {statusBadge.icon}
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4 text-gray-500" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {products.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-semibold">{total}</span> products
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
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
    </div>
  );
}