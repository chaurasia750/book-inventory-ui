import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type RemoteErrorType =
  | 'network'
  | 'bundle_mismatch'
  | 'timeout'
  | 'auth_error'
  | 'version_conflict'
  | 'runtime_error'
  | 'unknown';

export interface RemoteError {
  type: RemoteErrorType;
  remoteKey: string;
  originalError?: Error;
  recoverable: boolean;
  suggestedAction?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private readonly errors$ = new BehaviorSubject<RemoteError | null>(null);
  private readonly errorHistory: RemoteError[] = [];
  private readonly maxHistorySize = 100;

  handle(error: RemoteError): void {
    console.error('RemoteError:', error);
    this.errors$.next(error);
    this.addToHistory(error);
    this.logError(error);
  }

  showError(message: string, severity: 'error' | 'warning' | 'info' = 'error'): void {
    const error: RemoteError = {
      type: 'runtime_error',
      remoteKey: 'shell',
      recoverable: true,
      timestamp: Date.now(),
      context: { message, severity },
    };
    this.handle(error);
  }

  errors(): Observable<RemoteError | null> {
    return this.errors$.asObservable();
  }

  getHistory(): RemoteError[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory.length = 0;
  }

  private addToHistory(error: RemoteError): void {
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private logError(error: RemoteError): void {
    const timestamp = new Date(error.timestamp).toISOString();
    const message = `[${timestamp}] ${error.type} in ${error.remoteKey}: ${error.originalError?.message || 'Unknown error'}`;

    switch (error.type) {
      case 'network':
        console.error('Network Error:', message, error);
        break;
      case 'timeout':
        console.warn('Timeout Error:', message, error);
        break;
      case 'auth_error':
        console.error('Auth Error:', message, error);
        break;
      case 'runtime_error':
        console.error('Runtime Error:', message, error);
        break;
      default:
        console.log(message, error);
    }
  }
}
