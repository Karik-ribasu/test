import Enrollment from "../../../domain/enrollment/enrollment.entity";
import { HTTPEnrollmentsRepository } from "../../../domain/enrollment/repository/httpEnrollments.repository";
import { InternalServerError, NotFoundError } from "../../../infra/errors/errorType.infra";

describe("HTTPEnrollmentsRepository", () => {
  let repository: HTTPEnrollmentsRepository;
  let mockFetch: jest.Mock;

  beforeAll(() => {
    repository = new HTTPEnrollmentsRepository();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch all enrollments successfully", async () => {
    const mockResponsePage1 = {
      enrollments: [
        { user_id: 1, enrolled_at: "2024-01-01", completed_at: null, percent_complete: 50, expires_at: "2024-12-31" },
        { user_id: 2, enrolled_at: "2024-01-01", completed_at: null, percent_complete: 30, expires_at: "2024-12-31" },
      ],
      meta: { number_of_pages: 2, page: 1, total: 4, per_page: 2, from: 1, to: 2 },
    };

    const mockResponsePage2 = {
      enrollments: [
        { user_id: 3, enrolled_at: "2024-01-01", completed_at: null, percent_complete: 80, expires_at: "2024-12-31" },
        { user_id: 4, enrolled_at: "2024-01-01", completed_at: null, percent_complete: 70, expires_at: "2024-12-31" },
      ],
      meta: { number_of_pages: 2, page: 2, total: 4, per_page: 2, from: 3, to: 4 },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponsePage1),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponsePage2),
    });

    const enrollments = await repository.getEnrollmentsByCourseID(1);

    expect(enrollments).toHaveLength(4);
    expect(enrollments[0]).toBeInstanceOf(Enrollment);
    expect(enrollments[0].user_id).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test("should throw InternalServerError for other non-2xx statuses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(repository.getEnrollmentsByCourseID(1)).rejects.toThrow(InternalServerError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
