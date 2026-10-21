import { Routes } from '@angular/router';

export const CREW_ROUTES: Routes = [
  {
    path: 'FIRST',
    title: 'TideCrew · FIRST Robotics',
    loadComponent: () => import('./first/first').then((m) => m.First),
  },
  {
    path: 'game',
    title: 'TideChallenge · Materiales de temporada',
    loadComponent: () => import('./game/game').then((m) => m.Game),
  },
  {
    path: 'game/qa',
    title: 'TideChallenge · Q&A oficial',
    loadComponent: () => import('./game/qa/qa-page').then((m) => m.QaPage),
  },
  {
    path: 'game/admin',
    title: 'TideChallenge · Panel',
    loadComponent: () => import('./game/qa/qa-admin').then((m) => m.QaAdmin),
  },
  // Friendly aliases — Angular paths are case-sensitive.
  { path: 'first', redirectTo: 'FIRST' },
  { path: 'First', redirectTo: 'FIRST' },
  { path: 'team', redirectTo: 'FIRST' },
  { path: 'sponsors', redirectTo: 'FIRST' },
  { path: 'tidechallenge', redirectTo: 'game' },
  { path: 'challenge', redirectTo: 'game' },
];
