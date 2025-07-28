import OpenAI from 'openai';
import config from '../config/config.js';

/**
 * OpenAI GPT LLM Analysis Service
 * Production implementation using OpenAI's GPT models for conversation analysis and coaching plan generation
 */
class LLMService {
  constructor() {
    this.openai = new OpenAI({ apiKey: config.apis.openaiApiKey });
    this.model = 'gpt-4o-mini'; // Or 'gpt-4', 'gpt-3.5-turbo'
  }

  /**
   * Analyze transcript using OpenAI GPT
   * @param {string} transcriptText - The transcript text to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeTranscript(transcriptText, options = {}) {
    const startTime = Date.now();
    
    try {
      const apiKey = config.apis.openaiApiKey;
      if (!apiKey || apiKey === 'mock_openai_key') {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
      }

      console.log(`🧠 LLM Service: Analyzing transcript using OpenAI GPT (${transcriptText.length} characters)`);

      const prompt = `Analyze the following contact center transcript and provide a structured JSON output with EXACTLY this format:

{
  "sentiment": {
    "overall": "positive|neutral|negative",
    "score": <number between -1 and 1>,
    "confidence": <number between 0 and 1>
  },
  "emotions": [
    {
      "emotion": "joy|sadness|anger|fear|surprise|disgust|neutral",
      "intensity": <number between 0 and 1>
    }
  ],
  "keyTopics": [
    {
      "topic": "<topic name>",
      "relevance": <number between 0 and 1>
    }
  ],
  "communicationMetrics": {
    "speakingRate": <words per minute>,
    "pauseFrequency": <pauses per minute>,
    "interruptionCount": <number>,
    "clarityScore": <number between 0 and 1>
  },
  "customerSatisfaction": {
    "score": <number between 1 and 10>,
    "indicators": ["<indicator1>", "<indicator2>"]
  },
  "issueResolution": {
    "wasResolved": <boolean>,
    "resolutionTime": <minutes>,
    "escalationNeeded": <boolean>
  },
  "compliance": {
    "score": <number between 0 and 1>,
    "violations": ["<violation1>"],
    "recommendations": ["<recommendation1>"]
  },
  "summary": "<comprehensive summary of the conversation>"
}

Transcript: "${transcriptText}"

IMPORTANT: Ensure ALL required fields are present and the JSON is valid. The sentiment.overall and sentiment.score fields are REQUIRED.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content);
      const processingTime = Date.now() - startTime;

      // Validate required fields
      if (!analysisResult.sentiment || !analysisResult.sentiment.overall || analysisResult.sentiment.score === undefined) {
        throw new Error('Invalid analysis response: missing required sentiment fields (overall and score)');
      }

      if (!analysisResult.summary) {
        throw new Error('Invalid analysis response: missing required summary field');
      }

      console.log(`✅ LLM Service: Analysis completed in ${processingTime}ms`);
      
      return { ...analysisResult, processingTime, rawResult: response };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ LLM Service Error (${processingTime}ms):`, error.message);
      throw new Error(`LLM Analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate coaching plan using OpenAI GPT
   * @param {Object} analysis - The analysis result
   * @param {string} agentId - The agent ID
   * @returns {Promise<Object>} Coaching plan
   */
  async generateCoachingPlan(analysis, agentId = 'agent_001') {
    const startTime = Date.now();
    
    try {
      const apiKey = config.apis.openaiApiKey;
      if (!apiKey || apiKey === 'mock_openai_key') {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
      }

      console.log(`🎯 LLM Service: Generating coaching plan for agent ${agentId}`);

      const prompt = ` agentId}, generate a comprehensive coaching plan in JSON format with EXACTLY this structure:

{
  "agentId": "${agentId}",
  "overallPerformance": {
    "score": <number between 0 and 100>,
    "level": "excellent|good|average|needs_improvement|poor"
  },
  "strengths": [
    {
      "area": "<strength area>",
      "description": "<description>",
      "examples": ["<example1>", "<example2>"]
    }
  ],
  "improvementAreas": [
    {
      "area": "<improvement area>",
      "priority": "high|medium|low",
      "description": "<description>",
      "currentPerformance": "<current state>",
      "targetPerformance": "<desired state>"
    }
  ],
  "actionItems": [
    {
      "title": "<action title>",
      "description": "<description>",
      "category": "communication|technical|product_knowledge|soft_skills|compliance",
      "priority": "high|medium|low",
      "estimatedTime": "<time estimate>",
      "resources": ["<resource1>", "<resource2>"],
      "successMetrics": ["<metric1>", "<metric2>"]
    }
  ],
  "trainingRecommendations": [
    {
      "title": "<training title>",
      "type": "course|workshop|mentoring|practice|reading",
      "description": "<description>",
      "duration": "<duration>",
      "priority": "high|medium|low"
    }
  ],
  "followUpPlan": {
    "nextReviewDate": "<ISO date string 2 weeks from now>",
    "milestones": [
      {
        "description": "<milestone description>",
        "targetDate": "<ISO date string>",
        "metrics": ["<metric1>", "<metric2>"]
      }
    ]
  },
  "customNotes": "<personalized notes and recommendations>"
}

Analysis: ${JSON.stringify(analysis, null, 2)}

IMPORTANT: Ensure ALL required fields are present and the JSON is valid. The agentId, overallPerformance.score, and overallPerformance.level fields are REQUIRED.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const coachingPlan = JSON.parse(response.choices[0].message.content);
      const processingTime = Date.now() - startTime;

      // Validate required fields
      if (!coachingPlan.agentId) {
        throw new Error('Invalid coaching plan response: missing required agentId field');
      }

      if (!coachingPlan.overallPerformance || !coachingPlan.overallPerformance.score || !coachingPlan.overallPerformance.level) {
        throw new Error('Invalid coaching plan response: missing required overallPerformance fields (score and level)');
      }

      console.log(`✅ LLM Service: Coaching plan generated in ${processingTime}ms`);
      
      return { ...coachingPlan, processingTime, rawResult: response };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ LLM Service Error (${processingTime}ms):`, error.message);
      throw new Error(`Coaching plan generation failed: ${error.message}`);
    }
  }

  /**
   * Test OpenAI API connection
   * @returns {Promise<boolean>} Whether the API is accessible
   */
  async testConnection() {
    try {
      const apiKey = config.apis.openaiApiKey;
      if (!apiKey || apiKey === 'mock_openai_key') {
        return false;
      }
      const openai = new OpenAI({ apiKey });
      await openai.models.list(); // Simple API call to check connectivity
      return true;
    } catch (error) {
      console.error('OpenAI GPT API connection test failed:', error.message);
      return false;
    }
  }
}

export default new LLMService(); 