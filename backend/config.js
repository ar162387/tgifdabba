import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tgif-dabba',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // JWT Configuration
  jwtExpiresIn: '24h',
  
  // Rate Limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs
  
  // CORS Configuration
  corsOptions: {
    origin: [
      'http://localhost:5173',
      'https://tgifdabba.onrender.com',
      'https://tgifdabba.onrender.com/'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  }
};
