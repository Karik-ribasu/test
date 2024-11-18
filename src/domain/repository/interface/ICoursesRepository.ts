import type { Course } from "../../entity/course.entity";

export interface ICoursesRepository {
  getCourses(): Promise<Course[]>
}