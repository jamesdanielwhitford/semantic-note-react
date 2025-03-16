import React from 'react';
import { Link } from 'react-router-dom';
import { useFolders } from '../context/FolderContext';
import { useNotes } from '../context/NoteContext';
import { FilePlus, FolderPlus, FileText, FolderIcon, ImagePlus, Image } from 'lucide-react';
import NoteList from './Notes/NoteList';

const Dashboard = () => {
  const { folders } = useFolders();
  const { notes } = useNotes();
  
  // Get top-level folders
  const topLevelFolders = folders.filter(folder => !folder.parentId);
  
  // Get unorganized notes
  const unorganizedNotes = notes.filter(note => !note.folderId);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to SemanticNote</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/create-note"
              className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <FilePlus size={20} className="mr-2" />
              Create Text Note
            </Link>
            <Link
              to="/create-image-note"
              className="flex items-center justify-center p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <ImagePlus size={20} className="mr-2" />
              Create Image Note
            </Link>
            <Link
              to="/folder-suggestions"
              className="flex items-center justify-center p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              <FolderPlus size={20} className="mr-2" />
              Create Folder
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{notes.length}</div>
              <div className="text-sm text-gray-600">Total Notes</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{folders.length}</div>
              <div className="text-sm text-gray-600">Total Folders</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{topLevelFolders.length}</div>
              <div className="text-sm text-gray-600">Main Categories</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {unorganizedNotes.length}
              </div>
              <div className="text-sm text-gray-600">Unorganized Notes</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Folders section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Folders</h2>
          <Link 
            to="/folder-suggestions" 
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <FolderPlus size={18} className="mr-1" />
            Create Folder
          </Link>
        </div>
        
        {topLevelFolders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border p-10 text-center">
            <FolderIcon size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">You don't have any folders yet.</p>
            <Link
              to="/folder-suggestions"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Your First Folder
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topLevelFolders.map(folder => (
              <Link
                key={folder.id}
                to={`/folders/${folder.id}`}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <FolderIcon size={20} className="text-yellow-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-800">{folder.title}</h3>
                    {folder.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {folder.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {notes.filter(note => note.folderId === folder.id).length} notes
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Unorganized notes section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Unorganized Notes {unorganizedNotes.length > 0 && `(${unorganizedNotes.length})`}
          </h2>
          <div className="flex space-x-2">
            <Link 
              to="/create-image-note" 
              className="flex items-center text-purple-500 hover:text-purple-700"
            >
              <ImagePlus size={18} className="mr-1" />
              Create Image Note
            </Link>
            <Link 
              to="/create-note" 
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <FilePlus size={18} className="mr-1" />
              Create Text Note
            </Link>
          </div>
        </div>
        
        {unorganizedNotes.length > 0 ? (
          <div>
            <NoteList />
            
            {unorganizedNotes.length >= 3 && (
              <div className="mt-6 text-center">
                <Link
                  to="/folder-suggestions"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Organize These Notes
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border p-10 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No unorganized notes. All your notes are in folders!</p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/create-note"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create a Text Note
              </Link>
              <Link
                to="/create-image-note"
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Create an Image Note
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;