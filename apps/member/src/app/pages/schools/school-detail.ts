import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { SchoolDetail } from '@org/shared-models';
import { schoolStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent, injectRouteParam } from '@org/ui';
import { LedgerStatementComponent } from '../ledger/ledger-statement';
import { PartyLedgerSummaryComponent } from '../ledger/party-ledger-summary';
import { SchoolDocumentsTabComponent } from '../sales/school-documents-tab';
import { SchoolCountersTabComponent } from '../counters/school-counters-tab';
import { SchoolReturnsTabComponent } from '../returns/school-returns-tab';
import { SchoolPaymentsTabComponent } from '../payment/school-payments-tab';
import { InvoiceLayoutSettingComponent } from '../sales/invoice-layout-setting';
import { BookListsTabComponent } from '../planning/book-lists-tab';
import { MoneyPipe } from '../counters/money.pipe';

/** Planning section 6: the Book lists tab joins the profile tabs. */
type ProfileTab = 'profile' | 'classes' | 'orders' | 'invoices' | 'payments' | 'bookLists' | 'ledger' | 'counters' | 'returns';

/** The segment of a tab in the address: the tab's name, with `bookLists` written `book-lists`. */
const tabPath = (tab: ProfileTab): string => (tab === 'bookLists' ? 'book-lists' : tab);

/**
 * One school's profile (school spec R6-R8, R10, R12; finance section 6): tabs Profile, Classes and, for the Owner, Ledger, and
 * the balance in the header. The master data with the generated code read-only, the edit dialog, the class
 * list editor (add, rename, move, remove; a duplicate name is caught before the request) and activate / deactivate. Staff
 * see everything read-only. The API enforces every rule again; its catalogue message is shown on a refusal.
 */
@Component({
  selector: 'app-school-detail',
  standalone: true,
  imports: [NgClass, RouterLink, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent, LedgerStatementComponent, PartyLedgerSummaryComponent, SchoolDocumentsTabComponent, SchoolCountersTabComponent, SchoolReturnsTabComponent, SchoolPaymentsTabComponent, InvoiceLayoutSettingComponent, BookListsTabComponent, MoneyPipe],
  templateUrl: './school-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetailComponent {
  /** The school open beside the list (platform U10); a new id loads that school. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** The school's name, status or code-bearing data changed: the list beside it reloads. */
  readonly changed = output<void>();
  /** The Edit button: the page opens the edit form in the panel. */
  readonly editRequested = output<void>();

  private readonly schools = inject(SchoolService);
  private readonly translate = inject(TranslateService);

  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  /** Platform U16: the tab is the `tab` of the address (`/schools/:id/payments`), so it can be linked; no tab in the address is the profile. */
  private readonly routeTab = injectRouteParam('tab');
  /** The tabs this account sees: the ledger is the Owner's only (finance R13). */
  /** Sales section 6: the school's orders and invoices are tabs of its profile (Owner and Staff); the payments (payment R2) and the ledger are the Owner's. */
  readonly tabs: readonly ProfileTab[] = this.canEdit
    ? ['profile', 'orders', 'invoices', 'counters', 'returns', 'payments', 'bookLists', 'ledger', 'classes']
    : ['profile', 'orders', 'invoices', 'counters', 'returns', 'bookLists', 'classes'];

  /** The tab shown: the one in the address when this account sees it, else the profile. */
  readonly tab = computed<ProfileTab>(() => this.tabs.find((t) => tabPath(t) === this.routeTab()) ?? 'profile');

  /** The address of a tab of this school (the profile is the school's own address). */
  tabLink(tab: ProfileTab): string[] {
    return tab === 'profile' ? ['/schools', this.id()] : ['/schools', this.id(), tabPath(tab)];
  }

  readonly school = signal<SchoolDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly classNames = signal<string[]>([]);
  readonly classesDirty = signal(false);
  readonly classesSaving = signal(false);
  readonly classesError = signal('');
  readonly newClass = signal('');

  readonly statusOpen = signal(false);
  readonly statusSaving = signal(false);
  readonly statusError = signal('');

  statusClass = schoolStatusBadgeClass;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.schools.get(this.id()).subscribe({
      next: (school) => {
        this.loading.set(false);
        this.school.set(school);
        this.resetClasses(school);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  setNewClass(value: string): void {
    this.newClass.set(value);
  }

  addClass(): void {
    const name = this.newClass().trim();
    if (!name) {
      return;
    }

    this.classNames.update((names) => [...names, name]);
    this.newClass.set('');
    this.classesDirty.set(true);
  }

  renameClass(index: number, value: string): void {
    this.classNames.update((names) => names.map((n, i) => (i === index ? value : n)));
    this.classesDirty.set(true);
  }

  moveClass(index: number, step: -1 | 1): void {
    const target = index + step;
    this.classNames.update((names) => {
      if (target < 0 || target >= names.length) {
        return names;
      }

      const next = [...names];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    this.classesDirty.set(true);
  }

  removeClass(index: number): void {
    this.classNames.update((names) => names.filter((_, i) => i !== index));
    this.classesDirty.set(true);
  }

  discardClasses(): void {
    const school = this.school();
    if (school) {
      this.resetClasses(school);
    }
  }

  /** R6: class names are unique within the school (case-insensitive) and not blank; checked here before the request. */
  saveClasses(): void {
    const names = this.classNames().map((n) => n.trim());
    if (names.some((n) => !n)) {
      this.classesError.set(this.translate.instant('school.classes.blank'));
      return;
    }

    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
      this.classesError.set(this.translate.instant('school.classes.duplicate'));
      return;
    }

    this.classesSaving.set(true);
    this.classesError.set('');
    this.schools.replaceClasses(this.id(), names).subscribe({
      next: () => {
        this.classesSaving.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.classesSaving.set(false);
        this.classesError.set(messageForError(error, this.translate));
      },
    });
  }

  openStatus(): void {
    this.statusError.set('');
    this.statusOpen.set(true);
  }

  changeStatus(): void {
    const school = this.school();
    if (!school) {
      return;
    }

    this.statusSaving.set(true);
    this.statusError.set('');
    const call = school.status === 'ACTIVE' ? this.schools.deactivate(this.id()) : this.schools.activate(this.id());
    call.subscribe({
      next: () => {
        this.statusSaving.set(false);
        this.statusOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.statusSaving.set(false);
        this.statusError.set(messageForError(error, this.translate));
      },
    });
  }

  private resetClasses(school: SchoolDetail): void {
    this.classNames.set(school.classes.map((c) => c.name));
    this.classesDirty.set(false);
    this.classesError.set('');
  }
}
