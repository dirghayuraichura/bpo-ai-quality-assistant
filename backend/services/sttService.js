import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import config from '../config/config.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * OpenAI Whisper Speech-to-Text Service
 * Production implementation using OpenAI's Whisper API
 */
class STTService {
  constructor() {
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
    this.maxFileSize = 25 * 1024 * 1024; // 25MB OpenAI limit
    this.supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
  }

  /**
   * Transcribe audio file to text using OpenAI Whisper API
   * @param {string} filePath - Path to the audio file
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(filePath, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate API key
      const apiKey = config.apis.openaiApiKey;
      if (!apiKey || apiKey === 'mock_openai_key') {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('Audio file not found');
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      console.log(`🎯 STT Service: Processing file ${path.basename(filePath)} (${Math.round(stats.size / 1024)}KB)`);

      // Check file size limit
      if (stats.size > this.maxFileSize) {
        throw new Error(`File size ${Math.round(stats.size / (1024 * 1024))}MB exceeds OpenAI limit of 25MB`);
      }

      // Validate file format
      const fileExtension = path.extname(filePath).toLowerCase().replace('.', '');
      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      // Prepare form data for OpenAI API
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'segment');
      
      if (options.language) {
        formData.append('language', options.language);
      }

      // Make API request to OpenAI
      console.log(`🔄 Sending request to OpenAI Whisper API...`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // Transform OpenAI response to our format
      const transcriptionResult = {
        text: result.text || '',
        confidence: this.calculateOverallConfidence(result.segments || []),
        segments: this.transformSegments(result.segments || []),
        language: result.language || options.language || 'en',
        duration: result.duration || 0,
        processingTime,
        rawResult: result // Keep original for debugging
      };

      console.log(`✅ STT Service: Transcription completed in ${processingTime}ms`);
      console.log(`📝 Transcribed text: "${transcriptionResult.text.substring(0, 100)}${transcriptionResult.text.length > 100 ? '...' : ''}"`);
      
      return transcriptionResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ STT Service Error (${processingTime}ms):`, error.message);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Calculate overall confidence from segments
   * @param {Array} segments - Array of transcription segments
   * @returns {number} Overall confidence score
   */
  calculateOverallConfidence(segments) {
    if (!segments || segments.length === 0) return 0.8; // Default confidence

    // Calculate weighted average based on segment duration
    let totalDuration = 0;
    let weightedConfidence = 0;

    for (const segment of segments) {
      const duration = (segment.end || 0) - (segment.start || 0);
      const confidence = segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.8;
      
      totalDuration += duration;
      weightedConfidence += confidence * duration;
    }

    return totalDuration > 0 ? Math.min(weightedConfidence / totalDuration, 1) : 0.8;
  }

  /**
   * Transform OpenAI segments to our format
   * @param {Array} segments - OpenAI segments
   * @returns {Array} Transformed segments
   */
  transformSegments(segments) {
    return segments.map(segment => ({
      text: segment.text || '',
      start: segment.start || 0,
      end: segment.end || 0,
      confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.8
    }));
  }

  /**
   * Get supported languages for OpenAI Whisper
   * @returns {Array} List of supported language codes
   */
  getSupportedLanguages() {
    return [
      'af', 'ar', 'hy', 'az', 'be', 'bs', 'bg', 'ca', 'zh', 'hr', 'cs', 'da', 'nl', 'en', 'et', 'fi', 'fr', 'gl', 'de', 'el', 'he', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'kn', 'kk', 'ko', 'lv', 'lt', 'mk', 'ms', 'mr', 'mi', 'ne', 'no', 'fa', 'pl', 'pt', 'ro', 'ru', 'sr', 'sk', 'sl', 'es', 'sw', 'sv', 'tl', 'ta', 'th', 'tr', 'uk', 'ur', 'vi', 'cy'
    ];
  }

  /**
   * Validate audio file format
   * @param {string} mimetype - File mimetype
   * @returns {boolean} Whether the format is supported
   */
  isFormatSupported(mimetype) {
    const supportedMimeTypes = [
      'audio/flac', 'audio/m4a', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 
      'audio/mpga', 'audio/oga', 'audio/ogg', 'audio/wav', 'audio/webm'
    ];
    return supportedMimeTypes.includes(mimetype);
  }

  /**
   * Get file size limit
   * @returns {number} File size limit in bytes
   */
  getFileSizeLimit() {
    return this.maxFileSize;
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

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI API connection test failed:', error.message);
      return false;
    }
  }
}

export default new STTService(); 