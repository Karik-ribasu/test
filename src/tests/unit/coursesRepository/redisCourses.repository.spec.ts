import Course from "../../../domain/course/course.entity";
import { RedisCoursesRepository } from "../../../domain/course/repository/redisCourses.repository";
import logger from "../../../infra/logs/logger.infra";

jest.mock("../../../infra/logs/logger.infra");

describe("RedisCoursesRepository", () => {
  let mockRedisCache: any;
  let repository: RedisCoursesRepository;

  beforeEach(() => {
    mockRedisCache = {
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    repository = new RedisCoursesRepository(mockRedisCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return courses from cache when available", async () => {
    const mockCourses = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA"), new Course(2, null, "Course 2", "To", false, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];

    mockRedisCache.get.mockResolvedValue(JSON.stringify(mockCourses));

    const courses = await repository.getCourses();

    expect(courses).toHaveLength(2);
    expect(courses[0]).toBeInstanceOf(Course);
    expect(courses[0].name).toBe("Course 1");
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith("courses");
  });

  test("should return an empty array when no cached courses are found", async () => {
    mockRedisCache.get.mockResolvedValue(null);

    const result = await repository.getCourses();

    expect(result).toEqual([]);
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith("courses");
  });

  test("should save courses to the cache", async () => {
    const courses = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA"), new Course(2, null, "Course 2", "To", false, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];

    await repository.saveCourses(courses);

    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.set).toHaveBeenCalledWith("courses", courses);
  });

  test("should handle parsing errors and log an error", async () => {
    mockRedisCache.get.mockResolvedValue("invalid-json");

    const result = await repository.getCourses();

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to parse cached courses data"));
    expect(mockRedisCache.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisCache.get).toHaveBeenCalledWith("courses");
  });
});
