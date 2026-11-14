import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invalid-role',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <div class="mb-6">
          <svg class="mx-auto h-16 w-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 4v2m0 -4h4m-4 0H8"></path>
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-yellow-400 mb-4">Invalid Role</h1>
        <p class="text-gray-400 text-lg mb-8">
          Your account has an invalid or unsupported role. Please contact your administrator.
        </p>
        <button
          (click)="logout()"
          class="inline-block bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold">
          Log Out
        </button>
      </div>
    </div>
  `
})
export class InvalidRoleComponent {
  private readonly router = inject(Router);

  logout(): void {
    this.router.navigate(['/login']);
  }
}
