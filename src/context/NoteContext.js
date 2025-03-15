import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getNotes, saveNote, updateNote, deleteNote, getFolders } from '../services/api';
import { generateFolderSuggestions } from '../services/openai';


// Initial state
const initialState = {
  notes: [],
  loading: false,
  error: null,
  currentNote: null
};

// Create context
const NoteContext = createContext(initialState);

// Note reducer
const noteReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_NOTES_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_NOTES_SUCCESS':
      return {
        ...state,
        notes: action.payload,
        loading: false
      };
    case 'FETCH_NOTES_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'CREATE_NOTE_SUCCESS':
      return {
        ...state,
        notes: [...state.notes, action.payload],
        currentNote: action.payload
      };
    case 'UPDATE_NOTE_SUCCESS':
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload.id ? action.payload : note
        ),
        currentNote: action.payload
      };
    case 'DELETE_NOTE_SUCCESS':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
        currentNote: null
      };
    case 'SET_CURRENT_NOTE':
      return {
        ...state,
        currentNote: action.payload
      };
    default:
      return state;
  }
};

// Provider component
export const NoteProvider = ({ children }) => {
  const [state, dispatch] = useReducer(noteReducer, initialState);

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Fetch all notes
  const fetchNotes = async () => {
    dispatch({ type: 'FETCH_NOTES_REQUEST' });
    try {
      const notesData = await getNotes();
      dispatch({ 
        type: 'FETCH_NOTES_SUCCESS', 
        payload: notesData 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_NOTES_FAILURE', 
        payload: error.message 
      });
    }
  };

  // Create a new note
  const createNote = async (noteData) => {
    try {
      // Save note
      const newNote = await saveNote(noteData);
      
      dispatch({ 
        type: 'CREATE_NOTE_SUCCESS', 
        payload: newNote 
      });
      
      return newNote;
    } catch (error) {
      dispatch({ 
        type: 'FETCH_NOTES_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  // Update a note
  const editNote = async (noteId, noteData) => {
    try {
      const updatedNote = await updateNote(noteId, noteData);
      
      dispatch({ 
        type: 'UPDATE_NOTE_SUCCESS', 
        payload: updatedNote 
      });
      
      return updatedNote;
    } catch (error) {
      dispatch({ 
        type: 'FETCH_NOTES_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  // Delete a note
  const removeNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      
      dispatch({ 
        type: 'DELETE_NOTE_SUCCESS', 
        payload: noteId 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_NOTES_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  // Set current note
  const setCurrentNote = (note) => {
    dispatch({ 
      type: 'SET_CURRENT_NOTE', 
      payload: note 
    });
  };

  // Get notes for a specific folder
  const getNotesByFolder = (folderId) => {
    return state.notes.filter(note => note.folderId === folderId);
  };

  // Get unorganized notes (not in any folder)
  const getUnorganizedNotes = () => {
    return state.notes.filter(note => !note.folderId);
  };

  // Generate folder suggestions using AI
  const suggestFolders = async (parentFolderId = null) => {
    try {
      let notesToAnalyze;
      let parentFolderTitle = null;
      
      // Get all folders to consider for suggestions
      const allFolders = await getFolders();
      
      // Filter to get relevant existing folders (exclude current parent and its children)
      let existingFoldersToConsider = [];
      if (parentFolderId) {
        // If we're in a folder, consider sibling folders (with same parent)
        existingFoldersToConsider = allFolders.filter(f => 
          f.id !== parentFolderId && 
          f.parentId === allFolders.find(pf => pf.id === parentFolderId)?.parentId
        );
        
        // Get notes in this folder
        notesToAnalyze = state.notes.filter(note => note.folderId === parentFolderId);
        
        // Get parent folder title for context
        const parentFolder = allFolders.find(f => f.id === parentFolderId);
        if (parentFolder) {
          parentFolderTitle = parentFolder.title;
        }
      } else {
        // If we're at top level, consider all top-level folders
        existingFoldersToConsider = allFolders.filter(f => !f.parentId);
        
        // Get top-level notes (not in any folder)
        notesToAnalyze = state.notes.filter(note => !note.folderId);
      }
      
      // Skip if not enough notes
      if (notesToAnalyze.length < 3) {
        throw new Error('Not enough notes to generate suggestions. Add at least 3 notes.');
      }
      
      // Generate suggestions
      const suggestions = await generateFolderSuggestions(
        notesToAnalyze, 
        existingFoldersToConsider, 
        parentFolderTitle
      );
      
      return suggestions;
    } catch (error) {
      console.error('Error generating folder suggestions:', error);
      throw error;
    }
  };

  // Move notes to a folder
  const moveNotesToFolder = async (noteIds, folderId) => {
    try {
      const updatedNotes = [];
      
      for (const noteId of noteIds) {
        const note = state.notes.find(n => n.id === noteId);
        if (note) {
          const updatedNote = await updateNote(noteId, {...note, folderId});
          updatedNotes.push(updatedNote);
        }
      }
      
      // Update state with all updated notes
      if (updatedNotes.length > 0) {
        const updatedState = state.notes.map(note => {
          const updated = updatedNotes.find(n => n.id === note.id);
          return updated || note;
        });
        
        dispatch({
          type: 'FETCH_NOTES_SUCCESS',
          payload: updatedState
        });
      }
      
      return updatedNotes;
    } catch (error) {
      dispatch({ 
        type: 'FETCH_NOTES_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  return (
    <NoteContext.Provider
      value={{
        ...state,
        fetchNotes,
        createNote,
        editNote,
        removeNote,
        setCurrentNote,
        getNotesByFolder,
        getUnorganizedNotes,
        suggestFolders,
        moveNotesToFolder
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

// Custom hook to use note context
export const useNotes = () => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};