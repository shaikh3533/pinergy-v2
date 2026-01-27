import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaImage,
  FaVideo,
  FaStar,
  FaExternalLinkAlt,
  FaTimes,
  FaCheck,
  FaCrop,
  FaLink,
  FaUpload,
  FaYoutube
} from 'react-icons/fa';
import logoImage from '../../assets/primary white variant logo.jpeg';
import { supabase } from '../../lib/supabase';
import type { GalleryItem, GalleryCategory, MediaType, ObjectFitType, AspectRatioType } from '../../lib/supabase';
import AdminLayout from '../../components/Admin/AdminLayout';

const CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'match', label: 'Match Videos' },
  { value: 'event', label: 'Events' },
  { value: 'club', label: 'Club Photos' },
  { value: 'tournament', label: 'Tournament' },
];

const OBJECT_FIT_OPTIONS: { value: ObjectFitType; label: string }[] = [
  { value: 'cover', label: 'Cover (Fill & Crop)' },
  { value: 'contain', label: 'Contain (Fit Inside)' },
  { value: 'fill', label: 'Stretch to Fill' },
  { value: 'none', label: 'Original Size' },
];

const POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Single edit form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'image' as MediaType,
    media_url: '',
    thumbnail_url: '',
    category: 'general' as GalleryCategory,
    is_featured: false,
    object_fit: 'cover' as ObjectFitType,
    object_position: 'center',
    aspect_ratio: 'square' as AspectRatioType,
    grid_size: 'medium' as 'small' | 'medium' | 'large',
  });

  // Bulk upload state
  const [bulkData, setBulkData] = useState({
    category: 'general' as GalleryCategory,
    title: '',
    description: '',
    object_fit: 'cover' as ObjectFitType,
    object_position: 'center',
    links: [''], // Array of URLs
    forceMediaType: '' as '' | 'image' | 'video', // Override for Google Drive links
    thumbnail_url: '', // Custom thumbnail for Google Drive
  });

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery:', error);
      toast.error('Failed to load gallery');
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || '',
      category: item.category,
      is_featured: item.is_featured,
      object_fit: item.object_fit || 'cover',
      object_position: item.object_position || 'center',
      aspect_ratio: item.aspect_ratio || 'square',
      grid_size: item.grid_size || 'medium',
    });
    setShowModal(true);
  };

  const openBulkModal = () => {
    setBulkData({
      category: 'general',
      title: '',
      description: '',
      object_fit: 'cover',
      object_position: 'center',
      links: [''],
      forceMediaType: '',
      thumbnail_url: '',
    });
    setShowBulkModal(true);
  };

  // YouTube URL helpers
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Google Drive URL helpers
  const isGoogleDriveUrl = (url: string): boolean => {
    return url.includes('drive.google.com');
  };

  const getGoogleDriveFileId = (url: string): string | null => {
    const patterns = [
      /drive\.google\.com\/file\/d\/([^/]+)/,
      /drive\.google\.com\/open\?id=([^&]+)/,
      /drive\.google\.com\/uc\?.*id=([^&]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getGoogleDriveImageUrl = (fileId: string): string => {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  const getGoogleDriveVideoEmbedUrl = (fileId: string): string => {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  // Get displayable URL
  const getDisplayUrl = (url: string, mediaType: 'image' | 'video'): string => {
    if (isGoogleDriveUrl(url)) {
      const fileId = getGoogleDriveFileId(url);
      if (fileId && mediaType === 'image') {
        return getGoogleDriveImageUrl(fileId);
      }
    }
    return url;
  };

  // Detect media type from URL
  const detectMediaType = (url: string): MediaType => {
    // YouTube is always video
    if (isYouTubeUrl(url)) return 'video';
    
    // Google Drive - check file extension in URL or default to image
    if (isGoogleDriveUrl(url)) {
      const videoHints = ['video', '.mp4', '.webm', '.mov'];
      if (videoHints.some(hint => url.toLowerCase().includes(hint))) {
        return 'video';
      }
      // Default Google Drive links to image (user can change)
      return 'image';
    }
    
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) ? 'video' : 'image';
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    const validLinks = bulkData.links.filter(link => link.trim() !== '');
    
    if (validLinks.length === 0) {
      toast.error('Please add at least one link');
      return;
    }

    // Check if any Google Drive links exist and media type not selected
    const hasGoogleDriveLinks = validLinks.some(link => isGoogleDriveUrl(link.trim()));
    if (hasGoogleDriveLinks && !bulkData.forceMediaType) {
      toast.error('Please select Media Type (Images or Videos) for Google Drive links');
      return;
    }

    // Validate URLs
    const invalidUrls: string[] = [];
    validLinks.forEach((link, i) => {
      try {
        new URL(link.trim());
      } catch {
        invalidUrls.push(`Link ${i + 1}`);
      }
    });

    if (invalidUrls.length > 0) {
      toast.error(`Invalid URLs: ${invalidUrls.join(', ')}`);
      return;
    }

    const toastId = toast.loading(`Uploading ${validLinks.length} items...`);

    try {
      const insertData = validLinks.map((link, index) => {
        const trimmedLink = link.trim();
        // Use forced type if set, otherwise auto-detect
        const mediaType: MediaType = bulkData.forceMediaType || detectMediaType(trimmedLink);
        return {
          title: bulkData.title || `${bulkData.category} ${index + 1}`,
          description: bulkData.description || null,
          media_type: mediaType,
          media_url: trimmedLink,
          thumbnail_url: bulkData.thumbnail_url || null,
          category: bulkData.category,
          is_featured: false,
          object_fit: bulkData.object_fit,
          object_position: bulkData.object_position,
          aspect_ratio: 'square',
          grid_size: 'medium',
          display_order: items.length + index,
        };
      });

      const { error } = await supabase.from('gallery').insert(insertData);

      if (error) {
        throw error;
      }

      toast.success(`${validLinks.length} items uploaded successfully!`, { id: toastId });
      setShowBulkModal(false);
      fetchGallery();
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to upload items', { id: toastId });
    }
  };

  // Handle single item update
  const handleUpdate = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from('gallery')
      .update({
        title: formData.title || formData.category,
        description: formData.description || null,
        media_type: formData.media_type,
        media_url: formData.media_url,
        thumbnail_url: formData.thumbnail_url || null,
        category: formData.category,
        is_featured: formData.is_featured,
        object_fit: formData.object_fit,
        object_position: formData.object_position,
        aspect_ratio: formData.aspect_ratio,
        grid_size: formData.grid_size,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingItem.id);

    if (error) {
      toast.error('Failed to update item');
      console.error(error);
    } else {
      toast.success('Item updated successfully');
      setShowModal(false);
      fetchGallery();
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('gallery').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
      fetchGallery();
    }
  };

  const toggleFeatured = async (item: GalleryItem) => {
    const { error } = await supabase
      .from('gallery')
      .update({ is_featured: !item.is_featured })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchGallery();
    }
  };

  // Add/remove link fields in bulk upload
  const addLinkField = () => {
    setBulkData({ ...bulkData, links: [...bulkData.links, ''] });
  };

  const removeLinkField = (index: number) => {
    if (bulkData.links.length === 1) return;
    const newLinks = bulkData.links.filter((_, i) => i !== index);
    setBulkData({ ...bulkData, links: newLinks });
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...bulkData.links];
    newLinks[index] = value;
    setBulkData({ ...bulkData, links: newLinks });
  };

  // Paste multiple links at once
  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length > 1) {
      e.preventDefault();
      const newLinks = [...bulkData.links];
      newLinks.splice(index, 1, ...lines);
      setBulkData({ ...bulkData, links: newLinks });
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterType !== 'all' && item.media_type !== filterType) return false;
    return true;
  });

  const validLinksCount = bulkData.links.filter(l => l.trim() !== '').length;

  return (
    <AdminLayout title="Gallery Management" subtitle="Add multiple photos and videos from Google Cloud">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
        <button
          onClick={openBulkModal}
          className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg flex items-center gap-2 transition font-medium shadow-lg"
        >
          <FaUpload /> Add Media
        </button>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading gallery...</div>
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-12">
          <FaImage className="text-6xl text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Items Yet</h3>
          <p className="text-gray-400 mb-4">Add photos and videos from Google Cloud</p>
          <button
            onClick={openBulkModal}
            className="btn-primary inline-flex items-center gap-2"
          >
            <FaUpload /> Add Media
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="relative rounded-xl overflow-hidden group bg-gray-800"
            >
              {/* Media Preview */}
              <div className="aspect-square relative">
                {item.media_type === 'image' ? (
                  <img
                    src={getDisplayUrl(item.media_url, 'image')}
                    alt={item.title}
                    className="w-full h-full"
                    style={{
                      objectFit: item.object_fit || 'cover',
                      objectPosition: item.object_position || 'center',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Error';
                    }}
                  />
                ) : isYouTubeUrl(item.media_url) ? (
                  <div className="w-full h-full relative">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(item.media_url)}/mqdefault.jpg`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Video';
                      }}
                    />
                    <div className="absolute top-2 left-2 p-1.5 bg-red-600 rounded-lg">
                      <FaYoutube className="text-white text-xs" />
                    </div>
                  </div>
                ) : isGoogleDriveUrl(item.media_url) ? (
                  <div className="w-full h-full relative bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center p-3">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={logoImage}
                        alt="Spinergy"
                        className="w-16 h-16 object-contain rounded-lg opacity-70"
                      />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 rounded-lg text-xs text-white">
                      Drive
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <FaVideo className="text-3xl text-gray-500" />
                  </div>
                )}
                
                {/* Featured badge */}
                {item.is_featured && (
                  <div className="absolute top-2 left-2 p-1.5 bg-yellow-500 text-black rounded-lg">
                    <FaStar className="text-xs" />
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg">
                  {item.media_type === 'image' ? (
                    <FaImage className="text-xs" />
                  ) : isYouTubeUrl(item.media_url) ? (
                    <FaYoutube className="text-xs text-red-400" />
                  ) : (
                    <FaVideo className="text-xs" />
                  )}
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <a
                    href={item.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                  >
                    <FaExternalLinkAlt className="text-white text-sm" />
                  </a>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
                  >
                    <FaEdit className="text-white text-sm" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
                  >
                    <FaTrash className="text-white text-sm" />
                  </button>
                  <button
                    onClick={() => toggleFeatured(item)}
                    className={`p-2 rounded-lg transition ${
                      item.is_featured 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-white/20 text-white hover:bg-yellow-500 hover:text-black'
                    }`}
                  >
                    <FaStar className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-xs px-2 py-0.5 bg-primary-blue/80 text-white rounded capitalize">
                  {item.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaUpload className="text-green-500" /> Add Media
                </h3>
                <p className="text-gray-400 text-sm mt-1">Add multiple images/videos at once</p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5">
              {/* Category (Required) */}
              <div>
                <label className="label text-primary-blue">Category *</label>
                <select
                  value={bulkData.category}
                  onChange={(e) => setBulkData({ ...bulkData, category: e.target.value as GalleryCategory })}
                  className="input-field"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Optional Title & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-gray-400">Title (Optional)</label>
                  <input
                    type="text"
                    value={bulkData.title}
                    onChange={(e) => setBulkData({ ...bulkData, title: e.target.value })}
                    className="input-field"
                    placeholder="Shared title for all"
                  />
                </div>
                <div>
                  <label className="label text-gray-400">Description (Optional)</label>
                  <input
                    type="text"
                    value={bulkData.description}
                    onChange={(e) => setBulkData({ ...bulkData, description: e.target.value })}
                    className="input-field"
                    placeholder="Shared description"
                  />
                </div>
              </div>

              {/* Media Type for Google Drive */}
              <div>
                <label className="label text-primary-blue">Media Type *</label>
                <p className="text-xs text-gray-500 mb-2">
                  Select whether you're uploading images or videos (required for Google Drive links)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkData({ ...bulkData, forceMediaType: 'image' })}
                    className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      bulkData.forceMediaType === 'image'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <FaImage /> Images
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkData({ ...bulkData, forceMediaType: 'video' })}
                    className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                      bulkData.forceMediaType === 'video'
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <FaVideo /> Videos
                  </button>
                </div>
              </div>

              {/* Thumbnail for Google Drive (optional) */}
              {bulkData.forceMediaType === 'video' && (
                <div>
                  <label className="label text-gray-400">Custom Thumbnail URL (Optional)</label>
                  <p className="text-xs text-gray-500 mb-2">
                    Add a thumbnail image. If empty, Spinergy logo will be used.
                  </p>
                  <input
                    type="url"
                    value={bulkData.thumbnail_url}
                    onChange={(e) => setBulkData({ ...bulkData, thumbnail_url: e.target.value })}
                    className="input-field"
                    placeholder="https://... (leave empty for default logo)"
                  />
                </div>
              )}

              {/* Display Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-gray-400">Image Fit</label>
                  <select
                    value={bulkData.object_fit}
                    onChange={(e) => setBulkData({ ...bulkData, object_fit: e.target.value as ObjectFitType })}
                    className="input-field"
                  >
                    {OBJECT_FIT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-gray-400">Focus Position</label>
                  <select
                    value={bulkData.object_position}
                    onChange={(e) => setBulkData({ ...bulkData, object_position: e.target.value })}
                    className="input-field"
                  >
                    {POSITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label text-primary-blue mb-0">
                    Media Links * <span className="text-gray-500 font-normal">({validLinksCount} added)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addLinkField}
                    className="text-sm text-primary-blue hover:text-blue-400 flex items-center gap-1"
                  >
                    <FaPlus /> Add More
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Paste multiple links at once (one per line). For Google Drive, select media type above first.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {bulkData.links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1 relative">
                        <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updateLink(index, e.target.value)}
                          onPaste={(e) => handlePaste(index, e)}
                          className="input-field pl-10"
                          placeholder="https://storage.googleapis.com/..."
                        />
                        {link && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded ${
                            (bulkData.forceMediaType || detectMediaType(link)) === 'video' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-blue-600 text-white'
                          }`}>
                            {(bulkData.forceMediaType || detectMediaType(link)) === 'video' ? 'Video' : 'Image'}
                            {isGoogleDriveUrl(link) && ' (Drive)'}
                          </span>
                        )}
                      </div>
                      {bulkData.links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLinkField(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Count */}
              {validLinksCount > 0 && (
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 text-center">
                  <span className="text-green-400">
                    Ready to upload <strong>{validLinksCount}</strong> item{validLinksCount > 1 ? 's' : ''} to <strong className="capitalize">{bulkData.category}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={validLinksCount === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition font-medium"
              >
                <FaUpload /> Upload {validLinksCount > 0 ? `(${validLinksCount})` : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Single Item Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaEdit className="text-blue-500" /> Edit Item
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {formData.media_type === 'image' ? (
                  <img
                    src={getDisplayUrl(formData.media_url, 'image')}
                    alt="Preview"
                    className="w-full h-full"
                    style={{
                      objectFit: formData.object_fit,
                      objectPosition: formData.object_position,
                    }}
                  />
                ) : isYouTubeUrl(formData.media_url) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(formData.media_url)}?rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video preview"
                  />
                ) : isGoogleDriveUrl(formData.media_url) ? (
                  <iframe
                    src={getGoogleDriveVideoEmbedUrl(getGoogleDriveFileId(formData.media_url) || '')}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Google Drive video preview"
                  />
                ) : (
                  <video src={formData.media_url} controls className="w-full h-full" />
                )}
              </div>

              {/* Category */}
              <div>
                <label className="label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as GalleryCategory })}
                  className="input-field"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-gray-400">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label text-gray-400">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="label">Media URL</label>
                <input
                  type="url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Image Fit</label>
                  <select
                    value={formData.object_fit}
                    onChange={(e) => setFormData({ ...formData, object_fit: e.target.value as ObjectFitType })}
                    className="input-field"
                  >
                    {OBJECT_FIT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Focus Position</label>
                  <select
                    value={formData.object_position}
                    onChange={(e) => setFormData({ ...formData, object_position: e.target.value })}
                    className="input-field"
                  >
                    {POSITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white flex items-center gap-2">
                  <FaStar className="text-yellow-500" /> Featured
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FaCheck /> Update
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGallery;
