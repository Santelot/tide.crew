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
  // Friendly aliases — Angular paths are case-sensitive.
  { path: 'first', redirectTo: 'FIRST' },
  { path: 'First', redirectTo: 'FIRST' },
  { path: 'team', redirectTo: 'FIRST' },
  { path: 'sponsors', redirectTo: 'FIRST' },
  { path: 'tidechallenge', redirectTo: 'game' },
  { path: 'challenge', redirectTo: 'game' },
];
