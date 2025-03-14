// src/context/NoteContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { generateEmbedding } from '../services/openai';
import { getNotes, saveNote, updateNote, deleteNote } from '../services/api';
import { calculateSimilarity } from '../utils/similarity';
import { useFolders } from './FolderContext';
import vectorDB from '../services/vectorDB';
import clusterService from '../services/clusterService';

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
  const { folders, updateFolderSummary } = useFolders();

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Initialize vector database with existing notes
  useEffect(() => {
    const initializeVectorDB = async () => {
      if (state.notes.length > 0) {
        // Add notes to vector database
        for (const note of state.notes) {
          if (note.embedding) {
            await vectorDB.upsert('notes', {
              id: note.id,
              content: note.content,
              folderId: note.folderId,
              vector: note.embedding
            });
          }
        }
      }
    };

    initializeVectorDB();
  }, [state.notes]);

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
      // Generate embedding for note content
      const embedding = await generateEmbedding(noteData.content);
      
      // Determine best folder if not specified
      let folderId = noteData.folderId;
      if (!folderId) {
        // Use the cluster service to find the best matching folder
        const bestMatch = await clusterService.findBestMatchingFolder(
          { ...noteData, embedding },
          folders
        );
        folderId = bestMatch;
      }
      
      // Save note with embedding and folder
      const newNote = await saveNote({
        ...noteData,
        embedding,
        folderId
      });
      
      dispatch({ 
        type: 'CREATE_NOTE_SUCCESS', 
        payload: newNote 
      });
      
      // Add to vector database
      await vectorDB.upsert('notes', {
        id: newNote.id,
        content: newNote.content,
        folderId: newNote.folderId,
        vector: embedding
      });
      
      // Enrich note semantics (async, don't await)
      clusterService.enrichNoteSemantics(newNote).then(enrichedNote => {
        // Silently update the note with enriched data
        updateNote(newNote.id, enrichedNote);
      });
      
      // Update folder summary if assigned to a folder
      if (folderId) {
        await updateFolderSummary(folderId);
      }
      
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
      // Get the existing note
      const existingNote = state.notes.find(n => n.id === noteId);
      if (!existingNote) throw new Error("Note not found");
      
      // Generate new embedding if content changed
      let embedding = existingNote.embedding;
      let needsSemanticUpdate = false;
      
      if (noteData.content !== existingNote.content) {
        embedding = await generateEmbedding(noteData.content);
        needsSemanticUpdate = true;
      }
      
      // Determine best folder if reassignment is needed
      let folderId = noteData.folderId;
      if (folderId === undefined && embedding !== existingNote.embedding) {
        const bestMatch = await clusterService.findBestMatchingFolder(
          { ...noteData, embedding },
          folders
        );
        folderId = bestMatch;
      }
      
      // Update note
      const updatedNote = await updateNote(noteId, {
        ...existingNote,
        ...noteData,
        embedding,
        folderId: folderId !== undefined ? folderId : existingNote.folderId
      });
      
      dispatch({ 
        type: 'UPDATE_NOTE_SUCCESS', 
        payload: updatedNote 
      });
      
      // Update in vector database
      await vectorDB.upsert('notes', {
        id: updatedNote.id,
        content: updatedNote.content,
        folderId: updatedNote.folderId,
        vector: embedding
      });
      
      // Update semantic enrichment if content changed
      if (needsSemanticUpdate) {
        clusterService.enrichNoteSemantics(updatedNote).then(enrichedNote => {
          // Silently update the note with enriched data
          updateNote(noteId, enrichedNote);
        });
      }
      
      // Update folder summaries if necessary
      if (updatedNote.folderId) {
        await updateFolderSummary(updatedNote.folderId);
      }
      if (existingNote.folderId && existingNote.folderId !== updatedNote.folderId) {
        await updateFolderSummary(existingNote.folderId);
      }
      
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
      // Get the note to find its folder before deletion
      const noteToDelete = state.notes.find(n => n.id === noteId);
      const folderId = noteToDelete?.folderId;
      
      await deleteNote(noteId);
      
      dispatch({ 
        type: 'DELETE_NOTE_SUCCESS', 
        payload: noteId 
      });
      
      // Remove from vector database
      await vectorDB.delete('notes', noteId);
      
      // Update folder summary if the note was in a folder
      if (folderId) {
        await updateFolderSummary(folderId);
      }
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

  // Generate folder suggestions based on notes
  const generateFolderSuggestions = async (useAutoContext = false, parentFolderId = null) => {
    try {
      // If auto context, use all notes
      const notesToUse = useAutoContext 
        ? state.notes 
        : (parentFolderId 
            ? state.notes.filter(note => note.folderId === parentFolderId)
            : state.notes.filter(note => !note.folderId));
      
      // Skip if not enough notes
      if (notesToUse.length < 3) {
        return [];
      }
      
      return await clusterService.generateFolderSuggestions(notesToUse, {
        parentFolderId
      });
    } catch (error) {
      console.error('Error generating folder suggestions:', error);
      throw error;
    }
  };

  // Generate hierarchical folder suggestions
  const generateHierarchicalSuggestions = async () => {
    try {
      return await clusterService.generateHierarchicalSuggestions(state.notes);
    } catch (error) {
      console.error('Error generating hierarchical suggestions:', error);
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
        generateFolderSuggestions,
        generateHierarchicalSuggestions
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