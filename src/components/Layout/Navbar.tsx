import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import logoImage from '../../assets/primary white variant logo.jpeg';

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-black border-b border-gray-800 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={logoImage} 
              alt="SPINERGY Logo" 
              className="h-12 w-auto"
            />
            <span className="text-2xl font-bold text-white tracking-wider">
              SPINERGY
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-white transition">
              Home
            </Link>
            <Link to="/book" className="text-gray-300 hover:text-white transition">
              Book Slot
            </Link>
            <Link to="/ratings" className="text-gray-300 hover:text-white transition">
              Ratings
            </Link>
            <Link to="/rules" className="text-gray-300 hover:text-white transition">
              Rules
            </Link>
            <Link to="/ads" className="text-gray-300 hover:text-white transition">
              Events
            </Link>
            <Link to="/contact" className="text-gray-300 hover:text-white transition">
              Contact
            </Link>
            <Link to="/suggestions" className="text-gray-300 hover:text-white transition">
              Feedback
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-primary-red hover:text-red-400 transition font-semibold"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white transition"
                >
                  Sign Out
                </button>
                <div className="w-8 h-8 rounded-full bg-primary-blue flex items-center justify-center">
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="text-gray-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

