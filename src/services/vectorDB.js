// src/services/vectorDB.js
import { calculateSimilarity } from '../utils/similarity';

/**
 * A client-side vector database implementation using localStorage
 * In production, this would be replaced with a proper vector database service
 */
class VectorDatabase {
  constructor() {
    this.collections = {
      notes: 'semanticnote-vector-notes',
      folders: 'semanticnote-vector-folders',
      concepts: 'semanticnote-vector-concepts'
    };
    this.initialize();
  }

  /**
   * Initialize collections if they don't exist
   */
  initialize() {
    Object.values(this.collections).forEach(collection => {
      if (!localStorage.getItem(collection)) {
        localStorage.setItem(collection, JSON.stringify([]));
      }
    });
  }

  /**
   * Add or update a vector in the specified collection
   * @param {string} collection - Collection name
   * @param {Object} item - Item with id and vector
   */
  async upsert(collection, item) {
    if (!this.collections[collection]) {
      throw new Error(`Collection ${collection} does not exist`);
    }

    const items = JSON.parse(localStorage.getItem(this.collections[collection]));
    const index = items.findIndex(i => i.id === item.id);

    if (index !== -1) {
      items[index] = { ...items[index], ...item };
    } else {
      items.push(item);
    }

    localStorage.setItem(this.collections[collection], JSON.stringify(items));
    return item;
  }

  /**
   * Remove an item from a collection
   * @param {string} collection - Collection name
   * @param {string|number} id - Item ID
   */
  async delete(collection, id) {
    if (!this.collections[collection]) {
      throw new Error(`Collection ${collection} does not exist`);
    }

    const items = JSON.parse(localStorage.getItem(this.collections[collection]));
    const filteredItems = items.filter(item => item.id !== id);
    
    localStorage.setItem(this.collections[collection], JSON.stringify(filteredItems));
    return true;
  }

  /**
   * Find items similar to the query vector
   * @param {string} collection - Collection name
   * @param {Array<number>} queryVector - Query embedding vector
   * @param {Object} options - Search options
   * @returns {Array} - Matching items sorted by similarity
   */
  async query(collection, queryVector, options = {}) {
    const {
      limit = 10,
      threshold = 0.7,
      filter = null,
      includeVectors = false
    } = options;

    if (!this.collections[collection]) {
      throw new Error(`Collection ${collection} does not exist`);
    }

    const items = JSON.parse(localStorage.getItem(this.collections[collection]));
    
    // Calculate similarity and filter by threshold
    const results = items
      .map(item => {
        // Skip items without vectors
        if (!item.vector) return null;
        
        // Apply filter if provided
        if (filter && !this.passesFilter(item, filter)) return null;
        
        // Calculate similarity score
        const score = calculateSimilarity(queryVector, item.vector);
        
        // Remove vector from result if not needed
        const result = includeVectors ? { ...item } : { ...item };
        if (!includeVectors) delete result.vector;
        
        return {
          ...result,
          score
        };
      })
      .filter(item => item !== null && item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return results;
  }

  /**
   * Check if an item passes the filter criteria
   * @param {Object} item - Item to check
   * @param {Object} filter - Filter criteria
   * @returns {boolean} - Whether the item passes the filter
   */
  passesFilter(item, filter) {
    return Object.entries(filter).every(([key, value]) => {
      if (value === null) {
        return item[key] === null || item[key] === undefined;
      }
      return item[key] === value;
    });
  }

  /**
   * Run k-means clustering on vectors in a collection
   * @param {string} collection - Collection name
   * @param {Object} options - Clustering options
   * @returns {Array} - Cluster information
   */
  async clusterVectors(collection, options = {}) {
    const {
      k = 5,
      maxIterations = 10,
      filter = null
    } = options;

    const items = JSON.parse(localStorage.getItem(this.collections[collection]));
    
    // Filter items if needed
    let filteredItems = items;
    if (filter) {
      filteredItems = items.filter(item => this.passesFilter(item, filter));
    }
    
    // Need at least k items with vectors
    const itemsWithVectors = filteredItems.filter(item => item.vector && item.vector.length > 0);
    if (itemsWithVectors.length < k) {
      return { clusters: [], itemClusters: {} };
    }

    // Initialize clusters with random centroids
    let centroids = this.initializeCentroids(itemsWithVectors, k);
    let itemClusters = {};
    let iterations = 0;
    let changed = true;
    
    // Run k-means algorithm
    while (changed && iterations < maxIterations) {
      // Assign items to clusters
      const newItemClusters = this.assignToClusters(itemsWithVectors, centroids);
      
      // Check if assignments changed
      changed = this.assignmentsChanged(itemClusters, newItemClusters);
      itemClusters = newItemClusters;
      
      // Update centroids
      centroids = this.updateCentroids(itemsWithVectors, itemClusters, k);
      
      iterations++;
    }
    
    // Calculate final clusters with metadata
    const clusters = this.generateClusterMetadata(itemsWithVectors, itemClusters, centroids);
    
    return { clusters, itemClusters };
  }
  
  /**
   * Initialize cluster centroids
   * @param {Array} items - Items with vectors
   * @param {number} k - Number of clusters
   * @returns {Array} - Initial centroids
   */
  initializeCentroids(items, k) {
    const centroids = [];
    const vectorLength = items[0].vector.length;
    
    // Simple random initialization
    const selectedIndices = new Set();
    while (selectedIndices.size < k) {
      const randomIndex = Math.floor(Math.random() * items.length);
      if (!selectedIndices.has(randomIndex) && items[randomIndex].vector) {
        selectedIndices.add(randomIndex);
        centroids.push([...items[randomIndex].vector]);
      }
    }
    
    return centroids;
  }
  
  /**
   * Assign items to nearest centroid
   * @param {Array} items - Items with vectors
   * @param {Array} centroids - Cluster centroids
   * @returns {Object} - Map of item ID to cluster index
   */
  assignToClusters(items, centroids) {
    const assignments = {};
    
    items.forEach(item => {
      if (!item.vector) return;
      
      let bestCluster = 0;
      let bestSimilarity = -1;
      
      centroids.forEach((centroid, index) => {
        const similarity = calculateSimilarity(item.vector, centroid);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = index;
        }
      });
      
      assignments[item.id] = bestCluster;
    });
    
    return assignments;
  }
  
  /**
   * Check if cluster assignments changed
   * @param {Object} oldAssignments - Previous assignments
   * @param {Object} newAssignments - New assignments
   * @returns {boolean} - Whether assignments changed
   */
  assignmentsChanged(oldAssignments, newAssignments) {
    if (Object.keys(oldAssignments).length !== Object.keys(newAssignments).length) {
      return true;
    }
    
    for (const id in newAssignments) {
      if (oldAssignments[id] !== newAssignments[id]) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update centroids based on new assignments
   * @param {Array} items - Items with vectors
   * @param {Object} assignments - Cluster assignments
   * @param {number} k - Number of clusters
   * @returns {Array} - Updated centroids
   */
  updateCentroids(items, assignments, k) {
    const vectorLength = items[0].vector.length;
    const clusters = Array(k).fill().map(() => []);
    
    // Group items by cluster
    items.forEach(item => {
      if (item.vector && assignments[item.id] !== undefined) {
        clusters[assignments[item.id]].push(item);
      }
    });
    
    // Calculate new centroids
    return clusters.map(clusterItems => {
      if (clusterItems.length === 0) {
        // Handle empty cluster by using a random item's vector
        const randomItem = items[Math.floor(Math.random() * items.length)];
        return [...randomItem.vector];
      }
      
      // Calculate average vector
      const sum = new Array(vectorLength).fill(0);
      clusterItems.forEach(item => {
        for (let i = 0; i < vectorLength; i++) {
          sum[i] += item.vector[i];
        }
      });
      
      return sum.map(val => val / clusterItems.length);
    });
  }
  
  /**
   * Generate metadata for each cluster
   * @param {Array} items - Items with vectors
   * @param {Object} assignments - Cluster assignments
   * @param {Array} centroids - Cluster centroids
   * @returns {Array} - Clusters with metadata
   */
  generateClusterMetadata(items, assignments, centroids) {
    // Group items by cluster
    const clusters = centroids.map((centroid, index) => ({
      id: index,
      centroid,
      items: [],
      cohesion: 0
    }));
    
    items.forEach(item => {
      if (item.vector && assignments[item.id] !== undefined) {
        const clusterIndex = assignments[item.id];
        clusters[clusterIndex].items.push(item);
      }
    });
    
    // Calculate cluster metrics
    clusters.forEach(cluster => {
      // Calculate average similarity to centroid (cohesion)
      let totalSimilarity = 0;
      cluster.items.forEach(item => {
        totalSimilarity += calculateSimilarity(item.vector, cluster.centroid);
      });
      
      cluster.size = cluster.items.length;
      cluster.cohesion = cluster.size > 0 ? totalSimilarity / cluster.size : 0;
      
      // Get representative items (closest to centroid)
      cluster.representatives = [...cluster.items]
        .sort((a, b) => {
          const simA = calculateSimilarity(a.vector, cluster.centroid);
          const simB = calculateSimilarity(b.vector, cluster.centroid);
          return simB - simA;
        })
        .slice(0, 5);
    });
    
    return clusters;
  }
  
  /**
   * Generate enriched embeddings for a note
   * @param {Object} note - Note object with content and embedding
   * @param {Array} enrichedConcepts - Concepts to enrich with
   * @returns {Object} - Note with enriched embeddings
   */
  async storeEnrichedEmbeddings(noteId, primaryVector, enrichedVectors) {
    await this.upsert('notes', {
      id: noteId,
      vector: primaryVector,
      enrichedVectors
    });
    
    // Also store enriched concepts for reuse
    for (const category in enrichedVectors) {
      for (const item of enrichedVectors[category]) {
        await this.upsert('concepts', {
          id: `${category}-${item.concept.replace(/\s+/g, '-').toLowerCase()}`,
          concept: item.concept,
          category,
          vector: item.vector
        });
      }
    }
    
    return true;
  }
  
  /**
   * Find the best matching folder for a note
   * @param {Array} noteVector - Note embedding vector
   * @param {Object} options - Search options
   * @returns {Object|null} - Best matching folder or null
   */
  async findBestMatchingFolder(noteVector, options = {}) {
    const {
      threshold = 0.75,
      parentFolderId = null
    } = options;
    
    const filter = parentFolderId !== undefined ? { parentId: parentFolderId } : null;
    
    const results = await this.query('folders', noteVector, {
      limit: 3,
      threshold,
      filter
    });
    
    return results.length > 0 ? results[0] : null;
  }
}

// Create and export singleton instance
const vectorDB = new VectorDatabase();
export default vectorDB;