import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';

export interface DocumentDto {
  id: number;
  name: string;
  description: string | null;
}

export interface MemberDocumentDto {
  id: number;
  documentName: string;
  mediaId: number;
  status: number | string;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
}

export interface AdminMemberDocumentDto {
  id: number;
  memberId: number;
  documentName: string;
  mediaId: number;
  status: number | string;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  reviewedBy: number | null;
}

@Injectable({ providedIn: 'root' })
export class MemberDocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.baseUrl}/documents`);
  }

  saveDocument(documentId: number, mediaId: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/member-documents`, { documentId, mediaId });
  }

  getMyDocuments(): Observable<MemberDocumentDto[]> {
    return this.http.get<MemberDocumentDto[]>(`${this.baseUrl}/member-documents`);
  }

  getPendingDocuments(memberId?: string): Observable<AdminMemberDocumentDto[]> {
    return this.http.get<AdminMemberDocumentDto[]>(`${this.baseUrl}/admin/member-documents`, {
      params: memberId ? { memberId } : {},
    });
  }

  getMemberDocuments(memberId: string): Observable<AdminMemberDocumentDto[]> {
    return this.http.get<AdminMemberDocumentDto[]>(`${this.baseUrl}/admin/member-documents/${memberId}`);
  }

  approveDocument(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/admin/member-documents/${id}/approve`, {});
  }

  rejectDocument(id: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/admin/member-documents/${id}/reject`, { reason });
  }
}
