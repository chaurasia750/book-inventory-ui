import { Pipe, PipeTransform } from '@angular/core';

const FORMAT = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Sales R50: the day summary shows its money totals in the Indian grouping (for example `1,23,456.78`). */
@Pipe({ name: 'inr', standalone: true })
export class IndianCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : FORMAT.format(value);
  }
}
