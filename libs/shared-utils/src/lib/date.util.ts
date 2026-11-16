export function formatDate(date: string | Date, format?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return new Intl.DateTimeFormat('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
  }

  if (format === 'time') {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];

  let value = seconds;
  let unit = 'second';

  for (const [amount, name] of intervals) {
    if (value < amount) {
      unit = name;
      break;
    }
    value = Math.floor(value / amount);
    unit = name;
  }

  if (value <= 0) {
    return 'just now';
  }

  return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

/**
 * The financial years (April-March, written `2026-27`) a screen offers in a drop-down instead of a free text box: next year, this
 * one and the previous four, newest first.
 */
export function financialYearOptions(today: Date = new Date(), previous = 4): string[] {
  const start = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return Array.from({ length: previous + 2 }, (_, i) => start + 1 - i).map((year) => `${year}-${String((year + 1) % 100).padStart(2, '0')}`);
}
