import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly log = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    let message = "Something went wrong. Please try again.";
    if (typeof raw === "string") message = raw;
    if (raw && typeof raw === "object" && "message" in raw) {
      const value = (raw as { message: string | string[] }).message;
      message = Array.isArray(value) ? value[0] : value;
    }
    if (status >= 500) this.log.error(exception);
    res.status(status).json({ message });
  }
}
