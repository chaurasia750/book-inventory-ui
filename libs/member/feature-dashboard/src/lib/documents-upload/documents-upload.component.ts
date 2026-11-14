import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, computed } from '@angular/core';
import { DocumentDto, MemberDocumentDto, MemberDocumentService, MediaService } from '@org/api-services';
import { SidePanelComponent } from '@org/ui';
import { switchMap, of } from 'rxjs';

interface DocumentField {
  key: string;
  label: string;
  documentId: number;
  hint: string;
  accept: string;
  required: boolean;
}

interface DocumentState {
  file: File | null;
  error?: string;
}

@Component({
  selector: 'app-documents-upload',
  standalone: true,
  imports: [SidePanelComponent],
  templateUrl: './documents-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsUploadComponent implements OnInit {
  private readonly memberDocumentService = inject(MemberDocumentService);
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly MAX_FILE_SIZE = 1 * 1024 * 1024;

  readonly states = signal<Record<string, DocumentState>>({});
  readonly uploadedDocs = signal<MemberDocumentDto[]>([]);
  readonly fileUrls = signal<Record<number, string>>({});
  readonly documentTypes = signal<DocumentDto[]>([]);
  readonly loading = signal(false);
  readonly savingFields = signal<Record<string, boolean>>({});
  readonly previewDoc = signal<MemberDocumentDto | null>(null);

  readonly fields = computed<DocumentField[]>(() => {
    return this.documentTypes().map((doc) => ({
      key: doc.id.toString(),
      label: doc.name,
      documentId: doc.id,
      hint: 'JPG, PNG or PDF · 1MB max',
      accept: 'image/jpeg,image/png,application/pdf',
      required: true,
    }));
  });

  ngOnInit(): void {
    this.fetchDocumentTypes();
    this.fetchUploadedDocs();
  }

  fetchDocumentTypes(): void {
    this.memberDocumentService.getDocuments().subscribe({
      next: (types) => this.documentTypes.set(types),
      error: () => this.documentTypes.set([]),
    });
  }

  fetchUploadedDocs(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.memberDocumentService.getMyDocuments().subscribe({
      next: (docs) => {
        this.uploadedDocs.set(docs);
        this.loading.set(false);
        this.buildFileUrls(docs);
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploadedDocs.set([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  getUploadedDoc(key: string): MemberDocumentDto | undefined {
    const field = this.fields().find((f) => f.key === key);
    if (!field) return undefined;
    return this.uploadedDocs().find((d) => d.documentName.toLowerCase() === field.label.toLowerCase());
  }

  onFileSelected(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > this.MAX_FILE_SIZE) {
      this.states.update((prev) => ({ ...prev, [key]: { file: null, error: 'File size must be 1MB or less' } }));
      return;
    }
    this.states.update((prev) => ({ ...prev, [key]: { file, error: undefined } }));
  }

  remove(key: string): void {
    this.states.update((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  saveDocuments(): void {
    const entries = Object.entries(this.states()).filter(([, s]) => s.file);
    if (!entries.length) return;

    for (const [key, state] of entries) {
      const field = this.fields().find((f) => f.key === key);
      const documentId = field?.documentId ?? 0;

      this.savingFields.update((prev) => ({ ...prev, [key]: true }));
      this.cdr.markForCheck();

      this.mediaService.tempUpload([state.file!]).pipe(
        switchMap((result) => {
          const mediaId = result.files?.[0]?.id;
          if (mediaId) {
            return this.memberDocumentService.saveDocument(documentId, mediaId);
          }
          return of(null);
        }),
      ).subscribe({
        next: () => {
          this.savingFields.update((prev) => ({ ...prev, [key]: false }));
          this.states.update((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          this.fetchUploadedDocs();
          this.cdr.markForCheck();
        },
        error: () => {
          this.savingFields.update((prev) => ({ ...prev, [key]: false }));
          this.cdr.markForCheck();
        },
      });
    }
  }

  previewDocument(doc: MemberDocumentDto): void {
    this.previewDoc.set(doc);
  }

  closePreview(): void {
    this.previewDoc.set(null);
  }

  formatDate(date: string | null): string {
    if (!date) return '';
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

  private buildFileUrls(docs: MemberDocumentDto[]): void {
    const urls: Record<number, string> = {};
    for (const doc of docs) {
      if (doc.mediaId) {
        urls[doc.mediaId] = this.mediaService.getFileUrl(doc.mediaId);
      }
    }
    this.fileUrls.set(urls);
  }
}
