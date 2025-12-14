import { Heart, ShoppingCart, Star, SlidersHorizontal, Grid3x3, List, ChevronDown, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { Database } from "@/types/supabase";
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Product = Database["public"]["Tables"]["products"]["Row"];

export function useFavorite() {
    const [addingFav, setAdding] = useState<string | null>(null);

    const handleAddToFavorites = async (productId: string) => {
        setAdding(productId);
        try {
            const res = await fetch("/api/favorites/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ productId }),
            });

            const data = await res.json();
            if (!res.ok) toast.error(data.error || "Failed to add to favorites");
            else toast.success("Added to favorites!");
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        } finally {
            setAdding(null);
        }
    };

    return { addingFav, handleAddToFavorites };
}

export function useCart() {
  const [adding, setAdding] = useState<string | null>(null);

  const handleAddToCart = async (productId: string) => {
    setAdding(productId);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Failed to add to cart");
      else toast.success("Added to cart!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setAdding(null);
    }
  };

  return { adding, handleAddToCart };
}

export default function ProductPage() {
    const [viewMode, setViewMode] = useState('grid');

    type categoryKey = 'all' | 'electronics' | 'fashion' | 'accessories' | 'sports' | 'books';
    const [selectedCategory, setSelectedCategory] = useState<categoryKey | ''>('all');
    
    type sortKey = 'newest' | 'price-low' | 'price-high' | 'rating';
    const [sortBy, setSortBy] = useState<sortKey | ''>('');

    type priceRangeKey = 'under-500' | '500-1000' | 'over-1000';
    const [selectedPriceRange, setSelectedPriceRange] = useState<priceRangeKey[]>([]);

    type ratingKey = 2 | 3 | 4 | 5;
    const [selectedRating, setSelectedRating] = useState<ratingKey[]>([]);

    const [productCount, setProductCount] = useState({
        all: 0,
        electronics: 0,
        fashion: 0,
        accessories: 0,
        sports: 0,
        books: 0,
    });

    const sortOptions: Record<sortKey, { column: string; ascending: boolean }> = {
        newest: { column: 'date_added', ascending: false },
        'price-low': { column: 'price', ascending: true },
        'price-high': { column: 'price', ascending: false },
        rating: { column: 'rating', ascending: false },
    }

    const categoryOptions: Record<categoryKey, string> = {
        all: '',
        electronics: 'Electronics',
        fashion: 'Fashion',
        accessories: 'Accessories',
        sports: 'Sports',
        books: 'Books',
    }

    const priceOptions: Record<priceRangeKey, { min?: number; max?: number }> = {
        'under-500': { max: 500 },
        '500-1000': { min: 500, max: 1000 },
        'over-1000': { min: 1000 },
    }

    const [products, setProducts] = useState<Database["public"]["Tables"]["products"]["Row"][]>([]);

    useEffect(() => {
        async function fetchCount() {
            // total semua
            const { count: allCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true });

            // electronics
            const { count: electronicsCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category", "Electronics");

            // fashion
            const { count: fashionCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category", "Fashion");

            // accessories
            const { count: accessoriesCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category", "Accessories");
            
            const { count: sportsCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category", "Sports");

            const { count: booksCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category", "Books");

            // update state
            setProductCount({
                all: allCount ?? 0,
                electronics: electronicsCount ?? 0,
                fashion: fashionCount ?? 0,
                accessories: accessoriesCount ?? 0,
                sports: sportsCount ?? 0,
                books: booksCount ?? 0,
            });
        }
        fetchCount();
    }, []);

    const categories = [
        { id: 'all', name: 'All Products', count: productCount.all },
        { id: 'electronics', name: 'Electronics', count: productCount.electronics },
        { id: 'fashion', name: 'Fashion', count: productCount.fashion },
        { id: 'accessories', name: 'Accessories', count: productCount.accessories },
        { id: 'sports', name: 'Sports', count: productCount.sports },
        { id: 'books', name: 'Books', count: productCount.books }
    ];

    useEffect(() => {
        async function fetchProducts() {
            let query = supabase.from("products").select("*");

            if (sortBy && sortOptions[sortBy]) {
                const option = sortOptions[sortBy];
                query = query.order(option.column, { ascending: option.ascending });
            }

            if (selectedCategory && selectedCategory !== 'all') {
                query = query.eq("category", categoryOptions[selectedCategory]);
            }

            if (selectedPriceRange.length > 0) {
                const filterQuery: Product[] = [];
                for (const range of selectedPriceRange) {
                    const { min, max } = priceOptions[range];
                    let q = supabase.from("products").select("*");
                    if (min !== undefined) {
                        q = q.gte("price", min);
                    }
                    if (max !== undefined) {
                        q = q.lte("price", max);
                    }
                    const { data, error } = await q;

                    if (error) console.error(error);
                    else if (data) filterQuery.push(...data);
                }

                const { data, error } = await query;
                if (error) console.error(error);
                else {
                    const filtered = data?.filter((p: Product) => selectedPriceRange.some((range) => {
                        const { min, max } = priceOptions[range as priceRangeKey];
                        return (min === undefined || p.price >= min) && (max === undefined || p.price <= max);
                    }));
                    setProducts(filtered || []);
                    return;
                }
            }

            if (selectedRating.length > 0) {
                const minRating = Math.min(...selectedRating);
                query = query.gte('rating', minRating);
            }

            const { data, error } = await query;

            if (error) {
                console.error(error);
            } else {
                setProducts(data);
            }
        }
        fetchProducts();
    }, [sortBy, selectedCategory, selectedPriceRange, selectedRating]);

    const { adding, handleAddToCart } = useCart();

    const { addingFav, handleAddToFavorites } = useFavorite();

    // const [adding, setAdding] = useState<string | null>(null); // track productId yang sedang ditambah

    // const handleAddToCart = async (productId: string) => {
    //     setAdding(productId);
    //     try {
    //         const res = await fetch("/api/cart/add", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             credentials: "include",
    //             body: JSON.stringify({ productId, quantity: 1 }),
    //         });

    //         const data = await res.json();
    //         if (!res.ok) {
    //             toast.error(data.error || "Failed to add to cart");
    //         } else {
    //             toast.success("Added to cart!");
    //         }
    //     } catch (err) {
    //         console.error(err);
    //         toast.error("Something went wrong");
    //     } finally {
    //         setAdding(null);
    //     }
    // };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white mt-16">
                <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/" className="text-gray-500 hover:text-blue-600 cursor-pointer transition">Home</Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900 font-medium">Products</span>
                </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl p-6 sticky top-8">
                            {/* Categories */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5" />
                                Categories
                                </h3>
                                <div className="space-y-2">
                                {categories.map((cat) => (
                                    <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id as categoryKey)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                                        selectedCategory === cat.id
                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                    >
                                    <span>{cat.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        selectedCategory === cat.id
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                    }`}>
                                        {cat.count}
                                    </span>
                                    </button>
                                ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-8 pb-8 border-b">
                                <h3 className="text-base font-semibold text-gray-900 mb-4">Price Range</h3>
                                <div className="space-y-3">
                                    {(['under-500','500-1000','over-1000'] as priceRangeKey[]).map((range) => (
                                    <label key={range} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedPriceRange.includes(range)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                            setSelectedPriceRange([...selectedPriceRange, range]);
                                            } else {
                                            setSelectedPriceRange(selectedPriceRange.filter(r => r !== range));
                                            }
                                        }}
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                        {range === 'under-500' ? '$0 - $500' : range === '500-1000' ? '$500 - $1,000' : '> $1,000'}
                                        </span>
                                    </label>
                                    ))}
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-4">Rating</h3>
                                <div className="space-y-3">
                                {[5, 4, 3, 2].map((rating) => (
                                    <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                        checked={selectedRating.includes(rating as ratingKey)} 
                                        onChange={(e) => {
                                            const r = rating as ratingKey;
                                            if (e.target.checked) {
                                                setSelectedRating([...selectedRating, r]);
                                            } else {
                                                setSelectedRating(selectedRating.filter(r => r !== r));
                                            }
                                        }}
                                    />
                                    <div className="flex items-center gap-1">
                                        {[...Array(rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                        <span className="text-sm text-gray-700 ml-1">& up</span>
                                    </div>
                                    </label>
                                ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Top Bar */}
                        <div className="bg-white rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                            {/* <p className="text-sm text-gray-500 mt-1">Showing 1-3 of 156 results</p> */}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || value === 'newest' || value === 'price-low' || value === 'price-high' || value === 'rating') {
                                        setSortBy(value);
                                    }
                                }}
                                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                            >
                                <option value="" disabled>
                                    Sort by
                                </option>
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Highest Rating</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* View Mode */}
                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-colors ${
                                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <Grid3x3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-colors ${
                                viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                            </div>
                        </div>
                        </div>

                        {/* Products Grid */}
                        <div className={`grid gap-6 ${
                        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                        }`}>
                        {products.map((product) => (
                            <Link
                                href={`/products/${product.id}/${product.name}`}
                                key={product.id}
                                className={`bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer ${
                                    viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
                                }`}
                            >
                                {/* Image */}
                                <div className={`relative overflow-hidden bg-gray-100 ${
                                    viewMode === 'list' ? 'w-64 flex-shrink-0' : 'aspect-square'
                                }`}>
                                    <Image
                                    width={500}
                                    height={500}
                                    src={product.image ?? '/images/placeholder.png'}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    
                                    {product.discount && product.discount > 0 && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                                        SALE
                                    </div>
                                    )}

                                    <button
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.preventDefault(); // cegah Link navigate
                                            e.stopPropagation(); // cegah bubbling ke Link
                                            handleAddToFavorites(product.id);
                                        }}
                                        disabled={addingFav === product.id}
                                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors group/heart opacity-0 group-hover:opacity-100 cursor-pointer"
                                    >
                                        <Heart className="w-5 h-5 text-gray-600 group-hover/heart:text-red-500 group-hover/heart:fill-red-500 transition-all" />
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <span className="text-xs font-medium text-blue-600 mb-2">{product.category}</span>
                                    
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {product.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center">
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
                                        <span className="text-sm text-gray-600">{product.rating}</span>
                                        <span className="text-sm text-gray-400">({product.sales})</span>
                                    </div>

                                    <div className="text-xs text-gray-500 mb-4">
                                    {product.sales} sold • Stock: {product.stock}
                                    </div>

                                    <div className="mt-auto">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-2xl font-bold text-gray-900">
                                            $ {product?.discount ?? 0 > 0 ? product.price - (product.price * (product.discount ?? 0)) / 100 : product.price}
                                            </span>
                                            <span className="text-sm text-gray-400 line-through">
                                                {product?.discount ?? 0 > 0 ? `$ ${product.price}` : ''}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                e.preventDefault(); // cegah Link navigate
                                                e.stopPropagation(); // cegah bubbling ke Link
                                                handleAddToCart(product.id);
                                            }}
                                            disabled={adding === product.id}
                                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                            {adding === product.id ? "Adding..." : "Add to Cart"}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex justify-center">
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                                Previous
                                </button>
                                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">1</button>
                                <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">2</button>
                                <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">3</button>
                                <span className="px-2 text-gray-400">...</span>
                                <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">10</button>
                                <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                                Next
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}