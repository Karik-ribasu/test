import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../infra/errors/errorType.infra";
import type RedisCache from "../../infra/cache/redis.infra";
import type { IEnrollmentsRepository } from "./IEnrollmentsRepository";
import Enrollment from "./enrollment.entity";

type HTTPGetEnrollmentsByCourseIDResponse = {
  enrollments: {
    user_id: number;
    enrolled_at: string;
    completed_at: null | string;
    percent_complete: number;
    expires_at: null | string;
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

export class HTTPEnrollmentsRepository implements IEnrollmentsRepository {
  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    try {
      let result: Enrollment[] = [];
      let currentPage: number = 1;
      let totalPages: number = 1;

      do {
        const response = await fetch(`${process.env.TEACHABLE_API_BASE_URL}/v1/courses/${courseID}/enrollments?page=${currentPage}`, {
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
            throw new NotFoundError(`Enrollments not found`);
          } else {
            throw new InternalServerError(`Failed to fetch data: ${response.statusText}`);
          }
        }

        const data: HTTPGetEnrollmentsByCourseIDResponse = await response.json();
        if (!data.enrollments.length) {
          throw new NotFoundError(`Enrollments not found`);
        }

        const enrollments = data.enrollments.map(({ user_id, enrolled_at, completed_at, percent_complete, expires_at }) => new Enrollment(user_id, enrolled_at, completed_at, percent_complete, expires_at));
        result.push(...enrollments);

        totalPages = data.meta.number_of_pages;
        currentPage++;
      } while (currentPage <= totalPages);

      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

export class RedisEnrollmentsRepository implements IEnrollmentsRepository {
  private redisCache: RedisCache;
  constructor(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }
  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    await this.redisCache.connect();
    const cachedData = await this.redisCache.get(`enrollments-${courseID}`);
    if (!cachedData) {
      return [];
    }
    const parsedData: Enrollment[] = JSON.parse(cachedData);
    return parsedData;
  }

  async saveEnrollmentsByCourseID(courseID: number, Enrollment) {
    await this.redisCache.connect();
    await this.redisCache.set("enrollments", { [`enrollments-${courseID}`]: Enrollment });
    return;
  }
}

export class EnrollmentsRepository implements IEnrollmentsRepository {
  constructor(private httpEnrollmentsRepository: HTTPEnrollmentsRepository, private redisEnrollmentsRepository: RedisEnrollmentsRepository) {}

  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    try {
      const redisResponse: Enrollment[] = await this.redisEnrollmentsRepository.getEnrollmentsByCourseID(courseID).catch((e) => {
        console.error(e);
        return [];
      });
      if (redisResponse.length) {
        return redisResponse;
      }
      const httpRepoResponse = await this.httpEnrollmentsRepository.getEnrollmentsByCourseID(courseID);
      await this.redisEnrollmentsRepository.saveEnrollmentsByCourseID(courseID, httpRepoResponse).catch((e) => {
        console.error(e);
      });
      return httpRepoResponse;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}
