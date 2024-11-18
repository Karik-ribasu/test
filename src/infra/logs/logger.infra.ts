import winston from 'winston';
import { NextFunction, Request, Response } from 'express';

class Logger {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple()
    );

    this.logger = winston.createLogger({
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    this.logger.info(`[${req.method}] ${req.originalUrl}`);

    res.on('finish', () => {
      this.logger.info(
        `[${res.statusCode}] ${res.statusMessage || '-'} - ${res.get('Content-Length') || 0}B`
      );
    });

    next();
  };

  public log(data: any){
    this.logger.log(data)
  }

  public error(data: any){
    this.logger.error(data)
  }
}

const logger = new Logger()
export default logger