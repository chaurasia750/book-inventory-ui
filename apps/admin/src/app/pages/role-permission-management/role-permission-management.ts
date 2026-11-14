import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '@org/ui';
import { CheckboxFieldComponent } from '@org/form-controls';
import { Role } from '@org/shared-models';

const PERMISSIONS = ['view_users', 'edit_users', 'view_reports', 'manage_settings'] as const;

interface RolePermissionGroup {
  role: Role;
  label: string;
  form: FormGroup<Record<(typeof PERMISSIONS)[number], FormControl<boolean>>>;
}

@Component({
  selector: 'app-role-permission-management',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, CheckboxFieldComponent],
  templateUrl: './role-permission-management.html',
  styleUrl: './role-permission-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePermissionManagementComponent {
  readonly permissions = PERMISSIONS;

  readonly groups: RolePermissionGroup[] = [
    {
      role: 'admin',
      label: 'Admin',
      form: new FormGroup({
        view_users: new FormControl(true, { nonNullable: true }),
        edit_users: new FormControl(true, { nonNullable: true }),
        view_reports: new FormControl(true, { nonNullable: true }),
        manage_settings: new FormControl(true, { nonNullable: true }),
      }),
    },
    {
      role: 'member',
      label: 'Member',
      form: new FormGroup({
        view_users: new FormControl(true, { nonNullable: true }),
        edit_users: new FormControl(false, { nonNullable: true }),
        view_reports: new FormControl(true, { nonNullable: true }),
        manage_settings: new FormControl(false, { nonNullable: true }),
      }),
    },
  ];

  permissionLabel(permission: string): string {
    return permission
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
