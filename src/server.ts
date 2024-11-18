import express, { Express } from "express";
import coursesRouter from "./api/router/courses.router";
import logger from "./infra/logs/logger.infra";
import config from "./infra/config/config.infra";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app: Express = express();
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

app.use(logger.middleware);
app.use(express.json());
app.use(helmet())
app.disable('x-powered-by')
app.use("/", coursesRouter);

const port = config.SERVER.PORT | 8080
app.listen(port, () => console.log(`server running on port ${port}`));
