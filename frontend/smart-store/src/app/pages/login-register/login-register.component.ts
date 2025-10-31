import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-login-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.css']
})
export class LoginRegisterComponent {
  mode: 'login' | 'register' = 'login';

  // Register form model
  r = {
    name: '',
    email: '',
    password: '',
    role: 'Customer' as Role
  };

  // Login form model
  l = {
    email: '',
    password: ''
  };

  busy = false;
  msg = '';
  err = '';

  constructor(private auth: AuthService, private router: Router) {}

  switch(mode: 'login'|'register') {
    this.mode = mode;
    this.msg = this.err = '';
  }

  async doRegister(form: NgForm) {
    if (this.busy || !form.valid) return;
    this.busy = true; this.err = ''; this.msg = '';
    try {
      const payload = {
        name: (this.r.name || '').trim(),
        email: (this.r.email || '').trim().toLowerCase(),
        password: (this.r.password || '').trim(),
        role: this.r.role
      };
      await this.auth.register(payload);
      this.msg = 'Registered successfully!';
      await this.router.navigateByUrl(this.r.role === 'Owner' ? '/owner' : '/');
    } catch (e: any) {
      this.err = e?.error?.message || 'Registration failed';
    } finally {
      this.busy = false;
    }
  }

  async doLogin(form: NgForm) {
    if (this.busy || !form.valid) return;
    this.busy = true; this.err = ''; this.msg = '';
    try {
      const creds = {
        email: (this.l.email || '').trim().toLowerCase(),
        password: (this.l.password || '').trim()
      };
      await this.auth.login(creds);
      this.msg = 'Logged in!';
      // After login, send owners to dashboard, customers to home
      const go = this.auth.isOwner() ? '/owner' : '/';
      await this.router.navigateByUrl(go);
    } catch (e: any) {
      this.err = e?.error?.message || 'Login failed';
    } finally {
      this.busy = false;
    }
  }
}
