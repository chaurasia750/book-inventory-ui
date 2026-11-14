import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { VideoService, VideoMaster, VideoCategory } from '../../services/video.service';

declare let YT: any;

@Component({
  selector: 'app-videos',
  standalone: true,
  template: `
    <div class="min-h-screen bg-white font-body">

      <section class="py-14 sm:py-20 lg:py-24 bg-brown-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span class="inline-block px-4 py-1.5 bg-saffron-500/10 text-saffron-500 text-sm sm:text-base font-semibold rounded-full mb-4 sm:mb-5">Our Video</span>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-brown-700 font-heading leading-tight">Watch &amp; Learn About Rudraksha</h1>
            <p class="mt-4 text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">Explore our video collection to learn more about the sacred power and benefits of genuine Rudraksha beads.</p>
          </div>

          @if (loading) {
            <div class="flex justify-center py-20">
              <div class="w-10 h-10 border-4 border-saffron-500/20 border-t-saffron-500 rounded-full animate-spin"></div>
            </div>
          } @else {
            <div class="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
              <button
                (click)="filterByCategory('all')"
                [class.bg-saffron-500]="selectedCategoryId === 'all'"
                [class.text-white]="selectedCategoryId === 'all'"
                [class.bg-white]="selectedCategoryId !== 'all'"
                [class.text-brown-700]="selectedCategoryId !== 'all'"
                [class.border-saffron-500]="selectedCategoryId === 'all'"
                class="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors cursor-pointer"
              >
                All
              </button>
              @for (cat of categories; track cat.id) {
                <button
                  (click)="filterByCategory(cat.id)"
                  [class.bg-saffron-500]="selectedCategoryId === cat.id"
                  [class.text-white]="selectedCategoryId === cat.id"
                  [class.bg-white]="selectedCategoryId !== cat.id"
                  [class.text-brown-700]="selectedCategoryId !== cat.id"
                  [class.border-saffron-500]="selectedCategoryId === cat.id"
                  class="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors cursor-pointer"
                >
                  {{ cat.categoryName }}
                </button>
              }
            </div>

            @if (filteredVideos.length === 0) {
              <div class="text-center py-20">
                <i class="fa fa-video-camera text-4xl text-gray-300 mb-4" aria-hidden="true"></i>
                <p class="text-gray-500 text-sm">No videos in this category yet.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                @for (video of filteredVideos; track video.id) {
                  <div class="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 bg-white flex flex-col hover:border-saffron-200">
                    <div class="relative bg-black cursor-pointer group" style="aspect-ratio: 16/9;" (mouseenter)="playVideo(video.containerId)" (mouseleave)="pauseVideo(video.containerId)">
                      <div class="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-opacity group-hover:opacity-0 pointer-events-none">
                        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <i class="fa fa-play text-base sm:text-lg text-brown-700 ml-0.5" aria-hidden="true"></i>
                        </div>
                      </div>
                      <div [id]="video.containerId" class="absolute inset-0 w-full h-full"></div>
                    </div>
                    <div class="p-4 sm:p-5 flex flex-col gap-2 flex-1">
                      <h3 class="text-base sm:text-lg lg:text-xl font-bold text-saffron-700 line-clamp-2 leading-tight">{{ video.title }}</h3>
                      @if (video.description) {
                        <p class="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">{{ video.description }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .font-heading { font-family: 'Red Hat Display', serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class VideosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly videoService = inject(VideoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  categories: VideoCategory[] = [];
  allVideos: (VideoMaster & { containerId: string })[] = [];
  filteredVideos: (VideoMaster & { containerId: string })[] = [];
  selectedCategoryId: number | 'all' = 'all';
  loading = true;

  private players = new Map<string, any>();
  private apiReady = false;
  private loadCalled = false;

  ngOnInit() {
    this.sub = forkJoin({
      categories: this.videoService.getCategories(),
      videos: this.videoService.getVideos(),
    }).subscribe({
      next: (res) => {
        this.categories = res.categories.filter(c => c.isActive);
        this.allVideos = res.videos
          .filter(v => v.isActive && v.youTubeEmbedUrl)
          .map(v => ({
            ...v,
            containerId: `yt-player-${v.id}`,
          }));
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
        if (this.apiReady) this.initPlayers();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  ngAfterViewInit() {
    this.loadYouTubeAPI();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.players.forEach(p => p.destroy());
    this.players.clear();
  }

  filterByCategory(categoryId: number | 'all') {
    this.selectedCategoryId = categoryId;
    this.applyFilter();
    this.cdr.markForCheck();
    this.initPlayers();
  }

  private applyFilter() {
    if (this.selectedCategoryId === 'all') {
      this.filteredVideos = [...this.allVideos];
    } else {
      this.filteredVideos = this.allVideos.filter(v => v.videoCategoryId === this.selectedCategoryId);
    }
  }

  private loadYouTubeAPI() {
    if ((window as any).YT?.Player) {
      this.apiReady = true;
      if (!this.loading) this.initPlayers();
      return;
    }
    if (this.loadCalled) return;
    this.loadCalled = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => {
      this.apiReady = true;
      if (!this.loading) this.initPlayers();
    };
  }

  private initPlayers() {
    setTimeout(() => {
      const currentIds = new Set(this.filteredVideos.map(v => v.containerId));

      this.players.forEach((p, id) => {
        if (!currentIds.has(id)) {
          p.destroy();
          this.players.delete(id);
        }
      });

      this.filteredVideos.forEach(v => {
        if (this.players.has(v.containerId)) return;
        const el = document.getElementById(v.containerId);
        if (!el) return;
        const id = this.extractVideoId(v.youTubeEmbedUrl);
        const player = new YT.Player(el, {
          videoId: id,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            mute: 1,
          },
        });
        this.players.set(v.containerId, player);
      });
    });
  }

  private extractVideoId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=))([^&?#]+)/);
    return match ? match[1] : url;
  }

  playVideo(containerId: string) {
    const player = this.players.get(containerId);
    if (player?.playVideo) player.playVideo();
  }

  pauseVideo(containerId: string) {
    const player = this.players.get(containerId);
    if (player?.pauseVideo) player.pauseVideo();
  }
}
