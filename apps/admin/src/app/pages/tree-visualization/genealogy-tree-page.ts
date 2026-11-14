import { Component } from '@angular/core';
import { MlmTreeVisComponent } from '@org/ui';

/**
 * Was GenealogyTreeComponent, the pre-pool Neo4j-backed tree -- registration stopped writing to
 * Neo4j, so it rendered an empty tree for every root. This is the same pool-backed component the
 * member portal's tree and the admin Matrix/Matching pages already use; BinaryTreeController already
 * lets an admin caller root the view anywhere, defaulting to the pool's real root.
 */
@Component({
  selector: 'app-admin-genealogy-tree-page',
  standalone: true,
  imports: [MlmTreeVisComponent],
  template: `
    <div class="h-[calc(100vh-8rem)]">
      <app-mlm-tree-vis [embedded]="true" />
    </div>
  `,
})
export class AdminGenealogyTreePageComponent {}
