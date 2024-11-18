import Enrollment from "../../../domain/enrollment/enrollment.entity";
import { RedisEnrollmentsRepository } from "../../../domain/enrollment/repository/redisEnrollments.repository";
import logger from "../../../infra/logs/logger.infra";

jest.mock("../../../infra/logs/logger.infra");

describe("RedisEnrollmentsRepository", () => {
  let mockRedisCache: any;
  let repository: RedisEnrollmentsRepository;

  beforeEach(() => {
    mockRedisCache = {
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    repository = new RedisEnrollmentsRepository(mockRedisCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return enrollments from cache when available", async () => {
    const mockUsers = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment( 2,  "2024-01-01",  null,  30,  "2024-12-31")];

    mockRedisCache.get.mockResolvedValue(JSON.stringify(mockUsers));

    const result = await repository.getEnrollmentsByCourseID(1);

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(Enrollment);
    expect(result[0].percent_complete).toBe(50);
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith(`enrollments-1`);
  });

  test("should return an empty array when no cached enrollments are found", async () => {
    mockRedisCache.get.mockResolvedValue(null);

    const result = await repository.getEnrollmentsByCourseID(1);

    expect(result).toEqual([]);
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith('enrollments-1');
  });

  test("should save enrollments to the cache", async () => {
    const enrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment( 2,  "2024-01-01",  null,  30,  "2024-12-31")];

    await repository.saveEnrollmentsByCourseID(1, enrollments);

    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.set).toHaveBeenCalledWith('enrollments-1', enrollments);
  });

  test("should handle parsing errors and log an error", async () => {
    mockRedisCache.get.mockResolvedValue("invalid-json");

    const result = await repository.getEnrollmentsByCourseID(1);

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to parse cached enrollments data"));
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith('enrollments-1');
  });
});
