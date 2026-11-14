import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastr = inject(ToastrService);

  show(message: string, type: ToastType = 'info'): void {
    switch (type) {
      case 'success':
        this.toastr.success(message);
        break;
      case 'error':
        this.toastr.error(message);
        break;
      case 'warning':
        this.toastr.warning(message);
        break;
      default:
        this.toastr.info(message);
        break;
    }
  }

  dismiss(id: number): void {
    this.toastr.remove(id);
  }
}
