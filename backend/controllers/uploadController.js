import { AudioFile } from '../models/index.js';
import uploadService from '../services/uploadService.js';
import Joi from 'joi';

/**
 * Upload Controller
 * Handles audio file upload operations
 */
class UploadController {
  
  /**
   * Upload audio file
   * POST /api/upload
   */
  async uploadAudio(req, res) {
    try {
      // Process uploaded file
      const fileInfo = uploadService.processUploadedFile(req.file);
      
      // Save file information to database
      const audioFile = new AudioFile({
        originalName: fileInfo.originalName,
        filename: fileInfo.filename,
        path: fileInfo.path,
        mimetype: fileInfo.mimetype,
        size: fileInfo.size,
        status: 'uploaded'
      });

      await audioFile.save();

      console.log(`📁 Uploaded audio file: ${fileInfo.originalName} (${audioFile._id})`);

      res.status(201).json({
        success: true,
        message: 'Audio file uploaded successfully',
        data: {
          id: audioFile._id,
          _id: audioFile._id,
          originalName: audioFile.originalName,
          filename: audioFile.filename,
          size: audioFile.size,
          mimetype: audioFile.mimetype,
          uploadedAt: audioFile.uploadedAt,
          status: audioFile.status
        }
      });

    } catch (error) {
      console.error('Upload error:', error.message);
      
      // Clean up uploaded file if database save failed
      if (req.file && req.file.path) {
        try {
          await uploadService.deleteFile(req.file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError.message);
        }
      }

      res.status(400).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }

  /**
   * Get upload information by ID
   * GET /api/upload/:id
   */
  async getUploadInfo(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file ID format'
        });
      }

      const audioFile = await AudioFile.findById(id);
      
      if (!audioFile) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      // Get additional file system information
      const fileInfo = await uploadService.getFileInfo(audioFile.path);

      res.json({
        success: true,
        data: {
          id: audioFile._id,
          _id: audioFile._id,
          originalName: audioFile.originalName,
          filename: audioFile.filename,
          path: audioFile.path,
          size: audioFile.size,
          mimetype: audioFile.mimetype,
          duration: audioFile.duration,
          uploadedAt: audioFile.uploadedAt,
          status: audioFile.status,
          ...fileInfo
        }
      });

    } catch (error) {
      console.error('Get upload info error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upload information',
        error: error.message
      });
    }
  }

  /**
   * Get list of uploaded files
   * GET /api/upload
   */
  async getUploads(req, res) {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Filter parameters
      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.mimetype) {
        filter.mimetype = req.query.mimetype;
      }

      // Sort parameters
      const sort = {};
      if (req.query.sortBy) {
        const sortField = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;
      } else {
        sort.uploadedAt = -1; // Default: newest first
      }

      // Execute query
      const [audioFiles, total] = await Promise.all([
        AudioFile.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select('-__v')
          .lean(),
        AudioFile.countDocuments(filter)
      ]);

      // Transform to include both _id and id
      const transformedFiles = audioFiles.map(file => ({
        ...file,
        id: file._id,
        uploadedAt: file.uploadedAt
      }));

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        success: true,
        data: transformedFiles,
        pagination: {
          current: page,
          total: totalPages,
          limit,
          totalItems: total,
          hasNext,
          hasPrev
        }
      });

    } catch (error) {
      console.error('Get uploads error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve uploads',
        error: error.message
      });
    }
  }

  /**
   * Delete uploaded file
   * DELETE /api/upload/:id
   */
  async deleteUpload(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file ID format'
        });
      }

      const audioFile = await AudioFile.findById(id);
      
      if (!audioFile) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      // Delete file from filesystem
      try {
        await uploadService.deleteFile(audioFile.path);
      } catch (fileError) {
        console.warn('File system deletion failed:', fileError.message);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      await AudioFile.findByIdAndDelete(id);

      console.log(`🗑️ Deleted audio file: ${audioFile.originalName} (${id})`);

      res.json({
        success: true,
        message: 'Audio file deleted successfully'
      });

    } catch (error) {
      console.error('Delete upload error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete upload',
        error: error.message
      });
    }
  }

  /**
   * Update upload status
   * PATCH /api/upload/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate input
      const schema = Joi.object({
        status: Joi.string().valid('uploaded', 'processing', 'completed', 'failed').required()
      });

      const { error } = schema.validate({ status });
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
      }

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file ID format'
        });
      }

      const audioFile = await AudioFile.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!audioFile) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      console.log(`📝 Updated status for ${audioFile.originalName}: ${status}`);

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: {
          id: audioFile._id,
          status: audioFile.status,
          updatedAt: audioFile.updatedAt
        }
      });

    } catch (error) {
      console.error('Update status error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error.message
      });
    }
  }

  /**
   * Get upload statistics
   * GET /api/upload/stats
   */
  async getUploadStats(req, res) {
    try {
      const [dbStats, fsStats] = await Promise.all([
        this.getDatabaseStats(),
        uploadService.getUploadStats()
      ]);

      res.json({
        success: true,
        data: {
          database: dbStats,
          filesystem: fsStats
        }
      });

    } catch (error) {
      console.error('Get upload stats error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upload statistics',
        error: error.message
      });
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const [total, byStatus, byMimetype, totalSize] = await Promise.all([
      AudioFile.countDocuments(),
      AudioFile.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AudioFile.aggregate([
        { $group: { _id: '$mimetype', count: { $sum: 1 } } }
      ]),
      AudioFile.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    return {
      totalFiles: total,
      totalSizeBytes: totalSize[0]?.totalSize || 0,
      totalSizeMB: Math.round((totalSize[0]?.totalSize || 0) / (1024 * 1024) * 100) / 100,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byMimetype: byMimetype.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

export default new UploadController(); 