import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

if (process.env.NODE_ENV != 'test'){
  const requiredEnvVars = ["SERVER_PORT", "TEACHABLE_API_BASE_URL", "TEACHABLE_API_KEY", "REDIS_HOST", "REDIS_PORT"];
  for (const envVar of requiredEnvVars) {
    console.log(envVar)
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default {
  ENV: process.env.NODE_ENV,
  SERVER: {
    PORT: Number(process.env.SERVER_PORT)
  },
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: Number(process.env.REDIS_PORT),
    KEY: process.env.REDIS_KEY,
  },
  TEACHABLE_API: {
    BASE_URL: process.env.TEACHABLE_API_BASE_URL,
    KEY: process.env.TEACHABLE_API_KEY,
  },
};
