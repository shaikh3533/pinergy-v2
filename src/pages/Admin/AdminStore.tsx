import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaBox,
  FaTimes,
  FaSave,
  FaTableTennis,
  FaStar,
  FaTag,
  FaCheck,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { Product, ProductImage, ProductCategory, ProductSpecifications } from '../../lib/supabase';
import AdminLayout from '../../components/Admin/AdminLayout';

const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'balls', label: 'Balls', icon: '🏓' },
  { value: 'blades', label: 'Blades (Rackets)', icon: '🏸' },
  { value: 'rubbers', label: 'Rubbers', icon: '🔴' },
  { value: 'accessories', label: 'Accessories', icon: '🎒' },
];

const DEFAULT_SPECS: Record<ProductCategory, ProductSpecifications> = {
  balls: { speed: 5, spin: 5, control: 5, quantity: '3 balls/pack' },
  blades: { speed: 5, spin: 5, control: 5, ply: '5-ply', weight: '85g' },
  rubbers: { speed: 5, spin: 5, control: 5, thickness: '2.0mm' },
  accessories: {},
};

// Helper to get Google Drive direct image URL
const getGoogleDriveImageUrl = (url: string): string => {
  if (!url) return '';
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
  }
  return url;
};

const AdminStore = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProductCategory | 'all'>('all');
  
  // Product form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'balls' as ProductCategory,
    brand: '',
    description: '',
    price: 0,
    sale_price: 0,
    stock_quantity: 0,
    is_available: true,
    is_featured: false,
    specifications: {} as ProductSpecifications,
  });
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, images:product_images(*)')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'balls',
      brand: '',
      description: '',
      price: 0,
      sale_price: 0,
      stock_quantity: 0,
      is_available: true,
      is_featured: false,
      specifications: { ...DEFAULT_SPECS.balls },
    });
    setImageUrls(['']);
    setPrimaryImageIndex(0);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price || 0,
      stock_quantity: product.stock_quantity,
      is_available: product.is_available,
      is_featured: product.is_featured,
      specifications: product.specifications || {},
    });
    const images = product.images || [];
    setImageUrls(images.length > 0 ? images.map(img => img.image_url) : ['']);
    setPrimaryImageIndex(images.findIndex(img => img.is_primary) || 0);
    setShowForm(true);
  };

  const handleCategoryChange = (category: ProductCategory) => {
    setFormData({
      ...formData,
      category,
      specifications: { ...DEFAULT_SPECS[category], ...formData.specifications },
    });
  };

  const handleSpecChange = (key: string, value: string | number) => {
    setFormData({
      ...formData,
      specifications: { ...formData.specifications, [key]: value },
    });
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length > 0 ? newUrls : ['']);
    if (primaryImageIndex >= newUrls.length) {
      setPrimaryImageIndex(Math.max(0, newUrls.length - 1));
    }
  };

  const updateImageUrl = (index: number, url: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = url;
    setImageUrls(newUrls);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    const validImageUrls = imageUrls.filter(url => url.trim());

    try {
      if (editingProduct) {
        // Update product
        const { error: productError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            category: formData.category,
            brand: formData.brand || null,
            description: formData.description || null,
            price: formData.price,
            sale_price: formData.sale_price || null,
            stock_quantity: formData.stock_quantity,
            is_available: formData.is_available,
            is_featured: formData.is_featured,
            specifications: formData.specifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id);

        if (productError) throw productError;

        // Delete old images and insert new ones
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', editingProduct.id);

        if (validImageUrls.length > 0) {
          const imageInserts = validImageUrls.map((url, index) => ({
            product_id: editingProduct.id,
            image_url: url,
            is_primary: index === primaryImageIndex,
            display_order: index,
          }));
          await supabase.from('product_images').insert(imageInserts);
        }

        toast.success('Product updated successfully!');
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            category: formData.category,
            brand: formData.brand || null,
            description: formData.description || null,
            price: formData.price,
            sale_price: formData.sale_price || null,
            stock_quantity: formData.stock_quantity,
            is_available: formData.is_available,
            is_featured: formData.is_featured,
            specifications: formData.specifications,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Insert images
        if (validImageUrls.length > 0 && newProduct) {
          const imageInserts = validImageUrls.map((url, index) => ({
            product_id: newProduct.id,
            image_url: url,
            is_primary: index === primaryImageIndex,
            display_order: index,
          }));
          await supabase.from('product_images').insert(imageInserts);
        }

        toast.success('Product created successfully!');
      }

      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  const toggleAvailability = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);

    if (!error) {
      fetchProducts();
      toast.success(`Product ${product.is_available ? 'hidden' : 'shown'}`);
    }
  };

  const filteredProducts = activeTab === 'all' 
    ? products 
    : products.filter(p => p.category === activeTab);

  const getCategoryIcon = (category: ProductCategory) => {
    return CATEGORIES.find(c => c.value === category)?.icon || '📦';
  };

  return (
    <AdminLayout title="Store Management" subtitle="Manage products and inventory">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'all'
              ? 'bg-primary-blue text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Products ({products.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = products.filter(p => p.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveTab(cat.value)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === cat.value
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaBox className="mx-auto text-4xl mb-4" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
            return (
              <div
                key={product.id}
                className={`bg-gray-800 rounded-xl overflow-hidden border ${
                  product.is_available ? 'border-gray-700' : 'border-red-500/30 opacity-60'
                }`}
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-900 relative">
                  {primaryImage ? (
                    <img
                      src={getGoogleDriveImageUrl(primaryImage.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <FaImage size={48} />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <span className="px-2 py-1 bg-gray-900/80 rounded text-xs">
                      {getCategoryIcon(product.category)} {product.category}
                    </span>
                  </div>
                  {product.is_featured && (
                    <div className="absolute top-2 right-2">
                      <FaStar className="text-yellow-400" />
                    </div>
                  )}
                  {product.sale_price && product.sale_price < product.price && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-bold">
                      SALE
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white truncate">{product.name}</h3>
                  {product.brand && (
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {product.sale_price && product.sale_price < product.price ? (
                      <>
                        <span className="text-lg font-bold text-green-400">
                          Rs. {product.sale_price.toLocaleString()}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Stock: {product.stock_quantity}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditForm(product)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => toggleAvailability(product)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        product.is_available
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={product.is_available ? 'Hide product' : 'Show product'}
                    >
                      {product.is_available ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl w-full max-w-3xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Butterfly Tenergy 05"
                  />
                </div>
                <div>
                  <label className="label">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Butterfly, DHS, Stiga"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="label">Category *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryChange(cat.value)}
                      className={`p-3 rounded-lg border-2 transition text-center ${
                        formData.category === cat.value
                          ? 'border-primary-blue bg-primary-blue/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-sm font-medium text-white">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              {/* Pricing */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Price (PKR) *</label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Sale Price (PKR)</label>
                  <input
                    type="number"
                    value={formData.sale_price || ''}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    min={0}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min={0}
                  />
                </div>
              </div>

              {/* Specifications */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <FaTableTennis /> Specifications
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Speed/Spin/Control */}
                  {['speed', 'spin', 'control'].map(spec => (
                    <div key={spec}>
                      <label className="label text-sm capitalize">{spec} (1-10)</label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={formData.specifications[spec] as number || 5}
                        onChange={(e) => handleSpecChange(spec, parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-center text-primary-blue font-bold">
                        {formData.specifications[spec] || 5}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Category-specific specs */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {formData.category === 'blades' && (
                    <>
                      <div>
                        <label className="label text-sm">Ply</label>
                        <input
                          type="text"
                          value={formData.specifications.ply || ''}
                          onChange={(e) => handleSpecChange('ply', e.target.value)}
                          className="input-field"
                          placeholder="e.g. 5-ply, 7-ply carbon"
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Weight</label>
                        <input
                          type="text"
                          value={formData.specifications.weight || ''}
                          onChange={(e) => handleSpecChange('weight', e.target.value)}
                          className="input-field"
                          placeholder="e.g. 85g"
                        />
                      </div>
                    </>
                  )}
                  {formData.category === 'rubbers' && (
                    <>
                      <div>
                        <label className="label text-sm">Thickness</label>
                        <input
                          type="text"
                          value={formData.specifications.thickness || ''}
                          onChange={(e) => handleSpecChange('thickness', e.target.value)}
                          className="input-field"
                          placeholder="e.g. 2.0mm, MAX"
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Color</label>
                        <select
                          value={formData.specifications.color || ''}
                          onChange={(e) => handleSpecChange('color', e.target.value)}
                          className="input-field"
                        >
                          <option value="">Select color</option>
                          <option value="Red">Red</option>
                          <option value="Black">Black</option>
                        </select>
                      </div>
                    </>
                  )}
                  {formData.category === 'balls' && (
                    <div>
                      <label className="label text-sm">Quantity</label>
                      <input
                        type="text"
                        value={formData.specifications.quantity || ''}
                        onChange={(e) => handleSpecChange('quantity', e.target.value)}
                        className="input-field"
                        placeholder="e.g. 3 balls/pack, 72 balls/box"
                      />
                    </div>
                  )}
                  <div>
                    <label className="label text-sm">Material</label>
                    <input
                      type="text"
                      value={formData.specifications.material || ''}
                      onChange={(e) => handleSpecChange('material', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Carbon, ABS Plastic"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="label">Product Images (Google Drive Links)</label>
                <div className="space-y-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => updateImageUrl(index, e.target.value)}
                            className="input-field flex-1"
                            placeholder="Paste Google Drive image link..."
                          />
                          <button
                            type="button"
                            onClick={() => setPrimaryImageIndex(index)}
                            className={`px-3 py-2 rounded-lg transition ${
                              primaryImageIndex === index
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                            title="Set as primary image"
                          >
                            <FaStar />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                          >
                            <FaTimes />
                          </button>
                        </div>
                        {url && (
                          <img
                            src={getGoogleDriveImageUrl(url)}
                            alt="Preview"
                            className="mt-2 h-20 w-20 object-cover rounded-lg"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                  >
                    <FaPlus /> Add Another Image
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Available for sale</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Featured product</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaSave /> {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStore;
