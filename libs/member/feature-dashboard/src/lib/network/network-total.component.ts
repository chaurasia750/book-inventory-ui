import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  TeamService,
  TeamHierarchyNode,
  NetworkSearchService,
  MediaService,
} from '@org/api-services';
import { GenealogyTreeComponent } from '@org/ui';
import { MemberDataService } from '@org/member-data-access';
import { initials } from '@org/shared-utils';

type ViewMode = 'genealogy' | 'hierarchy';

type FlatItem =
  | { type: 'row'; node: TeamHierarchyNode; depth: number }
  | { type: 'loadMore'; parentRegNo: number; depth: number };

@Component({
  selector: 'app-network-total',
  standalone: true,
  imports: [DatePipe, GenealogyTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- View Mode Toggle -->
    <div class="mb-5 flex items-center gap-3">
      <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">View</span>
      <div class="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <button (click)="onHierarchyTabClick()"
          class="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium transition-all duration-200 border-r border-gray-200"
          [class.bg-[#66B42A]]="viewMode() === 'hierarchy'"
          [class.text-white]="viewMode() === 'hierarchy'"
          [class.bg-white]="viewMode() !== 'hierarchy'"
          [class.text-gray-600]="viewMode() !== 'hierarchy'"
          [class.hover:bg-gray-50]="viewMode() !== 'hierarchy'">
          <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200"
            [class.border-white]="viewMode() === 'hierarchy'"
            [class.bg-white]="viewMode() === 'hierarchy'"
            [class.border-gray-300]="viewMode() !== 'hierarchy'"
            [class.bg-gray-50]="viewMode() !== 'hierarchy'">
            @if (viewMode() === 'hierarchy') {
              <svg class="h-2.5 w-2.5 text-[#66B42A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
            }
          </span>
          Team Hierarchy
        </button>
        <button (click)="viewMode.set('genealogy')"
          class="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium transition-all duration-200"
          [class.bg-[#66B42A]]="viewMode() === 'genealogy'"
          [class.text-white]="viewMode() === 'genealogy'"
          [class.bg-white]="viewMode() !== 'genealogy'"
          [class.text-gray-600]="viewMode() !== 'genealogy'"
          [class.hover:bg-gray-50]="viewMode() !== 'genealogy'">
          <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200"
            [class.border-white]="viewMode() === 'genealogy'"
            [class.bg-white]="viewMode() === 'genealogy'"
            [class.border-gray-300]="viewMode() !== 'genealogy'"
            [class.bg-gray-50]="viewMode() !== 'genealogy'">
            @if (viewMode() === 'genealogy') {
              <svg class="h-2.5 w-2.5 text-[#66B42A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
            }
          </span>
          Genealogy Tree
        </button>
      </div>
    </div>

    @if (viewMode() === 'genealogy') {
      @if (data.member() || rootRegistrationNumber()) {
        <app-genealogy-tree [rootMemberId]="rootRegistrationNumber() || '' + data.registrationNumber()" />
      }
    } @else {

    <!-- Action Buttons -->
    <div class="mb-4 flex items-center justify-end gap-2">
      <button (click)="refresh()" title="Refresh"
        class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50">
        <svg class="h-3.5 w-3.5" [class.animate-spin]="loading()" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2"/>
        </svg>
        Refresh
      </button>
      <button (click)="expandAll()" title="Expand All"
        class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
        </svg>
        Expand All
      </button>
      <button (click)="collapseAll()" title="Collapse All"
        class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
        </svg>
        Collapse All
      </button>
      <button (click)="exportToCSV()" title="Export CSV"
        class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        Export
      </button>
    </div>

    <!-- Root Card - matches tree row style -->
    @if (rootMember()) {
      <div class="mb-5 overflow-hidden rounded-2xl border border-[#66B42A]/20 bg-gradient-to-r from-[#66B42A]/5 to-white shadow-sm">
        <div class="flex items-center gap-5 px-6 py-4">
          <!-- Avatar -->
          @if (hasProfileImage(rootMember()!.profileImage)) {
            <img
              [src]="getProfileImageSrc(rootMember()!.profileImage)"
              [alt]="rootMember()!.name"
              class="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[#66B42A]/30"
            />
          } @else {
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#66B42A] to-[#FF8F00] text-sm font-bold text-white ring-2 ring-[#66B42A]/30">
              {{ getInitials(rootMember()!.name) }}
            </div>
          }

          <!-- Name + Login -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5">
              <h3 class="truncate text-sm font-semibold text-gray-900">{{ rootMember()!.name }}</h3>
              <span class="inline-flex shrink-0 items-center rounded-full bg-[#66B42A]/10 px-2 py-0.5 text-[10px] font-bold text-[#66B42A] uppercase tracking-wider">
                You
              </span>
              @if (rootMember()!.status) {
                <span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  [class]="getStatusClasses(rootMember()!.status)">
                  {{ rootMember()!.status }}
                </span>
              }
            </div>
            <p class="mt-0.5 text-xs text-gray-400">
              {{ rootMember()!.loginId }}
            </p>
          </div>

          <!-- Badges -->
          <div class="flex items-center gap-3">
            <div class="text-center">
              <span class="inline-flex items-center rounded-full bg-saffron-50 px-2.5 py-1 text-xs font-bold text-saffron-700">
                {{ rootMember()!.directReferralCount }}
              </span>
              <p class="mt-1 text-[10px] font-medium text-gray-400">Direct</p>
            </div>
            <div class="h-8 w-px bg-gray-200"></div>
            <div class="text-center">
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {{ rootMember()!.totalTeamCount }}
              </span>
              <p class="mt-1 text-[10px] font-medium text-gray-400">Team</p>
            </div>
            @if (rootMember()!.joinDate) {
              <div class="h-8 w-px bg-gray-200"></div>
              <div class="text-center">
                <p class="text-xs font-semibold text-gray-700">{{ (rootMember()!.joinDate | date:'dd MMM yyyy') }}</p>
                <p class="mt-1 text-[10px] font-medium text-gray-400">Join Date</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Content Card -->
    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <!-- Loading Skeleton -->
      @if (loading()) {
        <div class="p-5 space-y-3">
          @for (i of skeletonRows; track i) {
            <div class="flex items-center gap-3">
              <div class="h-5 w-5 animate-pulse rounded bg-gray-200"></div>
              <div class="h-9 w-9 animate-pulse rounded-full bg-gray-200"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3.5 w-32 animate-pulse rounded bg-gray-200"></div>
                <div class="h-2.5 w-20 animate-pulse rounded bg-gray-100"></div>
              </div>
              <div class="h-3.5 w-16 animate-pulse rounded bg-gray-200"></div>
              <div class="h-3.5 w-20 animate-pulse rounded bg-gray-200"></div>
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @else if (error()) {
        <div class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg class="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
          </div>
          <p class="mb-1 text-sm font-medium text-gray-900">Something went wrong</p>
          <p class="mb-4 text-xs text-gray-500">{{ error() }}</p>
          <button (click)="refresh()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Retry
          </button>
        </div>
      }

      <!-- Empty State -->
      @else if (visibleItems().length === 0 && !loading()) {
        <div class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
            </svg>
          </div>
          <p class="mb-1 text-sm font-medium text-gray-900">
            @if (searchService.term()) { No Members Found } @else { No Team Members }
          </p>
          <p class="text-xs text-gray-500">
            @if (searchService.term()) { Try adjusting your search criteria. } @else { You don't have any team members yet. }
          </p>
        </div>
      }

      <!-- Desktop Tree Table -->
      @else {
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/80">
                <th class="w-10 px-3 py-3.5"></th>
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Member</th>
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Mobile</th>
                <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Direct</th>
                <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Team</th>
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Join Date</th>
                <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-24">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (item of visibleItems(); track $index) {
                @if (item.type === 'row') {
                  <tr class="tree-row transition-colors hover:bg-gray-50/60">
                    <!-- Expand -->
                    <td class="px-3 py-3">
                      <div class="flex items-center" [style.paddingLeft.px]="item.depth * 24">
                        @if (item.node.hasChildren) {
                          <button (click)="toggle(item.node.regNo)"
                            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-gray-100 text-gray-400">
                            @if (isLoadingNode(item.node.regNo)) {
                              <svg class="h-3.5 w-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            } @else {
                              <svg class="h-4 w-4 transition-transform duration-200" [class.rotate-90]="isExpanded(item.node.regNo)"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <path d="M9 5l7 7-7 7"/>
                              </svg>
                            }
                          </button>
                        } @else {
                          <span class="mr-2 inline-block h-6 w-6 shrink-0"></span>
                        }
                      </div>
                    </td>

                    <!-- Member -->
                    <td class="px-5 py-3">
                      <div class="flex items-center">
                        @if (hasProfileImage(item.node.profileImage)) {
                          <img [src]="getProfileImageSrc(item.node.profileImage)" [alt]="item.node.name"
                            class="h-9 w-9 shrink-0 rounded-full object-cover" />
                        } @else {
                          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron-50 text-[11px] font-bold text-saffron-700">
                            {{ getInitials(item.node.name) }}
                          </div>
                        }
                        <div class="ml-3 min-w-0">
                          <span class="block truncate text-sm font-medium text-gray-900">{{ item.node.name }}</span>
                          <span class="block truncate text-[11px] text-gray-400">{{ item.node.loginId }}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Mobile -->
                    <td class="px-5 py-3">
                      <span class="text-sm text-gray-600">{{ item.node.mobile || 'â€”' }}</span>
                    </td>

                    <!-- Direct -->
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex items-center rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold text-saffron-700">
                        {{ item.node.directReferralCount }}
                      </span>
                    </td>

                    <!-- Team -->
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {{ item.node.totalTeamCount }}
                      </span>
                    </td>

                    <!-- Join Date -->
                    <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {{ (item.node.joinDate | date:'dd MMM yyyy') || 'â€”' }}
                    </td>

                    <!-- Status -->
                    <td class="px-5 py-3 text-center">
                      @if (item.node.status) {
                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          [class]="getStatusClasses(item.node.status)">
                          {{ item.node.status }}
                        </span>
                      } @else {
                        <span class="text-xs text-gray-400">â€”</span>
                      }
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-3 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <button (click)="copyLoginId(item.node)" title="Copy Login ID"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  <!-- Load More Row -->
                  <tr>
                    <td colspan="8" class="px-5 py-2" [style.paddingLeft.px]="item.depth * 24 + 40">
                      <button (click)="loadMoreChildren(item.parentRegNo)"
                        class="inline-flex items-center gap-1.5 text-xs font-medium text-[#66B42A] hover:text-[#4E9C1F] transition-colors">
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                        </svg>
                        Load more...
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Tree Cards -->
        <div class="md:hidden divide-y divide-gray-50">
          @for (item of visibleItems(); track $index) {
            @if (item.type === 'row') {
              <div class="p-4">
                <div class="flex items-start gap-3">
                  <!-- Expand + Avatar -->
                  <div class="flex items-center" [style.paddingLeft.px]="item.depth * 16">
                    @if (item.node.hasChildren) {
                      <button (click)="toggle(item.node.regNo)"
                        class="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 text-gray-400">
                        @if (isLoadingNode(item.node.regNo)) {
                          <svg class="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        } @else {
                          <svg class="h-4 w-4 transition-transform duration-200" [class.rotate-90]="isExpanded(item.node.regNo)"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M9 5l7 7-7 7"/>
                          </svg>
                        }
                      </button>
                    } @else {
                      <span class="mr-2 inline-block h-7 w-7 shrink-0"></span>
                    }
                    @if (hasProfileImage(item.node.profileImage)) {
                      <img [src]="getProfileImageSrc(item.node.profileImage)" [alt]="item.node.name"
                        class="h-10 w-10 shrink-0 rounded-full object-cover" />
                    } @else {
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-50 text-[12px] font-bold text-saffron-700">
                        {{ getInitials(item.node.name) }}
                      </div>
                    }
                    <div class="ml-3 min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <p class="truncate text-sm font-semibold text-gray-900">{{ item.node.name }}</p>
                        @if (item.node.status) {
                          <span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            [class]="getStatusClasses(item.node.status)">
                            {{ item.node.status }}
                          </span>
                        }
                      </div>
                      <p class="text-xs text-gray-400">{{ item.node.loginId }}</p>
                    </div>
                    <button (click)="copyLoginId(item.node)" title="Copy Login ID"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span class="text-xs text-gray-400">Mobile</span>
                    <p class="text-gray-700">{{ item.node.mobile || 'â€”' }}</p>
                  </div>
                  <div>
                    <span class="text-xs text-gray-400">Join Date</span>
                    <p class="text-gray-700">{{ (item.node.joinDate | date:'dd MMM yyyy') || 'â€”' }}</p>
                  </div>
                  <div>
                    <span class="text-xs text-gray-400">Direct / Team</span>
                    <p class="flex items-center gap-1.5">
                      <span class="inline-flex items-center rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold text-saffron-700">
                        {{ item.node.directReferralCount }} direct
                      </span>
                      <span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {{ item.node.totalTeamCount }} total
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Load More Card -->
              <div class="p-4" [style.paddingLeft.px]="item.depth * 16 + 48">
                <button (click)="loadMoreChildren(item.parentRegNo)"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-[#66B42A] hover:text-[#4E9C1F] transition-colors">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                  Load more...
                </button>
              </div>
            }
          }
        </div>
      }

      <!-- Root Pagination Controls -->
      @if (!loading() && !error() && rootTotalPages() > 1) {
        <div class="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <p class="text-xs text-gray-500">
            Showing page {{ rootPage() }} of {{ rootTotalPages() }}
            <span class="text-gray-400">&middot;</span>
            {{ rootTotalRecords() }} total members
          </p>
          <div class="flex items-center gap-1">
            <button (click)="goRootPage(1)" [disabled]="rootPage() <= 1"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"/>
              </svg>
            </button>
            <button (click)="goRootPage(rootPage() - 1)" [disabled]="rootPage() <= 1"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </button>
            @for (p of rootPageNumbers(); track p) {
              <button (click)="goRootPage(p)"
                class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors"
                [class.border-[#66B42A]]="p === rootPage()"
                [class.bg-[#66B42A]]="p === rootPage()"
                [class.text-white]="p === rootPage()"
                [class.border-gray-200]="p !== rootPage()"
                [class.text-gray-600]="p !== rootPage()"
                [class.hover:bg-gray-50]="p !== rootPage()">
                {{ p }}
              </button>
            }
            <button (click)="goRootPage(rootPage() + 1)" [disabled]="rootPage() >= rootTotalPages()"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
            <button (click)="goRootPage(rootTotalPages())" [disabled]="rootPage() >= rootTotalPages()"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m6-15l-7.5 7.5 7.5 7.5"/>
              </svg>
            </button>
          </div>
        </div>
      }
      </div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="fixed bottom-6 right-6 z-50 animate-[slideUp_0.2s_ease-out] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg">
        {{ toast() }}
      </div>
    }
  `,
  styles: [`
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class NetworkTotalComponent implements OnInit, OnDestroy {
  readonly memberId = input<string>('');
  readonly rootRegistrationNumber = input<string>('');
  private readonly teamService = inject(TeamService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly data = inject(MemberDataService);
  readonly searchService = inject(NetworkSearchService);
  private readonly mediaService = inject(MediaService);

  private toastTimeout?: ReturnType<typeof setTimeout>;

  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly viewMode = signal<ViewMode>('hierarchy');

  readonly rootMember = signal<TeamHierarchyNode | null>(null);
  readonly rootChildren = signal<TeamHierarchyNode[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly toast = signal('');
  readonly expandedNodes = signal<Set<number>>(new Set());
  readonly childrenCache = signal<Map<number, TeamHierarchyNode[]>>(new Map());
  readonly loadingNodes = signal<Set<number>>(new Set());

  readonly rootPage = signal(1);
  readonly rootPageSize = signal(50);
  readonly rootTotalPages = signal(1);
  readonly rootTotalRecords = signal(0);
  readonly nodePageInfo = signal<Map<number, { page: number; totalPages: number }>>(new Map());

  readonly rootPageNumbers = computed<number[]>(() => {
    const total = this.rootTotalPages();
    const current = this.rootPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-2);
    if (end < total) pages.push(total);
    return pages;
  });

  readonly visibleItems = computed<FlatItem[]>(() => {
    const search = this.searchService.term().toLowerCase().trim();
    const children = this.rootChildren();
    const expanded = this.expandedNodes();
    const cache = this.childrenCache();
    const pageInfoMap = this.nodePageInfo();
    const result: FlatItem[] = [];

    const matchesSearch = (n: TeamHierarchyNode): boolean => {
      if (!search) return true;
      return (
        n.name.toLowerCase().includes(search) ||
        n.loginId.toLowerCase().includes(search) ||
        n.regNo.toString().includes(search)
      );
    };

    const walk = (nodes: TeamHierarchyNode[], depth: number): void => {
      for (const node of nodes) {
        if (!matchesSearch(node)) continue;
        result.push({ type: 'row', node, depth });
        if (expanded.has(node.regNo)) {
          const ch = cache.get(node.regNo);
          if (ch) {
            walk(ch, depth + 1);
          }
          const info = pageInfoMap.get(node.regNo);
          if (info && info.page < info.totalPages) {
            result.push({ type: 'loadMore', parentRegNo: node.regNo, depth: depth + 1 });
          }
        }
      }
    };

    walk(children, 0);
    return result;
  });

  readonly hasRootChildren = computed(() => this.rootChildren().length > 0);

  constructor() {
    let skipInitial = true;
    effect(() => {
      const _key = this.searchService.refreshKey();
      if (skipInitial) { skipInitial = false; return; }
      untracked(() => this.refresh());
    });
  }

  ngOnInit(): void {
    this.loadRoot();
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimeout);
  }

  refresh(): void {
    this.childrenCache.set(new Map());
    this.expandedNodes.set(new Set());
    this.loadingNodes.set(new Set());
    this.nodePageInfo.set(new Map());
    this.rootPage.set(1);
    this.searchService.term.set('');
    this.loadRoot();
  }

  onHierarchyTabClick(): void {
    this.viewMode.set('hierarchy');
    if (this.rootChildren().length === 0 && !this.loading()) {
      this.loadRoot();
    }
  }

  toggle(regNo: number): void {
    const expanded = new Set(this.expandedNodes());
    if (expanded.has(regNo)) {
      expanded.delete(regNo);
      this.expandedNodes.set(expanded);
      return;
    }

    expanded.add(regNo);
    this.expandedNodes.set(expanded);

    const cache = this.childrenCache();
    if (!cache.has(regNo)) {
      this.loadChildren(regNo, 1);
    }
  }

  isExpanded(regNo: number): boolean {
    return this.expandedNodes().has(regNo);
  }

  isLoadingNode(regNo: number): boolean {
    return this.loadingNodes().has(regNo);
  }

  expandAll(): void {
    const expanded = new Set<number>();
    const cache = this.childrenCache();
    const toLoad: number[] = [];

    const collect = (nodes: TeamHierarchyNode[]): void => {
      for (const node of nodes) {
        if (node.hasChildren) {
          expanded.add(node.regNo);
          if (!cache.has(node.regNo)) {
            toLoad.push(node.regNo);
          }
          const children = cache.get(node.regNo);
          if (children) collect(children);
        }
      }
    };

    collect(this.rootChildren());
    this.expandedNodes.set(expanded);

    for (const regNo of toLoad) {
      this.loadChildren(regNo, 1);
    }
  }

  collapseAll(): void {
    this.expandedNodes.set(new Set());
  }

  goRootPage(page: number): void {
    if (page < 1 || page > this.rootTotalPages()) return;
    this.rootPage.set(page);
    this.loadRoot();
  }

  loadMoreChildren(parentRegNo: number): void {
    const info = this.nodePageInfo().get(parentRegNo);
    if (!info || info.page >= info.totalPages) return;
    this.loadChildren(parentRegNo, info.page + 1);
  }

  exportToCSV(): void {
    const items = this.visibleItems().filter((i) => i.type === 'row') as Extract<FlatItem, { type: 'row' }>[];
    if (items.length === 0) {
      this.showToast('No data to export');
      return;
    }

    const header = 'Name,Login ID,Reg No,Mobile,Direct,Team,Join Date,Status';
    const csvRows = items.map((flat) => {
      const n = flat.node;
      return [
        `"${n.name}"`,
        n.loginId,
        n.regNo,
        n.mobile || '',
        n.directReferralCount,
        n.totalTeamCount,
        n.joinDate || '',
        n.status || '',
      ].join(',');
    });

    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-hierarchy.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('CSV exported successfully');
  }

  copyLoginId(node: TeamHierarchyNode): void {
    navigator.clipboard.writeText(node.loginId).then(() => {
      this.showToast('Login ID copied!');
    }).catch(() => {
      this.showToast('Failed to copy');
    });
  }

  getInitials = initials;

  hasProfileImage(img: string | undefined): boolean {
    return !!img && /^\d+$/.test(img);
  }

  getProfileImageSrc(img: string | undefined): string {
    return this.mediaService.getFileUrl(Number(img));
  }

  getStatusClasses(status: string | number | undefined | null): string {
    const s = String(status ?? '').toLowerCase();
    if (s === 'active') return 'bg-emerald-50 text-emerald-700';
    if (s === 'inactive') return 'bg-gray-100 text-gray-500';
    if (s === 'pending') return 'bg-amber-50 text-amber-700';
    if (s === 'blocked') return 'bg-red-50 text-red-700';
    return 'bg-gray-100 text-gray-500';
  }

  private loadRoot(): void {
    this.loading.set(true);
    this.error.set('');
    this.cdr.markForCheck();

    this.teamService.getHierarchy(this.memberId() || undefined, this.rootPage(), this.rootPageSize()).subscribe({
      next: (res) => {
        const member = res.currentMember;
        const children = Array.isArray(res.children) ? res.children : [];
        this.rootMember.set(member);
        this.rootChildren.set(children);
        this.rootTotalPages.set(res.totalPages ?? 1);
        this.rootTotalRecords.set(res.totalRecords ?? 0);
        this.loading.set(false);

        if (member && children.length === 0 && this.rootPage() === 1) {
          this.loadChildren(member.regNo, 1);
          const expanded = new Set(this.expandedNodes());
          expanded.add(member.regNo);
          this.expandedNodes.set(expanded);
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.rootMember.set(null);
        this.rootChildren.set([]);
        this.loading.set(false);
        this.error.set(err?.message || 'Failed to load team hierarchy. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  private loadChildren(parentRegNo: number, page: number): void {
    const loading = new Set(this.loadingNodes());
    loading.add(parentRegNo);
    this.loadingNodes.set(loading);

    this.teamService.getHierarchyChildren(String(parentRegNo), page, this.rootPageSize()).subscribe({
      next: (res) => {
        const newChildren = (res.items ?? []) as unknown as TeamHierarchyNode[];
        const member = this.rootMember();
        const isFirstPage = page === 1;

        if (member && parentRegNo === member.regNo) {
          if (isFirstPage) {
            this.rootChildren.set(newChildren);
          } else {
            this.rootChildren.set([...this.rootChildren(), ...newChildren]);
          }
        } else {
          const cache = new Map(this.childrenCache());
          if (isFirstPage) {
            cache.set(parentRegNo, newChildren);
          } else {
            const existing = cache.get(parentRegNo) ?? [];
            cache.set(parentRegNo, [...existing, ...newChildren]);
          }
          this.childrenCache.set(cache);
        }

        const infoMap = new Map(this.nodePageInfo());
        infoMap.set(parentRegNo, { page: res.page, totalPages: res.totalPages });
        this.nodePageInfo.set(infoMap);

        const l = new Set(this.loadingNodes());
        l.delete(parentRegNo);
        this.loadingNodes.set(l);
        this.cdr.markForCheck();
      },
      error: () => {
        const l = new Set(this.loadingNodes());
        l.delete(parentRegNo);
        this.loadingNodes.set(l);

        if (page === 1) {
          const expanded = new Set(this.expandedNodes());
          expanded.delete(parentRegNo);
          this.expandedNodes.set(expanded);
        }
        this.cdr.markForCheck();
      },
    });
  }

  private showToast(message: string): void {
    this.toast.set(message);
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.set('');
      this.cdr.markForCheck();
    }, 2000);
  }
}
