import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaImages,
  FaVideo,
  FaImage,
  FaPlay,
  FaTimes,
  FaStar,
  FaFilter,
  FaExpand,
  FaYoutube
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { GalleryItem, GalleryCategory } from '../lib/supabase';
import logoImage from '../assets/spinergy_logo.png';

// Default thumbnail for Google Drive content
const DEFAULT_THUMBNAIL = logoImage;

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  general: 'General',
  match: 'Match Videos',
  event: 'Events',
  club: 'Club Photos',
  tournament: 'Tournaments',
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

const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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

// Convert Google Drive URL to embeddable format
const getGoogleDriveImageUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

const getGoogleDriveVideoEmbedUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Get the displayable URL for any media
const getDisplayUrl = (url: string, mediaType: 'image' | 'video'): string => {
  if (isGoogleDriveUrl(url)) {
    const fileId = getGoogleDriveFileId(url);
    if (fileId) {
      return mediaType === 'image' 
        ? getGoogleDriveImageUrl(fileId)
        : url; // Videos handled separately with iframe
    }
  }
  return url;
};

// Video Player Component
const VideoPlayer = ({ url, autoPlay = false }: { url: string; autoPlay?: boolean }) => {
  // YouTube
  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0`}
          className="w-full aspect-video rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      );
    }
  }

  // Google Drive
  if (isGoogleDriveUrl(url)) {
    const fileId = getGoogleDriveFileId(url);
    if (fileId) {
      return (
        <iframe
          src={getGoogleDriveVideoEmbedUrl(fileId)}
          className="w-full aspect-video rounded-2xl"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Google Drive video"
        />
      );
    }
  }
  
  // Direct video URL (Google Cloud Storage, etc.)
  return (
    <video
      src={url}
      controls
      autoPlay={autoPlay}
      className="w-full rounded-2xl"
      style={{ maxHeight: '80vh' }}
    />
  );
};

// Video Thumbnail Component
const VideoThumbnail = ({ item }: { item: GalleryItem }) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // Try to get YouTube thumbnail
  if (isYouTubeUrl(item.media_url)) {
    const videoId = getYouTubeId(item.media_url);
    if (videoId && !thumbnailError) {
      return (
        <>
          <img
            src={getYouTubeThumbnail(videoId)}
            alt={item.title || 'Video'}
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
          <div className="absolute top-2 left-2 p-1.5 bg-red-600 rounded-lg">
            <FaYoutube className="text-white text-sm" />
          </div>
        </>
      );
    }
  }
  
  // Custom thumbnail if provided
  if (item.thumbnail_url) {
    return (
      <img
        src={item.thumbnail_url}
        alt={item.title || 'Video'}
        className="w-full h-full object-cover"
      />
    );
  }
  
  // Google Drive - use Spinergy logo as default thumbnail
  if (isGoogleDriveUrl(item.media_url)) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
        <img
          src={DEFAULT_THUMBNAIL}
          alt="Spinergy"
          className="w-24 h-24 object-contain rounded-xl opacity-80"
        />
      </div>
    );
  }
  
  // Default video icon for other sources
  return (
    <div className="w-full h-full flex items-center justify-center">
      <FaVideo className="text-4xl text-gray-600" />
    </div>
  );
};

const Gallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error) {
      setItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterType !== 'all' && item.media_type !== filterType) return false;
      return true;
    });
  }, [items, filterCategory, filterType]);

  const featuredItems = useMemo(() => filteredItems.filter(i => i.is_featured), [filteredItems]);
  const regularItems = useMemo(() => filteredItems.filter(i => !i.is_featured), [filteredItems]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/30"
            >
              <FaImages className="text-white text-2xl" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Gallery</h1>
            <p className="text-gray-400">Photos and videos from SPINERGY Table Tennis Club</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-700">
              <FaFilter className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-white border-none outline-none cursor-pointer"
              >
                <option value="all" className="bg-gray-800">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value} className="bg-gray-800">{label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All', icon: null },
                { value: 'image', label: 'Photos', icon: <FaImage /> },
                { value: 'video', label: 'Videos', icon: <FaVideo /> },
              ].map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setFilterType(btn.value)}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 border ${
                    filterType === btn.value 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/20' 
                      : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 border-gray-700'
                  }`}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading gallery...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 text-center py-20 px-8"
            >
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaImages className="text-4xl text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Items Found</h3>
              <p className="text-gray-400">
                {filterCategory !== 'all' || filterType !== 'all'
                  ? 'Try changing your filters'
                  : 'Gallery is empty'}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Featured Section */}
              {featuredItems.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <FaStar className="text-black text-sm" />
                    </div>
                    Featured
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredItems.map((item, index) => (
                      <GalleryCard
                        key={item.id}
                        item={item}
                        index={index}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pinterest-style Masonry Grid */}
              {regularItems.length > 0 && (
                <div>
                  {featuredItems.length > 0 && (
                    <h2 className="text-xl font-bold text-white mb-6">All Media</h2>
                  )}
                  <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {regularItems.map((item, index) => (
                      <MasonryCard
                        key={item.id}
                        item={item}
                        index={index}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedItem(null)}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-3 text-white/70 hover:text-white transition z-10 bg-white/10 rounded-full hover:bg-white/20"
              >
                <FaTimes size={24} />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-5xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  {selectedItem.media_type === 'image' ? (
                    <img
                      src={getDisplayUrl(selectedItem.media_url, 'image')}
                      alt={selectedItem.title || 'Image'}
                      className="w-full h-auto"
                      style={{
                        objectFit: selectedItem.object_fit || 'contain',
                        maxHeight: '80vh',
                      }}
                    />
                  ) : (
                    <VideoPlayer url={selectedItem.media_url} autoPlay />
                  )}
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-center"
                >
                  <h3 className="text-2xl font-bold text-white">{selectedItem.title || CATEGORY_LABELS[selectedItem.category]}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{selectedItem.description}</p>
                  )}
                  <span className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 rounded-full text-sm capitalize">
                    {CATEGORY_LABELS[selectedItem.category]}
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Featured Gallery Card Component
const GalleryCard = ({
  item,
  index,
  onClick,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group bg-gray-800 shadow-xl hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300"
    >
      {/* Media Container */}
      <div className="aspect-video overflow-hidden relative">
        {item.media_type === 'image' ? (
          <img
            src={getDisplayUrl(item.media_url, 'image')}
            alt={item.title || 'Image'}
            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
            style={{
              objectFit: item.object_fit || 'cover',
              objectPosition: item.object_position || 'center',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 relative">
            <VideoThumbnail item={item} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30"
              >
                <FaPlay className="text-white text-xl ml-1" />
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-bold text-lg truncate">{item.title || CATEGORY_LABELS[item.category]}</h3>
        {item.description && (
          <p className="text-gray-300 text-sm truncate mt-1">{item.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-2">
        <div className="p-2 bg-black/50 rounded-xl backdrop-blur-sm border border-white/10">
          {item.media_type === 'image' ? (
            <FaImage className="text-white text-sm" />
          ) : (
            <FaVideo className="text-white text-sm" />
          )}
        </div>
      </div>

      {/* Featured Badge */}
      {item.is_featured && (
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold rounded-lg flex items-center gap-1 shadow-lg">
          <FaStar /> Featured
        </div>
      )}

      {/* Expand Icon on Hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
          <FaExpand className="text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Pinterest-style Masonry Card Component
const MasonryCard = ({
  item,
  index,
  onClick,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
}) => {
  // Generate varying heights for Pinterest effect
  const getCardStyle = () => {
    const heightPatterns = ['h-48', 'h-64', 'h-80', 'h-56', 'h-72'];
    const baseHeight = heightPatterns[index % heightPatterns.length];
    
    if (item.grid_size === 'large') return 'h-80';
    if (item.grid_size === 'small') return 'h-48';
    
    return baseHeight;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl cursor-pointer group break-inside-avoid mb-4 ${getCardStyle()}`}
      style={{
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* Media */}
      {item.media_type === 'image' ? (
        <img
          src={getDisplayUrl(item.media_url, 'image')}
          alt={item.title || 'Image'}
          className="w-full h-full transition-transform duration-700 group-hover:scale-110"
          style={{
            objectFit: item.object_fit || 'cover',
            objectPosition: item.object_position || 'center',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image';
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 relative">
          <VideoThumbnail item={item} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <motion.div 
              whileHover={{ scale: 1.2 }}
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30"
            >
              <FaPlay className="text-white text-lg ml-1" />
            </motion.div>
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

      {/* Content on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        {(item.title || item.description) && (
          <>
            {item.title && <h3 className="text-white font-bold truncate drop-shadow-lg">{item.title}</h3>}
            {item.description && (
              <p className="text-gray-300 text-sm truncate mt-1">{item.description}</p>
            )}
          </>
        )}
        <span className="inline-block mt-2 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-lg capitalize">
          {CATEGORY_LABELS[item.category]}
        </span>
      </div>

      {/* Type Badge */}
      <div className="absolute top-3 right-3 p-2 bg-black/40 rounded-xl backdrop-blur-sm border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
        {item.media_type === 'image' ? (
          <FaImage className="text-white text-sm" />
        ) : isYouTubeUrl(item.media_url) ? (
          <FaYoutube className="text-red-500 text-sm" />
        ) : isGoogleDriveUrl(item.media_url) ? (
          <FaVideo className="text-green-400 text-sm" />
        ) : (
          <FaVideo className="text-white text-sm" />
        )}
      </div>

      {/* Featured Badge */}
      {item.is_featured && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold rounded-lg flex items-center gap-1 shadow-lg">
          <FaStar />
        </div>
      )}

      {/* Border glow effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-pink-500/30 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default Gallery;
