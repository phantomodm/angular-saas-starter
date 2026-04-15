import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { EcosystemEngineService } from '../../../pages/ecosystems/ecosystem-engine';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/store/auth.store';
import { Router } from '@angular/router';
import { EcosystemTemplate } from '../../../pages/ecosystems/ecosystem-library';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-vertical-grid',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './vertical-grid.html',
  styleUrl: './vertical-grid.scss',
})
export class VerticalGrid implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthStore);
  private workspaceId = computed(
    () => this.auth.currentUser()?.workspaceId || 'default',
  );
  private engine = inject(EcosystemEngineService);
  private dialog = inject(MatDialog);

  // Store the templates array after subscribing to the Observable
  private templatesList: any[] = [];

  // We map the incoming template list to our specific high-priority verticals
  templates = computed(() => {
    const all = this.templatesList || [];
    if (!all.length) return { banking: null, credit: null, crypto: null }; // Handle loading state
    return {
      banking: all.find((t) => t.id === 'g-sib-banking'),
      credit: all.find((t) => t.id === 'us-credit-distress'),
      crypto: all.find((t) => t.id === 'crypto-systemic-resilience'),
    };
  });

  ngOnInit() {
    // Subscribe to the Observable and update the local templatesList
    this.engine.getTemplates().subscribe((list) => {
      this.templatesList = list || [];
    });
  }

  // Reuse your existing logic for institutional consistency
  getChipClass(status: string) {
    return (
      {
        healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        drift: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        critical: 'bg-red-500/10 text-red-400 border-red-500/20',
      }[status] || 'bg-slate-800 text-slate-400'
    );
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const cards = document.getElementsByClassName('glass');
    for (const card of Array.from(cards) as HTMLElement[]) {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  }

  /**
   * Primary Action Logic:
   * 1. If logged in: Route to the specific ecosystem overview in their workspace.
   * 2. If guest: Trigger the 'Request Access' flow (Signup/Login).
   */
  analyzeVertical(template: EcosystemTemplate) {
    if (this.auth.isAuthenticated()) {
      // Navigate to the internal tool for this specific template
      this.router.navigate([
        '/workspace',
        this.workspaceId(),
        'continuity',
        'overview',
        { templateId: template.id },
      ]);
    } else {
      this.dialog.open(LeadCaptureModalComponent, {
        panelClass: 'custom-modal-panel',
        backdropClass: 'custom-modal-backdrop',
      });
      // Redirect to signup with a return URL to this specific vertical
      this.router.navigate(['/signup'], {
        queryParams: {
          intent: 'analyze',
          vertical: template.id,
        },
      });
    }
  }
}

@Component({
  selector: 'app-lead-capture-modal',
  template: ``,
  styles: [
    `
      .access-portal-container {
        max-width: 400px;
        background: radial-gradient(circle at top right, #111, #050507);
      }

      ::ng-deep .custom-dark-field {
        .mat-mdc-text-field-wrapper {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
        .mat-mdc-form-field-focus-overlay {
          background-color: transparent !important;
        }
        .mdc-notched-outline__leading,
        .mdc-notched-outline__notch,
        .mdc-notched-outline__trailing {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        input {
          color: white !important;
        }
      }
    `,
  ],
})
export class LeadCaptureModalComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<LeadCaptureModalComponent>);

  loading = signal(false);

  leadForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    organization: [''],
  });

  submitRequest() {
    if (this.leadForm.valid) {
      this.loading.set(true);
      // Simulate access validation
      setTimeout(() => {
        this.dialogRef.close();
        this.router.navigate(['/signup'], { 
          queryParams: { 
            email: this.leadForm.value.email,
            org: this.leadForm.value.organization 
          } 
        });
      }, 1500);
    }
  }
}
