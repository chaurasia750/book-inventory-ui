import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@org/api-services';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }
}
