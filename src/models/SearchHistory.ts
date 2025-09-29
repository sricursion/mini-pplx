import mongoose, { Schema, Model } from 'mongoose';
import { ISearchHistory, EnhancedResult } from '../types/search';

// Enhanced Result schema
const enhancedResultSchema = new Schema<EnhancedResult>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        // Basic URL validation
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  snippet: {
    type: String,
    required: true,
    maxlength: 2000
  },
  aiSummary: {
    type: String,
    maxlength: 1000,
    default: undefined
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: undefined
  },
  source: {
    type: String,
    required: true,
    enum: ['exa'],
    default: 'exa'
  }
}, { _id: false });

// Search History schema
const searchHistorySchema = new Schema<ISearchHistory>({
  query: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500,
    index: true
  },
  results: {
    type: [enhancedResultSchema],
    required: true,
    validate: {
      validator: function(v: EnhancedResult[]) {
        return Array.isArray(v);
      },
      message: 'Results must be an array'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    trim: true,
    maxlength: 100,
    index: true,
    sparse: true
  },
  userId: {
    type: String,
    trim: true,
    maxlength: 100,
    index: true,
    sparse: true
  }
}, {
  timestamps: true,
  collection: 'searchhistories'
});

// Indexes for better query performance
searchHistorySchema.index({ timestamp: -1 });
searchHistorySchema.index({ query: 'text' });
searchHistorySchema.index({ sessionId: 1, timestamp: -1 });
searchHistorySchema.index({ userId: 1, timestamp: -1 });

// Instance methods
searchHistorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  return obj;
};

// Static methods
searchHistorySchema.statics.findByQuery = function(query: string, limit: number = 10) {
  return this.find({ query: new RegExp(query, 'i') })
    .sort({ timestamp: -1 })
    .limit(limit);
};

searchHistorySchema.statics.findBySessionId = function(sessionId: string, limit: number = 50) {
  return this.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

searchHistorySchema.statics.findByUserId = function(userId: string, limit: number = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

searchHistorySchema.statics.getRecentSearches = function(limit: number = 20) {
  return this.find({})
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Pre-save middleware for validation
searchHistorySchema.pre('save', function(next) {
  // Ensure query is not empty after trimming
  if (!this.query || this.query.trim().length === 0) {
    next(new Error('Query cannot be empty'));
    return;
  }
  
  // Validate results array
  if (!Array.isArray(this.results)) {
    next(new Error('Results must be an array'));
    return;
  }
  
  next();
});

// Create and export the model
const SearchHistory: Model<ISearchHistory> = mongoose.models.SearchHistory || 
  mongoose.model<ISearchHistory>('SearchHistory', searchHistorySchema);

export default SearchHistory;