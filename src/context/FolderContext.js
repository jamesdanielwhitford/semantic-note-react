// src/context/FolderContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { generateEmbedding, generateSummary } from '../services/openai';
import { getFolders, saveFolder, updateFolder, deleteFolder } from '../services/api';
import vectorDB from '../services/vectorDB';

// Initial state
const initialState = {
  folders: [],
  loading: false,
  error: null,
  currentFolder: null
};

// Create context
const FolderContext = createContext(initialState);

// Folder reducer
const folderReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_FOLDERS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_FOLDERS_SUCCESS':
      return {
        ...state,
        folders: action.payload,
        loading: false
      };
    case 'FETCH_FOLDERS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'CREATE_FOLDER_SUCCESS':
      return {
        ...state,
        folders: [...state.folders, action.payload],
        currentFolder: action.payload
      };
    case 'UPDATE_FOLDER_SUCCESS':
      return {
        ...state,
        folders: state.folders.map(folder => 
          folder.id === action.payload.id ? action.payload : folder
        ),
        currentFolder: action.payload
      };
    case 'DELETE_FOLDER_SUCCESS':
      return {
        ...state,
        folders: state.folders.filter(folder => folder.id !== action.payload),
        currentFolder: null
      };
    case 'SET_CURRENT_FOLDER':
      return {
        ...state,
        currentFolder: action.payload
      };
    default:
      return state;
  }
};

// Provider component
export const FolderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(folderReducer, initialState);

  // Load folders on mount
  useEffect(() => {
    fetchFolders();
  }, []);

  // Initialize vector database with existing folders
  useEffect(() => {
    const initializeVectorDB = async () => {
      if (state.folders.length > 0) {
        // Add folders to vector database
        for (const folder of state.folders) {
          if (folder.embedding) {
            await vectorDB.upsert('folders', {
              id: folder.id,
              title: folder.title,
              description: folder.description,
              parentId: folder.parentId,
              vector: folder.embedding,
              summaryVector: folder.summaryEmbedding
            });
          }
        }
      }
    };

    initializeVectorDB();
  }, [state.folders]);

  // Fetch all folders
  const fetchFolders = async () => {
    dispatch({ type: 'FETCH_FOLDERS_REQUEST' });
    try {
      const foldersData = await getFolders();
      dispatch({ 
        type: 'FETCH_FOLDERS_SUCCESS', 
        payload: foldersData 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_FOLDERS_FAILURE', 
        payload: error.message 
      });
    }
  };

  // Create a new folder
  const createFolder = async (folderData) => {
    try {
      // Generate embedding for folder title and description
      const textForEmbedding = `${folderData.title} ${folderData.description || ''}`;
      const embedding = await generateEmbedding(textForEmbedding);
      
      // If there are noteIds, include them
      const notesToInclude = folderData.noteIds || [];
      
      // Save folder with embedding
      const newFolder = await saveFolder({
        ...folderData,
        embedding
      });
      
      dispatch({ 
        type: 'CREATE_FOLDER_SUCCESS', 
        payload: newFolder 
      });
      
      // Add to vector database
      await vectorDB.upsert('folders', {
        id: newFolder.id,
        title: newFolder.title,
        description: newFolder.description,
        parentId: newFolder.parentId,
        vector: embedding
      });
      
      // Update notes to be in this folder if provided
      if (notesToInclude.length > 0) {
        // This would be handled by the note context
        // Ideally, we'd use a cross-context action here
      }
      
      return newFolder;
    } catch (error) {
      dispatch({ 
        type: 'FETCH_FOLDERS_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  // Create a folder from suggestion
  const createFolderFromSuggestion = async (suggestion) => {
    try {
      return await createFolder({
        title: suggestion.title,
        description: suggestion.description,
        noteIds: suggestion.noteIds,
        parentId: suggestion.parentFolderId
      });
    } catch (error) {
      dispatch({
        type: 'FETCH_FOLDERS_FAILURE',
        payload: error.message
      });
      throw error;
    }
  };

  // Update folder summaries
  const updateFolderSummary = async (folderId) => {
    try {
      // Get the current folder
      const folder = state.folders.find(f => f.id === folderId);
      if (!folder) return;
      
      // Get notes for this folder
      const notesInFolder = folder.notes || [];
      
      if (notesInFolder.length === 0) return;
      
      // Get parent summary if applicable
      let parentSummary = '';
      if (folder.parentId) {
        const parentFolder = state.folders.find(f => f.id === folder.parentId);
        if (parentFolder && parentFolder.summary) {
          parentSummary = parentFolder.summary;
        }
      }
      
      // Generate summary from notes content
      const aggregatedText = notesInFolder.map(note => note.content).join('\n');
      const summary = await generateSummary(aggregatedText, parentSummary);
      
      // Generate embedding for summary
      const summaryEmbedding = await generateEmbedding(summary);
      
      // Update folder with new summary and embedding
      const updatedFolder = await updateFolder(folderId, {
        ...folder,
        summary,
        summaryEmbedding
      });
      
      dispatch({ 
        type: 'UPDATE_FOLDER_SUCCESS', 
        payload: updatedFolder 
      });
      
      // Update in vector database
      await vectorDB.upsert('folders', {
        id: updatedFolder.id,
        title: updatedFolder.title,
        description: updatedFolder.description,
        parentId: updatedFolder.parentId,
        vector: updatedFolder.embedding,
        summaryVector: summaryEmbedding
      });
      
      return updatedFolder;
    } catch (error) {
      dispatch({ 
        type: 'FETCH_FOLDERS_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  // Delete a folder
  const removeFolder = async (folderId) => {
    try {
      await deleteFolder(folderId);
      
      // Remove from vector database
      await vectorDB.delete('folders', folderId);
      
      dispatch({ 
        type: 'DELETE_FOLDER_SUCCESS', 
        payload: folderId 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_FOLDERS_FAILURE', 
        payload: error.message 
      });
      throw error;
    }
  };

  // Set current folder
  const setCurrentFolder = (folder) => {
    if (!folder || !state.currentFolder || folder.id !== state.currentFolder.id) {
      dispatch({ 
        type: 'SET_CURRENT_FOLDER', 
        payload: folder 
      });
    }
  };

  // Get folder tree
  const getFolderTree = () => {
    const buildTree = (parentId = null) => {
      return state.folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folder.id)
        }));
    };
    
    return buildTree();
  };

  return (
    <FolderContext.Provider
      value={{
        ...state,
        fetchFolders,
        createFolder,
        createFolderFromSuggestion,
        updateFolderSummary,
        removeFolder,
        setCurrentFolder,
        getFolderTree
      }}
    >
      {children}
    </FolderContext.Provider>
  );
};

// Custom hook to use folder context
export const useFolders = () => {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within a FolderProvider');
  }
  return context;
};