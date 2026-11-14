import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MemberDetailService, MemberProfile, MemberProfileService } from '@org/api-services';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { MemberSidebarComponent } from './member-sidebar.component';

@Component({
  selector: 'app-member-profile-page',
  standalone: true,
  imports: [RouterModule, RouterOutlet, MemberSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-profile-page.component.html',
  providers: [
    {
      provide: MEMBER_CONTEXT_ID,
      useFactory: (comp: MemberProfilePageComponent) => comp.memberIdSignal,
      deps: [MemberProfilePageComponent],
    },
  ],
})
export class MemberProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(MemberDetailService);
  private readonly profileApi = inject(MemberProfileService);
  readonly loading = this.service.loading;
  readonly member = this.service.member;
  readonly profile = signal<MemberProfile | null>(null);

  readonly memberIdSignal = signal<string>(this.route.snapshot.paramMap.get('memberId') ?? '');
  readonly activeTab = signal('overview');
  private sub?: Subscription;

  readonly tabs = [
    {
      label: 'Overview',
      path: 'overview',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    },
    {
      label: 'Network',
      path: 'network',
      icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    },
    {
      label: 'Income',
      path: 'income',
      icon: 'M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Wallet',
      path: 'wallet',
      icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    },
    {
      label: 'Orders',
      path: 'orders',
      icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
    },
    {
      label: 'Documents',
      path: 'documents',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
    {
      label: 'Activity',
      path: 'activity',
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Settings',
      path: 'settings',
      icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z',
    },
  ];

  ngOnInit(): void {
    const memberId = this.route.snapshot.paramMap.get('memberId');
    if (memberId) {
      this.service.loadMember(memberId);
      this.loadProfile(memberId);
    }

    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.syncActiveTab();
    });
    this.syncActiveTab();
  }

  private syncActiveTab(): void {
    const last = this.router.url.split('/').filter(Boolean).pop();
    this.activeTab.set(last && this.tabs.some((t) => t.path === last) ? last : 'overview');
  }

  private loadProfile(memberId: string): void {
    this.profile.set(null);
    this.profileApi.getProfileByMemberId(memberId).subscribe({
      next: (p) => this.profile.set(p),
      error: () => this.profile.set(null),
    });
  }

  profileFullName(): string {
    const p = this.profile();
    const name = [p?.title, p?.firstName, p?.lastName].filter((v) => v?.trim()).join(' ');
    if (name.trim()) return name;
    return this.member()?.fullName ?? '—';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
