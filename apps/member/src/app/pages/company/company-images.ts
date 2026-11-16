import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyImageKind } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const CARD = 'flex flex-col gap-3';
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Company spec R17, R18: the logo and the signature image: a preview, replace (PNG or JPEG up to 2 MB, checked here before the
 * upload and by the API again) and remove. The images need the sign-in, so they are fetched and shown from an object URL.
 */
@Component({
  selector: 'app-company-images',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="card">
      @for (kind of kinds; track kind) {
        <div class="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0 dark:border-charcoal-700">
          <div class="flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-charcoal-700 dark:bg-charcoal-900">
            @if (preview(kind); as url) { <img [src]="url" [alt]="'companyProfile.images.' + kind | translate" class="max-h-full max-w-full object-contain" /> }
            @else { <span class="text-xs text-gray-400">{{ 'companyProfile.images.none' | translate }}</span> }
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="text-sm font-semibold">{{ 'companyProfile.images.' + kind | translate }}</span>
            <span class="text-xs text-gray-500">{{ 'companyProfile.images.hint' | translate }}</span>
            <div class="flex flex-wrap gap-2">
              <label class="inline-flex h-9 cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium hover:bg-neutral-50">
                {{ 'companyProfile.images.choose' | translate }}
                <input type="file" accept="image/png,image/jpeg" class="sr-only" [attr.aria-label]="'companyProfile.images.' + kind | translate" (change)="choose(kind, $any($event.target))" />
              </label>
              @if (preview(kind)) { <app-button size="sm" variant="secondary" (clicked)="remove(kind)">{{ 'companyProfile.images.remove' | translate }}</app-button> }
            </div>
          </div>
        </div>
      }
      @if (message()) { <p class="m-0 text-sm" [class.text-red-600]="isError()" [class.text-green-700]="!isError()" role="status">{{ message() }}</p> }
    </section>
  `,
})
export class CompanyImagesComponent implements OnDestroy {
  readonly companyId = input.required<string>();
  readonly logoUrl = input<string | null>(null);
  readonly signatureUrl = input<string | null>(null);

  /** A picture was saved or removed; the screen reads the settings again so another tab or a later visit shows it. */
  readonly saved = output<void>();

  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  readonly card = CARD;
  readonly kinds: CompanyImageKind[] = ['logo', 'signature'];
  readonly previews = signal<Record<CompanyImageKind, string | null>>({ logo: null, signature: null });
  readonly message = signal('');
  readonly isError = signal(false);

  constructor() {
    effect(() => {
      const logo = this.logoUrl();
      const signature = this.signatureUrl();
      untracked(() => {
        this.load('logo', logo);
        this.load('signature', signature);
      });
    });
  }

  ngOnDestroy(): void {
    this.kinds.forEach((k) => this.setPreview(k, null));
  }

  preview(kind: CompanyImageKind): string | null {
    return this.previews()[kind];
  }

  choose(kind: CompanyImageKind, input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > MAX_BYTES) {
      this.show(this.translate.instant('errors.company.' + kind + '_invalid'), true);
      return;
    }
    this.companies.uploadImage(this.companyId(), kind, file).subscribe({
      next: () => {
        this.setPreview(kind, URL.createObjectURL(file));
        this.show(this.translate.instant('companyProfile.saved'), false);
        this.saved.emit();
      },
      error: (e: unknown) => this.show(messageForError(e, this.translate), true),
    });
  }

  remove(kind: CompanyImageKind): void {
    this.companies.removeImage(this.companyId(), kind).subscribe({
      next: () => {
        this.setPreview(kind, null);
        this.show(this.translate.instant('companyProfile.saved'), false);
        this.saved.emit();
      },
      error: (e: unknown) => this.show(messageForError(e, this.translate), true),
    });
  }

  private load(kind: CompanyImageKind, url: string | null): void {
    if (!url) {
      this.setPreview(kind, null);
      return;
    }
    this.companies.image(url).subscribe({ next: (blob) => this.setPreview(kind, URL.createObjectURL(blob)), error: () => this.setPreview(kind, null) });
  }

  private setPreview(kind: CompanyImageKind, url: string | null): void {
    const old = this.previews()[kind];
    if (old) {
      URL.revokeObjectURL(old);
    }
    this.previews.update((p) => ({ ...p, [kind]: url }));
  }

  private show(text: string, error: boolean): void {
    this.message.set(text);
    this.isError.set(error);
  }
}
