import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, tap, filter } from 'rxjs';
import { MemberDataService } from '@org/member-data-access';
import { TeamService, TeamSummary, MemberProfileService, NetworkSearchService } from '@org/api-services';
import { GenealogyApiService, SearchResult, SidePanelComponent } from '@org/ui';
import { SponsorRegistrationComponent } from '@org/form-controls';

@Component({
  selector: 'app-network-shell',
  standalone: true,
  imports: [RouterModule, FormsModule, SidePanelComponent, SponsorRegistrationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './network-shell.component.html',
})
export class NetworkShellComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly data = inject(MemberDataService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly teamService = inject(TeamService);
  readonly searchService = inject(NetworkSearchService);
  private readonly genealogyApi = inject(GenealogyApiService);
  private readonly profileService = inject(MemberProfileService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elRef = inject(ElementRef);
  private sub?: Subscription;
  private searchSub?: Subscription;
  private searchTimeout?: ReturnType<typeof setTimeout>;

  @ViewChild('searchInputRef') searchInputRef!: ElementRef<HTMLInputElement>;

  readonly activeRoute = signal('total');
  readonly summary = signal<TeamSummary | null>(null);
  readonly summaryLoading = signal(true);
  readonly searchInput = signal('');
  readonly showSidePanel = signal(false);
  readonly sponsorRegNo = signal('');
  readonly suggestions = signal<SearchResult[]>([]);
  readonly suggestionsLoading = signal(false);
  readonly showSuggestions = signal(false);
  readonly highlightIndex = signal(-1);

  readonly tabs = [
    { label: 'Direct Members', path: 'direct' },
    { label: 'Indirect Members', path: 'indirect' },
    { label: 'Total Members', path: 'total' },
  ];

  ngOnInit(): void {
    this.syncTab();
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.syncTab());
    this.loadSummary();
    this.loadSponsorRegNo();
  }

  ngAfterViewInit(): void {
    this.searchSub = this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.highlightIndex.set(-1);
        }),
        switchMap((term) => {
          if (!term || term.trim().length < 2) {
            this.suggestions.set([]);
            this.showSuggestions.set(false);
            this.suggestionsLoading.set(false);
            this.cdr.markForCheck();
            return of([]);
          }
          this.suggestionsLoading.set(true);
          this.cdr.markForCheck();
          return this.genealogyApi.search(term.trim()).pipe(
            catchError(() => {
              this.suggestionsLoading.set(false);
              this.cdr.markForCheck();
              return of([]);
            })
          );
        }),
      )
      .subscribe((results) => {
        this.suggestions.set(results);
        this.suggestionsLoading.set(false);
        this.showSuggestions.set(results.length > 0);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.searchSub?.unsubscribe();
    clearTimeout(this.searchTimeout);
  }

  onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.searchInput$.next(value);

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchService.term.set(value);
    }, 500);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;
    if (!this.showSuggestions() || count === 0) {
      if (event.key === 'Escape') {
        this.searchInputRef?.nativeElement?.blur();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightIndex.update((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.highlightIndex();
        if (idx >= 0 && idx < count) {
          this.selectSuggestion(this.suggestions()[idx]);
        } else {
          this.closeSuggestions();
          this.applySearch();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeSuggestions();
        this.searchInputRef?.nativeElement?.blur();
        break;
    }
  }

  selectSuggestion(member: SearchResult): void {
    this.searchInput.set(`${member.name} (${member.registrationNumber})`);
    this.searchService.term.set(member.registrationNumber);
    this.closeSuggestions();
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.searchService.term.set('');
    this.searchService.refresh();
    this.closeSuggestions();
    this.cdr.markForCheck();
  }

  onSearchBlur(): void {
    setTimeout(() => this.closeSuggestions(), 150);
  }

  onSearchFocus(): void {
    if (this.suggestions().length > 0 && this.searchInput().length >= 2) {
      this.showSuggestions.set(true);
    }
  }

  closeSuggestions(): void {
    this.showSuggestions.set(false);
    this.highlightIndex.set(-1);
  }

  applySearch(): void {
    this.searchService.term.set(this.searchInput());
  }

  openSidePanel(): void {
    this.showSidePanel.set(true);
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
  }

  onRegistered(): void {
    this.closeSidePanel();
    this.loadSummary();
    this.searchService.refresh();
  }

  private readonly searchInput$ = new Subject<string>();

  private syncTab(): void {
    const url = this.router.url;
    const tab = this.tabs.find((t) => url.endsWith('/' + t.path));
    this.activeRoute.set(tab?.path ?? 'total');
  }

  private loadSummary(): void {
    this.summaryLoading.set(true);
    this.teamService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.summaryLoading.set(false);
      },
      error: () => {
        this.summaryLoading.set(false);
      },
    });
  }

  private loadSponsorRegNo(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        const regNo = profile.registrationNumber;
        this.sponsorRegNo.set(regNo ? String(regNo).trim() : '');
      },
    });
  }
}
