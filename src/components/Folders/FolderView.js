import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import NoteList from '../Notes/NoteList';
import { Edit, RefreshCw, Trash2 } from 'lucide-react';

const FolderView = () => {
  const { folderId } = useParams();
  const { folders, setCurrentFolder, updateFolderSummary, removeFolder } = useFolders();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Find the folder to display
  const folder = folderId 
    ? folders.find(f => f.id === parseInt(folderId))
    : null;
  
  // Get parent folder if exists
  const parentFolder = folder?.parentId
    ? folders.find(f => f.id === folder.parentId)
    : null;
  
  // Set as current folder when loaded - with proper dependency array
  useEffect(() => {
    if (folder) {
      setCurrentFolder(folder);
    }
  }, [folderId, folders]); // Only run when folderId or folders change, not when folder changes
  
  const handleUpdateSummary = async () => {
    if (!folder) return;
    
    setIsUpdating(true);
    setUpdateMessage('');
    
    try {
      await updateFolderSummary(folder.id);
      setUpdateMessage('Folder summary updated successfully.');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (error) {
      console.error('Error updating summary:', error);
      setUpdateMessage('Failed to update summary.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteFolder = async () => {
    if (!folder) return;
    
    try {
      if (window.confirm('Are you sure you want to delete this folder? Notes will be unassigned.')) {
        await removeFolder(folder.id);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };
  
  // If no folderId is provided, show all notes
  if (!folderId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">All Notes</h2>
        <NoteList />
      </div>
    );
  }
  
  // If folder not found
  if (!folder) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Folder Not Found</h2>
        <p className="text-gray-600 mb-4">
          The folder you're looking for doesn't exist or has been deleted.
        </p>
        <Link 
          to="/folders" 
          className="text-blue-500 hover:underline"
        >
          Return to all folders
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
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
          
          <div className="flex space-x-2">
            <button
              onClick={handleUpdateSummary}
              className="flex items-center px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
              disabled={isUpdating}
            >
              <RefreshCw size={16} className={`mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
              Update Summary
            </button>
            <Link
              to={`/folders/${folder.id}/edit`}
              className="flex items-center px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Link>
            <button
              onClick={handleDeleteFolder}
              className="flex items-center px-3 py-1 bg-red-100 rounded hover:bg-red-200 text-red-700"
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </button>
          </div>
        </div>
        
        {updateMessage && (
          <div className="mt-2 text-sm text-green-600">
            {updateMessage}
          </div>
        )}
        
        {folder.description && (
          <p className="text-gray-600 mt-2">{folder.description}</p>
        )}
        
        {folder.summary && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-1">AI-Generated Summary</h3>
            <p className="text-gray-700">{folder.summary}</p>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <NoteList folderId={parseInt(folderId)} />
      </div>
    </div>
  );
};

export default FolderView;