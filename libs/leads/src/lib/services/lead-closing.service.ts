import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@org/api-services';
import { LeadBookingInfo, LeadClosingRequest } from '../models/lead-closing.model';

@Injectable({ providedIn: 'root' })
export class LeadClosingService {
  private readonly api = inject(ApiService);

  getBookingInfo(leadId: number): Observable<LeadBookingInfo> {
    return this.api.get<LeadBookingInfo>(`/leads/${leadId}/booking-info`);
  }

  getClosingRequest(leadId: number): Observable<LeadClosingRequest> {
    return this.api.get<LeadClosingRequest>(`/leads/${leadId}/closing`);
  }

  saveDraft(leadId: number, data: Partial<LeadClosingRequest>): Observable<LeadClosingRequest> {
    return this.api.post<LeadClosingRequest>(`/leads/${leadId}/closing/draft`, data);
  }

  submitForVerification(leadId: number, data: LeadClosingRequest): Observable<LeadClosingRequest> {
    return this.api.post<LeadClosingRequest>(`/leads/${leadId}/closing/submit`, data);
  }

  uploadDocument(leadId: number, file: File, type: string): Observable<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return this.api.post<{ fileUrl: string; fileName: string }>(`/leads/${leadId}/closing/documents`, formData);
  }

  approveClosing(leadId: number): Observable<LeadClosingRequest> {
    return this.api.post<LeadClosingRequest>(`/leads/${leadId}/closing/approve`, {});
  }

  rejectClosing(leadId: number, remarks: string): Observable<LeadClosingRequest> {
    return this.api.post<LeadClosingRequest>(`/leads/${leadId}/closing/reject`, { remarks });
  }
}
