import { animate, style, transition, trigger } from '@angular/animations';

export const routeFade = trigger('routeFade', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))
  ])
]);
