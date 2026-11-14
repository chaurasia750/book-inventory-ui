import { Component } from '@angular/core';
import { ChangePasswordScreenComponent } from '@org/layout';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ChangePasswordScreenComponent],
  template: `<lib-change-password-screen />`,
})
export class ChangePasswordComponent {}
