import type { IUsersRepository } from "../IUsersRepository";
import type RedisCache from "../../../infra/cache/redis.infra";
import User from "../user.entity";
import logger from "../../../infra/logs/logger.infra";

type UserDTO = {
  email: string;
  name: string;
  id: number;
};

export class RedisUsersRepository implements IUsersRepository {
  private readonly redisCache: RedisCache;

  constructor(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  async getUsers(): Promise<User[]> {
    await this.ensureConnection();
    const cachedData = await this.redisCache.get("users");
    return cachedData ? this.parseUsers(cachedData) : [];
  }

  async saveUsers(users: User[]): Promise<void> {
    await this.ensureConnection();
    await this.redisCache.set("users", users);
  }

  private async ensureConnection(): Promise<void> {
    await this.redisCache.connect();
  }

  private parseUsers(data: string): User[] {
    try {
      const parsedData: UserDTO[] = JSON.parse(data);
      const users: User[] = parsedData.map((userDTO: UserDTO) => {
        return new User(userDTO.id, userDTO.email, userDTO.name);
      });
      return users;
    } catch (error) {
      logger.error(`Failed to parse cached users data: ${error}`);
      return [];
    }
  }
}
