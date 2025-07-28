import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://codewithdirghayu:021295@omind-cluster.80kohks.mongodb.net/?retryWrites=true&w=majority&appName=omind-cluster'
  },
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3']
  },
  apis: {
    openaiApiKey: process.env.OPENAI_API_KEY || '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'
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001']
  }
};

export default config; 