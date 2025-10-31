import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';
import { getLevelBadgeColor } from '../utils/ratingSystem';

const Ratings = () => {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('approved', true)
        .order('rating_points', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
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
            <h1 className="text-4xl font-bold text-white mb-4">Player Rankings</h1>
            <p className="text-gray-400">
              See where you stand among the best players at SPINERGY
            </p>
          </div>

          {/* Top 3 Players */}
          {players.length >= 3 && (
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card text-center md:mt-8"
              >
                <div className="text-4xl mb-4">🥈</div>
                <div className="w-24 h-24 mx-auto rounded-full bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
                  {players[1].profile_pic ? (
                    <img
                      src={players[1].profile_pic}
                      alt={players[1].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white">
                      {players[1].name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{players[1].name}</h3>
                <div className={`${getLevelBadgeColor(players[1].level)} text-white px-3 py-1 rounded-full inline-block mb-2`}>
                  {players[1].level}
                </div>
                <div className="text-3xl font-bold text-primary-blue">
                  {players[1].rating_points} pts
                </div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card text-center border-2 border-yellow-500"
              >
                <div className="text-6xl mb-4">🏆</div>
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-4 overflow-hidden border-4 border-yellow-400">
                  {players[0].profile_pic ? (
                    <img
                      src={players[0].profile_pic}
                      alt={players[0].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-white">
                      {players[0].name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{players[0].name}</h3>
                <div className={`${getLevelBadgeColor(players[0].level)} text-white px-4 py-2 rounded-full inline-block mb-2`}>
                  {players[0].level}
                </div>
                <div className="text-4xl font-bold text-yellow-400">
                  {players[0].rating_points} pts
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card text-center md:mt-8"
              >
                <div className="text-4xl mb-4">🥉</div>
                <div className="w-24 h-24 mx-auto rounded-full bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
                  {players[2].profile_pic ? (
                    <img
                      src={players[2].profile_pic}
                      alt={players[2].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white">
                      {players[2].name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{players[2].name}</h3>
                <div className={`${getLevelBadgeColor(players[2].level)} text-white px-3 py-1 rounded-full inline-block mb-2`}>
                  {players[2].level}
                </div>
                <div className="text-3xl font-bold text-primary-blue">
                  {players[2].rating_points} pts
                </div>
              </motion.div>
            </div>
          )}

          {/* All Players Table */}
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6">All Players</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Player</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Level</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Points</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <motion.tr
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-gray-800 hover:bg-gray-800 transition ${
                        index < 10 ? 'bg-gray-800/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-orange-400' :
                            'text-gray-500'
                          }`}>
                            #{index + 1}
                          </span>
                          {index < 3 && <span className="ml-2">{index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-blue flex items-center justify-center overflow-hidden">
                            {player.profile_pic ? (
                              <img
                                src={player.profile_pic}
                                alt={player.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold">
                                {player.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-white font-medium">{player.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`${getLevelBadgeColor(player.level)} text-white px-3 py-1 rounded-full text-sm`}>
                          {player.level}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-primary-blue font-bold text-lg">
                          {player.rating_points}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-300">{player.total_hours_played.toFixed(1)}h</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Ratings;

