import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { getItem, setItem } from '@org/shared-utils';
import { STORAGE_KEYS } from '@org/constants';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-default text-secondary-fg hover:bg-accent/10 hover:text-accent transition-all duration-200"
      [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="toggleTheme()">
      @if (isDark()) {
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3c0 0 0 0 0 0A7 7 0 0 0 21 12.79z"></path>
        </svg>
      } @else {
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
      }
    </button>
  `,
})
export class ThemeToggleComponent {
  isDark = signal(getItem<string>(STORAGE_KEYS.THEME) === 'dark');

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.applyTheme(next);
    setItem(STORAGE_KEYS.THEME, next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
  }
}
