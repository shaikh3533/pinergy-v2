import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Ad } from '../lib/supabase';
import { formatDate } from '../utils/dateUtils';

const Ads = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Events & Promotions</h1>
            <p className="text-gray-400">
              Stay updated with the latest events, tournaments, and special offers
            </p>
          </div>

          {ads.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📢</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Events Yet</h2>
              <p className="text-gray-400">Check back soon for exciting events and promotions!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ads.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card group hover:border-primary-blue transition-all duration-300"
                >
                  {ad.image && (
                    <div className="relative h-48 mb-4 -mx-6 -mt-6 rounded-t-xl overflow-hidden">
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white group-hover:text-primary-blue transition-colors">
                      {ad.title}
                    </h3>

                    <p className="text-gray-400 leading-relaxed">{ad.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-sm text-gray-500">
                        {formatDate(ad.created_at)}
                      </span>
                      {ad.link && (
                        <a
                          href={ad.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary py-2 px-4 text-sm"
                        >
                          Learn More →
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Featured Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 bg-gradient-to-r from-primary-blue to-primary-red rounded-xl p-8 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">🏆 SPINERGY Championship</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join our monthly SPINERGY Championship in Lahore! Compete with Pakistan's best players, win exciting
              prizes up to PKR 50,000, and boost your rating. Registration opens soon!
            </p>
            <a href="https://wa.me/923259898900?text=I'm interested in the championship!" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105">
              Register via WhatsApp
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Ads;

