import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, effect, inject, input, OnInit, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TeamService, TeamMember, NetworkSearchService, MediaService } from '@org/api-services';
import { LoadingSpinnerComponent, PaginationComponent } from '@org/ui';
import { initials } from '@org/shared-utils';

@Component({
  selector: 'app-network-indirect',
  standalone: true,
  imports: [DatePipe, LoadingSpinnerComponent, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      @if (loading()) {
        <div class="flex items-center justify-center py-10">
          <app-loading-spinner />
        </div>
      } @else if (items().length === 0) {
        <div class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg class="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
            </svg>
          </div>
          <p class="mb-1 text-sm font-medium text-gray-900">No Indirect Members Found</p>
          <p class="text-xs text-gray-500">Try adjusting your search criteria.</p>
        </div>
      } @else {
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/80">
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Member</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Joining Date</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Mobile</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sponsor</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Level</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (member of items(); track member.regNo) {
                <tr class="transition-colors hover:bg-gray-50/60">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      @if (hasProfileImage(member.profileImage)) {
                        <img [src]="getProfileImageSrc(member.profileImage)" [alt]="member.name"
                          class="h-8 w-8 shrink-0 rounded-full object-cover" />
                      } @else {
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#66B42A]/20 text-[11px] font-bold text-[#111111]">
                          {{ getInitials(member.name) }}
                        </div>
                      }
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-900">{{ member.name }}</span>
                        <span class="text-xs text-gray-400">{{ member.loginId }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ (member.joinDate | date:'dd MMM yyyy') || 'â€”' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ member.mobile || 'â€”' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ member.email || 'â€”' }}</td>
                  <td class="px-4 py-3">
                    @if (member.sponsorName) {
                      <div class="flex flex-col">
                        <span class="text-sm text-gray-900">{{ member.sponsorName }}</span>
                        <span class="text-xs text-gray-400">{{ member.sponsorLoginId }}</span>
                      </div>
                    } @else {
                      <span class="text-sm text-gray-400">â€”</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      L{{ member.level }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden divide-y divide-gray-50">
          @for (member of items(); track member.regNo) {
            <div class="p-4">
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  @if (hasProfileImage(member.profileImage)) {
                    <img [src]="getProfileImageSrc(member.profileImage)" [alt]="member.name"
                      class="h-10 w-10 shrink-0 rounded-full object-cover" />
                  } @else {
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#66B42A]/20 text-[12px] font-bold text-[#111111]">
                      {{ getInitials(member.name) }}
                    </div>
                  }
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ member.name }}</p>
                    <p class="text-xs text-gray-400">{{ member.loginId }}</p>
                  </div>
                </div>
                <span class="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                  L{{ member.level }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span class="text-xs text-gray-400">Joining Date</span>
                  <p class="text-gray-700">{{ (member.joinDate | date:'dd MMM yyyy') || 'â€”' }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-400">Mobile</span>
                  <p class="text-gray-700">{{ member.mobile || 'â€”' }}</p>
                </div>
                <div class="col-span-2">
                  <span class="text-xs text-gray-400">Email</span>
                  <p class="text-gray-700">{{ member.email || 'â€”' }}</p>
                </div>
                <div class="col-span-2">
                  <span class="text-xs text-gray-400">Sponsor</span>
                  <p class="text-gray-700">{{ member.sponsorName || 'â€”' }} {{ member.sponsorLoginId ? '(' + member.sponsorLoginId + ')' : '' }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        <app-pagination
          [page]="page()"
          [pageSize]="pageSize()"
          [total]="totalRecords()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `,
})
export class NetworkIndirectComponent implements OnInit {
  readonly memberId = input<string>('');
  private readonly teamService = inject(TeamService);
  private readonly searchService = inject(NetworkSearchService);
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly items = signal<TeamMember[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalRecords = signal(0);

  constructor() {
    let skipInitial = true;
    effect(() => {
      const _term = this.searchService.term();
      if (skipInitial) { skipInitial = false; return; }
      untracked(() => {
        this.page.set(1);
        this.loadIndirect();
      });
    });
  }

  ngOnInit(): void {
    this.loadIndirect();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadIndirect();
  }

  getInitials = initials;

  hasProfileImage(img: string | null): boolean {
    return !!img && /^\d+$/.test(img);
  }

  getProfileImageSrc(img: string | null): string {
    return this.mediaService.getFileUrl(Number(img));
  }

  private loadIndirect(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.teamService.getIndirect({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchService.term() || undefined,
      memberId: this.memberId() || undefined,
    }).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.totalRecords.set(res.totalRecords);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
