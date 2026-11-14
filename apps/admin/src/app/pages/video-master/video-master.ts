import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
  ButtonComponent,
  ConfirmationDialogComponent,
} from '@org/ui';
import { VideoCategoryService } from '../../services/video-category.service';
import { VideoMasterService } from '../../services/video-master.service';
import { VideoCategory, VideoMaster } from '../../models/video.model';

@Component({
  selector: 'app-video-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    ButtonComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './video-master.html',
})
export class VideoMasterComponent implements OnInit {
  private readonly categoryService = inject(VideoCategoryService);
  private readonly videoService = inject(VideoMasterService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  readonly breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Master Media' },
    { label: 'Videos' },
  ];

  // ── Category State ──
  readonly categories = signal<VideoCategory[]>([]);
  readonly categoryLoading = signal(false);
  readonly categorySaving = signal(false);
  readonly categoryPanelOpen = signal(false);
  readonly categoryIsEdit = signal(false);
  readonly categoryEditId = signal<number | null>(null);
  readonly categoryConfirmOpen = signal(false);
  readonly categoryDeleteId = signal<number | null>(null);
  readonly categoryDeleting = signal(false);

  readonly categoryForm = this.fb.group({
    categoryName: ['', Validators.required],
  });

  // ── Video State ──
  readonly videos = signal<VideoMaster[]>([]);
  readonly videoLoading = signal(false);
  readonly videoSaving = signal(false);
  readonly videoPanelOpen = signal(false);
  readonly videoIsEdit = signal(false);
  readonly videoEditId = signal<number | null>(null);
  readonly videoConfirmOpen = signal(false);
  readonly videoDeleteId = signal<number | null>(null);
  readonly videoDeleting = signal(false);
  filterCategoryId: number | null = null;

  readonly playingVideoId = signal<number | null>(null);

  readonly videoForm = this.fb.group({
    videoCategoryId: [null as number | null, Validators.required],
    title: ['', Validators.required],
    description: [''],
    youTubeEmbedUrl: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadVideos();
  }

  // ══════════════════════════════════════════
  //  CATEGORY CRUD
  // ══════════════════════════════════════════

  loadCategories(): void {
    this.categoryLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories.set(res);
        this.categoryLoading.set(false);
      },
      error: () => {
        this.categories.set([]);
        this.categoryLoading.set(false);
      },
    });
  }

  onCategoryAdd(): void {
    this.categoryIsEdit.set(false);
    this.categoryEditId.set(null);
    this.categoryForm.reset({ categoryName: '' });
    this.categoryPanelOpen.set(true);
  }

  onCategoryEdit(category: VideoCategory): void {
    this.categoryIsEdit.set(true);
    this.categoryEditId.set(category.id);
    this.categoryForm.patchValue({ categoryName: category.categoryName });
    this.categoryPanelOpen.set(true);
  }

  onCloseCategoryPanel(): void {
    this.categoryPanelOpen.set(false);
    this.categoryForm.reset();
  }

  onSaveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.categorySaving.set(true);
    const categoryName = this.categoryForm.getRawValue().categoryName!;
    const id = this.categoryEditId();

    const request$ = id
      ? this.categoryService.update(id, { categoryName, isActive: true })
      : this.categoryService.create({ categoryName });

    request$.subscribe({
      next: () => {
        this.categorySaving.set(false);
        this.onCloseCategoryPanel();
        this.loadCategories();
      },
      error: () => {
        this.categorySaving.set(false);
      },
    });
  }

  onDeleteCategory(id: number): void {
    this.categoryDeleteId.set(id);
    this.categoryConfirmOpen.set(true);
  }

  onConfirmDeleteCategory(): void {
    const id = this.categoryDeleteId();
    if (!id) return;
    this.categoryDeleting.set(true);
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.categoryDeleting.set(false);
        this.categoryConfirmOpen.set(false);
        this.categoryDeleteId.set(null);
        this.loadCategories();
      },
      error: () => {
        this.categoryDeleting.set(false);
      },
    });
  }

  onCancelDeleteCategory(): void {
    this.categoryConfirmOpen.set(false);
    this.categoryDeleteId.set(null);
  }

  // ══════════════════════════════════════════
  //  VIDEO CRUD
  // ══════════════════════════════════════════

  loadVideos(): void {
    this.videoLoading.set(true);
    this.videoService.getAll(this.filterCategoryId ?? undefined).subscribe({
      next: (res) => {
        this.videos.set(res);
        this.videoLoading.set(false);
        this.prebufferVideos(res);
      },
      error: () => {
        this.videos.set([]);
        this.videoLoading.set(false);
      },
    });
  }

  onFilterChange(value: string): void {
    this.filterCategoryId = value ? Number(value) : null;
    this.loadVideos();
  }

  onVideoAdd(): void {
    this.videoIsEdit.set(false);
    this.videoEditId.set(null);
    this.videoForm.reset({ videoCategoryId: null, title: '', description: '', youTubeEmbedUrl: '' });
    this.videoPanelOpen.set(true);
  }

  onVideoEdit(video: VideoMaster): void {
    this.videoIsEdit.set(true);
    this.videoEditId.set(video.id);
    this.videoForm.patchValue({
      videoCategoryId: video.videoCategoryId,
      title: video.title,
      description: video.description,
      youTubeEmbedUrl: video.youTubeEmbedUrl,
    });
    this.videoPanelOpen.set(true);
  }

  onCloseVideoPanel(): void {
    this.videoPanelOpen.set(false);
    this.videoForm.reset();
  }

  onSaveVideo(): void {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }
    this.videoSaving.set(true);
    const formValue = this.videoForm.getRawValue();
    const id = this.videoEditId();

    const request$ = id
      ? this.videoService.update(id, {
          videoCategoryId: formValue.videoCategoryId!,
          title: formValue.title!,
          description: formValue.description ?? '',
          youTubeEmbedUrl: formValue.youTubeEmbedUrl!,
          isActive: true,
        })
      : this.videoService.create({
          videoCategoryId: formValue.videoCategoryId!,
          title: formValue.title!,
          description: formValue.description ?? '',
          youTubeEmbedUrl: formValue.youTubeEmbedUrl!,
        });

    request$.subscribe({
      next: () => {
        this.videoSaving.set(false);
        this.onCloseVideoPanel();
        this.loadVideos();
      },
      error: () => {
        this.videoSaving.set(false);
      },
    });
  }

  onDeleteVideo(id: number): void {
    this.videoDeleteId.set(id);
    this.videoConfirmOpen.set(true);
  }

  onConfirmDeleteVideo(): void {
    const id = this.videoDeleteId();
    if (!id) return;
    this.videoDeleting.set(true);
    this.videoService.delete(id).subscribe({
      next: () => {
        this.videoDeleting.set(false);
        this.videoConfirmOpen.set(false);
        this.videoDeleteId.set(null);
        this.loadVideos();
      },
      error: () => {
        this.videoDeleting.set(false);
      },
    });
  }

  onCancelDeleteVideo(): void {
    this.videoConfirmOpen.set(false);
    this.videoDeleteId.set(null);
  }

  extractVideoId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=))([^&?#]+)/);
    return match ? match[1] : '';
  }

  getThumbnailUrl(url: string): string {
    const videoId = this.extractVideoId(url);
    if (!videoId) return '';
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }

  getEmbedUrl(url: string): SafeResourceUrl {
    const videoId = this.extractVideoId(url);
    if (!videoId) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&rel=0`
    );
  }

  playVideo(id: number): void {
    this.playingVideoId.set(id);
  }

  stopVideo(id: number): void {
    if (this.playingVideoId() === id) {
      this.playingVideoId.set(null);
    }
  }

  isPlaying(id: number): boolean {
    return this.playingVideoId() === id;
  }

  private prebufferVideos(videos: VideoMaster[]): void {
    videos.forEach((video) => {
      const thumbUrl = this.getThumbnailUrl(video.youTubeEmbedUrl);
      if (thumbUrl) {
        const img = new Image();
        img.src = thumbUrl;
      }
    });
  }
}
