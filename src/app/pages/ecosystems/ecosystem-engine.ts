import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API_BASE_URL = 'https://continuityengine-910896594298.us-central1.run.app';

export interface EcosystemTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  dataPoints: number;
  region?: string;
  tags: string[];
  setupTime: number; // minutes
}

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
  status: 'healthy' | 'drift' | 'critical';
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class EcosystemEngineService {
  private http = inject(HttpClient);

  ecosystemId = signal<string>('');
  ecosystemState = signal<EcosystemState | null>(null);
  instruments = signal<EcosystemInstrument[]>([]);
  instrumentStates = signal<Record<string, any>>({});
  loading = signal<boolean>(true);

  reset() {
    this.ecosystemId.set('');
    this.ecosystemState.set(null);
    this.instruments.set([]);
    this.instrumentStates.set({});
    this.loading.set(true);
  }


  /* -------------------------------------------------------
     TEMPLATE ENDPOINTS
  ------------------------------------------------------- */

  getTemplates() {
    return this.http.get<EcosystemTemplate[]>(`${API_BASE_URL}/ecosystems/templates`);
  }

  getTemplate(id: string) {
    return this.http.get<EcosystemTemplate>(`${API_BASE_URL}/ecosystems/templates/${id}`);
  }

  getTemplateInstruments(id: string) {
    return this.http.get<EcosystemInstrument[]>(
      `${API_BASE_URL}/ecosystems/templates/${id}/instruments`
    );
  }

  /* -------------------------------------------------------
     INSTANCE ENDPOINTS
  ------------------------------------------------------- */

  getInstances() {
    return this.http.get<EcosystemInstance[]>(`${API_BASE_URL}/ecosystems/instances`);
  }

  createInstance(templateId: string, name: string) {
    return this.http.post<EcosystemInstance>(
      `${API_BASE_URL}/ecosystems/instances`,
      { templateId, name }
    );
  }

  deleteInstance(id: string) {
    return this.http.delete(`${API_BASE_URL}/ecosystems/instances/${id}`);
  }

  updateInstanceStatus(id: string, status: string) {
    return this.http.patch(`${API_BASE_URL}/ecosystems/instances/${id}/status`, { status });
  }

  /* -------------------------------------------------------
     INSTANCE INSTRUMENTS
  ------------------------------------------------------- */

  getInstanceInstruments(id: string) {
    return this.http.get<EcosystemInstrument[]>(
      `${API_BASE_URL}/ecosystems/instances/${id}/instruments`
    );
  }

  addInstrument(id: string, symbol: string, weight = 1) {
    return this.http.post(
      `${API_BASE_URL}/ecosystems/instances/${id}/instruments`,
      { symbol, weight }
    );
  }

  removeInstrument(id: string, symbol: string) {
    return this.http.delete(
      `${API_BASE_URL}/ecosystems/instances/${id}/instruments/${symbol}`
    );
  }

  /* -------------------------------------------------------
     ECOSYSTEM STATE (STRUCTURAL RESILIENCE)
  ------------------------------------------------------- */

  getLatestState(id: string) {
    return this.http.get<EcosystemState>(
      `${API_BASE_URL}/ecosystems/instances/${id}/state/latest`
    );
  }

  getStateHistory(id: string) {
    return this.http.get<EcosystemState[]>(
      `${API_BASE_URL}/ecosystems/instances/${id}/state/history`
    );
  }
}