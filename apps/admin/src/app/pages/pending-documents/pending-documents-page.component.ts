import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminMemberDocumentDto, MemberDocumentService, MediaService } from '@org/api-services';

@Component({
  selector: 'app-pending-documents-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './pending-documents-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingDocumentsPageComponent implements OnInit {
  private readonly memberDocumentService = inject(MemberDocumentService);
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly documents = signal<AdminMemberDocumentDto[]>([]);
  readonly loading = signal(true);
  readonly memberIdFilter = signal('');
  readonly rejectingId = signal<number | null>(null);
  readonly rejectReason = signal('');
  readonly actionLoading = signal(false);

  ngOnInit(): void {
    this.fetchDocuments();
  }

  fetchDocuments(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    const id = this.memberIdFilter();
    this.memberDocumentService.getPendingDocuments(id || undefined).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.documents.set([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.fetchDocuments();
  }

  viewDocument(mediaId: number): void {
    window.open(this.mediaService.getFileUrl(mediaId), '_blank');
  }

  approveDocument(doc: AdminMemberDocumentDto): void {
    this.actionLoading.set(true);
    this.cdr.markForCheck();
    this.memberDocumentService.approveDocument(doc.id).subscribe({
      next: () => {
        this.documents.update((docs) => docs.filter((d) => d.id !== doc.id));
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  openReject(doc: AdminMemberDocumentDto): void {
    this.rejectingId.set(doc.id);
    this.rejectReason.set('');
    this.cdr.markForCheck();
  }

  cancelReject(): void {
    this.rejectingId.set(null);
    this.rejectReason.set('');
    this.cdr.markForCheck();
  }

  submitReject(): void {
    const id = this.rejectingId();
    const reason = this.rejectReason();
    if (!id || !reason.trim()) return;

    this.actionLoading.set(true);
    this.cdr.markForCheck();
    this.memberDocumentService.rejectDocument(id, reason).subscribe({
      next: () => {
        this.documents.update((docs) => docs.filter((d) => d.id !== id));
        this.rejectingId.set(null);
        this.rejectReason.set('');
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  statusLabel(status: number | string): string {
    const s = String(status).toLowerCase();
    if (s === '1' || s === 'pending') return 'Pending';
    if (s === '2' || s === 'approved') return 'Approved';
    if (s === '3' || s === 'rejected') return 'Rejected';
    return 'Unknown';
  }

  statusClass(status: number | string): string {
    const s = String(status).toLowerCase();
    if (s === '1' || s === 'pending')
      return 'inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700';
    if (s === '2' || s === 'approved')
      return 'inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700';
    if (s === '3' || s === 'rejected')
      return 'inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700';
    return 'inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700';
  }
}
