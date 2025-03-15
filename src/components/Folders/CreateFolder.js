import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { Sparkles } from 'lucide-react';

const CreateFolder = () => {
  const { folderId } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { folders, createFolder } = useFolders();
  const navigate = useNavigate();
  
  // Get current folder if folderId is provided
  const currentFolder = folderId ? folders.find(f => f.id === parseInt(folderId)) : null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a folder title');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const folderData = {
        title: title.trim(),
        description: description.trim(),
        parentId: currentFolder ? parseInt(folderId) : null
      };
      
      const newFolder = await createFolder(folderData);
      navigate(`/folders/${newFolder.id}`);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
        {currentFolder 
          ? `Create Subfolder in "${currentFolder.title}"`
          : "Create New Folder"}
      </h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6">
          <Link 
            to={currentFolder ? `/folder-suggestions/${folderId}` : "/folder-suggestions"}
            className="flex items-center justify-center py-3 px-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100"
          >
            <Sparkles size={18} className="mr-2" />
            Get AI-Suggested Folders
          </Link>
        </div>
        
        <div className="text-center mb-6">
          <span className="text-gray-500">— or create manually —</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 mb-1">
              Folder Title*
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter folder title"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe what this folder will contain"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 mr-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolder;