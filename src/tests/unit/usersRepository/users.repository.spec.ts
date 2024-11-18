import { UsersRepository } from "../../../domain/user/repository/users.repository";
import { HTTPUsersRepository } from "../../../domain/user/repository/httpUsers.repository";
import { RedisUsersRepository } from "../../../domain/user/repository/redisUsers.repository";
import { InternalServerError, NotFoundError } from "../../../infra/errors/errorType.infra";
import logger from "../../../infra/logs/logger.infra";
import User from "../../../domain/user/user.entity";

jest.mock("../../../infra/logs/logger.infra", () => ({
  error: jest.fn(),
}));

describe("UsersRepository", () => {
  let repository: UsersRepository;
  let mockHttpRepository: jest.Mocked<HTTPUsersRepository>;
  let mockRedisRepository: jest.Mocked<RedisUsersRepository>;

  beforeEach(() => {
    mockHttpRepository = {
      getUsers: jest.fn(),
      fetchAllUsers: jest.fn(),
      fetchUserPage: jest.fn(),
      handleResponseError: jest.fn(),
      mapToUserEntities: jest.fn(),
    } as unknown as jest.Mocked<HTTPUsersRepository>;

    mockRedisRepository = {
      getUsers: jest.fn(),
      saveUsers: jest.fn(),
      ensureConnection: jest.fn(),
    } as unknown as jest.Mocked<RedisUsersRepository>;

    repository = new UsersRepository(mockHttpRepository, mockRedisRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return cached users if available", async () => {
    const cachedUsers = [new User(1, "user1@example.com", "User One"), new User(2, "user2@example.com", "User Two")];

    mockRedisRepository.getUsers.mockResolvedValueOnce(cachedUsers);

    const users = await repository.getUsers();

    expect(users).toHaveLength(2);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0].email).toBe("user1@example.com");
    expect(mockRedisRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getUsers).not.toHaveBeenCalled();
  });

  test("should fetch users from HTTP if no cached users are found", async () => {
    mockRedisRepository.getUsers.mockResolvedValueOnce([]);

    const mockResponse = [new User(1, "user1@example.com", "User One"), new User(2, "user2@example.com", "User Two")];
    mockHttpRepository.getUsers.mockResolvedValueOnce(mockResponse);

    const users = await repository.getUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe("user1@example.com");
    expect(mockRedisRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.saveUsers).toHaveBeenCalledTimes(1);
  });

  test("should throw NotFoundError if API returns 404", async () => {
    mockRedisRepository.getUsers.mockResolvedValueOnce([]);
    mockHttpRepository.getUsers.mockResolvedValueOnce(Promise.reject(new NotFoundError("Not Found")));

    await expect(repository.getUsers()).rejects.toThrow(NotFoundError);
    expect(mockRedisRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getUsers).toHaveBeenCalledTimes(1);
  });

  test("should throw InternalServerError for other non-2xx statuses", async () => {
    mockRedisRepository.getUsers.mockResolvedValueOnce([]);
    mockHttpRepository.getUsers.mockResolvedValueOnce(Promise.reject(new InternalServerError()));

    await expect(repository.getUsers()).rejects.toThrow(InternalServerError);
    expect(mockRedisRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getUsers).toHaveBeenCalledTimes(1);
  });

  test("should handle errors when getting cached users and still fetch from HTTP", async () => {
    mockRedisRepository.getUsers.mockRejectedValueOnce(new Error("Cache failure"));

    const mockResponse = [new User(1, "user1@example.com", "User One")];
    mockHttpRepository.getUsers.mockResolvedValueOnce(mockResponse);

    const users = await repository.getUsers();

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("user1@example.com");

    expect(logger.error).toHaveBeenCalledWith("Failed to get cached users: Error: Cache failure");
    expect(mockHttpRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.saveUsers).toHaveBeenCalledTimes(1);
  });

  test("should handle errors when saving users to cache", async () => {
    mockRedisRepository.saveUsers.mockRejectedValueOnce(new Error("Cache saving failure"));

    mockRedisRepository.getUsers.mockResolvedValueOnce([]);
    mockHttpRepository.getUsers.mockResolvedValueOnce([new User(1, "user1@example.com", "User One")]);

    const users = await repository.getUsers();

    expect(users).toHaveLength(1);
    expect(logger.error).toHaveBeenCalledWith("Failed to cache users: Error: Cache saving failure");
  });
});
