import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  transcriptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcript',
    required: true
  },
  audioFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile',
    required: true
  },
  sentiment: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true
    },
    score: {
      type: Number,
      min: -1,
      max: 1,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  emotions: [{
    emotion: {
      type: String,
      enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral']
    },
    intensity: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  keyTopics: [{
    topic: String,
    relevance: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  communicationMetrics: {
    speakingRate: Number, // words per minute
    pauseFrequency: Number,
    interruptionCount: Number,
    clarityScore: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  customerSatisfaction: {
    score: {
      type: Number,
      min: 1,
      max: 10
    },
    indicators: [String]
  },
  issueResolution: {
    wasResolved: Boolean,
    resolutionTime: Number, // in minutes
    escalationNeeded: Boolean
  },
  compliance: {
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    violations: [String],
    recommendations: [String]
  },
  summary: {
    type: String,
    required: true
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
analysisSchema.index({ transcriptId: 1 });
analysisSchema.index({ audioFileId: 1 });
analysisSchema.index({ 'sentiment.overall': 1 });
analysisSchema.index({ 'customerSatisfaction.score': -1 });
analysisSchema.index({ createdAt: -1 });

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis; 