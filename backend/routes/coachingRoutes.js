import express from 'express';
import coachingController from '../controllers/coachingController.js';

const router = express.Router();

/**
 * Coaching Routes
 * Handles coaching plan generation and management
 */

// Generate coaching plan from analysis
router.post('/:analysisId', coachingController.generateCoachingPlan);

// Get coaching plan by ID
router.get('/:id', coachingController.getCoachingPlan);

// Get list of coaching plans with pagination and filtering
router.get('/', coachingController.getCoachingPlans);

// Get coaching plan by analysis ID
router.get('/analysis/:analysisId', coachingController.getCoachingPlanByAnalysis);

// Get coaching plans by agent ID
router.get('/agent/:agentId', coachingController.getCoachingPlansByAgent);

// Update coaching plan
router.put('/:id', coachingController.updateCoachingPlan);

// Delete coaching plan
router.delete('/:id', coachingController.deleteCoachingPlan);

// Get coaching statistics
router.get('/stats/overview', coachingController.getCoachingStats);

// Get agent performance summary
router.get('/stats/agent-summary/:agentId', coachingController.getAgentPerformanceSummary);

export default router; 