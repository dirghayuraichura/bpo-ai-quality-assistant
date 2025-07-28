import { AudioFile, Transcript, Analysis } from '../models/index.js';
import llmService from '../services/llmService.js';

/**
 * Analysis Controller
 * Handles LLM analysis operations and analysis management
 */
class AnalysisController {

  /**
   * Analyze transcript
   * POST /api/analysis/:transcriptId
   */
  async analyzeTranscript(req, res) {
    try {
      const { transcriptId } = req.params;

      // Validate transcript ID
      if (!transcriptId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID format'
        });
      }

      // Check if transcript exists
      const transcript = await Transcript.findById(transcriptId).populate('audioFileId');
      if (!transcript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      // Check if analysis already exists
      const existingAnalysis = await Analysis.findOne({ transcriptId });
      if (existingAnalysis) {
        return res.status(409).json({
          success: false,
          message: 'Analysis already exists for this transcript',
          data: {
            analysisId: existingAnalysis._id,
            createdAt: existingAnalysis.createdAt
          }
        });
      }

      // Perform LLM analysis
      const analysisResult = await llmService.analyzeTranscript(transcript.text);

      // Create analysis record
      const analysis = new Analysis({
        transcriptId,
        audioFileId: transcript.audioFileId._id,
        sentiment: analysisResult.sentiment,
        emotions: analysisResult.emotions,
        keyTopics: analysisResult.keyTopics,
        communicationMetrics: analysisResult.communicationMetrics,
        customerSatisfaction: analysisResult.customerSatisfaction,
        issueResolution: analysisResult.issueResolution,
        compliance: analysisResult.compliance,
        summary: analysisResult.summary,
        processingTime: analysisResult.processingTime
      });

      await analysis.save();

      console.log(`🧠 Analyzed transcript ${transcriptId}`);

      res.status(201).json({
        success: true,
        message: 'Transcript analyzed successfully',
        data: {
          id: analysis._id,
          _id: analysis._id,
          analysisId: analysis._id,
          transcriptId: analysis.transcriptId,
          audioFileId: analysis.audioFileId,
          sentiment: analysis.sentiment,
          emotions: analysis.emotions,
          keyTopics: analysis.keyTopics,
          communicationMetrics: analysis.communicationMetrics,
          customerSatisfaction: analysis.customerSatisfaction,
          issueResolution: analysis.issueResolution,
          compliance: analysis.compliance,
          summary: analysis.summary,
          processingTime: analysis.processingTime,
          createdAt: analysis.createdAt
        }
      });

    } catch (error) {
      console.error('Analysis error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        error: error.message
      });
    }
  }

  /**
   * Get analysis by ID
   * GET /api/analysis/:id
   */
  async getAnalysis(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }

      const analysis = await Analysis.findById(id)
        .populate('transcriptId', 'text confidence language createdAt')
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
        .select('-__v');

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Get analysis error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analysis',
        error: error.message
      });
    }
  }

  /**
   * Get analysis by transcript ID
   * GET /api/analysis/transcript/:transcriptId
   */
  async getAnalysisByTranscript(req, res) {
    try {
      const { transcriptId } = req.params;

      // Validate ID format
      if (!transcriptId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID format'
        });
      }

      const analysis = await Analysis.findOne({ transcriptId })
        .populate('transcriptId', 'text confidence language createdAt')
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
        .select('-__v');

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found for this transcript'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Get analysis by transcript error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analysis',
        error: error.message
      });
    }
  }

  /**
   * Get list of analyses
   * GET /api/analysis
   */
  async getAnalyses(req, res) {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Filter parameters
      const filter = {};
      if (req.query.sentiment) {
        filter['sentiment.overall'] = req.query.sentiment;
      }
      if (req.query.minSatisfaction) {
        filter['customerSatisfaction.score'] = { $gte: parseInt(req.query.minSatisfaction) };
      }
      if (req.query.resolved !== undefined) {
        filter['issueResolution.wasResolved'] = req.query.resolved === 'true';
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
      const [analyses, total] = await Promise.all([
        Analysis.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('transcriptId', 'text confidence language createdAt')
          .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
          .select('-__v')
          .lean(),
        Analysis.countDocuments(filter)
      ]);

      // Transform to include both _id and id
      const transformedAnalyses = analyses.map(analysis => ({
        ...analysis,
        id: analysis._id,
        transcript: analysis.transcriptId,
        audioFile: analysis.audioFileId
      }));

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        success: true,
        data: transformedAnalyses,
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
      console.error('Get analyses error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analyses',
        error: error.message
      });
    }
  }

  /**
   * Delete analysis
   * DELETE /api/analysis/:id
   */
  async deleteAnalysis(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }

      const analysis = await Analysis.findByIdAndDelete(id);

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found'
        });
      }

      console.log(`🗑️ Deleted analysis ${id}`);

      res.json({
        success: true,
        message: 'Analysis deleted successfully'
      });

    } catch (error) {
      console.error('Delete analysis error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete analysis',
        error: error.message
      });
    }
  }

  /**
   * Get analysis statistics
   * GET /api/analysis/stats
   */
  async getAnalysisStats(req, res) {
    try {
      const [
        total,
        bySentiment,
        avgSatisfaction,
        resolutionStats,
        avgComplianceScore
      ] = await Promise.all([
        Analysis.countDocuments(),
        Analysis.aggregate([
          { $group: { _id: '$sentiment.overall', count: { $sum: 1 } } }
        ]),
        Analysis.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$customerSatisfaction.score' } } }
        ]),
        Analysis.aggregate([
          {
            $group: {
              _id: '$issueResolution.wasResolved',
              count: { $sum: 1 },
              avgResolutionTime: { $avg: '$issueResolution.resolutionTime' }
            }
          }
        ]),
        Analysis.aggregate([
          { $group: { _id: null, avgComplianceScore: { $avg: '$compliance.score' } } }
        ])
      ]);

      const resolutionData = resolutionStats.reduce((acc, item) => {
        if (item._id === true) {
          acc.resolved = item.count;
          acc.avgResolutionTime = Math.round(item.avgResolutionTime || 0);
        } else if (item._id === false) {
          acc.unresolved = item.count;
        }
        return acc;
      }, { resolved: 0, unresolved: 0, avgResolutionTime: 0 });

      res.json({
        success: true,
        data: {
          totalAnalyses: total,
          averageCustomerSatisfaction: Math.round((avgSatisfaction[0]?.avgScore || 0) * 100) / 100,
          averageComplianceScore: Math.round((avgComplianceScore[0]?.avgComplianceScore || 0) * 1000) / 1000,
          bySentiment: bySentiment.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          issueResolution: resolutionData
        }
      });

    } catch (error) {
      console.error('Get analysis stats error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analysis statistics',
        error: error.message
      });
    }
  }

  /**
   * Get sentiment analysis summary
   * GET /api/analysis/sentiment-summary
   */
  async getSentimentSummary(req, res) {
    try {
      const sentimentData = await Analysis.aggregate([
        {
          $group: {
            _id: '$sentiment.overall',
            count: { $sum: 1 },
            avgScore: { $avg: '$sentiment.score' },
            avgConfidence: { $avg: '$sentiment.confidence' },
            avgSatisfaction: { $avg: '$customerSatisfaction.score' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalAnalyses = await Analysis.countDocuments();

      const summary = sentimentData.map(item => ({
        sentiment: item._id,
        count: item.count,
        percentage: Math.round((item.count / totalAnalyses) * 100),
        averageScore: Math.round(item.avgScore * 1000) / 1000,
        averageConfidence: Math.round(item.avgConfidence * 1000) / 1000,
        averageCustomerSatisfaction: Math.round(item.avgSatisfaction * 100) / 100
      }));

      res.json({
        success: true,
        data: {
          totalAnalyses,
          sentimentBreakdown: summary
        }
      });

    } catch (error) {
      console.error('Get sentiment summary error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sentiment summary',
        error: error.message
      });
    }
  }
}

export default new AnalysisController(); 