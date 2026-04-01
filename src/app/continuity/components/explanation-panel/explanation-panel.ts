import { Component } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'ce-explanation-panel',
  standalone: true,
  imports: [MatExpansionModule],
  templateUrl: './explanation-panel.html',
  styles: `
    .explanation-accordion {
      margin-top: 16px;
    }

    .explanation-block {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 13px;
      opacity: 0.85;
    }
  `,
})
export class ExplanationPanelComponent {}
