import { createClient, type RedisClientType } from "redis";

class RedisCache {
  private static instance: RedisCache;
  public readonly client: RedisClientType;

  private constructor() {
    this.client = createClient({
      password: process.env.REDIS_KEY,
      socket: {
        host: process.env.REDIS_URL,
        port: Number(process.env.REDIS_PORT) | 17576,
      },
    });

    // Error handling
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  public static async getInstance(): Promise<RedisCache> {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }

    if (!RedisCache.instance.client.isOpen) {
      try {
        await RedisCache.instance.client.connect();
      } catch (error) {
        throw error;
      }
    }
    return RedisCache.instance;
  }
}

export default RedisCache;
