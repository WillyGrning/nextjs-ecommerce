import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, X, Plus, Minus, ArrowRight, Menu, User, Heart, Settings, LogOut, Eye, Trash2, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
// import { supabase } from "../../../lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import toast from "react-hot-toast";

type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type FavoriteItem = Database["public"]["Tables"]["favorites"]["Row"];

type CartItemWithProduct = CartItem & {
  products: Pick<ProductRow, "id" | "name" | "image" | "price"> | null;
};

type FavItemWithProduct = FavoriteItem & {
  products: Pick<ProductRow, "id" | "name" | "image" | "price" | "discount" | "stock" > | null;
};

export default function Navbar({ href }: { href?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [cartItem, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [favItem, setFavItems] = useState<FavItemWithProduct[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null); // track productId yang sedang ditambah

  const removeFromFav = async (id: string) => {
    try {
      const response = await fetch('/api/favorites/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id })
      });

      const result = await response.json();

      console.log('✅ Delete result:', result);

      if (result.error || !result.success) {
        console.error('Error removing item:', result.error);
        setNotification('Failed to remove item');
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Update UI only if delete succeeded
      const item = favItem.find(item => item.id === id);
      setCartItems(items => items.filter(item => item.id !== id));
      setCartCount(prev => Math.max(prev - 1, 0));

      if (item) {
        setNotification(`${item.products?.name} removed from favorite`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setNotification('Failed to remove item');
      setTimeout(() => setNotification(null), 3000);
    }
  }

  const handleAddCart = async (productId: string) => {
    setAdding(productId);

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add to cart");
      } else {
        toast.success("Added to cart!");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setAdding(null);
    }
  }

  const removeFromCart = async (id: string) => {
    try {
      const response = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id })
      });

      const result = await response.json();

      console.log('✅ Delete result:', result);

      if (result.error || !result.success) {
        console.error('Error removing item:', result.error);
        setNotification('Failed to remove item');
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Update UI only if delete succeeded
      const item = cartItem.find(item => item.id === id);
      setCartItems(items => items.filter(item => item.id !== id));
      setCartCount(prev => Math.max(prev - 1, 0));
      
      if (item) {
        setNotification(`${item.products?.name} removed from cart`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setNotification('Failed to remove item');
      setTimeout(() => setNotification(null), 3000);
    }
  }

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    )
  }

  const finalPathname = pathname === href? "#" : href;

   console.log("Session user:", session?.user?.id);

  // useEffect(() => {
  //     if (!session) return; // tunggu session ready

  //     const fetchCartCount =  async () => {
  //       const userId = session.user.id;
  //       const { count, error } = await supabase
  //         .from("cart_items")
  //         .select("id, carts!cart_items_cart_id_fkey!inner(id, user_id)", {
  //           count: "exact",
  //           head: true,
  //         })
  //         .eq("carts.user_id", userId);
        
  //       if (error) {
  //         setCartCount(0);
  //       } else {
  //         setCartCount(count || 0);
  //       }
  //     };

  //     fetchCartCount();
  // }, [session]);

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!session?.user?.id) {
        setCartItems([]);
        setCartCount(0);
        return;
      }

      try {
        const response = await fetch('/api/cart/fetch');
        const result = await response.json();

        console.log('📦 Fetched cart:', result);

        if (result.error) {
          console.error('Error fetching cart:', result.error);
          setCartItems([]);
          setCartCount(0);
          return;
        }

        setCartItems(result.items);
        setCartCount(result.count);
      } catch (error) {
        console.error('Error:', error);
        setCartItems([]);
        setCartCount(0);
      }
    };

    fetchCartItems();
  }, [session]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user?.id) {
        setFavItems([]);
        setFavCount(0);
        return;
      }

      try {
        const response = await fetch('/api/favorites/fetch');
        const result = await response.json();

        console.log('📦 Fetched favorites:', result);

        if (result.error) {
          console.error('Error fetching favorite:', result.error);
          setFavItems([]);
          setFavCount(0);
          return;
        }

        setFavItems(result.items);
        setFavCount(result.count);
      } catch (error) {
        console.error('Error:', error);
        setFavItems([]);
        setFavCount(0);
      }
    };

    fetchFavorites();
  }, [session]);

  const subtotal = cartItem.reduce((sum, item) => sum + ((item.products?.price ?? 0) * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 15;
  const total = subtotal + shipping;

  const favTotal = favItem.reduce((sum, item) => {
    const price = item.products?.price ?? 0;
    const discount = item.products?.discount ?? 0;
    const finalPrice = discount > 0 
      ? price - (price * discount) / 100
      : price;

    return sum + finalPrice;
  }, 0).toFixed(2);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ShopHub
            </h1>
            <div className="hidden md:flex gap-6">
              <Link
                href={finalPathname ? "#" : "/"}
                className="text-gray-700 hover:text-blue-600 transition relative group"
              >
                Home
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href={finalPathname ? "#" : "/products"}
                className="text-gray-700 hover:text-blue-600 transition relative group"
              >
                Products
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href={finalPathname ? "#" : "/categories"}
                className="text-gray-700 hover:text-blue-600 transition relative group"
              >
                Categories
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition relative group"
              >
                Deals
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full duration-300 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-gray-300">
              <Search className="w-4 h-4 text-gray-400 transition-colors duration-300 focus-within:text-blue-600" />
              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>

            {/* User Profile */}
            <div 
              className="relative"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition">
                <User className="w-5 h-5 text-gray-700" />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                  {/* User Info */}
                  <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {session ? session.user?.name?.split(' ')[0] : "Guest"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{session ? session.user?.name : "Guest"}</p>
                        <p className="text-sm text-gray-500 truncate">{session ? session.user?.email : "Guest@gmail.com"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button onClick={() => session ? router.push("/user/setting") : router.push("/auth/login")} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <Settings className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Settings</p>
                        <p className="text-xs text-gray-500">Account preferences</p>
                      </div>
                    </button>

                    <button onClick={() => session ? router.push("/orders") : router.push("/auth/login")} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <ShoppingBag className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">My Orders</p>
                        <p className="text-xs text-gray-500">Track your purchases</p>
                      </div>
                    </button>

                    <button onClick={() => session ? signOut({ callbackUrl: "/"}) : router.push("/auth/login")} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors group border-t border-gray-100 cursor-pointer">
                      <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                      <span className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                        { session ? "Logout" : "Login" }
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Favorites */}
            <div
              className="relative"
              onMouseEnter={() => setFavOpen(true)}
              onMouseLeave={() => setFavOpen(false)}
            >
              {/* Notification Toast */}
              {notification && (
                <div className="fixed top-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] animate-slideIn flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">{notification}</span>
                </div>
              )}

              <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition">
                <Heart className="w-5 h-5 text-gray-700" />
                <span className="absolute top-0 right-0 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold shadow-md">
                  {session ? favCount : 0}
                </span>
              </button>

              {/* Dropdown Menu */}
              {favOpen && (
                <div className="absolute right-0 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                  {/* Header */}
                  <div className="px-5 py-4 bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        <h3 className="font-bold text-gray-900 text-lg">My Favorites</h3>
                      </div>
                      <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full font-semibold shadow-sm">
                        {favItem.length} {favItem.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Your wishlist items</p>
                  </div>

                  {/* Favorites */}
                  <div className={`${favCount > 3 ? 'max-h-[400px] overflow-y-auto' : ''} divide-y divide-gray-100`}>
                    {favCount > 0 ? (
                      favItem.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gradient-to-r hover:from-pink-50 hover:to-transparent transition-all group/item">
                          <div className="flex gap-4">
                            {/* Image */}
                            <div className="relative flex-shrink-0">
                              <Image
                                width={30}
                                height={30}
                                src={item.products?.image ?? "/images/placeholder.png"}
                                alt={item.products?.name ?? ""}
                                className="w-24 h-24 object-cover rounded-xl shadow-md group-hover/item:shadow-lg transition-shadow"
                              />
                              {(item.products?.discount ?? 0 ) > 0 && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
                                  -{item.products?.discount}%
                                </div>
                              )}
                              {!item.products?.stock && (
                                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">Out of Stock</span>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
                                  {item.products?.name}
                                </h4>
                                <button 
                                  onClick={() => removeFromFav(item.id)}
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg flex-shrink-0 h-fit"
                                  title="Remove from favorites"
                                >
                                  <X className="w-4 h-4 text-red-600 cursor-pointer"/>
                                </button>
                              </div>

                              {/* Stock Status */}
                              <div className="mb-2">
                                {item.products?.stock ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-semibold">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-semibold">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    Out of Stock
                                  </span>
                                )}
                              </div>

                              {/* Price and Actions */}
                              <div className="mt-auto flex items-end justify-between">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 text-lg">
                                    $
                                    { (item.products?.discount ?? 0) > 0
                                      ? (item.products?.price ?? 0) - ((item.products?.price ?? 0) * (item.products?.discount ?? 0)) / 100
                                      : item.products?.price
                                    }
                                  </span>
                                  {/* {item.originalPrice > item.price && ( */}
                                  <span className="text-xs text-gray-400 line-through">
                                    {item.products?.discount ?? 0 > 0 ? `$ ${item.products?.price}` : ''}
                                  </span>
                                  {/* )} */}
                                </div>

                                {/* Actions Buttons */}
                                <div className="flex gap-2">
                                  <Link
                                    key = {item.products?.id}
                                    href = {`/products/${item.products?.id}/${item.products?.name}`}
                                  >
                                    <button
                                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer group/view"
                                      title="Quick view"
                                    >
                                      <Eye className="w-4 h-4 text-gray-600 group-hover/view:text-blue-600 transition-colors" />
                                    </button>
                                  </Link>
                                  <button
                                    disabled={!item.products?.stock || adding === item.products?.id}
                                    className="p-2 hover:bg-green-50 rounded-lg cursor-pointer transition-colors group/cart disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Add to cart"
                                    onClick={() => handleAddCart(item.products?.id ?? '')}
                                  >
                                    <ShoppingCart className="w-4 h-4 text-gray-600 group-hover/cart:text-green-600 transition-colors" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <Heart className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium text-lg mb-1">No favorites yet</p>
                        <p className="text-gray-400 text-sm">Start adding items you love!</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {favItem.length > 0 && (
                    <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white px-5 py-4">
                      <div className="space-y-3">
                        {/* Stats */}
                        <div className="flex justify-between text-sm bg-white rounded-lg p-3 border border-gray-100">
                          <div className="text-center flex-1 border-r border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">Total Items</p>
                            <p className="font-bold text-gray-900">{favItem.length}</p>
                          </div>
                          <div className="text-center flex-1 border-r border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">In Stock</p>
                            <p className="font-bold text-green-600">
                              {favItem.filter(item => item.products?.stock).length}
                            </p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-gray-500 text-xs mb-1">Total Value</p>
                            <p className="font-bold text-blue-600">
                              ${favTotal}
                            </p>
                          </div>
                        </div>

                        {/* Actions Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm">
                            <ShoppingCart className="w-4 h-4" />
                            Add All to Cart
                          </button>
                          <button
                            // onClick={() => router.push("/carts")} 
                            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl border-2 border-gray-200 transition-all text-sm cursor-pointer"
                          >
                            View All
                          </button>
                        </div>

                        {/* Clear All Button */}
                        <button
                          className="w-full text-red-600 hover:text-red-700 font-medium text-sm py-2 flex items-center justify-center gap-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Favorites
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <div
              className="relative"
              onMouseEnter={() => setCartOpen(true)}
              onMouseLeave={() => setCartOpen(false)}
            >
              {/* Notification Toast */}
              {notification && (
                <div className="fixed top-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] animate-slideIn flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">{notification}</span>
                </div>
              )}

              <button className="p-2 hover:bg-gray-100 rounded-full transition relative cursor-pointer">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {session ? cartCount : 0}
                </span>
              </button>

              {/* Dropdown Menu */}
              {cartOpen && (
                <div className="absolute right-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                  {/* Header */}
                  <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-lg">Shopping Cart</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                        {session ? cartCount + (" Items") : 0 + (" Item")} 
                      </span>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className={`${cartCount > 3 ? 'max-h-80 overflow-y-auto' : ''} divide-y divide-gray-100`}>
                    {cartCount > 0 ? (
                      cartItem.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex gap-3">
                            {/* Image */}
                            <div className="relative flex-shrink-0">
                              <Image
                                width={30}
                                height={30}
                                src={item.products?.image ?? "/images/placeholder.png"}
                                alt={item.products?.name ?? ""}
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">{item.products?.name}</h4>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-lg cursor-pointer"
                                >
                                  <X className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>

                              <div className="flex gap-2 mb-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"></span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"></span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">${ (item.products?.price ?? 0).toFixed(2) }</span>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-1 py-1">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="p-1 hover:bg-white rounded transition-colors"
                                  >
                                    <Minus className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <span className="text-sm font-semibold text-gray-900 min-w-[20px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="p-1 hover:bg-white rounded transition-colors"
                                  >
                                    <Plus className="w-3 h-3 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            </div> 
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Your cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {cartCount > 0 && (
                    <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                      {/* Price Summary */}
                      <div className="px-5 py-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-semibold text-gray-900">
                            {shipping === 0 ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              `$${shipping.toFixed(2)}`
                            )}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between">
                          <span className="font-bold text-gray-900">Total</span>
                          <span className="font-bold text-xl text-blue-600">${total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-5 pb-4 space-y-2">
                        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                          Checkout
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push("/carts")} 
                          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border-2 border-gray-200 transition-all cursor-pointer"
                        >
                          View Cart
                        </button>
                      </div>

                      {/* Free Shipping Banner */}
                      {shipping > 0 && (
                        <div className="px-5 pb-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-blue-700 text-center">
                              💡 Add <strong>${(500 - subtotal).toFixed(2)}</strong> more for FREE shipping!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              className="md:hidden p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
