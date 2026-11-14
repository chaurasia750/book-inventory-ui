export interface VideoCategory {
  id: number;
  categoryName: string;
  isActive: boolean;
  createdDate: string;
}

export interface CreateVideoCategoryPayload {
  categoryName: string;
}

export interface UpdateVideoCategoryPayload {
  categoryName: string;
  isActive: boolean;
}

export interface VideoMaster {
  id: number;
  videoCategoryId: number;
  categoryName: string;
  title: string;
  description: string;
  youTubeEmbedUrl: string;
  isActive: boolean;
  createdDate: string;
}

export interface CreateVideoMasterPayload {
  videoCategoryId: number;
  title: string;
  description: string;
  youTubeEmbedUrl: string;
}

export interface UpdateVideoMasterPayload {
  videoCategoryId: number;
  title: string;
  description: string;
  youTubeEmbedUrl: string;
  isActive: boolean;
}
