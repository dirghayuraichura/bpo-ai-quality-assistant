import express from 'express';
import transcriptController from '../controllers/transcriptController.js';

const router = express.Router();

/**
 * Transcript Routes
 * Handles speech-to-text operations and transcript management
 */

// Transcribe audio file
router.post('/:audioFileId', transcriptController.transcribeAudio);

// Get transcript by ID
router.get('/:id', transcriptController.getTranscript);

// Get list of transcripts with pagination and filtering
router.get('/', transcriptController.getTranscripts);

// Get transcript by audio file ID
router.get('/audio/:audioFileId', transcriptController.getTranscriptByAudioFile);

// Update transcript
router.put('/:id', transcriptController.updateTranscript);

// Delete transcript
router.delete('/:id', transcriptController.deleteTranscript);

// Get transcript statistics
router.get('/stats/overview', transcriptController.getTranscriptStats);

export default router; 