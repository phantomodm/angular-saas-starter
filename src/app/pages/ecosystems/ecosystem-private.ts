// ecosystem-private.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './ecosystem-engine';

export interface EcosystemInstance {
  id: string;
  name: string;
  templateId: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  lastModified: string;
}

export interface EcosystemInstrument {
  symbol: string;
  weight: number;
}

export interface EcosystemState {
  continuityIndex: number;
  load: number;
  resilience: number;
  leadTimeDays: number;
  status: 'healthy' | 'drift' | 'critical' | 'stable' | 'collapse-onset';
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class EcosystemPrivateService {
  private http = inject(HttpClient);

  // Adjust to your actual backend base URL
  private readonly baseUrl =  API_BASE_URL + '/api/ecosystems';

  // API key is typically injected via interceptor; no need to handle here.

  /** List all instances for current user (API key identifies uid) */
  listInstances(): Observable<EcosystemInstance[]> {
    return this.http.get<EcosystemInstance[]>(`${this.baseUrl}/instances`);
  }

  /** Create a new instance from a template */
  createInstance(
    name: string,
    templateId: string
  ): Observable<EcosystemInstance> {
    const params = { name, template_id: templateId };
    return this.http.post<EcosystemInstance>(
      `${this.baseUrl}/instances`,
      null,
      { params }
    );
  }

  /** Get instruments for an instance */
  getInstanceInstruments(
    instanceId: string
  ): Observable<EcosystemInstrument[]> {
    return this.http.get<EcosystemInstrument[]>(
      `${this.baseUrl}/instances/${instanceId}/instruments`
    );
  }

  /** Trigger compute of latest state (on-demand) */
  computeLatestState(instanceId: string): Observable<EcosystemState> {
    return this.http.post<EcosystemState>(
      `${this.baseUrl}/instances/${instanceId}/state/latest`,
      {}
    );
  }

  /** Get latest state snapshot */
  getLatestState(instanceId: string): Observable<EcosystemState> {
    return this.http.get<EcosystemState>(
      `${this.baseUrl}/instances/${instanceId}/state/latest`
    );
  }

  /** Get state history */
  getStateHistory(
    instanceId: string,
    limit = 200
  ): Observable<EcosystemState[]> {
    return this.http.get<EcosystemState[]>(
      `${this.baseUrl}/instances/${instanceId}/state/history`,
      { params: { limit } as any }
    );
  }

  /** Update instance status */
  updateStatus(
    instanceId: string,
    status: 'active' | 'paused' | 'archived'
  ): Observable<EcosystemInstance> {
    return this.http.patch<EcosystemInstance>(
      `${this.baseUrl}/instances/${instanceId}/status`,
      null,
      { params: { status } }
    );
  }

  /** Delete instance */
  deleteInstance(instanceId: string): Observable<{ status: string; id: string }> {
    return this.http.delete<{ status: string; id: string }>(
      `${this.baseUrl}/instances/${instanceId}`
    );
  }
}
