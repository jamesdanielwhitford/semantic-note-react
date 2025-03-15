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
 * Generate folder suggestions based on notes content
 * @param {Array} notes - Array of notes to analyze
 * @param {string} parentFolderTitle - Optional parent folder name for context
 * @returns {Promise<Array>} - Array of folder suggestion objects
 */
export const generateFolderSuggestions = async (notes, parentFolderTitle = null) => {
  try {
    // Extract note content
    const notesContent = notes.map(note => note.content).join('\n\n---\n\n');
    
    // Create the prompt based on whether we're at the top level or within a folder
    let prompt;
    if (parentFolderTitle) {
      prompt = `Based on these notes that are currently inside a folder called "${parentFolderTitle}", suggest 3-5 more specific sub-folders to further organize them. 
      For each suggestion, provide:
      1. A folder title that's more specific than "${parentFolderTitle}"
      2. A brief description of what this folder contains
      3. A list of indices of notes that belong in this folder (0-indexed from the list provided)
      
      Notes:
      ${notes.map((note, i) => `[${i}] ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`).join('\n\n')}
      
      Respond in JSON format like:
      [
        {
          "title": "Folder Title",
          "description": "Brief description of folder",
          "noteIndices": [0, 2, 5]
        }
      ]`;
    } else {
      prompt = `Based on these notes, suggest 3-5 top-level folders to organize them by main concepts. 
      For each suggestion, provide:
      1. A high-level folder title that captures a main concept
      2. A brief description of what this folder contains
      3. A list of indices of notes that belong in this folder (0-indexed from the list provided)
      
      Notes:
      ${notes.map((note, i) => `[${i}] ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`).join('\n\n')}
      
      Focus on creating broad, top-level categories that can later be subdivided.
      Notes can belong to multiple folders if relevant.
      
      Respond in JSON format like:
      [
        {
          "title": "Folder Title",
          "description": "Brief description of folder",
          "noteIndices": [0, 2, 5]
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
      
      // Map the indexed notes to note IDs
      return suggestions.map(suggestion => ({
        title: suggestion.title,
        description: suggestion.description,
        noteIds: suggestion.noteIndices.map(index => notes[index]?.id).filter(id => id)
      }));
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