// This service mimics a backend API using localStorage
// In a real application, these functions would make HTTP requests to a server

// Storage keys
const FOLDERS_STORAGE_KEY = 'semanticnote-folders';
const NOTES_STORAGE_KEY = 'semanticnote-notes';
const ID_COUNTER_KEY = 'semanticnote-id-counter';

// Helper to get next available ID
const getNextId = () => {
  let counter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || '0');
  counter += 1;
  localStorage.setItem(ID_COUNTER_KEY, counter.toString());
  return counter;
};

// Initialize storage if empty
const initializeStorage = () => {
  if (!localStorage.getItem(FOLDERS_STORAGE_KEY)) {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(NOTES_STORAGE_KEY)) {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([]));
  }
};

// Initialize on import
initializeStorage();

// FOLDER OPERATIONS

/**
 * Get all folders
 * @returns {Promise<Array>} Array of folder objects
 */
export const getFolders = async () => {
  return new Promise((resolve) => {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]');
    setTimeout(() => resolve(folders), 100); // Simulate network delay
  });
};

/**
 * Get a folder by ID
 * @param {number} id Folder ID
 * @returns {Promise<Object>} Folder object
 */
export const getFolder = async (id) => {
  return new Promise((resolve, reject) => {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]');
    const folder = folders.find(f => f.id === id);
    
    setTimeout(() => {
      if (folder) {
        resolve(folder);
      } else {
        reject(new Error(`Folder with ID ${id} not found`));
      }
    }, 100);
  });
};

/**
 * Save a new folder
 * @param {Object} folderData Folder data
 * @returns {Promise<Object>} Created folder object with ID
 */
export const saveFolder = async (folderData) => {
  return new Promise((resolve) => {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]');
    const newFolder = {
      ...folderData,
      id: getNextId(),
      createdAt: new Date().toISOString()
    };
    
    folders.push(newFolder);
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    
    setTimeout(() => resolve(newFolder), 100);
  });
};

/**
 * Update an existing folder
 * @param {number} id Folder ID
 * @param {Object} folderData Updated folder data
 * @returns {Promise<Object>} Updated folder object
 */
export const updateFolder = async (id, folderData) => {
  return new Promise((resolve, reject) => {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]');
    const index = folders.findIndex(f => f.id === id);
    
    if (index === -1) {
      return reject(new Error(`Folder with ID ${id} not found`));
    }
    
    const updatedFolder = {
      ...folders[index],
      ...folderData,
      updatedAt: new Date().toISOString()
    };
    
    folders[index] = updatedFolder;
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    
    setTimeout(() => resolve(updatedFolder), 100);
  });
};

/**
 * Delete a folder
 * @param {number} id Folder ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteFolder = async (id) => {
  return new Promise((resolve, reject) => {
    const folders = JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]');
    const index = folders.findIndex(f => f.id === id);
    
    if (index === -1) {
      return reject(new Error(`Folder with ID ${id} not found`));
    }
    
    // Remove the folder
    folders.splice(index, 1);
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    
    // Also update any notes that were in this folder
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const updatedNotes = notes.map(note => {
      if (note.folderId === id) {
        return { ...note, folderId: null };
      }
      return note;
    });
    
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    
    setTimeout(() => resolve(true), 100);
  });
};

// NOTE OPERATIONS

/**
 * Get all notes
 * @returns {Promise<Array>} Array of note objects
 */
export const getNotes = async () => {
  return new Promise((resolve) => {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    setTimeout(() => resolve(notes), 100);
  });
};

/**
 * Get a note by ID
 * @param {number} id Note ID
 * @returns {Promise<Object>} Note object
 */
export const getNote = async (id) => {
  return new Promise((resolve, reject) => {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const note = notes.find(n => n.id === id);
    
    setTimeout(() => {
      if (note) {
        resolve(note);
      } else {
        reject(new Error(`Note with ID ${id} not found`));
      }
    }, 100);
  });
};

/**
 * Save a new note
 * @param {Object} noteData Note data
 * @returns {Promise<Object>} Created note object with ID
 */
export const saveNote = async (noteData) => {
  return new Promise((resolve) => {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const newNote = {
      ...noteData,
      id: getNextId(),
      createdAt: new Date().toISOString()
    };
    
    notes.push(newNote);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    
    setTimeout(() => resolve(newNote), 100);
  });
};

/**
 * Update an existing note
 * @param {number} id Note ID
 * @param {Object} noteData Updated note data
 * @returns {Promise<Object>} Updated note object
 */
export const updateNote = async (id, noteData) => {
  return new Promise((resolve, reject) => {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const index = notes.findIndex(n => n.id === id);
    
    if (index === -1) {
      return reject(new Error(`Note with ID ${id} not found`));
    }
    
    const updatedNote = {
      ...notes[index],
      ...noteData,
      updatedAt: new Date().toISOString()
    };
    
    notes[index] = updatedNote;
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    
    setTimeout(() => resolve(updatedNote), 100);
  });
};

/**
 * Delete a note
 * @param {number} id Note ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteNote = async (id) => {
  return new Promise((resolve, reject) => {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const index = notes.findIndex(n => n.id === id);
    
    if (index === -1) {
      return reject(new Error(`Note with ID ${id} not found`));
    }
    
    notes.splice(index, 1);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    
    setTimeout(() => resolve(true), 100);
  });
};

/**
 * Get notes by folder ID
 * @param {number} folderId Folder ID
 * @returns {Promise<Array>} Array of note objects in the folder
 */
export const getNotesByFolder = async (folderId) => {
  return new Promise((resolve) => {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
    const folderNotes = notes.filter(note => note.folderId === folderId);
    
    setTimeout(() => resolve(folderNotes), 100);
  });
};

/**
 * Delete all data (for testing/reset)
 * @returns {Promise<boolean>} Success status
 */
export const deleteAllData = async () => {
  return new Promise((resolve) => {
    localStorage.removeItem(FOLDERS_STORAGE_KEY);
    localStorage.removeItem(NOTES_STORAGE_KEY);
    localStorage.removeItem(ID_COUNTER_KEY);
    
    initializeStorage();
    
    setTimeout(() => resolve(true), 100);
  });
};