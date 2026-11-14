import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MembersListComponent } from '@org/ui';

@Component({
  selector: 'app-admin-members-list-page',
  standalone: true,
  imports: [MembersListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-members-list [isAdmin]="true" />`,
})
export class AdminMembersListPageComponent {}
