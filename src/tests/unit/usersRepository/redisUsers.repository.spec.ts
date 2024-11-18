import { RedisUsersRepository } from "../../../domain/user/repository/redisUsers.repository";
import User from "../../../domain/user/user.entity";
import logger from "../../../infra/logs/logger.infra";

jest.mock("../../../infra/logs/logger.infra");

describe("RedisUsersRepository", () => {
  let mockRedisCache: any;
  let repository: RedisUsersRepository;

  beforeEach(() => {
    mockRedisCache = {
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    repository = new RedisUsersRepository(mockRedisCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return users from cache when available", async () => {
    const mockUsers = [
      new User(1, "user1@example.com", "User One"),
      new User(2, "user2@example.com", "User Two"),
    ];

    mockRedisCache.get.mockResolvedValue(JSON.stringify(mockUsers));

    const result = await repository.getUsers();

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(User);
    expect(result[0].email).toBe("user1@example.com");
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith("users");
  });

  test("should return an empty array when no cached users are found", async () => {
    mockRedisCache.get.mockResolvedValue(null);

    const result = await repository.getUsers();

    expect(result).toEqual([]);
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith("users");
  });

  test("should save users to the cache", async () => {
    const users = [
      new User(1, "user1@example.com", "User One"),
      new User(2, "user2@example.com", "User Two"),
    ];

    await repository.saveUsers(users);

    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.set).toHaveBeenCalledWith("users", users);
  });

  test("should handle parsing errors and log an error", async () => {
    mockRedisCache.get.mockResolvedValue("invalid-json");

    const result = await repository.getUsers();

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to parse cached users data"));
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith("users");
  });
});
