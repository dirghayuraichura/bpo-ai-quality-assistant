import mongoose from 'mongoose';

const coachingPlanSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true
  },
  audioFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile',
    required: true
  },
  agentId: {
    type: String,
    required: true // This could be extracted from metadata or provided
  },
  overallPerformance: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    level: {
      type: String,
      enum: ['excellent', 'good', 'average', 'needs_improvement', 'poor'],
      required: true
    }
  },
  strengths: [{
    area: String,
    description: String,
    examples: [String]
  }],
  improvementAreas: [{
    area: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    description: String,
    currentPerformance: String,
    targetPerformance: String
  }],
  actionItems: [{
    title: String,
    description: String,
    category: {
      type: String,
      enum: ['communication', 'technical', 'product_knowledge', 'soft_skills', 'compliance']
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    estimatedTime: String, // e.g., "2 weeks", "1 month"
    resources: [String],
    successMetrics: [String]
  }],
  trainingRecommendations: [{
    title: String,
    type: {
      type: String,
      enum: ['course', 'workshop', 'mentoring', 'practice', 'reading']
    },
    description: String,
    duration: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  followUpPlan: {
    nextReviewDate: Date,
    milestones: [{
      description: String,
      targetDate: Date,
      metrics: [String]
    }]
  },
  customNotes: String,
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
coachingPlanSchema.index({ analysisId: 1 });
coachingPlanSchema.index({ audioFileId: 1 });
coachingPlanSchema.index({ agentId: 1 });
coachingPlanSchema.index({ 'overallPerformance.score': -1 });
coachingPlanSchema.index({ generatedAt: -1 });

const CoachingPlan = mongoose.model('CoachingPlan', coachingPlanSchema);

export default CoachingPlan; 