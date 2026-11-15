import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SchoolSummary } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';
import { SchoolChooserComponent } from './school-chooser';
import { SchoolDocumentsTabComponent } from './school-documents-tab';

/**
 * Sales spec R19: the Orders menu. "Order list" shows every school's orders with filters, "Invoices" every school's invoices;
 * "New order" asks for the school first (R27) and opens the order editor. The same list component serves the school profile tabs.
 */
@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, SchoolChooserComponent, SchoolDocumentsTabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-primary-fg">{{ (kind === 'orders' ? 'sales.ordersPage.title' : 'sales.invoicesPage.title') | translate }}</h1>
          <p class="mt-0.5 text-sm text-gray-500">{{ (kind === 'orders' ? 'sales.ordersPage.subtitle' : 'sales.invoicesPage.subtitle') | translate }}</p>
        </div>
        @if (kind === 'orders') {
          <app-button (clicked)="chooserOpen.set(true)">{{ 'sales.orders.new' | translate }}</app-button>
        }
      </div>
      <section class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
        <app-school-documents-tab [kind]="kind" [schoolId]="null" />
      </section>
      @if (kind === 'orders') {
        <app-school-chooser [open]="chooserOpen()" (closed)="chooserOpen.set(false)" (chosen)="start($event)" />
      }
    </div>
  `,
})
export class DocumentsPageComponent {
  private readonly router = inject(Router);

  readonly kind: 'orders' | 'invoices' = (inject(ActivatedRoute).snapshot.data['kind'] as 'orders' | 'invoices') ?? 'orders';
  readonly chooserOpen = signal(false);

  start(school: SchoolSummary): void {
    this.chooserOpen.set(false);
    void this.router.navigate(['/school-orders', 'new'], { queryParams: { schoolId: school.id } });
  }
}
