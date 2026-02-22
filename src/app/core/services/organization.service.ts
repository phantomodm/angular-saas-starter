import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import {
  Organization,
  Team,
  TeamMember,
  TeamInvite,
  BillingPlan,
  UsageMetrics,
} from '../models/organization.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private mockOrganizations = new Map<string, Organization>();
  private mockTeams = new Map<string, Team>();
  private mockTeamMembers = new Map<string, TeamMember>();
  private mockInvites = new Map<string, TeamInvite>();
  private mockPlans = new Map<string, BillingPlan>();
  private mockUsage = new Map<string, UsageMetrics>();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    // Mock organization
    const org: Organization = {
      id: 'org_1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'Sample organization',
      website: 'https://acme.example.com',
      industry: 'Technology',
      size: 'medium',
      country: 'US',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      ownerId: '1',
      status: 'active',
      subscriptionTierId: 'plan_pro',
    };
    this.mockOrganizations.set(org.id, org);

    // Mock teams
    const teams: Team[] = [
      {
        id: 'team_1',
        organizationId: 'org_1',
        name: 'Engineering',
        description: 'Engineering team',
        color: 'blue',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date(),
        createdBy: '1',
        status: 'active',
      },
      {
        id: 'team_2',
        organizationId: 'org_1',
        name: 'Marketing',
        description: 'Marketing team',
        color: 'purple',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date(),
        createdBy: '1',
        status: 'active',
      },
    ];

    teams.forEach((team) => this.mockTeams.set(team.id, team));

    // Mock team members
    const members: TeamMember[] = [
      {
        id: 'member_1',
        teamId: 'team_1',
        organizationId: 'org_1',
        userId: '1',
        userEmail: 'admin@example.com',
        role: 'owner',
        status: 'active',
        joinedAt: new Date('2024-01-01'),
      },
      {
        id: 'member_2',
        teamId: 'team_1',
        organizationId: 'org_1',
        userId: '2',
        userEmail: 'developer@example.com',
        role: 'admin',
        status: 'active',
        joinedAt: new Date('2024-02-01'),
      },
    ];

    members.forEach((member) => this.mockTeamMembers.set(member.id, member));

    // Mock plans
    const plans: BillingPlan[] = [
      {
        id: 'plan_starter',
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for getting started',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          { id: '1', name: 'Up to 5 users', category: 'team', description: '' },
          { id: '2', name: '1 team', category: 'teams', description: '' },
          { id: '3', name: '10K API calls/month', category: 'api', description: '' },
        ],
        limits: {
          users: 5,
          teams: 1,
          apiKeys: 5,
          webhooks: 0,
          monthlyApiCalls: 10000,
          storage: 1,
        },
        status: 'active',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'plan_pro',
        name: 'Pro',
        slug: 'pro',
        description: 'For growing teams',
        monthlyPrice: 49,
        yearlyPrice: 490,
        features: [
          { id: '1', name: 'Unlimited users', category: 'team', description: '' },
          { id: '2', name: 'Unlimited teams', category: 'teams', description: '' },
          { id: '3', name: '1M API calls/month', category: 'api', description: '' },
          { id: '4', name: 'Priority support', category: 'support', description: '' },
        ],
        limits: {
          users: 999,
          teams: 999,
          apiKeys: 50,
          webhooks: 100,
          monthlyApiCalls: 1000000,
          storage: 100,
        },
        status: 'active',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'For large organizations',
        monthlyPrice: 299,
        yearlyPrice: 2990,
        features: [
          { id: '1', name: 'Unlimited everything', category: 'team', description: '' },
          { id: '2', name: 'Dedicated support', category: 'support', description: '' },
          { id: '3', name: 'Custom integrations', category: 'integrations', description: '' },
          { id: '4', name: 'SSO/SAML', category: 'security', description: '' },
        ],
        limits: {
          users: 9999,
          teams: 9999,
          apiKeys: 999,
          webhooks: 999,
          monthlyApiCalls: 10000000,
          storage: 1000,
        },
        status: 'active',
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    plans.forEach((plan) => this.mockPlans.set(plan.id, plan));

    // Mock usage
    const usage: UsageMetrics = {
      id: 'usage_1',
      organizationId: 'org_1',
      month: '2024-02',
      apiCallsUsed: 450000,
      apiCallsLimit: 1000000,
      usersUsed: 15,
      usersLimit: 999,
      teamsUsed: 2,
      teamsLimit: 999,
      storageUsed: 45,
      storageLimit: 100,
      webhooksUsed: 25,
      webhooksLimit: 100,
      lastUpdatedAt: new Date(),
    };
    this.mockUsage.set(usage.id, usage);
  }

  /**
   * Get organization
   */
  getOrganization(id: string) {
    const org = this.mockOrganizations.get(id);
    return org ? of(org).pipe(delay(300)) : throwError(() => new Error('Organization not found'));
  }

  /**
   * Create organization
   */
  createOrganization(data: Partial<Organization>) {
    const org: Organization = {
      id: `org_${Date.now()}`,
      name: data.name || '',
      slug: (data.name || '').toLowerCase().replace(/\s+/g, '-'),
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: data.ownerId || '',
      status: 'active',
      ...data,
    };
    this.mockOrganizations.set(org.id, org);
    return of(org).pipe(delay(300));
  }

  /**
   * Update organization
   */
  updateOrganization(id: string, data: Partial<Organization>) {
    const org = this.mockOrganizations.get(id);
    if (!org) return throwError(() => new Error('Organization not found'));

    const updated = { ...org, ...data, updatedAt: new Date() };
    this.mockOrganizations.set(id, updated);
    return of(updated).pipe(delay(300));
  }

  /**
   * Get all teams
   */
  getAllTeams(organizationId: string) {
    const teams = Array.from(this.mockTeams.values()).filter(
      (t) => t.organizationId === organizationId,
    );
    return of(teams).pipe(delay(300));
  }

  /**
   * Create team
   */
  createTeam(organizationId: string, data: Partial<Team>) {
    const team: Team = {
      id: `team_${Date.now()}`,
      organizationId,
      name: data.name || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy || '',
      status: 'active',
      ...data,
    };
    this.mockTeams.set(team.id, team);
    return of(team).pipe(delay(300));
  }

  /**
   * Get team members
   */
  getTeamMembers(teamId: string) {
    const members = Array.from(this.mockTeamMembers.values()).filter((m) => m.teamId === teamId);
    return of(members).pipe(delay(300));
  }

  /**
   * Add team member
   */
  addTeamMember(teamId: string, organizationId: string, data: Partial<TeamMember>) {
    const member: TeamMember = {
      id: `member_${Date.now()}`,
      teamId,
      organizationId,
      userId: data.userId || '',
      userEmail: data.userEmail || '',
      role: data.role || 'member',
      status: 'active',
      joinedAt: new Date(),
      ...data,
    };
    this.mockTeamMembers.set(member.id, member);
    return of(member).pipe(delay(300));
  }

  /**
   * Update team member role
   */
  updateTeamMember(memberId: string, data: Partial<TeamMember>) {
    const member = this.mockTeamMembers.get(memberId);
    if (!member) return throwError(() => new Error('Member not found'));

    const updated = { ...member, ...data };
    this.mockTeamMembers.set(memberId, updated);
    return of(updated).pipe(delay(300));
  }

  /**
   * Remove team member
   */
  removeTeamMember(memberId: string) {
    this.mockTeamMembers.delete(memberId);
    return of({ success: true }).pipe(delay(300));
  }

  /**
   * Invite team member by email
   */
  inviteTeamMember(teamId: string, organizationId: string, email: string, role: string) {
    const invite: TeamInvite = {
      id: `invite_${Date.now()}`,
      teamId,
      organizationId,
      email,
      inviteCode: this.generateInviteCode(),
      invitedBy: 'current-user',
      role: role as any,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      status: 'pending',
    };
    this.mockInvites.set(invite.id, invite);
    return of(invite).pipe(delay(300));
  }

  /**
   * Get organization billing plans
   */
  getPlans() {
    const plans = Array.from(this.mockPlans.values()).sort((a, b) => a.order - b.order);
    return of(plans).pipe(delay(300));
  }

  /**
   * Get organization usage metrics
   */
  getUsageMetrics(organizationId: string) {
    const usage = Array.from(this.mockUsage.values()).find(
      (u) => u.organizationId === organizationId,
    );
    return usage ? of(usage).pipe(delay(300)) : throwError(() => new Error('Usage not found'));
  }

  /**
   * Generate invite code
   */
  private generateInviteCode(): string {
    return `invite_${Math.random().toString(36).substr(2, 9)}`;
  }
}
