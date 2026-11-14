import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';

export interface UploadedFileInfo {
  id: number;
  url: string;
  fileName: string;
  isPrimary: boolean;
}

export interface TempUploadResult {
  tempKey: string;
  files: UploadedFileInfo[];
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  tempUpload(files: File[]): Observable<TempUploadResult> {
    const formData = this.buildFormData(files);
    return this.http.post<TempUploadResult>(`${this.baseUrl}/media/temp-upload`, formData);
  }

  tempUploadWithProgress(files: File[]): Observable<HttpEvent<TempUploadResult>> {
    const formData = this.buildFormData(files);
    return this.http.post<TempUploadResult>(`${this.baseUrl}/media/temp-upload`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  private buildFormData(files: File[]): FormData {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return formData;
  }

  getFileUrl(id: number): string {
    return `${this.baseUrl}/media/view/${id}`;
  }

  getDownloadUrl(id: number): string {
    return `${this.baseUrl}/media/download/${id}`;
  }
}
