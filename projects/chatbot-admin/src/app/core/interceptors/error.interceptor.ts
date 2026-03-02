import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Interceptor para tratamento global de erros HTTP.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Ocorreu um erro inesperado';

      if (error.error?.message) {
        message = error.error.message;
      } else if (error.status === 0) {
        message = 'Não foi possível conectar ao servidor';
      } else if (error.status === 404) {
        message = 'Recurso não encontrado';
      } else if (error.status === 500) {
        message = 'Erro interno do servidor';
      }

      // Não mostrar snackbar para erros de autenticação (tratados pelo jwt interceptor)
      if (error.status !== 401 && error.status !== 403) {
        snackBar.open(message, 'Fechar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }

      return throwError(() => error);
    })
  );
};
