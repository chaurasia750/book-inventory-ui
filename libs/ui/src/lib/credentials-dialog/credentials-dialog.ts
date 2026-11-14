import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ButtonComponent } from '../button/button';
import { ModalComponent } from '../modal/modal';

/**
 * Shows a login that was just created or reset: the user id and the temporary password, once, with a copy button. The
 * password lives only in the caller's memory; closing the dialog (the caller then drops the value) is the only way out,
 * so it can never be shown again. Every text comes from the caller, so the dialog holds no hard-coded wording.
 */
@Component({
  selector: 'app-credentials-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="title()" (closed)="closed.emit()">
      <p class="mb-3 text-sm">{{ intro() }}</p>
      <p class="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700" role="alert">{{ warning() }}</p>
      @if (userId()) {
        <div class="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div class="text-xs text-gray-500">{{ userIdLabel() }}</div>
          <code class="select-all text-lg font-semibold text-primary-fg">{{ userId() }}</code>
        </div>
      }
      <div class="mb-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div>
          <div class="text-xs text-gray-500">{{ passwordLabel() }}</div>
          <code class="select-all text-lg font-semibold tracking-wider text-primary-fg">{{ password() }}</code>
        </div>
        <button type="button" (click)="copy()" class="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200">{{ copyLabel() }}</button>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-emerald-600">{{ copied() ? copiedLabel() : '' }}</span>
        <app-button (clicked)="closed.emit()">{{ doneLabel() }}</app-button>
      </div>
    </app-modal>
  `,
})
export class CredentialsDialogComponent {
  open = input(false);
  title = input('');
  intro = input('');
  warning = input('');
  userId = input<string | null>(null);
  userIdLabel = input('');
  password = input('');
  passwordLabel = input('');
  copyLabel = input('');
  copiedLabel = input('');
  doneLabel = input('');

  closed = output<void>();

  readonly copied = signal(false);

  copy(): void {
    void navigator.clipboard.writeText(this.password()).then(() => this.copied.set(true));
  }
}
