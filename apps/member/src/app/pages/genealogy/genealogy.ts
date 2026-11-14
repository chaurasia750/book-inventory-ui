import { Component } from '@angular/core';
import { GenealogyTreeComponent } from '@org/ui';

@Component({
  selector: 'app-genealogy',
  standalone: true,
  imports: [GenealogyTreeComponent],
  template: `<app-genealogy-tree [rootMemberId]="'1'" />`,
})
export class GenealogyComponent {}
