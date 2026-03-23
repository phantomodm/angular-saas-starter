import { Routes } from '@angular/router';

export const CONTINUITY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/overview-page/overview-page').then(
            (m) => m.OverviewPage,
          ),
      },
      {
        path: 'dashboard2',
        loadComponent: () =>
          import('../pages/dashboard/dashboard-material').then(
            (m) => m.DashboardMaterial,
          ),
      },
      {
        path: 'order-book',
        loadComponent: () =>
          import('./pages/order-book-sim/order-book-sim').then(
            (m) => m.OrderBookSim,
          ),
      },
      {
        path: 'nodes',
        loadComponent: () =>
          import('./pages/node-attribution/node-attribution').then(
            (m) => m.NodeAttribution,
          ),
      },
      {
        path: 'collapse',
        loadComponent: () =>
          import('./pages/collapse-alerts/collapse-alerts').then(
            (m) => m.CollapseAlerts,
          ),
      },
      {
        path: 'header',
        loadComponent: () =>
          import('./pages/header/header').then((m) => m.Header),
      },
      {
        path: 'regimes',
        loadComponent: () =>
          import('./pages/regime-context/regime-context').then(
            (m) => m.RegimeContext,
          ),
      },
      {
        path: 'trajectory',
        loadComponent: () =>
          import('./pages/trajectory-chart/trajectory-chart').then(
            (m) => m.TrajectoryChart,
          ),
      },
      {
        path: 'kpi-row',
        loadComponent: () =>
          import('./pages/kpi-row/kpi-row').then((m) => m.KpiRow),
      },
      {
        path: 'kpi-card',
        loadComponent: () =>
          import('./pages/kpi-card/kpi-card').then((m) => m.KpiCard),
      },
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
    ],
  },
];
