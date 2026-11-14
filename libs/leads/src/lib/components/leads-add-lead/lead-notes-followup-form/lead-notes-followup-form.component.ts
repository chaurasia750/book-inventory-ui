import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Priority } from '../leads-add-lead.component';

@Component({
  selector: 'app-lead-notes-followup-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [formGroup]="form()" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="relative sm:col-span-2">
        <textarea id="notes" formControlName="notes" rows="3" placeholder=" "
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20 resize-none"></textarea>
        <label for="notes" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs">Notes</label>
      </div>
      <div class="relative">
        <input id="followUpDate" type="date" formControlName="followUpDate"
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
        <label for="followUpDate" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50">Follow-up Date</label>
      </div>
      <div class="relative">
        <input id="followUpTime" type="time" formControlName="followUpTime"
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
        <label for="followUpTime" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50">Follow-up Time</label>
      </div>
      <div>
        <p class="mb-2 text-xs font-medium text-primary-fg">Priority <span class="text-red-400">*</span></p>
        <div class="flex gap-2">
          @for (p of priorities(); track p.value) {
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors"
              [class]="form().get('priority')?.value === p.value
                ? 'border-[#66B42A] bg-[#66B42A]/15 text-[#66B42A] font-semibold'
                : 'border-default bg-surface text-primary-fg hover:border-[#66B42A]'">
              <input type="radio" formControlName="priority" [value]="p.value" class="h-3 w-3 accent-[#66B42A]"/>
              {{ p.label }}
            </label>
          }
        </div>
      </div>
      <div>
        <p class="mb-2 text-xs font-medium text-primary-fg">Tags</p>
        <div class="flex flex-wrap gap-1.5">
          @for (tag of form().get('tags')?.value || []; track tag) {
            <span class="inline-flex items-center gap-1 rounded-full bg-[#66B42A]/10 px-2.5 py-1 text-xs font-medium text-[#66B42A]">
              {{ tag }}
              <button type="button" (click)="removeTag(tag)" class="hover:text-red-500">&times;</button>
            </span>
          }
        </div>
        <div class="flex flex-wrap gap-1 mt-2">
          @for (tag of availableTags(); track tag) {
            @if (!(form().get('tags')?.value || []).includes(tag)) {
              <button type="button" (click)="addTag(tag)"
                class="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] text-gray-500 hover:border-[#66B42A] hover:text-[#66B42A]">
                + {{ tag }}
              </button>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class LeadNotesFollowupFormComponent {
  readonly form = input.required<FormGroup>();
  readonly priorities = input<Priority[]>([]);
  readonly availableTags = input<string[]>([]);

  addTag(tag: string): void {
    const control = this.form().get('tags');
    const current: string[] = control?.value || [];
    if (tag && !current.includes(tag)) {
      control?.setValue([...current, tag]);
    }
  }

  removeTag(tag: string): void {
    const control = this.form().get('tags');
    const current: string[] = control?.value || [];
    control?.setValue(current.filter(t => t !== tag));
  }
}
