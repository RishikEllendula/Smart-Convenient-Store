import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Item, Shop } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-owner-dashboard',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css']
})
export class OwnerDashboardComponent implements OnInit {
  // Shop being edited
  shop: Partial<Shop> = { _id: '', name: '', address: '' };

  // Items for this shop
  items: Item[] = [];

  // Item form (create/update)
  itemForm: { _id?: string; name: string; price: number | null; unit: string } = {
    name: '', price: null, unit: ''
  };
  editingItemId: string | null = null;

  // UI
  msg = '';
  busy = false;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadMine();
  }

  /* ------------ Loaders ------------ */

  loadMine(): void {
    // Load or create shop stub on first save
    this.api.getMyShop().subscribe({
      next: (s: any) => {
        this.shop = (s && s._id) ? s : { _id: '', name: '', address: '' };
        this.loadItems();
      },
      error: () => { this.shop = { _id: '', name: '', address: '' }; }
    });
  }

  loadItems(): void {
    this.api.listMyItems().subscribe({
      next: rows => { this.items = rows || []; },
      error: () => { this.items = []; }
    });
  }

  /* ------------ Shop ------------ */

  async saveShop(): Promise<void> {
    if (!this.auth.isOwner()) {
      this.flash('You must be logged in as an Owner to save a shop');
      return;
    }
    const token = localStorage.getItem('auth.token');
    if (!token) {
      this.flash('Your session expired. Please log in again.');
      return;
    }

    if (!this.shop.name || !this.shop.address) {
      this.flash('Please fill name and address'); return;
    }
    this.busy = true;
    this.api.upsertMyShop({
      id: this.shop._id || undefined,
      name: this.shop.name!,
      address: this.shop.address!
    }).subscribe({
      next: saved => {
        this.shop = saved;
        this.flash('Shop saved');
      },
      error: (err) => {
        console.error('Save shop failed', err);
        this.flash(err?.error?.message || 'Failed to save shop');
      },
      complete: () => this.busy = false
    });
  }

  /* ------------ Items ------------ */

  editItem(it: Item): void {
    this.editingItemId = it._id;
    this.itemForm = { _id: it._id, name: it.name, price: it.price, unit: it.unit };
  }

  resetItemForm(): void {
    this.editingItemId = null;
    this.itemForm = { name: '', price: null, unit: '' };
  }

  addOrUpdateItem(): void {
    const { name, price, unit } = this.itemForm;
    if (!name || price == null || price < 0 || !unit) {
      this.flash('Fill item name, positive price, and unit'); return;
    }

    // Ensure shop exists before adding items
    if (!this.shop || !this.shop._id) {
      this.flash('Please save your shop details first');
      return;
    }

    this.busy = true;
    if (this.editingItemId) {
      // Update
      this.api.updateItem(this.editingItemId, {
        name, price: Number(price), unit
      }).subscribe({
        next: updated => {
          const idx = this.items.findIndex(x => x._id === updated._id);
          if (idx >= 0) this.items[idx] = updated;
          this.flash('Item updated');
          this.resetItemForm();
        },
        error: (err) => {
          console.error('Update item failed', err);
          this.flash(err?.error?.message || 'Failed to update item');
        },
        complete: () => this.busy = false
      });
    } else {
      // Create
      this.api.createItem({
        name, price: Number(price), unit,
        shopId: this.shop._id as string,
        shop: this.shop._id as string
      }).subscribe({
        next: created => {
          this.items = [...this.items, created].sort((a,b) => a.name.localeCompare(b.name));
          this.flash('Item added');
          this.resetItemForm();
        },
        error: (err) => {
          console.error('Create item failed', err);
          this.flash(err?.error?.message || 'Failed to add item');
        },
        complete: () => this.busy = false
      });
    }
  }

  deleteItem(id: string): void {
    if (!confirm('Delete this item?')) return;
    this.busy = true;
    this.api.deleteItem(id).subscribe({
      next: () => {
        this.items = this.items.filter(x => x._id !== id);
        if (this.editingItemId === id) this.resetItemForm();
        this.flash('Item deleted');
      },
      error: () => this.flash('Failed to delete item'),
      complete: () => this.busy = false
    });
  }

  /* ------------ Helpers ------------ */

  private flash(text: string): void {
    this.msg = text;
    setTimeout(() => { this.msg = ''; }, 1800);
  }
}
