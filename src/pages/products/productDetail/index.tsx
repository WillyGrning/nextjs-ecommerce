import React, { useState } from 'react';
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function ProductDetailPage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('black');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop'
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'black', hex: '#000000' },
    { name: 'white', hex: '#FFFFFF' },
    { name: 'navy', hex: '#1e3a8a' },
    { name: 'gray', hex: '#6b7280' }
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over $100' },
    { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' }
  ];

  const specs = [
    { label: 'Material', value: 'Premium Cotton Blend' },
    { label: 'Weight', value: '0.5 kg' },
    { label: 'Dimensions', value: '25 x 15 x 8 cm' },
    { label: 'Care', value: 'Machine washable' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
                <img
                  src={images[selectedImage]}
                  alt="Product"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <button
                  onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-xl overflow-hidden transition-all ${
                      selectedImage === idx
                        ? 'ring-4 ring-blue-600 scale-95'
                        : 'ring-2 ring-gray-200 hover:ring-gray-300'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>Premium Collection</span>
                  <span>•</span>
                  <span>New Arrival</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Premium Wireless Headphones</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-gray-600">4.9 (328 reviews)</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-gray-900">$299.00</span>
                  <span className="text-2xl text-gray-400 line-through">$399.00</span>
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">25% OFF</span>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">
                Experience superior sound quality with our premium wireless headphones. Featuring active noise cancellation, 
                40-hour battery life, and premium comfort materials for all-day wear.
              </p>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Color</label>
                <div className="flex gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        selectedColor === color.name
                          ? 'border-blue-600 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selectedColor === color.name && color.hex === '#FFFFFF' && (
                        <Check className="w-6 h-6 mx-auto text-gray-800" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Size</label>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSize === size
                          ? 'bg-gray-900 text-white scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-5 py-3 bg-gray-50 hover:bg-gray-100 font-semibold transition-colors"
                    >
                      −
                    </button>
                    <span className="px-8 py-3 font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-5 py-3 bg-gray-50 hover:bg-gray-100 font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-gray-600">Only 12 items left</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl">
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`px-6 py-4 rounded-xl border-2 transition-all ${
                    isFavorite
                      ? 'bg-red-50 border-red-300 text-red-600'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-600' : ''}`} />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                {features.map((feature, idx) => (
                  <div key={idx} className="text-center">
                    <feature.icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold text-sm text-gray-900">{feature.title}</h3>
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h3>
                  <div className="space-y-4">
                    {specs.map((spec, idx) => (
                      <div key={idx} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="font-semibold text-gray-700">{spec.label}</span>
                        <span className="text-gray-600">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Features */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
                  <ul className="space-y-3">
                    {[
                      'Active Noise Cancellation Technology',
                      'Premium Audio Drivers for Rich Sound',
                      '40-Hour Battery Life',
                      'Fast Charging Support',
                      'Bluetooth 5.0 Connectivity',
                      'Foldable Design with Carrying Case'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
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