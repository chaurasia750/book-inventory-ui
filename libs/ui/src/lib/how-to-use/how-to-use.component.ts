import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from '@org/api-services';

@Component({
  selector: 'app-how-to-use',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Hero -->
      <div class="relative overflow-hidden rounded-2xl border border-saffron-200 bg-gradient-to-br from-saffron-600 via-saffron-500 to-amber-500 px-6 py-8 text-center">
        <div class="pointer-events-none absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 80%, white 0, transparent 40%);">
        </div>
        <div class="relative">
          <h1 class="text-xl font-bold text-white sm:text-2xl">How to Use This Application</h1>
          <p class="mx-auto mt-2 max-w-xl text-sm text-white/80">Everything you need to know to get started.</p>
        </div>
      </div>

      <!-- Quick steps -->
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-500 text-sm font-bold text-white">1</span>
          <h3 class="mt-3 text-sm font-semibold text-gray-900">Register &amp; Login</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-500">Create your account and log in to your member dashboard. Keep your referral link handy to invite others.</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-500 text-sm font-bold text-white">2</span>
          <h3 class="mt-3 text-sm font-semibold text-gray-900">Activate With Your Subscription</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-500">Pay a one-time subscription of <span class="font-semibold text-saffron-700">&#8377;5,000</span> to become an active member. Only active members earn rewards.</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-500 text-sm font-bold text-white">3</span>
          <h3 class="mt-3 text-sm font-semibold text-gray-900">Build Your Team</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-500">Share your referral link and add new members. As your team grows through the levels, you unlock rewards.</p>
        </div>
      </div>

      <!-- Activation rules -->
      <div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 ring-1 ring-amber-200/60">
            <svg class="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </span>
          <h2 class="text-base font-semibold text-gray-900">Important &#8212; Only Active Members Count</h2>
        </div>
        <ul class="mt-3 space-y-2 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </span>
            <span><span class="font-semibold">Activate yourself:</span> you must pay the &#8377;5,000 subscription to become an active member.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </span>
            <span><span class="font-semibold">New members must subscribe too:</span> every member you add also needs to pay the &#8377;5,000 subscription to get activated.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </span>
            <span><span class="font-semibold">Only active members count</span> toward your level targets and rewards.</span>
          </li>
        </ul>
      </div>

      <!-- CTA -->
      <div class="flex justify-center pt-2">
        @if (hasNoOrder() === true) {
          <a [routerLink]="orderLink()"
            class="inline-flex items-center gap-2 rounded-xl bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-saffron-600 hover:shadow-md no-underline">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Buy Your Subscription
          </a>
        } @else if (hasNoOrder() === false) {
          <a [routerLink]="networkLink()"
            class="inline-flex items-center gap-2 rounded-xl bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-saffron-600 hover:shadow-md no-underline">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Join Network
          </a>
        } @else {
          <button disabled
            class="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-gray-300 px-5 py-2.5 text-sm font-semibold text-white">
            Loading&#8230;
          </button>
        }
      </div>
    </div>
  `,
})
export class HowToUseComponent {
  readonly memberId = input<string | null>(null);
  readonly orderLink = input<string>('/orders/new');
  readonly networkLink = input<string>('/sponsor-new');

  private readonly orderService = inject(OrderService);

  readonly hasNoOrder = signal<boolean | null>(null);

  constructor() {
    effect(() => {
      this.orderService.hasNoPurchasedOrder(this.memberId() ?? undefined).subscribe({
        next: (noOrder) => this.hasNoOrder.set(noOrder),
        error: () => this.hasNoOrder.set(false),
      });
    });
  }
}
