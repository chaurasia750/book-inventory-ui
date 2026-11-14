import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MembersListComponent } from '@org/ui';

@Component({
  selector: 'app-members-list-page',
  standalone: true,
  imports: [MembersListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-members-list />`,
})
export class MembersListComponentPage {}
