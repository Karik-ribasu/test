import Course from "../../../domain/course/course.entity";
import { HTTPCoursesRepository } from "../../../domain/course/repository/httpCourses.repository";
import { InternalServerError } from "../../../infra/errors/errorType.infra";

describe("HTTPCoursesRepository", () => {
  let repository: HTTPCoursesRepository;
  let mockFetch: jest.Mock;

  beforeAll(() => {
    repository = new HTTPCoursesRepository();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch all courses successfully", async () => {
    // Mock responses for pagination
    const mockResponsePage1 = {
      courses: [
        { id: 1, description: null, name: "Course 1", heading: "Look", is_published: true, image_url: "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA" },
        { id: 2, description: null, name: "Course 2", heading: "To", is_published: false, image_url: "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA" },
      ],
      meta: { number_of_pages: 2, page: 1, total: 4, per_page: 2, from: 1, to: 2 },
    };

    const mockResponsePage2 = {
      courses: [
        { id: 3, description: null, name: "Course 3", heading: "The", is_published: true, image_url: "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA" },
        { id: 4, description: null, name: "Course 4", heading: "Skies", is_published: true, image_url: "https://cdn.filestackcontent.com/HfhcrIRZKEyvND8blEXA" }
      ],
      meta: { number_of_pages: 2, page: 2, total: 4, per_page: 2, from: 3, to: 4 },
    };

    // Mock fetch to return responses
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponsePage1),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponsePage2),
    });

    const courses = await repository.getCourses();

    expect(courses).toHaveLength(4);
    expect(courses[0]).toBeInstanceOf(Course);
    expect(courses[0].name).toBe("Course 1");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test("should throw InternalServerError for other non-2xx statuses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(repository.getCourses()).rejects.toThrow(InternalServerError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
