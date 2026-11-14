import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  templateUrl: './terms-conditions.html',
  styleUrl: './terms-conditions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsConditionsComponent {
  readonly lastUpdated = 'July 1, 2026';
}
