import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StaffService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ACCOUNT_STATUSES, AccountStatus, CreatedCompanyStaff, PagedList, UserSummary } from '@org/shared-models';
import { accountStatusBadgeClass } from '@org/shared-utils';
import {
  ButtonComponent,
  ListDetailComponent,
  injectSelectedId,
  CredentialsDialogComponent,
  ModalComponent,
  PaginationComponent,
  SkeletonLoaderComponent,
} from '@org/ui';

import { StaffDetailComponent } from './staff-detail';

const PAGE_SIZE = 20;

/** The statuses a Staff account can be in (a Staff is never pending, suspended or rejected today). */
const STAFF_FILTER_STATUSES = ACCOUNT_STATUSES.filter((s) => s === 'ACTIVE' || s === 'INACTIVE');

/**
 * The Owner's list of their company's Staff (iam spec R65, R66): search, status filter, paging, and the add dialog that
 * shows the new login once (R57). The company is the Owner's own, taken by the server from the session; nothing here
 * can ask for another company's Staff.
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TranslatePipe,
    ButtonComponent,
    ListDetailComponent,
    StaffDetailComponent,
    ModalComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    CredentialsDialogComponent,
  ],
  templateUrl: './staff-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffListComponent {
  private readonly staff = inject(StaffService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Platform U10: the Staff account open beside the list (child route `:id`), or null. */
  readonly selectedId = injectSelectedId();
  readonly hasPanel = computed(() => this.selectedId() !== null);

  readonly statuses = STAFF_FILTER_STATUSES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<AccountStatus | ''>('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<UserSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly addOpen = signal(false);
  readonly adding = signal(false);
  readonly addError = signal('');
  readonly created = signal<CreatedCompanyStaff | null>(null);

  readonly addForm = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    shortName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{2,20}$/)] }),
  });

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  setStatus(value: string): void {
    this.status.set(value as AccountStatus | '');
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  open(user: UserSummary): void {
    void this.router.navigate(['/staff', user.id]);
  }

  closePanel(): void {
    void this.router.navigate(['/staff']);
  }

  reload(): void {
    this.load();
  }

  statusClass(status: AccountStatus): string {
    return accountStatusBadgeClass(status);
  }

  openAdd(): void {
    this.addForm.reset({ fullName: '', shortName: '' });
    this.addError.set('');
    this.addOpen.set(true);
  }

  submitAdd(): void {
    if (this.addForm.invalid || this.adding()) {
      this.addForm.markAllAsTouched();
      return;
    }

    const { fullName, shortName } = this.addForm.getRawValue();
    this.adding.set(true);
    this.addError.set('');
    this.staff.add({ fullName: fullName.trim(), shortName: shortName.trim() }).subscribe({
      next: (created) => {
        this.adding.set(false);
        this.addOpen.set(false);
        this.created.set(created);
        this.load();
      },
      error: (error: unknown) => {
        this.adding.set(false);
        this.addError.set(messageForError(error, this.translate));
      },
    });
  }

  /** R57: the password is shown once; closing the dialog drops it from memory. */
  closeCreated(): void {
    this.created.set(null);
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.staff
      .list({
        search: this.search.value.trim() || undefined,
        status: this.status() || undefined,
        orderBy: 'CreatedAt DESC',
        pageIndex: this.page(),
        pageSize: PAGE_SIZE,
      })
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
