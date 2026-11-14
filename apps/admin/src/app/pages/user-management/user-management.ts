import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { IamUsersService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  ACCOUNT_STATUSES,
  AccountStatus,
  AppRole,
  COMPANY_ROLES,
  CreatedStaff,
  PagedList,
  STAFF_ASSIGNABLE_ROLES,
  UserSummary,
} from '@org/shared-models';
import { avatarColorClass, accountStatusBadgeClass, initials } from '@org/shared-utils';
import { ButtonComponent, CardComponent, ModalComponent, PaginationComponent, SkeletonLoaderComponent } from '@org/ui';

const PAGE_SIZE = 20;

/**
 * Super Admin user list (spec R38): search over name, user name, e-mail and mobile, role / status / locked filters,
 * sort by created date or last login, paging, and the create-staff dialog that shows the temporary password once (R57).
 * Every text comes from the message catalogue; a failure shows the catalogue text of the API's error code.
 */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TranslatePipe,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './user-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent {
  private readonly users = inject(IamUsersService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles: readonly AppRole[] = [...STAFF_ASSIGNABLE_ROLES, 'MEMBER', ...COMPANY_ROLES];
  readonly statuses = ACCOUNT_STATUSES;
  readonly staffRoles = STAFF_ASSIGNABLE_ROLES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly role = signal<AppRole | ''>('');
  readonly status = signal<AccountStatus | ''>('');
  readonly locked = signal<'' | 'true' | 'false'>('');
  readonly orderBy = signal<'CreatedAt DESC' | 'LastLoginAt DESC'>('CreatedAt DESC');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<UserSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5];

  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly created = signal<CreatedStaff | null>(null);
  readonly copied = signal(false);

  readonly createForm = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(32)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    mobile: new FormControl('', { nonNullable: true }),
    role: new FormControl<AppRole>('SALES_CRM', { nonNullable: true, validators: [Validators.required] }),
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

  setRole(value: string): void {
    this.role.set(value as AppRole | '');
    this.applyFilters();
  }

  setStatus(value: string): void {
    this.status.set(value as AccountStatus | '');
    this.applyFilters();
  }

  setLocked(value: string): void {
    this.locked.set(value as '' | 'true' | 'false');
    this.applyFilters();
  }

  setOrder(value: string): void {
    this.orderBy.set(value as 'CreatedAt DESC' | 'LastLoginAt DESC');
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  open(user: UserSummary): void {
    void this.router.navigate(['/users', user.id]);
  }

  avatarInitials(fullName: string): string {
    return initials(fullName);
  }

  avatarClass(fullName: string): string {
    return avatarColorClass(fullName);
  }

  statusClass(status: AccountStatus): string {
    return accountStatusBadgeClass(status);
  }

  openCreate(): void {
    this.createForm.reset({ fullName: '', userName: '', email: '', mobile: '', role: 'SALES_CRM' });
    this.createError.set('');
    this.createOpen.set(true);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { fullName, userName, email, mobile, role } = this.createForm.getRawValue();
    this.creating.set(true);
    this.createError.set('');
    this.users.create({ fullName: fullName.trim(), userName: userName.trim(), email: email.trim(), mobile: mobile.trim() || undefined, role }).subscribe({
      next: (created) => {
        this.creating.set(false);
        this.createOpen.set(false);
        this.copied.set(false);
        this.created.set(created);
        this.load();
      },
      error: (error: unknown) => {
        this.creating.set(false);
        this.createError.set(messageForError(error, this.translate));
      },
    });
  }

  /** R57: the password is shown here once; closing the dialog drops it from memory. */
  closeCreated(): void {
    this.created.set(null);
  }

  copyPassword(): void {
    const password = this.created()?.temporaryPassword;
    if (!password) return;
    void navigator.clipboard.writeText(password).then(() => this.copied.set(true));
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.users
      .list({
        search: this.search.value.trim() || undefined,
        role: this.role() || undefined,
        status: this.status() || undefined,
        isLocked: this.locked() === '' ? undefined : this.locked() === 'true',
        orderBy: this.orderBy(),
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
