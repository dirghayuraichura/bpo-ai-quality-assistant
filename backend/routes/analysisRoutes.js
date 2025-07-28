import express from 'express';
import analysisController from '../controllers/analysisController.js';

const router = express.Router();

/**
 * Analysis Routes
 * Handles LLM analysis operations and analysis management
 */

// Analyze transcript
router.post('/:transcriptId', analysisController.analyzeTranscript);

// Get analysis by ID
router.get('/:id', analysisController.getAnalysis);

// Get list of analyses with pagination and filtering
router.get('/', analysisController.getAnalyses);

// Get analysis by transcript ID
router.get('/transcript/:transcriptId', analysisController.getAnalysisByTranscript);

// Delete analysis
router.delete('/:id', analysisController.deleteAnalysis);

// Get analysis statistics
router.get('/stats/overview', analysisController.getAnalysisStats);

// Get sentiment analysis summary
router.get('/stats/sentiment-summary', analysisController.getSentimentSummary);

export default router; 