import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {
  readonly lastUpdated = 'July 1, 2026';
}
