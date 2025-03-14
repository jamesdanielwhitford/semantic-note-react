/**
 * Calculate the dot product of two vectors
 * @param {Array<number>} a First vector
 * @param {Array<number>} b Second vector
 * @returns {number} Dot product
 */
const dotProduct = (a, b) => {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    return a.reduce((sum, value, i) => sum + value * b[i], 0);
  };
  
  /**
   * Calculate the magnitude (Euclidean norm) of a vector
   * @param {Array<number>} vector Input vector
   * @returns {number} Vector magnitude
   */
  const magnitude = (vector) => {
    return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  };
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 First vector
   * @param {Array<number>} vec2 Second vector
   * @returns {number} Cosine similarity (between -1 and 1)
   */
  export const calculateSimilarity = (vec1, vec2) => {
    try {
      // Ensure vectors are of the same length
      if (vec1.length !== vec2.length) {
        console.error('Vectors have different dimensions', vec1.length, vec2.length);
        return 0.0;
      }
      
      // Handle zero vectors
      const mag1 = magnitude(vec1);
      const mag2 = magnitude(vec2);
      
      if (mag1 === 0 || mag2 === 0) {
        console.warn('One of the vectors has zero magnitude');
        return 0.0;
      }
      
      // Calculate cosine similarity
      const dot = dotProduct(vec1, vec2);
      const similarity = dot / (mag1 * mag2);
      
      // Ensure result is within valid range
      return Math.max(-1.0, Math.min(1.0, similarity));
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0.0;
    }
  };
  
  /**
   * Find the best matching item from a list based on embedding similarity
   * @param {Array<number>} targetEmbedding The embedding to match against
   * @param {Array<Object>} items Array of items with embedding property
   * @param {number} threshold Minimum similarity threshold (0-1)
   * @returns {Object|null} Best matching item or null if none found
   */
  export const findBestMatch = (targetEmbedding, items, threshold = 0.75) => {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const item of items) {
      // Skip items without embeddings
      if (!item.embedding) continue;
      
      const score = calculateSimilarity(targetEmbedding, item.embedding);
      
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = item;
      }
    }
    
    return { match: bestMatch, score: bestScore };
  };