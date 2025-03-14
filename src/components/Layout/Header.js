// Header.js
import {React} from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { deleteAllData } from '../../services/api';

const Header = ({ toggleSidebar }) => {
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      try {
        await deleteAllData();
        window.location.reload();
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Failed to reset data');
      }
    }
  };
  
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-3 md:hidden text-white focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          
          <Link to="/" className="text-xl font-semibold">
            SemanticNote
          </Link>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={handleReset}
            className="flex items-center text-sm px-3 py-1 bg-red-500 rounded hover:bg-red-600"
          >
            <LogOut size={16} className="mr-1" />
            Reset App
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
