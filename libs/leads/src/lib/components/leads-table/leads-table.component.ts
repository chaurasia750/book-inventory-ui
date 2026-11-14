import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Lead } from '../../models/lead.model';
import { LEAD_STATUS_BADGE } from '../../models/lead-constants';
import { initials } from '@org/shared-utils';

@Component({
  selector: 'app-leads-table',
  standalone: true,
  imports: [DatePipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mobile cards -->
    <div class="md:hidden p-4">
      @for (lead of leads(); track lead.id) {
        <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm mb-3">
          <div class="flex items-center gap-3">
            @if (showAssignUser()) {
              <input type="checkbox" [checked]="selectedIds().has(lead.id)" (change)="onCheck(lead.id, $event)"
                class="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-[#66B42A] focus:ring-[#66B42A]/50"/>
            }
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#66B42A]/20 text-[12px] font-bold text-[#111111]">
              {{ getInitials(lead.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-900 truncate">{{ lead.name }}</div>
              <div class="text-xs text-gray-400 truncate">{{ lead.leadForTitle }}</div>
            </div>
            <span class="shrink-0 inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              [ngClass]="statusBadge[lead.status] || statusBadge['new']">
              {{ lead.status }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-3">
            <div>
              <span class="text-xs text-gray-400">Mobile</span>
              <div class="text-gray-700">{{ lead.mobile }}</div>
            </div>
            @if (showAssignUser()) {
              <div>
                <span class="text-xs text-gray-400">Assigned To</span>
                <div class="text-gray-700 truncate">{{ lead.assignedUser }}</div>
              </div>
            }
            <div class="col-span-2">
              <span class="text-xs text-gray-400">Follow-up</span>
              <div class="text-gray-700">{{ lead.nextFollowupDate | date:'dd MMM yyyy, hh:mm a' }}</div>
            </div>
            <div>
              <span class="text-xs text-gray-400">Exp. Amount</span>
              <div class="text-gray-700 font-semibold">{{ formatCurrency(lead.expectedAmount) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button (click)="editLead.emit(lead)" class="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
            <button (click)="followUp.emit(lead)" class="flex-1 rounded-lg border border-[#66B42A] bg-[#66B42A]/10 px-3 py-2 text-xs font-semibold text-[#66B42A] hover:bg-[#66B42A]/20">Follow-up</button>
          </div>
        </div>
      }
    </div>

    <!-- Desktop table -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            @if (showAssignUser()) {
              <th class="w-12 px-5 py-3">
                <input type="checkbox" [checked]="allSelected()" (change)="toggleAll.emit()"
                  class="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#66B42A] focus:ring-[#66B42A]/50"/>
              </th>
            }
            <th class="px-5 py-3">Lead</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3">Mobile</th>
            <th class="px-5 py-3">Follow-up</th>
            <th class="px-5 py-3 text-right">Amount</th>
            <th class="w-12 px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          @for (lead of leads(); track lead.id) {
            <tr class="hover:bg-gray-50/50 transition-colors">
              @if (showAssignUser()) {
                <td class="px-5 py-3">
                  <input type="checkbox" [checked]="selectedIds().has(lead.id)" (change)="onCheck(lead.id, $event)"
                    class="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#66B42A] focus:ring-[#66B42A]/50"/>
                </td>
              }
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#66B42A]/20 text-[11px] font-bold text-[#111111]">
                    {{ getInitials(lead.name) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ lead.name }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ lead.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3">
                <span class="inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase"
                  [ngClass]="statusBadge[lead.status] || statusBadge['new']">
                  {{ lead.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-sm text-gray-600">{{ lead.mobile }}</td>
              <td class="px-5 py-3 text-sm text-gray-600">{{ lead.nextFollowupDate | date:'dd MMM yyyy' }}</td>
              <td class="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(lead.expectedAmount) }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <button (click)="editLead.emit(lead)" class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                  <button (click)="followUp.emit(lead)" class="rounded-lg border border-[#66B42A] bg-[#66B42A]/10 px-3 py-1.5 text-xs font-semibold text-[#66B42A] hover:bg-[#66B42A]/20">Follow-up</button>
                </div>
              </td>
            </tr>
          }
          @if (leads().length === 0) {
            <tr>
              <td [attr.colspan]="showAssignUser() ? 7 : 6" class="px-5 py-12 text-center text-sm text-gray-400">No leads found</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LeadsTableComponent {
  readonly leads = input<Lead[]>([]);
  readonly selectedIds = input(new Set<number>());
  readonly allSelected = input(false);
  readonly showAssignUser = input(true);

  readonly selectionChange = output<{ leadId: number; checked: boolean }>();
  readonly toggleAll = output<void>();
  readonly editLead = output<Lead>();
  readonly followUp = output<Lead>();
  readonly closing = output<Lead>();

  readonly statusBadge = LEAD_STATUS_BADGE;
  getInitials = initials;

  formatCurrency(val: number): string {
    if (val >= 100000) return '\u20B9' + (val / 100000).toFixed(1) + 'L';
    if (val >= 1000) return '\u20B9' + (val / 1000).toFixed(0) + 'K';
    return '\u20B9' + val;
  }

  onCheck(leadId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectionChange.emit({ leadId, checked });
  }
}
