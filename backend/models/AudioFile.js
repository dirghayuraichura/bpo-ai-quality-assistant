import mongoose from 'mongoose';

const audioFileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true,
    enum: ['audio/wav', 'audio/mpeg', 'audio/mp3']
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  }
}, {
  timestamps: true
});

// Index for efficient queries
audioFileSchema.index({ filename: 1 });
audioFileSchema.index({ uploadedAt: -1 });
audioFileSchema.index({ status: 1 });

const AudioFile = mongoose.model('AudioFile', audioFileSchema);

export default AudioFile; 