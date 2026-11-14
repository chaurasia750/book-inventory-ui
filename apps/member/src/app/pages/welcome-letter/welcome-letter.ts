import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MemberProfile, MemberProfileService } from '@org/api-services';
import { take } from 'rxjs';

@Component({
  selector: 'app-welcome-letter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-letter.html',
  styleUrl: './welcome-letter.scss',
})
export class WelcomeLetterComponent implements OnInit {
  @ViewChild('letterSheet') letterSheet!: ElementRef<HTMLElement>;

  private readonly memberProfileService = inject(MemberProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: MemberProfile | null = null;
  isLoading = true;
  isDownloading = false;

  ngOnInit(): void {
    this.memberProfileService.getProfile().pipe(take(1)).subscribe({
      next: (p) => { this.profile = p; this.isLoading = false; this.cdr.markForCheck(); },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); },
    });
  }

  get fullName(): string {
    return [this.profile?.title, this.profile?.firstName, this.profile?.lastName]
      .filter(v => !!v?.trim()).join(' ') || '—';
  }

  get memberId(): string {
    return this.profile?.loginId?.trim() || this.profile?.registrationNumber?.trim() || '—';
  }

  get sponsorId(): string {
    return this.profile?.introRegNo?.trim() || '—';
  }

  get sponsorDisplay(): string {
    const s = this.profile?.sponsorDetails;
    if (!s) return this.sponsorId;
    const name = [s.title, s.fName, s.lName].filter(v => !!v?.trim()).join(' ');
    const login = s.loginId?.trim();
    if (name && login) return `${name} (${login})`;
    return name || login || this.sponsorId;
  }

  get activationDate(): string {
    return this.profile?.registrationDate || '—';
  }

  get refNo(): string {
    const reg = this.profile?.registrationNumber?.trim();
    const id = this.profile?.id;
    const year = this.profile?.registrationDate
      ? new Date(this.profile.registrationDate).getFullYear()
      : new Date().getFullYear();
    const idPadded = id ? String(id).padStart(6, '0') : '000000';
    const intro = this.profile?.introRegNo?.trim();
    const introNum = intro ? intro.replace(/\D/g, '').padStart(5, '0') : '00000';
    const regPart = reg || '00000';
    return `${year}/${idPadded}/${introNum}/${regPart}`;
  }

  async downloadPdf(): Promise<void> {
    if (this.isDownloading) return;
    this.isDownloading = true;
    this.cdr.markForCheck();

    try {
      const el = this.letterSheet.nativeElement;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const imgW = canvas.width;
      const imgH = canvas.height;

      const ratio = pdfW / imgW;
      const totalHmm = imgH * ratio;

      if (totalHmm <= pdfH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, totalHmm);
      } else {
        const pageHpx = pdfH / ratio;
        let srcY = 0;
        let page = 0;

        while (srcY < imgH) {
          const cropH = Math.min(pageHpx, imgH - srcY);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgW;
          pageCanvas.height = cropH;
          const ctx = pageCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, srcY, imgW, cropH, 0, 0, imgW, cropH);

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.8);
          const pageHmm = cropH * ratio;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfW, pageHmm);

          srcY += pageHpx;
          page++;
        }
      }

      pdf.save(`Welcome_Letter_${this.memberId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch {
      window.print();
    } finally {
      this.isDownloading = false;
      this.cdr.markForCheck();
    }
  }
}
