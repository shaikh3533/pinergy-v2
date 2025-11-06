import { Link } from 'react-router-dom';
import logoImage from '../../assets/primary white variant logo.jpeg';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800 mt-auto">
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
            <p className="text-gray-400 text-sm">
              Premium table tennis club with professional DC-700 and Tibhar tables in Lahore.
            </p>
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
              <li>🎯 DC-700 (Double Circle Waldner 25mm)</li>
              <li>🎯 Tibhar (25mm Professional)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 spinergy.info@gmail.com</li>
              <li>📱 0325-9898900</li>
              <li>📍 Suny Park, Lahore</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} SPINERGY Table Tennis Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

