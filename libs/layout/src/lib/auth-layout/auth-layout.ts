import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthBrandShellComponent } from '../auth-brand-shell/auth-brand-shell';

/** Platform spec U11: the frame of the forgot / reset password and welcome routes - the shared brand shell. */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, AuthBrandShellComponent],
  templateUrl: './auth-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
