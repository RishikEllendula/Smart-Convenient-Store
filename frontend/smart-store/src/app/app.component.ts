import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from './services/auth.service';
import { routeFade } from './ui/animations';

type Theme = 'ocean' | 'aurora' | 'sunset' | 'forest' | 'peach' | 'lavender';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIf, NgFor],
  animations: [routeFade],
  template: `
  <!-- Background slideshow (pure CSS “images”) -->
  <div class="bg-slideshow" aria-hidden="true">
    <div class="bg-slide"></div>
    <div class="bg-slide"></div>
    <div class="bg-slide"></div>
    <div class="bg-grain"></div>
  </div>

  <div class="app-shell">
    <nav class="nav">
      <a routerLink="/" routerLinkActive="active">Browse</a>
      <a routerLink="/compare" [queryParams]="{name:'Milk'}" routerLinkActive="active">Quick Compare</a>
      <a routerLink="/owner" routerLinkActive="active">Owner</a>

      <span class="spacer"></span>

      <!-- Theme picker -->
      <div style="display:flex;align-items:center;gap:.4rem;">
        <span style="opacity:.8">Theme</span>
        <select #themeSel class="input" style="width:auto;padding:.3rem .5rem"
                [value]="theme" (change)="setThemeFromValue(themeSel.value)">
          <option *ngFor="let t of themes" [value]="t">{{ t }}</option>
        </select>
      </div>

      <!-- Call the signal and alias it -->
      <ng-container *ngIf="auth.user() as u; else guest">
        <span style="margin-left:.75rem;">
          Logged in as: <strong>{{ u.name }}</strong> ({{ u.role }})
        </span>
        <button class="logout" (click)="logout()" style="margin-left:.5rem;">Logout</button>
      </ng-container>
      <ng-template #guest>
        <a routerLink="/login" routerLinkActive="active" style="margin-left:.75rem;">Login/Register</a>
      </ng-template>

    </nav>

    <main class="container">
      <div class="page" [@routeFade]>
        <router-outlet></router-outlet>
      </div>
    </main>
  </div>
  `,
  styles: [`.active{font-weight:600;text-decoration:underline;}`]
})
export class AppComponent {
  themes: Theme[] = ['ocean','aurora','sunset','forest','peach','lavender'];
  theme: Theme = 'ocean';

  constructor(public auth: AuthService, private router: Router) {
    const saved = (localStorage.getItem('theme') as Theme) || 'ocean';
    this.setTheme(saved);
  }

  setThemeFromValue(value: string): void {
    const t = value as Theme;
    if (this.themes.includes(t)) this.setTheme(t);
  }

  setTheme(t: Theme) {
    this.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
