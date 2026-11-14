import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  private readonly units = ['B', 'KB', 'MB', 'GB', 'TB'];

  transform(value: number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }

    if (value === 0) {
      return '0 B';
    }

    const exponent = Math.min(
      Math.floor(Math.log(Math.abs(value)) / Math.log(1024)),
      this.units.length - 1
    );

    const size = value / Math.pow(1024, exponent);
    const formatted = exponent === 0 ? size.toString() : size.toFixed(decimals);

    return `${formatted} ${this.units[exponent]}`;
  }
}
