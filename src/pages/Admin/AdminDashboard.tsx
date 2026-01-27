import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
  FaImages,
  FaArrowRight,
  FaChartLine
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/Admin/AdminLayout';

interface Stats {
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  activeLeagues: number;
  galleryItems: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBookings: 0,
    todayBookings: 0,
    activeLeagues: 0,
    galleryItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    const today = new Date().toISOString().split('T')[0];

    const [users, bookings, todayBookings, leagues, gallery] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('date', today),
      supabase.from('leagues').select('id', { count: 'exact', head: true }).in('status', ['registration', 'round_robin', 'knockouts']),
      supabase.from('gallery').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalUsers: users.count || 0,
      totalBookings: bookings.count || 0,
      todayBookings: todayBookings.count || 0,
      activeLeagues: leagues.count || 0,
      galleryItems: gallery.count || 0,
    });

    setLoading(false);
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: <FaUsers />,
      color: 'from-blue-600 to-blue-800',
      link: '/admin/users',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: <FaCalendarAlt />,
      color: 'from-purple-600 to-purple-800',
      link: '/admin/bookings',
    },
    {
      label: "Today's Bookings",
      value: stats.todayBookings,
      icon: <FaChartLine />,
      color: 'from-green-600 to-green-800',
      link: '/admin/bookings',
    },
    {
      label: 'Active Leagues',
      value: stats.activeLeagues,
      icon: <FaTrophy />,
      color: 'from-yellow-600 to-yellow-800',
      link: '/admin/tournaments',
    },
    {
      label: 'Gallery Items',
      value: stats.galleryItems,
      icon: <FaImages />,
      color: 'from-pink-600 to-pink-800',
      link: '/admin/gallery',
    },
  ];

  const quickActions = [
    { label: 'Add New Booking', path: '/admin/add-booking', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Create Tournament', path: '/admin/tournaments', color: 'bg-yellow-600 hover:bg-yellow-700' },
    { label: 'Upload to Gallery', path: '/admin/gallery', color: 'bg-pink-600 hover:bg-pink-700' },
    { label: 'Manage Users', path: '/admin/users', color: 'bg-blue-600 hover:bg-blue-700' },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your club management">
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={stat.link}
                  className={`block p-6 rounded-xl bg-gradient-to-br ${stat.color} hover:scale-105 transition-transform`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl text-white/80">{stat.icon}</span>
                    <FaArrowRight className="text-white/50" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`${action.color} text-white px-4 py-3 rounded-lg text-center font-medium transition`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="card bg-gradient-to-r from-primary-blue/20 to-purple-600/20 border-primary-blue/50">
            <h2 className="text-xl font-bold text-white mb-2">Welcome to SPINERGY Admin</h2>
            <p className="text-gray-300">
              Manage your table tennis club from this dashboard. Use the sidebar to navigate between different sections.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
