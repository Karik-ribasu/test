import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import { InternalServerError, NotFoundError } from "../../../infra/errors/errorType.infra";
import type { IEnrollmentsRepository } from "../IEnrollmentsRepository";
import Enrollment from "../enrollment.entity";

type EnrollmentDTO = {
  user_id: number;
  enrolled_at: string;
  completed_at: null | string;
  percent_complete: number;
  expires_at: null | string;
};

type Pagination = {
  page: number;
  total: number;
  number_of_pages: number;
  from: number;
  to: number;
  per_page: number;
};

type HTTPGetEnrollmentsByCourseIDResponse = {
  enrollments: EnrollmentDTO[];
  meta: Pagination;
};

export class HTTPEnrollmentsRepository implements IEnrollmentsRepository {
  async getEnrollmentsByCourseID(courseID: number): Promise<Enrollment[]> {
    try {
      return await this.fetchAllEnrollments(courseID);
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  private async fetchAllEnrollments(courseID: number): Promise<Enrollment[]> {
    const enrollments: Enrollment[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const data = await this.fetchEnrollmentsPage(courseID, currentPage);
      enrollments.push(...this.mapToEnrollmentEntities(data.enrollments));
      totalPages = data.meta.number_of_pages;
      currentPage++;
    } while (currentPage <= totalPages);

    return enrollments;
  }

  private async fetchEnrollmentsPage(courseID: number, page: number): Promise<HTTPGetEnrollmentsByCourseIDResponse> {
    const url = `${process.env.TEACHABLE_API_BASE_URL}/v1/courses/${courseID}/enrollments?page=${page}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apiKey: process.env.TEACHABLE_API_KEY as string,
      },
    });

    if (!response.ok) {
      this.handleResponseError(response);
    }

    return await response.json();
  }

  private handleResponseError(response: Response): never {
    if (response.status === 404) {
      throw new NotFoundError("Enrollments not found");
    }
    throw new InternalServerError(`Failed to fetch data: ${response.statusText}`);
  }

  private mapToEnrollmentEntities(enrollments: EnrollmentDTO[]): Enrollment[] {
    return enrollments.map(({ user_id, enrolled_at, completed_at, percent_complete, expires_at }) => new Enrollment(user_id, enrolled_at, completed_at, percent_complete, expires_at));
  }
}