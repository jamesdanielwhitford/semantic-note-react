import axios from 'axios';

// Create an axios instance for OpenAI API
const openaiAPI = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
  }
});

/**
 * Generate folder suggestions based on notes content, considering existing folders
 * @param {Array} notes - Array of notes to analyze
 * @param {Array} existingFolders - Array of existing folders to consider
 * @param {string} parentFolderTitle - Optional parent folder name for context
 * @returns {Promise<Array>} - Array of folder suggestion objects
 */
export const generateFolderSuggestions = async (notes, existingFolders = [], parentFolderTitle = null) => {
  try {
    // Extract note content
    const notesContent = notes.map(note => note.content).join('\n\n---\n\n');
    
    // Format existing folders for the prompt
    const existingFoldersText = existingFolders.length > 0 
      ? `Existing folders:\n${existingFolders.map((folder, i) => 
          `[${i}] "${folder.title}": ${folder.description || 'No description'}`
        ).join('\n')}`
      : 'There are no existing folders yet.';
    
    // Create the prompt based on whether we're at the top level or within a folder
    let prompt;
    if (parentFolderTitle) {
      prompt = `Based on these notes that are currently inside a folder called "${parentFolderTitle}", suggest 3-5 more specific sub-folders to further organize them. 
      
      ${existingFoldersText}
      
      For each suggestion:
      1. If an existing folder is appropriate (especially if a proposed folder would duplicate an existing one), recommend using it (specify its index)
      2. If a new folder is needed, provide:
         a. A folder title that's more specific than "${parentFolderTitle}"
         b. A brief description of what this folder contains
      3. A list of indices of notes that belong in this folder (0-indexed from the list provided)
      
      IMPORTANT: Carefully check if any of your suggestions duplicate an existing folder. If they do, recommend using the existing folder instead of creating a new one.
      
      Notes:
      ${notes.map((note, i) => `[${i}] ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`).join('\n\n')}
      
      Respond in JSON format like:
      [
        {
          "useExistingFolder": true,
          "existingFolderIndex": 2,
          "title": null,
          "description": null,
          "noteIndices": [0, 2, 5]
        },
        {
          "useExistingFolder": false,
          "existingFolderIndex": null,
          "title": "New Folder Title",
          "description": "Brief description of new folder",
          "noteIndices": [1, 3, 4]
        }
      ]`;
    } else {
      prompt = `Based on these notes, suggest 3-5 folders to organize them by main concepts. Consider both existing folders and the need for new ones.
      
      ${existingFoldersText}
      
      For each suggestion:
      1. If an existing folder is appropriate (especially if a proposed folder would duplicate an existing one), recommend using it (specify its index)
      2. If a new folder is needed, provide:
         a. A high-level folder title that captures a main concept
         b. A brief description of what this folder contains
      3. A list of indices of notes that belong in this folder (0-indexed from the list provided)
      
      IMPORTANT: Carefully check if any of your suggestions duplicate an existing folder. If they do, recommend using the existing folder instead of creating a new one.
      
      Notes:
      ${notes.map((note, i) => `[${i}] ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`).join('\n\n')}
      
      Focus on creating a logical organization. Notes can belong to multiple folders if relevant.
      
      Respond in JSON format like:
      [
        {
          "useExistingFolder": true,
          "existingFolderIndex": 2,
          "title": null,
          "description": null,
          "noteIndices": [0, 2, 5]
        },
        {
          "useExistingFolder": false,
          "existingFolderIndex": null,
          "title": "New Folder Title",
          "description": "Brief description of new folder",
          "noteIndices": [1, 3, 4]
        }
      ]`;
    }
    
    const response = await openaiAPI.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an assistant that helps organize notes into logical folder structures." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });
    
    const result = response.data.choices[0].message.content.trim();
    
    try {
      // Parse the JSON response
      const suggestions = JSON.parse(result);
      
      // Map the suggestions to include existing folder information or new folder details
      return suggestions.map(suggestion => {
        if (suggestion.useExistingFolder && existingFolders[suggestion.existingFolderIndex]) {
          const folder = existingFolders[suggestion.existingFolderIndex];
          return {
            isExisting: true,
            folderId: folder.id,
            title: folder.title,
            description: folder.description || '',
            noteIds: suggestion.noteIndices.map(index => notes[index]?.id).filter(id => id)
          };
        } else {
          return {
            isExisting: false,
            title: suggestion.title,
            description: suggestion.description || '',
            noteIds: suggestion.noteIndices.map(index => notes[index]?.id).filter(id => id)
          };
        }
      });
    } catch (error) {
      console.error('Error parsing AI suggestions:', error);
      throw new Error('Failed to parse folder suggestions');
    }
  } catch (error) {
    console.error('Error generating folder suggestions:', error);
    throw new Error('Failed to generate folder suggestions. Please try again.');
  }
};

export default openaiAPI;