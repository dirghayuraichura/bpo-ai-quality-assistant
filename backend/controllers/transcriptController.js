import { AudioFile, Transcript } from '../models/index.js';
import sttService from '../services/sttService.js';
import Joi from 'joi';

/**
 * Transcript Controller
 * Handles speech-to-text operations and transcript management
 */
class TranscriptController {

  /**
   * Transcribe audio file
   * POST /api/transcript/:audioFileId
   */
  async transcribeAudio(req, res) {
    try {
      const { audioFileId } = req.params;
      const { language = 'en' } = req.body;

      // Validate input
      const schema = Joi.object({
        language: Joi.string().valid(...sttService.getSupportedLanguages()).optional()
      });

      const { error } = schema.validate({ language });
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
      }

      // Validate audio file ID
      if (!audioFileId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid audio file ID format'
        });
      }

      // Check if audio file exists
      const audioFile = await AudioFile.findById(audioFileId);
      if (!audioFile) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      // Check if transcript already exists
      const existingTranscript = await Transcript.findOne({ audioFileId });
      if (existingTranscript) {
        return res.status(409).json({
          success: false,
          message: 'Transcript already exists for this audio file',
          data: {
            transcriptId: existingTranscript._id,
            createdAt: existingTranscript.createdAt
          }
        });
      }

      // Update audio file status
      await AudioFile.findByIdAndUpdate(audioFileId, { status: 'processing' });

      try {
        // Transcribe audio using STT service
        const transcriptionResult = await sttService.transcribeAudio(audioFile.path, { language });

        // Create transcript record
        const transcript = new Transcript({
          audioFileId,
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          segments: transcriptionResult.segments,
          language: transcriptionResult.language,
          processingTime: transcriptionResult.processingTime
        });

        await transcript.save();

        // Update audio file with duration and status
        await AudioFile.findByIdAndUpdate(audioFileId, {
          duration: transcriptionResult.duration,
          status: 'completed'
        });

        console.log(`🎯 Transcribed audio file ${audioFile.originalName} (${audioFileId})`);

        res.status(201).json({
          success: true,
          message: 'Audio file transcribed successfully',
          data: {
            transcriptId: transcript._id,
            audioFileId: transcript.audioFileId,
            text: transcript.text,
            confidence: transcript.confidence,
            segments: transcript.segments,
            language: transcript.language,
            processingTime: transcript.processingTime,
            createdAt: transcript.createdAt
          }
        });

      } catch (transcriptionError) {
        // Update audio file status to failed
        await AudioFile.findByIdAndUpdate(audioFileId, { status: 'failed' });
        throw transcriptionError;
      }

    } catch (error) {
      console.error('Transcription error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Transcription failed',
        error: error.message
      });
    }
  }

  /**
   * Get transcript by ID
   * GET /api/transcript/:id
   */
  async getTranscript(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID format'
        });
      }

      const transcript = await Transcript.findById(id)
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
        .select('-__v');

      if (!transcript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      res.json({
        success: true,
        data: transcript
      });

    } catch (error) {
      console.error('Get transcript error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transcript',
        error: error.message
      });
    }
  }

  /**
   * Get transcript by audio file ID
   * GET /api/transcript/audio/:audioFileId
   */
  async getTranscriptByAudioFile(req, res) {
    try {
      const { audioFileId } = req.params;

      // Validate ID format
      if (!audioFileId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid audio file ID format'
        });
      }

      const transcript = await Transcript.findOne({ audioFileId })
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
        .select('-__v');

      if (!transcript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found for this audio file'
        });
      }

      res.json({
        success: true,
        data: transcript
      });

    } catch (error) {
      console.error('Get transcript by audio file error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transcript',
        error: error.message
      });
    }
  }

  /**
   * Get list of transcripts
   * GET /api/transcript
   */
  async getTranscripts(req, res) {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Filter parameters
      const filter = {};
      if (req.query.language) {
        filter.language = req.query.language;
      }
      if (req.query.minConfidence) {
        filter.confidence = { $gte: parseFloat(req.query.minConfidence) };
      }

      // Sort parameters
      const sort = {};
      if (req.query.sortBy) {
        const sortField = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;
      } else {
        sort.createdAt = -1; // Default: newest first
      }

      // Execute query
      const [transcripts, total] = await Promise.all([
        Transcript.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
          .select('-__v'),
        Transcript.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        success: true,
        data: transcripts,
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
      console.error('Get transcripts error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transcripts',
        error: error.message
      });
    }
  }

  /**
   * Update transcript
   * PUT /api/transcript/:id
   */
  async updateTranscript(req, res) {
    try {
      const { id } = req.params;
      const { text, segments } = req.body;

      // Validate input
      const schema = Joi.object({
        text: Joi.string().min(1).required(),
        segments: Joi.array().items(
          Joi.object({
            text: Joi.string().required(),
            start: Joi.number().min(0).required(),
            end: Joi.number().min(0).required(),
            confidence: Joi.number().min(0).max(1).optional()
          })
        ).optional()
      });

      const { error } = schema.validate({ text, segments });
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
          message: 'Invalid transcript ID format'
        });
      }

      const updateData = { text };
      if (segments) {
        updateData.segments = segments;
      }

      const transcript = await Transcript.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('audioFileId', 'originalName filename size mimetype uploadedAt');

      if (!transcript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      console.log(`📝 Updated transcript ${id}`);

      res.json({
        success: true,
        message: 'Transcript updated successfully',
        data: transcript
      });

    } catch (error) {
      console.error('Update transcript error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update transcript',
        error: error.message
      });
    }
  }

  /**
   * Delete transcript
   * DELETE /api/transcript/:id
   */
  async deleteTranscript(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID format'
        });
      }

      const transcript = await Transcript.findByIdAndDelete(id);

      if (!transcript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      console.log(`🗑️ Deleted transcript ${id}`);

      res.json({
        success: true,
        message: 'Transcript deleted successfully'
      });

    } catch (error) {
      console.error('Delete transcript error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transcript',
        error: error.message
      });
    }
  }

  /**
   * Get transcript statistics
   * GET /api/transcript/stats
   */
  async getTranscriptStats(req, res) {
    try {
      const [total, byLanguage, avgConfidence, avgProcessingTime] = await Promise.all([
        Transcript.countDocuments(),
        Transcript.aggregate([
          { $group: { _id: '$language', count: { $sum: 1 } } }
        ]),
        Transcript.aggregate([
          { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
        ]),
        Transcript.aggregate([
          { $group: { _id: null, avgProcessingTime: { $avg: '$processingTime' } } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          totalTranscripts: total,
          averageConfidence: Math.round((avgConfidence[0]?.avgConfidence || 0) * 1000) / 1000,
          averageProcessingTime: Math.round(avgProcessingTime[0]?.avgProcessingTime || 0),
          byLanguage: byLanguage.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Get transcript stats error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transcript statistics',
        error: error.message
      });
    }
  }
}

export default new TranscriptController(); 