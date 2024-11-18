import type { User } from "../../entity/user.entity";

export interface IUsersRepository {
  getUsers(): Promise<User[]>;
}
