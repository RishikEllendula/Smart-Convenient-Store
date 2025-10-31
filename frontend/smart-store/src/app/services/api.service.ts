import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/* ---------- Shared types ---------- */
export type Role = 'Owner' | 'Customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Shop {
  _id: string;
  name: string;
  address: string;
  ownerId?: string;
}

export interface Item {
  _id: string;
  shopId: string;
  shopName?: string;
  name: string;
  price: number;
  unit: string;
}

/* ---------- API service ---------- */
@Injectable({ providedIn: 'root' })
export class ApiService {
  // Using Angular proxy.conf.json -> /api → http://localhost:4000
  private api = 'https://smart-convenient-store.onrender.com/api';

  constructor(private http: HttpClient) {}

  /* ====== Auth ====== */

  register(payload: { name: string; email: string; password: string; role: Role }):
    Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.api}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }):
    Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.api}/auth/login`, payload);
  }

  /* ====== Owner (requires Bearer token) ====== */

  getMyShop(): Observable<Shop | {}> {
    return this.http.get<Shop | {}>(`${this.api}/shops/me`, { headers: this.authHeaders() });
  }

  // Backend uses POST /api/shops for create & update (upsert)
  upsertMyShop(data: { name: string; address: string; id?: string }): Observable<Shop> {
    return this.http.post<Shop>(
      `${this.api}/shops`,
      { name: data.name, address: data.address },
      { headers: this.authHeaders() }
    );
  }

  listMyItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.api}/items/mine`, { headers: this.authHeaders() });
  }

  createItem(payload: { name: string; price: number; unit: string; shopId?: string; shop?: string }): Observable<Item> {
    return this.http.post<Item>(`${this.api}/items`, payload, { headers: this.authHeaders() });
  }

  updateItem(id: string, payload: { name: string; price: number; unit: string }): Observable<Item> {
    return this.http.put<Item>(`${this.api}/items/${id}`, payload, { headers: this.authHeaders() });
  }

  deleteItem(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.api}/items/${id}`, { headers: this.authHeaders() });
  }

  /* ====== Public (no auth) ====== */

  // List all shops (name + address + _id)
  listShops(): Observable<Shop[]> {
    return this.http.get<Shop[]>(`${this.api}/shops`);
  }

  // Items inside a specific shop (backend: GET /api/items/by-shop/:shopId)
  listItemsOfShop(shopId: string): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.api}/items/by-shop/${shopId}`);
  }

  // Fuzzy search by name across shops (backend: GET /api/items?name=...&fuzzy=1)
  searchItemsByName(name: string, insensitive = true): Observable<Item[]> {
    let params = new HttpParams().set('name', name);
    if (insensitive) params = params.set('fuzzy', '1');
    return this.http.get<Partial<Item>[]>(`${this.api}/items`, { params }).pipe(
      map(rows => (rows || []).map(r => ({
        _id: r._id as string,
        shopId: (r as any).shopId as string,
        shopName: r.shopName as string | undefined,
        // If backend didn’t send name, fill it from the query to avoid template errors
        name: (r as any).name ?? name,
        price: Number(r.price ?? 0),
        unit: (r.unit as string) ?? ''
      })))
    );
  }

  // Exact-name compare across shops (backend: GET /api/items/compare?name=...)
  compareExact(name: string): Observable<Item[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Item[]>(`${this.api}/items/compare`, { params });
  }

  /* ====== Helpers ====== */

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth.token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
