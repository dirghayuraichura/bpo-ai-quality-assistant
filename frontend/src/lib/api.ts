import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface AudioFile {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  duration?: number;
}

export interface Transcript {
  id: string;
  audioFileId: string;
  text: string;
  confidence: number;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  language: string;
  processingTime: number;
  createdAt: string;
  audioFile?: AudioFile;
}

export interface Analysis {
  id: string;
  transcriptId: string;
  audioFileId: string;
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  };
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  keyTopics: Array<{
    topic: string;
    relevance: number;
  }>;
  communicationMetrics: {
    speakingRate: number;
    pauseFrequency: number;
    interruptionCount: number;
    clarityScore: number;
  };
  customerSatisfaction: {
    score: number;
    indicators: string[];
  };
  issueResolution: {
    wasResolved: boolean;
    resolutionTime: number;
    escalationNeeded: boolean;
  };
  compliance: {
    score: number;
    violations: string[];
    recommendations: string[];
  };
  summary: string;
  processingTime: number;
  createdAt: string;
  transcript?: Transcript;
  audioFile?: AudioFile;
}

export interface CoachingPlan {
  id: string;
  analysisId: string;
  audioFileId: string;
  agentId: string;
  overallPerformance: {
    score: number;
    level: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor';
  };
  strengths: Array<{
    area: string;
    description: string;
    examples: string[];
  }>;
  improvementAreas: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    currentPerformance: string;
    targetPerformance: string;
  }>;
  actionItems: Array<{
    title: string;
    description: string;
    category: 'communication' | 'technical' | 'product_knowledge' | 'soft_skills' | 'compliance';
    priority: 'high' | 'medium' | 'low';
    estimatedTime?: string;
    resources?: string[];
    successMetrics?: string[];
  }>;
  trainingRecommendations: Array<{
    title: string;
    type: 'course' | 'workshop' | 'mentoring' | 'practice' | 'reading';
    description: string;
    duration: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  followUpPlan: {
    nextReviewDate?: string;
    milestones?: Array<{
      description: string;
      targetDate: string;
      metrics?: string[];
    }>;
  };
  customNotes?: string;
  generatedAt: string;
  analysis?: Analysis;
  audioFile?: AudioFile;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current: number;
    total: number;
    limit: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// API Service Class
class ApiService {
  // Health and Status
  async getHealth() {
    const response = await api.get('/api/health');
    return response.data;
  }

  async getStatus() {
    const response = await api.get('/api/status');
    return response.data;
  }

  // Upload APIs
  async uploadAudioFile(file: File): Promise<ApiResponse<AudioFile>> {
    const formData = new FormData();
    formData.append('audioFile', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getUploads(page = 1, limit = 10): Promise<PaginatedResponse<AudioFile>> {
    const response = await api.get('/api/upload', {
      params: { page, limit },
    });
    return response.data;
  }

  async getUploadById(id: string): Promise<ApiResponse<AudioFile>> {
    const response = await api.get(`/api/upload/${id}`);
    return response.data;
  }

  async deleteUpload(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/api/upload/${id}`);
    return response.data;
  }

  // Transcript APIs
  async transcribeAudio(audioFileId: string, language = 'en'): Promise<ApiResponse<Transcript>> {
    const response = await api.post(`/api/transcript/${audioFileId}`, { language });
    return response.data;
  }

  async getTranscripts(page = 1, limit = 10): Promise<PaginatedResponse<Transcript>> {
    const response = await api.get('/api/transcript', {
      params: { page, limit },
    });
    return response.data;
  }

  async getTranscriptById(id: string): Promise<ApiResponse<Transcript>> {
    const response = await api.get(`/api/transcript/${id}`);
    return response.data;
  }

  async getTranscriptByAudioFile(audioFileId: string): Promise<ApiResponse<Transcript>> {
    const response = await api.get(`/api/transcript/audio/${audioFileId}`);
    return response.data;
  }

  async deleteTranscript(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/api/transcript/${id}`);
    return response.data;
  }

  // Analysis APIs
  async analyzeTranscript(transcriptId: string): Promise<ApiResponse<Analysis>> {
    console.log('API Service - analyzeTranscript called with transcriptId:', transcriptId);
    console.log('API Service - transcriptId type:', typeof transcriptId);
    console.log('API Service - transcriptId length:', transcriptId?.length);
    
    const response = await api.post(`/api/analysis/${transcriptId}`);
    return response.data;
  }

  async getAnalyses(page = 1, limit = 10): Promise<PaginatedResponse<Analysis>> {
    const response = await api.get('/api/analysis', {
      params: { page, limit },
    });
    return response.data;
  }

  async getAnalysisById(id: string): Promise<ApiResponse<Analysis>> {
    const response = await api.get(`/api/analysis/${id}`);
    return response.data;
  }

  async getAnalysisByTranscript(transcriptId: string): Promise<ApiResponse<Analysis>> {
    const response = await api.get(`/api/analysis/transcript/${transcriptId}`);
    return response.data;
  }

  async deleteAnalysis(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/api/analysis/${id}`);
    return response.data;
  }

  // Coaching APIs
  async generateCoachingPlan(analysisId: string, agentId = 'agent_001'): Promise<ApiResponse<CoachingPlan>> {
    const response = await api.post(`/api/coaching/${analysisId}`, { agentId });
    return response.data;
  }

  async getCoachingPlans(page = 1, limit = 10): Promise<PaginatedResponse<CoachingPlan>> {
    const response = await api.get('/api/coaching', {
      params: { page, limit },
    });
    return response.data;
  }

  async getCoachingPlanById(id: string): Promise<ApiResponse<CoachingPlan>> {
    const response = await api.get(`/api/coaching/${id}`);
    return response.data;
  }

  async getCoachingPlanByAnalysis(analysisId: string): Promise<ApiResponse<CoachingPlan>> {
    const response = await api.get(`/api/coaching/analysis/${analysisId}`);
    return response.data;
  }

  async getCoachingPlansByAgent(agentId: string, page = 1, limit = 10): Promise<PaginatedResponse<CoachingPlan>> {
    const response = await api.get(`/api/coaching/agent/${agentId}`, {
      params: { page, limit },
    });
    return response.data;
  }

  async deleteCoachingPlan(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/api/coaching/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 