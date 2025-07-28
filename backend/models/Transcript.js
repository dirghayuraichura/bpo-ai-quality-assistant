import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema({
  audioFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  segments: [{
    text: String,
    start: Number, // start time in seconds
    end: Number,   // end time in seconds
    confidence: Number
  }],
  language: {
    type: String,
    default: 'en'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
transcriptSchema.index({ audioFileId: 1 });
transcriptSchema.index({ createdAt: -1 });
transcriptSchema.index({ confidence: -1 });

const Transcript = mongoose.model('Transcript', transcriptSchema);

export default Transcript; 