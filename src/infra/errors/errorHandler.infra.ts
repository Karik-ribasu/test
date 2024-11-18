import type { Response } from "express";
import { InternalServerError, NotFoundError } from "./errorType.infra";

export class ErrorHandler {
  // Static method to handle and categorize errors
  static getError(error: Error): Error {
    if (error instanceof NotFoundError || error instanceof InternalServerError) {
      return error;
    } else {
      return new InternalServerError(error.message);
    }
  }

  static log(error: Error) {
    if (error instanceof NotFoundError) {
      console.error(`[${error.name}] ${new Date().toISOString()} - ${error.message}\nStack Trace: ${error.stack}`);
    } else if (error instanceof InternalServerError) {
      console.error(`[${error.name}] ${new Date().toISOString()} - ${error.message}\nStack Trace: ${error.stack}`);
    } else {
      console.error(`[InternalServerError] ${new Date().toISOString()} - ${error.message}\nStack Trace: ${error.stack}`);
    }
  }

  static handleResponse(res: Response, error: Error) {
    this.log(error)
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
      // For unexpected errors, treat them as InternalServerError
      const wrappedError = new InternalServerError(error.message);
      res.status(500).json({
        success: false,
        message: wrappedError.message,
      });
    }
  }
}