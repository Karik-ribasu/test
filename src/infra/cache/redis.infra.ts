import { createClient, type RedisClientType } from "redis";

class RedisCache {
  private static instance: RedisCache;
  private readonly client: RedisClientType;

  private constructor() {
    this.client = createClient({
      password: 'fumBwVwwT7ZLfEQJLDBKq3Bk7oZKyhPi',
      socket: {
        host: 'redis-17576.c308.sa-east-1-1.ec2.redns.redis-cloud.com',
        port: 17576,
      },
    });
  }

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
      RedisCache.instance.client.restore
    }
    return RedisCache.instance;
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  set(key: string, value: any): Promise<string | null>{
    return this.client.set(key, JSON.stringify(value))
  }
}

export default RedisCache;
