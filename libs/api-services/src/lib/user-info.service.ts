import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import { UserInfo } from '@org/shared-models';

@Injectable({ providedIn: 'root' })
export class UserInfoService {
  private readonly api = inject(ApiService);
  private cached$: Observable<UserInfo> | null = null;

  getUserInfo(): Observable<UserInfo> {
    if (!this.cached$) {
      this.cached$ = this.api.get<UserInfo>('/users/info').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.cached$;
  }

  clearCache(): void {
    this.cached$ = null;
  }
}
