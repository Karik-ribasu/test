import type { Request, Response } from "express";
import { ErrorHandler } from "../../../infra/errors/errorHandler.infra";
import type { GetPublishedCoursesService } from "../../../application/services/getPublishedCourses.service";

export class GetPublishedCoursesController {
  constructor(private getPublishedCoursesService: GetPublishedCoursesService) {
    this.execute = this.execute.bind(this);
  }
  
  async execute(req: Request, res: Response): Promise<void> {
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
