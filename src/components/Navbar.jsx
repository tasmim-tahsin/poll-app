import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-2">
        
          <div className="flex items-center justify-between">
            {/* Logo/Home Link */}
            <div>
              <Link to="/" className="flex items-center py-4 px-2">
              <img src="https://img.icons8.com/?size=70&id=13822&format=png" alt="" srcset="" />
                <span className="font-semibold text-gray-500 text-xl">PollApp</span>
              </Link>
            </div>
            
            {/* Primary Nav Links */}
            <div className="flex space-x-1">
              <Link 
                to="/" 
                className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
      </div>
    </nav>
  );
}