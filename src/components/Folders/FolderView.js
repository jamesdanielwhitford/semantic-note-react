import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NoteContext';
import NoteList from '../Notes/NoteList';
import { Edit, Trash2, FolderPlus, ArrowLeft, FolderIcon } from 'lucide-react';

const FolderView = () => {
  const { folderId } = useParams();
  const { folders, setCurrentFolder, removeFolder } = useFolders();
  const { notes } = useNotes();
  const navigate = useNavigate();
  
  // Find the folder to display
  const folder = folderId 
    ? folders.find(f => f.id === parseInt(folderId))
    : null;
  
  // Get parent folder if exists
  const parentFolder = folder?.parentId
    ? folders.find(f => f.id === folder.parentId)
    : null;

  // Get child folders 
  const childFolders = folder
    ? folders.filter(f => f.parentId === parseInt(folderId))
    : [];
  
  // Get notes in this folder
  const folderNotes = notes.filter(note => note.folderId === parseInt(folderId));
  
  const handleDeleteFolder = async () => {
    if (!folder) return;
    
    try {
      if (window.confirm('Are you sure you want to delete this folder? Notes will be unassigned.')) {
        await removeFolder(folder.id);
        navigate('/folders');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };
  
  // If folder not found
  if (!folder && folderId) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Folder Not Found</h2>
        <p className="text-gray-600 mb-4">
          The folder you're looking for doesn't exist or has been deleted.
        </p>
        <Link 
          to="/" 
          className="text-blue-500 hover:underline"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {parentFolder ? (
              <Link 
                to={`/folders/${parentFolder.id}`}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </Link>
            ) : (
              <Link 
                to="/"
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </Link>
            )}
            <div>
              <h2 className="text-2xl font-semibold">{folder.title}</h2>
              {parentFolder && (
                <div className="text-sm text-gray-600 mt-1">
                  Parent folder: 
                  <Link 
                    to={`/folders/${parentFolder.id}`}
                    className="ml-1 text-blue-500 hover:underline"
                  >
                    {parentFolder.title}
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDeleteFolder}
              className="flex items-center px-3 py-1 bg-red-100 rounded hover:bg-red-200 text-red-700"
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </button>
          </div>
        </div>
        
        {folder.description && (
          <p className="text-gray-600 mt-2">{folder.description}</p>
        )}
      </div>
      
      {/* Subfolder section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Subfolders {childFolders.length > 0 && `(${childFolders.length})`}
          </h3>
          
          <div className="flex space-x-3">
            <Link 
              to={`/folder-suggestions/${folderId}`}
              className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800"
            >
              <FolderPlus size={16} className="mr-1" />
              AI Suggestions
            </Link>
            <Link 
              to={`/create-folder/${folderId}`}
              className="flex items-center px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 text-blue-700"
            >
              <FolderPlus size={16} className="mr-1" />
              Create Subfolder
            </Link>
          </div>
        </div>
        
        {/* Render existing subfolders */}
        {childFolders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {childFolders.map(subFolder => (
              <Link
                key={subFolder.id}
                to={`/folders/${subFolder.id}`}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <FolderIcon size={18} className="text-yellow-500 mr-2 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-800">{subFolder.title}</h4>
                    {subFolder.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {subFolder.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border p-6 text-center text-gray-500">
            <p>No subfolders yet.</p>
            <p className="text-sm mt-1">Create subfolders to organize your notes further.</p>
          </div>
        )}
      </div>
      
      {/* Notes section */}
      <div className="mt-8">
        <NoteList folderId={parseInt(folderId)} />
      </div>
    </div>
  );
};

export default FolderView;