import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Platform P26 c: a money input shows the rupee symbol inside the field, at its left. Wrap the input: `<app-money-prefix><input ... /></app-money-prefix>`.
 * It fills the width of its place (like a block input); with `inline` it takes the width of the input (an input of a table cell).
 */
@Component({
  selector: 'app-money-prefix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': "inline() ? 'inline-block' : 'block'" },
  styles: [':host { position: relative; } :host ::ng-deep input { padding-left: 1.7rem; } .sym { position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #6b7280; font-size: 0.8rem; z-index: 1; }'],
  template: `<span class="sym" aria-hidden="true">₹</span><ng-content />`,
})
export class MoneyPrefixComponent {
  readonly inline = input(false);
}
