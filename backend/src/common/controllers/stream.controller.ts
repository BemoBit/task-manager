import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Streaming')
@Controller('stream')
export class StreamController {
  /**
   * Server-Sent Events endpoint for real-time updates
   */
  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to server-sent events for real-time updates' })
  streamEvents(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map((num) => ({
        data: { timestamp: new Date(), count: num },
      })),
    );
  }

  /**
   * Example: Stream task updates
   */
  @Sse('tasks/:taskId/updates')
  @ApiOperation({ summary: 'Stream updates for a specific task' })
  streamTaskUpdates(): Observable<MessageEvent> {
    // This would typically listen to a message queue or database changes
    return interval(5000).pipe(
      map(() => ({
        data: {
          taskId: 'example-task-id',
          status: 'in_progress',
          progress: Math.random() * 100,
          timestamp: new Date(),
        },
      })),
    );
  }
}
