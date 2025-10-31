import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as compression from 'compression';

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Apply compression middleware
    const compress = compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Compression level (0-9)
      threshold: 1024, // Only compress responses larger than 1KB
    });

    return new Observable((subscriber) => {
      compress(request, response, () => {
        next
          .handle()
          .pipe(
            map((data) => {
              // Handle streamable files
              if (data instanceof StreamableFile) {
                return data;
              }
              return data;
            }),
          )
          .subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete(),
          });
      });
    });
  }
}
