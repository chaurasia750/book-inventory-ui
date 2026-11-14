import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-member-footer',
  standalone: true,
  templateUrl: './member-footer.html',
  styleUrl: './member-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberFooterComponent {
  get year(): number {
    return new Date().getFullYear();
  }
}
