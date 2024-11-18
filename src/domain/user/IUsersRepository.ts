import type User from "./user.entity";

export interface IUsersRepository {
  getUsers(): Promise<User[]>;
}
