import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  template: `
  <section class="container">
    <div class="page fade-in">
      <h1 style="margin-bottom:.25rem;">Smart Convenient Stores</h1>
      <p style="opacity:.9; margin:0 0 1rem;">
        Compare prices across nearby stores, manage your shop inventory, and shop smarter.
      </p>

      <div class="card" style="margin-top:1rem;">
        <h2>What you can do</h2>
        <ul style="line-height:1.6; margin: .5rem 0 0 1.2rem;">
          <li><strong>Register & Login</strong> as a <em>Customer</em> or an <em>Owner</em>.</li>
          <li><strong>Shop Owners</strong>: Create your shop and manage items (name, price, unit).</li>
          <li><strong>Customers</strong>: Browse shops and view their item lists.</li>
          <li><strong>Compare</strong>: Enter an item name (e.g. “Milk”) to compare prices across shops.</li>
        </ul>
      </div>

      <div class="card" style="margin-top:1rem;">
        <h2>Quick actions</h2>
        <div style="display:flex; gap:.6rem; flex-wrap:wrap; margin-top:.5rem;">
          <a class="btn" routerLink="/login">Login / Register</a>
          <a class="btn secondary" routerLink="/browse">Browse Shops</a>
          <a class="btn secondary" routerLink="/compare" [queryParams]="{name:'Milk'}">Try Compare: Milk</a>
          <a class="btn secondary" routerLink="/owner">Owner Dashboard</a>
        </div>
      </div>

      <!-- Footer -->
      <footer style="margin-top:1.25rem; border-top:1px solid rgba(255,255,255,.12); padding-top:1rem;">
        <div style="display:grid; gap:.75rem;">
          <div>
            <h3 style="margin-bottom:.25rem;">About Us</h3>
            <p style="opacity:.9; margin:0;">
              Smart Convenient Stores is a demo project built with Angular + Node + MongoDB.
              It showcases multi-role auth, inventory management, and price comparison.
            </p>
          </div>
          <div>
            <h3 style="margin-bottom:.25rem;">Contact Us</h3>
            <p style="margin:0; opacity:.9;">
              Email: <a href="mailto:hello@smartstores.local">hello@smartstores.local</a> &nbsp;|&nbsp;
              Phone: <a href="tel:+910000000000">+91 00000 00000</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  </section>
  `
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
