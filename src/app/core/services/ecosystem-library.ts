import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  setDoc,
  deleteDoc,
  updateDoc
} from '@angular/fire/firestore';
import { EcosystemInstrument } from './ecosystem-engine';

export interface EcosystemTemplate {
  id: string;
  name: string;
  description: string;
  //category: 'financial_system' | 'market' | 'credit' | 'crypto' | 'custom';
  category:string;
  
  setupTime: number; // minutes
  //complexity: 'simple' | 'intermediate' | 'advanced';
  complexity: string;

  dataPoints: number;
  region?: string;
  tags: string[];
}

export interface EcosystemInstance {
  id: string;
  name: string;
  templateId: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: Date | string;
  lastModified: Date | string;
  monitoredEntities: number;
  alertsTriggered: number;
}

@Injectable({
  providedIn: 'root'
})
export class EcosystemLibraryService {
  private firestore = inject(Firestore);
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
      createdAt: new Date('2024-01-15').toISOString(),
      lastModified: new Date().toISOString(),
      monitoredEntities: 347,
      alertsTriggered: 12
    },
    {
      id: 'instance-002',
      name: 'US Credit - Quarterly Review',
      templateId: 'template-002',
      status: 'active',
      createdAt: new Date('2024-02-01').toISOString(),
      lastModified: new Date().toISOString(),
      monitoredEntities: 218,
      alertsTriggered: 5
    }
  ]);

  // Signal for the selected ecosystem
  selectedEcosystemSignal = signal<EcosystemInstance | null>(this.instances$.value[0] || null);

  // Signal for templates (searchable)
  templatesSignal = signal<EcosystemTemplate[]>(this.templates);


  /* -------------------------------------------------------
     REACTIVE STATE (Workspace UI)
  ------------------------------------------------------- */

  selectedEcosystem = signal<EcosystemInstance | null>(null);
  workspaceTemplates = signal<EcosystemTemplate[]>([]);
  workspaceInstances = signal<EcosystemInstance[]>([]);
  workspaceInstruments = signal<Record<string, EcosystemInstrument[]>>({});

  constructor() {
    this.instances$.subscribe(instances => {
      if (!this.selectedEcosystemSignal() && instances.length > 0) {
        this.selectedEcosystemSignal.set(instances[0]);
      }
    });
  }


  /* -------------------------------------------------------
     WORKSPACE TEMPLATE OPERATIONS
  ------------------------------------------------------- */

  /** Get all templates in a workspace */
  loadWorkspaceTemplates(workspaceId: string) {
    const ref = collection(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_templates`
    );

    return collectionData(ref, { idField: 'id' }).subscribe(templates => {
      this.workspaceTemplates.set(templates as EcosystemTemplate[]);
    });
  }

  /** Get a single workspace template */
  getTemplate(workspaceId: string, templateId: string) {
    const ref = doc(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_templates/${templateId}`
    );
    return docData(ref, { idField: 'id' }) as any;
  }

  /** Get instruments for a workspace template */
  loadTemplateInstruments(workspaceId: string, templateId: string) {
    const ref = collection(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_templates/${templateId}/instruments`
    );

    return collectionData(ref, { idField: 'symbol' }).subscribe(instruments => {
      this.workspaceInstruments.update(prev => ({
        ...prev,
        [templateId]: instruments as EcosystemInstrument[]
      }));
    });
  }

  /** Add a template from the global library into the workspace */
  addTemplateToWorkspace(workspaceId: string, template: EcosystemTemplate) {
    const ref = doc(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_templates/${template.id}`
    );
    return setDoc(ref, template);
  }

  /** Remove a workspace template */
  removeTemplate(workspaceId: string, templateId: string) {
    return deleteDoc(
      doc(
        this.firestore,
        `workspaces/${workspaceId}/ecosystem_templates/${templateId}`
      )
    );
  }

  /** Add an instrument to a workspace template */
  addTemplateInstrument(
    workspaceId: string,
    templateId: string,
    symbol: string,
    weight = 1
  ) {
    const ref = doc(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_templates/${templateId}/instruments/${symbol}`
    );
    return setDoc(ref, { symbol, weight });
  }

  /** Remove an instrument from a workspace template */
  removeTemplateInstrument(
    workspaceId: string,
    templateId: string,
    symbol: string
  ) {
    return deleteDoc(
      doc(
        this.firestore,
        `workspaces/${workspaceId}/ecosystem_templates/${templateId}/instruments/${symbol}`
      )
    );
  }

  /* -------------------------------------------------------
     WORKSPACE ECOSYSTEM INSTANCES
  ------------------------------------------------------- */

  /** Load all workspace ecosystem instances */
  loadWorkspaceInstances(workspaceId: string) {
    const ref = collection(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_instances`
    );

    return collectionData(ref, { idField: 'id' }).subscribe(instances => {
      this.workspaceInstances.set(instances as EcosystemInstance[]);

      // Auto-select first instance if none selected
      if (!this.selectedEcosystem() && instances.length > 0) {
        this.selectedEcosystem.set(instances[0] as EcosystemInstance);
      }
    });
  }

  /** Create a workspace ecosystem instance */
  createWorkspaceInstance(
    workspaceId: string,
    templateId: string,
    name: string
  ) {
    const id = `instance-${Date.now()}`;
    const instance: EcosystemInstance = {
      id,
      name,
      templateId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      monitoredEntities: 0,
      alertsTriggered: 0
    };

    const ref = doc(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_instances/${id}`
    );

    return setDoc(ref, instance);
  }

  /** Update instance status */
  updateInstanceStatus(
    workspaceId: string,
    instanceId: string,
    status: 'active' | 'paused' | 'archived'
  ) {
    const ref = doc(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_instances/${instanceId}`
    );

    return updateDoc(ref, {
      status,
      lastModified: new Date().toISOString()
    });
  }

  /** Delete a workspace instance */
  deleteWorkspaceInstance(workspaceId: string, instanceId: string) {
    const ref = doc(
      this.firestore,
      `workspaces/${workspaceId}/ecosystem_instances/${instanceId}`
    );

    return deleteDoc(ref).then(() => {
      const remaining = this.workspaceInstances()
        .filter(i => i.id !== instanceId);

      this.workspaceInstances.set(remaining);
      if (this.selectedEcosystem()?.id === instanceId) {
        this.selectedEcosystem.set(remaining[0] || null);
      }
    });
  }

  /* -------------------------------------------------------
     SELECTION
  ------------------------------------------------------- */

  selectEcosystem(instance: EcosystemInstance) {
    this.selectedEcosystem.set(instance);
  }
}
