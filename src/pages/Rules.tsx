import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchPricingRules } from '../utils/pricingCalculator';
import type { PricingRule } from '../lib/supabase';

const Rules = () => {
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

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

  // Helper functions to get pricing
  const getPrice = (table: string, duration: number, coaching: boolean) => {
    const rule = pricing.find(
      r => r.table_type === table && r.duration_minutes === duration && r.coaching === coaching
    );
    return rule?.price || 0;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Rules & Guidelines</h1>
            <p className="text-gray-400">
              Everything you need to know about SPINERGY
            </p>
          </div>

          {/* Rating System */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">⭐ Rating System</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Our rating system is designed to provide fair and competitive play for all skill
                levels. Players earn points by winning matches against opponents at various levels.
              </p>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-white mb-3">Points Distribution</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Opponent Level</th>
                      <th className="text-left py-2 text-gray-400">Win Points</th>
                      <th className="text-left py-2 text-gray-400">Loss Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800">
                      <td className="py-2">Noob</td>
                      <td className="py-2 text-green-400">+1</td>
                      <td className="py-2">0</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2">Level 3</td>
                      <td className="py-2 text-green-400">+3</td>
                      <td className="py-2">0</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2">Level 2</td>
                      <td className="py-2 text-green-400">+5</td>
                      <td className="py-2">0</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2">Level 1</td>
                      <td className="py-2 text-green-400">+7</td>
                      <td className="py-2">0</td>
                    </tr>
                    <tr>
                      <td className="py-2">Top Player</td>
                      <td className="py-2 text-green-400">+10</td>
                      <td className="py-2 text-blue-400">+2</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-white mb-3">Level Thresholds</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                      Noob
                    </span>
                    <span>0-30 points</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                      Level 3
                    </span>
                    <span>31-70 points</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      Level 2
                    </span>
                    <span>71-120 points</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                      Level 1
                    </span>
                    <span>121-180 points</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">
                      Top Player
                    </span>
                    <span>181+ points</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-400">
                  <strong>⚠️ Important:</strong> Players can only earn rating points from a maximum of
                  10 matches per month against Noob-level opponents. This prevents farming and
                  ensures competitive integrity.
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                <p className="text-blue-400">
                  <strong>ℹ️ Note:</strong> All ratings reset annually on January 1st to maintain a
                  fresh and competitive environment.
                </p>
              </div>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📅 Booking Rules</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-primary-blue text-xl">✓</span>
                <p>Bookings can be made up to 7 days in advance.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-blue text-xl">✓</span>
                <p>Minimum booking duration is 30 minutes.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-blue text-xl">✓</span>
                <p>Please arrive 5 minutes before your slot time.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-blue text-xl">✓</span>
                <p>Cancellations must be made at least 2 hours in advance.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-blue text-xl">✓</span>
                <p>Late arrivals (10+ minutes) may result in reduced playing time.</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">💰 Pricing (PKR)</h2>
            {loadingPricing ? (
              <div className="text-center text-gray-400 py-8">
                Loading pricing information...
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="bg-gradient-to-br from-primary-blue/20 to-blue-900/20 border border-primary-blue/30 rounded-lg p-5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span>🏓</span> Table A (Tibhar)
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">30 minutes</span>
                          <span className="text-primary-blue font-bold text-lg">PKR {getPrice('table_a', 30, false)}</span>
                        </div>
                        <div className="text-xs text-gray-400">Without coaching</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">30 min + Coaching</span>
                          <span className="text-primary-red font-bold text-lg">PKR {getPrice('table_a', 30, true)}</span>
                        </div>
                        <div className="text-xs text-gray-400">+PKR {getPrice('table_a', 30, true) - getPrice('table_a', 30, false)} for coaching</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">60 minutes</span>
                          <span className="text-primary-blue font-bold text-lg">PKR {getPrice('table_a', 60, false)}</span>
                        </div>
                        <div className="text-xs text-gray-400">Without coaching</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">60 min + Coaching</span>
                          <span className="text-primary-red font-bold text-lg">PKR {getPrice('table_a', 60, true)}</span>
                        </div>
                        <div className="text-xs text-gray-400">+PKR {getPrice('table_a', 60, true) - getPrice('table_a', 60, false)} for coaching</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-900/20 to-primary-red/20 border border-primary-red/30 rounded-lg p-5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span>🏓</span> Table B (DC-700)
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">30 minutes</span>
                          <span className="text-primary-blue font-bold text-lg">PKR {getPrice('table_b', 30, false)}</span>
                        </div>
                        <div className="text-xs text-gray-400">Without coaching</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">30 min + Coaching</span>
                          <span className="text-primary-red font-bold text-lg">PKR {getPrice('table_b', 30, true)}</span>
                        </div>
                        <div className="text-xs text-gray-400">+PKR {getPrice('table_b', 30, true) - getPrice('table_b', 30, false)} for coaching</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">60 minutes</span>
                          <span className="text-primary-blue font-bold text-lg">PKR {getPrice('table_b', 60, false)}</span>
                        </div>
                        <div className="text-xs text-gray-400">Without coaching</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">60 min + Coaching</span>
                          <span className="text-primary-red font-bold text-lg">PKR {getPrice('table_b', 60, true)}</span>
                        </div>
                        <div className="text-xs text-gray-400">+PKR {getPrice('table_b', 60, true) - getPrice('table_b', 60, false)} for coaching</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mb-4 text-blue-400 text-sm">
                  <strong>ℹ️ Note:</strong> All prices are dynamically managed by the admin. Check the booking page for the latest pricing.
                </div>
                <div className="p-3 bg-green-900/20 border border-green-600 rounded-lg text-green-400 text-sm">
                  💡 <strong>Payment:</strong> Payment can be made in cash at the club
                </div>
              </>
            )}
          </div>

          {/* Club Rules */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🏓 Club Rules</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-primary-red text-xl">•</span>
                <p>Respect all players, staff, and equipment.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-red text-xl">•</span>
                <p>Proper sports attire and non-marking shoes required.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-red text-xl">•</span>
                <p>No food or drinks near the tables (water bottles allowed).</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-red text-xl">•</span>
                <p>Clean up after yourself and return equipment to proper storage.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-red text-xl">•</span>
                <p>Mobile phones should be on silent mode during play.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-red text-xl">•</span>
                <p>Maintain sportsmanship at all times - no aggressive behavior.</p>
              </div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Fun Facts About Table Tennis</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-primary-blue font-semibold mb-2">⚡ Speed Record</p>
                <p className="text-sm">
                  The fastest recorded smash in table tennis was 112.5 km/h (70 mph)!
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-primary-blue font-semibold mb-2">🌍 Olympic Sport</p>
                <p className="text-sm">
                  Table tennis has been an Olympic sport since 1988.
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-primary-blue font-semibold mb-2">🏆 Most Popular</p>
                <p className="text-sm">
                  Over 300 million people play table tennis competitively worldwide.
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-primary-blue font-semibold mb-2">🎾 Ball Color</p>
                <p className="text-sm">
                  Official table tennis balls can only be white or orange for visibility.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Rules;

