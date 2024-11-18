import type { ICoursesRepository } from "./interface/ICoursesRepository";
import type { HTTPGetCoursesResponse } from "../vo/course";
import Course from "../entity/course.entity";
import { InternalServerError, NotFoundError } from "../../infra/errors/errorType.infra";
import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import redisClient from "../../infra/cache/redis.infra";
import type { RedisClientType } from "redis";

class HTTPCoursesRepository implements ICoursesRepository {
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

class RedisCoursesRepository implements ICoursesRepository {
  // readonly redisClient: RedisClientType;
  // constructor(redisClient: RedisClientType) {
  //   this.redisClient = redisClient;
  // }
  async getCourses(): Promise<Course[]> {
    //   try {
    //     const cachedData = await this.redisClient.get("courses");
    //     if (!cachedData) {
    //       return [];
    //     }
    //     const parsedData: Course[] = JSON.parse(cachedData);
    //     return parsedData;
    //   } catch (error) {
    //     throw ErrorHandler.getError(error as Error);
    //   }
    return [];
  }

  async setCourses(courses: Course[]) {
    // await this.redisClient.set("courses", JSON.stringify(courses));
    return
  }
}

class CoursesRepository implements ICoursesRepository {
  constructor(private httpCoursesRepository: HTTPCoursesRepository, private redisCoursesRepository: RedisCoursesRepository) {}

  async getCourses(): Promise<Course[]> {
    try {
      const redisRepoResponse = await this.redisCoursesRepository.getCourses().catch((e) => {
        console.error(e);
        return [] as Course[];
      });
      if (!redisRepoResponse.length) {
        const httpRepoResponse = await this.httpCoursesRepository.getCourses();
        redisCoursesRepository.setCourses(httpRepoResponse);
        return httpRepoResponse;
      }
      return redisRepoResponse;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

const httpCoursesRepository = new HTTPCoursesRepository();
const redisCoursesRepository = new RedisCoursesRepository();
const coursesRepository = new CoursesRepository(httpCoursesRepository, redisCoursesRepository);

export type { CoursesRepository };
export default coursesRepository;
