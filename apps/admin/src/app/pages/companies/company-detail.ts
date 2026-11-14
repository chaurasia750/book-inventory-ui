import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyDetail, CompanyFields, CompanyStatus } from '@org/shared-models';
import { accountStatusBadgeClass, companyStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';

type StatusDialog = 'deactivate' | 'activate';

/**
 * The company page of the Super Admin (company spec R7-R9, R11): master data with an edit dialog, the status with its
 * reason, deactivate and reactivate dialogs, the status timeline and the company's accounts with a link to the existing
 * user page. Every text comes from the message catalogue; a failure shows the catalogue text of the API's error code.
 */
@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonComponent,
    CardComponent,
    CloseButtonComponent,
    ModalComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './company-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDetailComponent {
  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  /** The company open beside the list (platform U10); a new id loads that record. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** Something the list shows (name, status) changed: the list reloads. */
  readonly changed = output<void>();

  readonly company = signal<CompanyDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly editOpen = signal(false);
  readonly saving = signal(false);
  readonly editError = signal('');
  readonly editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(150)] }),
    address: new FormControl('', { nonNullable: true }),
    mobile: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    gstin: new FormControl('', { nonNullable: true }),
    pan: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    tagline: new FormControl('', { nonNullable: true }),
  });

  readonly dialog = signal<StatusDialog | null>(null);
  readonly acting = signal(false);
  readonly actionError = signal('');
  readonly reasonControl = new FormControl('', { nonNullable: true, validators: [Validators.minLength(5), Validators.maxLength(500)] });

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  statusClass(status: CompanyStatus): string {
    return companyStatusBadgeClass(status);
  }

  accountStatusClass(status: Parameters<typeof accountStatusBadgeClass>[0]): string {
    return accountStatusBadgeClass(status);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.companies.get(this.id()).subscribe({
      next: (company) => {
        this.loading.set(false);
        this.company.set(company);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  openEdit(company: CompanyDetail): void {
    this.editForm.reset({
      name: company.name,
      address: company.address ?? '',
      mobile: company.mobile ?? '',
      email: company.email ?? '',
      gstin: company.gstin ?? '',
      pan: company.pan ?? '',
      state: company.state ?? '',
      tagline: company.tagline ?? '',
    });
    this.editError.set('');
    this.editOpen.set(true);
  }

  submitEdit(): void {
    if (this.editForm.invalid || this.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const v = this.editForm.getRawValue();
    const request: CompanyFields = {
      name: v.name.trim(),
      address: v.address.trim(),
      mobile: v.mobile.trim(),
      email: v.email.trim(),
      gstin: v.gstin.trim(),
      pan: v.pan.trim(),
      state: v.state.trim(),
      tagline: v.tagline.trim(),
    };
    this.saving.set(true);
    this.editError.set('');
    this.companies.edit(this.id(), request).subscribe({
      next: () => {
        this.saving.set(false);
        this.editOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.editError.set(messageForError(error, this.translate));
      },
    });
  }

  openStatus(kind: StatusDialog): void {
    this.reasonControl.setValidators(kind === 'deactivate' ? [Validators.required, Validators.minLength(5), Validators.maxLength(500)] : [Validators.maxLength(500)]);
    this.reasonControl.reset('');
    this.actionError.set('');
    this.dialog.set(kind);
  }

  submitStatus(): void {
    const kind = this.dialog();
    if (!kind || this.reasonControl.invalid || this.acting()) {
      this.reasonControl.markAsTouched();
      return;
    }

    const text = this.reasonControl.value.trim();
    this.acting.set(true);
    this.actionError.set('');
    const call = kind === 'deactivate' ? this.companies.deactivate(this.id(), text) : this.companies.activate(this.id(), text || undefined);
    call.subscribe({
      next: () => {
        this.acting.set(false);
        this.dialog.set(null);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.acting.set(false);
        this.actionError.set(messageForError(error, this.translate));
      },
    });
  }
}
