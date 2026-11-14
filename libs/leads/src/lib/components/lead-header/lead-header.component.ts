import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-lead-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your leads and track conversions</p>
      </div>
      <button (click)="addLead.emit()"
        class="inline-flex items-center gap-2 rounded-xl bg-[#66B42A] px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#66B42A]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Lead
      </button>
    </div>
  `,
})
export class LeadHeaderComponent {
  readonly addLead = output<void>();
}
