import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthService, LOGIN_URL } from '@org/auth';
import { API_BASE_URL } from '@org/api-services';
import { authInterceptor, errorInterceptor, loadingInterceptor } from '@org/interceptors';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    provideToastr({ timeOut: 4000, positionClass: 'toast-top-right', preventDuplicates: true }),
    provideAppInitializer(() => inject(AuthService).initializeSession()),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    { provide: LOGIN_URL, useValue: environment.loginUrl ?? '/login' },
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
    }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
  ],
};
