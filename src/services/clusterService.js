// src/services/clusterService.js
import { generateEmbedding, generateSummary } from './openai';
import vectorDB from './vectorDB';

/**
 * Service to handle note clustering and folder suggestions
 */
class ClusterService {
  /**
   * Generate folder suggestions based on clusters of notes
   * @param {Array} notes - Array of notes
   * @param {Object} options - Options for clustering
   * @returns {Array} - Folder suggestions
   */
  async generateFolderSuggestions(notes, options = {}) {
    const {
      parentFolderId = null,
      clusterCount = 3,
      minClusterSize = 2
    } = options;
    
    // Skip if not enough notes
    if (!notes || notes.length < minClusterSize * 2) {
      return [];
    }
    
    try {
      // Prepare filter for clustering
      const filter = parentFolderId !== undefined 
        ? { folderId: parentFolderId } 
        : { folderId: null };
      
      // Run clustering algorithm
      const { clusters } = await vectorDB.clusterVectors('notes', {
        k: clusterCount,
        filter
      });
      
      // Filter out small clusters
      const validClusters = clusters.filter(cluster => 
        cluster.size >= minClusterSize && cluster.cohesion > 0.65
      );
      
      if (validClusters.length === 0) {
        return [];
      }
      
      // Generate folder suggestions for each cluster
      const suggestions = await Promise.all(
        validClusters.map(async cluster => {
          // Prepare content for AI analysis
          const representativeContent = cluster.representatives
            .map(note => note.content || '')
            .join('\n\n');
          
          // Get existing folder context if available
          let parentContext = '';
          if (parentFolderId) {
            const folders = JSON.parse(localStorage.getItem('semanticnote-folders') || '[]');
            const parentFolder = folders.find(f => f.id === parentFolderId);
            if (parentFolder) {
              parentContext = `${parentFolder.title}: ${parentFolder.description || ''}`;
            }
          }
          
          // Generate title and description
          const suggestionPrompt = `
            ${parentContext ? `Context: ${parentContext}\n\n` : ''}
            Based on these notes, suggest a concise, specific folder title and description:
            ---
            ${representativeContent}
            ---
            Format as JSON: {"title": "...", "description": "..."}
          `;
          
          try {
            // Call OpenAI to generate suggestion
            const response = await generateSummary(suggestionPrompt);
            let suggestion = { title: "Untitled Folder", description: "" };
            
            try {
              suggestion = JSON.parse(response);
            } catch (e) {
              // Handle parsing error
              console.error("Error parsing suggestion response:", e);
              
              // Try to extract title and description from text response
              const titleMatch = response.match(/title["']?\s*:\s*["']([^"']+)["']/i);
              const descMatch = response.match(/description["']?\s*:\s*["']([^"']+)["']/i);
              
              if (titleMatch && titleMatch[1]) suggestion.title = titleMatch[1];
              if (descMatch && descMatch[1]) suggestion.description = descMatch[1];
            }
            
            return {
              ...suggestion,
              noteIds: cluster.items.map(item => item.id),
              noteCount: cluster.size,
              cohesion: cluster.cohesion,
              // Include sample notes for preview
              sampleNotes: cluster.representatives.slice(0, 3).map(note => ({
                id: note.id,
                content: note.content?.substring(0, 100) + (note.content?.length > 100 ? '...' : '')
              }))
            };
          } catch (error) {
            console.error("Error generating folder suggestion:", error);
            return null;
          }
        })
      );
      
      // Filter out failed suggestions and sort by cohesion
      return suggestions
        .filter(s => s !== null)
        .sort((a, b) => b.cohesion - a.cohesion);
      
    } catch (error) {
      console.error("Error in generateFolderSuggestions:", error);
      return [];
    }
  }
  
  /**
   * Generate hierarchical folder suggestions
   * @param {Array} notes - Array of notes
   * @param {Object} options - Options for hierarchical clustering
   * @returns {Object} - Hierarchical folder suggestions
   */
  async generateHierarchicalSuggestions(notes, options = {}) {
    const {
      levels = 2,
      clusterCounts = [3, 4],
      minClusterSizes = [3, 2]
    } = options;
    
    // Level 1: Root level suggestions
    const rootSuggestions = await this.generateFolderSuggestions(notes, {
      clusterCount: clusterCounts[0],
      minClusterSize: minClusterSizes[0]
    });
    
    // For each root suggestion, generate sub-suggestions
    if (levels >= 2 && rootSuggestions.length > 0) {
      for (let i = 0; i < rootSuggestions.length; i++) {
        const rootSuggestion = rootSuggestions[i];
        
        // Get notes for this suggestion
        const clusterNotes = notes.filter(note => 
          rootSuggestion.noteIds.includes(note.id)
        );
        
        // Generate sub-suggestions
        if (clusterNotes.length >= minClusterSizes[1] * 2) {
          const subSuggestions = await this.generateFolderSuggestions(clusterNotes, {
            clusterCount: clusterCounts[1],
            minClusterSize: minClusterSizes[1],
            parentFolderId: -1 // Use a temporary ID
          });
          
          // Add sub-suggestions to root suggestion
          rootSuggestions[i].subFolders = subSuggestions;
        }
      }
    }
    
    return rootSuggestions;
  }
  
  /**
   * Enrich a note with semantic concepts
   * @param {Object} note - Note object
   * @returns {Object} - Enriched note
   */
  async enrichNoteSemantics(note) {
    try {
      // Generate primary embedding if not exists
      const primaryEmbedding = note.embedding || await generateEmbedding(note.content);
      
      // Generate semantic enrichment
      const enrichmentPrompt = `
        Analyze this note and extract:
        1. Key topics/concepts (max 3)
        2. Implied categories or domains (max 2)
        3. Related concepts or terms (max 3)
        
        Format as JSON with these categories.
        
        Note content: ${note.content.substring(0, 1000)}
      `;
      
      const enrichmentResponse = await generateSummary(enrichmentPrompt);
      let enrichedConcepts;
      
      try {
        enrichedConcepts = JSON.parse(enrichmentResponse);
      } catch (e) {
        console.error("Error parsing enrichment response:", e);
        // Fallback to simple categories
        enrichedConcepts = {
          "keyTopics": ["General"],
          "impliedCategories": [],
          "relatedConcepts": []
        };
      }
      
      // Generate embeddings for enriched concepts
      const enrichedEmbeddings = {};
      
      for (const category in enrichedConcepts) {
        if (Array.isArray(enrichedConcepts[category])) {
          enrichedEmbeddings[category] = await Promise.all(
            enrichedConcepts[category].map(async concept => {
              if (typeof concept === 'string' && concept.trim()) {
                const embedding = await generateEmbedding(concept);
                return { concept, vector: embedding };
              }
              return null;
            })
          );
          
          // Filter out null values
          enrichedEmbeddings[category] = enrichedEmbeddings[category].filter(item => item !== null);
        }
      }
      
      // Store in vector database
      await vectorDB.storeEnrichedEmbeddings(note.id, primaryEmbedding, enrichedEmbeddings);
      
      return {
        ...note,
        embedding: primaryEmbedding,
        enrichedConcepts
      };
      
    } catch (error) {
      console.error("Error enriching note semantics:", error);
      return note;
    }
  }
  
  /**
   * Find the best matching folder for a note
   * @param {Object} note - Note object
   * @param {Array} folders - Available folders
   * @returns {number|null} - ID of best matching folder or null
   */
  async findBestMatchingFolder(note, folders) {
    try {
      // Make sure note has an embedding
      const noteEmbedding = note.embedding || await generateEmbedding(note.content);
      
      // Get top matches from vector DB
      const result = await vectorDB.findBestMatchingFolder(noteEmbedding);
      
      if (result && result.score >= 0.75) {
        return result.id;
      }
      
      // If no good match, try with enriched concepts if available
      if (note.enrichedConcepts) {
        // Combine vectors from key topics for secondary matching
        const topicVectors = [];
        
        try {
          const conceptVectors = await vectorDB.query('concepts', noteEmbedding, {
            limit: 5,
            threshold: 0.8
          });
          
          if (conceptVectors.length > 0) {
            const secondaryResult = await vectorDB.findBestMatchingFolder(
              conceptVectors[0].vector,
              { threshold: 0.7 }
            );
            
            if (secondaryResult && secondaryResult.score >= 0.7) {
              return secondaryResult.id;
            }
          }
        } catch (e) {
          console.error("Error during concept matching:", e);
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error finding best matching folder:", error);
      return null;
    }
  }
}

// Create and export singleton instance
const clusterService = new ClusterService();
export default clusterService;