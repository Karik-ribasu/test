import { createClient, type RedisClientType } from "redis";

class RedisCache {
  private static instance: RedisCache;
  private readonly client: RedisClientType;

  private constructor() {
    this.client = createClient();
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
