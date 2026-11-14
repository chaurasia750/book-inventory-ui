import { ChangeDetectionStrategy, Component, inject, effect, untracked, signal, OnDestroy } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MemberDataService } from '@org/member-data-access';
import { IncomeOverviewService } from '@org/api-services';
import { TooltipDirective } from '../tooltip.directive';

@Component({
  selector: 'app-sidebar-profile-card',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-profile-card.component.html',
})
export class SidebarProfileCardComponent implements OnDestroy {
  readonly data = inject(MemberDataService);
  readonly incomeOverview = inject(IncomeOverviewService);
  readonly pendingImage = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

  private pendingFile: File | null = null;
  private uploadSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const id = this.data.memberId();
      if (id) {
        untracked(() => this.incomeOverview.load(id));
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageError.set(null);

    if (!input.files?.length) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.imageError.set('Only image files are allowed');
      input.value = '';
      return;
    }

    if (file.size > 500 * 1024) {
      this.imageError.set('Image must be under 500 KB');
      input.value = '';
      return;
    }

    this.pendingFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.pendingImage.set(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  confirmImage(): void {
    if (!this.pendingFile) return;
    const file = this.pendingFile;
    this.pendingImage.set(null);
    this.pendingFile = null;
    this.uploadSub?.unsubscribe();
    this.uploadSub = this.data.uploadProfileImage(file).subscribe();
  }

  cancelImage(): void {
    this.pendingImage.set(null);
    this.pendingFile = null;
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
  }
}
