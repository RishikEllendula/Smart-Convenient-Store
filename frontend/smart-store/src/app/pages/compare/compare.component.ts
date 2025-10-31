import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ApiService, Item } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-compare',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.css']
})
export class CompareComponent implements OnInit, OnDestroy {
  query = '';
  results: Item[] = [];
  searching = false;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    // React to query param changes
    this.sub = this.route.queryParams
      .pipe(
        map((p: Params) => (p['name'] as string || '').trim()),
        distinctUntilChanged()
      )
      .subscribe(name => {
        this.query = name;
        if (name) this.search(name);
        else this.results = [];
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onEnter(): void {
    this.applyQueryParam(this.query.trim());
  }

  applyQueryParam(name: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: name ? { name } : {},
      queryParamsHandling: 'merge'
    });
  }

  search(name: string): void {
    if (!name) { this.results = []; return; }
    this.searching = true;
    this.api.searchItemsByName(name, true).subscribe({
      next: rows => {
        // Hide items without a known shop name to avoid showing "Unknown shop"
        this.results = (rows || []).filter(r => !!r.shopName);
        this.searching = false;
      },
      error: () => { this.results = []; this.searching = false; }
    });
  }

  shopLabel(it: Item): string {
    return it.shopName as string;
  }

  priceFmt(n: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n||0));
  }

  clear(): void {
    this.query = '';
    this.applyQueryParam('');
    this.results = [];
  }

  reload(): void {
    const q = (this.query || '').trim();
    if (q) this.search(q);
  }
}
