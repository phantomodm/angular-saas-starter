import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Organization,
  Team,
  TeamMember,
  TeamInvite,
  BillingPlan,
  UsageMetrics,
} from '../models/organization.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly orgApi = '/api/org';

  getOrganization(id: string): Observable<Organization> {
    return this.http.get<ApiResponse<any>>(`${this.orgApi}/${id}/info`).pipe(
      map((response) => this.mapOrgInfo(id, response.data)),
      catchError((error) =>
        throwError(
          () =>
            new Error(error?.error?.detail || 'Failed to fetch organization'),
        ),
      ),
    );
  }

  createOrganization(data: Partial<Organization>): Observable<Organization> {
    return this.http.post<ApiResponse<any>>(`${this.orgApi}`, data).pipe(
      map((response) =>
        this.mapOrgInfo(
          response.data?.organization_id || data.id || '',
          response.data,
          data,
        ),
      ),
      catchError((error) =>
        throwError(
          () =>
            new Error(error?.error?.detail || 'Failed to create organization'),
        ),
      ),
    );
  }

  updateOrganization(
    id: string,
    data: Partial<Organization>,
  ): Observable<Organization> {
    return this.http.put<ApiResponse<any>>(`${this.orgApi}/${id}`, data).pipe(
      map((response) => this.mapOrgInfo(id, response.data, data)),
      catchError((error) =>
        throwError(
          () =>
            new Error(error?.error?.detail || 'Failed to update organization'),
        ),
      ),
    );
  }

  getAllTeams(organizationId: string): Observable<Team[]> {
    return this.http
      .get<
        ApiResponse<{ members?: any[] }>
      >(`${this.orgApi}/${organizationId}/members`)
      .pipe(
        map((response) => {
          const members = response.data?.members || [];
          if (members.length === 0) {
            return [];
          }

          const defaultTeam: Team = {
            id: `${organizationId}_team_default`,
            organizationId,
            name: 'Organization Team',
            description: 'Default organization team',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: members[0]?.user_id || 'system',
            status: 'active',
          };

          return [defaultTeam];
        }),
        catchError(() => of([])),
      );
  }

  createTeam(organizationId: string, data: Partial<Team>): Observable<Team> {
    return this.http
      .post<ApiResponse<any>>(`${this.orgApi}/${organizationId}/teams`, data)
      .pipe(
        map((response) => this.mapTeam(organizationId, response.data, data)),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to create team'),
          ),
        ),
      );
  }

  getTeamMembers(teamId: string): Observable<TeamMember[]> {
    const orgId = this.extractOrgIdFromTeam(teamId);
    return this.http
      .get<ApiResponse<{ members?: any[] }>>(`${this.orgApi}/${orgId}/members`)
      .pipe(
        map((response) =>
          (response.data?.members || []).map((member) =>
            this.mapTeamMember(member, teamId, orgId),
          ),
        ),
        catchError(() => of([])),
      );
  }

  addTeamMember(
    teamId: string,
    organizationId: string,
    data: Partial<TeamMember>,
  ): Observable<TeamMember> {
    return this.http
      .post<
        ApiResponse<any>
      >(`${this.orgApi}/${organizationId}/members`, { teamId, ...data })
      .pipe(
        map((response) =>
          this.mapTeamMember(response.data, teamId, organizationId, data),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to add team member'),
          ),
        ),
      );
  }

  updateTeamMember(
    memberId: string,
    data: Partial<TeamMember>,
  ): Observable<TeamMember> {
    return this.http
      .patch<ApiResponse<any>>(`${this.orgApi}/members/${memberId}`, data)
      .pipe(
        map((response) =>
          this.mapTeamMember(
            response.data,
            data.teamId || 'unknown',
            data.organizationId || 'unknown',
            data,
          ),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to update team member'),
          ),
        ),
      );
  }

  removeTeamMember(memberId: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<any>>(`${this.orgApi}/members/${memberId}`)
      .pipe(
        map(() => ({ success: true })),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to remove team member'),
          ),
        ),
      );
  }

  inviteTeamMember(
    teamId: string,
    organizationId: string,
    email: string,
    role: string,
  ): Observable<TeamInvite> {
    return this.http
      .post<
        ApiResponse<any>
      >(`${this.orgApi}/${organizationId}/invites`, { teamId, email, role })
      .pipe(
        map((response) => ({
          id: response.data?.id || `invite_${Date.now()}`,
          teamId,
          organizationId,
          email,
          inviteCode: response.data?.inviteCode || '',
          invitedBy: response.data?.invitedBy || 'current-user',
          role: (role as TeamInvite['role']) || 'member',
          expiresAt: response.data?.expiresAt
            ? new Date(response.data.expiresAt)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          status: (response.data?.status as TeamInvite['status']) || 'pending',
        })),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to invite team member'),
          ),
        ),
      );
  }

  getPlans(): Observable<BillingPlan[]> {
    return this.http
      .get<ApiResponse<{ plans?: BillingPlan[] }>>('/api/billing/plans')
      .pipe(
        map((response) => response.data?.plans || []),
        catchError(() => of([])),
      );
  }

  getUsageMetrics(organizationId: string): Observable<UsageMetrics> {
    return this.http
      .get<ApiResponse<any>>(`${this.orgApi}/${organizationId}/dashboard`)
      .pipe(
        map((response) => {
          const kpis = response.data?.dashboard?.kpis || {};
          return {
            id: `usage_${organizationId}`,
            organizationId,
            month: new Date().toISOString().slice(0, 7),
            apiCallsUsed: Number(kpis.api_calls_this_month || 0),
            apiCallsLimit: 1000000,
            usersUsed: Number(kpis.total_users || 0),
            usersLimit: 999,
            teamsUsed: Number(kpis.active_features || 0),
            teamsLimit: 999,
            storageUsed: 0,
            storageLimit: 100,
            webhooksUsed: 0,
            webhooksLimit: 100,
            lastUpdatedAt: new Date(),
          };
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to fetch usage metrics',
              ),
          ),
        ),
      );
  }

  private mapOrgInfo(
    id: string,
    data: any,
    patch?: Partial<Organization>,
  ): Organization {
    return {
      id,
      name: patch?.name || data?.name || `Organization ${id}`,
      company_name:
        patch?.company_name ||
        data?.company_name ||
        patch?.name ||
        data?.name ||
        `Organization ${id}`,
      email: patch?.email || data?.email || '',
      roles: patch?.roles || data?.roles || [],
      permissions: patch?.permissions || data?.permissions || [],
      displayName:
        patch?.displayName ||
        data?.displayName ||
        patch?.name ||
        data?.name ||
        `Organization ${id}`,
      slug: patch?.slug || data?.slug || id.toLowerCase(),
      logo: patch?.logo,
      website: patch?.website,
      industry: patch?.industry,
      size: patch?.size,
      country: patch?.country,
      createdAt: patch?.createdAt || new Date(),
      updatedAt: new Date(),
      ownerId: patch?.ownerId || data?.user_uid || 'unknown',
      status: patch?.status || 'active',
      subscriptionTierId: patch?.subscriptionTierId,
      photoUrl: patch?.photoUrl || data?.photoUrl || '',
    };
  }

  private mapTeam(
    organizationId: string,
    data: any,
    patch?: Partial<Team>,
  ): Team {
    return {
      id: data?.id || patch?.id || `team_${Date.now()}`,
      organizationId,
      name: patch?.name || data?.name || 'New Team',
      description: patch?.description || data?.description,
      icon: patch?.icon || data?.icon,
      color: patch?.color || data?.color,
      createdAt: patch?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: patch?.createdBy || data?.createdBy || 'current-user',
      status: patch?.status || data?.status || 'active',
    };
  }

  private mapTeamMember(
    data: any,
    teamId: string,
    organizationId: string,
    patch?: Partial<TeamMember>,
  ): TeamMember {
    return {
      id: data?.id || patch?.id || `member_${Date.now()}`,
      teamId: patch?.teamId || teamId,
      organizationId: patch?.organizationId || organizationId,
      userId: data?.user_id || patch?.userId || '',
      userEmail: data?.user_email || patch?.userEmail || '',
      role: patch?.role || data?.role || 'member',
      status: patch?.status || data?.status || 'active',
      invitedAt: patch?.invitedAt,
      invitedBy: patch?.invitedBy,
      acceptedAt: patch?.acceptedAt,
      joinedAt: data?.joined_at
        ? new Date(data.joined_at)
        : patch?.joinedAt || new Date(),
      permissions: patch?.permissions,
      metadata: patch?.metadata,
    };
  }

  private extractOrgIdFromTeam(teamId: string): string {
    const parts = teamId.split('_');
    return parts.length > 1 ? parts[0] : teamId;
  }
}
