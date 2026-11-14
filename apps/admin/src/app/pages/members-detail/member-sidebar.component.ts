import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MemberDetailService, MemberProfile } from '@org/api-services';
import { initials } from '@org/shared-utils';

@Component({
  selector: 'app-member-sidebar',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-sidebar.component.html',
})
export class MemberSidebarComponent {
  readonly service = inject(MemberDetailService);
  readonly member = this.service.member;
  readonly loading = this.service.loading;
  initials = initials;

  readonly profile = input<MemberProfile | null>(null);

  fullName(): string {
    const p = this.profile();
    const name = [p?.title, p?.firstName, p?.lastName].filter((v) => v?.trim()).join(' ');
    if (name.trim()) return name;
    return this.member()?.fullName ?? '—';
  }

  memberNo(): string {
    const p = this.profile();
    return p?.loginId ?? p?.registrationNumber ?? this.member()?.memberId ?? '—';
  }

  franchiseName(): string {
    return this.profile()?.franchiseName ?? '—';
  }

  sponsorName(): string {
    const s = this.profile()?.sponsorDetails;
    const name = [s?.title, s?.fName, s?.lName].filter((v) => v?.trim()).join(' ');
    if (name.trim()) return name;
    return this.member()?.sponsorName ?? '—';
  }

  joinedDate(): string {
    return this.profile()?.registrationDate ?? this.member()?.joiningDate ?? '—';
  }

  email(): string {
    return this.profile()?.emailId ?? this.member()?.email ?? '—';
  }

  phone(): string {
    return this.profile()?.primaryContactNumber ?? this.member()?.phone ?? '—';
  }

  addressLine(): string {
    const a = this.profile()?.address;
    const line = [a?.houseNo, a?.street, a?.city, a?.state, a?.zipCode].filter((v) => v?.trim()).join(', ');
    if (line.trim()) return line;
    const m = this.member();
    return m?.address ? `${m.address}, ${m.state}` : '—';
  }
}
