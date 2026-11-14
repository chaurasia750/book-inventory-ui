import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoolMemberService, TeamMemberRow, TeamList, MediaService } from '@org/api-services';
import { initials } from '@org/shared-utils';
import { MlmTreeVisComponent } from '@org/ui';
import { SecureImgDirective } from '@org/directives';

/**
 * Tasks 9 & 10 of Member_Pool_API_And_UI_Plan.md -- My Team, Tree (default) and List behind a
 * toggle, both reading the same pool data so neither can drift from the other. Deliberately a new,
 * self-contained component rather than a repoint of the legacy NetworkShellComponent: that one is
 * Neo4j-backed and still load-bearing for the admin member-detail network tab, so it stays as is.
 */
@Component({
  selector: 'app-my-team-shell',
  standalone: true,
  imports: [DatePipe, FormsModule, MlmTreeVisComponent, SecureImgDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex radius-md border border-default bg-surface p-1">
          <button type="button" (click)="setView('tree')" [class]="tabClass(view() === 'tree')">Tree</button>
          <button type="button" (click)="setView('list')" [class]="tabClass(view() === 'list')">List</button>
        </div>

        @if (view() === 'list') {
          <div class="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search by name or member ID"
              [(ngModel)]="search"
              (ngModelChange)="onFilterChange()"
              class="radius-md border border-default bg-surface px-3 py-2 text-sm text-primary-fg placeholder:text-muted-fg focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
            />
            <select
              [(ngModel)]="levelFilter"
              (ngModelChange)="onFilterChange()"
              class="radius-md border border-default bg-surface px-3 py-2 text-sm text-primary-fg focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
            >
              <option [ngValue]="undefined">All levels</option>
              @for (n of [0,1,2,3,4,5,6,7]; track n) {
                <option [ngValue]="n">Level {{ n }}</option>
              }
            </select>
          </div>
        }
      </div>

      <!-- Summary strip -- same underlying data whichever view is active. -->
      @if (summary()) {
        <div class="grid grid-cols-2 gap-px overflow-hidden radius-card border border-default bg-default sm:grid-cols-4">
          <div class="bg-surface px-4 py-3">
            <b class="block font-heading text-xl font-semibold text-primary-fg">{{ summary()!.directCount }}</b>
            <span class="text-xs text-secondary-fg">Direct</span>
          </div>
          <div class="bg-surface px-4 py-3">
            <b class="block font-heading text-xl font-semibold text-primary-fg">{{ summary()!.totalTeamCount }}</b>
            <span class="text-xs text-secondary-fg">Total team</span>
          </div>
          <div class="bg-surface px-4 py-3">
            <b class="block font-heading text-xl font-semibold text-primary-fg">{{ summary()!.leftLegCount }}</b>
            <span class="text-xs text-secondary-fg">Left leg</span>
          </div>
          <div class="bg-surface px-4 py-3">
            <b class="block font-heading text-xl font-semibold text-primary-fg">{{ summary()!.rightLegCount }}</b>
            <span class="text-xs text-secondary-fg">Right leg</span>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="h-9 w-9 animate-spin rounded-full border-2 border-default border-t-[#66B42A]"></div>
        </div>
      } @else if (error()) {
        <p class="radius-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">{{ error() }}</p>
      } @else if (view() === 'tree') {
        <!--
          The existing vis-network visualisation, rooted at the logged-in member rather than the
          organisation's top. It is the same component the admin tree pages use -- worth reusing
          rather than hand-rolling a second, worse tree. It now reads the pool tree from SQL, and
          the API refuses any root outside this member's own downline.
        -->
        @if (rootRegNo() > 0) {
          <!--
            Explicit height: the tree is a canvas and needs one. Taller on desktop where there is
            room, shorter on a phone so the page around it stays reachable -- the tree itself pans
            and zooms, so nothing inside it is lost at the smaller size.
          -->
          <div class="h-[60vh] min-h-[360px] overflow-hidden radius-card border border-default shadow-card sm:h-[70vh]">
            <app-mlm-tree-vis [rootId]="rootRegNo()" [embedded]="true" />
          </div>
        } @else {
          <p class="radius-card border border-default bg-surface px-5 py-10 text-center text-sm text-secondary-fg shadow-card">
            You are not placed in the pool yet.
          </p>
        }
      } @else {
        <!-- List view -->
        <div class="radius-card border border-default bg-surface shadow-card">
          @if (items().length === 0) {
            <p class="px-5 py-10 text-center text-sm text-secondary-fg">No team members match this filter.</p>
          } @else {
            <!-- Six columns cannot fit a phone. Below md the same six fields become a labelled
                 card per member, so none of them slides out of reach. -->
            <div class="hidden md:block">
              <table class="w-full text-sm">
                <thead class="text-left text-xs uppercase tracking-wide text-muted-fg">
                  <tr class="border-b border-light">
                    <th class="px-5 py-3 font-medium">Member</th>
                    <th class="px-5 py-3 font-medium">Level</th>
                    <th class="px-5 py-3 font-medium">Depth</th>
                    <th class="px-5 py-3 font-medium">Joined</th>
                    <th class="px-5 py-3 font-medium">Side</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of items(); track item.regNo) {
                    <tr class="border-b border-light last:border-0">
                      <td class="px-5 py-3">
                        <div class="flex items-center gap-2.5">
                          @if (hasProfileImage(item.profileImage)) {
                            <img [secureSrc]="profileImageSrc(item.profileImage)" [alt]="item.name"
                              class="h-8 w-8 shrink-0 rounded-full object-cover" />
                          } @else {
                            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-primary-fg dark:bg-[#66B42A]/15">
                              {{ getInitials(item.name) }}
                            </div>
                          }
                          <div class="flex flex-col">
                            <span class="font-medium text-primary-fg">{{ item.name }}</span>
                            <span class="text-xs text-muted-fg">{{ item.registrationNumber }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-3 text-secondary-fg">L{{ item.currentLevel }}</td>
                      <td class="px-5 py-3 text-secondary-fg">{{ item.depth }}</td>
                      <td class="px-5 py-3 text-secondary-fg">{{ item.joinedOn ? (item.joinedOn | date: 'dd MMM yyyy') : '—' }}</td>
                      <td class="px-5 py-3 text-secondary-fg">{{ item.side }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <ul class="md:hidden">
              @for (item of items(); track item.regNo) {
                <li class="border-b border-light px-5 py-3.5 last:border-0">
                  <div class="flex items-center gap-2.5">
                    @if (hasProfileImage(item.profileImage)) {
                      <img [secureSrc]="profileImageSrc(item.profileImage)" [alt]="item.name"
                        class="h-10 w-10 shrink-0 rounded-full object-cover" />
                    } @else {
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-primary-fg dark:bg-[#66B42A]/15">
                        {{ getInitials(item.name) }}
                      </div>
                    }
                    <div class="min-w-0 flex-1">
                      <p class="break-words text-sm font-medium text-primary-fg">{{ item.name }}</p>
                      <p class="text-xs text-muted-fg">{{ item.registrationNumber }}</p>
                    </div>
                  </div>
                  <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-fg">
                    <span>Level {{ item.currentLevel }}</span>
                    <span>Depth {{ item.depth }}</span>
                    <span>{{ item.side }} leg</span>
                    <span>{{ item.joinedOn ? (item.joinedOn | date: 'dd MMM yyyy') : '—' }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </div>

        @if (totalItems() > pageSize) {
          <div class="flex items-center justify-between text-sm text-secondary-fg">
            <span>Showing {{ (page() - 1) * pageSize + 1 }}-{{ Math.min(page() * pageSize, totalItems()) }} of {{ totalItems() }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                [disabled]="page() === 1"
                (click)="changePage(page() - 1)"
                class="radius-sm border border-default px-3 py-1.5 font-medium text-primary-fg hover:bg-brand-50 dark:hover:bg-white/5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                [disabled]="page() * pageSize >= totalItems()"
                (click)="changePage(page() + 1)"
                class="radius-sm border border-default px-3 py-1.5 font-medium text-primary-fg hover:bg-brand-50 dark:hover:bg-white/5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class MyTeamShellComponent implements OnInit {
  private readonly pool = inject(PoolMemberService);
  private readonly media = inject(MediaService);
  protected readonly Math = Math;
  protected readonly pageSize = 20;

  readonly view = signal<'tree' | 'list'>('tree');
  readonly loading = signal(true);
  readonly error = signal('');

  /** The logged-in member's own RegNo -- the tree always opens on them, never on anyone else. */
  readonly rootRegNo = signal(0);

  readonly summary = signal<TeamList | null>(null);
  readonly items = signal<TeamMemberRow[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);

  search = '';
  levelFilter: number | undefined;

  ngOnInit(): void {
    this.loadOwnRegNo();
    this.loadSummaryOnly();
  }

  setView(view: 'tree' | 'list'): void {
    this.view.set(view);
    if (view === 'list' && this.items().length === 0) this.loadList();
  }

  getInitials = initials;

  // ProfileImage is a media id, not a URL -- the same resolution members-list and the tree use.
  hasProfileImage(img: string | null): boolean {
    return !!img && /^\d+$/.test(img);
  }

  profileImageSrc(img: string | null): string {
    return this.media.getFileUrl(Number(img));
  }

  tabClass(active: boolean): string {
    const base = 'radius-sm px-4 py-1.5 text-sm font-medium transition-colors ';
    return base + (active ? 'bg-accent text-white' : 'text-secondary-fg hover:text-primary-fg');
  }

  changePage(page: number): void {
    this.page.set(page);
    this.loadList();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadList();
  }

  /**
   * The tree component needs a root id up front, and the member's own RegNo is not in the JWT in a
   * form this component can read, so it comes from the summary endpoint -- which is itself scoped
   * to the caller, so this can only ever be the logged-in member.
   */
  private loadOwnRegNo(): void {
    this.loading.set(true);
    this.error.set('');

    this.pool.getSummary().subscribe({
      next: (summary) => {
        this.rootRegNo.set(summary.member.regNo);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your team tree.');
        this.loading.set(false);
      },
    });
  }

  /** Fetches just page 1 to populate the summary strip without forcing the List view to load. */
  private loadSummaryOnly(): void {
    this.pool.getTeam({ page: 1, pageSize: 1 }).subscribe({
      next: (result) => this.summary.set(result),
      error: () => { /* the strip simply stays hidden */ },
    });
  }

  private loadList(): void {
    this.loading.set(true);
    this.error.set('');

    this.pool.getTeam({
      search: this.search || undefined,
      level: this.levelFilter,
      page: this.page(),
      pageSize: this.pageSize,
    }).subscribe({
      next: (result) => {
        this.summary.set(result);
        this.items.set(result.items);
        this.totalItems.set(result.totalItems);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your team.');
        this.loading.set(false);
      },
    });
  }
}
