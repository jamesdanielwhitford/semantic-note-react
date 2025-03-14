// src/components/Notes/CreateNote.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotes } from '../../context/NoteContext';
import { useFolders } from '../../context/FolderContext';
import { Sparkles, AlertCircle } from 'lucide-react';

const CreateNote = () => {
  const { noteId } = useParams();
  const { notes, createNote, editNote } = useNotes();
  const { folders } = useFolders();
  const navigate = useNavigate();
  
  // Find existing note if we're editing
  const existingNote = noteId 
    ? notes.find(note => note.id === parseInt(noteId))
    : null;
  
  const [content, setContent] = useState(existingNote?.content || '');
  const [folderId, setFolderId] = useState(existingNote?.folderId || '');
  const [autoAssign, setAutoAssign] = useState(!existingNote?.folderId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showingBestMatch, setShowingBestMatch] = useState(false);
  
  const isEditing = !!existingNote;
  
  // Get best matching folder when content changes significantly
  useEffect(() => {
    const findBestMatch = async () => {
      if (!autoAssign || content.length < 50 || isEditing) return;
      
      // Only check when there's enough content and not too often
      const shouldCheck = content.length >= 100 && !showingBestMatch;
      
      if (shouldCheck) {
        try {
          setShowingBestMatch(true);
          
          // Get proposed folder based on content
          // This is a lightweight preview, not the full algorithm
          const matchingFolder = folders.find(folder => {
            const folderTerms = `${folder.title} ${folder.description || ''}`.toLowerCase();
            const contentLower = content.toLowerCase();
            
            // Simple term matching for preview purposes
            return folderTerms.split(' ').some(term => 
              term.length > 3 && contentLower.includes(term)
            );
          });
          
          if (matchingFolder) {
            setAiSuggestion({
              id: matchingFolder.id,
              title: matchingFolder.title
            });
          } else {
            setAiSuggestion(null);
          }
        } catch (error) {
          console.error('Error finding best match:', error);
        }
      }
    };
    
    findBestMatch();
  }, [content, autoAssign, folders, isEditing, showingBestMatch]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter note content');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const noteData = {
        content: content.trim(),
        folderId: autoAssign ? null : (folderId ? parseInt(folderId) : null)
      };
      
      if (isEditing) {
        await editNote(existingNote.id, noteData);
        navigate(`/notes/${existingNote.id}`);
      } else {
        const newNote = await createNote(noteData);
        navigate(`/notes/${newNote.id}`);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setError(err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
        {isEditing ? 'Edit Note' : 'Create New Note'}
      </h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="content" className="block text-gray-700 mb-1">
            Note Content*
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="12"
            placeholder="Enter your note content here..."
            required
          />
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                checked={autoAssign}
                onChange={() => setAutoAssign(!autoAssign)}
                className="mr-2"
              />
              Auto-assign to best matching folder
            </label>
          </div>
          
          {/* Show AI suggestion if available */}
          {autoAssign && aiSuggestion && (
            <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-3 flex items-center">
              <Sparkles size={18} className="text-blue-500 mr-2" />
              <div>
                <span className="text-sm text-blue-700">
                  Based on content, this note will likely be assigned to: 
                </span>
                <span className="ml-1 font-medium">"{aiSuggestion.title}"</span>
              </div>
            </div>
          )}
          
          {!autoAssign && (
            <div>
              <label htmlFor="folderId" className="block text-gray-700 mb-1">
                Folder
              </label>
              <select
                id="folderId"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Unassigned)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {autoAssign && (
            <p className="text-sm text-gray-600">
              Note will be automatically assigned to the most semantically relevant folder based on content.
            </p>
          )}
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
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Note' : 'Create Note')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNote;