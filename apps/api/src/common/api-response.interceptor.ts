import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ url?: string }>();
    if (req.url?.includes('/exports/')) {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data: data ?? null,
      })),
    );
  }
}
