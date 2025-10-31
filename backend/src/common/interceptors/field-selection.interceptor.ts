import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Field Selection Interceptor
 * Allows clients to request specific fields using ?fields=field1,field2,field3
 * Supports nested fields using dot notation: field1.subfield1,field2
 */
@Injectable()
export class FieldSelectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { fields } = request.query;

    if (!fields) {
      return next.handle();
    }

    const selectedFields = (fields as string).split(',').map((f) => f.trim());

    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.map((item) => this.selectFields(item, selectedFields));
        }

        if (data && typeof data === 'object') {
          // Handle paginated responses
          if ('data' in data && Array.isArray(data.data)) {
            return {
              ...data,
              data: data.data.map((item: unknown) => this.selectFields(item, selectedFields)),
            };
          }

          // Handle single object
          return this.selectFields(data, selectedFields);
        }

        return data;
      }),
    );
  }

  private selectFields(obj: unknown, fields: string[]): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.includes('.')) {
        // Handle nested fields
        const [parent, ...rest] = field.split('.');
        const parentValue = (obj as Record<string, unknown>)[parent];

        if (parentValue) {
          if (!result[parent]) {
            result[parent] = {};
          }
          Object.assign(
            result[parent] as Record<string, unknown>,
            this.selectFields(parentValue, [rest.join('.')]),
          );
        }
      } else {
        // Simple field
        if (field in (obj as Record<string, unknown>)) {
          result[field] = (obj as Record<string, unknown>)[field];
        }
      }
    }

    return result;
  }
}
