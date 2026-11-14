import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@org/auth';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggle()"
        class="flex items-center gap-2 pl-0.5">
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-black overflow-hidden shrink-0">
          @if (profileImageUrl()) {
            <img [src]="profileImageUrl()" class="h-full w-full object-cover" />
          } @else {
            {{ initials() }}
          }
        </span>
        <div class="hidden text-left xl:block">
          <p class="text-xs font-semibold text-primary-fg leading-tight">{{ userName() }}</p>
          <p class="text-[10px] text-secondary-fg leading-tight">{{ email() || displayLoginId() }}</p>
        </div>
        <svg class="hidden h-3 w-3 text-secondary-fg xl:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      @if (isOpen()) {
        <div class="absolute right-0 top-full z-[1100] mt-2 w-48 rounded-xl border border-default bg-surface py-2 shadow-elevated sm:w-56">
          @if (auth.user()?.lastLoginAt; as signedIn) {
            <p class="px-4 pb-1 text-[11px] text-secondary-fg">Signed in {{ signedIn | date: 'medium' }}</p>
          }
          <a routerLink="/profile" class="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-fg hover:bg-surface-hover hover:text-primary-fg transition-colors">My profile</a>
          <a routerLink="/sessions" class="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-fg hover:bg-surface-hover hover:text-primary-fg transition-colors">My sessions</a>
          <a routerLink="/login-history" class="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-fg hover:bg-surface-hover hover:text-primary-fg transition-colors">Login history</a>
          <a [routerLink]="changePasswordRoute()" class="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-fg hover:bg-surface-hover hover:text-primary-fg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Change Password
          </a>
          <div class="my-1 border-t border-default"></div>
          <button
            type="button"
            (click)="onSignOut()"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      }
    </div>
  `,
})
export class UserDropdownComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly auth = inject(AuthService);

  readonly userName = input('Member User');
  readonly userRole = input('Member');
  readonly userLoginId = input<string | undefined>(undefined);
  readonly email = input<string | undefined>(undefined);
  readonly profileImageUrl = input<string | null>(null);
  readonly changePasswordRoute = input('/change-password');
  readonly signOut = output<void>();

  readonly isOpen = signal(false);

  readonly initials = (): string => {
    return this.userName()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  readonly displayLoginId = (): string => {
    return this.userLoginId()?.trim() || this.userRole();
  };

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  onSignOut(): void {
    this.isOpen.set(false);
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node | null;
    if (!target || !this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }
}
