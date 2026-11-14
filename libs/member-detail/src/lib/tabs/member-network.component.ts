import { ChangeDetectionStrategy, Component, inject, OnInit, Optional, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MemberProfileService, NetworkSearchService, TeamService, TeamSummary } from '@org/api-services';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import {
  NetworkDirectComponent,
  NetworkIndirectComponent,
  NetworkTotalComponent,
} from '@org/member-feature-dashboard';

type NetworkTab = 'direct' | 'indirect' | 'total';

@Component({
  selector: 'app-member-network',
  standalone: true,
  imports: [FormsModule, NetworkDirectComponent, NetworkIndirectComponent, NetworkTotalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-network.component.html',
})
export class MemberNetworkComponent implements OnInit {
  @Optional() private readonly memberContext = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly teamApi = inject(TeamService);
  private readonly profileApi = inject(MemberProfileService);
  readonly searchService = inject(NetworkSearchService);

  readonly memberId = signal('');
  readonly registrationNumber = signal('');
  readonly activeTab = signal<NetworkTab>('direct');
  readonly summary = signal<TeamSummary | null>(null);
  readonly summaryLoading = signal(true);

  readonly searchInput = signal('');
  private readonly searchInput$ = new Subject<string>();

  readonly tabs: { label: string; path: NetworkTab }[] = [
    { label: 'Direct Members', path: 'direct' },
    { label: 'Indirect Members', path: 'indirect' },
    { label: 'Total Members', path: 'total' },
  ];

  ngOnInit(): void {
    const id = this.memberContext?.() ?? '';
    this.memberId.set(id);
    this.loadSummary(id);

    if (id) {
      this.profileApi.getProfileByMemberId(id).subscribe({
        next: (p) => this.registrationNumber.set(p.registrationNumber ?? ''),
      });
    }

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchService.term.set(term));
  }

  selectTab(tab: NetworkTab): void {
    this.activeTab.set(tab);
  }

  onSearch(value: string): void {
    this.searchInput.set(value);
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.searchService.term.set('');
    this.searchService.refresh();
  }

  private loadSummary(memberId: string): void {
    this.summaryLoading.set(true);
    this.teamApi.getSummary(memberId || undefined).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.summaryLoading.set(false);
      },
      error: () => this.summaryLoading.set(false),
    });
  }
}
