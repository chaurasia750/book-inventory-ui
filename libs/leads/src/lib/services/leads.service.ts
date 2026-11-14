import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@org/api-services';
import { KpiCard, Lead, StatusBreakdown, MonthlyTrend } from '../models/lead.model';
import { AddLeadRequest, AddLeadResponse, LeadLookupItem, GetLeadsRequest, PaginatedResponse, LeadDetail, UpdateLeadResponse, FollowUpItem, GetFollowUpsRequest, CreateActivityRequest, UpdateActivityRequest } from '../models/lead-api.model';

export interface BulkAssignRequest {
  leadIds: number[];
  assignedUserId: number;
}

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly api = inject(ApiService);

  getKpiCards(): Observable<KpiCard[]> {
    return of([
      { label: 'Total Leads', value: 1248, icon: 'users', growth: 12.5, color: '#339AF0' },
      { label: 'Hot Leads', value: 186, icon: 'fire', growth: 8.2, color: '#FF6B6B' },
      { label: 'Follow-ups Today', value: 43, icon: 'phone', growth: -3.1, color: '#66B42A' },
      { label: 'Converted', value: 527, icon: 'check', growth: 15.7, color: '#51CF66' },
      { label: 'Today Leads', value: 12, icon: 'trending-up', growth: 0, color: '#CC5DE8' },
    ]);
  }

  getLeadStatuses(): Observable<StatusBreakdown[]> {
    return of([
      { label: 'New', value: 342, color: '#339AF0' },
      { label: 'Hot', value: 186, color: '#FF6B6B' },
      { label: 'Warm', value: 251, color: '#66B42A' },
      { label: 'Cold', value: 198, color: '#868E96' },
      { label: 'Converted', value: 527, color: '#51CF66' },
      { label: 'Lost', value: 112, color: '#F06595' },
    ]);
  }

  getMonthlyTrends(): Observable<MonthlyTrend[]> {
    return of([
      { month: 'Jan', leads: 180, conversions: 65 },
      { month: 'Feb', leads: 200, conversions: 78 },
      { month: 'Mar', leads: 165, conversions: 55 },
      { month: 'Apr', leads: 220, conversions: 92 },
      { month: 'May', leads: 195, conversions: 74 },
      { month: 'Jun', leads: 240, conversions: 105 },
      { month: 'Jul', leads: 210, conversions: 88 },
      { month: 'Aug', leads: 260, conversions: 120 },
      { month: 'Sep', leads: 230, conversions: 95 },
      { month: 'Oct', leads: 280, conversions: 130 },
      { month: 'Nov', leads: 250, conversions: 110 },
      { month: 'Dec', leads: 310, conversions: 145 },
    ]);
  }

  getRecentLeads(): Observable<Lead[]> {
    return this.getLeads({ page: 1, pageSize: 8 }).pipe(map(res => res.items));
  }

  getLeads(params?: GetLeadsRequest): Observable<PaginatedResponse<Lead>> {
    const query: Record<string, string | number> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          query[key] = value;
        }
      }
    }
    return this.api.get<PaginatedResponse<Lead>>('/leads', query);
  }

  getLeadById(id: number): Observable<LeadDetail> {
    return this.api.get<LeadDetail>(`/leads/${id}`);
  }

  addLead(payload: AddLeadRequest): Observable<AddLeadResponse> {
    return this.api.post<AddLeadResponse>('/leads', payload);
  }

  updateLead(id: number, payload: AddLeadRequest): Observable<UpdateLeadResponse> {
    return this.api.put<UpdateLeadResponse>(`/leads/${id}`, payload);
  }

  getLeadSources(): Observable<LeadLookupItem[]> {
    return this.api.get<LeadLookupItem[]>('/leads-lookup/sources');
  }

  getLeadStatusLookup(): Observable<LeadLookupItem[]> {
    return this.api.get<LeadLookupItem[]>('/leads-lookup/statuses');
  }

  getFollowUps(params?: GetFollowUpsRequest): Observable<PaginatedResponse<FollowUpItem>> {
    const query: Record<string, string | number> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          query[key] = value;
        }
      }
    }
    return this.api.get<PaginatedResponse<FollowUpItem>>('/followups', query);
  }

  createActivity(leadId: number, payload: CreateActivityRequest): Observable<number> {
    return this.api.post<number>(`/leads/${leadId}/activities`, payload);
  }

  updateActivity(leadId: number, activityId: number, payload: UpdateActivityRequest): Observable<void> {
    return this.api.put<void>(`/leads/${leadId}/activities/${activityId}`, payload);
  }

  bulkAssignLead(payload: BulkAssignRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/leads/bulk-assign', payload);
  }
}
