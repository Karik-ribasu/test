import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import { CourseWithEnrollment } from "./getPublishedCourses.dto";
import type { ICoursesRepository } from "../../../domain/course/ICoursesRepository";
import type { IUsersRepository } from "../../../domain/user/IUsersRepository";
import type { IEnrollmentsRepository } from "../../../domain/enrollment/IEnrollmentsRepository";
import type Course from "../../../domain/course/course.entity";
import type User from "../../../domain/user/user.entity";
import type Enrollment from "../../../domain/enrollment/enrollment.entity";

export class GetPublishedCoursesService {
  constructor(private coursesRepository: ICoursesRepository, private usersRepository: IUsersRepository, private enrollmentsRepository: IEnrollmentsRepository) {}

  async execute() {
    try {
      let result: CourseWithEnrollment[] = [];
      // fetch courses data
      const courses: Course[] = await this.coursesRepository.getCourses();
      const publishedCourses = courses.filter((course) => course.isPublished());

      // fetch user data and create a map to optimize performance
      const users: User[] = await this.usersRepository.getUsers();
      const userDataByID: { [id: number]: { name: string; email: string } } = {};
      users.map((user) => {
        const { id, ...userData } = user;
        userDataByID[id] = userData;
      });

      // loop through courses fetching enrollments data
      for (const course of publishedCourses) {
        const enrollments: Enrollment[] = await this.enrollmentsRepository.getEnrollmentsByCourseID(course.id);

        const parsedEnrollments = enrollments.map((enrollment) => {
          const userID = enrollment["user_id"];
          return {
            name: userDataByID[userID].name,
            email: userDataByID[userID].email,
          };
        });

        result.push({
          course_name: course.name,
          course_heading: course.heading,
          enrollments: parsedEnrollments,
        });
      }

      return result;
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }
}
