import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SponsorRegistrationComponent } from '@org/form-controls';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, TranslatePipe, SponsorRegistrationComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {}
