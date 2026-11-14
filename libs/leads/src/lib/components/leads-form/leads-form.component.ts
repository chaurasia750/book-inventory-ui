import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '@org/ui';

@Component({
  selector: 'app-leads-form',
  standalone: true,
  imports: [FormsModule, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl">
      <app-breadcrumb class="mb-6" pageTitle="Add New Lead" [items]="breadcrumbItems"/>
      <form (ngSubmit)="submitted.emit()" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" [(ngModel)]="model.name" name="name" required
              class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">Mobile</label>
            <input type="tel" [(ngModel)]="model.mobile" name="mobile" required
              class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" [(ngModel)]="model.email" name="email"
              class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">Expected Amount</label>
            <input type="number" [(ngModel)]="model.expectedAmount" name="expectedAmount"
              class="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"/>
          </div>
        </div>
        <div class="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
          <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-[#66B42A] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#66B42A]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl">
            Save Lead
          </button>
        </div>
      </form>
    </div>
  `,
})
export class LeadsFormComponent {
  readonly breadcrumbItems: BreadcrumbItem[] = [{ label: 'CRM' }, { label: 'Leads', link: '/leads' }, { label: 'Add Lead' }];
  readonly submitted = output<void>();
  model = { name: '', mobile: '', email: '', status: 'new', assignedUser: '', city: '', expectedAmount: 0, notes: '' };
}
