import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable } from 'rxjs';

export interface EcosystemTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  dataPoints: number;
  region?: string;
  tags: string[];
  setupTime: number;
}

export interface PublicEcosystemInstance {
  id: string; // e.g. "public-g-sib-monitor"
  templateId: string; // e.g. "template-001"
  name: string;
  status: 'active' | 'paused' | 'archived';
  continuity?: {
    value: number;
    timestamp: string;
  } | null;
}

export interface PublicTemplateWithContinuity extends EcosystemTemplate {
  publicInstanceId: string | null;
  continuity: {
    value: number | null;
    timestamp: string | null;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class EcosystemPublicService {
  private firestore = inject(Firestore);

  templatesSignal = signal<PublicTemplateWithContinuity[]>([]);
  publicInstancesSignal = signal<PublicEcosystemInstance[]>([]);
  globalContinuitySignal = signal<number | null>(null);

  // -----------------------------
  // Firestore Collection Streams
  // -----------------------------
  private templates$ = collectionData(
    collection(this.firestore, 'ecosystem_templates'),
    { idField: 'id' },
  ) as Observable<EcosystemTemplate[]>;

  private publicInstances$ = collectionData(
    collection(this.firestore, 'workspaces/default/ecosystem_instances'),
    { idField: 'id' },
  ) as Observable<PublicEcosystemInstance[]>;

  //   startPolling() {
  //     const templatesRef = collection(this.firestore, 'ecosystem_templates');
  //     const instancesRef = collection(
  //       this.firestore,
  //       'workspaces/default/ecosystem_instances'
  //     );

  //     const templates$ = collectionData(templatesRef, { idField: 'id' });
  //     const instances$ = collectionData(instancesRef, { idField: 'id' });

  //     combineLatest([templates$, instances$])
  //       .pipe(
  //         map(([templates, instances]) => {
  //         const typedInstances = instances as PublicEcosystemInstance[];
  //           // Merge continuity into templates
  //           const mergedTemplates = (templates as EcosystemTemplate[]).map(tpl => {
  //             const inst = typedInstances.find(i => i.templateId === tpl.id);
  //             return {
  //               ...tpl,
  //               publicInstanceId: inst?.id ?? null,
  //               continuity: inst?.continuity
  //                   ? {
  //                       value: inst.continuity.value,
  //                       timestamp: inst.continuity.timestamp,
  //                     }
  //                   : null,
  //             };
  //           });

  //           // Compute global continuity
  //           const continuityValues = typedInstances
  //             .map(i => i.continuity?.value)
  //             .filter(v => typeof v === 'number');

  //           const globalContinuity =
  //             continuityValues.length > 0
  //               ? continuityValues.reduce((a, b) => a + b, 0) /
  //                 continuityValues.length
  //               : null;

  //           return {
  //             templates: mergedTemplates,
  //             instances: typedInstances,
  //             globalContinuity,
  //           };
  //         })
  //       )
  //       .subscribe(({ templates, instances, globalContinuity }) => {
  //         this.templatesSignal.set(templates);
  //         this.publicInstancesSignal.set(instances);
  //         this.globalContinuitySignal.set(globalContinuity);
  //       });
  //   }

  // -----------------------------
  // Start Polling (merge + compute)
  // -----------------------------
  startPolling() {
    combineLatest([this.templates$, this.publicInstances$])
      .pipe(
        map(([templates, instances]) => this.mergeData(templates, instances)),
      )
      .subscribe(({ templates, instances, globalContinuity }) => {
        this.templatesSignal.set(templates);
        this.publicInstancesSignal.set(instances);
        this.globalContinuitySignal.set(globalContinuity);
      });
  }

  // -----------------------------
  // Business Logic (pure functions)
  // -----------------------------
  private mergeData(
    templates: EcosystemTemplate[],
    instances: PublicEcosystemInstance[],
  ) {
    const mergedTemplates = templates.map((tpl) => {
      const inst = instances.find((i) => i.templateId === tpl.id);
      return {
        ...tpl,
        publicInstanceId: inst?.id ?? null,
        continuity: inst?.continuity ?? null,
      };
    });

    const continuityValues = instances
      .map((i) => i.continuity?.value)
      .filter((v): v is number => typeof v === 'number');

    const globalContinuity =
      continuityValues.length > 0
        ? continuityValues.reduce((a, b) => a + b, 0) / continuityValues.length
        : null;

    return {
      templates: mergedTemplates,
      instances,
      globalContinuity,
    };
  }

  /** Optional: get a single public instance by ID (live) */
  getPublicInstance$(id: string) {
    const ref = doc(
      this.firestore,
      `workspaces/default/ecosystem_instances/${id}`,
    );
    return docData(ref, { idField: 'id' }) as any;
  }
}
