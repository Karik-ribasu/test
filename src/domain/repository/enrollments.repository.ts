import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../infra/errors/errorType.infra";
import Enrollment from "../entity/enrollment.entity";
import type { HTTPGetEnrollmentsByCourseIDResponse } from "../vo/enrollment";
import type { IEnrollmentsRepository } from "./interface/IEnrollmentsRepository";

class HTTPEnrollmentsRepository implements IEnrollmentsRepository {
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
        if (data.enrollments.length) {
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

class RedisEnrollmentsRepository implements IEnrollmentsRepository {
  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    try {
      let result: Enrollment[] = [];
      // ... implementation
      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

class EnrollmentsRepository implements IEnrollmentsRepository {
  constructor(private httpEnrollmentsRepository: HTTPEnrollmentsRepository, private redisEnrollmentsRepository: RedisEnrollmentsRepository) {}

  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    try {
      const result: Enrollment[] = await this.redisEnrollmentsRepository.getEnrollmentsByCourseID(courseID);
      if (!result.length) {
        result.push(...(await this.httpEnrollmentsRepository.getEnrollmentsByCourseID(courseID)));
      }
      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}

const httpEnrollmentsRepository = new HTTPEnrollmentsRepository();
const redisEnrollmentsRepository = new RedisEnrollmentsRepository();
const enrollmentsRepository = new EnrollmentsRepository(httpEnrollmentsRepository, redisEnrollmentsRepository);

export type { EnrollmentsRepository };
export default enrollmentsRepository;
