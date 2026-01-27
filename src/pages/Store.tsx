import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaTrash,
  FaTimes,
  FaSearch,
  FaStar,
  FaWhatsapp,
  FaBox,
  FaArrowRight
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Product, ProductCategory, OrderItem } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import logoImage from '../assets/spinergy_logo.png';

const CATEGORIES: { value: ProductCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Products', icon: '🛒' },
  { value: 'balls', label: 'Balls', icon: '🏓' },
  { value: 'blades', label: 'Blades', icon: '🏸' },
  { value: 'rubbers', label: 'Rubbers', icon: '🔴' },
  { value: 'accessories', label: 'Accessories', icon: '🎒' },
];

// Helper to get Google Drive direct image URL
const getGoogleDriveImageUrl = (url: string): string => {
  if (!url) return '';
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
  }
  return url;
};

const Store = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Cart state
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Checkout form
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    // Pre-fill user info if logged in
    if (user) {
      setCheckoutForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, images:product_images(*)')
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const featuredProducts = useMemo(() => products.filter(p => p.is_featured), [products]);

  // Cart functions
  const addToCart = (productId: string, quantity: number = 1) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const currentQty = newCart.get(productId) || 0;
      newCart.set(productId, currentQty + quantity);
      return newCart;
    });
    toast.success('Added to cart!');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      const newCart = new Map(prev);
      if (quantity <= 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, quantity);
      }
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      newCart.delete(productId);
      return newCart;
    });
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart(new Map());
  };

  const cartItems = useMemo(() => {
    const items: { product: Product; quantity: number }[] = [];
    cart.forEach((quantity, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        items.push({ product, quantity });
      }
    });
    return items;
  }, [cart, products]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.product.sale_price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    let count = 0;
    cart.forEach(qty => count += qty);
    return count;
  }, [cart]);

  // Checkout function
  const handleCheckout = async () => {
    if (!checkoutForm.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!checkoutForm.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare order items
      const orderItems: OrderItem[] = cartItems.map(item => {
        const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          product_category: item.product.category,
          quantity: item.quantity,
          unit_price: item.product.sale_price || item.product.price,
          total_price: (item.product.sale_price || item.product.price) * item.quantity,
          image_url: primaryImage?.image_url,
        };
      });

      // Create order in database
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          customer_name: checkoutForm.name,
          customer_phone: checkoutForm.phone,
          customer_email: checkoutForm.email || null,
          customer_address: checkoutForm.address || null,
          items: orderItems,
          subtotal: cartTotal,
          total: cartTotal,
          notes: checkoutForm.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Prepare WhatsApp message
      const orderDetails = cartItems.map(item => 
        `• ${item.product.name} (${item.product.category}) x${item.quantity} = Rs. ${((item.product.sale_price || item.product.price) * item.quantity).toLocaleString()}`
      ).join('\n');

      const whatsappMessage = encodeURIComponent(
        `🛒 *New Order from Spinergy Store*\n\n` +
        `📋 *Order #${order.order_number}*\n\n` +
        `👤 *Customer Details*\n` +
        `Name: ${checkoutForm.name}\n` +
        `Phone: ${checkoutForm.phone}\n` +
        (checkoutForm.email ? `Email: ${checkoutForm.email}\n` : '') +
        (checkoutForm.address ? `Address: ${checkoutForm.address}\n` : '') +
        `\n📦 *Order Items*\n${orderDetails}\n\n` +
        `💰 *Total: Rs. ${cartTotal.toLocaleString()}*\n\n` +
        (checkoutForm.notes ? `📝 Notes: ${checkoutForm.notes}\n\n` : '') +
        `Sent from Spinergy Store`
      );

      // Open WhatsApp with pre-filled message
      const whatsappNumber = '923001234567'; // Replace with actual Spinergy WhatsApp number
      window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank');

      toast.success('Order placed! Redirecting to WhatsApp...');
      clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProductImage = (product: Product) => {
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    return primaryImage ? getGoogleDriveImageUrl(primaryImage.image_url) : '';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-blue/20 to-purple-600/20 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={logoImage} alt="Spinergy" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Spinergy Store</h1>
              <p className="text-gray-400">Premium Table Tennis Equipment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-blue focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-2 ${
                    selectedCategory === cat.value
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative px-4 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition"
            >
              <FaShoppingCart />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Products */}
        {featuredProducts.length > 0 && selectedCategory === 'all' && !searchTerm && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaStar className="text-yellow-400" /> Featured Products
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => addToCart(product.id)}
                  onViewDetails={() => setSelectedProduct(product)}
                  imageUrl={getProductImage(product)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <FaBox className="mx-auto text-6xl text-gray-700 mb-4" />
            <h3 className="text-xl text-gray-400">No products found</h3>
            <p className="text-gray-600 mt-2">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">
              {selectedCategory === 'all' ? 'All Products' : CATEGORIES.find(c => c.value === selectedCategory)?.label}
              <span className="text-gray-500 text-lg ml-2">({filteredProducts.length})</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => addToCart(product.id)}
                  onViewDetails={() => setSelectedProduct(product)}
                  imageUrl={getProductImage(product)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:flex">
                {/* Product Image */}
                <div className="md:w-1/2 bg-gray-800">
                  {getProductImage(selectedProduct) ? (
                    <img
                      src={getProductImage(selectedProduct)}
                      alt={selectedProduct.name}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-full flex items-center justify-center text-gray-600">
                      <FaBox size={64} />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="md:w-1/2 p-6">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition"
                  >
                    <FaTimes size={24} />
                  </button>

                  <span className="inline-block px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300 mb-3">
                    {CATEGORIES.find(c => c.value === selectedProduct.category)?.icon} {selectedProduct.category}
                  </span>

                  <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h2>
                  {selectedProduct.brand && (
                    <p className="text-gray-400 mb-4">{selectedProduct.brand}</p>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-6">
                    {selectedProduct.sale_price && selectedProduct.sale_price < selectedProduct.price ? (
                      <>
                        <span className="text-3xl font-bold text-green-400">
                          Rs. {selectedProduct.sale_price.toLocaleString()}
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                          Rs. {selectedProduct.price.toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-red-500 text-white text-sm rounded">
                          {Math.round((1 - selectedProduct.sale_price / selectedProduct.price) * 100)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        Rs. {selectedProduct.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <p className="text-gray-400 mb-6">{selectedProduct.description}</p>
                  )}

                  {/* Specifications */}
                  {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-white mb-3">Specifications</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['speed', 'spin', 'control'].map(spec => {
                          const value = selectedProduct.specifications[spec];
                          if (typeof value !== 'number') return null;
                          return (
                            <div key={spec} className="bg-gray-800 rounded-lg p-3">
                              <div className="text-xs text-gray-500 uppercase">{spec}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-primary-blue h-2 rounded-full"
                                    style={{ width: `${value * 10}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold">{value}</span>
                              </div>
                            </div>
                          );
                        })}
                        {Object.entries(selectedProduct.specifications)
                          .filter(([key]) => !['speed', 'spin', 'control'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="bg-gray-800 rounded-lg p-3">
                              <div className="text-xs text-gray-500 uppercase">{key}</div>
                              <div className="text-white font-medium">{value}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Add to Cart */}
                  <button
                    onClick={() => {
                      addToCart(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-3 bg-primary-blue hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <FaShoppingCart /> Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-gray-900 z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaShoppingCart /> Your Cart ({cartCount})
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 text-gray-400 hover:text-white transition"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingCart className="mx-auto text-5xl text-gray-700 mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map(({ product, quantity }) => (
                      <div key={product.id} className="flex gap-4 bg-gray-800 rounded-lg p-3">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {getProductImage(product) ? (
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <FaBox />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{product.name}</h4>
                          <p className="text-gray-500 text-sm">{product.category}</p>
                          <p className="text-primary-blue font-bold">
                            Rs. {((product.sale_price || product.price) * quantity).toLocaleString()}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTrash />
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(product.id, quantity - 1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                            >
                              <FaMinus size={12} />
                            </button>
                            <span className="text-white w-8 text-center">{quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(product.id, quantity + 1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Total</span>
                    <span className="text-2xl font-bold text-white">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    Proceed to Checkout <FaArrowRight />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Checkout Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Checkout</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 text-gray-400 hover:text-white transition"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Checkout Form */}
              <div className="p-6 space-y-4">
                {/* Order Summary */}
                <div className="bg-gray-800 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-white mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    {cartItems.map(({ product, quantity }) => (
                      <div key={product.id} className="flex justify-between text-gray-400">
                        <span>{product.name} x{quantity}</span>
                        <span>Rs. {((product.sale_price || product.price) * quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-white font-bold pt-2 border-t border-gray-700">
                      <span>Total</span>
                      <span>Rs. {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="03XX-XXXXXXX"
                  />
                </div>

                <div>
                  <label className="label">Email (Optional)</label>
                  <input
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="label">Delivery Address (Optional)</label>
                  <textarea
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Your delivery address"
                  />
                </div>

                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Any special instructions..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FaWhatsapp size={20} /> Complete Order via WhatsApp
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your order will be sent to Spinergy via WhatsApp for confirmation
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-blue hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 md:hidden"
        >
          <FaShoppingCart size={24} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({
  product,
  onAddToCart,
  onViewDetails,
  imageUrl,
}: {
  product: Product;
  onAddToCart: () => void;
  onViewDetails: () => void;
  imageUrl: string;
}) => {
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-blue/50 transition group"
    >
      {/* Image */}
      <div
        onClick={onViewDetails}
        className="aspect-square bg-gray-900 relative cursor-pointer overflow-hidden"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <FaBox size={48} />
          </div>
        )}
        
        {/* Badges */}
        {product.is_featured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-black text-xs rounded font-bold flex items-center gap-1">
            <FaStar /> Featured
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-bold">
            {Math.round((1 - product.sale_price! / product.price) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <span className="text-xs text-gray-500 uppercase">{product.category}</span>
        <h3
          onClick={onViewDetails}
          className="font-bold text-white truncate cursor-pointer hover:text-primary-blue transition"
        >
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-sm text-gray-500">{product.brand}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-green-400">
                Rs. {product.sale_price!.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 line-through">
                Rs. {product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-white">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={onAddToCart}
          className="w-full mt-3 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
        >
          <FaShoppingCart /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

export default Store;
