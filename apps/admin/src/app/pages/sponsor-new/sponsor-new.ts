import { Component } from '@angular/core';
import { SponsorRegistrationComponent } from '@org/form-controls';

@Component({
  selector: 'app-admin-sponsor-new',
  standalone: true,
  imports: [SponsorRegistrationComponent],
  template: `
    <div class="p-6">
      <app-sponsor-registration
        submitButtonText="Register New Member"
        submitLoadingText="Registering..."
      />
    </div>
  `,
})
export class AdminSponsorNewComponent {}
