import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(error => {
      console.error(`HTTP ${error.status} on ${req.method} ${req.url}`, error.message);
      return throwError(() => error);
    })
  );
