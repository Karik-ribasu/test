import type { ICoursesRepository } from "../ICoursesRepository";
import Course from "../course.entity";
import type RedisCache from "../../../infra/cache/redis.infra";
import logger from "../../../infra/logs/logger.infra";

type CourseDTO = {
  id: number;
  description: null | string;
  name: string;
  heading: string;
  is_published: boolean;
  image_url: string;
};

export class RedisCoursesRepository implements ICoursesRepository {
  private readonly redisCache: RedisCache;

  constructor(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  async getCourses(): Promise<Course[]> {
    await this.ensureConnection();
    const cachedData = await this.redisCache.get("courses");
    return cachedData ? this.parseCourses(cachedData) : [];
  }

  async saveCourses(courses: Course[]): Promise<void> {
    await this.ensureConnection();
    await this.redisCache.set("courses", courses);
  }

  private async ensureConnection(): Promise<void> {
    await this.redisCache.connect();
  }

  private parseCourses(data: string): Course[] {
    try {
      const parsedData: CourseDTO[] = JSON.parse(data);
      const courses: Course[] = parsedData.map((courseDTO: CourseDTO) => {
        return new Course(courseDTO.id, courseDTO.description, courseDTO.name, courseDTO.heading, courseDTO.is_published, courseDTO.image_url);
      });
      return courses;
    } catch (error) {
      logger.error(`Failed to parse cached courses data: ${error}`);
      return [];
    }
  }
}
