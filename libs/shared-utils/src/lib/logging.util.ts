import { Injectable } from '@angular/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: unknown;
}

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 500;
  private readonly isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  debug(message: string, context?: unknown): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.log('error', message, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private log(level: LogLevel, message: string, context?: unknown): void {
    const entry: LogEntry = { timestamp: new Date(), level, message, context };
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.isDevelopment) {
      this.logToConsole(level, message, context);
    }
  }

  private logToConsole(level: LogLevel, message: string, context?: unknown): void {
    const prefix = `[${level.toUpperCase()}]`;
    const timestamp = new Date().toISOString();

    switch (level) {
      case 'debug':
        console.debug(`${prefix} [${timestamp}] ${message}`, context);
        break;
      case 'info':
        console.info(`${prefix} [${timestamp}] ${message}`, context);
        break;
      case 'warn':
        console.warn(`${prefix} [${timestamp}] ${message}`, context);
        break;
      case 'error':
        console.error(`${prefix} [${timestamp}] ${message}`, context);
        break;
    }
  }
}
