import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { TeamSummary, PagedTeamResponse, TeamApiResponse, TeamFilter, HierarchyResponse, PagedHierarchyChildrenResponse, LevelSummary, PagedLevelMemberResponse, LevelMemberFilter } from '@org/shared-models';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = inject(ApiService);

  getSummary(memberId?: string): Observable<TeamSummary> {
    const params: Record<string, string> = {};
    if (memberId) params['memberId'] = memberId;
    return this.api.get<TeamSummary>('/team/summary', params);
  }

  getDirect(filter: TeamFilter): Observable<PagedTeamResponse> {
    return this.api.get<TeamApiResponse | PagedTeamResponse>('/team/direct', filter as unknown as Record<string, string | number | boolean>).pipe(
      map((res) => (res as TeamApiResponse).data ?? (res as PagedTeamResponse)),
    );
  }

  getIndirect(filter: TeamFilter): Observable<PagedTeamResponse> {
    return this.api.get<TeamApiResponse | PagedTeamResponse>('/team/indirect', filter as unknown as Record<string, string | number | boolean>).pipe(
      map((res) => (res as TeamApiResponse).data ?? (res as PagedTeamResponse)),
    );
  }

  getAll(filter: TeamFilter): Observable<PagedTeamResponse> {
    return this.api.get<TeamApiResponse | PagedTeamResponse>('/team/all', filter as unknown as Record<string, string | number | boolean>).pipe(
      map((res) => (res as TeamApiResponse).data ?? (res as PagedTeamResponse)),
    );
  }

  getHierarchy(memberId?: string, page = 1, pageSize = 50): Observable<HierarchyResponse> {
    const params: Record<string, string | number> = { page, pageSize };
    if (memberId) params['memberId'] = memberId;
    return this.api.get<any>('/team/hierarchy', params as Record<string, string | number>).pipe(
      map((res) => {
        const d = res?.data ?? res;
        if (d && d.currentMember) {
          const r = d as HierarchyResponse;
          r.children = Array.isArray(r.children) ? r.children : [];
          r.page = r.page ?? page;
          r.pageSize = r.pageSize ?? pageSize;
          r.totalRecords = r.totalRecords ?? r.children.length;
          r.totalPages = r.totalPages ?? 1;
          return r;
        }
        const nodes = Array.isArray(d) ? d : [];
        return { currentMember: null, children: nodes, page, pageSize, totalRecords: nodes.length, totalPages: 1 } as HierarchyResponse;
      }),
    );
  }

  getHierarchyChildren(parentMemberId: string, page = 1, pageSize = 50): Observable<PagedHierarchyChildrenResponse> {
    const params: Record<string, string | number> = { page, pageSize };
    return this.api.get<any>(`/team/hierarchy/${parentMemberId}/children`, params as Record<string, string | number>).pipe(
      map((res) => {
        const d = res?.data ?? res;
        if (Array.isArray(d)) {
          return { page, pageSize, totalRecords: d.length, totalPages: 1, items: d } as PagedHierarchyChildrenResponse;
        }
        return {
          page: d.page ?? page,
          pageSize: d.pageSize ?? pageSize,
          totalRecords: d.totalRecords ?? d.total ?? (Array.isArray(d.items) ? d.items.length : 0),
          totalPages: d.totalPages ?? 1,
          items: d.items ?? d.children ?? d.data ?? [],
        } as PagedHierarchyChildrenResponse;
      }),
    );
  }

  getLevelSummary(memberId?: string): Observable<LevelSummary[]> {
    const params: Record<string, string> = {};
    if (memberId) params['memberId'] = memberId;
    return this.api.get<unknown>('/team/levels', params).pipe(
      map((res) => {
        const root = res && typeof res === 'object' ? res : {};
        const arr: unknown[] = (root as any).data ?? (root as any).result ?? res;
        if (!Array.isArray(arr)) return [];
        return arr.map((item) => {
          const obj = item && typeof item === 'object' ? item : {};
          return {
            level: Number((obj as any).level) || 0,
            memberCount: Number((obj as any).memberCount ?? (obj as any).member_count) || 0,
            activeMembers: Number((obj as any).activeMembers ?? (obj as any).active_members) || 0,
            inactiveMembers: Number((obj as any).inactiveMembers ?? (obj as any).inactive_members) || 0,
            totalBusiness: Number((obj as any).totalBusiness ?? (obj as any).total_business) || 0,
            totalIncome: Number((obj as any).totalIncome ?? (obj as any).total_income) || 0,
          } as LevelSummary;
        });
      }),
    );
  }

  getLevelMembers(filter: LevelMemberFilter): Observable<PagedLevelMemberResponse> {
    const params: Record<string, string | number | boolean> = {
      page: filter.page,
      pageSize: filter.pageSize,
    };
    if (filter.memberId) params['memberId'] = filter.memberId;
    if (filter.search) params['search'] = filter.search;
    if (filter.sortBy) params['sortBy'] = filter.sortBy;
    if (filter.descending !== undefined) params['descending'] = filter.descending;
    return this.api.get<unknown>(`/team/levels/${filter.level}`, params as Record<string, string | number>).pipe(
      map((res) => {
        const root = res && typeof res === 'object' ? res : {};
        const d = (root as any).data ?? (root as any).result ?? res;
        if (Array.isArray(d)) {
          return {
            page: filter.page,
            pageSize: filter.pageSize,
            totalRecords: d.length,
            items: d,
          } as PagedLevelMemberResponse;
        }
        return {
          page: d.page ?? filter.page,
          pageSize: d.pageSize ?? filter.pageSize,
          totalRecords: d.totalRecords ?? d.total ?? (Array.isArray(d.items) ? d.items.length : 0),
          items: Array.isArray(d.items) ? d.items : [],
        } as PagedLevelMemberResponse;
      }),
    );
  }
}
