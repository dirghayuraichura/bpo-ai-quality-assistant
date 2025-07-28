import express from 'express';
import uploadController from '../controllers/uploadController.js';
import uploadService from '../services/uploadService.js';

const router = express.Router();

/**
 * Upload Routes
 * Handles audio file upload operations
 */

// Upload audio file
router.post('/', 
  uploadService.getUploadMiddleware(),
  uploadController.uploadAudio
);

// Get upload information by ID
router.get('/:id', uploadController.getUploadInfo);

// Get list of uploaded files with pagination and filtering
router.get('/', uploadController.getUploads);

// Update upload status
router.patch('/:id/status', uploadController.updateStatus);

// Delete uploaded file
router.delete('/:id', uploadController.deleteUpload);

// Get upload statistics
router.get('/stats/overview', uploadController.getUploadStats);

export default router; 