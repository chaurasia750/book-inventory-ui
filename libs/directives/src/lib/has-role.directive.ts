import {
  Directive,
  Input,
  InjectionToken,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';

export const CURRENT_USER_ROLES = new InjectionToken<() => string[]>('CURRENT_USER_ROLES');

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly getCurrentUserRoles = inject(CURRENT_USER_ROLES, { optional: true });

  @Input() appHasRole: string[] = [];

  ngOnInit(): void {
    if (this.hasAllowedRole()) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainerRef.clear();
    }
  }

  private hasAllowedRole(): boolean {
    if (!this.getCurrentUserRoles) {
      return true;
    }

    const allowedRoles = this.appHasRole ?? [];

    if (allowedRoles.length === 0) {
      return true;
    }

    const currentRoles = this.getCurrentUserRoles();

    return allowedRoles.some((role) => currentRoles.includes(role));
  }
}
