import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MemberProfileService } from '@org/api-services';
import { SponsorRegistrationComponent } from '@org/form-controls';

@Component({
  selector: 'app-sponsor-new',
  standalone: true,
  imports: [SponsorRegistrationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sponsorRegNo) {
      <app-sponsor-registration
        [hideSponsorId]="true"
        [presetSponsorId]="sponsorRegNo"
        submitButtonText="Register Sponsor"
        submitLoadingText="Registering..."
      ></app-sponsor-registration>
    } @else {
      <div class="flex items-center justify-center py-20">
        <svg class="h-8 w-8 animate-spin text-[#66B42A]" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    }
  `,
})
export class SponsorNewComponent implements OnInit {
  private readonly profileService = inject(MemberProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  sponsorRegNo = '';

  ngOnInit() {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        const regNo = profile.registrationNumber;
        this.sponsorRegNo = regNo ? String(regNo).trim() : '';
        this.cdr.detectChanges();
      },
    });
  }
}
