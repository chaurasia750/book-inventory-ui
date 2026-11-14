import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, Optional, signal } from '@angular/core';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { AdminMemberDocumentDto, MemberDocumentService, MediaService } from '@org/api-services';
import { SidePanelComponent } from '@org/ui';

@Component({
  selector: 'app-member-documents',
  standalone: true,
  imports: [SidePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-documents.component.html',
})
export class MemberDocumentsComponent implements OnInit {
  @Optional() private readonly memberId = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly memberDocumentService = inject(MemberDocumentService);
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly documents = signal<AdminMemberDocumentDto[]>([]);
  readonly loading = signal(true);
  readonly processingId = signal<number | null>(null);
  readonly actionType = signal<'approve' | 'reject' | null>(null);
  readonly showRejectModal = signal(false);
  readonly rejectReason = signal('');
  readonly previewDoc = signal<AdminMemberDocumentDto | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly fileUrls = signal<Record<number, string>>({});
  private rejectDocId = 0;

  ngOnInit(): void {
    const id = this.memberId?.();
    if (id) {
      this.fetchDocuments(id);
    } else {
      this.loading.set(false);
    }
  }

  private fetchDocuments(memberId: string): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.memberDocumentService.getMemberDocuments(memberId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.buildFileUrls(docs);
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

  openPreview(doc: AdminMemberDocumentDto): void {
    this.previewDoc.set(doc);
    this.previewUrl.set(doc.mediaId ? this.mediaService.getFileUrl(doc.mediaId) : null);
    this.cdr.markForCheck();
  }

  closePreview(): void {
    this.previewDoc.set(null);
    this.previewUrl.set(null);
    this.cdr.markForCheck();
  }

  private buildFileUrls(docs: AdminMemberDocumentDto[]): void {
    const urls: Record<number, string> = {};
    for (const doc of docs) {
      if (doc.mediaId) {
        urls[doc.mediaId] = this.mediaService.getFileUrl(doc.mediaId);
      }
    }
    this.fileUrls.set(urls);
  }

  getFileUrl(mediaId: number): string {
    return this.fileUrls()[mediaId] || '';
  }

  approve(id: number): void {
    this.processingId.set(id);
    this.actionType.set('approve');
    this.cdr.markForCheck();
    this.memberDocumentService.approveDocument(id).subscribe({
      next: () => this.refreshAfterAction(),
      error: () => this.refreshAfterAction(),
    });
  }

  openReject(id: number): void {
    this.rejectDocId = id;
    this.rejectReason.set('');
    this.showRejectModal.set(true);
    this.cdr.markForCheck();
  }

  closeReject(): void {
    this.showRejectModal.set(false);
    this.rejectReason.set('');
    this.cdr.markForCheck();
  }

  reject(): void {
    if (!this.rejectReason().trim()) return;
    const id = this.rejectDocId;
    this.processingId.set(id);
    this.actionType.set('reject');
    this.showRejectModal.set(false);
    this.cdr.markForCheck();
    this.memberDocumentService.rejectDocument(id, this.rejectReason()).subscribe({
      next: () => this.refreshAfterAction(),
      error: () => this.refreshAfterAction(),
    });
  }

  private refreshAfterAction(): void {
    this.processingId.set(null);
    this.actionType.set(null);
    const memberId = this.memberId?.();
    if (memberId) {
      this.fetchDocuments(memberId);
    } else {
      this.cdr.markForCheck();
    }
  }

  statusLabel(status: number | string): string {
    const s = String(status).toLowerCase();
    if (s === '0' || s === '1' || s === 'pending') return 'Pending';
    if (s === '2' || s === 'approved') return 'Approved';
    if (s === '3' || s === 'rejected') return 'Rejected';
    return 'Unknown';
  }

  statusClass(status: number | string): string {
    const s = String(status).toLowerCase();
    if (s === '0' || s === '1' || s === 'pending')
      return 'inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200';
    if (s === '2' || s === 'approved')
      return 'inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200';
    if (s === '3' || s === 'rejected')
      return 'inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200';
    return 'inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 border border-gray-200';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  }
}
