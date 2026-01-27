import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaCalculator, 
  FaMedal, 
  FaChartLine,
  FaSort,
  FaCalendarAlt,
  FaTableTennis,
  FaBook,
  FaClock,
  FaCheck
} from 'react-icons/fa';
import { fetchPricingRules } from '../utils/pricingCalculator';
import type { PricingRule } from '../lib/supabase';

const Rules = () => {
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [activeSection, setActiveSection] = useState('tournament');

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const rules = await fetchPricingRules();
        setPricing(rules);
      } catch (error) {
        console.error('Error loading pricing:', error);
      } finally {
        setLoadingPricing(false);
      }
    };
    loadPricing();
  }, []);

  const getPrice = (table: string, duration: number, coaching: boolean) => {
    const rule = pricing.find(
      r => r.table_type === table && r.duration_minutes === duration && r.coaching === coaching
    );
    return rule?.price || 0;
  };

  const sections = [
    { id: 'tournament', label: 'Tournament Points', icon: <FaTrophy /> },
    { id: 'ranking', label: 'Global Ranking', icon: <FaChartLine /> },
    { id: 'tiebreaker', label: 'Tie-Breaking', icon: <FaSort /> },
    { id: 'booking', label: 'Booking Rules', icon: <FaCalendarAlt /> },
    { id: 'pricing', label: 'Pricing', icon: <FaCalculator /> },
    { id: 'club', label: 'Club Rules', icon: <FaTableTennis /> },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-primary-blue to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FaBook className="text-white text-2xl" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Rules & Scoring</h1>
            <p className="text-gray-400">
              Complete guide to SPINERGY's tournament rules, ranking formulas, and club policies
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeSection === section.id
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {section.icon} {section.label}
              </button>
            ))}
          </div>

          {/* Tournament Points */}
          {activeSection === 'tournament' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FaTrophy className="text-yellow-500" /> Tournament Points System
                </h2>
                <p className="text-gray-400 mb-6">
                  Earn points by participating in leagues and tournaments. Points accumulate to determine your global ranking.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Points Table */}
                  <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaMedal className="text-yellow-500" /> Achievement Points
                    </h3>
                    <div className="space-y-3">
                      {[
                        { achievement: 'League Participation', points: 5, description: 'Join any league' },
                        { achievement: 'Top 6 Finish', points: '+5', description: '10 total' },
                        { achievement: 'Top 4 Qualifier', points: '+5', description: '15 total' },
                        { achievement: 'Runner-Up', points: '+5', description: '20 total' },
                        { achievement: 'League Champion', points: '+10', description: '30 total' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                          <div>
                            <span className="text-white font-medium">{item.achievement}</span>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </div>
                          <span className="text-yellow-400 font-bold text-lg">{item.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formula */}
                  <div className="bg-gray-800/50 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaCalculator className="text-primary-blue" /> Rating Formula
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                      <p className="text-primary-blue mb-2">Total Rating Points =</p>
                      <div className="text-gray-300 space-y-1 ml-4">
                        <p>Participation Points (5)</p>
                        <p>+ Top 6 Bonus (+5)</p>
                        <p>+ Top 4 Bonus (+5)</p>
                        <p>+ Runner-Up Bonus (+5)</p>
                        <p>+ Champion Bonus (+10)</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-green-400">Example: Champion earns</p>
                        <p className="text-white font-bold">5 + 5 + 5 + 5 + 10 = 30 pts</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/50 rounded-lg">
                      <p className="text-blue-400 text-sm">
                        <FaCheck className="inline mr-2" />
                        Points from all leagues are accumulated for global ranking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Match Formats */}
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-white mb-4">Match Formats</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { stage: 'Round Robin', format: 'Best of 1', sets: 1, description: 'Single set matches' },
                      { stage: 'Semi-Finals', format: 'Best of 3', sets: 3, description: 'First to 2 sets wins' },
                      { stage: 'Final', format: 'Best of 5', sets: 5, description: 'First to 3 sets wins' },
                    ].map((item) => (
                      <div key={item.stage} className="bg-gray-800 rounded-lg p-4 text-center">
                        <h4 className="text-primary-blue font-semibold mb-2">{item.stage}</h4>
                        <p className="text-2xl font-bold text-white">{item.format}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Global Ranking */}
          {activeSection === 'ranking' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FaChartLine className="text-green-500" /> Global Ranking Formula
                </h2>
                <p className="text-gray-400 mb-6">
                  Global rankings are calculated based on multiple performance metrics across all tournaments.
                </p>

                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Ranking Criteria (Priority Order)</h3>
                  <div className="space-y-4">
                    {[
                      { rank: 1, criteria: 'Total Rating Points', description: 'Sum of all tournament achievement points' },
                      { rank: 2, criteria: 'Number of Leagues Played', description: 'More participation = higher rank' },
                      { rank: 3, criteria: 'Win Percentage', description: 'Win % = (Total Wins / Total Matches) × 100' },
                      { rank: 4, criteria: 'Average Point Difference', description: 'Average margin of victory/defeat' },
                      { rank: 5, criteria: 'Head-to-Head', description: 'Direct comparison between tied players' },
                    ].map((item) => (
                      <div key={item.rank} className="flex items-start gap-4 bg-gray-900/50 rounded-lg p-4">
                        <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">{item.rank}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{item.criteria}</h4>
                          <p className="text-gray-500 text-sm">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link to="/rankings" className="btn-primary inline-flex items-center gap-2">
                    <FaTrophy /> View Global Rankings
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tie-Breaking */}
          {activeSection === 'tiebreaker' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FaSort className="text-purple-500" /> Tie-Breaking Rules
                </h2>
                <p className="text-gray-400 mb-6">
                  When players are tied on total wins in a league, these rules determine final rankings.
                </p>

                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-600/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Tie-Break Priority Order</h3>
                  <div className="space-y-3">
                    {[
                      { priority: 1, rule: 'Total Wins', description: 'Most match wins', icon: '🏆' },
                      { priority: 2, rule: 'Total Point Difference', description: 'Sum of (Winner Score − Loser Score)', icon: '📊' },
                      { priority: 3, rule: 'Head-to-Head Result', description: 'Direct match result between tied players', icon: '⚔️' },
                      { priority: 4, rule: 'Lowest Points Conceded', description: 'Fewer points allowed to opponents', icon: '🛡️' },
                      { priority: 5, rule: 'Admin Decision', description: 'Final resort if still tied', icon: '⚖️' },
                    ].map((item) => (
                      <div key={item.priority} className="flex items-center gap-4 bg-black/30 rounded-lg p-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-xl">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 text-sm font-medium">#{item.priority}</span>
                            <h4 className="text-white font-medium">{item.rule}</h4>
                          </div>
                          <p className="text-gray-500 text-sm">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
                  <h4 className="text-blue-400 font-semibold mb-2">Point Difference Calculation</h4>
                  <p className="text-gray-400 text-sm">
                    For each set: <span className="text-white font-mono">Point Diff = Winner Score − Loser Score</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Example: If you win 11-4, your point difference is +7. If you lose 7-11, it's -4.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Booking Rules */}
          {activeSection === 'booking' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FaCalendarAlt className="text-green-500" /> Booking Rules
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[
                      'Bookings can be made up to 7 days in advance',
                      'Minimum booking duration is 30 minutes',
                      'Please arrive 5 minutes before your slot',
                      'Cancellations must be made 2 hours in advance',
                      'Late arrivals (10+ min) may result in reduced time',
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
                        <FaCheck className="text-green-500 mt-1" />
                        <span className="text-gray-300">{rule}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-600/30 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaClock /> Operating Hours
                    </h3>
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold text-white">2 PM - 11 PM</p>
                      <p className="text-gray-400 mt-2">Monday to Sunday</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <Link to="/book" className="btn-primary w-full text-center block">
                        Book Your Slot
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing */}
          {activeSection === 'pricing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FaCalculator className="text-primary-blue" /> Pricing (PKR)
                </h2>
                {loadingPricing ? (
                  <div className="text-center text-gray-400 py-8">Loading pricing...</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Table A */}
                    <div className="bg-gradient-to-br from-primary-blue/20 to-blue-900/20 border border-primary-blue/30 rounded-xl p-5">
                      <h3 className="text-xl font-bold text-white mb-4">🏓 Table A (Tibhar)</h3>
                      <div className="space-y-3">
                        {[
                          { duration: 30, coaching: false },
                          { duration: 30, coaching: true },
                          { duration: 60, coaching: false },
                          { duration: 60, coaching: true },
                        ].map((item) => (
                          <div key={`a-${item.duration}-${item.coaching}`} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <span className="text-white">{item.duration} min</span>
                              {item.coaching && <span className="text-primary-red text-xs ml-2">+ Coaching</span>}
                            </div>
                            <span className={`font-bold text-lg ${item.coaching ? 'text-primary-red' : 'text-primary-blue'}`}>
                              PKR {getPrice('table_a', item.duration, item.coaching)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Table B */}
                    <div className="bg-gradient-to-br from-red-900/20 to-primary-red/20 border border-primary-red/30 rounded-xl p-5">
                      <h3 className="text-xl font-bold text-white mb-4">🏓 Table B (DC-700)</h3>
                      <div className="space-y-3">
                        {[
                          { duration: 30, coaching: false },
                          { duration: 30, coaching: true },
                          { duration: 60, coaching: false },
                          { duration: 60, coaching: true },
                        ].map((item) => (
                          <div key={`b-${item.duration}-${item.coaching}`} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <span className="text-white">{item.duration} min</span>
                              {item.coaching && <span className="text-primary-red text-xs ml-2">+ Coaching</span>}
                            </div>
                            <span className={`font-bold text-lg ${item.coaching ? 'text-primary-red' : 'text-primary-blue'}`}>
                              PKR {getPrice('table_b', item.duration, item.coaching)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-green-900/20 border border-green-600/50 rounded-lg text-green-400 text-sm">
                  💡 <strong>Payment:</strong> Cash payment at the club
                </div>
              </div>
            </motion.div>
          )}

          {/* Club Rules */}
          {activeSection === 'club' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FaTableTennis className="text-primary-blue" /> Club Rules
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { rule: 'Respect all players, staff, and equipment', icon: '🤝' },
                    { rule: 'Proper sports attire and non-marking shoes required', icon: '👟' },
                    { rule: 'No food or drinks near tables (water allowed)', icon: '🚫' },
                    { rule: 'Clean up and return equipment after use', icon: '🧹' },
                    { rule: 'Mobile phones on silent during play', icon: '📱' },
                    { rule: 'Maintain sportsmanship - no aggressive behavior', icon: '⭐' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-gray-300">{item.rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fun Facts */}
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">🎯 Fun Facts</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: '⚡ Speed Record', fact: 'Fastest smash: 112.5 km/h!' },
                    { title: '🌍 Olympic Sport', fact: 'Since 1988 in Seoul Olympics' },
                    { title: '🏆 Most Popular', fact: '300M+ competitive players worldwide' },
                    { title: '🎾 Ball Colors', fact: 'Only white or orange official balls' },
                  ].map((item) => (
                    <div key={item.title} className="bg-gray-800 rounded-lg p-4">
                      <p className="text-primary-blue font-semibold mb-1">{item.title}</p>
                      <p className="text-gray-400 text-sm">{item.fact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Rules;
