import { GetPublishedCoursesController } from "../../../api/controller/courses/getPublishedCourses.controller";
import type { CourseWithEnrollment } from "../../../application/services/getPublishedCourses.service/getPublishedCourses.dto";
import { GetPublishedCoursesService } from "../../../application/services/getPublishedCourses.service/getPublishedCourses.service";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";

// Mock dependencies
jest.mock("../../../application/services/getPublishedCourses.service/getPublishedCourses.service");
jest.mock("../../../infra/errors/errorHandler.infra");

describe("GetPublishedCoursesController", () => {
  let controller: GetPublishedCoursesController;
  let mockService: jest.Mocked<GetPublishedCoursesService>;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    mockService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPublishedCoursesService>;

    mockRequest = {}; // Simulating a basic Request object

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new GetPublishedCoursesController(mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return a list of published courses with enrollments", async () => {
    const mockCourses = [
      {
        course_name: "Course 1",
        course_heading: "Heading 1",
        enrollments: [{ name: "User 1", email: "user1@example.com" }],
      },
    ];

    mockService.execute.mockResolvedValueOnce(mockCourses);

    await controller.execute(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: mockCourses,
    });
    expect(mockService.execute).toHaveBeenCalledTimes(1);
  });

  test("should handle errors gracefully and return a server error", async () => {
    const errorMessage = "Error occurred while fetching courses";
    const error = new Error(errorMessage);
    ErrorHandler.handleResponse = jest.fn().mockReturnValueOnce(error);

    mockService.execute.mockRejectedValueOnce(error);

    await controller.execute(mockRequest, mockResponse);

    expect(ErrorHandler.handleResponse).toHaveBeenCalledWith(mockResponse, error);
    expect(mockResponse.status).not.toHaveBeenCalledWith(200); // No success status called
  });

  test("should handle empty courses data gracefully", async () => {
    const emptyCourses: CourseWithEnrollment[] = [];

    mockService.execute.mockResolvedValueOnce(emptyCourses);

    await controller.execute(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: emptyCourses,
    });
  });
});
