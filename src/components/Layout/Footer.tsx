import { Link } from 'react-router-dom';
import { 
  FaInstagram, 
  FaFacebook, 
  FaTiktok,
  FaWhatsapp,
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaTableTennis,
  FaHeart,
  FaTrophy,
  FaCalendarAlt,
  FaStar,
  FaImages,
  FaUserTie
} from 'react-icons/fa';
import logoImage from '../../assets/primary white variant logo.jpeg';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-gray-800/50 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={logoImage} 
                alt="SPINERGY Logo" 
                className="h-14 w-auto rounded-lg"
              />
              <div>
                <span className="text-2xl font-bold text-white tracking-wider">
                  SPINERGY
                </span>
                <p className="text-xs text-gray-500">Table Tennis Club</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-sm">
              Premium table tennis club in Lahore featuring professional-grade DC-700 and Tibhar tables. 
              Join us for training, tournaments, and endless fun!
            </p>
            
            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/spinergy_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://www.facebook.com/share/1Gdv7HipVj/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                aria-label="Facebook"
              >
                <FaFacebook size={20} />
              </a>
              <a
                href="https://vt.tiktok.com/ZSyXMaGdn/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-black rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                aria-label="TikTok"
              >
                <FaTiktok size={20} />
              </a>
              <a
                href="https://wa.me/923259898900"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/', icon: <FaTableTennis />, label: 'Home' },
                { to: '/book', icon: <FaCalendarAlt />, label: 'Book Slot' },
                { to: '/coaches', icon: <FaUserTie />, label: 'Our Coaches' },
                { to: '/ratings', icon: <FaStar />, label: 'Ratings' },
                { to: '/gallery', icon: <FaImages />, label: 'Gallery' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-gray-400 hover:text-primary-blue text-sm flex items-center gap-2 transition"
                  >
                    {link.icon} {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tournaments */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Tournaments
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/leagues" className="text-gray-400 hover:text-primary-blue text-sm flex items-center gap-2 transition">
                  <FaTrophy /> Active Leagues
                </Link>
              </li>
              <li>
                <Link to="/rankings" className="text-gray-400 hover:text-primary-blue text-sm flex items-center gap-2 transition">
                  <FaStar /> Global Rankings
                </Link>
              </li>
              <li>
                <Link to="/ads" className="text-gray-400 hover:text-primary-blue text-sm flex items-center gap-2 transition">
                  <FaCalendarAlt /> Events
                </Link>
              </li>
              <li>
                <Link to="/rules" className="text-gray-400 hover:text-primary-blue text-sm flex items-center gap-2 transition">
                  <FaTableTennis /> Rules & Scoring
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-primary-blue mt-0.5" />
                <span className="text-gray-400 text-sm">
                  15-Commercial,<br />
                  Suny Park, Lahore
                </span>
              </li>
              <li>
                <a 
                  href="tel:+923259898900"
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-3 transition"
                >
                  <FaPhone className="text-primary-blue" />
                  0325-9898900
                </a>
              </li>
              <li>
                <a 
                  href="mailto:spinergy.info@gmail.com"
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-3 transition"
                >
                  <FaEnvelope className="text-primary-blue" />
                  spinergy.info@gmail.com
                </a>
              </li>
            </ul>

            {/* Hours */}
            <div className="mt-4 p-3 bg-gray-900 rounded-lg">
              <h4 className="text-xs text-gray-500 uppercase mb-2">Opening Hours</h4>
              <p className="text-sm text-white">Mon - Sun: 2PM - 11PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800/50 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-gray-500 text-sm">
                &copy; {currentYear} <span className="text-white font-semibold">SPINERGY</span> Table Tennis Club. 
                All rights reserved.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Made with <FaHeart className="inline text-red-500 mx-1" /> in Lahore, Pakistan
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link to="/rules" className="text-gray-500 hover:text-gray-300 transition">
                Terms & Conditions
              </Link>
              <Link to="/contact" className="text-gray-500 hover:text-gray-300 transition">
                Privacy Policy
              </Link>
              <Link to="/suggestions" className="text-gray-500 hover:text-gray-300 transition">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
