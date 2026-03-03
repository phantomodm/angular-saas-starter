import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ContinuityHeatmapPoint } from '../../../core/models/types';
import { Continuity } from '../../../core/services/continuity';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
@Component({
  selector: 'app-node-attribution',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatIconModule,
    NgChartsModule,
    MatPaginatorModule,
  ],
  templateUrl: './node-attribution.html',
  styles: `
    .chart-container {
      height: 350px;
      padding: 12px 0;
    }

    .nodes-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .nodes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px; /* more breathing room */
      align-items: start;
    }

    .nodes-table-card,
    .nodes-chart-card {
      padding: 20px;
    }

    .nodes-header {
      padding: 24px;
    }

    .nodes-title {
      font-size: 24px;
      font-weight: 600;
    }

    .nodes-subtitle {
      opacity: 0.7;
    }

    .nodes-search {
      padding: 16px;
    }

    .nodes-search-field {
      width: 100%;
    }

    .section-title {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    /* Color coding */
    .neg {
      color: #dc2626;
      font-weight: 600;
    }

    .pos {
      color: #16a34a;
      font-weight: 600;
    }
  `,
})
export class NodeAttribution implements OnInit, AfterViewInit {
  private continuityService = inject(Continuity);
  displayedColumns = ['node', 'value', 'timestamp'];
  dataSource = new MatTableDataSource<ContinuityHeatmapPoint>([]);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('paginator') paginator: any;

  attributionData: any = {
    labels: [],
    datasets: [{ label: 'Continuity', data: [], backgroundColor: [] }],
  };
  attributionOptions = {
    indexAxis: 'y', // horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
      y: {
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  constructor() {}

  ngOnInit() {
    this.continuityService.getContinuityHeatmap().then((points) => {
      console.log('Received continuity heatmap points:', points);
      this.dataSource.data = points;
      this.dataSource.filterPredicate = (data, filter) =>
        data.node.toLowerCase().includes(filter);
      this.updateChart(points);
    });
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }
  isPositive(v: number) {
    return v > 0;
  }
  isNegative(v: number) {
    return v < 0;
  }
  updateChart(points: ContinuityHeatmapPoint[]) {
    this.attributionData = {
      labels: points.map((p) => p.node),
      datasets: [
        {
          label: 'Continuity',
          data: points.map((p) => p.value),
          backgroundColor: points.map((p) =>
            p.value < 0 ? '#dc2626' : '#16a34a',
          ),
        },
      ],
    };
  }
}
