import { Link } from 'react-router-dom';
import { 
  FaInstagram, 
  FaFacebook, 
  FaTiktok, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaTableTennis
} from 'react-icons/fa';
import logoImage from '../../assets/primary white variant logo.jpeg';

const Footer = () => {
  return (
    <footer 
      className="bg-black border-t border-gray-800 mt-auto relative"
      style={{
        boxShadow: '0 -2px 20px rgba(74, 134, 247, 0.1), 0 -1px 10px rgba(74, 134, 247, 0.15)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={logoImage} 
                alt="SPINERGY Logo" 
                className="h-12 w-auto"
              />
              <span className="text-xl font-bold text-white tracking-wider">
                SPINERGY
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Premium table tennis club with professional DC-700 and Tibhar tables in Lahore.
            </p>
            
            {/* Social Media Links */}
            <div className="flex gap-4 mt-4">
              <a
                href="https://www.instagram.com/spinergy_?igsh=MXVpYWRpeTJxOWc5YQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://www.facebook.com/share/1Gdv7HipVj/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook size={24} />
              </a>
              <a
                href="https://vt.tiktok.com/ZSyXMaGdn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <FaTiktok size={24} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-gray-400 hover:text-white text-sm transition">
                  Book Slot
                </Link>
              </li>
              <li>
                <Link to="/ratings" className="text-gray-400 hover:text-white text-sm transition">
                  Ratings
                </Link>
              </li>
              <li>
                <Link to="/rules" className="text-gray-400 hover:text-white text-sm transition">
                  Rules
                </Link>
              </li>
              <li>
                <Link to="/suggestions" className="text-gray-400 hover:text-white text-sm transition">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Our Tables</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <FaTableTennis className="text-primary-blue" />
                DC-700 (Professional 25mm)
              </li>
              <li className="flex items-center gap-2">
                <FaTableTennis className="text-primary-blue" />
                Tibhar (Professional 25mm)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-primary-blue" />
                spinergy.info@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-primary-blue" />
                0325-9898900
              </li>
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-blue" />
                Suny Park, Lahore
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="text-center text-gray-400 text-sm mb-4">
            <p>Follow us on social media for updates and tournaments!</p>
          </div>
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} 15-Commercial SPINERGY Club. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

