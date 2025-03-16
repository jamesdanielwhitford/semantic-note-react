// src/services/imageService.js
import openaiAPI from './openai';

/**
 * Process and resize an image for storage
 * @param {File} imageFile - The original image file from user
 * @returns {Promise<{dataUrl: string, width: number, height: number}>} - Resized image data
 */
export const processImage = async (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Determine new dimensions (max width/height of 800px)
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get data URL in WebP format for better compression
        // Fall back to JPEG if WebP is not supported
        try {
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          resolve({ dataUrl, width, height });
        } catch (e) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl, width, height });
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Generate detailed description of an image using AI
 * @param {string} dataUrl - Base64 encoded image data
 * @param {string} userDescription - Optional user-provided description
 * @returns {Promise<{visibleDescription: string, aiDescription: string}>} - Descriptions of the image
 */
export const generateImageDescription = async (dataUrl, userDescription = '') => {
  try {
    // Prepare the prompt for the AI based on whether user provided a description
    const prompt = userDescription 
      ? `This is an image with the following user description: "${userDescription}". Please provide a comprehensive, detailed description of this image, including:
         1. The main subject(s)
         2. Colors, textures, and visual elements
         3. Style, artistic influences, and aesthetic qualities
         4. Potential categories for organization (like "pottery", "nature", "architecture", etc.)
         5. Any notable features that would help with classification
         
         Please be specific and thorough, as this description will be used for organizing the image into folders.`
      : `Please provide a comprehensive, detailed description of this image, including:
         1. The main subject(s)
         2. Colors, textures, and visual elements
         3. Style, artistic influences, and aesthetic qualities
         4. Potential categories for organization
         5. Any notable features that would help with classification
         
         Please be specific and thorough, as this description will be used for organizing the image into folders.`;

    // Make API request to OpenAI's chat completions API with the image
    const response = await openaiAPI.post('/chat/completions', {
      model: "gpt-4o",  // Using GPT-4 with vision capabilities
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "low"  // Using lower detail to save tokens
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });
    
    const aiDescription = response.data.choices[0].message.content.trim();
    
    // Create a shorter visible description for the UI
    const visibleDescription = userDescription || 
      aiDescription.split('.')[0] + '.' + (aiDescription.split('.')[1] || '');
    
    return {
      visibleDescription,
      aiDescription
    };
  } catch (error) {
    console.error('Error generating image description:', error);
    
    // Fallback if AI analysis fails
    return {
      visibleDescription: userDescription || 'Image without description',
      aiDescription: userDescription || 'Image without AI-generated description'
    };
  }
};

/**
 * Calculate the estimated storage size of a data URL
 * @param {string} dataUrl - The data URL string
 * @returns {number} - Size in bytes
 */
export const getDataUrlSize = (dataUrl) => {
  // Base64 encoding increases size by approximately 33%
  // So to get the actual size, we need to get the base64 part and calculate
  const base64 = dataUrl.split(',')[1];
  return Math.round((base64.length * 3) / 4);
};