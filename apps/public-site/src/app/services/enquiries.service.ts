import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@org/api-services';

export interface EnquiryRequest {
  name: string;
  phone: string;
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EnquiriesService {
  private readonly api = inject(ApiService);

  submitEnquiry(payload: EnquiryRequest): Observable<unknown> {
    return this.api.post('/enquiries', payload);
  }
}
