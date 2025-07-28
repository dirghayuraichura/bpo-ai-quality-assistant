import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3']
  },
  apis: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001']
  }
};

export default config; 