import type { Response } from "express";
import { InternalServerError, NotFoundError } from "./errorType.infra";

export class ErrorHandler {
  static getError(error: Error): Error {
    if (error instanceof NotFoundError || error instanceof InternalServerError) {
      return error;
    } else {
      return new InternalServerError(error.message);
    }
  }

  static handleResponse(res: Response, error: Error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else if (error instanceof InternalServerError) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    } else {
      const wrappedError = new InternalServerError(error.message);
      res.status(500).json({
        success: false,
        message: wrappedError.message,
      });
    }
  }
}