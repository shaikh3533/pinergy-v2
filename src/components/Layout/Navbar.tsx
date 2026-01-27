import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaCalendarAlt, 
  FaStar, 
  FaBook, 
  FaBullhorn,
  FaImages,
  FaEnvelope,
  FaComment,
  FaUserTie,
  FaTrophy,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaShoppingCart
} from 'react-icons/fa';
import logoImage from '../../assets/spinergy_logo.png';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const NavLink = ({ to, icon, label, active, onClick }: NavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-primary-blue/20 text-primary-blue'
        : 'text-gray-300 hover:text-white hover:bg-gray-800'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span className="font-medium">{label}</span>
  </Link>
);

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', icon: <FaHome />, label: 'Home' },
    { to: '/book', icon: <FaCalendarAlt />, label: 'Book Slot' },
    { to: '/store', icon: <FaShoppingCart />, label: 'Store' },
    { to: '/coaches', icon: <FaUserTie />, label: 'Coaches' },
    { to: '/leagues', icon: <FaTrophy />, label: 'Leagues' },
    { to: '/gallery', icon: <FaImages />, label: 'Gallery' },
    { to: '/ratings', icon: <FaStar />, label: 'Ratings' },
    { to: '/rules', icon: <FaBook />, label: 'Rules' },
    { to: '/ads', icon: <FaBullhorn />, label: 'Events' },
  ];

  const moreLinks = [
    { to: '/contact', icon: <FaEnvelope />, label: 'Contact' },
    { to: '/suggestions', icon: <FaComment />, label: 'Feedback' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50"
        style={{
          boxShadow: '0 4px 30px rgba(0, 71, 255, 0.1)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src={logoImage} 
                  alt="SPINERGY Logo" 
                  className="h-10 w-auto rounded-lg"
                />
                <div className="absolute inset-0 rounded-lg bg-primary-blue/20 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-white tracking-wider">
                  SPINERGY
                </span>
                <p className="text-[10px] text-gray-500 -mt-1">Table Tennis Club</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 6).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-primary-blue text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* More dropdown */}
              <div className="relative group">
                <button className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition">
                  More
                </button>
                <div className="absolute top-full right-0 mt-1 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {[...navLinks.slice(6), ...moreLinks].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg transition"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/dashboard')
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <FaChartLine className="inline mr-1" /> Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-red to-orange-600 text-white hover:opacity-90 transition"
                    >
                      <FaCog className="inline mr-1" /> Admin
                    </Link>
                  )}
                  <div className="relative group">
                    <button className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-blue to-purple-600 flex items-center justify-center ring-2 ring-transparent hover:ring-primary-blue/50 transition">
                      {user.profile_pic ? (
                        <img
                          src={user.profile_pic}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </button>
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-3 border-b border-gray-800">
                        <p className="text-white font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.level}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-b-lg transition"
                      >
                        <FaSignOutAlt /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/auth/signin"
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-lg hover:opacity-90 transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white transition"
              >
                {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-gray-950 border-l border-gray-800 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xl font-bold text-white">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* User Info (Mobile) */}
              {user && (
                <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-blue to-purple-600 flex items-center justify-center">
                      {user.profile_pic ? (
                        <img src={user.profile_pic} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user.name}</p>
                      <p className="text-xs text-primary-blue">{user.level}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Links (Mobile) */}
              <nav className="p-4 space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    {...link}
                    active={isActive(link.to)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
                <div className="border-t border-gray-800 my-3" />
                {moreLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    {...link}
                    active={isActive(link.to)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </nav>

              {/* Auth (Mobile) */}
              <div className="p-4 border-t border-gray-800">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gray-800 text-white transition"
                    >
                      <FaChartLine /> Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gradient-to-r from-primary-red to-orange-600 text-white"
                      >
                        <FaCog /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                    >
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/auth/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center rounded-lg bg-gray-800 text-white font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center rounded-lg bg-gradient-to-r from-primary-blue to-blue-600 text-white font-medium"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
