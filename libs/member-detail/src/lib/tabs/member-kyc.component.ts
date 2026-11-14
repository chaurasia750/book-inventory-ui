import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MemberDetailService } from '@org/api-services';

@Component({
  selector: 'app-member-kyc',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-kyc.component.html',
})
export class MemberKycComponent {
  readonly service = inject(MemberDetailService);

  readonly verificationTimeline = [
    { id: 1, label: 'PAN Card Verified', date: '20 Jan 2025, 02:30 PM', dotClass: 'bg-green-500' },
    { id: 2, label: 'Aadhaar Card Verified', date: '20 Jan 2025, 02:35 PM', dotClass: 'bg-green-500' },
    { id: 3, label: 'Bank Account Verified', date: '21 Jan 2025, 10:00 AM', dotClass: 'bg-green-500' },
    { id: 4, label: 'Cancelled Cheque Submitted', date: '21 Jan 2025, 10:05 AM', dotClass: 'bg-green-500' },
    { id: 5, label: 'KYC Completed', date: '21 Jan 2025, 11:00 AM', dotClass: 'bg-green-500' },
  ];
}
