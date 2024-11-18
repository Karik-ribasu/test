import type { IUsersRepository } from "./IUsersRepository";
import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../infra/errors/errorType.infra";
import type RedisCache from "../../infra/cache/redis.infra";
import User from "./user.entity";

export type HTTPGetUsersResponse = {
  users: {
    email: string;
    name: string;
    id: number;
  }[];
  meta: {
    page: number;
    total: number;
    number_of_pages: number;
    from: number;
    to: number;
    per_page: number;
  };
};

export class HTTPUsersRepository implements IUsersRepository {
  async getUsers(): Promise<User[]> {
    try {
      let result: User[] = [];
      let currentPage: number = 1;
      let totalPages: number = 1;

      do {
        const response = await fetch(`${process.env.TEACHABLE_API_BASE_URL}/v1/users?page=${currentPage}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            apiKey: process.env.TEACHABLE_API_KEY as string,
          },
        });

        if (!response.ok) {
          // Handle specific errors based on the status code
          if (response.status === 404) {
            throw new NotFoundError(`Users not found`);
          } else {
            throw new InternalServerError(`Failed to fetch data: ${response.statusText}`);
          }
        }

        const data: HTTPGetUsersResponse = await response.json();
        if (!data.users.length) {
          throw new NotFoundError(`Users not found`);
        }

        const userEntities = data.users.map(({ id, email, name }) => new User(id, email, name));
        result.push(...userEntities);

        totalPages = data.meta.number_of_pages;
        currentPage++;
      } while (currentPage <= totalPages);

      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

export class RedisUsersRepository implements IUsersRepository {
  private redisCache: RedisCache;
  constructor(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }
  async getUsers(): Promise<User[]> {
    try {
      await this.redisCache.connect();
      const cachedData = await this.redisCache.get("users");
      if (!cachedData) {
        return [];
      }
      const parsedData: User[] = JSON.parse(cachedData);
      return parsedData;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  async saveUsers(users: User[]) {
    await this.redisCache.connect();
    await this.redisCache.set("users", users);
    return;
  }
}

export class UsersRepository implements IUsersRepository {
  constructor(private httpUsersRepository: HTTPUsersRepository, private redisUsersRepository: RedisUsersRepository) {}

  async getUsers(): Promise<User[]> {
    try {
      const redisResponse: User[] = await this.redisUsersRepository.getUsers().catch((e) => {
        console.error(e);
        return [];
      });
      if (redisResponse.length) {
        return redisResponse;
      }
      const httpRepoResponse = await this.httpUsersRepository.getUsers();
      await this.redisUsersRepository.saveUsers(httpRepoResponse).catch((e) => {
        console.error(e);
      });
      return httpRepoResponse;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}
