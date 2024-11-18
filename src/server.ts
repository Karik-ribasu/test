import express, { Express } from "express";
import coursesRouter from "./api/router/courses.router";
import logger from "./infra/logs/logger.infra";
import config from "./infra/config/config.infra";

const app: Express = express();

app.use(logger.middleware);
app.use(express.json());

app.use("/", coursesRouter);
const port = config.SERVER.PORT | 8080
app.listen(port, () => console.log(`server running on port ${port}`));
