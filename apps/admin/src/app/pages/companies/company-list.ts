import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { COMPANY_STATUSES, CompanyStatus, CompanySummary, CreatedCompany, PagedList } from '@org/shared-models';
import { companyStatusBadgeClass } from '@org/shared-utils';
import {
  ButtonComponent,
  ListDetailComponent,
  injectSelectedId,
  CredentialsDialogComponent,
  ModalComponent,
  PaginationComponent,
  SkeletonLoaderComponent,
} from '@org/ui';

import { CompanyDetailComponent } from './company-detail';

const PAGE_SIZE = 20;

/**
 * Super Admin company list (company spec R9): search by name, status filter, paging, and the create dialog that shows
 * the Owner's user id and temporary password once (R4). Every text comes from the message catalogue; a failure shows the
 * catalogue text of the API's error code.
 */
@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TranslatePipe,
    ButtonComponent,
    ListDetailComponent,
    CompanyDetailComponent,
    ModalComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    CredentialsDialogComponent,
  ],
  templateUrl: './company-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListComponent {
  private readonly companies = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Platform U10: the company open beside the list (child route `:id`), or null. */
  readonly selectedId = injectSelectedId();
  readonly hasPanel = computed(() => this.selectedId() !== null);

  readonly statuses = COMPANY_STATUSES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<CompanyStatus | ''>('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<CompanySummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly created = signal<CreatedCompany | null>(null);

  readonly createForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(150)] }),
    ownerName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    state: new FormControl('', { nonNullable: true }),
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
    this.status.set(value as CompanyStatus | '');
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  open(company: CompanySummary): void {
    void this.router.navigate(['/companies', company.id]);
  }

  closePanel(): void {
    void this.router.navigate(['/companies']);
  }

  reload(): void {
    this.load();
  }

  statusClass(status: CompanyStatus): string {
    return companyStatusBadgeClass(status);
  }

  openCreate(): void {
    this.createForm.reset({ name: '', ownerName: '', state: '' });
    this.createError.set('');
    this.createOpen.set(true);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { name, ownerName, state } = this.createForm.getRawValue();
    this.creating.set(true);
    this.createError.set('');
    this.companies.create({ name: name.trim(), state: state.trim() || undefined, owner: { fullName: ownerName.trim() } }).subscribe({
      next: (created) => {
        this.creating.set(false);
        this.createOpen.set(false);
        this.created.set(created);
        this.load();
      },
      error: (error: unknown) => {
        this.creating.set(false);
        this.createError.set(messageForError(error, this.translate));
      },
    });
  }

  /** R4: the password is shown once; closing the dialog drops it from memory. */
  closeCreated(): void {
    this.created.set(null);
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.companies
      .list({
        search: this.search.value.trim() || undefined,
        status: this.status() || undefined,
        orderBy: 'Name ASC',
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
