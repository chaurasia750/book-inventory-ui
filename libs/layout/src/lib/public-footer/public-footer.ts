import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './public-footer.html',
  styleUrl: './public-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicFooterComponent {
  get year(): number {
    return new Date().getFullYear();
  }
}
