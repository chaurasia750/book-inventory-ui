import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      return '';
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 0) {
      return 'just now';
    }

    const intervals: Array<[string, number]> = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1],
    ];

    for (const [unit, secondsInUnit] of intervals) {
      const count = Math.floor(seconds / secondsInUnit);
      if (count >= 1) {
        return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }
}
