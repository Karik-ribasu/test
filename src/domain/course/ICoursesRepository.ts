import type Course from "./course.entity";

export interface ICoursesRepository {
  getCourses(): Promise<Course[]>;
}
