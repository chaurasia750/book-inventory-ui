import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@org/api-services';

export interface VideoCategory {
  id: number;
  categoryName: string;
  isActive: boolean;
}

export interface VideoMaster {
  id: number;
  videoCategoryId: number;
  title: string;
  description: string;
  youTubeEmbedUrl: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly api = inject(ApiService);

  getCategories(): Observable<VideoCategory[]> {
    return this.api.get<VideoCategory[]>('/website/videos/categories');
  }

  getVideos(): Observable<VideoMaster[]> {
    return this.api.get<VideoMaster[]>('/website/videos/list');
  }
}
