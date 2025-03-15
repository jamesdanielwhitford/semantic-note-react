// src/components/Folders/FolderSuggestions.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NoteContext';
import { 
  FolderIcon, Plus, Loader, ChevronDown, ChevronRight, 
  FileText, ArrowLeft, Check, Info
} from 'lucide-react';

const FolderSuggestions = () => {
  const { folderId } = useParams();
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState({});
  const [createdFolders, setCreatedFolders] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { createFolder, folders } = useFolders();
  const { notes, suggestFolders, moveNotesToFolder } = useNotes();
  const navigate = useNavigate();

  // Get current folder if folderId is provided
  const currentFolder = folderId ? folders.find(f => f.id === parseInt(folderId)) : null;
  
  // Get existing subfolders for the current folder
  const existingSubfolders = currentFolder 
    ? folders.filter(f => f.parentId === parseInt(folderId))
    : folders.filter(f => !f.parentId); // Top-level folders if not in a folder

  // Handle moving notes to an existing folder
  const handleMoveToExistingFolder = async (suggestion, index) => {
    try {
      setIsLoading(true);
      
      // Filter selected notes
      const filteredNoteIds = suggestion.noteIds.filter(id => selectedNotes[id]);
      
      if (filteredNoteIds.length === 0) {
        throw new Error('No notes selected to move');
      }
      
      // Move selected notes to the existing folder
      await moveNotesToFolder(filteredNoteIds, suggestion.folderId);
      
      // Mark this suggestion as processed
      setCreatedFolders(prev => [...prev, { 
        index, 
        folderId: suggestion.folderId,
        isExisting: true
      }]);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error moving notes to folder:', err);
      setError(err.message || 'Failed to move notes to folder');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate suggestions when component loads
  useEffect(() => {
    handleGenerateSuggestions();
  }, [folderId]);
  
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
    setSelectedNotes(prev => ({...prev, ...initialSelectedState}));
  }, [suggestions]);
  
  // Toggle note selection
  const toggleNoteSelection = (noteId) => {
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
    setCreatedFolders([]);
    
    try {
      // For regular suggestions, pass parent folder ID if available
      const parentId = currentFolder ? parseInt(folderId) : null;
      
      // Get notes to analyze (either notes in current folder or unassigned notes)
      const notesToAnalyze = parentId 
        ? notes.filter(note => note.folderId === parentId)
        : notes.filter(note => !note.folderId);
      
      // Skip if not enough notes
      if (notesToAnalyze.length < 3) {
        throw new Error('Not enough notes to generate suggestions. Add at least 3 notes.');
      }
      
      // Generate suggestions, passing existing subfolders for consideration
      const result = await suggestFolders(
        notesToAnalyze,
        existingSubfolders, 
        currentFolder?.title
      );
      
      setSuggestions(result);
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
      
      // Create folder
      const folderData = {
        title: suggestion.title,
        description: suggestion.description,
        parentId: currentFolder ? parseInt(folderId) : null
      };
      
      const newFolder = await createFolder(folderData);
      
      // Move selected notes to this folder
      if (filteredNoteIds.length > 0) {
        await moveNotesToFolder(filteredNoteIds, newFolder.id);
      }
      
      // Mark this suggestion as created
      setCreatedFolders(prev => [...prev, { index, folderId: newFolder.id }]);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to a created folder
  const goToFolder = (folderId) => {
    navigate(`/folders/${folderId}`);
  };
  
  // Toggle expanded suggestion
  const toggleExpanded = (index) => {
    setExpandedSuggestion(expandedSuggestion === index ? null : index);
  };
  
  // Check if a suggestion has already been created
  const isFolderCreated = (index) => {
    return createdFolders.some(folder => folder.index === index);
  };
  
  // Get the folder ID of a created suggestion
  const getCreatedFolderId = (index) => {
    const folder = createdFolders.find(folder => folder.index === index);
    return folder ? folder.folderId : null;
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
  
  const renderSuggestion = (suggestion, index) => {
    const isExpanded = expandedSuggestion === index;
    const noteCount = suggestion.noteIds ? suggestion.noteIds.length : 0;
    const selectedCount = suggestion.noteIds 
      ? suggestion.noteIds.filter(id => selectedNotes[id]).length 
      : 0;
    const isCreated = isFolderCreated(index);
    const createdFolderId = getCreatedFolderId(index);
    
    // Handle existing folder suggestions differently
    const isExistingFolder = suggestion.isExisting;
    
    return (
      <div
        key={index}
        className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow mb-4 ${
          isCreated ? 'border-green-300 bg-green-50' : 
          isExistingFolder ? 'border-blue-300 bg-blue-50' : ''
        }`}
      >
        <div className="flex items-start">
          <button 
            onClick={() => toggleExpanded(index)}
            className="text-gray-500 mr-2 mt-1"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <FolderIcon size={20} className={`${
            isCreated ? 'text-green-500' : 
            isExistingFolder ? 'text-blue-500' : 
            'text-yellow-500'
          } mr-3 mt-1`} />
          
          <div className="flex-grow">
            <h4 className="font-medium text-gray-800">{suggestion.title}</h4>
            <p className="text-gray-600 text-sm mt-1">{suggestion.description}</p>
            
            <div className="mt-2 text-xs text-gray-500">
              {isCreated ? (
                <span className="text-green-600 font-medium flex items-center">
                  <Check size={14} className="mr-1" /> {isExistingFolder ? 'Notes added to folder' : 'Folder created'}
                </span>
              ) : isExistingFolder ? (
                <span className="text-blue-600 font-medium flex items-center">
                  <Info size={14} className="mr-1" /> Existing folder
                </span>
              ) : (
                `${selectedCount}/${noteCount} notes selected`
              )}
            </div>
          </div>
          
          {isCreated ? (
            <button
              onClick={() => goToFolder(createdFolderId)}
              className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <span>View Folder</span>
            </button>
          ) : (
            <button
              onClick={() => isExistingFolder ? 
                handleMoveToExistingFolder(suggestion, index) : 
                handleCreateFolder(suggestion, index)
              }
              className={`flex items-center px-3 py-1.5 ${
                isExistingFolder ? 'bg-blue-500' : 'bg-blue-500'
              } text-white rounded hover:bg-blue-600`}
              disabled={isLoading || selectedCount === 0}
            >
              {isLoading ? <Loader size={16} className="animate-spin" /> : 
                isExistingFolder ? <FolderIcon size={16} /> : <Plus size={16} />
              }
              <span className="ml-1">{isExistingFolder ? 'Move Notes' : 'Create'}</span>
            </button>
          )}
        </div>
        
        {isExpanded && !isCreated && (
          <div className="mt-4 border rounded-md max-h-64 overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-sm font-medium">
                {isExistingFolder ? 'Notes to move' : 'Notes to include'}
              </span>
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
      </div>
    );
  };
  
  // Success message banner with support for both new and existing folders
  const renderSuccessMessage = () => {
    if (!showSuccessMessage) return null;
    
    // Determine if the most recent action was for an existing folder
    const latestFolder = createdFolders[createdFolders.length - 1];
    const isExistingFolder = latestFolder?.isExisting;
    
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <Check size={18} className="mr-2" />
          <span>
            {isExistingFolder 
              ? 'Notes successfully moved to folder!'
              : 'Folder created successfully!'}
          </span>
        </div>
      </div>
    );
  };
  
  // Action buttons at the bottom
  const renderActionButtons = () => {
    if (suggestions.length === 0 || isLoading) return null;
    
    const allCreated = suggestions.length > 0 && suggestions.every((_, index) => isFolderCreated(index));
    
    return (
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleGenerateSuggestions}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Refresh Suggestions
        </button>
        
        {allCreated && (
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        )}
        
        {createdFolders.length > 0 && !allCreated && (
          <div className="text-sm text-gray-600 italic flex items-center">
            <Check size={14} className="mr-1" />
            {createdFolders.length} of {suggestions.length} folders created
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      {renderSuccessMessage()}
      
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-semibold">
          {currentFolder 
            ? `Suggest Subfolders for "${currentFolder.title}"`
            : "Get AI Folder Suggestions"}
        </h2>
      </div>
      
      {currentFolder && (
        <p className="text-gray-600 mb-6">
          Create intelligent subfolders to organize the {notes.filter(n => n.folderId === parseInt(folderId)).length} notes in this folder.
          {existingSubfolders.length > 0 && (
            <span className="block mt-2 text-blue-600">
              You already have {existingSubfolders.length} existing subfolder(s) which will be considered.
            </span>
          )}
        </p>
      )}
      
      {!currentFolder && (
        <p className="text-gray-600 mb-6">
          Create folders to organize your {notes.filter(n => !n.folderId).length} unorganized notes.
          <br />
          <span className="text-blue-600 font-medium">You can create multiple folders from these suggestions!</span>
        </p>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-10">
          <Loader size={40} className="animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Generating folder suggestions...</p>
        </div>
      )}
      
      {suggestions.length > 0 && !isLoading && (
        <div>
          <h3 className="text-lg font-medium mb-4">
            Suggested Folders
          </h3>
          
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
          </div>
          
          {renderActionButtons()}
        </div>
      )}
      
      {suggestions.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg border border-gray-200">
          <FolderIcon size={40} className="text-gray-300 mx-auto mb-3" />
          <p>No suggestions available. Try adding more notes or click the button below to refresh.</p>
          <button
            onClick={handleGenerateSuggestions}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default FolderSuggestions;