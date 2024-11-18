import { Router } from "express";
import coursesController from "../controller/courses.controller";

const coursesRouter = Router()
coursesRouter.get('/publishedCoursesWithEnrollments', coursesController.getPublishedCoursesWithEnrollments)

export default coursesRouter;