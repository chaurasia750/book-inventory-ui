import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@org/api-services';
import {
  VideoCategory,
  CreateVideoCategoryPayload,
  UpdateVideoCategoryPayload,
} from '../models/video.model';

@Injectable({ providedIn: 'root' })
export class VideoCategoryService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/website/videos/categories';

  getAll(): Observable<VideoCategory[]> {
    return this.api.get<VideoCategory[]>(this.baseUrl);
  }

  getById(id: number): Observable<VideoCategory> {
    return this.api.get<VideoCategory>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateVideoCategoryPayload): Observable<VideoCategory> {
    return this.api.post<VideoCategory>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateVideoCategoryPayload): Observable<VideoCategory> {
    return this.api.put<VideoCategory>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
