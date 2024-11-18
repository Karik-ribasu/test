import type { ICoursesRepository } from "./ICoursesRepository";
import Course from "./course.entity";
import { InternalServerError, NotFoundError } from "../../infra/errors/errorType.infra";
import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import type RedisCache from "../../infra/cache/redis.infra";

export type HTTPGetCoursesResponse = {
  courses: {
    id: number;
    description: null | string;
    name: string;
    heading: string;
    is_published: boolean;
    image_url: string;
  }[];
  meta: {
    page: number;
    total: number;
    number_of_pages: number;
    from: number;
    to: number;
    per_page: number;
  };
};

export class HTTPCoursesRepository implements ICoursesRepository {
  async getCourses(): Promise<Course[]> {
    try {
      let result: Course[] = [];
      let currentPage: number = 1;
      let totalPages: number = 1;

      do {
        const response = await fetch(`${process.env.TEACHABLE_API_BASE_URL}/v1/courses?page=${currentPage}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            apiKey: process.env.TEACHABLE_API_KEY as string,
          },
        });

        if (!response.ok) {
          // Handle specific errors based on the status code
          if (response.status === 404) {
            throw new NotFoundError(`Courses resource not found`);
          } else {
            throw new InternalServerError(`Failed to fetch data: ${response.statusText}`);
          }
        }

        const data: HTTPGetCoursesResponse = await response.json();
        if (!data.courses.length) {
          throw new NotFoundError(`Courses resource not found`);
        }
        const courseEntities = data.courses.map(({ id, description, name, heading, is_published, image_url }) => new Course(id, description, name, heading, is_published, image_url));
        result.push(...courseEntities);

        totalPages = data.meta.number_of_pages;
        currentPage++;
      } while (currentPage <= totalPages);

      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

export class RedisCoursesRepository implements ICoursesRepository {
  private redisCache: RedisCache;
  constructor(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }
  async getCourses(): Promise<Course[]> {
    await this.redisCache.connect();
    const cachedData = await this.redisCache.get("courses");
    if (!cachedData) {
      return [];
    }
    const parsedData: Course[] = JSON.parse(cachedData).data.courses.map(({ id, description, name, heading, is_published, image_url }) => new Course(id, description, name, heading, is_published, image_url));
    return parsedData;
  }

  async saveCourses(courses: Course[]) {
    await this.redisCache.connect();
    const coursesData = courses.map((course) => ({ id: course.id, description: course.description, name: course.name, heading: course.heading, is_published: course.is_published, image_url: course.image_url }));
    await this.redisCache.set("courses", coursesData);
    return;
  }
}

export class CoursesRepository implements ICoursesRepository {
  constructor(private httpCoursesRepository: HTTPCoursesRepository, private redisCoursesRepository: RedisCoursesRepository) {}

  async getCourses(): Promise<Course[]> {
    try {
      const redisResponse: Course[] = await this.redisCoursesRepository.getCourses().catch((e) => {
        console.error(e);
        return [];
      });
      if (redisResponse.length) {
        return redisResponse;
      }
      const httpRepoResponse = await this.httpCoursesRepository.getCourses();
      await this.redisCoursesRepository.saveCourses(httpRepoResponse).catch((e) => {
        console.error(e);
      });
      return httpRepoResponse;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}
