import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb';
import { PaginationComponent } from '../pagination/pagination';
import { SidePanelComponent } from '../side-panel/side-panel';
import { MembersService, Member, MemberLoginDetails, MediaService } from '@org/api-services';
import { initials } from '@org/shared-utils';
import { SecureImgDirective } from '@org/directives';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    PaginationComponent,
    SidePanelComponent,
    SecureImgDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './members-list.html',
})
export class MembersListComponent implements OnInit {
  private readonly membersService = inject(MembersService);
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  readonly isAdmin = input(false);
  readonly showBreadcrumb = input(true);

  readonly members = signal<Member[]>([]);
  readonly loading = signal(true);
  readonly pageIndex = signal(1);
  readonly pageSize = signal(25);
  readonly totalCount = signal(0);

  readonly panelOpen = signal(false);
  readonly selectedMember = signal<Member | null>(null);
  readonly loginDetails = signal<MemberLoginDetails | null>(null);
  readonly loginLoading = signal(false);
  readonly showPassword = signal(false);

  keyword = '';
  status: number | null = null;

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.loadMembers();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.pageIndex.set(1);
      this.loadMembers();
    });
  }

  private loadMembers(): void {
    this.loading.set(true);

    const params: Record<string, string | number | boolean> = {
      PageIndex: this.pageIndex(),
      PageSize: this.pageSize(),
    };
    if (this.keyword) params['Keyword'] = this.keyword;
    if (this.status !== null) params['Status'] = this.status;

    this.membersService.getMembers(params).subscribe({
      next: (res) => {
        this.members.set(res.items);
        this.pageIndex.set(res.pageIndex);
        this.pageSize.set(res.pageSize);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.members.set([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onKeywordChange(value: string): void {
    this.keyword = value;
    this.searchSubject.next(value);
  }

  onStatusChange(value: number | null): void {
    this.status = value;
    this.pageIndex.set(1);
    this.loadMembers();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadMembers();
  }

  onRowClick(member: Member): void {
    this.router.navigate(['/members', member.memberId, 'details']);
  }

  onNameClick(event: Event, member: Member): void {
    event.stopPropagation();
    this.selectedMember.set(member);
    this.panelOpen.set(true);
    this.loginLoading.set(true);
    this.loginDetails.set(null);
    this.showPassword.set(false);

    this.membersService.getMemberLoginDetails(member.id).subscribe({
      next: (details) => {
        this.loginDetails.set(details);
        this.loginLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loginDetails.set(null);
        this.loginLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onClosePanel(): void {
    this.panelOpen.set(false);
    this.selectedMember.set(null);
    this.loginDetails.set(null);
    this.showPassword.set(false);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  getInitials = initials;

  hasProfileImage(img: string | number | null | undefined): boolean {
    return img != null && String(img).trim() !== '' && /^\d+$/.test(String(img));
  }

  getProfileImageSrc(img: string | number | null | undefined): string {
    if (!this.hasProfileImage(img)) return '';
    return this.mediaService.getFileUrl(Number(img));
  }
}
