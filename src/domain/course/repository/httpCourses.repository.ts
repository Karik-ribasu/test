import type { ICoursesRepository } from "../ICoursesRepository";
import Course from "../course.entity";
import { InternalServerError } from "../../../infra/errors/errorType.infra";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";

type CourseDTO = {
  id: number;
  description: null | string;
  name: string;
  heading: string;
  is_published: boolean;
  image_url: string;
};

type Pagination = {
  page: number;
  total: number;
  number_of_pages: number;
  from: number;
  to: number;
  per_page: number;
};

type HTTPGetCoursesResponse = {
  courses: CourseDTO[];
  meta: Pagination;
};

export class HTTPCoursesRepository implements ICoursesRepository {
  async getCourses(): Promise<Course[]> {
    try {
      return await this.fetchAllCourses();
    } catch (error) {
      throw ErrorHandler.getError(error as Error);
    }
  }

  private async fetchAllCourses(): Promise<Course[]> {
    const courses: Course[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const data = await this.fetchCoursesPage(currentPage);
      courses.push(...this.mapToCourseEntities(data.courses));
      totalPages = data.meta.number_of_pages;
      currentPage++;
    } while (currentPage <= totalPages);

    return courses;
  }

  private async fetchCoursesPage(page: number): Promise<HTTPGetCoursesResponse> {
    const url = `${process.env.TEACHABLE_API_BASE_URL}/v1/courses?page=${page}`;
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
    throw new InternalServerError(`Failed to fetch data: ${response.statusText}`);
  }

  private mapToCourseEntities(courses: CourseDTO[]): Course[] {
    return courses.map(({ id, description, name, heading, is_published, image_url }) => new Course(id, description, name, heading, is_published, image_url));
  }
}
