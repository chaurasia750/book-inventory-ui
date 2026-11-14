import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TitleSelectComponent } from '@org/ui';
import { AmountSliderComponent } from '../../amount-slider/amount-slider.component';
import { LeadLookupItem } from '../../../models/lead-api.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-lead-info-form',
  standalone: true,
  imports: [ReactiveFormsModule, TitleSelectComponent, AmountSliderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [formGroup]="form()" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr] items-start">
          <div class="flex flex-row rounded-xl border border-default bg-surface focus-within:border-[#66B42A] focus-within:ring-2 focus-within:ring-[#66B42A]/20">
            <div class="shrink-0 w-20">
              <app-title-select formControlName="title"></app-title-select>
            </div>
            <div class="w-px self-stretch bg-default"></div>
            <div class="relative min-w-0 flex-1">
              <input id="firstName" type="text" formControlName="firstName" placeholder=" "
                class="peer block w-full border-0 bg-transparent px-4 pb-2.5 pt-5 text-sm text-primary-fg focus:outline-none"/>
              <label for="firstName" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs">
                First Name <span class="text-red-400">*</span>
              </label>
            </div>
          </div>
          <div class="relative">
            <input id="lastName" type="text" formControlName="lastName" placeholder=" "
              class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
            <label for="lastName" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs">
              Last Name <span class="text-red-400">*</span>
            </label>
          </div>
        </div>

        <div class="relative">
          <input id="email" type="email" formControlName="email" placeholder=" "
            class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
          <label for="email" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs">
            Email <span class="text-red-400">*</span>
          </label>
        </div>

        <div class="relative">
          <select id="leadSource" formControlName="leadSource"
            class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 pr-10 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20 cursor-pointer">
            <option value="" disabled>Select a source</option>
            @for (src of leadSources(); track src.id) {
              <option [ngValue]="src.id">{{ src.name }}</option>
            }
          </select>
          <label for="leadSource" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50">Lead Source <span class="text-red-400">*</span></label>
          <svg class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-fg/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>

        <app-amount-slider formControlName="expectedAmount"/>
      </div>

      <div class="space-y-4">
        <div class="relative">
          <select id="leadStatus" formControlName="leadStatus"
            class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 pr-10 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20 cursor-pointer">
            <option value="" disabled>Select a status</option>
            @for (st of leadStatuses(); track st.id) {
              <option [ngValue]="st.id">{{ st.name }}</option>
            }
          </select>
          <label for="leadStatus" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50">Lead Status <span class="text-red-400">*</span></label>
          <svg class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-fg/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>

        @if (showAssignUser()) {
          <div class="relative">
            <select id="assignedUser" formControlName="assignedUser"
              class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 pr-10 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20 cursor-pointer">
              <option value="" disabled>Select a user</option>
              @for (u of users(); track u.id) {
                <option [ngValue]="u.id">{{ u.fullName }}</option>
              }
            </select>
            <label for="assignedUser" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50">Assign User <span class="text-red-400">*</span></label>
            <svg class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-fg/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </div>
        }

        <div>
          <p class="mb-1.5 text-xs font-medium text-primary-fg">Probability (%)</p>
          <div class="flex items-center gap-3">
            <input type="range" formControlName="probabilityPercentage" min="0" max="100" step="5"
              class="h-1.5 w-full appearance-none rounded-full cursor-pointer accent-[#66B42A]"
              [style]="'background: linear-gradient(to right, #66B42A ' + form().get('probabilityPercentage')?.value + '%, #E2E5E9 ' + form().get('probabilityPercentage')?.value + '%);'">
            <span class="min-w-[3ch] text-right text-sm font-bold text-primary-fg">{{ form().get('probabilityPercentage')?.value }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LeadInfoFormComponent {
  readonly form = input.required<FormGroup>();
  readonly leadSources = input<LeadLookupItem[]>([]);
  readonly leadStatuses = input<LeadLookupItem[]>([]);
  readonly users = input<User[]>([]);
  readonly showAssignUser = input(true);
}
