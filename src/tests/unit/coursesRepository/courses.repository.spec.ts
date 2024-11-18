import Course from "../../../domain/course/course.entity";
import { CoursesRepository } from "../../../domain/course/repository/courses.repository";
import type { HTTPCoursesRepository } from "../../../domain/course/repository/httpCourses.repository";
import type { RedisCoursesRepository } from "../../../domain/course/repository/redisCourses.repository";
import { InternalServerError } from "../../../infra/errors/errorType.infra";
import logger from "../../../infra/logs/logger.infra";

jest.mock("../../../infra/logs/logger.infra");

describe("CoursesRepository", () => {
  let repository: CoursesRepository;
  let mockHttpRepository: jest.Mocked<HTTPCoursesRepository>;
  let mockRedisRepository: jest.Mocked<RedisCoursesRepository>;

  beforeEach(() => {
    mockHttpRepository = {
      getCourses: jest.fn(),
      fetchAllUsers: jest.fn(),
      fetchUserPage: jest.fn(),
      handleResponseError: jest.fn(),
      mapToUserEntities: jest.fn(),
    } as unknown as jest.Mocked<HTTPCoursesRepository>;

    mockRedisRepository = {
      getCourses: jest.fn(),
      saveCourses: jest.fn(),
      ensureConnection: jest.fn(),
    } as unknown as jest.Mocked<RedisCoursesRepository>;

    repository = new CoursesRepository(mockHttpRepository, mockRedisRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return cached courses if available", async () => {
    const cachedCourses = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA"), new Course(2, null, "Course 2", "To", false, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];

    mockRedisRepository.getCourses.mockResolvedValueOnce(cachedCourses);

    const courses = await repository.getCourses();

    expect(courses).toHaveLength(2);
    expect(courses[0]).toBeInstanceOf(Course);
    expect(courses[0].name).toBe("Course 1");
    expect(mockRedisRepository.getCourses).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getCourses).not.toHaveBeenCalled();
  });

  test("should fetch courses from HTTP if no cached courses are found", async () => {
    mockRedisRepository.getCourses.mockResolvedValueOnce([]);

    const mockResponse = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA"), new Course(2, null, "Course 2", "To", false, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];
    mockHttpRepository.getCourses.mockResolvedValueOnce(mockResponse);

    const courses = await repository.getCourses();

    expect(courses).toHaveLength(2);
    expect(courses[0]).toBeInstanceOf(Course);
    expect(courses[0].name).toBe("Course 1");
    expect(mockHttpRepository.getCourses).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.getCourses).toHaveBeenCalledTimes(1);
  });

  test("should throw InternalServerError for other non-2xx statuses", async () => {
    mockRedisRepository.getCourses.mockResolvedValueOnce([]);
    mockHttpRepository.getCourses.mockResolvedValueOnce(Promise.reject(new InternalServerError()));

    await expect(repository.getCourses()).rejects.toThrow(InternalServerError);
    expect(mockRedisRepository.getCourses).toHaveBeenCalledTimes(1);
    expect(mockHttpRepository.getCourses).toHaveBeenCalledTimes(1);
  });

  test("should handle errors when getting cached courses and still fetch from HTTP", async () => {
    mockRedisRepository.getCourses.mockRejectedValueOnce(new Error("Cache failure"));

    const mockResponse = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];
    mockHttpRepository.getCourses.mockResolvedValueOnce(mockResponse);

    const courses = await repository.getCourses();

    expect(courses).toHaveLength(1);
    expect(courses[0].name).toBe("Course 1");
    expect(logger.error).toHaveBeenCalledWith("Failed to get cached courses: Error: Cache failure");
    expect(mockHttpRepository.getCourses).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.getCourses).toHaveBeenCalledTimes(1);
    expect(mockRedisRepository.saveCourses).toHaveBeenCalledTimes(1);
  });

  test("should handle errors when saving courses to cache", async () => {
    mockRedisRepository.saveCourses.mockRejectedValueOnce(new Error("Cache saving failure"));

    mockRedisRepository.getCourses.mockResolvedValueOnce([]);
    mockHttpRepository.getCourses.mockResolvedValueOnce([new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")]);

    const courses = await repository.getCourses();

    expect(courses).toHaveLength(1);
    expect(logger.error).toHaveBeenCalledWith("Failed to cache courses: Error: Cache saving failure");
  });
});
