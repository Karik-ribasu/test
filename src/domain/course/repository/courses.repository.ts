import type { ICoursesRepository } from "../ICoursesRepository";
import Course from "../course.entity";
import logger from "../../../infra/logs/logger.infra";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import type { HTTPCoursesRepository } from "./httpCourses.repository";
import type { RedisCoursesRepository } from "./redisCourses.repository";

export class CoursesRepository implements ICoursesRepository {
  private readonly httpCoursesRepository: HTTPCoursesRepository;
  private readonly redisCoursesRepository: RedisCoursesRepository;

  constructor(httpCoursesRepository: HTTPCoursesRepository, redisCoursesRepository: RedisCoursesRepository) {
    this.httpCoursesRepository = httpCoursesRepository;
    this.redisCoursesRepository = redisCoursesRepository;
  }

  public async getCourses(): Promise<Course[]> {
    try {
      const cachedCourses = await this.getCachedCourses();
      if (cachedCourses.length) {
        return cachedCourses;
      }

      const courses = await this.httpCoursesRepository.getCourses();
      await this.cacheCourses(courses);
      return courses;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  private async getCachedCourses(): Promise<Course[]> {
    try {
      return await this.redisCoursesRepository.getCourses();
    } catch (error) {
      logger.error(`Failed to get cached courses: ${error}`);
      return [];
    }
  }

  private async cacheCourses(courses: Course[]): Promise<void> {
    try {
      await this.redisCoursesRepository.saveCourses(courses);
    } catch (error) {
      logger.error(`Failed to cache courses: ${error}`);
    }
  }
}
