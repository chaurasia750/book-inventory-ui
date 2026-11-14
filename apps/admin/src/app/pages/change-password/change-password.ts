import { Component } from '@angular/core';
import { ChangePasswordScreenComponent } from '@org/layout';

@Component({
  selector: 'app-admin-change-password-page',
  standalone: true,
  imports: [ChangePasswordScreenComponent],
  template: `<lib-change-password-screen />`,
})
export class AdminChangePasswordPageComponent {}
