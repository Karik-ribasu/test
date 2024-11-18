import type { MetaPagination } from "./pagination";

export type HTTPGetUsersResponse = {
  users: {
    email: string;
    name: string;
    id: number;
  }[];
  meta: MetaPagination;
};
