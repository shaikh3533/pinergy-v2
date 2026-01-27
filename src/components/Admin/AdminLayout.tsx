import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaCalendarAlt,
  FaPlus,
  FaTrophy,
  FaBullhorn,
  FaCog,
  FaImages,
  FaChartBar,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaTableTennis,
  FaHome,
  FaChevronLeft
} from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar />, path: '/admin', color: 'text-blue-400' },
  { id: 'users', label: 'Users', icon: <FaUsers />, path: '/admin/users', color: 'text-green-400' },
  { id: 'bookings', label: 'Bookings', icon: <FaCalendarAlt />, path: '/admin/bookings', color: 'text-purple-400' },
  { id: 'add-booking', label: 'Add Booking', icon: <FaPlus />, path: '/admin/add-booking', color: 'text-emerald-400' },
  { id: 'tournaments', label: 'Tournaments', icon: <FaTrophy />, path: '/admin/tournaments', color: 'text-yellow-400' },
  { id: 'coaches', label: 'Coaches', icon: <FaUsers />, path: '/admin/coaches', color: 'text-cyan-400' },
  { id: 'gallery', label: 'Gallery', icon: <FaImages />, path: '/admin/gallery', color: 'text-pink-400' },
  { id: 'ads', label: 'Ads & Events', icon: <FaBullhorn />, path: '/admin/ads', color: 'text-orange-400' },
  { id: 'settings', label: 'Settings', icon: <FaCog />, path: '/admin/settings', color: 'text-gray-400' },
];

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const currentPath = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin' && currentPath === '/admin') return true;
    if (path !== '/admin' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <FaTableTennis className="text-primary-blue text-xl" />
            <span className="font-bold text-white">Admin</span>
          </div>
          <Link to="/" className="p-2 text-gray-400 hover:text-white transition">
            <FaHome size={20} />
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-gray-900 z-50 overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
                  <FaTableTennis className="text-white text-xl" />
                </div>
                <div>
                  <div className="font-bold text-white">SPINERGY</div>
                  <div className="text-xs text-gray-400">Admin Portal</div>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-primary-blue text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className={isActive(item.path) ? 'text-white' : item.color}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-800 mt-4">
              <div className="flex items-center gap-3 px-4 py-2 mb-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.[0] || 'A'}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{user?.name}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <FaSignOutAlt />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 72 }}
        className="hidden lg:block fixed top-0 left-0 bottom-0 bg-gray-900 border-r border-gray-800 z-30 overflow-hidden"
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <FaTableTennis className="text-white text-xl" />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="font-bold text-white">SPINERGY</div>
                <div className="text-xs text-gray-400">Admin Portal</div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 -right-3 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition"
        >
          <FaChevronLeft className={`text-xs transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition group ${
                isActive(item.path)
                  ? 'bg-primary-blue text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className={`text-lg flex-shrink-0 ${isActive(item.path) ? 'text-white' : item.color}`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition mb-2"
            title={!sidebarOpen ? 'Back to Site' : undefined}
          >
            <FaHome className="text-lg flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Back to Site</span>}
          </Link>
          
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title={!sidebarOpen ? 'Sign Out' : undefined}
          >
            <FaSignOutAlt className="text-lg flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[72px]'}`}>
        <div className="pt-16 lg:pt-0 min-h-screen">
          {/* Header */}
          <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
