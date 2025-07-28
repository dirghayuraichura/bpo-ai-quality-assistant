import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config.js';
import connectDB from './config/database.js';
import apiRoutes from './routes/index.js';

/**
 * Contact Center AI Analysis Backend Server
 * 
 * Features:
 * - Audio file upload and processing
 * - Speech-to-text transcription (OpenAI Whisper)
 * - LLM analysis of conversations (OpenAI GPT)
 * - Coaching plan generation
 * - RESTful API with comprehensive error handling
 */

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads (optional, for file access)
app.use('/uploads', express.static('uploads'));

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Contact Center AI Analysis API',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      status: '/api/status',
      endpoints: {
        upload: '/api/upload',
        transcript: '/api/transcript',
        analysis: '/api/analysis',
        coaching: '/api/coaching'
      }
    },
    features: [
      'Audio file upload (.wav, .mp3)',
      'Speech-to-text transcription',
      'LLM conversation analysis',
      'Automated coaching plan generation',
      'Performance analytics and reporting'
    ]
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check the API documentation at /api/status'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  const requestDuration = Date.now() - req.startTime;
  
  console.error(`🚨 Error [${req.requestId}] (${requestDuration}ms):`, {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Multer file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'The uploaded file exceeds the maximum allowed size',
      maxSize: config.upload.maxFileSize
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      error: 'Only single file upload is allowed in the "audioFile" field'
    });
  }

  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: error.message,
      allowedTypes: config.upload.allowedTypes
    });
  }

  // MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'The provided ID is not in the correct format'
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      error: 'A record with this information already exists'
    });
  }

  // JWT errors (if authentication is added later)
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Authentication token is invalid'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'Authentication token has expired'
    });
  }

  // Default server error
  const statusCode = error.statusCode || error.status || 500;
  const message = config.nodeEnv === 'production' ? 
    'Internal server error' : 
    error.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: config.nodeEnv === 'production' ? 
      'Something went wrong on our end' : 
      error.message,
    requestId: req.requestId,
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`
🚀 Contact Center AI Analysis API Server
📡 Server running on port ${PORT}
🌍 Environment: ${config.nodeEnv}
📊 Database: ${config.mongodb.uri}
📁 Upload path: ${config.upload.uploadPath}
🎯 API Documentation: http://localhost:${PORT}/api/status

Available endpoints:
• POST   /api/upload                    - Upload audio file
• GET    /api/upload                    - List uploaded files
• POST   /api/transcript/:audioFileId  - Transcribe audio
• GET    /api/transcript                - List transcripts
• POST   /api/analysis/:transcriptId   - Analyze transcript
• GET    /api/analysis                  - List analyses
• POST   /api/coaching/:analysisId     - Generate coaching plan
• GET    /api/coaching                  - List coaching plans
• GET    /api/health                   - Health check
• GET    /api/status                   - Service status

🎤 Ready to process audio files and generate insights!
  `);
});

export default app; 