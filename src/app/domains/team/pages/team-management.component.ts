import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { TeamMember, TeamInvite, Team } from '../../../core/models/organization.model';
import { OrganizationService } from '../../../core/services/organization';
import { AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
  ],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Team Management</h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage your team members and their permissions
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 border-b border-neutral-200 dark:border-neutral-700">
        <button
          (click)="activeTab.set('members')"
          [class.border-b-2]="activeTab() === 'members'"
          [class.border-primary-600]="activeTab() === 'members'"
          class="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
        >
          Members ({{ teamMembers().length }})
        </button>
        <button
          (click)="activeTab.set('invites')"
          [class.border-b-2]="activeTab() === 'invites'"
          [class.border-primary-600]="activeTab() === 'invites'"
          class="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
        >
          Invites ({{ pendingInvites().length }})
        </button>
        <button
          (click)="activeTab.set('teams')"
          [class.border-b-2]="activeTab() === 'teams'"
          [class.border-primary-600]="activeTab() === 'teams'"
          class="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
        >
          Teams ({{ allTeams().length }})
        </button>
      </div>

      <!-- Members Tab -->
      @if (activeTab() === 'members') {
        <app-card>
          <app-card-header class="flex justify-between items-center">
            <h2 class="font-semibold text-neutral-900 dark:text-white">Team Members</h2>
            <button
              (click)="showInviteForm.set(!showInviteForm())"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              + Invite Member
            </button>
          </app-card-header>

          @if (showInviteForm()) {
            <app-card-body>
              <form [formGroup]="inviteForm" (ngSubmit)="inviteMember()" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <input
                      formControlName="email"
                      type="email"
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                        bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Role
                    </label>
                    <select
                      formControlName="role"
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                        bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div class="flex items-end gap-2">
                    <button
                      type="submit"
                      [disabled]="inviteForm.invalid || inviting()"
                      class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700
                        disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                      {{ inviting() ? 'Inviting...' : 'Send Invite' }}
                    </button>
                    <button
                      type="button"
                      (click)="showInviteForm.set(false)"
                      class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white
                        rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                @if (inviteError()) {
                  <div class="p-3 bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded-lg">
                    <p class="text-sm text-danger-700 dark:text-danger-300">{{ inviteError() }}</p>
                  </div>
                }
              </form>
            </app-card-body>
          }

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Joined
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                @for (member of teamMembers(); track member.id) {
                  <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center
                          text-xs font-semibold text-primary-600 dark:text-primary-400"
                        >
                          {{ member.userEmail.charAt(0).toUpperCase() }}
                        </div>
                        <span class="font-medium text-neutral-900 dark:text-white">{{ member.userId }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {{ member.userEmail }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        [class]="getRoleBadgeClass(member.role)"
                        class="px-2 py-1 rounded text-xs font-medium"
                      >
                        {{ member.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {{ member.joinedAt | date: 'short' }}
                    </td>
                    <td class="px-6 py-4">
                      <button
                        (click)="removeMember(member.id)"
                        class="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>
      }

      <!-- Invites Tab -->
      @if (activeTab() === 'invites') {
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-white">Pending Invitations</h2>
          </app-card-header>
          @if (pendingInvites().length === 0) {
            <app-card-body>
              <p class="text-center text-neutral-600 dark:text-neutral-400 py-8">
                No pending invitations
              </p>
            </app-card-body>
          } @else {
            <div class="divide-y divide-neutral-200 dark:divide-neutral-700">
              @for (invite of pendingInvites(); track invite.id) {
                <div class="px-6 py-4 flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                  <div>
                    <p class="font-medium text-neutral-900 dark:text-white">{{ invite.email }}</p>
                    <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Invited {{ invite.createdAt | date: 'short' }} • Expires {{
                        invite.expiresAt | date: 'short'
                      }}
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span
                      [class]="getRoleBadgeClass(invite.role)"
                      class="px-2 py-1 rounded text-xs font-medium"
                    >
                      {{ invite.role }}
                    </span>
                    <button
                      (click)="cancelInvite(invite.id)"
                      class="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </app-card>
      }

      <!-- Teams Tab -->
      @if (activeTab() === 'teams') {
        <app-card>
          <app-card-header class="flex justify-between items-center">
            <h2 class="font-semibold text-neutral-900 dark:text-white">Teams</h2>
            <button
              (click)="showTeamForm.set(true)"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              + New Team
            </button>
          </app-card-header>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            @for (team of allTeams(); track team.id) {
              <div
                class="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-300
                dark:hover:border-primary-700 transition"
              >
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="font-semibold text-neutral-900 dark:text-white">{{ team.name }}</h3>
                    <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{{ team.description }}</p>
                  </div>
                  @if (team.color) {
                    <div
                      [style.backgroundColor]="team.color"
                      class="w-3 h-3 rounded-full"
                    ></div>
                  }
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ getTeamMemberCount(team.id) }} members
                </p>
              </div>
            }
          </div>
        </app-card>
      }
    </div>
  `,
})
export class TeamManagementComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private auditService = inject(AuditService);
  private fb = inject(FormBuilder);

  activeTab = signal<'members' | 'invites' | 'teams'>('members');
  showInviteForm = signal(false);
  showTeamForm = signal(false);
  teamMembers = signal<TeamMember[]>([]);
  pendingInvites = signal<TeamInvite[]>([]);
  allTeams = signal<Team[]>([]);
  inviting = signal(false);
  inviteError = signal('');

  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member', Validators.required],
  });

  ngOnInit() {
    this.loadTeams();
    this.loadMembers();
  }

  loadTeams() {
    this.orgService.getAllTeams('org_1').subscribe({
      next: (teams) => this.allTeams.set(teams),
      error: (err) => console.error('Failed to load teams', err),
    });
  }

  loadMembers() {
    this.orgService.getTeamMembers('team_1').subscribe({
      next: (members) => this.teamMembers.set(members),
      error: (err) => console.error('Failed to load members', err),
    });
  }

  inviteMember() {
    if (this.inviteForm.invalid) return;

    this.inviting.set(true);
    this.inviteError.set('');

    const { email, role } = this.inviteForm.value;
    this.orgService.inviteTeamMember('team_1', 'org_1', email || '', role || 'member').subscribe({
      next: (invite) => {
        this.pendingInvites.update((invites) => [...invites, invite]);
        this.inviteForm.reset({ role: 'member' });
        this.showInviteForm.set(false);
        this.inviting.set(false);

        // Log audit
        this.auditService.logAction({
          organizationId: 'org_1',
          userId: '1',
          userEmail: 'admin@example.com',
          action: 'invite_member',
          resourceType: 'team_member',
          resourceId: invite.id,
          resourceName: email || '',
        });
      },
      error: (err) => {
        this.inviteError.set(err.message);
        this.inviting.set(false);
      },
    });
  }

  removeMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    this.orgService.removeTeamMember(memberId).subscribe({
      next: () => {
        this.teamMembers.update((members) =>
          members.filter((m) => m.id !== memberId),
        );

        this.auditService.logAction({
          organizationId: 'org_1',
          userId: '1',
          userEmail: 'admin@example.com',
          action: 'remove_member',
          resourceType: 'team_member',
          resourceId: memberId,
          resourceName: 'Team member',
        });
      },
      error: (err) => console.error('Failed to remove member', err),
    });
  }

  cancelInvite(inviteId: string) {
    this.pendingInvites.update((invites) =>
      invites.filter((i) => i.id !== inviteId),
    );
  }

  getTeamMemberCount(teamId: string): number {
    return this.teamMembers().filter((m) => m.teamId === teamId).length;
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      owner: 'bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-300',
      admin: 'bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300',
      member: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
      viewer: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
    };
    return classes[role] || classes['member'];
  }
}