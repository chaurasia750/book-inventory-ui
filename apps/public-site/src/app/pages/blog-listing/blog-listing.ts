import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '@org/ui';
import { BLOG_POSTS } from '../../data/blog-posts.data';

@Component({
  selector: 'app-blog-listing',
  standalone: true,
  imports: [RouterLink, CardComponent],
  templateUrl: './blog-listing.html',
  styleUrl: './blog-listing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListingComponent {
  readonly posts = BLOG_POSTS;
}
