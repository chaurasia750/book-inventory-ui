import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { EmptyStateComponent } from '@org/ui';
import { getPostBySlug } from '../../data/blog-posts.data';

@Component({
  selector: 'app-blog-details',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  templateUrl: './blog-details.html',
  styleUrl: './blog-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogDetailsComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: this.route.snapshot.paramMap.get('slug') },
  );

  readonly post = computed(() => {
    const slug = this.slug();
    return slug ? getPostBySlug(slug) : undefined;
  });
}
