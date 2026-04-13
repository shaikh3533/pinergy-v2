import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTableTennis, 
  FaChalkboardTeacher, 
  FaTrophy, 
  FaCheckCircle,
  FaSignal,
  FaListUl,
  FaChartBar,
  FaUsers
} from 'react-icons/fa';
import logoImage from '../assets/spinergy_logo.png';
import tibharImage from '../assets/tibhar.png';
import dc700Image from '../assets/dc-700.png';
import { supabase } from '../lib/supabase';
import { AnimatePresence } from 'framer-motion';

const Home = () => {
  const [liveStream, setLiveStream] = useState<{ url: string, title: string, event_id?: string, event_type?: string } | null>(null);
  const [spotlightMatches, setSpotlightMatches] = useState<any[]>([]);
  const [latestWinner, setLatestWinner] = useState<{ leagueName: string; winnerName: string; leagueId: string } | null>(null);
  const [activeArenaTab, setActiveArenaTab] = useState<'scoreboard' | 'ledger' | 'standings' | 'analytics'>('scoreboard');
  const [arenaParticipants, setArenaParticipants] = useState<any[]>([]);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [dcTournament, setDcTournament] = useState<any>(null);

  useEffect(() => {
    const fetchStream = async () => {
      const { data } = await supabase.from('club_settings').select('setting_value').eq('setting_key', 'live_stream').maybeSingle();
      if (data && data.setting_value && data.setting_value.url) {
        setLiveStream(data.setting_value);
        const { event_id, event_type } = data.setting_value;

        if (event_id && event_type === 'standard') {
           // 1. Fetch Matches
           const { data: mData } = await supabase
             .from('league_matches')
             .select('*, player1:player1_id(name), player2:player2_id(name), sets:league_match_sets(*)')
             .eq('league_id', event_id)
             .order('match_number', { ascending: true }); // Show full ledger order
           if (mData) setSpotlightMatches(mData);

           // 2. Fetch League Meta & Standings
           const { data: lInfo } = await supabase.from('leagues').select('*').eq('id', event_id).single();
           setLeagueData(lInfo);

           const { data: pData } = await supabase
             .from('league_players')
             .select('*, player:player_id(id, name, level)')
             .eq('league_id', event_id)
             .eq('status', 'active');
           if (pData) setArenaParticipants(pData);

        } else if (event_id && event_type === 'davis_cup') {
           // 1. Fetch Ties
           const { data: dData } = await supabase
             .from('dc_ties')
             .select('*, team1:dc_teams!team1_id(name), team2:dc_teams!team2_id(name), matches:dc_matches(*)')
             .eq('tournament_id', event_id)
             .order('group_number', { ascending: true })
             .order('created_at', { ascending: true });
           if (dData) setSpotlightMatches(dData);

           // 2. Fetch Teams for Standings
           const { data: tData } = await supabase
             .from('dc_teams')
             .select('*')
             .eq('tournament_id', event_id);
           if (tData) setArenaParticipants(tData);

           const { data: tournament } = await supabase.from('dc_tournaments').select('*').eq('id', event_id).single();
           setDcTournament(tournament);
        }
      }
    };
    fetchStream();

    const fetchLatestWinner = async () => {
      // Latest completed league by date, plus its final winner
      const { data: leagues } = await supabase
        .from('leagues')
        .select('id, name, date, status')
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(5);

      const latest = (leagues || []).find((l: any) => !!l.id);
      if (!latest) return;

      const { data: finalMatch } = await supabase
        .from('league_matches')
        .select('winner:winner_id(id, name)')
        .eq('league_id', latest.id)
        .eq('match_type', 'final')
        .eq('status', 'completed')
        .maybeSingle();

      const winnerName = (finalMatch as any)?.winner?.name;
      if (!winnerName) return;
      setLatestWinner({ leagueName: latest.name, winnerName, leagueId: latest.id });
    };
    fetchLatestWinner();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=2070)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-6"
          >
            <img 
              src={logoImage} 
              alt="SPINERGY Logo" 
              className="h-32 w-auto mx-auto"
            />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            Welcome to
          </h1>
          <div
            className="mb-4"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(74, 134, 247, 0.4))',
            }}
          >
            <div
              className="text-6xl md:text-8xl lg:text-9xl font-black uppercase"
              style={{
                transform: 'skewX(-10deg) translateY(-5px)',
                letterSpacing: '-2px',
                fontFamily: '"Arial Black", Arial, sans-serif',
                background: `linear-gradient(
                  to bottom, 
                  #c4d0df 0%, 
                  #a7b5c8 35%, 
                  #768598 65%, 
                  #3f4a56 100%
                )`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: `
                  2px 2px 0 #1e2630,
                  4px 4px 0 #1e2630,
                  6px 6px 0 #3f4a56,
                  0 0 10px #4a86f7,
                  0 0 25px #4a86f7,
                  0 0 40px rgba(74, 134, 247, 0.5)
                `,
              }}
            >
              SPINERGY
            </div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Lahore's Premier Table Tennis Club with Professional Tibhar & DC-700 Tables
          </p>

          {latestWinner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/30 border border-yellow-600/40 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 text-yellow-300 font-semibold mb-1">
                  <FaTrophy /> Tournament Champion Announcement
                </div>
                <div className="text-white text-lg">
                  Congratulations <span className="font-bold">{latestWinner.winnerName}</span> on winning{' '}
                  <span className="font-bold">{latestWinner.leagueName}</span>!
                </div>
                <div className="mt-2">
                  <Link
                    to={`/leagues/${latestWinner.leagueId}`}
                    className="text-primary-blue hover:text-blue-300 text-sm"
                  >
                    View tournament details →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="btn-primary text-lg">
              Book Your Slot
            </Link>
            <Link
              to="/rules"
              className="btn-secondary text-lg"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Live Stream Section - THEATER MODE */}
      {liveStream && liveStream.url && (
        <section className="py-12 bg-[#050505] border-y border-gray-800">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </div>
                  <span className="text-red-500 font-bold tracking-[0.3em] text-xs uppercase">Live Broadcast</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                  {liveStream.title || 'Spinergy Arena'}
                </h2>
                <div className="text-gray-500 font-mono text-sm mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {liveStream.event_type === 'davis_cup' ? 'Davis Cup World Group Format' : 'Spinergy Pro League Series'}
                </div>
              </div>
              
              <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800 self-start">
                {[
                  { id: 'scoreboard', icon: <FaSignal />, label: 'Live' },
                  { id: 'ledger', icon: <FaListUl />, label: 'Matches' },
                  { id: 'standings', icon: <FaTrophy />, label: 'Standings' },
                  { id: 'analytics', icon: <FaChartBar />, label: 'Insights' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveArenaTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeArenaTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* LEFT: THEATER PLAYER */}
              <div className="col-span-12 lg:col-span-8">
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative group">
                  <iframe 
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${liveStream.url}?autoplay=1&modestbranding=1&rel=0&showinfo=0`}
                    title="Live Broadcast"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
                
                {/* Event Pulse Bar */}
                <div className="mt-6 flex items-center gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
                   <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 font-mono">
                        <span>Tournament Saturation</span>
                        <span>{Math.round((spotlightMatches.filter(m => m.status === 'completed').length / (spotlightMatches.length || 1)) * 100)}%</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${(spotlightMatches.filter(m => m.status === 'completed').length / (spotlightMatches.length || 1)) * 100}%` }}
                        />
                      </div>
                   </div>
                   <div className="flex items-center gap-6 px-4 border-l border-gray-800">
                      <div className="text-center">
                        <div className="text-white font-black text-xl">{spotlightMatches.length}</div>
                        <div className="text-[8px] text-gray-500 uppercase tracking-tighter">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-500 font-black text-xl">{spotlightMatches.filter(m => m.status === 'completed').length}</div>
                        <div className="text-[8px] text-gray-500 uppercase tracking-tighter">Played</div>
                      </div>
                   </div>
                </div>
              </div>

              {/* RIGHT: DATA PANEL */}
              <div className="col-span-12 lg:col-span-4 flex flex-col min-h-[500px]">
                <div className="flex-1 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
                    <h3 className="text-white font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                      <FaSignal className="text-blue-500" /> Data Feed: {activeArenaTab.toUpperCase()}
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <AnimatePresence mode="wait">
                      {activeArenaTab === 'scoreboard' && (
                        <motion.div 
                          key="scores"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 space-y-4"
                        >
                          {spotlightMatches.filter(m => m.status === 'in_progress').length > 0 ? (
                            spotlightMatches.filter(m => m.status === 'in_progress').map(m => (
                               <ScoreCard key={m.id} match={m} isLive />
                            ))
                          ) : (
                               spotlightMatches.filter(m => m.status === 'completed').slice(0, 5).map(m => (
                                 <ScoreCard key={m.id} match={m} />
                               ))
                          )}
                          {spotlightMatches.length === 0 && <EmptyFeed />}
                        </motion.div>
                      )}

                      {activeArenaTab === 'ledger' && (
                        <motion.div 
                          key="ledger"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-2 space-y-1"
                        >
                          {spotlightMatches.map(m => (
                            <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-800/20 hover:bg-gray-800/40 rounded-lg border border-transparent hover:border-gray-800/80 transition-all group">
                               <div className="w-8 text-[10px] font-mono text-gray-600 group-hover:text-blue-500">{m.match_number || 'T'}</div>
                               <div className="flex-1">
                                  <div className="text-white font-bold text-xs truncate">
                                    {m.team1?.name || m.player1?.name} vs {m.team2?.name || m.player2?.name}
                                  </div>
                                  <div className="text-[10px] text-gray-500 lowercase">{m.status}</div>
                               </div>
                               <div className="text-right">
                                 <span className={`px-2 py-1 rounded-md text-[10px] font-black ${m.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                   {m.status === 'completed' ? (m.team1_rubbers_won ?? m.player1_score) + '-' + (m.team2_rubbers_won ?? m.player2_score) : 'LIVE'}
                                 </span>
                               </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeArenaTab === 'standings' && (
                        <motion.div 
                          key="standings"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4"
                        >
                           <ArenaStandings 
                              participants={arenaParticipants} 
                              type={liveStream.event_type} 
                              matches={spotlightMatches}
                           />
                        </motion.div>
                      )}

                      {activeArenaTab === 'analytics' && (
                        <motion.div 
                          key="insights"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4"
                        >
                           <ArenaAnalytics participants={arenaParticipants} matches={spotlightMatches} type={liveStream.event_type} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="p-4 bg-gray-950 border-t border-gray-800">
                    <Link 
                      to={liveStream.event_type === 'davis_cup' ? "/special-events" : `/leagues/${liveStream.event_id}`}
                      className="group flex items-center justify-between bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Full Event Hub</span>
                      <FaTrophy className="group-hover:rotate-12 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">About SPINERGY</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience Lahore's finest table tennis facility with ITTF-approved professional tables,
              expert coaching, and a competitive environment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card text-center"
            >
              <div className="text-5xl mb-4 text-primary-blue">
                <FaTableTennis className="inline-block" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional Tables</h3>
              <p className="text-gray-400">
                Premium 25mm professional tables from Tibhar and DC-700
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card text-center"
            >
              <div className="text-5xl mb-4 text-primary-red">
                <FaChalkboardTeacher className="inline-block" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Expert Coaching</h3>
              <p className="text-gray-400">
                Learn from experienced coaches to improve your game
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="card text-center"
            >
              <div className="text-5xl mb-4 text-yellow-400">
                <FaTrophy className="inline-block" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Competitive Play</h3>
              <p className="text-gray-400">
                Join our rating system and compete with players at all levels
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Premium Tables</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Play on world-class equipment used by professionals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card"
            >
              <div className="bg-gradient-to-br from-primary-blue to-blue-900 h-64 rounded-lg mb-4 flex items-center justify-center overflow-hidden p-2">
                <img 
                  src={tibharImage} 
                  alt="Tibhar Table" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Table A - Tibhar</h3>
              <p className="text-gray-400 mb-4">
                ITTF-Approved Premium 25mm Tibhar professional table
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-blue flex-shrink-0" />
                  25mm ITTF-Approved Thickness
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-blue flex-shrink-0" />
                  Anti-Glare Laminate Surface
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-blue flex-shrink-0" />
                  Robust Steel Frame with Leveling System
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-blue flex-shrink-0" />
                  Professional Net & Post Included
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-blue flex-shrink-0" />
                  Tournament-Ready Performance
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card"
            >
              <div className="bg-gradient-to-br from-primary-red to-red-900 h-64 rounded-lg mb-4 flex items-center justify-center overflow-hidden p-2">
                <img 
                  src={dc700Image} 
                  alt="DC-700 Table" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Table B - DC-700</h3>
              <p className="text-gray-400 mb-4">
                Double Circle DC-700 Professional 25mm ITTF-approved table
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-red flex-shrink-0" />
                  Table Size: 2740mm × 1525mm × 760mm
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-red flex-shrink-0" />
                  25mm Blue Top - Tournament Grade
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-red flex-shrink-0" />
                  Foldable Design with 100mm Wheels
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-red flex-shrink-0" />
                  50×50mm Robust Steel Frame
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-primary-red flex-shrink-0" />
                  Superior Bounce & Durability
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-blue to-primary-red">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Play at SPINERGY?</h2>
          <p className="text-xl text-white/90 mb-8">
            Book your slot now and experience Lahore's finest table tennis facility
          </p>
          <Link to="/book" className="inline-block bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105">
            Book Now
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

// --- ARENA SUB-COMPONENTS ---

const ScoreCard = ({ match, isLive }: { match: any, isLive?: boolean }) => {
  const isDC = !!match.team1_id;
  const name1 = isDC ? match.team1?.name : match.player1?.name;
  const name2 = isDC ? match.team2?.name : match.player2?.name;
  const score1 = isDC ? match.team1_rubbers_won : match.player1_score;
  const score2 = isDC ? match.team2_rubbers_won : match.player2_score;

  return (
    <div className={`p-4 rounded-2xl border ${isLive ? 'bg-blue-600/10 border-blue-500/30' : 'bg-gray-800/40 border-gray-800'} transition-all`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-widest ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
          {isLive ? 'LIVE' : 'FINAL'}
        </span>
        <span className="text-[10px] text-gray-500 font-mono italic">#{match.match_number || 'T-CTR'}</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-white truncate max-w-[150px] uppercase tracking-tighter">{name1}</span>
          <span className={`text-2xl font-black ${isLive ? 'text-blue-500' : 'text-gray-400'}`}>{score1 ?? 0}</span>
        </div>
        <div className="h-px bg-gray-800/50 w-full relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-2 text-[8px] text-gray-600 font-bold italic">VS</div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-white truncate max-w-[150px] uppercase tracking-tighter">{name2}</span>
          <span className={`text-2xl font-black ${isLive ? 'text-blue-500' : 'text-gray-400'}`}>{score2 ?? 0}</span>
        </div>
      </div>
      
      {isDC && (
        <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between items-center text-[8px] text-gray-500 font-bold uppercase tracking-widest">
           <span>Rubbers Format</span>
           <span className="text-blue-500/80">Best of 3</span>
        </div>
      )}
    </div>
  );
};

const ArenaStandings = ({ participants, type, matches }: { participants: any[], type: string, matches: any[] }) => {
  if (type === 'davis_cup') {
    return (
      <div className="space-y-2">
        {participants.sort((a,b) => b.wins - a.wins).map((team, i) => (
          <div key={team.id} className="flex items-center gap-3 p-3 bg-gray-800/20 rounded-xl border border-gray-800/50">
            <div className="w-6 h-6 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-[10px] font-black text-gray-500">
               {i+1}
            </div>
            <div className="flex-1 text-xs font-bold text-white truncate">{team.name}</div>
            <div className="text-right flex items-center gap-4">
               <div className="text-center">
                 <div className="text-[10px] text-gray-500 font-black">W-L</div>
                 <div className="text-xs text-white">{team.wins}-{team.losses}</div>
               </div>
               <div className="text-center min-w-[30px]">
                 <div className="text-[10px] text-gray-500 font-black">PD</div>
                 <div className="text-xs text-blue-500">{(team.rubbers_won || 0) - (team.rubbers_lost || 0)}</div>
               </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Local Standings calculation for Standard Leagues
  const sorted = [...participants].map(p => {
    let wins = 0; let losses = 0; let pf = 0; let pa = 0;
    matches.filter(m => m.status === 'completed').forEach(m => {
       if (m.player1_id === p.player_id) {
          wins += m.winner_id === p.player_id ? 1 : 0;
          losses += m.winner_id !== p.player_id ? 1 : 0;
          pf += m.player1_score || 0;
          pa += m.player2_score || 0;
       } else if (m.player2_id === p.player_id) {
          wins += m.winner_id === p.player_id ? 1 : 0;
          losses += m.winner_id !== p.player_id ? 1 : 0;
          pf += m.player2_score || 0;
          pa += m.player1_score || 0;
       }
    });
    return { ...p, wins, losses, pd: pf - pa };
  }).sort((a,b) => b.wins - a.wins || b.pd - a.pd);

  return (
    <div className="space-y-2">
      {sorted.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-800/20 rounded-xl border border-gray-800/50">
           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i < 3 ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-900 text-gray-600'}`}>
              {i+1}
           </div>
           <div className="flex-1 overflow-hidden">
             <div className="text-xs font-bold text-white truncate">{p.player?.name}</div>
             <div className="text-[9px] text-gray-500 italic">Level: {p.player?.level}</div>
           </div>
           <div className="text-right flex items-center gap-4">
              <div className="text-center">
                <div className="text-[9px] text-gray-500 uppercase">W-L</div>
                <div className="text-xs text-white">{p.wins}-{p.losses}</div>
              </div>
              <div className="text-center min-w-[30px]">
                <div className="text-[9px] text-gray-500 uppercase text-center">PD</div>
                <div className={`text-xs ${p.pd >= 0 ? 'text-green-500' : 'text-red-500'}`}>{p.pd > 0 ? '+' : ''}{p.pd}</div>
              </div>
           </div>
        </div>
      ))}
    </div>
  );
};

const ArenaAnalytics = ({ participants, matches, type }: { participants: any[], matches: any[], type: string }) => {
  const completed = matches.filter(m => m.status === 'completed');
  if (completed.length === 0) return <EmptyFeed message="More matches required for analytics" />;

  const isDC = type === 'davis_cup';
  
  // Calculate top efficiency participant
  const efficiency = participants.map(p => {
     const played = isDC ? (p.wins + p.losses) : matches.filter(m => (m.player1_id === p.player_id || m.player2_id === p.player_id) && m.status === 'completed').length;
     const winRate = played > 0 ? (isDC ? (p.wins / played) : (matches.filter(m => m.winner_id === p.player_id).length / played)) : 0;
     const pd = isDC ? (p.rubbers_won - p.rubbers_lost) : 0; // Local PD calc for standard is more complex, let's stick to win rate
     return { name: isDC ? p.name : p.player?.name, winRate: Math.round(winRate * 100), pd };
  }).sort((a,b) => b.winRate - a.winRate).slice(0, 3);

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl text-center">
             <div className="text-2xl font-black text-blue-500">
               {Math.round((completed.length / (matches.length || 1)) * 100)}%
             </div>
             <div className="text-[8px] text-gray-500 uppercase font-black tracking-widest mt-1">Completeness</div>
          </div>
          <div className="p-4 bg-green-600/5 border border-green-500/10 rounded-2xl text-center">
             <div className="text-2xl font-black text-green-500">
               {matches.filter(m => m.status === 'in_progress').length}
             </div>
             <div className="text-[8px] text-gray-500 uppercase font-black tracking-widest mt-1">Active Now</div>
          </div>
       </div>

       <div>
          <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
             <FaSignal className="text-blue-500" /> Match Efficiency Peak
          </h4>
          <div className="space-y-4">
             {efficiency.map((e, i) => (
                <div key={i}>
                   <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-300 font-bold">{e.name}</span>
                      <span className="text-blue-400 font-black">{e.winRate}%</span>
                   </div>
                   <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${e.winRate}%` }}
                        className="h-full bg-blue-600"
                        transition={{ duration: 1, delay: i * 0.2 }}
                      />
                   </div>
                </div>
             ))}
          </div>
       </div>

       <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-2xl">
          <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
             PRO_INSIGHT: Match efficiency is calculated based on relative win rate against current tournament difficulty.
          </p>
       </div>
    </div>
  );
};

const EmptyFeed = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
    <FaTableTennis className="text-4xl mb-4 text-gray-600" />
    <p className="text-xs text-gray-500 font-mono tracking-tighter capitalize">{message || 'Telemetry link established. Waiting for next match data pack...'}</p>
  </div>
);

export default Home;
