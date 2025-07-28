import express from 'express';
import uploadRoutes from './uploadRoutes.js';
import transcriptRoutes from './transcriptRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import coachingRoutes from './coachingRoutes.js';

const router = express.Router();

/**
 * API Routes Index
 * Organizes all API routes with version prefix
 */

// API status endpoint
router.get('/status', async (req, res) => {
  // Dynamic import to avoid circular dependency
  const { default: sttService } = await import('../services/sttService.js');
  const { default: llmService } = await import('../services/llmService.js');
  
  // Test OpenAI connections
  const [sttConnected, llmConnected] = await Promise.all([
    sttService.testConnection(),
    llmService.testConnection()
  ]);

  res.json({
    success: true,
    services: {
      api: 'running',
      database: 'connected',
      stt: sttConnected ? 'openai_whisper_connected' : 'openai_disconnected',
      llm: llmConnected ? 'openai_gpt_connected' : 'openai_disconnected'
    },
    endpoints: {
      upload: '/api/upload',
      transcript: '/api/transcript',
      analysis: '/api/analysis',
      coaching: '/api/coaching'
    },
    openai: {
      whisper: sttConnected,
      gpt: llmConnected,
      configured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock_openai_key')
    }
  });
});

// Mount route modules
router.use('/upload', uploadRoutes);
router.use('/transcript', transcriptRoutes);
router.use('/analysis', analysisRoutes);
router.use('/coaching', coachingRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/status',
      'POST /api/upload',
      'GET /api/upload',
      'POST /api/transcript/:audioFileId',
      'GET /api/transcript',
      'POST /api/analysis/:transcriptId',
      'GET /api/analysis',
      'POST /api/coaching/:analysisId',
      'GET /api/coaching'
    ]
  });
});

export default router; 