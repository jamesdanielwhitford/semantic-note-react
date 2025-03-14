// Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, FolderPlus, FilePlus, FolderIcon } from 'lucide-react';
import FolderList from '../Folders/FolderList';

const Sidebar = ({ isOpen }) => {
  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r overflow-hidden transition-transform duration-300 ease-in-out mt-14
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:mt-0
      `}
    >
      <div className="h-full flex flex-col">
        <nav className="p-4 border-b">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="flex items-center py-2 px-4 rounded hover:bg-gray-100 text-gray-700"
              >
                <Home size={18} className="mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/notes"
                className="flex items-center py-2 px-4 rounded hover:bg-gray-100 text-gray-700"
              >
                <FileText size={18} className="mr-3" />
                All Notes
              </Link>
            </li>
            <li>
              <Link
                to="/create-note"
                className="flex items-center py-2 px-4 rounded hover:bg-gray-100 text-gray-700"
              >
                <FilePlus size={18} className="mr-3" />
                Create Note
              </Link>
            </li>
            <li>
              <Link
                to="/create-folder"
                className="flex items-center py-2 px-4 rounded hover:bg-gray-100 text-gray-700"
              >
                <FolderPlus size={18} className="mr-3" />
                Create Folder
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="flex-grow overflow-y-auto">
          <FolderList />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;