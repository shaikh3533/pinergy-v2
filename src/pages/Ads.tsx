import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaCalendarAlt, FaUsers, FaChevronRight } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Ad, League } from '../lib/supabase';
import { formatDate } from '../utils/dateUtils';
import { format } from 'date-fns';

const Ads = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [upcomingLeagues, setUpcomingLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adsRes, leaguesRes] = await Promise.all([
        supabase.from('ads').select('*').order('created_at', { ascending: false }),
        supabase.from('leagues').select('*').in('status', ['upcoming', 'registration']).order('date', { ascending: true }),
      ]);

      if (adsRes.data) setAds(adsRes.data);
      if (leaguesRes.data) setUpcomingLeagues(leaguesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
            <h1 className="text-4xl font-bold text-white mb-4">Events & Tournaments</h1>
            <p className="text-gray-400">
              Stay updated with upcoming tournaments, events, and special offers
            </p>
          </div>

          {/* Upcoming Tournaments Section */}
          {upcomingLeagues.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FaTrophy className="text-yellow-500" />
                Upcoming Tournaments
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingLeagues.map((league, index) => (
                  <motion.div
                    key={league.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/leagues/${league.id}`}
                      className="block card bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-600/30 hover:border-yellow-500 transition group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                          <FaTrophy className="text-yellow-500 text-xl" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          league.status === 'registration'
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {league.status === 'registration' ? 'Registration Open' : 'Coming Soon'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition">
                        {league.name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-yellow-500" />
                          {league.date
                            ? format(new Date(league.date), 'EEEE, MMMM d, yyyy')
                            : 'Date to be announced'}
                        </div>
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-yellow-500" />
                          Max {league.max_players} players
                        </div>
                        <div className="text-gray-500 text-xs">
                          {league.league_type === 'round_robin_knockouts'
                            ? 'Round Robin + Knockouts'
                            : league.league_type === 'round_robin'
                            ? 'Round Robin'
                            : 'Knockouts'}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-yellow-500 text-sm font-semibold group-hover:underline flex items-center">
                          View Details <FaChevronRight className="ml-1" />
                        </span>
                        {league.status === 'registration' && (
                          <span className="text-green-400 text-xs animate-pulse">
                            Register Now!
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Ads/Events Section */}
          {ads.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Announcements & Promotions</h2>
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
            </div>
          )}

          {/* Empty State */}
          {ads.length === 0 && upcomingLeagues.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📢</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Events Yet</h2>
              <p className="text-gray-400">Check back soon for exciting events and tournaments!</p>
            </div>
          )}

          {/* Featured Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gradient-to-r from-primary-blue to-primary-red rounded-xl p-8 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">🏆 SPINERGY Championship</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join our monthly SPINERGY Championship in Lahore! Compete with Pakistan's best players, win exciting
              prizes up to PKR 50,000, and boost your rating. Registration opens soon!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/923259898900?text=I'm interested in the championship!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Register via WhatsApp
              </a>
              <Link
                to="/leagues"
                className="inline-block bg-black/30 text-white font-semibold py-3 px-8 rounded-lg hover:bg-black/50 transition-all"
              >
                View All Leagues
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Ads;
