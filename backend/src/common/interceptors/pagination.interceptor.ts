import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  links?: {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
}

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { query, originalUrl } = request;

    // Extract pagination params
    const page = parseInt(query.page as string, 10) || 1;
    const limit = Math.min(parseInt(query.limit as string, 10) || 10, 100); // Max 100 items
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = ((query.sortOrder as string) || 'desc') as 'asc' | 'desc';

    // Attach pagination params to request
    request.pagination = {
      page,
      limit,
      skip: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    return next.handle().pipe(
      map((data) => {
        // Check if response includes total count (for pagination)
        if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
          const { items, total } = data as { items: unknown[]; total: number };
          const totalPages = Math.ceil(total / limit);

          const baseUrl = originalUrl.split('?')[0];
          const buildUrl = (newPage: number) => {
            const params = new URLSearchParams({
              page: newPage.toString(),
              limit: limit.toString(),
              ...(sortBy && { sortBy }),
              ...(sortOrder && { sortOrder }),
            });
            return `${baseUrl}?${params.toString()}`;
          };

          return {
            data: items,
            meta: {
              total,
              page,
              limit,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1,
            },
            links: {
              first: buildUrl(1),
              prev: page > 1 ? buildUrl(page - 1) : undefined,
              next: page < totalPages ? buildUrl(page + 1) : undefined,
              last: buildUrl(totalPages),
            },
          } as PaginatedResponse<unknown>;
        }

        return data;
      }),
    );
  }
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        skip: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
      };
    }
  }
}
