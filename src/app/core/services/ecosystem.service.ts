// EcosystemService - migrated from ecosystems.txt
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EcosystemTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial_system' | 'market' | 'credit' | 'crypto' | 'custom';
  setupTime: number; // minutes
  complexity: 'simple' | 'intermediate' | 'advanced';
  dataPoints: number;
  region?: string;
  tags: string[];
}

export interface EcosystemInstance {
  id: string;
  name: string;
  templateId: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  lastModified: Date;
  monitoredEntities: number;
  alertsTriggered: number;
}

@Injectable({
  providedIn: 'root'
})
export class EcosystemService {
  // Predefined ecosystem templates
  private templates: EcosystemTemplate[] = [
    {
      id: 'template-001',
      name: 'Global Banking System',
      description: 'Monitor interconnected banking institutions, credit flows, and systemic risk',
      category: 'financial_system',
      setupTime: 1,
      complexity: 'simple',
      dataPoints: 450,
      region: 'Global',
      tags: ['banks', 'credit', 'interconnection', 'systemic-risk']
    },
    {
      id: 'template-002',
      name: 'US Credit Markets',
      description: 'Track credit spread dynamics, default rates, and corporate bond flows',
      category: 'credit',
      setupTime: 2,
      complexity: 'intermediate',
      dataPoints: 320,
      region: 'North America',
      tags: ['credit', 'bonds', 'spreads', 'default-risk']
    },
    {
      id: 'template-003',
      name: 'Cryptocurrency Ecosystem',
      description: 'Monitor DeFi protocols, stablecoin health, and on-chain capital flows',
      category: 'crypto',
      setupTime: 3,
      complexity: 'advanced',
      dataPoints: 580,
      tags: ['defi', 'stablecoins', 'blockchain', 'crypto']
    },
    {
      id: 'template-004',
      name: 'Equity Markets',
      description: 'Track equity indices, sector performance, and market microstructure',
      category: 'market',
      setupTime: 2,
      complexity: 'intermediate',
      dataPoints: 410,
      region: 'Global',
      tags: ['equities', 'indices', 'sectors', 'microstructure']
    },
    {
      id: 'template-005',
      name: 'FX Markets',
      description: 'Monitor foreign exchange flows, central bank actions, and currency correlations',
      category: 'market',
      setupTime: 1,
      complexity: 'simple',
      dataPoints: 280,
      region: 'Global',
      tags: ['forex', 'currencies', 'central-bank', 'flows']
    },
    {
      id: 'template-006',
      name: 'Commodity Complex',
      description: 'Track energy, metals, and agricultural commodities with geopolitical factors',
      category: 'market',
      setupTime: 3,
      complexity: 'advanced',
      dataPoints: 520,
      tags: ['commodities', 'energy', 'metals', 'agriculture', 'geopolitics']
    }
  ];

  // User's active ecosystems
  private instances$ = new BehaviorSubject<EcosystemInstance[]>([
    {
      id: 'instance-001',
      name: 'Global Banking System',
      templateId: 'template-001',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      lastModified: new Date(),
      monitoredEntities: 347,
      alertsTriggered: 12
    },
    {
      id: 'instance-002',
      name: 'US Credit - Quarterly Review',
      templateId: 'template-002',
      status: 'active',
      createdAt: new Date('2024-02-01'),
      lastModified: new Date(),
      monitoredEntities: 218,
      alertsTriggered: 5
    }
  ]);

  // Signal for the selected ecosystem
  selectedEcosystemSignal = signal<EcosystemInstance | null>(this.instances$.value[0] || null);

  // Signal for templates (searchable)
  templatesSignal = signal<EcosystemTemplate[]>(this.templates);

  constructor() {
    this.instances$.subscribe(instances => {
      if (!this.selectedEcosystemSignal() && instances.length > 0) {
        this.selectedEcosystemSignal.set(instances[0]);
      }
    });
  }

  /**
   * Get all available templates
   */
  getTemplates(): Observable<EcosystemTemplate[]> {
    return new BehaviorSubject(this.templates).asObservable();
  }

  /**
   * Search templates by query
   */
  searchTemplates(query: string): EcosystemTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter templates by category
   */
  filterByCategory(category: string): EcosystemTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  /**
   * Get user's ecosystem instances
   */
  getInstances(): Observable<EcosystemInstance[]> {
    return this.instances$.asObservable();
  }

  /**
   * Create new ecosystem from template
   */
  createFromTemplate(templateId: string, instanceName: string): EcosystemInstance {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    const newInstance: EcosystemInstance = {
      id: `instance-${Date.now()}`,
      name: instanceName || template.name,
      templateId,
      status: 'active',
      createdAt: new Date(),
      lastModified: new Date(),
      monitoredEntities: Math.floor(Math.random() * 300) + 100,
      alertsTriggered: 0
    };

    const current = this.instances$.value;
    this.instances$.next([...current, newInstance]);
    this.selectedEcosystemSignal.set(newInstance);

    return newInstance;
  }

  /**
   * Select an ecosystem as current
   */
  selectEcosystem(instanceId: string): void {
    const instance = this.instances$.value.find(i => i.id === instanceId);
    if (instance) {
      this.selectedEcosystemSignal.set(instance);
    }
  }

  /**
   * Get selected ecosystem
   */
  getSelectedEcosystem(): EcosystemInstance | null {
    return this.selectedEcosystemSignal();
  }

  /**
   * Update ecosystem status
   */
  updateStatus(instanceId: string, status: 'active' | 'paused' | 'archived'): void {
    const updated = this.instances$.value.map(i =>
      i.id === instanceId ? { ...i, status, lastModified: new Date() } : i
    );
    this.instances$.next(updated);
  }

  /**
   * Delete ecosystem
   */
  deleteInstance(instanceId: string): void {
    const updated = this.instances$.value.filter(i => i.id !== instanceId);
    this.instances$.next(updated);
    
    const current = this.selectedEcosystemSignal();
    if (current?.id === instanceId) {
      this.selectedEcosystemSignal.set(updated[0] || null);
    }
  }
}
