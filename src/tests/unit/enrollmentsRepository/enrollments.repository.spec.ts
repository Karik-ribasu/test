import Enrollment from "../../../domain/enrollment/enrollment.entity";
import { EnrollmentsRepository } from "../../../domain/enrollment/repository/enrollments.repository";
import type { HTTPEnrollmentsRepository } from "../../../domain/enrollment/repository/httpEnrollments.repository";
import type { RedisEnrollmentsRepository } from "../../../domain/enrollment/repository/redisEnrollments.repository";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../../infra/errors/errorType.infra";
import logger from "../../../infra/logs/logger.infra";

jest.mock("../../../infra/logs/logger.infra");

describe("EnrollmentsRepository", () => {
  let repository: EnrollmentsRepository;
  let mockHttpRepository: jest.Mocked<HTTPEnrollmentsRepository>;
  let mockRedisRepository: jest.Mocked<RedisEnrollmentsRepository>;

  beforeEach(() => {
    mockHttpRepository = {
      getEnrollmentsByCourseID: jest.fn(),
    } as unknown as jest.Mocked<HTTPEnrollmentsRepository>;

    mockRedisRepository = {
      getEnrollmentsByCourseID: jest.fn(),
      saveEnrollmentsByCourseID: jest.fn(),
    } as unknown as jest.Mocked<RedisEnrollmentsRepository>;

    repository = new EnrollmentsRepository(mockHttpRepository, mockRedisRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return cached enrollments if available", async () => {
    const cachedEnrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment( 2,  "2024-01-01",  null,  30,  "2024-12-31")];
    mockRedisRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(cachedEnrollments);

    const enrollments = await repository.getEnrollmentsByCourseID(1);

    expect(enrollments).toHaveLength(2);
    expect(enrollments[0].percent_complete).toBe(50);
    expect(enrollments[0].isCompleted()).toBe(false)
    expect(mockRedisRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getEnrollmentsByCourseID).not.toHaveBeenCalled();
  });

  test("should fetch enrollments from HTTP if no cached enrollments are found", async () => {
    mockRedisRepository.getEnrollmentsByCourseID.mockResolvedValueOnce([]);
    const httpEnrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment( 2,  "2024-01-01",  null,  30,  "2024-12-31")];
    mockHttpRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(httpEnrollments);

    const enrollments = await repository.getEnrollmentsByCourseID(1);

    expect(enrollments).toHaveLength(2);
    expect(enrollments[0].percent_complete).toBe(50);
    expect(enrollments[0].isCompleted()).toBe(false)
    expect(mockRedisRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.saveEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
  });

  test("should handle errors when fetching cached enrollments and continue with HTTP fetch", async () => {
    mockRedisRepository.getEnrollmentsByCourseID.mockRejectedValueOnce(new Error("Cache failure"));
    const httpEnrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment( 2,  "2024-01-01",  null,  30,  "2024-12-31")];
    mockHttpRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(httpEnrollments);

    const enrollments = await repository.getEnrollmentsByCourseID(1);

    expect(enrollments).toHaveLength(2);
    expect(enrollments[0].percent_complete).toBe(50);
    expect(logger.error).toHaveBeenCalledWith("Failed to get cached enrollments: Error: Cache failure");
    expect(mockHttpRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.saveEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
  });

  test("should log errors when caching enrollments fails", async () => {
    mockRedisRepository.getEnrollmentsByCourseID.mockResolvedValueOnce([]);
    mockRedisRepository.saveEnrollmentsByCourseID.mockRejectedValueOnce(new Error("Cache save failure"));
    const httpEnrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment( 2,  "2024-01-01",  null,  30,  "2024-12-31")];
    mockHttpRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(httpEnrollments);

    const enrollments = await repository.getEnrollmentsByCourseID(1);

    expect(enrollments).toHaveLength(2);
    expect(logger.error).toHaveBeenCalledWith("Failed to cache enrollments: Error: Cache save failure");
  });

  test("should throw NotFoundError if API returns 404", async () => {
    mockRedisRepository.getEnrollmentsByCourseID.mockResolvedValueOnce([]);
    mockHttpRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(Promise.reject(new NotFoundError()));

    await expect(repository.getEnrollmentsByCourseID(1)).rejects.toThrow(NotFoundError);
    expect(mockRedisRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
  });

  test("should throw InternalServerError for other non-2xx statuses", async () => {
    mockRedisRepository.getEnrollmentsByCourseID.mockResolvedValueOnce([]);
    mockHttpRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(Promise.reject(new InternalServerError()));

    await expect(repository.getEnrollmentsByCourseID(1)).rejects.toThrow(InternalServerError);
    expect(mockRedisRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
  });
});
