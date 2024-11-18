import type { IUsersRepository } from "../IUsersRepository";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import User from "../user.entity";
import logger from "../../../infra/logs/logger.infra";
import type { HTTPUsersRepository } from "./httpUsers.repository";
import type { RedisUsersRepository } from "./redisUsers.repository";

export class UsersRepository implements IUsersRepository {
  private readonly httpUsersRepository: HTTPUsersRepository;
  private readonly redisUsersRepository: RedisUsersRepository;

  constructor(httpUsersRepository: HTTPUsersRepository, redisUsersRepository: RedisUsersRepository) {
    this.httpUsersRepository = httpUsersRepository;
    this.redisUsersRepository = redisUsersRepository;
  }

  public async getUsers(): Promise<User[]> {
    try {
      const cachedUsers = await this.getCachedUsers();
      if (cachedUsers.length) {
        return cachedUsers;
      }

      const users = await this.httpUsersRepository.getUsers();
      await this.cacheUsers(users);
      return users;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  private async getCachedUsers(): Promise<User[]> {
    try {
      return await this.redisUsersRepository.getUsers();
    } catch (error) {
      logger.error(`Failed to get cached users: ${error}`);
      return [];
    }
  }

  private async cacheUsers(users: User[]): Promise<void> {
    try {
      await this.redisUsersRepository.saveUsers(users);
    } catch (error) {
      logger.error(`Failed to cache users: ${error}`);
    }
  }
}
