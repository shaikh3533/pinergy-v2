import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImage from '../assets/primary white variant logo.jpeg';
import tibharImage from '../assets/tibhar.png';
import dc700Image from '../assets/dc-700.png';

const Home = () => {
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
              <div className="text-5xl mb-4">🎯</div>
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
              <div className="text-5xl mb-4">👨‍🏫</div>
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
              <div className="text-5xl mb-4">🏆</div>
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
                <li>✓ 25mm ITTF-Approved Thickness</li>
                <li>✓ Anti-Glare Laminate Surface</li>
                <li>✓ Robust Steel Frame with Leveling System</li>
                <li>✓ Professional Net & Post Included</li>
                <li>✓ Tournament-Ready Performance</li>
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
                <li>✓ Table Size: 2740mm × 1525mm × 760mm</li>
                <li>✓ 25mm Blue Top - Tournament Grade</li>
                <li>✓ Foldable Design with 100mm Wheels</li>
                <li>✓ 50×50mm Robust Steel Frame</li>
                <li>✓ Superior Bounce & Durability</li>
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

export default Home;

