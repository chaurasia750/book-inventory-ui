import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '@org/api-services';
import {
  VideoMaster,
  CreateVideoMasterPayload,
  UpdateVideoMasterPayload,
} from '../models/video.model';

@Injectable({ providedIn: 'root' })
export class VideoMasterService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/website/videos';

  getAll(categoryId?: number): Observable<VideoMaster[]> {
    const params: QueryParams = {};
    if (categoryId) params['categoryId'] = categoryId;
    return this.api.get<VideoMaster[]>(`${this.baseUrl}/list`, params);
  }

  getById(id: number): Observable<VideoMaster> {
    return this.api.get<VideoMaster>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateVideoMasterPayload): Observable<VideoMaster> {
    return this.api.post<VideoMaster>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateVideoMasterPayload): Observable<VideoMaster> {
    return this.api.put<VideoMaster>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
