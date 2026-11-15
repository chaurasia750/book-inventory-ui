import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LedgerService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { OutstandingPage } from '@org/shared-models';
import { ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectSelectedId } from '@org/ui';
import { LedgerStatementComponent } from './ledger-statement';

const PAGE_SIZE = 20;

/**
 * The school ledger and the vendor ledger lists (finance spec R11, R16), each opened from its own menu (Schools, Vendors): every party with a
 * non-zero balance, largest first, with the total of the list, searchable and paged. A party's statement opens in the panel
 * beside the list (platform U10). The Owner's only (R13).
 */
@Component({
  selector: 'app-outstanding-list',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, LedgerStatementComponent],
  templateUrl: './outstanding-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutstandingListComponent {
  private readonly ledger = inject(LedgerService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** `schools` or `vendors`, from the route (`ledger/schools`, `ledger/vendors`). */
  readonly party: 'schools' | 'vendors' = inject(ActivatedRoute).snapshot.data['party'] === 'vendors' ? 'vendors' : 'schools';

  readonly selectedId = injectSelectedId();
  readonly hasPanel = computed(() => this.selectedId() !== null);

  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<OutstandingPage | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3];

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openParty(id: string): void {
    void this.router.navigate(['/ledger', this.party, id]);
  }

  closePanel(): void {
    void this.router.navigate(['/ledger', this.party]);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.ledger
      .outstanding(this.party, { search: this.search.value.trim() || undefined, pageIndex: this.page(), pageSize: PAGE_SIZE })
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          this.result.set(result);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadError.set(messageForError(error, this.translate));
        },
      });
  }
}
