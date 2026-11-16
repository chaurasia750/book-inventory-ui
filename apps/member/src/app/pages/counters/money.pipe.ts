import { Pipe, PipeTransform } from '@angular/core';

const FORMAT = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Platform P26: an amount standing on its own is written with the rupee symbol, `₹ 1,23,456.00`, and a negative one as
 * `-₹ 1,200.00`. A table cell uses the `inr` pipe (the number only) and carries the symbol in its column heading.
 */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }
    return (value < 0 ? '-' : '') + '₹ ' + FORMAT.format(Math.abs(value));
  }
}
