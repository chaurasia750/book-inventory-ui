import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '@org/ui';
import { AddressFormComponent } from '@org/form-controls';
import { LeadsService } from '../../services/leads.service';
import { UsersService } from '../../services/users.service';
import { AddLeadRequest, LeadLookupItem, LeadDetail } from '../../models/lead-api.model';
import { User } from '../../models/user.model';
import { LeadInfoFormComponent } from './lead-info-form/lead-info-form.component';
import { LeadStepperComponent } from './lead-stepper/lead-stepper.component';
import { LeadNotesFollowupFormComponent } from './lead-notes-followup-form/lead-notes-followup-form.component';
import { LeadReviewSaveFormComponent } from './lead-review-save-form/lead-review-save-form.component';

export interface Priority {
  value: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-leads-add-lead',
  standalone: true,
  imports: [
    ReactiveFormsModule, BreadcrumbComponent, AddressFormComponent,
    LeadInfoFormComponent, LeadStepperComponent,
    LeadNotesFollowupFormComponent, LeadReviewSaveFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl">
      <app-breadcrumb class="mb-6" [pageTitle]="isEditMode() ? 'Edit Lead' : 'Add Lead'" [items]="breadcrumbItems"/>
      <div class="mb-6">
        <app-lead-stepper [steps]="steps" [currentStep]="currentStep()"/>
      </div>

      <div [formGroup]="form" class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        @if (currentStep() === 1) {
          <div class="px-6 sm:px-8 pt-6 pb-5">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Customer Information</h3>
            <app-lead-info-form [form]="form"
                                [leadSources]="leadSources()"
                                [leadStatuses]="leadStatuses()"
                                [users]="users()"
                                [showAssignUser]="true"/>
          </div>
          <div class="border-t border-gray-100"></div>
          <div class="px-6 sm:px-8 pt-6 pb-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Customer Address</h3>
            <app-address-form [formGroup]="form"/>
          </div>
        }

        @if (currentStep() === 2) {
          <div class="p-6 sm:p-8 space-y-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Notes & Follow Up</h3>
            <app-lead-notes-followup-form [form]="form" [priorities]="priorities" [availableTags]="availableTags"/>
          </div>
        }

        @if (currentStep() === 3) {
          <div class="p-6 sm:p-8">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{{ isEditMode() ? 'Review & Update' : 'Review & Save' }}</h3>
            <app-lead-review-save-form [form]="form" [priorities]="priorities" [users]="users()" [leadSources]="leadSources()" [leadStatuses]="leadStatuses()"/>
          </div>
        }

        @if (submitError()) {
          <div class="px-6 py-3 bg-red-50 border-t border-red-100">
            <p class="text-sm text-red-600 flex items-center gap-2">{{ submitError() }}</p>
          </div>
        }

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 px-6 py-4">
          <button type="button" (click)="onCancel()" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50">Cancel</button>
          <div class="flex items-center gap-3">
            @if (!isFirstStep()) {
              <button type="button" (click)="previousStep()" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Previous
              </button>
            }
            @if (!isLastStep()) {
              <button type="button" (click)="nextStep()" class="inline-flex items-center gap-2 rounded-xl bg-[#66B42A] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#66B42A]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                Next
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            }
            @if (isLastStep()) {
              <button type="button" (click)="onSubmit()" [disabled]="submitting()" class="inline-flex items-center gap-2 rounded-xl bg-[#66B42A] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#66B42A]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {{ submitting() ? 'Saving...' : (isEditMode() ? 'Update Lead' : 'Save Lead') }}
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LeadsAddLeadComponent implements OnInit {
  readonly leadId = input<number | undefined>();
  readonly appPrefix = input('');
  readonly initialPropertyId = input<number | undefined>();

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly leadsService = inject(LeadsService);
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  submitting = signal(false);
  submitError = signal('');
  currentStep = signal(1);
  totalSteps = 3;

  breadcrumbItems: BreadcrumbItem[] = [];
  readonly steps = [{ id: 1, label: 'Lead Information' }, { id: 2, label: 'Notes & Follow Up' }, { id: 3, label: 'Review & Save' }];
  readonly leadSources = signal<LeadLookupItem[]>([]);
  readonly leadStatuses = signal<LeadLookupItem[]>([]);
  readonly users = signal<User[]>([]);
  readonly priorities: Priority[] = [{ value: 'high', label: 'High', color: '#EF4444' }, { value: 'medium', label: 'Medium', color: '#F59E0B' }, { value: 'low', label: 'Low', color: '#10B981' }];
  readonly availableTags = ['Urgent', 'High Budget', 'Decision Maker', 'Follow-up', 'New', 'VIP', 'Corporate', 'Individual'];

  readonly form: FormGroup = this.fb.group({
    title: ['', Validators.required], firstName: ['', Validators.required], lastName: ['', Validators.required],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], email: ['', [Validators.required, Validators.email]],
    leadSource: ['', Validators.required], leadStatus: ['', Validators.required], gender: ['male', Validators.required],
    assignedUser: ['', Validators.required], expectedAmount: [0, [Validators.required, Validators.min(0)]],
    probabilityPercentage: [50], description: [''], addressLine1: ['', Validators.required], addressLine2: [''],
    postalCode: ['', Validators.required], city: ['', Validators.required], country: ['India'], state: ['', Validators.required],
    notes: [''], followUpDate: [''], followUpTime: [''], priority: ['medium', Validators.required], tags: [[]],
    inventoryTypeId: [''], inventoryPropertyId: [''],
  });

  ngOnInit(): void {
    this.isEditMode.set(!!this.leadId());
    this.breadcrumbItems = [{ label: 'CRM', link: '/leads' }, { label: 'Leads', link: '/leads/list' }, { label: this.leadId() ? 'Edit Lead' : 'Add Lead' }];

    this.leadsService.getLeadSources().pipe(takeUntilDestroyed()).subscribe({ next: (d) => this.leadSources.set(d) });
    this.leadsService.getLeadStatusLookup().pipe(takeUntilDestroyed()).subscribe({ next: (d) => this.leadStatuses.set(d) });
    this.usersService.getUsers().pipe(takeUntilDestroyed()).subscribe({ next: (d) => this.users.set(d) });

    if (this.leadId()) {
      this.leadsService.getLeadById(this.leadId()!).pipe(takeUntilDestroyed()).subscribe({ next: (lead) => this.patchForm(lead) });
    }
  }

  private patchForm(lead: LeadDetail): void {
    this.form.patchValue({
      firstName: lead.contact.firstName, lastName: lead.contact.lastName,
      email: lead.contact.email, leadStatus: lead.status.id, assignedUser: lead.assignedUser?.id ?? '',
      expectedAmount: lead.expectedAmount, description: lead.description,
      addressLine1: lead.contact.addressLine1, postalCode: lead.contact.pincode,
      city: lead.contact.cityName, state: lead.contact.stateName,
    });
  }

  get moduleName(): string { return this.appPrefix() === 'member' ? 'Customers' : 'Leads'; }

  isLastStep(): boolean { return this.currentStep() === this.totalSteps; }
  isFirstStep(): boolean { return this.currentStep() === 1; }

  nextStep(): void { if (this.currentStep() < this.totalSteps) this.currentStep.set(this.currentStep() + 1); }
  previousStep(): void { if (this.currentStep() > 1) this.currentStep.set(this.currentStep() - 1); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = this.form.value;
    const payload: AddLeadRequest = {
      customerInfo: { firstName: v.firstName, lastName: v.lastName, mobile: v.mobileNumber, alternateMobile: '', email: v.email, gender: v.gender, stateName: v.state, cityName: v.city, pincode: v.postalCode, addressLine1: v.addressLine1, addressLine2: v.addressLine2 || '' },
      title: `${v.title} ${v.firstName} ${v.lastName}`.trim(), description: v.description || '',
      leadForId: v.inventoryPropertyId ? +v.inventoryPropertyId : 0, statusId: v.leadStatus || 0,
      priority: v.priority, expectedAmount: v.expectedAmount || 0, closingProbability: v.probabilityPercentage,
      expectedCloseDate: '', nextFollowupDate: v.followUpDate || '', assignedUserId: v.assignedUser ? +v.assignedUser : 0,
      sourceId: v.leadSource || 0, note: v.notes || '', tagIds: [],
    };
    const onSuccess = () => { this.submitting.set(false); this.router.navigate(['/leads/list']); };
    const onError = (err: unknown) => { this.submitting.set(false); this.submitError.set((err as { error?: { message?: string } })?.error?.message || 'Failed to save lead'); };
    if (this.isEditMode() && this.leadId()) {
      this.leadsService.updateLead(this.leadId()!, payload).pipe(takeUntilDestroyed()).subscribe({ next: onSuccess, error: onError });
    } else {
      this.leadsService.addLead(payload).pipe(takeUntilDestroyed()).subscribe({ next: onSuccess, error: onError });
    }
  }

  onCancel(): void { this.router.navigate(['/leads/list']); }
}
