import type { Request, Response } from "express";

import { ErrorHandler } from "../../infra/errors/errorHandler.infra";
import getPublishedCoursesWithEnrollments, { type GetPublishedCoursesWithEnrollments } from "../../application/services/getCoursesWithEnrollments.service";

class CoursesController {
  constructor(private getPublishedCoursesService: GetPublishedCoursesWithEnrollments) {
    // Bind the method to ensure `this` refers to the instance
    this.getPublishedCoursesWithEnrollments = this.getPublishedCoursesWithEnrollments.bind(this);
  }

  public async getPublishedCoursesWithEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const courses = await this.getPublishedCoursesService.execute();

      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      return ErrorHandler.handleResponse(res, error as Error);
    }
  }
}

const coursesController = new CoursesController(getPublishedCoursesWithEnrollments);

export type { CoursesController };
export default coursesController;
