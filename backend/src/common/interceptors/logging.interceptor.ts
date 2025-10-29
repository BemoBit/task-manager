import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging interceptor to log all incoming requests and outgoing responses
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;

    const now = Date.now();

    this.logger.log(
      `➡️  ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          this.logger.log(
            `⬅️  ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
          );

          if (process.env.NODE_ENV === 'development' && data) {
            this.logger.debug(`Response: ${JSON.stringify(data).substring(0, 200)}`);
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `❌ ${method} ${url} - Error: ${error.message} - Duration: ${duration}ms`,
          );
        },
      }),
    );
  }
}
