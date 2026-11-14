import { AfterContentInit, ChangeDetectionStrategy, Component, contentChildren, effect, signal } from '@angular/core';
import { TabComponent } from './tab';

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements AfterContentInit {
  readonly tabs = contentChildren(TabComponent);

  readonly activeIndex = signal(0);

  constructor() {
    effect(() => {
      const tabs = this.tabs();
      const activeIndex = this.activeIndex();
      tabs.forEach((tab, index) => tab.setActive(index === activeIndex));
    });
  }

  ngAfterContentInit(): void {
    this.activeIndex.set(0);
  }

  selectTab(index: number): void {
    this.activeIndex.set(index);
  }
}
