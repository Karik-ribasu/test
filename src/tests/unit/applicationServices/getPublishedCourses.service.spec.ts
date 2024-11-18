import { GetPublishedCoursesService } from "../../../application/services/getPublishedCourses.service/getPublishedCourses.service";
import type { ICoursesRepository } from "../../../domain/course/ICoursesRepository";
import type { IUsersRepository } from "../../../domain/user/IUsersRepository";
import type { IEnrollmentsRepository } from "../../../domain/enrollment/IEnrollmentsRepository";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import Course from "../../../domain/course/course.entity";
import User from "../../../domain/user/user.entity";
import Enrollment from "../../../domain/enrollment/enrollment.entity";

// Mock dependencies
jest.mock("../../../infra/errors/errorHandler.infra");

describe("GetPublishedCoursesService", () => {
  let service: GetPublishedCoursesService;
  let mockCoursesRepository: jest.Mocked<ICoursesRepository>;
  let mockUsersRepository: jest.Mocked<IUsersRepository>;
  let mockEnrollmentsRepository: jest.Mocked<IEnrollmentsRepository>;

  beforeEach(() => {
    mockCoursesRepository = {
      getCourses: jest.fn(),
    } as jest.Mocked<ICoursesRepository>;

    mockUsersRepository = {
      getUsers: jest.fn(),
    } as jest.Mocked<IUsersRepository>;

    mockEnrollmentsRepository = {
      getEnrollmentsByCourseID: jest.fn(),
    } as jest.Mocked<IEnrollmentsRepository>;

    service = new GetPublishedCoursesService(mockCoursesRepository, mockUsersRepository, mockEnrollmentsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return courses with enrollments and user details", async () => {
    const courses = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];
    const users = [new User(1, "AAL@example.com", "Mat Garstka"), new User(2, "MONUMENTS@example.com", "John Browne")];
    const enrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment(2, "2024-01-01", null, 30, "2024-12-31")];

    mockCoursesRepository.getCourses.mockResolvedValueOnce(courses);
    mockUsersRepository.getUsers.mockResolvedValueOnce(users);
    mockEnrollmentsRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(enrollments);

    const result = await service.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("course_name", "Course 1");
    expect(result[0]).toHaveProperty("course_heading", "Look");
    expect(result[0].enrollments).toHaveLength(2);
    expect(result[0].enrollments[0]).toHaveProperty("name", "Mat Garstka");
    expect(result[0].enrollments[0]).toHaveProperty("email", "AAL@example.com");
    expect(mockCoursesRepository.getCourses).toHaveBeenCalledTimes(1);
    expect(mockUsersRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(mockEnrollmentsRepository.getEnrollmentsByCourseID).toHaveBeenCalledTimes(1);
  });

  test("should filter out unpublished courses", async () => {
    const courses = [new Course(1, null, "Course 1", "Look", true, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA"), new Course(2, null, "Course 2", "To", false, "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA")];
    const users = [new User(1, "AAL@example.com", "Mat Garstka"), new User(2, "MONUMENTS@example.com", "John Browne")];
    const enrollments = [new Enrollment(1, "2024-01-01", null, 50, "2024-12-31"), new Enrollment(2, "2024-01-01", null, 30, "2024-12-31")];

    mockCoursesRepository.getCourses.mockResolvedValueOnce(courses);
    mockUsersRepository.getUsers.mockResolvedValueOnce(users);
    mockEnrollmentsRepository.getEnrollmentsByCourseID.mockResolvedValueOnce(enrollments);

    const result = await service.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("course_name", "Course 1");
  });

  test("should handle errors and throw appropriately", async () => {
    const errorMessage = "Error occurred while fetching data";
    const error = new Error(errorMessage);

    ErrorHandler.getError = jest.fn().mockReturnValue(error);
    mockCoursesRepository.getCourses.mockRejectedValueOnce(new Error(errorMessage));

    await expect(service.execute()).rejects.toThrowError(errorMessage);
    expect(ErrorHandler.getError).toHaveBeenCalledWith(new Error(errorMessage));
  });

  test("should handle empty data and return an empty result", async () => {
    mockCoursesRepository.getCourses.mockResolvedValueOnce([]);
    mockUsersRepository.getUsers.mockResolvedValueOnce([]);
    mockEnrollmentsRepository.getEnrollmentsByCourseID.mockResolvedValueOnce([]);

    const result = await service.execute();

    expect(result).toHaveLength(0);
  });
});
