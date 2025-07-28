import { Analysis, CoachingPlan } from '../models/index.js';
import llmService from '../services/llmService.js';
import Joi from 'joi';

/**
 * Coaching Controller
 * Handles coaching plan generation and management
 */
class CoachingController {

  /**
   * Generate coaching plan from analysis
   * POST /api/coaching/:analysisId
   */
  async generateCoachingPlan(req, res) {
    try {
      const { analysisId } = req.params;
      const { agentId = 'agent_001' } = req.body;

      // Validate input
      const schema = Joi.object({
        agentId: Joi.string().min(1).required()
      });

      const { error } = schema.validate({ agentId });
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
      }

      // Validate analysis ID
      if (!analysisId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }

      // Check if analysis exists
      const analysis = await Analysis.findById(analysisId)
        .populate('transcriptId')
        .populate('audioFileId');
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found'
        });
      }

      // Check if coaching plan already exists
      const existingPlan = await CoachingPlan.findOne({ analysisId });
      if (existingPlan) {
        return res.status(409).json({
          success: false,
          message: 'Coaching plan already exists for this analysis',
          data: {
            coachingPlanId: existingPlan._id,
            createdAt: existingPlan.createdAt
          }
        });
      }

      // Generate coaching plan using LLM service
      const coachingResult = await llmService.generateCoachingPlan(analysis, agentId);

      // Create coaching plan record
      const coachingPlan = new CoachingPlan({
        analysisId,
        audioFileId: analysis.audioFileId._id,
        agentId: coachingResult.agentId,
        overallPerformance: coachingResult.overallPerformance,
        strengths: coachingResult.strengths,
        improvementAreas: coachingResult.improvementAreas,
        actionItems: coachingResult.actionItems,
        trainingRecommendations: coachingResult.trainingRecommendations,
        followUpPlan: coachingResult.followUpPlan,
        customNotes: coachingResult.customNotes
      });

      await coachingPlan.save();

      console.log(`📋 Generated coaching plan for agent ${agentId} (analysis: ${analysisId})`);

      res.status(201).json({
        success: true,
        message: 'Coaching plan generated successfully',
        data: {
          coachingPlanId: coachingPlan._id,
          analysisId: coachingPlan.analysisId,
          audioFileId: coachingPlan.audioFileId,
          agentId: coachingPlan.agentId,
          overallPerformance: coachingPlan.overallPerformance,
          strengths: coachingPlan.strengths,
          improvementAreas: coachingPlan.improvementAreas,
          actionItems: coachingPlan.actionItems,
          trainingRecommendations: coachingPlan.trainingRecommendations,
          followUpPlan: coachingPlan.followUpPlan,
          customNotes: coachingPlan.customNotes,
          generatedAt: coachingPlan.generatedAt
        }
      });

    } catch (error) {
      console.error('Coaching plan generation error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Coaching plan generation failed',
        error: error.message
      });
    }
  }

  /**
   * Get coaching plan by ID
   * GET /api/coaching/:id
   */
  async getCoachingPlan(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coaching plan ID format'
        });
      }

      const coachingPlan = await CoachingPlan.findById(id)
        .populate('analysisId', 'sentiment customerSatisfaction issueResolution compliance summary')
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
        .select('-__v');

      if (!coachingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Coaching plan not found'
        });
      }

      res.json({
        success: true,
        data: coachingPlan
      });

    } catch (error) {
      console.error('Get coaching plan error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coaching plan',
        error: error.message
      });
    }
  }

  /**
   * Get coaching plan by analysis ID
   * GET /api/coaching/analysis/:analysisId
   */
  async getCoachingPlanByAnalysis(req, res) {
    try {
      const { analysisId } = req.params;

      // Validate ID format
      if (!analysisId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }

      const coachingPlan = await CoachingPlan.findOne({ analysisId })
        .populate('analysisId', 'sentiment customerSatisfaction issueResolution compliance summary')
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
        .select('-__v');

      if (!coachingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Coaching plan not found for this analysis'
        });
      }

      res.json({
        success: true,
        data: coachingPlan
      });

    } catch (error) {
      console.error('Get coaching plan by analysis error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coaching plan',
        error: error.message
      });
    }
  }

  /**
   * Get coaching plans by agent ID
   * GET /api/coaching/agent/:agentId
   */
  async getCoachingPlansByAgent(req, res) {
    try {
      const { agentId } = req.params;

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Sort parameters
      const sort = {};
      if (req.query.sortBy) {
        const sortField = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;
      } else {
        sort.generatedAt = -1; // Default: newest first
      }

      // Execute query
      const [coachingPlans, total] = await Promise.all([
        CoachingPlan.find({ agentId })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('analysisId', 'sentiment customerSatisfaction issueResolution compliance summary')
          .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
          .select('-__v'),
        CoachingPlan.countDocuments({ agentId })
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        success: true,
        data: coachingPlans,
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
      console.error('Get coaching plans by agent error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coaching plans',
        error: error.message
      });
    }
  }

  /**
   * Get list of coaching plans
   * GET /api/coaching
   */
  async getCoachingPlans(req, res) {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Filter parameters
      const filter = {};
      if (req.query.agentId) {
        filter.agentId = req.query.agentId;
      }
      if (req.query.performanceLevel) {
        filter['overallPerformance.level'] = req.query.performanceLevel;
      }
      if (req.query.minScore) {
        filter['overallPerformance.score'] = { $gte: parseInt(req.query.minScore) };
      }

      // Sort parameters
      const sort = {};
      if (req.query.sortBy) {
        const sortField = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;
      } else {
        sort.generatedAt = -1; // Default: newest first
      }

      // Execute query
      const [coachingPlans, total] = await Promise.all([
        CoachingPlan.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('analysisId', 'sentiment customerSatisfaction issueResolution compliance summary')
          .populate('audioFileId', 'originalName filename size mimetype uploadedAt')
          .select('-__v'),
        CoachingPlan.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        success: true,
        data: coachingPlans,
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
      console.error('Get coaching plans error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coaching plans',
        error: error.message
      });
    }
  }

  /**
   * Update coaching plan
   * PUT /api/coaching/:id
   */
  async updateCoachingPlan(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate input schema
      const schema = Joi.object({
        customNotes: Joi.string().optional(),
        followUpPlan: Joi.object({
          nextReviewDate: Joi.date().optional(),
          milestones: Joi.array().items(
            Joi.object({
              description: Joi.string().required(),
              targetDate: Joi.date().required(),
              metrics: Joi.array().items(Joi.string()).optional()
            })
          ).optional()
        }).optional(),
        actionItems: Joi.array().items(
          Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            category: Joi.string().valid('communication', 'technical', 'product_knowledge', 'soft_skills', 'compliance').required(),
            priority: Joi.string().valid('high', 'medium', 'low').required(),
            estimatedTime: Joi.string().optional(),
            resources: Joi.array().items(Joi.string()).optional(),
            successMetrics: Joi.array().items(Joi.string()).optional()
          })
        ).optional()
      });

      const { error } = schema.validate(updateData);
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
          message: 'Invalid coaching plan ID format'
        });
      }

      const coachingPlan = await CoachingPlan.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      )
        .populate('analysisId', 'sentiment customerSatisfaction issueResolution compliance summary')
        .populate('audioFileId', 'originalName filename size mimetype uploadedAt');

      if (!coachingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Coaching plan not found'
        });
      }

      console.log(`📝 Updated coaching plan ${id}`);

      res.json({
        success: true,
        message: 'Coaching plan updated successfully',
        data: coachingPlan
      });

    } catch (error) {
      console.error('Update coaching plan error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update coaching plan',
        error: error.message
      });
    }
  }

  /**
   * Delete coaching plan
   * DELETE /api/coaching/:id
   */
  async deleteCoachingPlan(req, res) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coaching plan ID format'
        });
      }

      const coachingPlan = await CoachingPlan.findByIdAndDelete(id);

      if (!coachingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Coaching plan not found'
        });
      }

      console.log(`🗑️ Deleted coaching plan ${id}`);

      res.json({
        success: true,
        message: 'Coaching plan deleted successfully'
      });

    } catch (error) {
      console.error('Delete coaching plan error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to delete coaching plan',
        error: error.message
      });
    }
  }

  /**
   * Get coaching statistics
   * GET /api/coaching/stats
   */
  async getCoachingStats(req, res) {
    try {
      const [
        total,
        byPerformanceLevel,
        byAgent,
        avgPerformanceScore,
        commonImprovementAreas
      ] = await Promise.all([
        CoachingPlan.countDocuments(),
        CoachingPlan.aggregate([
          { $group: { _id: '$overallPerformance.level', count: { $sum: 1 } } }
        ]),
        CoachingPlan.aggregate([
          { $group: { _id: '$agentId', count: { $sum: 1 }, avgScore: { $avg: '$overallPerformance.score' } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        CoachingPlan.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$overallPerformance.score' } } }
        ]),
        CoachingPlan.aggregate([
          { $unwind: '$improvementAreas' },
          { $group: { _id: '$improvementAreas.area', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ])
      ]);

      res.json({
        success: true,
        data: {
          totalPlans: total,
          averagePerformanceScore: Math.round((avgPerformanceScore[0]?.avgScore || 0) * 100) / 100,
          byPerformanceLevel: byPerformanceLevel.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          topAgents: byAgent.map(agent => ({
            agentId: agent._id,
            planCount: agent.count,
            averageScore: Math.round(agent.avgScore * 100) / 100
          })),
          commonImprovementAreas: commonImprovementAreas.map(area => ({
            area: area._id,
            count: area.count
          }))
        }
      });

    } catch (error) {
      console.error('Get coaching stats error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coaching statistics',
        error: error.message
      });
    }
  }

  /**
   * Get agent performance summary
   * GET /api/coaching/agent-summary/:agentId
   */
  async getAgentPerformanceSummary(req, res) {
    try {
      const { agentId } = req.params;

      const [
        totalPlans,
        avgScore,
        latestPlan,
        performanceTrend,
        commonStrengths,
        commonImprovements
      ] = await Promise.all([
        CoachingPlan.countDocuments({ agentId }),
        CoachingPlan.aggregate([
          { $match: { agentId } },
          { $group: { _id: null, avgScore: { $avg: '$overallPerformance.score' } } }
        ]),
        CoachingPlan.findOne({ agentId })
          .sort({ generatedAt: -1 })
          .populate('analysisId', 'sentiment customerSatisfaction')
          .populate('audioFileId', 'originalName uploadedAt'),
        CoachingPlan.find({ agentId })
          .sort({ generatedAt: -1 })
          .limit(5)
          .select('overallPerformance.score generatedAt'),
        CoachingPlan.aggregate([
          { $match: { agentId } },
          { $unwind: '$strengths' },
          { $group: { _id: '$strengths.area', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
        ]),
        CoachingPlan.aggregate([
          { $match: { agentId } },
          { $unwind: '$improvementAreas' },
          { $group: { _id: '$improvementAreas.area', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
        ])
      ]);

      if (totalPlans === 0) {
        return res.status(404).json({
          success: false,
          message: 'No coaching plans found for this agent'
        });
      }

      res.json({
        success: true,
        data: {
          agentId,
          totalPlans,
          averagePerformanceScore: Math.round((avgScore[0]?.avgScore || 0) * 100) / 100,
          latestPlan: latestPlan ? {
            id: latestPlan._id,
            score: latestPlan.overallPerformance.score,
            level: latestPlan.overallPerformance.level,
            generatedAt: latestPlan.generatedAt,
            audioFile: latestPlan.audioFileId?.originalName,
            sentiment: latestPlan.analysisId?.sentiment?.overall
          } : null,
          performanceTrend: performanceTrend.map(plan => ({
            score: plan.overallPerformance.score,
            date: plan.generatedAt
          })),
          commonStrengths: commonStrengths.map(strength => ({
            area: strength._id,
            frequency: strength.count
          })),
          commonImprovementAreas: commonImprovements.map(improvement => ({
            area: improvement._id,
            frequency: improvement.count
          }))
        }
      });

    } catch (error) {
      console.error('Get agent performance summary error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve agent performance summary',
        error: error.message
      });
    }
  }
}

export default new CoachingController(); 