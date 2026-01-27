import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserTie,
  FaStar,
  FaTrophy,
  FaClock,
  FaUsers,
  FaUser,
  FaCalendarAlt,
  FaPlay,
  FaTimes,
  FaImage,
  FaWhatsapp
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Coach, CoachMedia, CoachingSession } from '../lib/supabase';

const Coaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachMedia, setCoachMedia] = useState<Record<string, CoachMedia[]>>({});
  const [coachSessions, setCoachSessions] = useState<Record<string, CoachingSession[]>>({});
  const [loading, setLoading] = useState(true);
  const [mediaModal, setMediaModal] = useState<CoachMedia | null>(null);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    
    const { data: coachesData, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching coaches:', error);
    } else if (coachesData) {
      setCoaches(coachesData);
      
      // Fetch media and sessions for each coach
      for (const coach of coachesData) {
        const [mediaRes, sessionsRes] = await Promise.all([
          supabase.from('coach_media').select('*').eq('coach_id', coach.id).order('display_order'),
          supabase.from('coaching_sessions').select('*').eq('coach_id', coach.id).eq('is_active', true),
        ]);
        
        if (mediaRes.data) {
          setCoachMedia(prev => ({ ...prev, [coach.id]: mediaRes.data || [] }));
        }
        if (sessionsRes.data) {
          setCoachSessions(prev => ({ ...prev, [coach.id]: sessionsRes.data || [] }));
        }
      }
    }
    
    setLoading(false);
  };

  const getDayLabel = (dayType: string) => {
    switch (dayType) {
      case 'weekday': return 'Tue, Wed, Thu';
      case 'weekend': return 'Fri, Sat, Sun';
      case 'all': return 'All Days';
      default: return dayType;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-primary-blue to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FaUserTie className="text-white text-3xl" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Our Coaches</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Train with experienced professionals who are passionate about table tennis. 
              Book personalized sessions to improve your game.
            </p>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading coaches...</div>
          ) : coaches.length === 0 ? (
            <div className="card text-center py-16 max-w-lg mx-auto">
              <FaUserTie className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400">Our coaching team profiles will be available shortly.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {coaches.map((coach, index) => (
                <motion.div
                  key={coach.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card overflow-hidden"
                >
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Coach Info */}
                    <div className="lg:col-span-1">
                      <div className="text-center lg:text-left">
                        {/* Profile Picture */}
                        <div className="relative inline-block mb-4">
                          {coach.profile_pic ? (
                            <img
                              src={coach.profile_pic}
                              alt={coach.name}
                              className="w-32 h-32 rounded-xl object-cover mx-auto lg:mx-0"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary-blue to-purple-600 flex items-center justify-center mx-auto lg:mx-0">
                              <FaUserTie className="text-white text-4xl" />
                            </div>
                          )}
                          {coach.experience_years > 0 && (
                            <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-lg">
                              {coach.experience_years}+ Yrs
                            </div>
                          )}
                        </div>

                        <h2 className="text-2xl font-bold text-white">{coach.name}</h2>
                        {coach.title && (
                          <p className="text-primary-blue font-medium">{coach.title}</p>
                        )}

                        {coach.bio && (
                          <p className="text-gray-400 text-sm mt-3">{coach.bio}</p>
                        )}

                        {/* Specializations */}
                        {coach.specializations && coach.specializations.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
                            {coach.specializations.map((spec, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Achievements */}
                        {coach.achievements && coach.achievements.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {coach.achievements.slice(0, 3).map((achievement, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                <FaTrophy className="text-yellow-500 flex-shrink-0" />
                                <span className="truncate">{achievement}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Contact */}
                        {(coach.contact_phone || coach.contact_email) && (
                          <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                            {coach.contact_phone && (
                              <a
                                href={`https://wa.me/${coach.contact_phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-green-500 hover:text-green-400 justify-center lg:justify-start"
                              >
                                <FaWhatsapp /> Book via WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sessions & Media */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Sessions */}
                      {coachSessions[coach.id] && coachSessions[coach.id].length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <FaCalendarAlt className="text-primary-blue" /> Available Sessions
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {coachSessions[coach.id].map((session) => (
                              <div
                                key={session.id}
                                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-primary-blue transition"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-white">{session.session_name}</h4>
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    session.session_type === 'one_on_one'
                                      ? 'bg-purple-600/20 text-purple-400'
                                      : 'bg-blue-600/20 text-blue-400'
                                  }`}>
                                    {session.session_type === 'one_on_one' ? (
                                      <><FaUser className="inline mr-1" /> 1-on-1</>
                                    ) : (
                                      <><FaUsers className="inline mr-1" /> Group</>
                                    )}
                                  </span>
                                </div>
                                <div className="space-y-1 text-sm text-gray-400">
                                  <div className="flex items-center gap-2">
                                    <FaClock className="text-primary-blue" />
                                    {session.duration_minutes} minutes
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-primary-blue" />
                                    {getDayLabel(session.day_type)}
                                  </div>
                                  {session.skill_level && session.skill_level !== 'all' && (
                                    <div className="flex items-center gap-2">
                                      <FaStar className="text-yellow-500" />
                                      {session.skill_level.charAt(0).toUpperCase() + session.skill_level.slice(1)}
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                                  <span className="text-xl font-bold text-primary-blue">
                                    PKR {session.fee_pkr.toLocaleString()}
                                  </span>
                                  {session.session_type === 'group' && session.max_participants > 1 && (
                                    <span className="text-xs text-gray-500">
                                      Max {session.max_participants} players
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media Gallery */}
                      {coachMedia[coach.id] && coachMedia[coach.id].length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <FaImage className="text-pink-500" /> Photos & Videos
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {coachMedia[coach.id].slice(0, 8).map((media) => (
                              <button
                                key={media.id}
                                onClick={() => setMediaModal(media)}
                                className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group"
                              >
                                {media.media_type === 'photo' ? (
                                  <img
                                    src={media.media_url}
                                    alt={media.title || 'Coach media'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                    {media.thumbnail_url ? (
                                      <img src={media.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    ) : null}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <FaPlay className="text-white text-sm ml-0.5" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {media.event_name && (
                                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                                    <p className="text-white text-xs truncate">{media.event_name}</p>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-primary-blue to-purple-600 rounded-xl p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Improve Your Game?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Book a session with our experienced coaches and take your table tennis skills to the next level.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/923259898900?text=Hi! I'm interested in booking a coaching session."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-primary-blue font-semibold rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
              >
                <FaWhatsapp /> Book via WhatsApp
              </a>
              <a
                href="/book"
                className="px-6 py-3 bg-black/30 text-white font-semibold rounded-lg hover:bg-black/50 transition"
              >
                Book Table Slot
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Media Modal */}
        <AnimatePresence>
          {mediaModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
              onClick={() => setMediaModal(null)}
            >
              <button
                onClick={() => setMediaModal(null)}
                className="absolute top-4 right-4 p-3 text-white/70 hover:text-white transition z-10"
              >
                <FaTimes size={24} />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {mediaModal.media_type === 'photo' ? (
                  <img
                    src={mediaModal.media_url}
                    alt={mediaModal.title || 'Coach media'}
                    className="w-full h-auto rounded-lg max-h-[80vh] object-contain"
                  />
                ) : (
                  <video
                    src={mediaModal.media_url}
                    controls
                    autoPlay
                    className="w-full rounded-lg max-h-[80vh]"
                  />
                )}
                {(mediaModal.title || mediaModal.event_name) && (
                  <div className="mt-4 text-center">
                    {mediaModal.title && (
                      <h3 className="text-xl font-bold text-white">{mediaModal.title}</h3>
                    )}
                    {mediaModal.event_name && (
                      <p className="text-gray-400 mt-1">{mediaModal.event_name}</p>
                    )}
                    {mediaModal.description && (
                      <p className="text-gray-500 mt-2 text-sm">{mediaModal.description}</p>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Coaches;
