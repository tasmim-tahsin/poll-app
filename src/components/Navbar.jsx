import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        
          <div className="flex justify-between">
            <div>
              {/* Website Logo */}
              <Link to="/" className="flex items-center py-4 px-2">
                <img src="https://img.icons8.com/?size=70&id=13822&format=png" alt="Logo" className="h-8 w-8 mr-2"/>
                <span className="font-semibold text-gray-500 text-lg">PollApp</span>
              </Link>
            </div>
            {/* Primary Navbar items */}
            <div className="flex items-center space-x-1">
              <Link to="/" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">Home</Link>
              <Link to="/create" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">Create Poll</Link>
              <Link to="/admin" className="py-4 px-2 text-gray-500 font-semibold hover:text-blue-500 transition duration-300">Admin</Link>
            </div>
          </div>
      </div>
    </nav>
  );
}
