import type { IUsersRepository } from "./interface/IUsersRepository";
import type { HTTPGetUsersResponse } from "../vo/user";
import User from "../entity/user.entity";
import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../infra/errors/errorType.infra";

class HTTPUsersRepository implements IUsersRepository {
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
        if (data.users.length) {
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

class RedisUsersRepository implements IUsersRepository {
  async getUsers(): Promise<User[]> {
    try {
      let result: User[] = [];
      // ... implementation
      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

class UsersRepository implements IUsersRepository {
  constructor(private httpUsersRepository: HTTPUsersRepository, private redisUsersRepository: RedisUsersRepository) {}

  async getUsers(): Promise<User[]> {
    try {
      const result: User[] = await this.redisUsersRepository.getUsers();
      if (!result.length) {
        result.push(...(await this.httpUsersRepository.getUsers()));
      }
      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

const httpUsersRepository = new HTTPUsersRepository();
const redisUsersRepository = new RedisUsersRepository();
const userRepository = new UsersRepository(httpUsersRepository, redisUsersRepository);

export type { UsersRepository };
export default userRepository;
