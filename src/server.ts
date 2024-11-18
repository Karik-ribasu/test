import express, { Express } from "express";
import dotenv from "dotenv";
import coursesRouter from "./api/router/courses.router";
import logger from "./infra/logs/logger.infra";

dotenv.config();
const app: Express = express();

app.use(logger.middleware)
app.use(express.json());

app.use('/', coursesRouter)

app.listen(8080, () => console.log("server running on port 8080"));
