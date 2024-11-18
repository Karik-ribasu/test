import type RedisCache from "../../../infra/cache/redis.infra";
import type { IEnrollmentsRepository } from "../IEnrollmentsRepository";
import Enrollment from "../enrollment.entity";
import logger from "../../../infra/logs/logger.infra";

type EnrollmentDTO = {
  user_id: number;
  enrolled_at: string;
  completed_at: null | string;
  percent_complete: number;
  expires_at: null | string;
};

export class RedisEnrollmentsRepository implements IEnrollmentsRepository {
  private readonly redisCache: RedisCache;

  constructor(redisCache: RedisCache) {
    this.redisCache = redisCache;
  }

  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    await this.ensureConnection();
    const cachedData = await this.redisCache.get(`enrollments-${courseID}`);
    return cachedData ? this.parseEnrollments(cachedData) : [];
  }

  async saveEnrollmentsByCourseID(courseID: number, enrollments: Enrollment[]): Promise<void> {
    await this.ensureConnection();
    await this.redisCache.set(`enrollments-${courseID}`, enrollments);
  }

  private async ensureConnection(): Promise<void> {
    await this.redisCache.connect();
  }

  private parseEnrollments(data: string): Enrollment[] {
    try {
      const parsedData: EnrollmentDTO[] = JSON.parse(data);
      const enrollments: Enrollment[] = parsedData.map((enrollmentDTO: EnrollmentDTO) => {
        return new Enrollment(enrollmentDTO.user_id, enrollmentDTO.enrolled_at, enrollmentDTO.completed_at, enrollmentDTO.percent_complete, enrollmentDTO.expires_at);
      });
      return enrollments;
    } catch (error) {
      logger.error(`Failed to parse cached enrollments data: ${error}`);
      return [];
    }
  }
}
