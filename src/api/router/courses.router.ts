import { Router } from "express";
import RedisCache from "../../infra/cache/redis.infra";
import { HTTPUsersRepository, RedisUsersRepository, UsersRepository } from "../../domain/user/user.repository";
import { GetPublishedCoursesService } from "../../application/services/getPublishedCourses.service";
import { GetPublishedCoursesController } from "../controller/courses/getPublishedCourses.controller";
import { CoursesRepository, HTTPCoursesRepository, RedisCoursesRepository } from "../../domain/course/course.repository";
import { EnrollmentsRepository, HTTPEnrollmentsRepository, RedisEnrollmentsRepository } from "../../domain/enrollment/enrollment.repository";

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
