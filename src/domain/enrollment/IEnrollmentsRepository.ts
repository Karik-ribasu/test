import type Enrollment from "./enrollment.entity";

export interface IEnrollmentsRepository {
  getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]>;
}
