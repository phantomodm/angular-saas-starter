import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

interface ApiUsage {
  total_requests: number;
  last_24h: number;
  last_used_at: string;
  endpoints: Record<string, number>;
}

@Component({
  selector: 'app-api-key-usage',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
  templateUrl: './api-key-usage.html',
})
export class ApiKeyUsage implements OnInit {
  private firestore = inject(Firestore);

  loading = signal(true);
  usage = signal<ApiUsage | null>({} as ApiUsage);

  workspaceUid = 'demo-workspace';
  keyId = 'key_12345';

  displayedColumns = ['endpoint', 'count'];

  async ngOnInit() {
    await this.loadUsage();
  }

  async loadUsage() {
    this.loading.set(true);

    const ref = doc(
      this.firestore,
      `workspaces/${this.workspaceUid}/api_usage/${this.keyId}`
    );

    const snap = await getDoc(ref);

    if (snap.exists()) {
      this.usage.set(snap.data() as ApiUsage);
    }

    this.loading.set(false);
  }
}
