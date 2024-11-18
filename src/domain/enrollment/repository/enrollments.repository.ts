import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import type { IEnrollmentsRepository } from "../IEnrollmentsRepository";
import Enrollment from "../enrollment.entity";
import logger from "../../../infra/logs/logger.infra";
import type { HTTPEnrollmentsRepository } from "./httpEnrollments.repository";
import type { RedisEnrollmentsRepository } from "./redisEnrollments.repository";

export class EnrollmentsRepository implements IEnrollmentsRepository {
  private readonly httpEnrollmentsRepository: HTTPEnrollmentsRepository;
  private readonly redisEnrollmentsRepository: RedisEnrollmentsRepository;

  constructor(httpEnrollmentsRepository: HTTPEnrollmentsRepository, redisEnrollmentsRepository: RedisEnrollmentsRepository) {
    this.httpEnrollmentsRepository = httpEnrollmentsRepository;
    this.redisEnrollmentsRepository = redisEnrollmentsRepository;
  }

  public async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    try {
      const cachedEnrollments = await this.getCachedEnrollments(courseID);
      if (cachedEnrollments.length) {
        return cachedEnrollments;
      }

      const enrollments = await this.httpEnrollmentsRepository.getEnrollmentsByCourseID(courseID);
      await this.cacheEnrollments(courseID, enrollments);
      return enrollments;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  private async getCachedEnrollments(courseID: number): Promise<Enrollment[]> {
    try {
      return await this.redisEnrollmentsRepository.getEnrollmentsByCourseID(courseID);
    } catch (error) {
      logger.error(`Failed to get cached enrollments: ${error}`);
      return [];
    }
  }

  private async cacheEnrollments(courseID: number, enrollments: Enrollment[]): Promise<void> {
    try {
      await this.redisEnrollmentsRepository.saveEnrollmentsByCourseID(courseID, enrollments);
    } catch (error) {
      logger.error(`Failed to cache enrollments: ${error}`);
    }
  }
}
