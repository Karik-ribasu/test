import type { Enrollment } from "../../entity/enrollment.entity";

export interface IEnrollmentsRepository {
  getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]>;
}
