import { Router } from "express";
import RedisCache from "../../infra/cache/redis.infra";
import { GetPublishedCoursesService } from "../../application/services/getPublishedCourses.service/getPublishedCourses.service";
import { GetPublishedCoursesController } from "../controller/courses/getPublishedCourses.controller";
import { HTTPCoursesRepository } from "../../domain/course/repository/httpCourses.repository";
import { RedisCoursesRepository } from "../../domain/course/repository/redisCourses.repository";
import { CoursesRepository } from "../../domain/course/repository/courses.repository";
import { HTTPEnrollmentsRepository } from "../../domain/enrollment/repository/httpEnrollments.repository";
import { RedisEnrollmentsRepository } from "../../domain/enrollment/repository/redisEnrollments.repository";
import { EnrollmentsRepository } from "../../domain/enrollment/repository/enrollments.repository";
import { HTTPUsersRepository } from "../../domain/user/repository/httpUsers.repository";
import { RedisUsersRepository } from "../../domain/user/repository/redisUsers.repository";
import { UsersRepository } from "../../domain/user/repository/users.repository";


const redisCache = RedisCache.getInstance();

const httpCoursesRepository = new HTTPCoursesRepository();
const redisCoursesRepository = new RedisCoursesRepository(redisCache);
const coursesRepository = new CoursesRepository(httpCoursesRepository, redisCoursesRepository);

const httpEnrollmentsRepository = new HTTPEnrollmentsRepository();
const redisEnrollmentsRepository = new RedisEnrollmentsRepository(redisCache);
const enrollmentsRepository = new EnrollmentsRepository(httpEnrollmentsRepository, redisEnrollmentsRepository);

const httpUsersRepository = new HTTPUsersRepository();
const redisUsersRepository = new RedisUsersRepository(redisCache);
const usersRepository = new UsersRepository(httpUsersRepository, redisUsersRepository);

const getPublishedCoursesService = new GetPublishedCoursesService(coursesRepository, usersRepository, enrollmentsRepository);

const getPublishedCoursesController = new GetPublishedCoursesController(getPublishedCoursesService);

const coursesRouter = Router();
coursesRouter.get("/v1/courses", getPublishedCoursesController.execute);

export default coursesRouter;
