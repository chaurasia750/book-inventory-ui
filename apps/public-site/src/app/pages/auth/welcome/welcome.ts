import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** The page an agent lands on after registering while `Registration:Mode` is `ApprovalRequired`; every text is from the catalogue. */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {}
