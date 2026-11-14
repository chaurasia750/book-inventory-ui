import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { LevelIncomeOverview } from '@org/api-services';

@Component({
  selector: 'app-income-chart',
  standalone: true,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './income-chart.component.html',
})
export class IncomeChartComponent {
  @Input() data: LevelIncomeOverview[] = [];

  private get maxIncome(): number {
    return Math.max(...this.data.map((d) => d.income), 1);
  }

  getBarWidth(income: number): number {
    return (income / this.maxIncome) * 100;
  }
}
