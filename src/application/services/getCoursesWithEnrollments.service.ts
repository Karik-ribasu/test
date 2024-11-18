import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
// repositories
import coursesRepository, { type CoursesRepository } from "../../domain/repository/courses.repository";
import enrollmentsRepository, { type EnrollmentsRepository } from "../../domain/repository/enrollments.repository";
import userRepository, { type UsersRepository } from "../../domain/repository/users.repository";
//entities
import Course from "../../domain/entity/course.entity";
import User from "../../domain/entity/user.entity";
import Enrollment from "../../domain/entity/enrollment.entity";
// dto
import type { CourseWithEnrollment } from "../dto/courseWithEnrollments.dto";

class GetPublishedCoursesWithEnrollments {
  constructor(private coursesRepository: CoursesRepository, private usersRepository: UsersRepository, private enrollmentsRepository: EnrollmentsRepository) {}

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
      for (const course of courses) {
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

const getPublishedCoursesWithEnrollments = new GetPublishedCoursesWithEnrollments(coursesRepository, userRepository, enrollmentsRepository);

export type { GetPublishedCoursesWithEnrollments };
export default getPublishedCoursesWithEnrollments;
