// src/components/Folders/FolderView.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NoteContext';
import NoteList from '../Notes/NoteList';
import { Edit, RefreshCw, Trash2, FolderPlus, Layers, Sparkles, AlertCircle, FolderIcon } from 'lucide-react';

const FolderView = () => {
  const { folderId } = useParams();
  const { folders, setCurrentFolder, updateFolderSummary, removeFolder } = useFolders();
  const { notes, generateFolderSuggestions } = useNotes();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [subfolderSuggestions, setSubfolderSuggestions] = useState([]);
  const [showingSuggestions, setShowingSuggestions] = useState(false);
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
  
  // Set as current folder when loaded - with proper dependency array
  useEffect(() => {
    if (folder) {
      setCurrentFolder(folder);
    }
  }, [folderId, folders, setCurrentFolder]);
  
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
        navigate('/folders');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };
  
  const handleGetSubfolderSuggestions = async () => {
    if (!folder) return;
    
    setIsUpdating(true);
    setUpdateMessage('');
    
    try {
      // Get subfolder suggestions for this folder
      const suggestions = await generateFolderSuggestions(true, parseInt(folderId));
      setSubfolderSuggestions(suggestions);
      setShowingSuggestions(true);
      
      if (suggestions.length === 0) {
        setUpdateMessage('No subfolder suggestions available. Try adding more notes to this folder.');
        setTimeout(() => setUpdateMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error getting subfolder suggestions:', error);
      setUpdateMessage('Failed to generate subfolder suggestions.');
      setTimeout(() => setUpdateMessage(''), 3000);
    } finally {
      setIsUpdating(false);
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
  
  // Render subfolder suggestions
  const renderSubfolderSuggestions = () => {
    if (!showingSuggestions || subfolderSuggestions.length === 0) return null;
    
    return (
      <div className="mb-8 bg-blue-50 rounded-lg border border-blue-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-blue-800 flex items-center">
            <Sparkles size={18} className="mr-2" />
            Suggested Subfolders
          </h3>
          <button
            onClick={() => setShowingSuggestions(false)}
            className="text-blue-500 text-sm hover:underline"
          >
            Hide
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subfolderSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-white rounded-lg border p-3 hover:shadow-sm">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Would organize {suggestion.noteCount} notes
                  </div>
                </div>
                <Link
                  to={`/folder-suggestions/${folderId}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FolderPlus size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <Link
            to={`/folder-suggestions/${folderId}`}
            className="text-blue-600 hover:underline text-sm"
          >
            View and customize suggestions
          </Link>
        </div>
      </div>
    );
  };
  
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
      
      {/* Subfolder section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Layers size={18} className="mr-2" />
            Subfolders {childFolders.length > 0 && `(${childFolders.length})`}
          </h3>
          
          <div className="flex items-center">
            <Link 
              to={`/create-folder?parentId=${folderId}`}
              className="text-sm text-blue-500 hover:underline mr-4"
            >
              Create Subfolder
            </Link>
            
            {!showingSuggestions && folderNotes.length >= 3 && (
              <button
                onClick={handleGetSubfolderSuggestions}
                className="text-sm text-blue-500 hover:underline flex items-center"
                disabled={isUpdating}
              >
                <Sparkles size={16} className="mr-1" />
                Get Suggestions
              </button>
            )}
          </div>
        </div>
        
        {/* Render subfolder suggestions if available */}
        {renderSubfolderSuggestions()}
        
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