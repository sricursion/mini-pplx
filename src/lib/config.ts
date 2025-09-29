export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-search-engine',
  },
  apis: {
    exaApiKey: process.env.EXA_API_KEY || '',
    mistralApiKey: process.env.MISTRAL_API_KEY || '',
  },
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};