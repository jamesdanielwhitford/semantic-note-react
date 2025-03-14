import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NoteContext';
import { generateFolderSuggestions } from '../../services/openai';
import { FolderIcon, Plus, Loader } from 'lucide-react';

const FolderSuggestions = () => {
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoContext, setIsAutoContext] = useState(false);
  
  const { createFolder } = useFolders();
  const { notes } = useNotes();
  const navigate = useNavigate();
  
  const generateAutoContext = () => {
    // Take content from up to 10 most recent notes to create context
    const recentNotes = [...notes]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
      
    if (recentNotes.length === 0) {
      setError('No notes available to generate context');
      return '';
    }
    
    const combinedContent = recentNotes
      .map(note => note.content)
      .join('\n\n');
      
    return combinedContent;
  };
  
  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setError('');
    setSuggestions([]);
    
    try {
      const contextToUse = isAutoContext ? generateAutoContext() : context;
      
      if (!contextToUse) {
        setIsLoading(false);
        return;
      }
      
      const result = await generateFolderSuggestions(contextToUse);
      setSuggestions(result);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err.message || 'Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateFolder = async (suggestion) => {
    try {
      const newFolder = await createFolder({
        title: suggestion.title,
        description: suggestion.description
      });
      
      navigate(`/folders/${newFolder.id}`);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Get AI Folder Suggestions</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                checked={isAutoContext}
                onChange={() => setIsAutoContext(!isAutoContext)}
                className="mr-2"
              />
              Use recent notes as context
            </label>
          </div>
          
          {!isAutoContext && (
            <div>
              <label htmlFor="context" className="block text-gray-700 mb-1">
                Enter context for folder suggestions
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
                placeholder="Enter notes, ideas, or topics you'd like to organize"
                disabled={isLoading}
              />
            </div>
          )}
          
          {isAutoContext && (
            <p className="text-sm text-gray-600">
              The AI will analyze your {notes.length} most recent notes to suggest appropriate folders.
            </p>
          )}
        </div>
        
        <button
          onClick={handleGenerateSuggestions}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          disabled={isLoading || (!context && !isAutoContext)}
        >
          {isLoading ? (
            <>
              <Loader size={18} className="animate-spin mr-2" />
              Generating Suggestions...
            </>
          ) : (
            'Generate Folder Suggestions'
          )}
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Suggested Folders</h3>
          
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <FolderIcon size={20} className="text-yellow-500 mr-3 mt-1" />
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-800">{suggestion.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{suggestion.description}</p>
                  </div>
                  <button
                    onClick={() => handleCreateFolder(suggestion)}
                    className="flex items-center text-blue-500 hover:text-blue-700"
                    title="Create this folder"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSuggestions;