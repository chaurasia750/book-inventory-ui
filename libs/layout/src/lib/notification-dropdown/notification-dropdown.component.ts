import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDropdownComponent {
  isOpen = false;
  notifying = true;

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.notifying = false;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  onBackdropClick(): void {
    this.closeDropdown();
  }
}
