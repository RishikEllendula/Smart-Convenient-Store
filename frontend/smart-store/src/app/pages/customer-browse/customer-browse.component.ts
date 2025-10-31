import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Shop, Item } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-customer-browse',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-browse.component.html',
  styleUrls: ['./customer-browse.component.css']
})
export class CustomerBrowseComponent implements OnInit {

  // Data
  shops: Shop[] = [];
  itemsOfSelected: Item[] = [];

  // UI state
  selectedShopId: string | null = null;

  // Search
  searchName = '';
  searchResults: Item[] = [];
  searching = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadShops();
  }

  /* ---------- Loaders ---------- */

  loadShops(): void {
    this.api.listShops().subscribe({
      next: (rows) => {
        this.shops = rows || [];
        // If no selection yet, pick first shop (if exists)
        if (!this.selectedShopId && this.shops.length) {
          this.selectShop(this.shops[0]._id);
        }
      },
      error: () => { this.shops = []; }
    });
  }

  loadItemsForShop(shopId: string): void {
    this.api.listItemsOfShop(shopId).subscribe({
      next: (rows) => { this.itemsOfSelected = rows || []; },
      error: () => { this.itemsOfSelected = []; }
    });
  }

  /* ---------- Actions ---------- */

  reloadAll(): void {
    this.selectedShopId = null;
    this.itemsOfSelected = [];
    this.loadShops();
  }

  reloadSelected(): void {
    if (this.selectedShopId) this.loadItemsForShop(this.selectedShopId);
  }

  selectShop(shopId: string): void {
    if (this.selectedShopId === shopId) return;
    this.selectedShopId = shopId;
    this.loadItemsForShop(shopId);
  }

  clearSelection(): void {
    this.selectedShopId = null;
    this.itemsOfSelected = [];
  }

  search(): void {
    const name = (this.searchName || '').trim();
    if (!name) { this.searchResults = []; return; }
    this.searching = true;
    this.api.searchItemsByName(name, true).subscribe({
      next: (rows) => { this.searchResults = rows || []; this.searching = false; },
      error: () => { this.searchResults = []; this.searching = false; }
    });
  }

  /* ---------- Template helpers (avoid complex expressions in HTML) ---------- */

  selectedShop(): Shop | null {
    if (!this.selectedShopId) return null;
    for (const s of this.shops) if (s._id === this.selectedShopId) return s;
    return null;
  }

  selectedShopName(): string {
    const s = this.selectedShop();
    return s ? s.name : '';
  }

  selectedShopAddress(): string {
    const s = this.selectedShop();
    return s ? s.address : '';
  }

  hasShops(): boolean {
    return this.shops && this.shops.length > 0;
  }

  hasItems(): boolean {
    return this.itemsOfSelected && this.itemsOfSelected.length > 0;
  }
}
