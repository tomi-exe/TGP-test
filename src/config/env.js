import 'dotenv/config';

export const env = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
};

export function validateRequiredEnv() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
}
