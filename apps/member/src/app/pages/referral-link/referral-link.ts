import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MemberProfileService, MemberProfile } from '@org/api-services';
import { LoadingSpinnerComponent } from '@org/ui';

@Component({
  selector: 'app-referral-link',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Referral Link</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Share your referral link with others</p>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/[0.03]">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Referral Link</h3>
          <div class="flex gap-3">
            <input
              type="text"
              [value]="referralUrl()"
              readonly
              class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              (click)="copyLink()"
              class="inline-flex items-center gap-2 rounded-lg bg-saffron-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-saffron-600 transition-colors"
            >
              @if (copied()) {
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied
              } @else {
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              }
            </button>
          </div>
          @if (profile()) {
            <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Registration No: <span class="font-medium text-gray-700 dark:text-gray-300">{{ profile()?.registrationNumber || '—' }}</span>
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class ReferralLinkComponent implements OnInit {
  private readonly profileService = inject(MemberProfileService);

  readonly profile = signal<MemberProfile | null>(null);
  readonly loading = signal(true);
  readonly copied = signal(false);
  readonly referralUrl = signal('');

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        const regNo = profile.registrationNumber || '';
        this.referralUrl.set(`${window.location.origin}/signup?sponsor=${encodeURIComponent(regNo)}`);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.referralUrl()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
