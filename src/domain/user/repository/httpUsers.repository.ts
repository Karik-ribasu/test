import type { IUsersRepository } from "../IUsersRepository";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../../infra/errors/errorType.infra";
import User from "../user.entity";

type UserDTO = {
  email: string;
  name: string;
  id: number;
};

type Pagination = {
  page: number;
  total: number;
  number_of_pages: number;
  from: number;
  to: number;
  per_page: number;
};

type HTTPGetUsersResponse = {
  users: UserDTO[];
  meta: Pagination;
};

export class HTTPUsersRepository implements IUsersRepository {
  async getUsers(): Promise<User[]> {
    try {
      return await this.fetchAllUsers();
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  private async fetchAllUsers(): Promise<User[]> {
    const users: User[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const data = await this.fetchUserPage(currentPage);

      users.push(...this.mapToUserEntities(data.users));
      totalPages = data.meta.number_of_pages;
      currentPage++;
    } while (currentPage <= totalPages);

    return users;
  }

  private async fetchUserPage(page: number): Promise<HTTPGetUsersResponse> {
    const url = `${process.env.TEACHABLE_API_BASE_URL}/v1/users?page=${page}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apiKey: process.env.TEACHABLE_API_KEY as string,
      },
    });

    if (!response.ok) {
      this.handleResponseError(response);
    }

    return await response.json();
  }

  private handleResponseError(response: Response): never {
    if (response.status === 404) {
      throw new NotFoundError("Users not found");
    }
    throw new InternalServerError(`Failed to fetch data: ${response.statusText}`);
  }

  private mapToUserEntities(users: UserDTO[]): User[] {
    return users.map(({ id, email, name }) => new User(id, email, name));
  }
}