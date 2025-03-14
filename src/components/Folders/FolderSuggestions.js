// src/components/Folders/FolderSuggestions.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NoteContext';
import { FolderIcon, Plus, Loader, ChevronDown, ChevronRight, FileText, Check } from 'lucide-react';

const FolderSuggestions = () => {
  const { folderId } = useParams();
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoContext, setIsAutoContext] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [hierarchicalView, setHierarchicalView] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState({});
  
  const { createFolder, createFolderFromSuggestion, folders } = useFolders();
  const { notes, generateFolderSuggestions, generateHierarchicalSuggestions } = useNotes();
  const navigate = useNavigate();

  // Get current folder if folderId is provided
  const currentFolder = folderId ? folders.find(f => f.id === parseInt(folderId)) : null;
  
  // Reset selected notes when suggestions change
  useEffect(() => {
    const initialSelectedState = {};
    suggestions.forEach(suggestion => {
      if (suggestion.noteIds) {
        suggestion.noteIds.forEach(noteId => {
          initialSelectedState[noteId] = true;
        });
      }
    });
    setSelectedNotes(initialSelectedState);
  }, [suggestions]);
  
  // Toggle note selection
  const toggleNoteSelection = (noteId, suggestionIndex) => {
    setSelectedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };
  
  // Generate suggestions based on context
  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setError('');
    setSuggestions([]);
    
    try {
      // Generate suggestions
      if (hierarchicalView) {
        const hierarchicalSuggestions = await generateHierarchicalSuggestions();
        setSuggestions(hierarchicalSuggestions);
      } else {
        // For regular suggestions, pass parent folder ID if available
        const parentId = currentFolder ? parseInt(folderId) : null;
        const result = await generateFolderSuggestions(isAutoContext, parentId);
        setSuggestions(result);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err.message || 'Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create folder from suggestion
  const handleCreateFolder = async (suggestion, index) => {
    try {
      setIsLoading(true);
      
      // Filter selected notes
      const filteredNoteIds = suggestion.noteIds.filter(id => selectedNotes[id]);
      
      // Create folder with selected notes
      const folderData = {
        title: suggestion.title,
        description: suggestion.description,
        noteIds: filteredNoteIds,
        parentId: currentFolder ? parseInt(folderId) : null
      };
      
      const newFolder = await createFolder(folderData);
      
      // Remove this suggestion from the list
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      
      // Navigate to the new folder
      navigate(`/folders/${newFolder.id}`);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle expanded suggestion
  const toggleExpanded = (index) => {
    setExpandedSuggestion(expandedSuggestion === index ? null : index);
  };
  
  // Render note preview for a suggestion
  const renderNotePreview = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return null;
    
    return (
      <div 
        key={noteId} 
        className="flex items-center py-2 px-3 border-b last:border-b-0 hover:bg-gray-50"
      >
        <input 
          type="checkbox"
          checked={selectedNotes[noteId] || false}
          onChange={() => toggleNoteSelection(noteId)}
          className="mr-3"
        />
        <FileText size={16} className="text-blue-500 mr-2 flex-shrink-0" />
        <div className="text-sm truncate flex-grow">
          {note.content.substring(0, 100)}
          {note.content.length > 100 ? '...' : ''}
        </div>
      </div>
    );
  };
  
  // Render a single suggestion
  const renderSuggestion = (suggestion, index, isSubfolder = false) => {
    const isExpanded = expandedSuggestion === index;
    const noteCount = suggestion.noteIds ? suggestion.noteIds.length : 0;
    const selectedCount = suggestion.noteIds 
      ? suggestion.noteIds.filter(id => selectedNotes[id]).length 
      : 0;
    
    return (
      <div
        key={index}
        className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${isSubfolder ? 'ml-8 mt-3' : 'mb-4'}`}
      >
        <div className="flex items-start">
          <button 
            onClick={() => toggleExpanded(index)}
            className="text-gray-500 mr-2 mt-1"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <FolderIcon size={20} className="text-yellow-500 mr-3 mt-1" />
          
          <div className="flex-grow">
            <div className="flex items-center">
              <h4 className="font-medium text-gray-800">{suggestion.title}</h4>
              {suggestion.cohesion && (
                <span className="ml-2 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                  {Math.round(suggestion.cohesion * 100)}% match
                </span>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mt-1">{suggestion.description}</p>
            
            <div className="mt-2 text-xs text-gray-500">
              {selectedCount}/{noteCount} notes selected
            </div>
          </div>
          
          <button
            onClick={() => handleCreateFolder(suggestion, index)}
            className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={isLoading || selectedCount === 0}
          >
            {isLoading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
            <span className="ml-1">Create</span>
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-4 border rounded-md max-h-64 overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-sm font-medium">Notes to include</span>
              <label className="flex items-center text-xs">
                <input 
                  type="checkbox"
                  checked={suggestion.noteIds?.every(id => selectedNotes[id]) || false}
                  onChange={() => {
                    const allSelected = suggestion.noteIds?.every(id => selectedNotes[id]);
                    const newSelection = {};
                    suggestion.noteIds?.forEach(id => {
                      newSelection[id] = !allSelected;
                    });
                    setSelectedNotes(prev => ({...prev, ...newSelection}));
                  }}
                  className="mr-1"
                />
                Select all
              </label>
            </div>
            <div>
              {suggestion.noteIds && suggestion.noteIds.map(noteId => renderNotePreview(noteId))}
            </div>
          </div>
        )}
        
        {/* Render subfolder suggestions if available */}
        {isExpanded && suggestion.subFolders && suggestion.subFolders.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Potential Subfolders</h5>
            {suggestion.subFolders.map((subFolder, subIndex) => 
              renderSuggestion(subFolder, `${index}-${subIndex}`, true)
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-2">
        {currentFolder 
          ? `Suggest Subfolders for "${currentFolder.title}"`
          : "Get AI Folder Suggestions"}
      </h2>
      
      {currentFolder && (
        <p className="text-gray-600 mb-6">
          Create intelligent subfolders to organize the {notes.filter(n => n.folderId === parseInt(folderId)).length} notes in this folder.
        </p>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-3">Suggestion Options</h3>
          
          <div className="flex items-center mb-4">
            <label className="flex items-center mr-6 text-gray-700">
              <input
                type="checkbox"
                checked={isAutoContext}
                onChange={() => setIsAutoContext(!isAutoContext)}
                className="mr-2"
              />
              Use {currentFolder ? 'all notes in this folder' : 'recent notes'} as context
            </label>
            
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                checked={hierarchicalView}
                onChange={() => setHierarchicalView(!hierarchicalView)}
                className="mr-2"
              />
              Show hierarchical suggestions
            </label>
          </div>
          
          {!isAutoContext && !currentFolder && (
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
            <p className="text-sm text-gray-600 mb-4">
              The AI will analyze {currentFolder 
                ? `the ${notes.filter(n => n.folderId === parseInt(folderId)).length} notes in this folder` 
                : `your ${notes.length} notes`} to suggest appropriate folders.
            </p>
          )}
        </div>
        
        <button
          onClick={handleGenerateSuggestions}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          disabled={isLoading || (!context && !isAutoContext && !currentFolder)}
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
          <h3 className="text-lg font-medium mb-4">
            {hierarchicalView ? 'Hierarchical Folder Suggestions' : 'Suggested Folders'}
          </h3>
          
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
          </div>
        </div>
      )}
      
      {suggestions.length === 0 && !isLoading && !error && (
        <div className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg border border-gray-200">
          <FolderIcon size={40} className="text-gray-300 mx-auto mb-3" />
          <p>Generate suggestions to see folder recommendations based on your notes.</p>
        </div>
      )}
    </div>
  );
};

export default FolderSuggestions;