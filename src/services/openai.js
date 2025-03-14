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
 * Generate embedding vector for text using OpenAI API
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<Array>} - Array of embedding values
 */
export const generateEmbedding = async (text) => {
  try {
    console.log(`Generating embedding for text: ${text.substring(0, 30)}...`);
    
    const response = await openaiAPI.post('/embeddings', {
      input: text,
      model: 'text-embedding-ada-002'
    });
    
    const embedding = response.data.data[0].embedding;
    console.log(`Embedding generated successfully: ${embedding.length} dimensions`);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding. Please try again.');
  }
};

/**
 * Generate summary for text using OpenAI API
 * @param {string} text - Text to summarize
 * @param {string} parentSummary - Optional parent summary for context
 * @returns {Promise<string>} - Generated summary text
 */
export const generateSummary = async (text, parentSummary = null) => {
  try {
    console.log(`Generating summary for text of length: ${text.length}`);
    
    let prompt = "Generate a concise, multi-sentence summary for the following notes:\n\n";
    
    if (parentSummary) {
      prompt += `Parent Folder Context: ${parentSummary}\n\n`;
    }
    
    prompt += text;
    
    const response = await openaiAPI.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a summarization assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 150
    });
    
    const summary = response.data.choices[0].message.content.trim();
    console.log(`Summary generated successfully: ${summary.substring(0, 50)}...`);
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
};

/**
 * Generate folder suggestions based on provided context
 * @param {string} context - Content to generate folder suggestions from
 * @returns {Promise<Array>} - Array of folder suggestion objects
 */
export const generateFolderSuggestions = async (context) => {
  try {
    console.log(`Generating folder suggestions based on context of length: ${context.length}`);
    
    const prompt = `Based on the following context, suggest 3-5 folder categories. For each suggestion, 
      provide a concise folder title and a brief description. Context:\n\n${context}`;
    
    const response = await openaiAPI.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a folder suggestion assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    const suggestionsText = response.data.choices[0].message.content.trim();
    console.log(`Folder suggestions raw response: ${suggestionsText}`);
    
    // Parse the suggestions from the text response
    const suggestions = [];
    const lines = suggestionsText.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        if (line.includes("Title:") && line.includes("Description:")) {
          const parts = line.split(" - ");
          if (parts.length >= 2) {
            const title = parts[0].split("Title:")[1]?.trim();
            const description = parts[1].split("Description:")[1]?.trim();
            
            if (title && description) {
              suggestions.push({ title, description });
            }
          }
        }
      }
    }
    
    console.log(`Parsed ${suggestions.length} folder suggestions`);
    return suggestions;
  } catch (error) {
    console.error('Error generating folder suggestions:', error);
    throw new Error('Failed to generate folder suggestions. Please try again.');
  }
};

// Export the OpenAI instance for any other API calls
export default openaiAPI;