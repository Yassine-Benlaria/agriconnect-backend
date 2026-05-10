import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * §11 — Error Handling
 * All unhandled errors are transformed into the canonical shape:
 *   { statusCode, message, error }
 *
 * • HttpException subclasses (BadRequestException, NotFoundException, etc.)
 *   are forwarded with their original status code and message.
 * • Unknown/unexpected errors are masked as 500 Internal Server Error so that
 *   implementation details are never leaked to the client.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
        error = exception.message;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body['message'] as string | string[]) ?? exception.message;
        error = (body['error'] as string) ?? HttpStatus[statusCode];
      } else {
        message = exception.message;
        error = HttpStatus[statusCode];
      }
    } else {
      // Unexpected / non-HTTP exceptions — log full details server-side only
      this.logger.error(
        `Unhandled exception on [${request.method}] ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }
}
