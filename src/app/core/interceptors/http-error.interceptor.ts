import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError(error => {
      const message = error.status === 0
        ? 'Server is unreachable'
        : `Error ${error.status}: ${error.statusText || 'Something went wrong'}`;

      snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' });

      return throwError(() => error);
    })
  );
};
