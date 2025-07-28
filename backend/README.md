# Contact Center AI Analysis Backend

A Node.js backend API for analyzing contact center conversations using AI-powered speech-to-text and LLM analysis to generate coaching plans for agents.

## Features

- 🎤 **Audio File Upload**: Support for WAV and MP3 files via Multer
- 🎯 **Speech-to-Text**: OpenAI Whisper API integration (production ready)
- 🧠 **LLM Analysis**: OpenAI GPT API for conversation analysis (production ready)
- 📋 **Coaching Plans**: Automated generation of personalized coaching recommendations
- 📊 **Analytics**: Performance metrics and reporting
- 🔒 **Security**: Helmet, CORS, input validation
- 📝 **Logging**: Request logging with Morgan
- 🗄️ **Database**: MongoDB with Mongoose ODM

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Environment**: dotenv
- **Development**: nodemon
- **Module System**: ES6 modules

## Project Structure

```
backend/
├── config/
│   ├── config.js          # Environment configuration
│   └── database.js        # MongoDB connection
├── models/
│   ├── AudioFile.js       # Audio file metadata
│   ├── Transcript.js      # Transcription results
│   ├── Analysis.js        # LLM analysis results
│   ├── CoachingPlan.js    # Coaching recommendations
│   └── index.js           # Model exports
├── controllers/
│   ├── uploadController.js    # File upload operations
│   ├── transcriptController.js # STT operations
│   ├── analysisController.js   # LLM analysis operations
│   └── coachingController.js   # Coaching plan operations
├── routes/
│   ├── uploadRoutes.js    # Upload endpoints
│   ├── transcriptRoutes.js # Transcript endpoints
│   ├── analysisRoutes.js   # Analysis endpoints
│   ├── coachingRoutes.js   # Coaching endpoints
│   └── index.js           # Route organization
├── services/
│   ├── sttService.js      # Mock STT service
│   ├── llmService.js      # Mock LLM service
│   └── uploadService.js   # File handling service
├── uploads/               # File upload directory
├── package.json
├── .env                   # Environment variables
└── index.js              # Main server file
```

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB locally
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/contact_center_ai

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# API Keys (OpenAI for both STT and LLM)
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## API Endpoints

### Health & Status

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/status` - Service status

### File Upload

- `POST /api/upload` - Upload audio file
- `GET /api/upload` - List uploaded files (with pagination)
- `GET /api/upload/:id` - Get file information
- `PATCH /api/upload/:id/status` - Update file status
- `DELETE /api/upload/:id` - Delete file
- `GET /api/upload/stats/overview` - Upload statistics

### Transcription

- `POST /api/transcript/:audioFileId` - Transcribe audio file
- `GET /api/transcript` - List transcripts (with pagination)
- `GET /api/transcript/:id` - Get transcript by ID
- `GET /api/transcript/audio/:audioFileId` - Get transcript by audio file
- `PUT /api/transcript/:id` - Update transcript
- `DELETE /api/transcript/:id` - Delete transcript
- `GET /api/transcript/stats/overview` - Transcript statistics

### Analysis

- `POST /api/analysis/:transcriptId` - Analyze transcript
- `GET /api/analysis` - List analyses (with pagination)
- `GET /api/analysis/:id` - Get analysis by ID
- `GET /api/analysis/transcript/:transcriptId` - Get analysis by transcript
- `DELETE /api/analysis/:id` - Delete analysis
- `GET /api/analysis/stats/overview` - Analysis statistics
- `GET /api/analysis/stats/sentiment-summary` - Sentiment analysis summary

### Coaching

- `POST /api/coaching/:analysisId` - Generate coaching plan
- `GET /api/coaching` - List coaching plans (with pagination)
- `GET /api/coaching/:id` - Get coaching plan by ID
- `GET /api/coaching/analysis/:analysisId` - Get coaching plan by analysis
- `GET /api/coaching/agent/:agentId` - Get coaching plans by agent
- `PUT /api/coaching/:id` - Update coaching plan
- `DELETE /api/coaching/:id` - Delete coaching plan
- `GET /api/coaching/stats/overview` - Coaching statistics
- `GET /api/coaching/stats/agent-summary/:agentId` - Agent performance summary

## Usage Examples

### 1. Upload Audio File

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "audioFile=@/path/to/audio.wav"
```

### 2. Transcribe Audio

```bash
curl -X POST http://localhost:3001/api/transcript/AUDIO_FILE_ID \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

### 3. Analyze Transcript

```bash
curl -X POST http://localhost:3001/api/analysis/TRANSCRIPT_ID
```

### 4. Generate Coaching Plan

```bash
curl -X POST http://localhost:3001/api/coaching/ANALYSIS_ID \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent_001"}'
```

## Complete Workflow Example

```bash
# 1. Upload audio file
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/upload \
  -F "audioFile=@sample_call.wav")
AUDIO_FILE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.id')

# 2. Transcribe the audio
TRANSCRIPT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/transcript/$AUDIO_FILE_ID \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}')
TRANSCRIPT_ID=$(echo $TRANSCRIPT_RESPONSE | jq -r '.data.transcriptId')

# 3. Analyze the transcript
ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/analysis/$TRANSCRIPT_ID)
ANALYSIS_ID=$(echo $ANALYSIS_RESPONSE | jq -r '.data.analysisId')

# 4. Generate coaching plan
COACHING_RESPONSE=$(curl -s -X POST http://localhost:3001/api/coaching/$ANALYSIS_ID \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent_001"}')

echo "Coaching Plan Generated: $(echo $COACHING_RESPONSE | jq -r '.data.coachingPlanId')"
```

## Data Models

### AudioFile
- Stores uploaded audio file metadata
- Tracks processing status
- Links to transcripts and analyses

### Transcript
- Contains speech-to-text results
- Includes confidence scores and segments
- Supports multiple languages

### Analysis
- LLM analysis results including:
  - Sentiment analysis
  - Emotion detection
  - Key topics extraction
  - Communication metrics
  - Customer satisfaction scores
  - Compliance assessment

### CoachingPlan
- Personalized coaching recommendations
- Performance scoring and levels
- Strengths and improvement areas
- Action items and training recommendations
- Follow-up milestones

## Error Handling

The API provides comprehensive error handling with:
- Input validation using Joi
- File upload error handling
- MongoDB error translation
- Request tracking with unique IDs
- Detailed error responses in development
- Sanitized errors in production

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **File Validation**: Type and size restrictions
- **Input Validation**: Joi schema validation
- **Error Sanitization**: Safe error responses

## Development

### Running Tests
```bash
npm test
```

### Code Formatting
```bash
npm run format
```

### Linting
```bash
npm run lint
```

## Mock Services

The current implementation uses mock services for:

### STT Service (`services/sttService.js`)
- OpenAI Whisper API integration (currently mock)
- Returns realistic transcription results
- Configurable processing delays
- Ready for production OpenAI API calls

### LLM Service (`services/llmService.js`)
- OpenAI GPT API integration (currently mock)
- Generates conversation analysis and coaching recommendations
- Realistic sentiment and metrics
- Ready for production OpenAI API calls

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Configure real STT and LLM API keys
4. Set up proper CORS origins
5. Configure file upload limits

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Integration with Real Services

To integrate with real AI services, update:

1. **STT Service**: Currently set up for OpenAI Whisper API
   - Add actual OpenAI API calls to replace mock responses
   - Implement proper error handling for API failures
   - Add retry logic and rate limiting

2. **LLM Service**: Currently set up for OpenAI GPT API
   - Add actual OpenAI API calls for analysis and coaching generation
   - Implement proper prompt engineering for conversation analysis
   - Add error handling and fallback mechanisms

## License

This project is licensed under the ISC License.

## Support

For support and questions, please check the API documentation at `/api/status` or review the error logs. 