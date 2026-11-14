import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MemberDataService } from '@org/member-data-access';

@Component({
  selector: 'app-sidebar-sponsor-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-sponsor-details.component.html',
})
export class SidebarSponsorDetailsComponent {
  readonly data = inject(MemberDataService);
}
