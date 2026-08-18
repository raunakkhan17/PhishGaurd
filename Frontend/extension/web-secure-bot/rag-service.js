// RAG Service - Local Vector Store Implementation
class RAGService {
  constructor() {
    this.dbName = 'WebSecurityBotRAG';
    this.dbVersion = 1;
    this.storeName = 'chunks';
    this.db = null;
    this.ready = false;
    this.initPromise = null;
    console.log('🔧 RAGService: Initializing...');

    // Store the init promise so we can wait on it
    this.initPromise = this.init().then(() => {
      this.ready = true;
      console.log('✅ RAGService: Initialized successfully');
    }).catch(error => {
      console.error('❌ RAGService: Initialization failed:', error);
      this.ready = false;
    });
  }

  // Wait for RAG service to be ready
  async waitForReady() {
    if (this.ready) return;
    console.log('⏳ RAGService: Waiting for initialization...');
    await this.initPromise;
    console.log('✅ RAGService: Now ready');
  }

  async init() {
    console.log('🔧 RAGService: Starting database initialization...');
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('❌ RAGService: Database open error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ RAGService: Database opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔧 RAGService: Database upgrade needed, creating stores...');
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ RAGService: Object stores created successfully');
        }
      };
    });
  }

  // Simple text embedding using character frequency (free alternative to API calls)
  async createEmbedding(text) {
    try {
      console.log('🔧 RAGService: Creating embedding for text length:', text?.length || 0);
      
      if (!text || typeof text !== 'string') {
        console.warn('⚠️ RAGService: Invalid text for embedding:', text);
        return new Array(128).fill(0);
      }
      
      // Convert text to lowercase and remove special characters
      const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const words = cleanText.split(/\s+/).filter(word => word.length > 2);
      
      console.log('🔧 RAGService: Cleaned text words count:', words.length);
      
      // Create a simple frequency-based vector (128 dimensions)
      const vector = new Array(128).fill(0);
      
      words.forEach((word, index) => {
        const hash = this.simpleHash(word);
        const position = hash % 128;
        vector[position] += 1;
      });
      
      // Normalize the vector
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        const normalizedVector = vector.map(val => val / magnitude);
        console.log('✅ RAGService: Embedding created successfully, magnitude:', magnitude);
        return normalizedVector;
      }
      
      console.log('✅ RAGService: Embedding created (zero magnitude)');
      return vector;
    } catch (error) {
      console.error('❌ RAGService: Error creating embedding:', error);
      return new Array(128).fill(0);
    }
  }

  // Simple hash function for consistent embedding
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Store chunks with embeddings
  async storeChunks(url, chunks, metadata) {
    try {
      // Wait for initialization first
      await this.waitForReady();

      console.log('💾 RAGService: Starting to store chunks for URL:', url);
      console.log('💾 RAGService: Chunks count:', chunks?.length || 0);
      console.log('💾 RAGService: Metadata:', metadata);

      if (!this.db) {
        console.log('🔧 RAGService: Database not ready, re-initializing...');
        await this.init();
        await this.waitForReady();
      }
      
      if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        console.warn('⚠️ RAGService: No valid chunks to store');
        return [];
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Clear existing chunks for this URL
      console.log('🧹 RAGService: Clearing existing chunks for URL...');
      const index = transaction.objectStore(this.storeName).index('url');
      const existingChunks = await this.getAllByIndex(index, 'url', url);
      console.log('🧹 RAGService: Found existing chunks:', existingChunks.length);
      
      existingChunks.forEach(chunk => {
        try {
          store.delete(chunk.id);
        } catch (error) {
          console.warn('⚠️ RAGService: Error deleting existing chunk:', error);
        }
      });
      
      // Store new chunks
      console.log('💾 RAGService: Storing new chunks...');
      const promises = chunks.map(async (chunk, index) => {
        try {
          if (!chunk || !chunk.text) {
            console.warn('⚠️ RAGService: Invalid chunk at index:', index, chunk);
            return null;
          }
          
          const embedding = await this.createEmbedding(chunk.text);
          const chunkData = {
            id: `${url}_${Date.now()}_${index}`,
            url: url,
            text: chunk.text,
            embedding: embedding,
            metadata: {
              ...metadata,
              chunkIndex: index,
              chunkId: chunk.id,
              startWord: chunk.startWord,
              endWord: chunk.endWord
            },
            timestamp: Date.now()
          };
          
          console.log('💾 RAGService: Storing chunk:', chunkData.id);
          return store.add(chunkData);
        } catch (error) {
          console.error('❌ RAGService: Error storing chunk at index:', index, error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      const successfulResults = results.filter(result => result !== null);
      
      console.log('✅ RAGService: Successfully stored chunks:', successfulResults.length);
      return successfulResults;
      
    } catch (error) {
      console.error('❌ RAGService: Error storing chunks:', error);
      throw error;
    }
  }

  // Get all records by index
  getAllByIndex(index, key, value) {
    return new Promise((resolve, reject) => {
      try {
        const request = index.getAll(value);
        request.onsuccess = () => {
          console.log('📊 RAGService: Retrieved records by index:', request.result?.length || 0);
          resolve(request.result || []);
        };
        request.onerror = () => {
          console.error('❌ RAGService: Error getting records by index:', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('❌ RAGService: Error in getAllByIndex:', error);
        reject(error);
      }
    });
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    try {
      if (!vecA || !vecB || vecA.length !== vecB.length) {
        console.warn('⚠️ RAGService: Invalid vectors for similarity calculation');
        return 0;
      }
      
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      
      if (normA === 0 || normB === 0) return 0;
      
      const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      return similarity;
    } catch (error) {
      console.error('❌ RAGService: Error calculating cosine similarity:', error);
      return 0;
    }
  }

  // Find most relevant chunks for a question
  async findRelevantChunks(question, url, topK = 5) {
    try {
      // Wait for initialization first
      await this.waitForReady();

      console.log('🔍 RAGService: Finding relevant chunks for question:', question);
      console.log('🔍 RAGService: URL:', url);
      console.log('🔍 RAGService: Top K:', topK);

      if (!this.db) {
        console.log('🔧 RAGService: Database not ready, initializing...');
        await this.init();
        await this.waitForReady();
      }
      
      if (!question || !url) {
        console.warn('⚠️ RAGService: Invalid question or URL');
        return [];
      }
      
      const questionEmbedding = await this.createEmbedding(question);
      console.log('🔧 RAGService: Question embedding created');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const urlIndex = store.index('url');
      
      // Get all chunks for the current URL
      const chunks = await this.getAllByIndex(urlIndex, 'url', url);
      console.log('📊 RAGService: Found chunks for URL:', chunks.length);
      
      if (chunks.length === 0) {
        console.log('📊 RAGService: No chunks found for URL');
        return [];
      }
      
      // Calculate similarities and sort
      console.log('🔍 RAGService: Calculating similarities...');
      const chunksWithSimilarity = chunks.map(chunk => {
        try {
          const similarity = this.cosineSimilarity(questionEmbedding, chunk.embedding);
          return {
            ...chunk,
            similarity: similarity
          };
        } catch (error) {
          console.warn('⚠️ RAGService: Error calculating similarity for chunk:', error);
          return {
            ...chunk,
            similarity: 0
          };
        }
      });
      
      // Sort by similarity and return top K
      const sortedChunks = chunksWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
      
      console.log('✅ RAGService: Found relevant chunks:', sortedChunks.length);
      console.log('📊 RAGService: Top similarities:', sortedChunks.map(c => c.similarity));
      
      return sortedChunks;
      
    } catch (error) {
      console.error('❌ RAGService: Error finding relevant chunks:', error);
      return [];
    }
  }

  // Get context summary for a question
  async getContextForQuestion(question, url) {
    try {
      console.log('📋 RAGService: Getting context for question:', question);
      
      const relevantChunks = await this.findRelevantChunks(question, url, 3);
      
      if (relevantChunks.length === 0) {
        console.log('📋 RAGService: No relevant chunks found');
        return {
          context: "No relevant context found for this question.",
          chunks: [],
          totalChunks: 0
        };
      }
      
      // Create a focused context from relevant chunks
      const context = relevantChunks.map(chunk => 
        `[Context ${chunk.metadata.chunkIndex + 1}]: ${chunk.text}`
      ).join('\n\n');
      
      const result = {
        context: context,
        chunks: relevantChunks,
        totalChunks: relevantChunks.length
      };
      
      console.log('✅ RAGService: Context created successfully, chunks:', result.totalChunks);
      return result;
      
    } catch (error) {
      console.error('❌ RAGService: Error getting context for question:', error);
      return {
        context: "Error retrieving context for this question.",
        chunks: [],
        totalChunks: 0
      };
    }
  }

  // Clear old data (older than 24 hours)
  async cleanupOldData() {
    try {
      console.log('🧹 RAGService: Starting cleanup of old data...');
      
      if (!this.db) {
        console.log('🔧 RAGService: Database not ready, initializing...');
        await this.init();
      }
      
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const timestampIndex = store.index('timestamp');
      
      const oldChunks = await this.getAllByIndex(timestampIndex, 'timestamp', cutoffTime);
      console.log('🧹 RAGService: Found old chunks to clean:', oldChunks.length);
      
      oldChunks.forEach(chunk => {
        try {
          store.delete(chunk.id);
        } catch (error) {
          console.warn('⚠️ RAGService: Error deleting old chunk:', error);
        }
      });
      
      console.log('✅ RAGService: Cleanup completed, removed chunks:', oldChunks.length);
      return oldChunks.length;
      
    } catch (error) {
      console.error('❌ RAGService: Error during cleanup:', error);
      return 0;
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGService;
} else {
  window.RAGService = RAGService;
}
