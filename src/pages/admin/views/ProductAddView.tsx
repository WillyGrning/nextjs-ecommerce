import {
  ArrowLeft,
  DollarSign,
  FileText,
  ImageIcon,
  Loader,
  Package,
  Save,
  Tag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Image from "next/image";
import router from "next/router";
import { useEffect, useState } from "react";
import { Category } from "@/types/category";

interface FormData {
  name: string;
  image: string;
  price: number;
  category: string;
  stock: number;
  status: "active" | "inactive";
  description: string;
}

export default function ProductAddView() {
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    image: "",
    price: 0,
    category: "",
    stock: 0,
    status: "active",
    description: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    image: "",
    price: "",
    stock: "",
    category: "",
  });

  const validateForm = () => {
    const newErrors = {
      name: "",
      image: "",
      price: "",
      stock: "",
      category: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Product added successfully!");
        router.push("/admin/products");
      } else {
        alert(data.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Add error:", error);
      alert("Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);

      try {
        const res = await fetch("/api/admin/categories");

        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data: Category[] = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Fetch categories error:", error);
        alert("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/products")}
            className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
            <p className="text-gray-500 mt-1">Add new product</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Product Image
              </label>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 border-2 border-dashed border-gray-300">
                {formData.image ? (
                  <Image
                    width={200}
                    height={200}
                    src={formData.image}
                    alt="Product"
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Image URL"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value });
                  setImageError(false);
                }}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter a public image URL
              </p>

              {/* Error message */}
              {imageError && (
                <p className="text-xs text-red-500">
                  Failed to load image. Please check the URL.
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                  errors.name ? "border-red-500" : "border-gray-200"
                } rounded-xl focus:outline-none focus:border-indigo-500 transition-all`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all resize-none"
                placeholder="Enter product description"
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                    errors.price ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:border-indigo-500 transition-all`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.price}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Stock *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                    errors.stock ? "border-red-500" : "border-gray-200"
                  } rounded-xl focus:outline-none focus:border-indigo-500 transition-all`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.stock}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                  errors.category ? "border-red-500" : "border-gray-200"
                } rounded-xl focus:outline-none focus:border-indigo-500 transition-all`}
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select category"}
                </option>

                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.category}
                </p>
              )}
            </div>

            {/* Status Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Product Status
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    status:
                      formData.status === "active" ? "inactive" : "active",
                  })
                }
                className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                  formData.status === "active"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {formData.status === "active" ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
                <div className="text-left">
                  <p className="font-semibold">
                    {formData.status === "active" ? "Active" : "Inactive"}
                  </p>
                  <p className="text-sm opacity-75">
                    {formData.status === "active"
                      ? "Product is visible to customers"
                      : "Product is hidden from customers"}
                  </p>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                className="flex-1 px-6 py-3 border-2 cursor-pointer border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 flex items-center cursor-pointer justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
