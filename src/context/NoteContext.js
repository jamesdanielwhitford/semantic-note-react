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
  const suggestFolders = async (notes, existingFolders = [], parentFolderTitle = null) => {
    try {
      let notesToAnalyze = notes;
      
      // Skip if not enough notes
      if (notesToAnalyze.length < 3) {
        throw new Error('Not enough notes to generate suggestions. Add at least 3 notes.');
      }
      
      // Process notes to make sure image notes include their AI description
      const processedNotes = notesToAnalyze.map(note => {
        // For image notes, use the AI description instead of the visible content
        if (note.type === 'image' && note.imageData && note.imageData.aiDescription) {
          return {
            ...note,
            content: note.imageData.aiDescription // Override content with AI description for analysis
          };
        }
        return note;
      });
      
      // Generate suggestions
      const suggestions = await generateFolderSuggestions(
        processedNotes, 
        existingFolders, 
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