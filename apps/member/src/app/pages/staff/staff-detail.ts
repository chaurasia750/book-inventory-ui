import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { StaffService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AccountStatus, TemporaryPasswordResponse, UserDetail, UserSessionItem } from '@org/shared-models';
import { accountStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CredentialsDialogComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';

/**
 * One Staff account of the Owner's company (iam spec R66, R67): details, the sessions that are still usable, and the
 * actions deactivate (with a reason), reactivate, unlock, log out everywhere and reset the password, which shows the
 * new temporary password once. A Staff account of another company answers 404 from the API and shows the error state.
 */
@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    SkeletonLoaderComponent,
    CredentialsDialogComponent,
  ],
  templateUrl: './staff-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly staff = inject(StaffService);
  private readonly translate = inject(TranslateService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly user = signal<UserDetail | null>(null);
  readonly sessions = signal<UserSessionItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly acting = signal(false);
  readonly actionError = signal('');
  readonly deactivateOpen = signal(false);
  readonly reasonControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)] });
  readonly reset = signal<TemporaryPasswordResponse | null>(null);

  constructor() {
    this.load();
  }

  statusClass(status: AccountStatus): string {
    return accountStatusBadgeClass(status);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    forkJoin({ user: this.staff.get(this.id), sessions: this.staff.sessions(this.id) }).subscribe({
      next: ({ user, sessions }) => {
        this.loading.set(false);
        this.user.set(user);
        this.sessions.set(sessions);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  openDeactivate(): void {
    this.reasonControl.reset('');
    this.actionError.set('');
    this.deactivateOpen.set(true);
  }

  submitDeactivate(): void {
    if (this.reasonControl.invalid || this.acting()) {
      this.reasonControl.markAsTouched();
      return;
    }

    this.run(this.staff.deactivate(this.id, { reason: this.reasonControl.value.trim() }), () => this.deactivateOpen.set(false));
  }

  activate(): void {
    this.run(this.staff.activate(this.id));
  }

  unlock(): void {
    this.run(this.staff.unlock(this.id));
  }

  forceLogout(): void {
    this.run(this.staff.forceLogout(this.id));
  }

  resetPassword(): void {
    if (this.acting()) return;
    this.acting.set(true);
    this.actionError.set('');
    this.staff.resetPassword(this.id).subscribe({
      next: (response) => {
        this.acting.set(false);
        this.reset.set(response);
        this.load();
      },
      error: (error: unknown) => {
        this.acting.set(false);
        this.actionError.set(messageForError(error, this.translate));
      },
    });
  }

  /** R67: the password is shown once; closing the dialog drops it from memory. */
  closeReset(): void {
    this.reset.set(null);
  }

  private run(call: ReturnType<StaffService['activate']>, onDone?: () => void): void {
    this.acting.set(true);
    this.actionError.set('');
    call.subscribe({
      next: () => {
        this.acting.set(false);
        onDone?.();
        this.load();
      },
      error: (error: unknown) => {
        this.acting.set(false);
        this.actionError.set(messageForError(error, this.translate));
      },
    });
  }
}
