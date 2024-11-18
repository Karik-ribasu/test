import { createClient, type RedisClientType } from "redis";
import config from "../config/config.infra";


class RedisCache {
  private static instance: RedisCache;
  private readonly client: RedisClientType;

  private constructor() {
    this.client = createClient({
      password: config.REDIS.KEY,
      socket: {
        host: config.REDIS.HOST,
        port: Number(config.REDIS.PORT),
      },
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Connection Error", err);
    });
  }

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
      RedisCache.instance.client.restore;
    }
    return RedisCache.instance;
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  set(key: string, value: any): Promise<string | null> {
    return this.client.set(key, JSON.stringify(value));
  }
}

export default RedisCache;
