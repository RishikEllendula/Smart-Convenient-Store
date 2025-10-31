import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export type Shop = { _id: string; name: string; address: string };
export type Item = { _id: string; name: string; price: number; unit: string; shopName: string; shopId: string };

@Injectable({ providedIn: 'root' })
export class PublicDataService {
  private API = '/api';
  constructor(private http: HttpClient) {}

  getShops() {
    return this.http.get<Shop[]>(`${this.API}/shops`);
  }
  getItemsByShop(shopId: string) {
    return this.http.get<Item[]>(`${this.API}/items/by-shop/${shopId}`);
  }
  searchItems(name: string, fuzzy = true) {
    const params = new HttpParams().set('name', name).set('fuzzy', fuzzy ? '1' : '');
    return this.http.get<Item[]>(`${this.API}/items`, { params });
  }
  compareExact(name: string) {
    const params = new HttpParams().set('name', name);
    return this.http.get<Item[]>(`${this.API}/items/compare`, { params });
  }
}
