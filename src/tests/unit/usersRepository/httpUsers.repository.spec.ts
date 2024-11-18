import { HTTPUsersRepository } from "../../../domain/user/repository/httpUsers.repository";
import User from "../../../domain/user/user.entity";
import { InternalServerError, NotFoundError } from "../../../infra/errors/errorType.infra";

describe("HTTPUsersRepository", () => {
  let repository: HTTPUsersRepository;
  let mockFetch: jest.Mock;

  beforeAll(() => {
    repository = new HTTPUsersRepository();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch all users successfully", async () => {
    const mockResponsePage1 = {
      users: [
        { id: 1, email: "user1@example.com", name: "User One" },
        { id: 2, email: "user2@example.com", name: "User Two" },
      ],
      meta: { number_of_pages: 2, page: 1, total: 4, per_page: 2, from: 1, to: 2 },
    };

    const mockResponsePage2 = {
      users: [
        { id: 3, email: "user3@example.com", name: "User Three" },
        { id: 4, email: "user4@example.com", name: "User Four" },
      ],
      meta: { number_of_pages: 2, page: 2, total: 4, per_page: 2, from: 3, to: 4 },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponsePage1),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponsePage2),
    });

    const users = await repository.getUsers();

    expect(users).toHaveLength(4);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0].email).toBe("user1@example.com");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test("should throw NotFoundError if API returns 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(repository.getUsers()).rejects.toThrow(NotFoundError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("should throw InternalServerError for other non-2xx statuses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(repository.getUsers()).rejects.toThrow(InternalServerError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
